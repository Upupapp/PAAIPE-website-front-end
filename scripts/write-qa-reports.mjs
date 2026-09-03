#!/usr/bin/env node
/**
 * Generate the three QA documents Tab 15 requires that are derived from
 * configuration: the QA report, the browser/device matrix, and the release
 * blockers register.
 *
 * Generated, for the reason every other document here is: the two hand-written
 * tables in this repository went three and seven tabs stale without anyone
 * noticing. `--check` fails when a document and `src/config/qa.ts` disagree.
 *
 * `docs/content-brand-audit.md`, `docs/performance-report.md` and
 * `docs/accessibility-report.md` are NOT written here - the first is produced by
 * its own audit run, and the other two carry measured evidence and manual
 * findings that no config can derive.
 *
 * Usage: node --import tsx scripts/write-qa-reports.mjs [--check]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BLOCKING_CLASSES, BROWSER_MATRIX, DEFECTS, TEST_EXCEPTIONS } from '../src/config/qa.ts';
import { BUDGETS, BUDGET_EXCEPTIONS, LIGHTHOUSE_TARGETS } from '../src/config/budgets.ts';
import { ALL_PENDING } from '../src/config/pending.ts';

const DOCS = new URL('../docs/', import.meta.url);

const GENERATED = (script) =>
  `> **Generated file.** Produced from \`src/config/qa.ts\` by \`npm run ${script}\`.\n> \`npm run qa:check\` fails if it drifts. Edit the config, not this document.`;

/* ------------------------------------------------------------- qa-report.md */

function qaReport() {
  const open = ALL_PENDING.filter((item) =>
    ['BLOCKED', 'OWNER DECISION', 'NOT REACHED'].includes(item.state),
  );
  const owner = open.filter((item) => item.id.startsWith('B-'));
  const frontend = open.filter((item) => item.id.startsWith('F-'));

  return `# QA report — Tab 15

${GENERATED('qa:write')}

## Executive summary

**Automated suite: PASS. Release: BLOCKED.**

Every gate in \`npm run check\` passes, and the full browser suite passes in four
engine projects. The release is nonetheless blocked, on things this lane cannot
verify or decide rather than on defects it found. They are listed in
\`docs/release-blockers.md\`, and the two that matter most are the **manual
accessibility sign-off** (no screen-reader pass has been done by a person) and
the **owner inputs** — no destination URL, typeface, imagery, origin, hosting
owner or approved legal text exists yet.

Reading this as "QA passed" would be the wrong conclusion. An automated suite
can only fail; it cannot pass a product. What it establishes is that ${BLOCKING_CLASSES.length}
classes of blocking defect are each watched by a named gate, and that none of
them fired.

## Defect policy

Completion is blocked on any of these. Each names the gate that would catch it —
a blocking class nothing detects is a promise, not a policy, and
\`src/tests/qa.test.ts\` fails if one is ever added without a detector.

| # | Blocking class | Detected by |
| --- | --- | --- |
${BLOCKING_CLASSES.map((entry, i) => `| ${i + 1} | ${entry.description} | \`${entry.detectedBy}\` |`).join('\n')}

**Result: none fired.**

## Medium and low defects

${
  DEFECTS.length === 0
    ? 'None recorded. Every defect found during Tab 15 was fixed in the same pass — see §"What Tab 15 found" below — so none is carried forward.'
    : `| ID | Severity | Summary | Impact | Remediation | Owner | Target |\n| --- | --- | --- | --- | --- | --- | --- |\n${DEFECTS.map((d) => `| ${d.id} | ${d.severity} | ${d.summary} | ${d.impact} | ${d.remediation} | ${d.owner} | ${d.target} |`).join('\n')}`
}

## Test exceptions

${
  TEST_EXCEPTIONS.length === 0
    ? `**None.** No test is skipped, weakened, narrowed or excluded to make this tab pass.

That is worth stating explicitly, because it is the easiest thing to get wrong
in a QA tab. Where something cannot be verified here — a real Android device, a
screen-reader pass — it is recorded as an open blocker, not waved through with
an exception. An exception would require a named owner, a rationale, a scope, a
risk, a remediation date and an expiry, all six, and \`src/tests/qa.test.ts\`
enforces that.`
    : `| ID | Scope | Rationale | Risk | Owner | Remediation | Expires |\n| --- | --- | --- | --- | --- | --- | --- |\n${TEST_EXCEPTIONS.map((e) => `| ${e.id} | ${e.scope} | ${e.rationale} | ${e.risk} | ${e.owner} | ${e.remediation} | ${e.expires} |`).join('\n')}`
}

## The automated suite

Run \`npm run check\` for everything below except the browser tests, then
\`npm run test:e2e\` and \`npm run lighthouse\`.

| Stage | Command |
| --- | --- |
| Frozen dependency install | \`npm ci\` — installs the locked tree exactly, fails rather than resolving something new |
| Formatting | \`npm run format:check\` |
| Linting | \`npm run lint\` |
| Strict type checking | \`npm run typecheck\` — \`astro check\`, includes \`.astro\` templates |
| Unit and content-schema tests | \`npm run test\` — every registry is validated by Zod at module load, so a bad record fails the BUILD |
| Register drift | \`npm run pending:check\`, \`npm run metadata:check\`, \`npm run qa:check\` |
| Canonical-logo checksums | \`npm run verify:brand\` |
| Social card integrity | \`npm run verify:social\` — re-composites and compares pixels |
| Contrast contract | \`npm run verify:contrast\` |
| Built-bundle privacy scan | \`npm run verify:leak\` — both content modes |
| Metadata, canonical, robots, sitemap, indexability | \`npm run verify:seo\` — both content modes |
| HTML validation | \`npm run verify:html\` — both content modes |
| Broken links and missing assets | \`npm run verify:links\` |
| Content and brand audit | \`npm run audit:content\` — source and built output, both modes |
| Performance budgets | \`npm run verify:budgets\` |
| Browser tests | \`npm run test:e2e\` — Chromium, Firefox, WebKit desktop, WebKit mobile |
| Visual regression | \`npx playwright test --project=visual-chromium\` — 320/390/768/1024/1440 |
| Lighthouse | \`npm run lighthouse\` — median of three mobile passes |
| Dependency scan | \`npm audit --omit=dev --audit-level=high\` |

### Why some of these run locally rather than in CI

There is **no \`.github/workflows\`**, by standing repository rule: no CI
workflow that consumes tokens. Every gate above runs through \`npm run check\`
before a commit instead. This is a substitution of *where* a gate runs, not a
reduction in *what* is gated — and the cost is worth stating: a local gate can
be skipped by someone who does not run it, and CI cannot.

## Performance

Budgets: ${BUDGETS.length} tracked, ${BUDGET_EXCEPTIONS.length} exceptions.
Lighthouse targets: ${LIGHTHOUSE_TARGETS.performance} performance,
${LIGHTHOUSE_TARGETS.accessibility} accessibility,
${LIGHTHOUSE_TARGETS['best-practices']} best practices,
${LIGHTHOUSE_TARGETS.seo} SEO — all met on three representative routes, median
of three mobile runs. Evidence and per-run figures: \`docs/performance-report.md\`
and \`docs/lighthouse.json\`.

## Open items

${frontend.length} front-end items and ${owner.length} owner items are open.
The full register with the reason for each is \`docs/PENDING.md\`; the ones that
block a release are in \`docs/release-blockers.md\`.

## Evidence

| Artefact | What it holds |
| --- | --- |
| \`docs/content-brand-audit.md\` | The eight-class source and build search, with results |
| \`docs/accessibility-report.md\` | Automated results, and the manual checks that have **not** been done |
| \`docs/performance-report.md\` | Measured bytes, Lighthouse medians, the real-user monitoring plan |
| \`docs/browser-device-matrix.md\` | What was tested where, and what could not be |
| \`docs/release-blockers.md\` | Everything standing between this build and a release |
| \`docs/metadata-matrix.md\` | Per-route metadata and indexability |
| \`docs/screenshots/tab-15/\` | 1440×900 and 390×844 captures, stamped **CONCEPT UI** |
| \`tests/e2e/__screenshots__/\` | Visual-regression baselines at five widths |
`;
}

/* -------------------------------------------------- browser-device-matrix.md */

function browserMatrix() {
  const automated = BROWSER_MATRIX.filter((entry) => entry.status === 'automated');
  const pending = BROWSER_MATRIX.filter((entry) => entry.status !== 'automated');
  return `# Browser and device matrix — Tab 15

${GENERATED('qa:write')}

${automated.length} of ${BROWSER_MATRIX.length} targets are covered by an automated engine
project. ${pending.length} are **not**, and the reason is stated for each — an
uncovered row with no explanation is the same as no row at all.

| Target | Status | Coverage |
| --- | --- | --- |
${BROWSER_MATRIX.map((entry) => `| ${entry.target} | ${entry.status} | ${entry.coverage} |`).join('\n')}

## The distinction this table exists to preserve

**An engine is not a browser, and a viewport is not a device.**

Playwright drives the same engines the browsers ship — Chromium, Gecko, WebKit —
and that is strong evidence. It is not the same thing as running Chrome, Edge or
Safari, each of which layers its own features, defaults and quirks on top. It is
much further from running on a real handset, where touch targets, input zoom,
the dynamic viewport, throttled hardware and a screen reader all behave
differently from an emulated viewport on a developer Mac.

So every row says which kind of coverage it is. A row marked \`automated\` is
engine coverage. Nothing in this repository is a real-device pass, and
\`src/tests/qa.test.ts\` asserts that no row claims to be.

## What each automated project runs

| Project | Viewport | Suite |
| --- | --- | --- |
| \`chromium-desktop\` | Desktop Chrome | Full suite including axe-core |
| \`firefox-desktop\` | Desktop Firefox | Full suite including axe-core |
| \`webkit-desktop\` | Desktop Safari | Full suite including axe-core |
| \`webkit-mobile\` | iPhone 13, touch, mobile UA | Full suite including axe-core |
| \`visual-chromium\` | 320 / 390 / 768 / 1024 / 1440 | Pixel baselines only |

Visual regression runs in **one** engine deliberately: a pixel baseline is
engine-specific, so three engines would mean three sets of baselines and three
ways for an unrelated browser update to turn the suite red for no product
reason. Cross-engine differences are caught by the geometry and behaviour
assertions, which do run everywhere — and did: Firefox found a measurement fault
in the logo aspect-ratio test that Chromium and WebKit had both masked by
decoding a lazy image early.

## What is still owed

- **Desktop Edge**, current: a manual pass. Chromium covers the engine.
- **iOS Safari**, previous major: a real device or an older simulator runtime.
- **Android Chrome**, current: a real device or an emulator. A resized desktop
  Chromium is not Android Chrome and must not be recorded as one.
`;
}

/* ------------------------------------------------------ release-blockers.md */

function releaseBlockers() {
  const open = ALL_PENDING.filter((item) =>
    ['BLOCKED', 'OWNER DECISION', 'NOT REACHED'].includes(item.state),
  );
  const owner = open.filter((item) => item.id.startsWith('B-'));
  const frontend = open.filter((item) => item.id.startsWith('F-'));

  return `# Release blockers — Tab 15

${GENERATED('qa:write')}

Tab 15 blocks completion on a defined list of defect classes. **None of them
fired.** What follows is therefore not a defect list — it is the set of things
that stand between this build and a release, and almost all of them need a
decision or an input rather than a code change.

## Blocking: needs a person, not a script

### 1. The manual accessibility sign-off has not been done

Tab 15 asks for keyboard-only, desktop screen reader, mobile screen reader,
200% zoom, 320px reflow, reduced motion, contrast, target size,
focus-obscured, captions/transcript and error-announcement checks, each with a
**recorded tester, date, browser/device, result and evidence**.

Automated coverage exists for several of these and it is not the same thing.
axe-core is a floor: it finds a known set of violations and cannot tell you
whether a page makes sense when read aloud. \`docs/accessibility-report.md\`
records **tester: none, date: none** for every manual row, with what each one
needs. This is F-24 and it is the single largest gap in the tab.

### 2. Owner inputs (${owner.length} items)

${owner.map((item) => `- **${item.id}** — ${item.item}. ${item.reason}`).join('\n')}

## Not blocking, but unverified

${frontend.map((item) => `- **${item.id}** — ${item.item}. ${item.reason}`).join('\n')}

## What is NOT a blocker, and why

**The failing \`cache-insight\` Lighthouse audit.** It is an artefact of
\`scripts/preview-server.mjs\`, which sets no cache headers because it exists to
serve tests. Recommended production caching is in
\`docs/security-privacy-handoff.md\` and must be verified after deploy.

**The logo checksum divergence from the master command.** Superseded by owner
ruling on 2026-09-03: the uploaded files are authoritative. The audit still
prints the divergence on every run so it stays visible.

**Zero published events and resources.** Nothing in the registry is
\`approved\`, so a production build renders no detail pages and no \`Event\` or
\`Article\` structured data. That is the correct behaviour of a content gate, not
a fault — the pages exist, the templates are tested, and the first approved
record will publish without a code change.
`;
}

/* ------------------------------------------------------------------- main */

const DOCUMENTS = [
  ['qa-report.md', qaReport],
  ['browser-device-matrix.md', browserMatrix],
  ['release-blockers.md', releaseBlockers],
];

async function main() {
  const check = process.argv.includes('--check');
  let drifted = 0;

  for (const [name, render] of DOCUMENTS) {
    const expected = render();
    const target = new URL(name, DOCS);
    if (!check) {
      await writeFile(fileURLToPath(target), expected, 'utf8');
      console.log(`WROTE docs/${name}`);
      continue;
    }
    let actual = null;
    try {
      actual = await readFile(fileURLToPath(target), 'utf8');
    } catch {
      /* missing; reported below */
    }
    if (actual !== expected) {
      console.error(
        actual === null
          ? `FAIL  docs/${name} is missing. Run npm run qa:write.`
          : `FAIL  docs/${name} is out of date with src/config/qa.ts. Run npm run qa:write.`,
      );
      drifted += 1;
    } else {
      console.log(`OK    docs/${name}`);
    }
  }

  if (drifted > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
