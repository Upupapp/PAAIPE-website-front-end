#!/usr/bin/env node
/**
 * Netlify build-skip decision. The main deployment cost control.
 *
 * WHY THIS EXISTS
 * ---------------
 * Netlify bills build MINUTES, and a push triggers a build whether or not the
 * push could possibly change the site. A commit that only edits documentation,
 * a test, or a screenshot produces a byte-identical `dist/` and costs exactly
 * as much as a real change. Across a repository like this one - where the
 * majority of commits touch `docs/` and `src/tests/` - that is most of the bill.
 *
 * Netlify runs this before installing dependencies:
 *
 *     exit 0        -> CANCEL the build   (free)
 *     exit non-zero -> RUN the build       (billed)
 *
 * THE POLARITY IS THE WHOLE DESIGN
 * --------------------------------
 * Skipping a build that WAS needed is far worse than running one that was not.
 * A wrongly-skipped build means a real fix silently never reaches visitors, and
 * the deploy log shows a cheerful "build cancelled". Nobody investigates a
 * cancellation.
 *
 * So the default is BUILD, and a skip requires positive proof:
 *
 *   - the skip list is an ALLOW-list of paths proven not to affect `dist/`;
 *   - EVERY changed path must match it. One unrecognised path builds;
 *   - anything unexpected - no cached commit, an unreadable diff, an empty
 *     diff, a git failure - builds.
 *
 * The allow-list is proven, not assumed. `npm run verify:deploy` appends a byte
 * to a real file of every skipped kind, rebuilds, and asserts `dist/` is
 * byte-identical. If a skipped path ever starts affecting the build, that gate
 * fails before this script can cost anyone a missed deploy.
 */
import { execFileSync } from 'node:child_process';

/**
 * Paths that cannot change the built output.
 *
 * Deliberately short. Everything here is either documentation, a test that the
 * build never imports, or an editor/agent file. `src/` is NOT on this list
 * except `src/tests/`, and `package.json`, `package-lock.json`,
 * `astro.config.mjs`, `public/` and every config file are absent on purpose.
 */
export const BUILD_IRRELEVANT = [
  /^docs\//,
  /^tests\//,
  /^src\/tests\//,
  /^[^/]+\.md$/, // README.md and friends at the repository root
  /^\.gitignore$/,
];

/*
 * `.claude/`, `.vscode/` and `LICENSE` were on this list and have been removed.
 *
 * `npm run verify:deploy` refused them: none matches a committed file. An
 * untracked path can never appear in a diff between two commits, so a pattern
 * for one is dead weight that only looks like caution - and a dead entry is
 * indistinguishable from a MISSPELT one, which is the case that actually costs
 * a missed deploy. Add an entry back when there is a committed file to prove it
 * against.
 */

/** Why the decision went the way it did. Printed, so a log explains itself. */
export const REASONS = {
  NO_CACHED_COMMIT: 'no cached commit — this is a first build, or the cache was cleared',
  SAME_COMMIT: 'the cached commit is this commit — a retry or a cleared cache',
  DIFF_FAILED: 'the diff could not be read',
  EMPTY_DIFF: 'the diff is empty, which should not happen between two different commits',
  BUILD_RELEVANT: 'a changed path can affect the build',
  ALL_IRRELEVANT: 'every changed path is documentation, a test, or an editor file',
};

export function isBuildIrrelevant(path) {
  return BUILD_IRRELEVANT.some((pattern) => pattern.test(path));
}

/**
 * The decision, as a pure function so it can be tested without a Netlify build.
 *
 * @returns {{ build: boolean, reason: string, relevant: string[] }}
 */
export function decide({ cachedCommit, currentCommit, changedFiles }) {
  if (!cachedCommit) return { build: true, reason: REASONS.NO_CACHED_COMMIT, relevant: [] };
  if (cachedCommit === currentCommit) {
    return { build: true, reason: REASONS.SAME_COMMIT, relevant: [] };
  }
  if (changedFiles === null) return { build: true, reason: REASONS.DIFF_FAILED, relevant: [] };
  if (changedFiles.length === 0) {
    return { build: true, reason: REASONS.EMPTY_DIFF, relevant: [] };
  }

  const relevant = changedFiles.filter((path) => !isBuildIrrelevant(path));
  return relevant.length > 0
    ? { build: true, reason: REASONS.BUILD_RELEVANT, relevant }
    : { build: false, reason: REASONS.ALL_IRRELEVANT, relevant: [] };
}

/** Null on any failure, so the caller builds rather than guessing. */
export function changedFilesBetween(from, to) {
  try {
    const output = execFileSync('git', ['diff', '--name-only', `${from}..${to}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return output.split('\n').filter((line) => line.trim().length > 0);
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- the run */

// Only decide when Netlify actually invoked this. Importing it must not exit.
if (process.env.NETLIFY === 'true' || process.argv.includes('--run')) {
  const cachedCommit = process.env.CACHED_COMMIT_REF;
  const currentCommit = process.env.COMMIT_REF ?? 'HEAD';
  const context = process.env.CONTEXT ?? 'unknown';

  const changedFiles = cachedCommit ? changedFilesBetween(cachedCommit, currentCommit) : null;
  const { build, reason, relevant } = decide({ cachedCommit, currentCommit, changedFiles });

  console.log(`netlify-ignore: context=${context} ${cachedCommit ?? '(none)'}..${currentCommit}`);
  console.log(`netlify-ignore: ${build ? 'BUILD' : 'SKIP'} — ${reason}`);
  if (relevant.length > 0) {
    console.log(`netlify-ignore: build-relevant changes (${relevant.length}):`);
    for (const path of relevant.slice(0, 20)) console.log(`  ${path}`);
    if (relevant.length > 20) console.log(`  …and ${relevant.length - 20} more`);
  }

  // exit 0 cancels the build; non-zero proceeds.
  process.exit(build ? 1 : 0);
}
