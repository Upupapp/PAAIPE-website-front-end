# Architecture

The PAAIPE public information portal frontend. What it is built from, how a page
comes to exist, and which decisions are load-bearing.

---

## 1. Framework and rendering model

**Astro 7.2.10, `output: 'static'`.** Every public route is prerendered to HTML
at build time. There is no server runtime, no client-side router owning
navigation, and no framework component tree.

That choice is not incidental. The brief is a public information portal for a
professional association: the content is small, mostly static, and read far more
often than it changes. A static build means a visitor on a mid-range Android
phone over mobile data downloads HTML that is already finished — the worst-case
route is **104 KiB** of initial transfer against a 1 MiB budget, of which about
78% is one logo image.

|               |                                                                           |
| ------------- | ------------------------------------------------------------------------- |
| Framework     | Astro 7.2.10                                                              |
| Output        | `static` — prerendered HTML, no server runtime                            |
| Language      | TypeScript 6.0.3, strict                                                  |
| Styling       | Scoped component CSS over custom-property design tokens. No CSS framework |
| Validation    | Zod 4.5.4, `.strict()` on every object                                    |
| Unit tests    | Vitest 4.1.11                                                             |
| Browser tests | Playwright 1.62.1 + `@axe-core/playwright`, five projects                 |
| Node          | 24.19.0                                                                   |

**TypeScript is pinned to 6.0.3, not 7.** `@astrojs/check@0.9.10` declares a peer
range of `^5 || ^6`, and TypeScript 7 fails `npm install` resolution. Revisit
when `@astrojs/check` catches up.

---

## 2. How a page comes to exist

```
src/config/routes.ts        the route registry — path, title, H1, indexability
        │
        ├─→ src/pages/*.astro         one file per route, asserted against the registry
        │           │
        │           ├─→ src/components/BaseLayout.astro
        │           │        derives EVERY meta tag from the registry path
        │           │
        │           └─→ src/components/…    presentational only
        │
        └─→ src/content/index.ts    validates every registry at MODULE LOAD
                    │
                    └─→ src/content/*.ts    the typed content registries
```

Three properties fall out of this shape, and each is asserted by a test:

**A page composes approved copy; it never authors it.** Every string comes from
`src/content/`. `src/tests/scope-boundary.test.ts` scans source for copy written
into a template.

**Content is validated at build time, not at render time.** `src/content/index.ts`
runs every registry through its Zod schema when the module loads, which happens
during the build. An invalid record therefore **fails the build** — there is no
runtime path where a malformed record reaches a page.

**Metadata is derived, not passed.** A page hands `BaseLayout` its registry
_path_. Titles, descriptions, canonicals, robots directives and social tags are
all computed from that. No page can ship with a missing canonical or a stale
description, because no page is in a position to supply one.

---

## 3. The content model

Two independent axes decide what renders:

- **`visibility`** — `public` or `members-only`. Who the content is _for_.
- **`contentStatus`** — `approved`, `draft` or `sample`. Whether it may be
  _published_.

They do not collapse into one boolean. A members-only record can be approved; a
public record can be a sample.

**`PUBLIC_CONTENT_MODE`** decides which statuses a build may publish:

| Mode                   | Publishes                                                           | Used for                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `production` (default) | `approved` only                                                     | The real site. Sample and draft records are **absent from the HTML** — not hidden with CSS                                              |
| `review`               | `approved` + `sample`, and `draft` only from an explicit allow-list | Reviewer builds. Every non-approved record renders a visible status label, every page is `noindex`, and robots.txt disallows everything |

The default is the safe one on purpose: an unconfigured build cannot publish
fixtures.

**Nothing is currently `approved`.** A production build therefore renders **zero**
event and resource detail pages. That is the gate working, not a gap.

### The privacy boundary is a type

For a members-only record, `publicEventFields()` and `publicResourceFields()`
return objects that **do not carry** the private fields at all — no
`speakerName`, no `duration`, no `body` key. A template cannot leak them by
forgetting to omit them, because there is nothing to omit.

The same idea runs through the codebase:

- the `unavailable` branch of the external-action resolver has **no `href`
  field**, so a missing destination cannot become a dead link;
- `PublicImage` is a union whose `placeholder` arm carries no `src`, so a
  fixture cannot reference a file that does not exist;
- preference keys and values are closed unions, so an arbitrary value cannot be
  written to storage.

**Make the guarantee unrepresentable rather than merely enforced.**

---

## 4. Progressive enhancement

The site works with JavaScript disabled. Everything below is an enhancement on
top of a page that already functions.

| Enhancement                     | Without JavaScript                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Mobile navigation drawer        | The same list renders as a plain stacked nav. Every link is a real `<a href>` in the initial HTML                                    |
| Sticky header                   | The header is static. Stickiness is gated on `html.js` — without it the header contains the whole nav and would consume the viewport |
| Announcement dismissal          | The bar renders; the dismiss button is `hidden` and never appears                                                                    |
| Motion and scroll reveals       | Content is visible at rest. Nothing is hidden waiting for a reveal that will not come                                                |
| View Transitions                | Astro's `ClientRouter` with `fallback="none"` — an unsupported browser simply navigates                                              |
| Filters on events and resources | Not rendered while their lists are empty; a control that can only do nothing is not shown                                            |
| Copy-link control               | Ships disabled; enabled only where the Clipboard API exists                                                                          |
| Haptics                         | Off by default, offered only where the Vibration API exists                                                                          |

`tests/e2e/journeys.spec.ts` loads routes with `javaScriptEnabled: false` and
asserts that no enabled control is rendered that could not act.

### The client bundle

Route JavaScript peaks at **10.2 KiB compressed**, of which the motion layer is
2.0 KiB. There is no island, no hydration, and no framework runtime. The scripts
are: the shell (drawer, sticky header, announcement), the motion layer, the
preference panel, two filter controls and the copy control.

One inline script runs in `<head>`: it sets `class="js"` and applies stored
motion preferences **before first paint**. Moving it out of the document would
reintroduce the flash it exists to prevent — the motion layer would start,
animations would begin, and the override would cancel them mid-flight, for
exactly the person who asked for less motion.

---

## 5. The design system

**Tokens are the single source of truth.** `src/config/tokens.ts` holds the
palette, spacing, radii, elevation, type scale and motion values;
`src/styles/tokens.css` mirrors it as custom properties. A **bidirectional**
parity test asserts both directions — and asserts the parser matched more than
50 properties, because a parity check that matches nothing passes.

**The contrast contract is measured, not asserted.** 37 required pairings, each
re-measured on every run, plus **6 forbidden pairings that are also re-measured**
— the gate fails if a prohibition has quietly become legal. A ban that outlives
its reason is invisible otherwise.

That contract changed the design: white on the brand electric blue measures
**4.14:1**, below AA, so the primary action fill is navy and blue became the
focus ring and on-dark accent (**B-11**).

**Components are presentational.** `src/components/ui/` holds 25 primitives with
no content knowledge. `src/components/shell/` holds the global chrome. Domain
folders (`events/`, `resources/`, `home/`) compose primitives with registry data.

---

## 6. What is deliberately absent

| Not used                                            | Why                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| A CSS framework                                     | The design system is 11 approved colours and a token scale. A framework would add weight and a second vocabulary |
| A UI component library                              | Same reason, plus every primitive here carries accessibility decisions specific to this brief                    |
| Astro Content Collections                           | This is structured registry data, not authored markdown. Zod at module load gives stronger guarantees            |
| Client-side data fetching                           | Nothing to fetch. The site is static and front end only                                                          |
| A state management library                          | There is no shared client state beyond three accessibility preferences in `localStorage`                         |
| `.github/workflows`                                 | Standing repository rule: no CI workflow that consumes tokens. Every gate runs locally through `npm run check`   |
| Analytics, pixels, session replay, consent platform | None is approved. `npm run verify:budgets` **fails** on an analytics endpoint                                    |

---

## 7. Gates, and why they read the artifact

Seventeen gates run in `npm run check`. The ones that matter most read the
**built output**, not the source:

- `verify:leak` scans `dist/` for secrets and private data, in **both** content
  modes — production alone publishes no detail pages, so scanning it alone would
  pass by having nothing to scan;
- `verify:seo` asserts the metadata matrix against the built HTML. A unit test
  can prove `pageSeo()` returns the right object; it cannot prove the layout
  renders it, and in Tab 14 it did not;
- `verify:html`, `verify:links` and `audit:content` likewise run in both modes.
  Two of Tab 15's three findings existed **only** in the review build.

Documents that restate configuration are **generated** with drift guards
(`docs/PENDING.md`, `metadata-matrix.md`, `qa-report.md`,
`browser-device-matrix.md`, `release-blockers.md`, `route-content-map.md`,
`configuration.md`, `social-preview-contact-sheet.md`). The two hand-written
tables in this repository went three and seven tabs stale before anyone noticed.

---

## 8. Directory map

```
src/
  config/      routes, tokens, brand, budgets, qa, release, public-config, pending
  content/     typed registries + Zod schemas, validated at module load
  lib/         pure, browser-free modules: seo, color, events, resources,
               preferences, haptics, external-action, content-visibility
  components/  BaseLayout, RouteScaffold, LogoLockup
    shell/     header, footer, navigation, announcement, 404
    ui/        25 presentational primitives
    events/ resources/ home/ decor/
  pages/       one file per route; `internal/[guide].astro` builds in review only
  scripts/     client enhancement, all `export {}` to keep them modules
  styles/      tokens.css, motion.css, global.css
  tests/       24 unit suites
tests/e2e/     routes, accessibility, seo, journeys, visual (+ baselines)
scripts/       build, verification and generation scripts
docs/          the handoff pack
```
