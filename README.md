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
npm run check      # format:check + lint + typecheck + test + verify:brand + build
```

Individually:

| Command                | What it does                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `npm run format:check` | Prettier verification                                                          |
| `npm run lint`         | ESLint                                                                         |
| `npm run typecheck`    | `astro check` (strict TypeScript, includes `.astro` templates)                 |
| `npm run test`         | Vitest unit tests                                                              |
| `npm run test:e2e`     | Playwright, Chromium desktop + WebKit mobile, with axe-core                    |
| `npm run verify:brand` | Canonical logo SHA-256 gate                                                    |
| `npm run screenshots`  | 1440×900 desktop and 390×844 mobile evidence (needs `npm run preview` running) |

`npm run check` deliberately omits `test:e2e` so it does not require browser
binaries. Run `npm run test:e2e` before handing a tab over.

## Configuration

Copy `.env.example` to `.env` and fill in the destinations you have.

Every value is **public** and inlined into the built client. Never put a secret,
token, private Zoom link or protected download URL here.

Every URL is optional. A missing destination renders an honest unavailable
state; a malformed one is treated as missing and reported at build time, so a
typo cannot ship as a dead link. Validation lives in
[`src/config/public-config.ts`](src/config/public-config.ts).

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
| 06  | About and programs                                  | Not started  |
| 07  | Events and speakers                                 | Not started  |
| 08  | Resources and insights                              | Not started  |
| 09  | Membership and benefits                             | Not started  |
| 10  | Partners, responsible AI, contact and legal         | Not started  |
| 11  | Motion, animation and visual effects                | Not started  |
| 12  | Web haptics and microinteractions                   | Not started  |
| 13  | Responsive design and accessibility                 | Not started  |
| 14  | SEO, social sharing, performance, security, privacy | Not started  |
| 15  | Testing, QA and content integrity                   | Not started  |
| 16  | Frontend handoff and release gate                   | Not started  |

The **home page** is complete: all eleven required sections, rendering only from
the content registry. Every other page carries the real global shell —
announcement bar, sticky header with responsive navigation, grouped footer — with
a route scaffold body: the approved `<h1>` and a note naming the tab that owns
its content. No invented statistic,
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
