#!/usr/bin/env node
/**
 * Measure the built site against the Tab 14 performance budgets.
 *
 * The master command says to track budgets in CI. This repository has a
 * standing no-CI-workflows rule, so the budgets are tracked HERE and this gate
 * runs inside `npm run check` - the same gate, run before a push instead of
 * after one. `docs/performance-report.md` records that substitution explicitly
 * so nobody reads the missing workflow as a missing budget.
 *
 * WHAT IT MEASURES, AND WHAT IT CANNOT
 * ------------------------------------
 * It measures BYTES: gzip transfer for text, raw bytes for already-compressed
 * images, per page, from the actual build. Those numbers are exact.
 *
 * It does NOT measure LCP, INP, CLS or a Lighthouse score. Those need a
 * rendered page on real hardware over a real network, and a number produced on
 * this machine would not be the number a visitor in the Philippines gets on a
 * mid-range Android phone. The report says so rather than printing a lab figure
 * as if it were field data.
 *
 * Usage: node --import tsx scripts/verify-budgets.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { BUDGETS, BUDGET_EXCEPTIONS, budget } from '../src/config/budgets.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST = join(ROOT, 'dist');

const FONT_EXT = new Set(['.woff2', '.woff', '.ttf', '.otf', '.eot']);

const failures = [];
const rows = [];
function fail(message) {
  failures.push(message);
}

function kib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

async function walk(dir, predicate) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full, predicate)));
    else if (predicate(entry)) out.push(full);
  }
  return out;
}

function servedPath(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404';
  return `/${rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
}

async function sizeOf(distPath) {
  try {
    const bytes = await readFile(join(DIST, distPath.replace(/^\//, '')));
    return { raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
  } catch {
    return null;
  }
}

/* ------------------------------------------------ what each page references */

function tagAttrs(html, tagName) {
  const out = [];
  for (const match of html.matchAll(new RegExp(`<${tagName}\\b([^>]*?)/?>`, 'gi'))) {
    const attrs = {};
    for (const attr of match[1].matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g)) {
      attrs[attr[1]] = attr[2];
    }
    // Valueless attributes matter here: `loading` without `="lazy"` is not the
    // same as absent, and `alt` with no value is a deliberate empty alt.
    for (const attr of match[1].matchAll(/(?:^|\s)([a-zA-Z-]+)(?=\s|$)/g)) {
      if (!(attr[1] in attrs)) attrs[attr[1]] = '';
    }
    out.push(attrs);
  }
  return out;
}

/**
 * Follow a chunk's own imports.
 *
 * A page's `<script src>` is only the ENTRY. Vite splits shared code into
 * further chunks that the entry imports, and those bytes are just as much part
 * of the route's JavaScript. Counting only what the HTML names understates
 * route JS and - worse - makes a legitimately-shared chunk look orphaned. This
 * walks the graph, so `tokens.*.js` is counted once per page that reaches it
 * and never reported as dead.
 */
async function resolveChunkGraph(entry, seen) {
  if (seen.has(entry)) return 0;
  seen.add(entry);
  let bytes = 0;
  const size = await sizeOf(entry);
  if (!size) return 0;
  bytes += size.gzip;
  const source = await readFile(join(DIST, entry.replace(/^\//, '')), 'utf8').catch(() => '');
  const specifiers = [
    ...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g),
    ...source.matchAll(/import\s*["']([^"']+)["']/g),
  ].map((match) => match[1]);
  for (const specifier of specifiers) {
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
    const resolved = specifier.startsWith('/')
      ? specifier
      : `/${join(entry, '..', specifier).replace(/^\/+/, '').split(sep).join('/')}`;
    // A local import that resolves to nothing is a BROKEN page, not a free one.
    // Silently returning 0 here is how an over-eager prune of a live chunk
    // passed this gate: every script on the site failed to load, and the
    // measured route JS went DOWN, which read as an improvement.
    if ((await sizeOf(resolved)) === null) {
      fail(`${entry} imports ${specifier}, which is not in the build - the module will not load`);
      continue;
    }
    bytes += await resolveChunkGraph(resolved, seen);
  }
  return bytes;
}

/** Site-local references only. An external URL is reported separately. */
function localRefs(html) {
  const scripts = tagAttrs(html, 'script')
    .map((tag) => tag.src)
    .filter(Boolean);
  const styles = tagAttrs(html, 'link')
    .filter((tag) => (tag.rel ?? '').split(/\s+/).includes('stylesheet'))
    .map((tag) => tag.href)
    .filter(Boolean);
  const preloads = tagAttrs(html, 'link')
    .filter((tag) => (tag.rel ?? '').split(/\s+/).includes('preload'))
    .map((tag) => tag.href)
    .filter(Boolean);
  const images = tagAttrs(html, 'img');
  return { scripts, styles, preloads, images };
}

function isExternal(url) {
  return /^(https?:)?\/\//i.test(url);
}

/* ------------------------------------------------------------ measurements */

async function measurePage(path, html) {
  const refs = localRefs(html);
  const htmlGzip = gzipSync(Buffer.from(html), { level: 9 }).length;

  let js = 0;
  const referenced = new Set();
  const chunkSeen = new Set();
  for (const src of refs.scripts) {
    if (isExternal(src)) {
      fail(`${path}: loads an external script (${src}). No third-party script is approved.`);
      continue;
    }
    if ((await sizeOf(src)) === null) {
      fail(`${path}: references ${src}, which is not in the build`);
      continue;
    }
    js += await resolveChunkGraph(src, chunkSeen);
  }
  for (const chunk of chunkSeen) referenced.add(chunk);

  // Inline module scripts count toward route JS: they are shipped bytes that
  // the browser must parse before the page is interactive. The inline
  // preference script in BaseLayout is deliberately tiny and is counted.
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/type="application\/ld\+json"/i.test(match[1])) continue;
    js += gzipSync(Buffer.from(match[2]), { level: 9 }).length;
  }

  let css = 0;
  for (const href of refs.styles) {
    if (isExternal(href)) {
      fail(`${path}: loads an external stylesheet (${href}). Fonts and CSS must be self-hosted.`);
      continue;
    }
    const size = await sizeOf(href);
    if (!size) {
      fail(`${path}: references ${href}, which is not in the build`);
      continue;
    }
    referenced.add(href);
    css += size.gzip;
  }

  let fonts = 0;
  for (const href of refs.preloads) {
    if (!FONT_EXT.has(extname(href))) continue;
    const size = await sizeOf(href);
    if (size) {
      fonts += size.raw;
      referenced.add(href);
    }
  }

  /*
   * <picture><source> alternatives.
   *
   * The budget is measured against the <img> FALLBACK, which is the largest of
   * the alternatives and what a browser without WebP downloads. That is the
   * conservative reading; the saving a modern browser actually gets is reported
   * separately, so the two are never confused - a budget met only by the
   * best-case format is not met.
   *
   * The pairing has to be PER <picture>. Summing every <source> on the page and
   * comparing it to the eager <img> bytes made the saving come out NEGATIVE:
   * the footer lockup contributes a source but, being lazy, contributes no
   * fallback bytes. A cross-element comparison is not a comparison.
   */
  let alternativeSaving = 0;
  for (const block of html.matchAll(/<picture\b[^>]*>([\s\S]*?)<\/picture>/gi)) {
    const inner = block[1];
    const img = tagAttrs(inner, 'img')[0];
    if (!img?.src || isExternal(img.src)) continue;
    if ((img.loading ?? '') === 'lazy') continue; // costs nothing up front either way
    const fallback = await sizeOf(img.src);
    if (!fallback) continue;
    let best = fallback.raw;
    for (const source of tagAttrs(inner, 'source')) {
      const src = (source.srcset ?? '').split(/\s|,/)[0];
      if (!src || isExternal(src)) continue;
      const size = await sizeOf(src);
      if (!size) {
        fail(`${path}: <source srcset="${src}"> is not in the build`);
        continue;
      }
      if (size.raw < best) best = size.raw;
    }
    alternativeSaving += fallback.raw - best;
  }

  let eagerImages = 0;
  let largestImage = 0;
  let priorityCount = 0;
  for (const img of refs.images) {
    const src = img.src ?? '';
    if (!src) {
      fail(`${path}: an <img> has no src`);
      continue;
    }
    if (isExternal(src)) {
      fail(`${path}: loads an external image (${src})`);
      continue;
    }
    if (img.width === undefined || img.height === undefined) {
      fail(`${path}: <img src="${src}"> has no width/height, so it can shift layout (CLS)`);
    }
    const size = await sizeOf(src);
    if (!size) {
      fail(`${path}: references image ${src}, which is not in the build`);
      continue;
    }
    referenced.add(src);
    if (size.raw > largestImage) largestImage = size.raw;

    const lazy = (img.loading ?? '') === 'lazy';
    const priority = (img.fetchpriority ?? '') === 'high';
    if (priority) {
      priorityCount += 1;
      if (lazy) {
        fail(
          `${path}: <img src="${src}"> is fetchpriority="high" AND loading="lazy". The LCP candidate must not be lazy-loaded.`,
        );
      }
    }
    if (!lazy) eagerImages += size.raw;
  }
  if (priorityCount > 1) {
    fail(
      `${path}: ${priorityCount} images claim fetchpriority="high". Prioritise only the real LCP candidate.`,
    );
  }

  // Third-party and tracking surfaces. None is approved.
  for (const tag of tagAttrs(html, 'iframe')) {
    fail(
      `${path}: contains an <iframe src="${tag.src ?? ''}">. No embedded third party is approved.`,
    );
  }
  for (const tag of tagAttrs(html, 'video')) {
    if ('autoplay' in tag) fail(`${path}: contains an autoplaying <video>`);
  }
  for (const match of html.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const host = match[1].toLowerCase();
    if (
      /(google-analytics|googletagmanager|facebook\.net|doubleclick|hotjar|segment|mixpanel|clarity\.ms|plausible|matomo)/.test(
        host,
      )
    ) {
      fail(`${path}: references ${host}, which is an analytics or advertising endpoint`);
    }
  }

  const initial = htmlGzip + js + css + fonts + eagerImages;

  return {
    path,
    htmlGzip,
    js,
    css,
    fonts,
    largestImage,
    eagerImages,
    initial,
    saved: alternativeSaving,
    referenced,
  };
}

/** The motion layer, bundled on its own so its share can be measured. */
async function measureMotionJs() {
  const result = await esbuild({
    entryPoints: [join(ROOT, 'src/scripts/motion.ts')],
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    logLevel: 'silent',
  });
  const bytes = Buffer.concat(result.outputFiles.map((file) => Buffer.from(file.contents)));
  return gzipSync(bytes, { level: 9 }).length;
}

/* ------------------------------------------------------------------- main */

let pages;
try {
  pages = await walk(DIST, (entry) => entry.endsWith('.html'));
} catch {
  console.error('FAIL  dist/ does not exist. Run a build first.');
  process.exit(1);
}
if (pages.length < 10) {
  console.error(
    `FAIL  dist/ has only ${pages.length} HTML pages. A budget scan of an almost-empty build is not a pass.`,
  );
  process.exit(1);
}

const measured = [];
const referencedAssets = new Set();
for (const page of pages) {
  const result = await measurePage(servedPath(page), await readFile(page, 'utf8'));
  measured.push(result);
  for (const ref of result.referenced) referencedAssets.add(ref);
}

const motionJs = await measureMotionJs();

/* --- exceptions must be complete and unexpired */
for (const exception of BUDGET_EXCEPTIONS) {
  if (!exception.owner || !exception.reason || !exception.expires) {
    fail(`budget exception for "${exception.key}" is missing an owner, a reason or an expiry`);
  } else if (new Date(exception.expires) < new Date()) {
    fail(`budget exception for "${exception.key}" expired on ${exception.expires}`);
  }
}
const excepted = new Set(BUDGET_EXCEPTIONS.map((exception) => exception.key));

function assertBudget(key, actual, where) {
  const spec = budget(key);
  if (actual > spec.limitBytes && !excepted.has(key)) {
    fail(`${where}: ${spec.label} is ${kib(actual)}, over the ${kib(spec.limitBytes)} budget`);
  }
}

for (const page of measured) {
  assertBudget('route-js', page.js, page.path);
  assertBudget('css', page.css, page.path);
  assertBudget('fonts', page.fonts, page.path);
  assertBudget('lcp-image', page.largestImage, page.path);
  assertBudget('initial-transfer', page.initial, page.path);
  rows.push(page);
}
assertBudget('motion-js', motionJs, 'src/scripts/motion.ts');

/* --- orphaned build chunks
 *
 * A chunk no page references is dead transfer at best. It also discloses
 * something: `getStaticPaths` returning [] for the internal style guide stops
 * the PAGE being built, but Vite still emitted its CSS chunk, whose filename
 * named the route. `scripts/prune-orphan-assets.mjs` removes those after the
 * build; this asserts the pruning actually happened.
 */
const chunks = await walk(join(DIST, '_astro'), () => true).catch(() => []);
for (const chunk of chunks) {
  const url = `/${relative(DIST, chunk).split(sep).join('/')}`;
  if (!referencedAssets.has(url)) {
    fail(`${url} is in the build but no page references it (${kib((await stat(chunk)).size)})`);
  }
}

/* ------------------------------------------------------------------ report */

const widest = Math.max(...rows.map((row) => row.path.length));
console.log('Performance budgets - measured from the build (gzip for text, raw for images)\n');
console.log(
  `  ${'route'.padEnd(widest)}  ${'html'.padStart(9)} ${'js'.padStart(9)} ${'css'.padStart(9)} ${'img'.padStart(9)} ${'initial'.padStart(10)}`,
);
for (const row of rows.sort((a, b) => b.initial - a.initial)) {
  console.log(
    `  ${row.path.padEnd(widest)}  ${kib(row.htmlGzip).padStart(9)} ${kib(row.js).padStart(9)} ${kib(row.css).padStart(9)} ${kib(row.eagerImages).padStart(9)} ${kib(row.initial).padStart(10)}`,
  );
}
console.log('');
for (const spec of BUDGETS) {
  const worst =
    spec.key === 'motion-js'
      ? motionJs
      : Math.max(
          ...rows.map((row) =>
            spec.key === 'route-js'
              ? row.js
              : spec.key === 'css'
                ? row.css
                : spec.key === 'fonts'
                  ? row.fonts
                  : spec.key === 'lcp-image'
                    ? row.largestImage
                    : row.initial,
          ),
        );
  const headroom = ((1 - worst / spec.limitBytes) * 100).toFixed(0);
  console.log(
    `  ${spec.key.padEnd(18)} worst ${kib(worst).padStart(9)}  of ${kib(spec.limitBytes).padStart(9)}  (${headroom}% headroom)`,
  );
}
const worstSaved = Math.max(...rows.map((row) => row.saved));
if (worstSaved > 0) {
  console.log(
    `\n  Images are budgeted against the PNG fallback. A browser with WebP support\n` +
      `  downloads up to ${kib(worstSaved)} less per page than the figures above.`,
  );
}
console.log(
  '\n  Not measured here: LCP, INP, CLS and Lighthouse scores. Those need a rendered\n' +
    '  page on real hardware over a real network - see docs/performance-report.md.',
);

if (failures.length > 0) {
  console.error(`\nBUDGETS FAILED - ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS');
