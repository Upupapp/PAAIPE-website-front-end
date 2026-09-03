#!/usr/bin/env node
/**
 * Broken-internal-link and missing-asset check (Tab 15).
 *
 * Resolves every internal reference in the built output against the files that
 * actually exist, and every same-page fragment against the ids on that page.
 *
 * WHY IT READS THE BUILD AND NOT THE SOURCE
 * -----------------------------------------
 * A source scan sees `href={route.path}` and learns nothing. The built HTML
 * holds the resolved URL, which is what a visitor clicks.
 *
 * WHAT COUNTS AS RESOLVED
 * -----------------------
 * The preview server (and any static host) serves `/about` from
 * `dist/about/index.html`. So a link resolves if the exact file exists, OR
 * `<path>/index.html` does, OR `<path>.html` does - the same three candidates
 * `scripts/preview-server.mjs` tries. Encoding that here rather than assuming
 * one shape is what stops the gate disagreeing with the server it is meant to
 * model.
 *
 * Usage: node scripts/verify-links.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));

const failures = [];
const external = new Set();
let checkedLinks = 0;
let checkedAssets = 0;
let checkedFragments = 0;

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

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

/** The three candidates a static host tries, in order. */
async function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.replace(/^\//, '')) || 'index.html';
  const target = join(DIST, clean);
  if (await exists(target)) return true;
  if (await exists(join(target, 'index.html'))) return true;
  if (await exists(`${target}.html`)) return true;
  return false;
}

function attrsOf(html, tagName) {
  const out = [];
  for (const match of html.matchAll(new RegExp(`<${tagName}\\b([^>]*?)/?>`, 'gi'))) {
    const attrs = {};
    for (const attr of match[1].matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g)) {
      attrs[attr[1]] = attr[2];
    }
    out.push(attrs);
  }
  return out;
}

function idsIn(html) {
  const ids = new Set();
  for (const match of html.matchAll(/\sid="([^"]+)"/g)) ids.add(match[1]);
  for (const match of html.matchAll(/\sname="([^"]+)"/g)) ids.add(match[1]);
  return ids;
}

const isExternal = (url) => /^(https?:)?\/\//i.test(url);
const isNonNavigable = (url) => /^(mailto:|tel:|data:|blob:|javascript:)/i.test(url);

/** Resolve a possibly-relative URL against the page it appears on. */
function absolutise(url, fromPath) {
  if (url.startsWith('/')) return url;
  const base = fromPath === '/' ? '/' : `${fromPath}/`;
  return posix.normalize(posix.join(base, url));
}

let pages;
try {
  pages = await walk(DIST, (entry) => entry.endsWith('.html'));
} catch {
  console.error('FAIL  dist/ does not exist. Run a build first.');
  process.exit(1);
}
if (pages.length < 10) {
  console.error(
    `FAIL  dist/ has only ${pages.length} HTML pages. A link scan of an almost-empty build is not a pass.`,
  );
  process.exit(1);
}

for (const file of pages) {
  const path = servedPath(file);
  const html = await readFile(file, 'utf8');
  const ids = idsIn(html);

  for (const anchor of attrsOf(html, 'a')) {
    const href = anchor.href;
    if (href === undefined) {
      failures.push(`${path}: <a> with no href`);
      continue;
    }
    if (href.trim() === '' || href === '#') {
      failures.push(`${path}: <a href="${href}"> is a dead link`);
      continue;
    }
    if (isExternal(href)) {
      external.add(href);
      continue;
    }
    if (isNonNavigable(href)) continue;

    if (href.startsWith('#')) {
      checkedFragments += 1;
      const id = decodeURIComponent(href.slice(1));
      if (!ids.has(id)) failures.push(`${path}: fragment ${href} has no matching id on this page`);
      continue;
    }

    const [target, fragment] = absolutise(href, path).split('#');
    checkedLinks += 1;
    if (!(await resolves(target))) {
      failures.push(`${path}: link to ${href} does not resolve to a built page`);
      continue;
    }
    if (fragment) {
      // A cross-page fragment must exist on the page it points AT.
      const targetFile =
        pages.find((candidate) => servedPath(candidate) === (target.replace(/\/$/, '') || '/')) ??
        null;
      if (targetFile) {
        checkedFragments += 1;
        const targetIds = idsIn(await readFile(targetFile, 'utf8'));
        if (!targetIds.has(decodeURIComponent(fragment))) {
          failures.push(
            `${path}: link to ${href} points at an id that does not exist on ${target}`,
          );
        }
      }
    }
  }

  // Assets: images, picture sources, scripts, stylesheets, icons, manifest.
  const assets = [
    ...attrsOf(html, 'img').map((tag) => tag.src),
    ...attrsOf(html, 'source').map((tag) => (tag.srcset ?? '').split(/\s|,/)[0]),
    ...attrsOf(html, 'script').map((tag) => tag.src),
    ...attrsOf(html, 'link').map((tag) => tag.href),
  ].filter((url) => url && !isExternal(url) && !isNonNavigable(url));

  for (const asset of assets) {
    checkedAssets += 1;
    const [target] = absolutise(asset, path).split('#');
    if (!(await resolves(target))) {
      failures.push(`${path}: asset ${asset} is not in the build`);
    }
  }
}

/* robots.txt and the sitemap are references too. */
try {
  const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
  const sitemapLine = robots.match(/^Sitemap:\s*(\S+)$/m);
  if (sitemapLine) {
    const path = new URL(sitemapLine[1]).pathname;
    checkedLinks += 1;
    if (!(await resolves(path))) {
      failures.push(`robots.txt: points at ${sitemapLine[1]}, which is not in the build`);
    }
  }
} catch {
  failures.push('robots.txt: missing from the build');
}

console.log(
  `Link and asset integrity - ${pages.length} pages, ${checkedLinks} internal links, ` +
    `${checkedFragments} fragments, ${checkedAssets} assets`,
);
console.log(
  external.size === 0
    ? '  external links: none (no destination is configured - owner item B-4)'
    : `  external links: ${external.size}, NOT fetched (a gate must not depend on the network)`,
);
for (const url of [...external].sort()) console.log(`    ${url}`);

if (failures.length > 0) {
  console.error(`\nLINK CHECK FAILED - ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS');
