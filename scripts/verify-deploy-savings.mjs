#!/usr/bin/env node
/**
 * Prove the Netlify build-skip allow-list is still safe.
 *
 * `scripts/netlify-ignore.mjs` cancels a build when every changed path is on an
 * allow-list of paths that "cannot affect `dist/`". That claim is the only
 * thing standing between a cost saving and a fix that silently never ships.
 *
 * So it is PROVEN, not asserted: append a byte to a real committed file of
 * every skipped kind, rebuild, and compare the hash of the whole output tree.
 * If any of them ever starts affecting the build, this fails here rather than
 * costing someone a missed deploy months later.
 *
 * It also checks the parts of `netlify.toml` that carry the saving, because a
 * cost control that gets edited out is worse than one that was never there:
 * nobody notices the bill until it arrives.
 *
 * Usage: node scripts/verify-deploy-savings.mjs
 */
import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILD_IRRELEVANT, isBuildIrrelevant } from './netlify-ignore.mjs';
import { stripComments } from '../src/lib/strip-comments.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const DIST = join(ROOT, 'dist');

const failures = [];
const fail = (message) => failures.push(message);

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter((line) => line.length > 0);

/* ------------------------------------ 1. a representative file per pattern */

/**
 * One real, committed file for each allow-list pattern.
 *
 * A pattern with no committed file is reported rather than silently skipped:
 * an allow-list entry that matches nothing is either dead or a typo, and both
 * are worth knowing about. This is the "an allow-list fails by forgetting"
 * shape — it cannot fail loudly on its own, so it is made to.
 */
const samples = [];
for (const pattern of BUILD_IRRELEVANT) {
  const file = tracked.find((path) => pattern.test(path));
  if (!file) {
    fail(`allow-list pattern ${pattern} matches no committed file — it is dead or misspelt`);
    continue;
  }
  samples.push({ pattern, file });
}

if (samples.length === 0) {
  console.error('FAIL  no allow-list pattern matched any committed file.');
  process.exit(1);
}

/* ------------------------------------------- 2. hash the whole output tree */

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

async function hashDist() {
  const files = (await walk(DIST)).sort();
  if (files.length < 20) {
    // A hash of an almost-empty tree would match another almost-empty tree.
    throw new Error(
      `dist/ has only ${files.length} files; a comparison of nothing is not a proof.`,
    );
  }
  const digest = createHash('sha256');
  for (const file of files) {
    digest.update(relative(DIST, file).split(sep).join('/'));
    digest.update(await readFile(file));
  }
  return { hash: digest.digest('hex'), count: files.length };
}

function build() {
  execSync('npm run build', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
}

console.log('Proving the build-skip allow-list...\n');
build();
const before = await hashDist();
console.log(`  baseline  ${before.count} files  ${before.hash.slice(0, 16)}…`);

/* ------------------------------- 3. modify one file of every skipped kind */

const originals = new Map();
for (const { file } of samples) {
  const path = join(ROOT, file);
  originals.set(path, readFileSync(path));
}

try {
  for (const { file } of samples) {
    // A trailing newline is the smallest change that is still a change, and it
    // is harmless in every file type on the list.
    appendFileSync(join(ROOT, file), '\n');
  }
  // Assert the plant landed. A no-op modification reads exactly like a pass.
  for (const [path, original] of originals) {
    if (readFileSync(path).length === original.length) {
      fail(`the modification to ${relative(ROOT, path)} did not apply — this proves nothing`);
    }
  }

  build();
  const after = await hashDist();
  console.log(`  modified  ${after.count} files  ${after.hash.slice(0, 16)}…`);

  if (after.hash !== before.hash) {
    fail(
      'dist/ CHANGED after editing only allow-listed paths. One of them affects the build, ' +
        'and the Netlify skip would drop a real deploy. Remove it from BUILD_IRRELEVANT.',
    );
  }
} finally {
  // Restore from the in-memory copy, never with `git checkout`: a git checkout
  // in a shared tree has already destroyed a peer's uncommitted work in this
  // project, and it would also revert changes this run did not make.
  for (const [path, original] of originals) writeFileSync(path, original);
}

/* ------------------------- 4. the IMPORT GRAPH, because bytes are not enough */

/*
 * The double-build above proves that appending a newline to these files leaves
 * `dist/` byte-identical. That is necessary and NOT sufficient.
 *
 * A trailing newline in a TypeScript file changes nothing in the output even
 * when the build imports that file - the change is dead code. So the byte proof
 * would happily accept `src/content/` being added to the allow-list, and a
 * content edit would then never deploy.
 *
 * This closes it structurally: walk the import graph from every page and from
 * `astro.config.mjs`, and assert nothing it reaches is on the allow-list. If a
 * skipped path is imported by anything the build compiles, it is not skippable,
 * whatever a newline does.
 */
const IMPORT_PATTERN = /(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
const RESOLVE_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.mjs', '.astro', '/index.ts', '/index.js'];

function resolveImport(specifier, fromFile) {
  if (!specifier.startsWith('.')) return null; // a bare package, not our source
  const base = join(ROOT, relative(ROOT, join(fromFile, '..', specifier)));
  for (const extension of RESOLVE_EXTENSIONS) {
    const candidate = `${base}${extension}`;
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      /* try the next extension */
    }
  }
  return null;
}

const graphRoots = [
  join(ROOT, 'astro.config.mjs'),
  ...tracked.filter((path) => path.startsWith('src/pages/')).map((path) => join(ROOT, path)),
];

const reached = new Set();
const queue = [...graphRoots];
while (queue.length > 0) {
  const file = queue.pop();
  if (reached.has(file)) continue;
  reached.add(file);
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  // Strip comments so a path NAMED in a comment is not read as an import. Half
  // the source files here mention `src/tests/...` in prose.
  const code = stripComments(source);
  for (const match of code.matchAll(IMPORT_PATTERN)) {
    const resolved = resolveImport(match[1], file);
    if (resolved) queue.push(resolved);
  }
}

if (reached.size < 40) {
  fail(`the import graph reached only ${reached.size} files; a scan of nothing proves nothing`);
}

/*
 * Collected, not just counted, so the report below can state what was actually
 * found. It previously printed "none on the allow-list" unconditionally, which
 * meant a failing run said "none on the allow-list" three lines above a failure
 * naming the file that was on it. A headline that contradicts its own table is
 * the half a reader believes.
 */
const reachedButAllowListed = [];

for (const file of reached) {
  const path = relative(ROOT, file).split(sep).join('/');
  if (isBuildIrrelevant(path)) {
    reachedButAllowListed.push(path);
    fail(
      `${path} is on the build-skip allow-list, but the build IMPORTS it. ` +
        `Skipping a commit that touches it would drop a real deploy.`,
    );
  }
}

/* ------------------------------------------ 5. the config still saves money */

const CONFIG = join(ROOT, 'netlify.toml');
let toml = '';
try {
  toml = await readFile(CONFIG, 'utf8');
} catch {
  fail('netlify.toml is missing — the deployment cost controls live in it');
}

const REQUIRED_CONTROLS = [
  {
    name: 'the build-skip hook',
    test: /^\s*ignore\s*=\s*"node scripts\/netlify-ignore\.mjs"/m,
    why: 'without it every documentation commit costs a full build',
  },
  {
    name: 'deploy previews suppressed',
    test: /\[context\.deploy-preview\][\s\S]{0,200}?ignore\s*=\s*"exit 0"/,
    why: 'a preview build costs the same minutes as production',
  },
  {
    name: 'branch deploys suppressed',
    test: /\[context\.branch-deploy\][\s\S]{0,200}?ignore\s*=\s*"exit 0"/,
    why: 'every pushed branch would otherwise build',
  },
  {
    name: 'immutable caching for hashed assets',
    test: /max-age=31536000, immutable/,
    why: 'without it every visit re-downloads the same bytes and bills bandwidth',
  },
  {
    name: 'the minimal build command',
    test: /^\s*command\s*=\s*"npm run build"/m,
    why: 'the full gate suite must never run on billed build minutes',
  },
];

let controlsPresent = 0;
for (const control of REQUIRED_CONTROLS) {
  if (control.test.test(toml)) controlsPresent += 1;
  else fail(`netlify.toml no longer has ${control.name} — ${control.why}`);
}

// The gates must NOT be on the build command: they are minutes, and they run locally.
if (/command\s*=\s*"[^"]*(npm run check|playwright|lighthouse|vitest)/.test(toml)) {
  fail('netlify.toml runs a test suite on billed build minutes. Gates run locally, before a push.');
}

/* --------------------------------------------------------------- report */

console.log(
  `\n  import graph: ${reached.size} files reached, ` +
    (reachedButAllowListed.length === 0
      ? 'none on the allow-list'
      : `${reachedButAllowListed.length} ON THE ALLOW-LIST: ${reachedButAllowListed.join(', ')}`),
);
console.log(`  allow-list patterns proven: ${samples.length}`);
for (const { pattern, file } of samples) console.log(`    ${String(pattern).padEnd(22)} ${file}`);
// Counted directly, not derived from the failure total: subtracting one kind
// of failure from another reported 2/5 while all five controls were present,
// because three UNRELATED allow-list failures were in the same tally.
console.log(`  netlify.toml controls present: ${controlsPresent}/${REQUIRED_CONTROLS.length}`);

if (failures.length > 0) {
  console.error(`\nDEPLOY SAVINGS CHECK FAILED — ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS');
