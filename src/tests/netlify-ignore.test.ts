/**
 * The Netlify build-skip decision.
 *
 * This is the highest-consequence script in the repository, and not because it
 * is complicated. A wrongly-skipped build means a real fix silently never
 * reaches visitors, and the deploy log records a cheerful "build cancelled"
 * that nobody investigates. Burning a build minute is recoverable; a fix that
 * quietly did not ship is not.
 *
 * So the tests below are weighted towards the ONE direction that matters:
 * every way the decision could wrongly skip.
 */
import { describe, expect, it } from 'vitest';
import {
  BUILD_IRRELEVANT,
  REASONS,
  decide,
  isBuildIrrelevant,
} from '../../scripts/netlify-ignore.mjs';

const COMMITS = { cachedCommit: 'aaaa', currentCommit: 'bbbb' };
const build = (changedFiles: string[] | null) => decide({ ...COMMITS, changedFiles });

describe('the default is BUILD', () => {
  it('builds when there is no cached commit', () => {
    const result = decide({ cachedCommit: undefined, currentCommit: 'bbbb', changedFiles: [] });
    expect(result.build).toBe(true);
    expect(result.reason).toBe(REASONS.NO_CACHED_COMMIT);
  });

  it('builds when the cached commit IS the current commit', () => {
    // A retry, or a cleared cache. The diff would be empty and would look
    // exactly like "nothing relevant changed".
    const result = decide({ cachedCommit: 'aaaa', currentCommit: 'aaaa', changedFiles: [] });
    expect(result.build).toBe(true);
    expect(result.reason).toBe(REASONS.SAME_COMMIT);
  });

  it('builds when the diff could not be read', () => {
    // `changedFilesBetween` returns null on any git failure — a shallow clone,
    // a missing ref, a corrupt cache. Null must never read as "no changes".
    expect(build(null).build).toBe(true);
    expect(build(null).reason).toBe(REASONS.DIFF_FAILED);
  });

  it('builds on an EMPTY diff between two different commits', () => {
    /*
     * The most dangerous shape. An empty array satisfies `every()` vacuously,
     * so "all changed paths are irrelevant" is TRUE for zero paths — and the
     * build would be skipped on a diff that failed to produce output. Two
     * different commits always differ; an empty diff means something is wrong.
     */
    expect(build([]).build).toBe(true);
    expect(build([]).reason).toBe(REASONS.EMPTY_DIFF);
  });
});

describe('one build-relevant path is enough to build', () => {
  it('builds when a single source file is mixed in with documentation', () => {
    const result = build([
      'docs/architecture.md',
      'docs/qa-report.md',
      'src/pages/index.astro',
      'src/tests/seo.test.ts',
    ]);
    expect(result.build).toBe(true);
    expect(result.relevant).toEqual(['src/pages/index.astro']);
  });

  for (const path of [
    'package.json',
    'package-lock.json',
    'astro.config.mjs',
    'netlify.toml',
    'src/config/routes.ts',
    'src/content/home.ts',
    'src/components/BaseLayout.astro',
    'src/styles/tokens.css',
    'src/scripts/motion.ts',
    'public/brand/PAAIPE_Logo_Square_Final.png',
    'public/media/hero.png',
    'scripts/write-seo-files.mjs',
    'scripts/prune-orphan-assets.mjs',
    'tsconfig.json',
    '.env.example',
    'src/pages/events/[slug].astro',
  ]) {
    it(`builds for ${path}`, () => {
      expect(isBuildIrrelevant(path), `${path} must NOT be skippable`).toBe(false);
      expect(build([path]).build).toBe(true);
    });
  }
});

describe('only proven-irrelevant paths skip', () => {
  for (const path of [
    'docs/architecture.md',
    'docs/screenshots/tab-16/desktop-1440x900-home.png',
    'docs/recordings/default-motion.webm',
    'tests/e2e/journeys.spec.ts',
    'tests/e2e/__screenshots__/home-390.png',
    'src/tests/seo.test.ts',
    'README.md',
    '.gitignore',
  ]) {
    it(`skips for ${path}`, () => {
      expect(isBuildIrrelevant(path)).toBe(true);
    });
  }

  it('skips a commit that is entirely documentation and tests', () => {
    const result = build([
      'docs/PENDING.md',
      'docs/release-gate.md',
      'src/tests/release.test.ts',
      'tests/e2e/seo.spec.ts',
      'README.md',
    ]);
    expect(result.build).toBe(false);
    expect(result.reason).toBe(REASONS.ALL_IRRELEVANT);
  });
});

describe('the allow-list cannot quietly widen', () => {
  it('is short, and every entry is anchored at the start of the path', () => {
    // An unanchored pattern would match a path segment anywhere — `docs/` would
    // then skip `src/docs-loader.ts`. Every pattern must start at the root.
    expect(BUILD_IRRELEVANT.length).toBeLessThanOrEqual(8);
    for (const pattern of BUILD_IRRELEVANT) {
      expect(pattern.source.startsWith('^'), `${pattern} is not anchored`).toBe(true);
    }
  });

  it('does not skip a lookalike path outside the listed directories', () => {
    for (const path of [
      'src/docs/loader.ts',
      'src/lib/tests-helper.ts',
      'public/docs/guide.pdf',
      'src/content/docs.ts',
      'src/pages/docs.astro',
      'srcdocs/x.md',
      'a/README.md',
      'src/config/README.md',
    ]) {
      expect(isBuildIrrelevant(path), `${path} was wrongly treated as skippable`).toBe(false);
    }
  });

  it('has no entry that matches nothing committed', () => {
    /*
     * A dead entry is indistinguishable from a MISSPELT one, and a misspelt one
     * is the case that costs a missed deploy. `npm run verify:deploy` proves
     * each pattern against a real committed file; three entries were removed
     * when it first ran, because an untracked path can never appear in a diff.
     */
    for (const pattern of BUILD_IRRELEVANT) {
      expect(
        ['docs/x.md', 'tests/x.ts', 'src/tests/x.ts', 'README.md', '.gitignore'].some((path) =>
          pattern.test(path),
        ),
        `${pattern} matches none of the paths this repository actually has`,
      ).toBe(true);
    }
  });

  it('does not skip a root config file that happens to end in .md-like text', () => {
    expect(isBuildIrrelevant('package.json')).toBe(false);
    expect(isBuildIrrelevant('astro.config.mjs')).toBe(false);
  });
});
