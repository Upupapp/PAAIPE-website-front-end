# QA report — Tab 15

> **Generated file.** Produced from `src/config/qa.ts` by `npm run qa:write`.
> `npm run qa:check` fails if it drifts. Edit the config, not this document.

## Executive summary

**Automated suite: PASS. Release: BLOCKED.**

Every gate in `npm run check` passes, and the full browser suite passes in four
engine projects. The release is nonetheless blocked, on things this lane cannot
verify or decide rather than on defects it found. They are listed in
`docs/release-blockers.md`, and the two that matter most are the **manual
accessibility sign-off** (no screen-reader pass has been done by a person) and
the **owner inputs** — no destination URL, typeface, imagery, origin, hosting
owner or approved legal text exists yet.

Reading this as "QA passed" would be the wrong conclusion. An automated suite
can only fail; it cannot pass a product. What it establishes is that 9
classes of blocking defect are each watched by a named gate, and that none of
them fired.

## Defect policy

Completion is blocked on any of these. Each names the gate that would catch it —
a blocking class nothing detects is a promise, not a policy, and
`src/tests/qa.test.ts` fails if one is ever added without a detector.

| # | Blocking class | Detected by |
| --- | --- | --- |
| 1 | Critical or serious accessibility defect | `npm run test:e2e (axe-core on every route, 9 widths, 4 engine projects)` |
| 2 | A broken core journey | `npm run test:e2e (tests/e2e/journeys.spec.ts, all 10 journeys, every engine)` |
| 3 | A secret, credential or private link in the shipped output | `npm run verify:leak and npm run audit:content, both content modes` |
| 4 | Wrong branding: altered logo, malformed name, altered slogan | `npm run verify:brand and npm run audit:content` |
| 5 | Member data or personal contact data exposed | `npm run verify:leak (built bundle, both modes)` |
| 6 | A build error | `npm run build` |
| 7 | A console error on any route | `npm run test:e2e (smoke test, every engine)` |
| 8 | A soft 404, or a wrong status code | `npm run verify:seo and tests/e2e/seo.spec.ts` |
| 9 | An unapproved claim: member totals, testimonials, awards, partners, discounts | `npm run audit:content, source and built output, both modes` |

**Result: none fired.**

## Medium and low defects

None recorded. Every defect found during Tab 15 was fixed in the same pass — see §"What Tab 15 found" below — so none is carried forward.

## Test exceptions

**None.** No test is skipped, weakened, narrowed or excluded to make this tab pass.

That is worth stating explicitly, because it is the easiest thing to get wrong
in a QA tab. Where something cannot be verified here — a real Android device, a
screen-reader pass — it is recorded as an open blocker, not waved through with
an exception. An exception would require a named owner, a rationale, a scope, a
risk, a remediation date and an expiry, all six, and `src/tests/qa.test.ts`
enforces that.

## The automated suite

Run `npm run check` for everything below except the browser tests, then
`npm run test:e2e` and `npm run lighthouse`.

| Stage | Command |
| --- | --- |
| Frozen dependency install | `npm ci` — installs the locked tree exactly, fails rather than resolving something new |
| Formatting | `npm run format:check` |
| Linting | `npm run lint` |
| Strict type checking | `npm run typecheck` — `astro check`, includes `.astro` templates |
| Unit and content-schema tests | `npm run test` — every registry is validated by Zod at module load, so a bad record fails the BUILD |
| Register drift | `npm run pending:check`, `npm run metadata:check`, `npm run qa:check` |
| Canonical-logo checksums | `npm run verify:brand` |
| Social card integrity | `npm run verify:social` — re-composites and compares pixels |
| Contrast contract | `npm run verify:contrast` |
| Built-bundle privacy scan | `npm run verify:leak` — both content modes |
| Metadata, canonical, robots, sitemap, indexability | `npm run verify:seo` — both content modes |
| HTML validation | `npm run verify:html` — both content modes |
| Broken links and missing assets | `npm run verify:links` |
| Content and brand audit | `npm run audit:content` — source and built output, both modes |
| Performance budgets | `npm run verify:budgets` |
| Browser tests | `npm run test:e2e` — Chromium, Firefox, WebKit desktop, WebKit mobile |
| Visual regression | `npx playwright test --project=visual-chromium` — 320/390/768/1024/1440 |
| Lighthouse | `npm run lighthouse` — median of three mobile passes |
| Dependency scan | `npm audit --omit=dev --audit-level=high` |

### Why some of these run locally rather than in CI

There is **no `.github/workflows`**, by standing repository rule: no CI
workflow that consumes tokens. Every gate above runs through `npm run check`
before a commit instead. This is a substitution of *where* a gate runs, not a
reduction in *what* is gated — and the cost is worth stating: a local gate can
be skipped by someone who does not run it, and CI cannot.

## Performance

Budgets: 6 tracked, 0 exceptions.
Lighthouse targets: 90 performance,
100 accessibility,
90 best practices,
90 SEO — all met on three representative routes, median
of three mobile runs. Evidence and per-run figures: `docs/performance-report.md`
and `docs/lighthouse.json`.

## Open items

13 front-end items and 14 owner items are open.
The full register with the reason for each is `docs/PENDING.md`; the ones that
block a release are in `docs/release-blockers.md`.

## Evidence

| Artefact | What it holds |
| --- | --- |
| `docs/content-brand-audit.md` | The eight-class source and build search, with results |
| `docs/accessibility-report.md` | Automated results, and the manual checks that have **not** been done |
| `docs/performance-report.md` | Measured bytes, Lighthouse medians, the real-user monitoring plan |
| `docs/browser-device-matrix.md` | What was tested where, and what could not be |
| `docs/release-blockers.md` | Everything standing between this build and a release |
| `docs/metadata-matrix.md` | Per-route metadata and indexability |
| `docs/screenshots/tab-15/` | 1440×900 and 390×844 captures, stamped **CONCEPT UI** |
| `tests/e2e/__screenshots__/` | Visual-regression baselines at five widths |
