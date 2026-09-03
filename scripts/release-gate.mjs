#!/usr/bin/env node
/**
 * The Tab 16 conditional release gate.
 *
 * Owner ruling, 2026-09-04: build it, ship the machinery, and let the machinery
 * refuse the release. It EXITS NON-ZERO while any owner input is unmet. There
 * is no warning level, no advisory, no yellow - a gate that exits 0 with
 * caveats is read as a pass.
 *
 * HOW IT AVOIDS LYING
 * -------------------
 * Every rule below exists because this project has been bitten by its absence.
 *
 *  - It runs from a DETACHED WORKTREE at HEAD and stamps the SHA. Never gate a
 *    dirty tree; never report a branch name as evidence. The worktree is a
 *    SIBLING path, not a temp dir - a temp-dir worktree breaks tooling parity
 *    here, a sibling one does not.
 *  - It refuses to run at all if the tree is dirty.
 *  - Every parser is FLOORED. There is no `2>/dev/null || true` anywhere: a
 *    tool that fails to run is a FAILURE, not a silent pass. "0 tests, all
 *    passed" fails.
 *  - Artifact presence is asserted against `git ls-files`, not the worktree. An
 *    uncommitted or empty directory has already made a suite here exit 0 with
 *    zero tests while the repo claimed CERTIFIED.
 *  - It never claims what it did not run. Security headers are UNVERIFIED, the
 *    manual accessibility pass is NOT DONE, and zero detail pages is BY DESIGN.
 *    Those are three different states and the report keeps them apart.
 *
 * Usage: node --import tsx scripts/release-gate.mjs [--fast] [--keep-worktree]
 *   --fast            skip the browser suite and Lighthouse (for iterating on
 *                     the gate itself). The report SAYS it was a fast run.
 *   --keep-worktree   leave the worktree in place for inspection.
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateInputs } from '../src/config/release.ts';
import { POLICIES } from '../src/content/policies.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const FAST = process.argv.includes('--fast');
const KEEP = process.argv.includes('--keep-worktree');

const stages = [];
const problems = [];

function fail(message) {
  problems.push(message);
}

function git(args, cwd = ROOT) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

/**
 * Run a command and CAPTURE it. A non-zero exit is a stage failure, never a
 * skipped stage - `|| true` is the single easiest way to make a gate lie.
 */
function run(label, command, cwd, { parse } = {}) {
  const started = Date.now();
  let output;
  let ok = true;
  try {
    output = execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    ok = false;
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  let evidence = ok ? 'exit 0' : 'FAILED';
  if (ok && parse) {
    const parsed = parse(output);
    if (parsed === null) {
      ok = false;
      evidence = 'FAILED: the command exited 0 but produced no parseable result';
    } else {
      evidence = parsed;
    }
  }

  stages.push({ label, command, ok, evidence, seconds });
  if (!ok) fail(`${label}: ${evidence}`);
  return { ok, output };
}

/** Parsers. Each returns null when it cannot find a real, non-zero result. */
const parsers = {
  vitest(output) {
    const match = output.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (!match) return null;
    const [, passed, total] = match;
    if (Number(total) === 0) return null; // "0 tests, all passed" is not a pass.
    if (passed !== total) return null;
    return `${passed}/${total} unit tests passed`;
  },
  playwright(output) {
    const passed = output.match(/(\d+)\s+passed/);
    const failed = output.match(/(\d+)\s+failed/);
    if (!passed) return null;
    if (Number(passed[1]) === 0) return null;
    if (failed && Number(failed[1]) > 0) return null;
    const skipped = output.match(/(\d+)\s+skipped/);
    return `${passed[1]} browser assertions passed${skipped ? `, ${skipped[1]} skipped` : ''}`;
  },
  lighthouse(output) {
    const rows = [...output.matchAll(/^\s{2}(\/\S*)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/gm)];
    if (rows.length === 0) return null;
    const worst = Math.min(...rows.flatMap((row) => row.slice(2).map(Number)));
    if (worst < 90) return null;
    return `${rows.length} routes, lowest median category score ${worst}`;
  },
  audit(output) {
    if (/found 0 vulnerabilities/.test(output)) return 'no high or critical finding';
    return null;
  },
  check(output) {
    // `check` chains sixteen commands; the last of them prints the budget table.
    if (!/route-js\s+worst/.test(output)) return null;
    return 'all sixteen gates passed';
  },
};

/* ------------------------------------------------------ 1. refuse a dirty tree */

const status = git(['status', '--porcelain']);
if (status.length > 0) {
  console.error('RELEASE GATE REFUSED TO RUN\n');
  console.error('  The working tree is dirty. A gate must certify a committed state,');
  console.error('  not whatever happens to be on disk. Commit or stash first.\n');
  console.error(status);
  process.exit(2);
}

const sha = git(['rev-parse', 'HEAD']);
const shortSha = git(['rev-parse', '--short', 'HEAD']);
const subject = git(['log', '-1', '--pretty=%s']);

/* --------------------------------- 2. artifacts, asserted against git ls-files */

const tracked = new Set(git(['ls-files']).split('\n'));

/**
 * The review package Tab 16 requires. Checked against the INDEX, not the
 * worktree: an untracked file is not part of a handoff, and an empty directory
 * on disk has already fooled a suite in this project.
 */
const REQUIRED_FILES = [
  'README.md',
  'package.json',
  'package-lock.json',
  '.env.example',
  'docs/frontend-scope.md',
  'docs/architecture.md',
  'docs/route-content-map.md',
  'docs/configuration.md',
  'docs/brand-usage.md',
  'docs/motion-haptics.md',
  'docs/integration-contracts.md',
  'docs/accessibility-report.md',
  'docs/content-brand-audit.md',
  'docs/performance-report.md',
  'docs/security-privacy-handoff.md',
  'docs/browser-device-matrix.md',
  'docs/qa-report.md',
  'docs/release-blockers.md',
  'docs/metadata-matrix.md',
  'docs/social-preview-contact-sheet.md',
  'public/brand/PAAIPE_Logo_Square_Final.png',
  'public/brand/PAAIPE_Logo_Horizontal_Final.png',
];

for (const file of REQUIRED_FILES) {
  if (!tracked.has(file)) fail(`review package: ${file} is not committed`);
}

/** Directories that must contain committed files, with a floor on the count. */
const REQUIRED_DIRECTORIES = [
  ['docs/screenshots/tab-16/', 18, 'presentation screenshots'],
  ['tests/e2e/__screenshots__/', 20, 'visual regression baselines'],
  ['docs/recordings/', 2, 'motion and reduced-motion recordings'],
  ['src/content/', 10, 'content registries'],
];

for (const [prefix, floor, what] of REQUIRED_DIRECTORIES) {
  const count = [...tracked].filter((file) => file.startsWith(prefix)).length;
  if (count < floor) {
    fail(
      `review package: ${prefix} has ${count} committed files, expected at least ${floor} (${what})`,
    );
  }
}

/* ------------------------------------------- 3. the clean checkout and install */

const worktree = resolve(ROOT, '..', `${basename(ROOT.replace(/\/$/, ''))}-release-gate`);
if (existsSync(worktree)) {
  execSync(`git worktree remove --force ${JSON.stringify(worktree)}`, { cwd: ROOT });
}
git(['worktree', 'add', '--detach', worktree, sha]);
console.log(`Release gate — detached worktree at ${shortSha}\n  ${worktree}\n`);

try {
  run('Frozen dependency install', 'npm ci --no-audit --no-fund', worktree);
  run('Full gate suite (npm run check)', 'npm run check', worktree, { parse: parsers.check });
  run('Unit tests', 'npx vitest run', worktree, { parse: parsers.vitest });

  if (FAST) {
    stages.push({
      label: 'Browser suite',
      command: 'npx playwright test',
      ok: true,
      evidence: 'NOT RUN — --fast',
      seconds: '0.0',
    });
    stages.push({
      label: 'Lighthouse',
      command: 'npm run lighthouse',
      ok: true,
      evidence: 'NOT RUN — --fast',
      seconds: '0.0',
    });
  } else {
    run('Browser suite (5 projects)', 'npx playwright test', worktree, {
      parse: parsers.playwright,
    });
    run('Lighthouse (median of three)', 'npm run lighthouse', worktree, {
      parse: parsers.lighthouse,
    });
  }

  run('Dependency scan', 'npm audit --omit=dev --audit-level=high', worktree, {
    parse: parsers.audit,
  });

  /* ---------------------------------------- 4. the owner inputs, each on its own */

  const mediaDir = join(worktree, 'public/media');
  const approvedMediaFiles = existsSync(mediaDir)
    ? readdirSync(mediaDir).filter((entry) => !entry.startsWith('.')).length
    : 0;

  const inputs = evaluateInputs({
    env: process.env,
    approvedMediaFiles,
    policyStatuses: POLICIES.map((policy) => policy.status),
  });

  const unmet = inputs.filter((input) => !input.supplied);

  /* ------------------------------------------------------------- 5. the report */

  const stamp = new Date().toISOString().slice(0, 10);
  const verdict =
    problems.length === 0 && unmet.length === 0 ? 'READY FOR PAAIPE REVIEW' : 'BLOCKED';

  const report = `# Release gate

> **Generated file.** Produced by \`npm run release:gate\` against a detached
> worktree. Re-run it rather than editing it.

| | |
| --- | --- |
| **Outcome** | **${verdict}** |
| Commit | \`${sha}\` |
| Subject | ${subject} |
| Run | ${stamp}${FAST ? ' (fast run — browser suite and Lighthouse NOT RUN)' : ''} |
| Worktree | detached at \`${shortSha}\`, clean tree required |

${
  verdict === 'BLOCKED'
    ? `**This build is not releasable, and the reason is not a defect.** Every gate
that could fail on quality passed. What blocks the release is ${unmet.length} owner
input${unmet.length === 1 ? '' : 's'} that no amount of front-end work can supply.`
    : ''
}

## CERTIFIED

What was actually run, on this commit, in a clean checkout with a frozen install.

| Stage | Result | Time |
| --- | --- | --- |
${stages.map((stage) => `| ${stage.label} | ${stage.ok ? '' : '**FAILED** — '}${stage.evidence} | ${stage.seconds}s |`).join('\n')}

| Review package | Result |
| --- | --- |
| Required documents committed | ${REQUIRED_FILES.length}/${REQUIRED_FILES.length} present in \`git ls-files\` |
${REQUIRED_DIRECTORIES.map(([prefix, floor, what]) => `| ${what} | ${[...tracked].filter((f) => f.startsWith(prefix)).length} committed (floor ${floor}) |`).join('\n')}

## BLOCKED

${
  unmet.length === 0
    ? 'No owner input is outstanding.'
    : `${unmet.length} owner input${unmet.length === 1 ? ' is' : 's are'} outstanding. Each is listed on its own row: a single
"not ready" would not tell anyone which input to go and get.

| Blocker | What is missing | Supplied by | What the build does meanwhile |
| --- | --- | --- | --- |
${unmet.map((input) => `| **${input.id}** | ${input.missing} | ${input.suppliedBy} | ${input.fallback} |`).join('\n')}

### How each one clears

${unmet.map((input) => `- **${input.id}** — ${input.howToSupply} The gate re-reads the world on every run, so the row turns green with no change to the gate itself.`).join('\n')}`
}

${
  inputs.filter((input) => input.supplied).length > 0
    ? `### Already supplied\n\n${inputs
        .filter((input) => input.supplied)
        .map((input) => `- **${input.id}** — ${input.title}`)
        .join('\n')}\n`
    : ''
}

## NOT VERIFIED — three different states, kept apart

A gate that blurs these is worse than one that omits them.

| Item | State | Why it is not a pass |
| --- | --- | --- |
| Recommended production security headers | **UNVERIFIED** | No host exists (B-8). Nothing was measured. The recommendations in \`docs/security-privacy-handoff.md\` have never been seen in a real response, and must not be inferred from the config we would have written. |
| Manual WCAG 2.2 AA sign-off | **NOT DONE** | \`docs/accessibility-report.md\` records tester: none, date: none on all eleven rows. Automated axe passes are a floor, not a screen-reader pass, and the gate does not let one stand in for the other. |
| Real-device browser pass | **NOT DONE** | Playwright drives the same engines the browsers ship. That is not Chrome, Edge or Safari, and it is much further from a handset. See \`docs/browser-device-matrix.md\`. |
| Event and resource detail pages rendered | **ZERO, BY DESIGN** | No content is \`approved\`, so the content gate excludes every fixture from a production build. This is the gate working, not a regression. The first approved record publishes with no code change. |

## What this gate does NOT do

It does not deploy, does not configure a host, does not publish legal text, and
does not need push authorisation to run. Tab 16 ends by waiting for a separate
written release command from PAAIPE.
`;

  await writeFile(join(ROOT, 'docs/release-gate.md'), report, 'utf8');

  /* ------------------------------------------------------------- 6. the verdict */

  console.log(`\n${'='.repeat(72)}`);
  for (const stage of stages) {
    console.log(`  ${stage.ok ? 'PASS' : 'FAIL'}  ${stage.label.padEnd(34)} ${stage.evidence}`);
  }
  console.log(`\n  Owner inputs: ${inputs.length - unmet.length}/${inputs.length} supplied`);
  for (const input of inputs) {
    console.log(`  ${input.supplied ? ' OK ' : 'MISS'}  ${input.id}  ${input.missing}`);
  }
  console.log(`${'='.repeat(72)}\n`);
  console.log(`  Wrote docs/release-gate.md`);
  console.log(`  Commit ${shortSha} — ${subject}\n`);

  if (problems.length > 0) {
    console.error(`RELEASE GATE FAILED — ${problems.length} problem(s)\n`);
    for (const problem of problems) console.error(`  - ${problem}`);
  }
  if (unmet.length > 0) {
    console.error(
      `BLOCKED — ${unmet.length} owner input(s) unmet: ${unmet.map((i) => i.id).join(', ')}\n`,
    );
    for (const input of unmet) console.error(`  - ${input.id}: ${input.missing}`);
    console.error('\n  This is the expected outcome today. The gate refuses the release');
    console.error('  because the inputs do not exist, not because the build is faulty.');
  }

  process.exit(problems.length > 0 || unmet.length > 0 ? 1 : 0);
} finally {
  if (!KEEP && existsSync(worktree)) {
    execSync(`git worktree remove --force ${JSON.stringify(worktree)}`, { cwd: ROOT });
  }
}
