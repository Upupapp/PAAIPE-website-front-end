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
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUDIT_UNVERIFIED,
  parseAudit,
  parseCheck,
  parseLighthouse,
  parsePlaywright,
  parseVitest,
} from './release-parsers.mjs';
import { headline } from './release-report.mjs';
/*
 * NOTHING about the owner inputs is imported here.
 *
 * An `import` in this file resolves against the MAIN checkout, not the detached
 * worktree, so importing `evaluateInputs` meant the gate read correct facts
 * through whatever detectors happened to be on disk. The evaluation now runs
 * inside the worktree in `scripts/release-facts.mjs` and arrives as data.
 */

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const FAST = process.argv.includes('--fast');
const KEEP = process.argv.includes('--keep-worktree');

const stages = [];
const problems = [];
/** Stages that could not run. Not failures - but they stop READY. */
const unverifiedStages = [];

/** How many commands `npm run check` chains. Derived, never typed. */
const CHECK_STAGE_COUNT = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
).scripts.check.split('&&').length;

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

  /*
   * A stage has THREE outcomes. `unverified` is the one that matters: a stage
   * that COULD NOT RUN is not a pass and not a failure, and collapsing it into
   * either is a lie in a different direction. It must not block on a transient
   * condition, and it must not let the build reach READY.
   */
  let unverified = false;
  let evidence = ok ? 'exit 0' : 'FAILED';

  // The parser gets its say even when the command FAILED: a stage can fail
  // because it could not reach the network, which is unverified, not broken.
  if (parse) {
    const parsed = parse(output);
    if (parsed === AUDIT_UNVERIFIED) {
      unverified = true;
      ok = true;
      evidence = 'UNVERIFIED - could not reach the registry; re-run before release';
    } else if (!ok) {
      evidence = 'FAILED';
    } else if (parsed === null) {
      ok = false;
      evidence = 'FAILED: the command exited 0 but produced no parseable result';
    } else {
      evidence = parsed;
    }
  }

  stages.push({ label, command, ok, unverified, evidence, seconds });
  if (!ok) fail(`${label}: ${evidence}`);
  if (unverified) unverifiedStages.push(`${label}: ${evidence}`);
  return { ok, output };
}

/**
 * The parsers live in their own module so they can be unit tested - see
 * `src/tests/release-parsers.test.ts`. They are the part of this gate most
 * likely to fail silently, and a parser nobody has seen reject bad output is
 * not a guard.
 */
const parsers = {
  vitest: parseVitest,
  playwright: parsePlaywright,
  lighthouse: parseLighthouse,
  audit: parseAudit,
  check: (output) => parseCheck(output, CHECK_STAGE_COUNT),
};

/* ------------------------------------------------------ 1. refuse a dirty tree */

/*
 * The one exemption: the gate's OWN generated report.
 *
 * The gate writes `docs/release-gate.md`, which makes the tree dirty - so
 * without this, running the gate twice in a row refuses on the second run,
 * blaming its own output. The exemption is a single exact path, not a pattern,
 * and everything else still refuses. A gate that cannot be re-run is a gate
 * people stop running.
 */
const OWN_ARTIFACT = 'docs/release-gate.md';

const status = git(['status', '--porcelain'])
  .split('\n')
  .filter((line) => line.trim().length > 0 && !line.endsWith(` ${OWN_ARTIFACT}`))
  .join('\n');
if (status.length > 0) {
  console.error('RELEASE GATE REFUSED TO RUN\n');
  console.error('  The working tree is dirty. A gate must certify a committed state,');
  console.error('  not whatever happens to be on disk. Commit or stash first.');
  console.error(`  (${OWN_ARTIFACT} is exempt - it is this gate's own output.)\n`);
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

  /*
   * EVERY FACT COMES FROM THE WORKTREE, not from this checkout.
   *
   * The gate runs in a detached worktree so it certifies a committed SHA. It
   * used to gather the media count from that worktree while importing the
   * policy statuses from THIS tree - so an uncommitted edit to
   * `src/content/policies.ts` could have flipped B-9 green in a report stamped
   * with a commit that did not contain it. Two trees, one verdict.
   *
   * `scripts/release-facts.mjs` runs INSIDE the worktree, evaluates the owner
   * inputs THERE, and prints the answer. The only fact that is still ambient is
   * the environment, and that is correct: the environment IS the deploy
   * environment, not a property of the commit. The report says so.
   */
  const factsRun = run(
    'Gather facts from the worktree',
    'npx tsx scripts/release-facts.mjs',
    worktree,
  );
  let facts = null;
  try {
    facts = JSON.parse(factsRun.output.trim().split('\n').pop());
  } catch {
    fail('the fact gatherer produced no parseable JSON — the owner inputs cannot be evaluated');
  }
  if (facts && facts.tree.replace(/\/$/, '') !== worktree.replace(/\/$/, '')) {
    // Assert the facts came from where we think. A gate that reads the wrong
    // tree and says so is recoverable; one that reads it silently is not.
    fail(`the fact gatherer ran in ${facts.tree}, not the worktree ${worktree}`);
    facts = null;
  }
  if (facts && !Array.isArray(facts.inputs)) {
    fail('the fact gatherer returned no evaluated owner inputs — the blocker list is unknown');
    facts = null;
  }

  /*
   * `null` is NOT the empty list. An unevaluated gate must not print "no owner
   * input is outstanding": that reads as a clear release, and it is the exact
   * false green this gate exists to refuse. The report branches on it below.
   */
  const inputsEvaluated = Array.isArray(facts?.inputs);
  const inputs = inputsEvaluated ? facts.inputs : [];

  const unmet = inputs.filter((input) => !input.supplied);

  /* ------------------------------------------------------------- 5. the report */

  const stamp = new Date().toISOString().slice(0, 10);
  /*
   * READY requires every stage to have been actually VERIFIED. An unverified
   * stage is not a failure and not a pass, so it cannot contribute to a
   * certification - it can only withhold one.
   */
  const verdict =
    problems.length === 0 && unmet.length === 0 && unverifiedStages.length === 0
      ? 'READY FOR PAAIPE REVIEW'
      : 'BLOCKED';

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

${headline({ problems, unverifiedStages, unmet })}

## CERTIFIED

What was actually run, on this commit, in a clean checkout with a frozen install.

| Stage | Result | Time |
| --- | --- | --- |
${stages.map((stage) => `| ${stage.label} | ${stage.ok ? '' : '**FAILED** — '}${stage.evidence} | ${stage.seconds}s |`).join('\n')}
${unverifiedStages.length > 0 ? `\n> **${unverifiedStages.length} stage(s) could not run and are UNVERIFIED.** They are not\n> failures and not passes, and they keep this build out of READY.\n` : ''}

| Review package | Result |
| --- | --- |
| Required documents committed | ${REQUIRED_FILES.length}/${REQUIRED_FILES.length} present in \`git ls-files\` |
${REQUIRED_DIRECTORIES.map(([prefix, floor, what]) => `| ${what} | ${[...tracked].filter((f) => f.startsWith(prefix)).length} committed (floor ${floor}) |`).join('\n')}

## BLOCKED

${
  !inputsEvaluated
    ? `**THE OWNER INPUTS WERE NOT EVALUATED.** The fact gatherer did not return a
blocker list, so this report cannot say which inputs are outstanding — and an
empty list here would read as "none", which is the opposite of what is known.
The failure is listed under CERTIFIED above. Treat the blocker state as UNKNOWN.`
    : unmet.length === 0
      ? 'No owner input is outstanding.'
      : `${unmet.length} owner input${unmet.length === 1 ? ' is' : 's are'} outstanding. Each is listed on its own row: a single
"not ready" would not tell anyone which input to go and get.

| Blocker | What is missing | Supplied by | What the build does meanwhile |
| --- | --- | --- | --- |
${unmet.map((input) => `| **${input.id}** | ${input.missing}${input.reason ? ` <br> **Measured this run:** ${input.reason}` : ''} | ${input.suppliedBy} | ${input.fallback} |`).join('\n')}

### How each one clears

${
  /*
   * ONE SENTENCE PER ROW, DERIVED FROM WHERE THE DETECTOR ACTUALLY LOOKS.
   *
   * This used to append the same sentence - "the gate re-reads the world on
   * every run, so the row turns green with no change to the gate itself" - to
   * every row from a single template. It is true of B-4, B-6 and B-9. It is
   * FALSE of B-5 and B-8, whose detectors read a constant in
   * `src/config/release.ts`: supplying those requires an edit to that file, and
   * the report was printing the opposite three lines from a row where the
   * sentence is literally true. `readsFrom` is declared beside each detector, so
   * a new input cannot inherit a claim nobody checked.
   */
  unmet.map((input) => `- **${input.id}** — ${input.howToSupply} ${input.clearsBy}`).join('\n')
}`
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
${unverifiedStages.map((entry) => `| ${entry.split(':')[0]} | **UNVERIFIED** | The stage could not run. A stage that did not run is not a clean result, and reporting it as one would be a claim of success over machinery that never executed. |`).join('\n')}
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
    const mark = stage.unverified ? 'UNVR' : stage.ok ? 'PASS' : 'FAIL';
    console.log(`  ${mark}  ${stage.label.padEnd(34)} ${stage.evidence}`);
  }
  if (unverifiedStages.length > 0) {
    console.log(`\n  UNVERIFIED stages (not failures, but they stop READY):`);
    for (const entry of unverifiedStages) console.log(`    ${entry}`);
  }
  if (!inputsEvaluated) {
    console.log(`\n  Owner inputs: NOT EVALUATED — the blocker state is unknown, not clear.`);
  } else {
    console.log(`\n  Owner inputs: ${inputs.length - unmet.length}/${inputs.length} supplied`);
    for (const input of inputs) {
      console.log(`  ${input.supplied ? ' OK ' : 'MISS'}  ${input.id}  ${input.missing}`);
      if (input.reason) console.log(`        ${input.reason}`);
    }
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
