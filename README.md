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

| Command                   | What it does                                                                   |
| ------------------------- | ------------------------------------------------------------------------------ |
| `npm run format:check`    | Prettier verification                                                          |
| `npm run lint`            | ESLint                                                                         |
| `npm run typecheck`       | `astro check` (strict TypeScript, includes `.astro` templates)                 |
| `npm run test`            | Vitest unit tests                                                              |
| `npm run pending:check`   | `docs/PENDING.md` agrees with `src/config/pending.ts`                          |
| `npm run metadata:check`  | `docs/metadata-matrix.md` agrees with `src/config/routes.ts`                   |
| `npm run verify:brand`    | Canonical logo SHA-256 gate, rendition sizes, and lossless-WebP pixel identity |
| `npm run verify:social`   | Re-composites the social card and compares pixels against the committed file   |
| `npm run verify:contrast` | Every contrast pairing in the token contract                                   |
| `npm run verify:leak`     | Scans the **built** bundle for secrets and private data, in both content modes |
| `npm run verify:seo`      | Scans the **built** HTML for the metadata matrix, in both content modes        |
| `npm run verify:budgets`  | Measures the build against all six performance budgets                         |
| `npm run test:e2e`        | Playwright, Chromium desktop + WebKit mobile, with axe-core                    |
| `npm run lighthouse`      | Median of three mobile Lighthouse runs on three representative routes          |
| `npm run screenshots`     | 1440×900 desktop and 390×844 mobile evidence (needs `npm run preview` running) |

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
| 15  | Testing, QA and content integrity                   | Not started  |
| 16  | Frontend handoff and release gate                   | Not started  |

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
