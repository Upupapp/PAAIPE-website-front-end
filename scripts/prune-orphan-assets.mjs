#!/usr/bin/env node
/**
 * Remove build chunks that no built page references.
 *
 * WHY THIS EXISTS
 * ---------------
 * F-12 excludes the internal style guide from the production build by having
 * its `getStaticPaths` return no paths. That stops the PAGE being emitted - but
 * Vite still processed the module, so it emitted the page's CSS chunk, named
 * `_guide_.<hash>.css`. The result was 4.9 KiB of dead transfer in every
 * production build whose FILENAME announced the existence of a route that was
 * deliberately excluded. Not a secret, but not something to publish either.
 *
 * SCOPE IS DELIBERATELY NARROW
 * ----------------------------
 * Only files under `dist/_astro/` are considered, and only those unreachable
 * from any page's `<script src>`/`<link href>` graph. Everything else in
 * `dist/` is left alone, because plenty of it is legitimately unreferenced by
 * HTML: `robots.txt`, `manifest.webmanifest`, the manifest's icon files, and
 * the social card - whose only reference is an `og:image` URL that does not
 * exist at all while PUBLIC_SITE_URL is unset. A "delete anything unreferenced"
 * rule would delete the branded social card.
 *
 * `scripts/verify-budgets.mjs` fails if any orphan survives, so this is a fix
 * with a gate behind it rather than a cleanup nobody would notice skipping.
 *
 * Usage: node scripts/prune-orphan-assets.mjs [--dry-run]
 */
import { readdir, readFile, rm, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const ASTRO = join(DIST, '_astro');

async function walk(dir, predicate = () => true) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full, predicate)));
    else if (predicate(entry)) out.push(full);
  }
  return out;
}

const url = (file) => `/${relative(DIST, file).split(sep).join('/')}`;

/**
 * Every asset this file points at, as an absolute `/_astro/...` path.
 *
 * TWO FORMS, AND THE FIRST VERSION OF THIS FUNCTION ONLY HANDLED ONE.
 * HTML names chunks absolutely (`src="/_astro/x.js"`), but a chunk imports its
 * siblings RELATIVELY (`import{n}from"./tokens.ByRuCsOI.js"`). Matching only
 * the absolute form made every shared chunk look unreachable: this script
 * deleted `tokens.<hash>.js`, which BaseLayout's script imports, and the site
 * shipped with no working shell, motion, preferences or copy-link at all.
 * The budgets gate passed anyway - its own resolver treated a missing import as
 * zero bytes - so nothing objected. Both bugs are fixed; both are now asserted.
 */
function astroRefs(text, fromDir) {
  const absolute = [...text.matchAll(/\/_astro\/[A-Za-z0-9._-]+/g)].map((match) => match[0]);
  const relative = [...text.matchAll(/["'](\.\.?\/[A-Za-z0-9._/-]+)["']/g)].map(
    (match) => `/${join(fromDir, match[1]).split(sep).join('/')}`,
  );
  return [...absolute, ...relative];
}

/** The dist-relative directory a reference inside `path` resolves against. */
const dirOf = (path) => relative(DIST, join(DIST, path.replace(/^\//, ''), '..'));

let pages;
try {
  pages = await walk(DIST, (entry) => entry.endsWith('.html'));
} catch {
  console.error('FAIL  dist/ does not exist. Run a build first.');
  process.exit(1);
}
if (pages.length === 0) {
  console.error('FAIL  dist/ contains no HTML pages. Pruning nothing is not a success.');
  process.exit(1);
}

let chunks;
try {
  chunks = await walk(ASTRO);
} catch {
  console.log('SKIP  no dist/_astro/ directory - nothing to prune.');
  process.exit(0);
}

// Reachability: start from what the pages name, then follow chunk-to-chunk
// references until the set stops growing. A shared chunk is reached through the
// entry that imports it, never directly from the HTML.
const reachable = new Set();
const queue = [];
for (const page of pages) {
  for (const ref of astroRefs(await readFile(page, 'utf8'), relative(DIST, join(page, '..')))) {
    if (!reachable.has(ref)) {
      reachable.add(ref);
      queue.push(ref);
    }
  }
}
while (queue.length > 0) {
  const current = queue.pop();
  const text = await readFile(join(DIST, current.replace(/^\//, '')), 'utf8').catch(() => '');
  for (const ref of astroRefs(text, dirOf(current))) {
    if (!reachable.has(ref)) {
      reachable.add(ref);
      queue.push(ref);
    }
  }
}

const dryRun = process.argv.includes('--dry-run');
let removed = 0;
let bytes = 0;
for (const chunk of chunks) {
  const path = url(chunk);
  if (reachable.has(path)) continue;
  const { size } = await stat(chunk);
  removed += 1;
  bytes += size;
  console.log(`${dryRun ? 'WOULD PRUNE' : 'PRUNED     '} ${path}  ${(size / 1024).toFixed(1)} KiB`);
  if (!dryRun) await rm(chunk);
}

console.log(
  removed === 0
    ? `OK    ${chunks.length} chunks, all reachable from a built page.`
    : `${dryRun ? 'DRY   ' : 'DONE  '}${removed} orphan(s), ${(bytes / 1024).toFixed(1)} KiB, of ${chunks.length} chunks.`,
);
