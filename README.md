# PAAIPE Public Information Portal — frontend

Public information website for the **Philippine Association of AI Professionals
and Entrepreneurs (PAAIPE)**.

> Building the Philippines’ AI-Powered Future—Together.

**Frontend only.** No backend, database, CMS, authentication, Members Portal or
mobile app is part of this repository. See [`docs/frontend-scope.md`](docs/frontend-scope.md).

## Prerequisites

- Node.js **24.x** (active LTS)
- npm 11+

## Install

```sh
npm ci
npx playwright install chromium webkit   # browser tests only
```

## Local development

```sh
npm run dev           # dev server
npm run build         # static production build - APPROVED content only
npm run build:review  # review build - also includes sample fixtures, visibly labelled
npm run preview       # serve dist/ in the foreground on :4321
```

`PUBLIC_CONTENT_MODE` defaults to `production` on purpose: a build with no
configuration must never accidentally publish review fixtures. Nothing is
approved yet, so a production build publishes **no** event or resource detail
pages — see [`docs/content-architecture.md`](docs/content-architecture.md).

## Checks

```sh
npm run check   # every gate below except the two that need a browser
```

Individually:

| Command                   | What it does                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run format:check`    | Prettier verification                                                                                   |
| `npm run lint`            | ESLint                                                                                                  |
| `npm run typecheck`       | `astro check` (strict TypeScript, includes `.astro` templates)                                          |
| `npm run test`            | Vitest unit tests                                                                                       |
| `npm run pending:check`   | `docs/PENDING.md` agrees with `src/config/pending.ts`                                                   |
| `npm run metadata:check`  | `docs/metadata-matrix.md` agrees with `src/config/routes.ts`                                            |
| `npm run verify:brand`    | Canonical logo SHA-256 gate, rendition sizes, and lossless-WebP pixel identity                          |
| `npm run verify:social`   | Re-composites the social card and compares pixels against the committed file                            |
| `npm run verify:contrast` | Every contrast pairing in the token contract                                                            |
| `npm run verify:leak`     | Scans the **built** bundle for secrets and private data, in both content modes                          |
| `npm run verify:seo`      | Scans the **built** HTML for the metadata matrix, in both content modes                                 |
| `npm run verify:budgets`  | Measures the build against all six performance budgets                                                  |
| `npm run verify:html`     | html-validate over the built output, both content modes                                                 |
| `npm run verify:links`    | Every internal link, fragment and asset in the build resolves                                           |
| `npm run audit:content`   | The Tab 15 content and brand audit, source and built output, both modes                                 |
| `npm run qa:check`        | The three generated QA documents agree with `src/config/qa.ts`                                          |
| `npm run handoff:check`   | The three generated handoff documents agree with their source                                           |
| `npm run release:gate`    | The conditional release gate, from a detached worktree at HEAD                                          |
| `npm run verify:deploy`   | Proves the Netlify build-skip allow-list, twice, and that the cost controls are still in `netlify.toml` |
| `npm run recordings`      | Default and reduced-motion screen recordings (needs `npm run preview`)                                  |
| `npm run test:e2e`        | Playwright, Chromium desktop + WebKit mobile, with axe-core                                             |
| `npm run lighthouse`      | Median of three mobile Lighthouse runs on three representative routes                                   |
| `npm run screenshots`     | 1440×900 desktop and 390×844 mobile evidence (needs `npm run preview` running)                          |

`npm run check` deliberately omits `test:e2e` and `lighthouse` so it does not
require browser binaries or minutes. Run both before handing a tab over.

`npm audit --omit=dev --audit-level=high` is a release step rather than part of
`check`: it queries the network, and a gate that fails when the network is down
teaches people to bypass gates. Last reading, 2026-09-03: 0 vulnerabilities.

## Configuration

Copy `.env.example` to `.env` and fill in the destinations you have.

Every value is **public** and inlined into the built client. Never put a secret,
token, private Zoom link or protected download URL here.

Every URL is optional. A missing destination renders an honest unavailable
state; a malformed one is treated as missing and reported at build time, so a
typo cannot ship as a dead link. Validation lives in
[`src/config/public-config.ts`](src/config/public-config.ts).

## Deployment cost

Netlify bills build minutes and bandwidth, and this repository is configured to
spend as few of both as it can. The controls are in
[`netlify.toml`](netlify.toml) and
[`scripts/netlify-ignore.mjs`](scripts/netlify-ignore.mjs), committed on purpose
— **a cost control that lives in a diff can be reviewed; one clicked into a
hosting console shows up nowhere.**

| Control                                       | What it saves                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Minimal build command                         | The gates run locally. Running them on Netlify would add **~3.5 minutes of billed time per deploy** to re-prove the same commit |
| Deploy previews and branch deploys suppressed | A preview build costs the same minutes as production. `npm run preview` is the free equivalent                                  |
| Build-skip hook                               | A commit that only touches documentation or tests cancels the build. **Measured on this repo's history: 5% of commits**         |
| Immutable caching on hashed assets            | The 80 KiB logo is on all fifteen pages; a repeat visitor re-downloads none of it                                               |

**The skip defaults to BUILD.** A wrongly-skipped build means a real fix
silently never ships, and the log shows a cheerful "build cancelled" that nobody
investigates. `npm run verify:deploy` proves the allow-list twice — a
byte-identical rebuild _and_ an import-graph walk — because a newline in a
`.ts` file is dead code, so the byte proof alone is not enough.

Full detail, including what this does **not** do: [`docs/deployment-cost.md`](docs/deployment-cost.md).

**Nothing is deployed.** No Netlify site is linked to this remote, so
`netlify.toml` is inert, and nothing has been pushed at all.

## Handoff

The full review package for PAAIPE. Start with the release gate — it is the one
document that says whether this is releasable, and today it says **BLOCKED**.

- [`docs/release-gate.md`](docs/release-gate.md) — **generated by
  `npm run release:gate`**, from a detached worktree at a committed SHA. It
  separates what was CERTIFIED from what is BLOCKED and never merges the two.
- [`docs/architecture.md`](docs/architecture.md) — framework, rendering model,
  content flow, progressive enhancement, and what is deliberately absent.
- [`docs/route-content-map.md`](docs/route-content-map.md) — every route, its
  H1, where that copy came from, and what still needs approval.
- [`docs/configuration.md`](docs/configuration.md) — every public config name,
  its format, and what happens when it is absent.
- [`docs/integration-contracts.md`](docs/integration-contracts.md) — nine future
  adapters, **documented and not implemented**.
- [`docs/motion-haptics.md`](docs/motion-haptics.md) — tokens, reduced motion,
  support and fallback, and the measured limits.
- [`docs/social-preview-contact-sheet.md`](docs/social-preview-contact-sheet.md)
  — what every route sends to a social platform.
- [`docs/recordings/`](docs/recordings/) — the same walk in default and
  reduced-motion modes. The comparison is the evidence.

**The release gate fails while any owner input is missing, and that is the
design.** Owner ruling 2026-09-04: ship the machinery, and let the machinery
refuse the release. It exits non-zero, names each unmet input on its own row,
and flips a row green with no code change when the input arrives.

## Testing and QA

- [`docs/qa-report.md`](docs/qa-report.md) — the executive summary, the defect
  policy with the gate that detects each class, and the full command list.
- [`docs/release-blockers.md`](docs/release-blockers.md) — everything standing
  between this build and a release.
- [`docs/browser-device-matrix.md`](docs/browser-device-matrix.md) — what was
  tested where, and what could not be.
- [`docs/content-brand-audit.md`](docs/content-brand-audit.md) — the eight-class
  search of source and built output.
- [`docs/accessibility-report.md`](docs/accessibility-report.md) — automated
  results, and the manual checks that have **not** been done.
- [`docs/html-validation.md`](docs/html-validation.md) — the validator config and
  why each rule is set the way it is.

Browser tests run in **four** engine projects: Chromium desktop, Firefox
desktop, WebKit desktop and WebKit mobile. Visual regression runs in Chromium
only, at 320/390/768/1024/1440 — a pixel baseline is engine-specific, and
cross-engine differences are caught by the geometry assertions, which do run
everywhere.

**No test is skipped, weakened or excluded to make a tab pass.**
`TEST_EXCEPTIONS` in `src/config/qa.ts` is empty, and a test would need a named
owner, a rationale, a scope, a risk, a remediation date and an expiry to go in it.

## SEO, performance and security

- [`docs/metadata-matrix.md`](docs/metadata-matrix.md) — generated per-route
  title, description, indexability and social copy, plus what is deliberately
  absent and why.
- [`docs/performance-report.md`](docs/performance-report.md) — measured bytes
  against every budget, the median-of-three Lighthouse numbers, and the
  real-user monitoring plan.
- [`docs/security-privacy-handoff.md`](docs/security-privacy-handoff.md) — the
  recommended production headers, CSP, caching, dependency policy and privacy
  posture for whoever operates the hosting.

**`PUBLIC_SITE_URL` is not set**, so no canonical URL, `og:url`, `og:image` or
`sitemap.xml` is emitted, and `twitter:card` is `summary`. Each needs an
absolute URL, and a guessed origin would be worse than none — a wrong canonical
de-indexes the real page. Set the variable and all of it appears with no code
change; the configured state is covered by `src/tests/seo.test.ts`, since no
build on a developer machine reaches it.

## Brand assets

`public/brand/` holds only the two canonical logo files, gated by their SHA-256.
Do not optimise, resize, recolour, crop or regenerate them — any byte change
fails the gate.

`public/brand/renditions/` holds proportional downscales for real placements —
same artwork, fewer pixels, every scale factor exact. Regenerate with
`npm run brand:renditions`.

The supplied logos do not match the checksums printed in the master command.
Owner ruling 2026-09-03: **the supplied logos are authoritative** and the
document's checksums are stale. The gate reports the divergence on every run.
See `docs/frontend-audit.md` §8.

## Implementation status

Built against the PAAIPE Public Information Portal Frontend Master Command,
one tab at a time.

| Tab | Scope                                               | Status       |
| --- | --------------------------------------------------- | ------------ |
| 01  | Audit, scope and bootstrap                          | **Complete** |
| 02  | Brand system and exact assets                       | **Complete** |
| 03  | Content architecture and static data                | **Complete** |
| 04  | Global shell, navigation and footer                 | **Complete** |
| 05  | Home page                                           | **Complete** |
| 06  | About and programs                                  | **Complete** |
| 07  | Events and speakers                                 | **Complete** |
| 08  | Resources and insights                              | **Complete** |
| 09  | Membership and benefits                             | **Complete** |
| 10  | Partners, responsible AI, contact and legal         | **Complete** |
| 11  | Motion, animation and visual effects                | **Complete** |
| 12  | Web haptics and microinteractions                   | **Complete** |
| 13  | Responsive design and accessibility                 | **Complete** |
| 14  | SEO, social sharing, performance, security, privacy | **Complete** |
| 15  | Testing, QA and content integrity                   | **Complete** |
| 16  | Frontend handoff and release gate                   | **Complete** |

**Every public route now renders real content** from the typed content
registry — Tabs 01–10 are complete. The remaining tabs refine motion,
accessibility, SEO, testing and handoff rather than adding pages. No invented statistic,
speaker, partner, testimonial, offer or date appears anywhere.

The design system is live at **`/internal/style-guide`** — every primitive in
every state, the token scales, and the measured contrast for every combination
the components use. It is `noindex` and never linked from public navigation.
See [`docs/brand-usage.md`](docs/brand-usage.md),
[`docs/content-architecture.md`](docs/content-architecture.md) and
[`docs/shell-and-navigation.md`](docs/shell-and-navigation.md) and
[`docs/cta-destinations.md`](docs/cta-destinations.md).

## Not deployed

This repository is not connected to any hosting, domain or production service,
and must not be until PAAIPE issues a separate written release command.
