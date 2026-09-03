# Frontend audit — Command 01

Repository: `Upupapp/PAAIPE-website-front-end` (public)
Audited: 2026-09-03 · Node v24.19.0 · npm 11.17.0 · macOS (darwin 25.6.0)

---

## 1. State of the repository before this command

| Item                            | Finding                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Remote                          | `https://github.com/Upupapp/PAAIPE-website-front-end.git` — resolves, **public**, readable without auth |
| Refs                            | `git ls-remote` returned **zero refs**                                                                  |
| Default branch                  | `main`, with no commits                                                                                 |
| Working tree                    | Empty apart from `.git` after clone                                                                     |
| Existing stack                  | None                                                                                                    |
| User-owned or unrelated changes | **None existed.** Nothing was overwritten, reset or discarded                                           |

The project is genuinely greenfield, so the master command's greenfield
preference applies rather than its "preserve the existing stack" branch.

## 2. Stack selected

| Concern       | Choice                                                                                                             | Why                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Framework     | **Astro 7.2.10**                                                                                                   | Current stable release; matches the brief's Astro 7.x preference                                                    |
| Rendering     | `output: 'static'`                                                                                                 | Prerendered semantic HTML, no server runtime                                                                        |
| Runtime       | **Node 24.19.0**                                                                                                   | Node 24 is the active LTS line                                                                                      |
| Language      | TypeScript, `astro/tsconfigs/strict` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax` | Strict, and `no-explicit-any` is an eslint **error** so an `any` cannot land without an explicit, commented disable |
| CSS           | Scoped CSS with custom-property tokens (`src/styles/tokens.css`)                                                   | No CSS framework; Tab 02 replaces the token file                                                                    |
| Islands       | None yet                                                                                                           | Added only for genuinely stateful controls                                                                          |
| Unit tests    | Vitest 4.1.11                                                                                                      |                                                                                                                     |
| Browser tests | Playwright 1.62.1 + `@axe-core/playwright` 4.13.0                                                                  | Chromium desktop and **WebKit** mobile                                                                              |
| Lint / format | ESLint 10.9.1 (+ `eslint-plugin-astro`), Prettier 3.9.6                                                            |                                                                                                                     |

All dependency versions are **pinned exactly** (no `^`/`~`) and
`package-lock.json` is committed.

## 3. What was built

### Project structure

| Path             | Contents                                                                      |
| ---------------- | ----------------------------------------------------------------------------- |
| `src/pages`      | Public routes (Astro's routing directory; the brief's `src/app or src/pages`) |
| `src/components` | `BaseLayout.astro`, `RouteScaffold.astro`                                     |
| `src/content`    | `placeholders.ts` — Tab 01 scaffolding, deleted by Tab 03                     |
| `src/config`     | `site.ts`, `brand.ts`, `routes.ts`, `public-config.ts`, `index.ts`            |
| `src/styles`     | `tokens.css`, `global.css`                                                    |
| `src/lib`        | Frontend-only utilities (empty; nothing needed yet)                           |
| `src/tests`      | Vitest unit tests                                                             |
| `tests/e2e`      | Playwright browser tests                                                      |
| `public/brand`   | Canonical PAAIPE logo files only, checksum-gated                              |
| `public/media`   | Approved public imagery (empty — none supplied)                               |
| `scripts`        | `verify-brand-assets.mjs`, `preview-server.mjs`, `capture-screenshots.mjs`    |
| `docs`           | This audit, scope, screenshots                                                |

### Routes

All 17 required routes exist and direct-load with a 200, their own `<title>`
and exactly one `<h1>` in `main`. The registry (`src/config/routes.ts`) is the
single source of truth and is asserted against the pages on disk.

Headings are the **approved copy** from the tab that owns each page (recorded
per route as `headingSource`), so later tabs refine rather than replace them.

`/events/[slug]` and `/resources/[slug]` are static-built from one
self-describing placeholder slug, `template-preview`, and carry
`<meta name="robots" content="noindex">`. A statically built dynamic route
needs at least one path to exist at all; no event, date, speaker, article,
author or download is represented. Tab 03 replaces both.

`/dashboard`, `/community`, `/profile` and `/login` do not exist, and a test
fails if any page appears that is not in the registry.

### Configuration

The seven required names are read **only** through
`src/config/public-config.ts`:

```
PUBLIC_SITE_URL
PUBLIC_MEMBERSHIP_APPLICATION_URL
PUBLIC_MEMBER_PORTAL_URL
PUBLIC_APPLICATION_STATUS_URL
PUBLIC_SPEAKER_INTEREST_URL
PUBLIC_PARTNERSHIP_INTEREST_URL
PUBLIC_CONTACT_EMAIL
```

Behaviour:

- Every value is optional. A missing URL never crashes the build or a page.
- Only absolute `https://` URLs are accepted. `#`, `javascript:`, empty strings,
  relative paths, `mailto:` and plain `http://` are all rejected.
- **A malformed value is treated as absent**, not passed through. A typo
  therefore renders the honest unavailable state instead of shipping as a dead
  link, and is reported at build time.
- `.env.example` contains public placeholders only. No live credential or token
  is committed, and `.env` is git-ignored.

## 4. Commands run and results

| Command                             | Result                                                       |
| ----------------------------------- | ------------------------------------------------------------ |
| `npm install`                       | 386 packages, **0 vulnerabilities**                          |
| `npm run format:check`              | pass                                                         |
| `npm run lint`                      | pass, 0 errors, 0 warnings                                   |
| `npm run typecheck` (`astro check`) | **0 errors, 0 warnings, 0 hints** across 32 files            |
| `npm run test` (Vitest)             | **35 passed / 35**                                           |
| `npm run verify:brand`              | pass against pinned hashes, with the B-1 divergence reported |
| `npm run build`                     | **17 pages built**                                           |
| `npm run test:e2e` (Playwright)     | **93 passed, 1 skipped** (Chromium desktop + WebKit mobile)  |

The one skip is deliberate: keyboard tab-order traversal runs on the desktop
project only. Emulated mobile WebKit has no keyboard focus ring, so running it
there would measure the harness and report a defect that does not exist.

### Gate break-checks

Every gate was deliberately broken to prove it fails, then restored:

| Break                                                         | Gate                | Result                            |
| ------------------------------------------------------------- | ------------------- | --------------------------------- |
| Appended one byte to the square logo                          | `verify:brand`      | exit 1, SHA-256 mismatch reported |
| Added an extra `paaipe-logo-v2.png` to `public/brand/`        | `verify:brand`      | exit 1, "unexpected file"         |
| Added `src/pages/login.astro`                                 | route registry test | exit 1                            |
| Changed the slogan's typographic apostrophe to a straight one | identity test       | exit 1                            |
| Added `api_key: "sk-live-…"` to `src/lib/`                    | scope-boundary test | exit 1                            |

After restore: `npm run test` 35/35, brand hashes byte-identical to the
supplied files.

## 5. Blockers and items needing PAAIPE approval

| id      | Owner        | Item                                                                                                                                                                                                                                                                                                                          |
| ------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~B-1~~ | **RESOLVED** | **Logo checksums.** Owner ruling 2026-09-03: _"logos i uploaded are the logos to be used"_. The supplied files are authoritative and the master command's `fd142bbe…` / `1e87fd4c…` are stale. The gate is pinned to the supplied files' hashes (`88f91f0e…`, `f332dc8c…`) and still prints the divergence every run. See §8. |
| **B-2** | PAAIPE       | **Title separator conflict.** The Tab 14 metadata baseline uses a hyphen (`PAAIPE - Filipino AI Professionals and Entrepreneurs`); Tabs 05–10 use a pipe (`PAAIPE \| Filipino AI Professionals and Entrepreneurs`). Tab 14 is the stated "route metadata baseline", so the hyphen form is used. Confirm.                      |
| **B-3** | PAAIPE       | **Titles absent from the Tab 14 baseline**, derived here in the house style and marked `titleSource: 'derived'` in the registry: `/benefits`, `/events/[slug]`, `/resources/[slug]`, `/404`. (`/speakers` and `/responsible-ai` use titles given in Tabs 07 and 10, converted to the hyphen separator per B-2.)               |
| **B-4** | PAAIPE       | **No external destination is configured.** None of the seven public URLs/email is known, so every handoff will render an unavailable state. Needed before Tab 09 and Tab 10 can be signed off.                                                                                                                                |
| **B-5** | PAAIPE       | **No approved typeface.** A system sans-serif stack is in place as a 16px-floor baseline. Tab 02 needs the approved font with a licence permitting self-hosted WOFF2 delivery.                                                                                                                                                |
| **B-6** | PAAIPE       | **No approved public imagery.** `public/media/` is empty. The hero Philippine map / network composition and any editorial photography need supplied assets with confirmed usage rights.                                                                                                                                       |
| **B-7** | PAAIPE       | **Production origin unknown.** `PUBLIC_SITE_URL` has no real value, so `site`, canonical URLs and the sitemap are deferred to Tab 14.                                                                                                                                                                                         |
| **B-8** | PAAIPE       | **Hosting and release ownership unnamed** (Tab 16 gate). No deployment has been configured and none will be without a separate written release command.                                                                                                                                                                       |
| **B-9** | PAAIPE       | **Legal text.** `/privacy` and `/terms` remain draft-only pages and must carry their DRAFT FOR REVIEW banners in Tab 10. No boilerplate has been written.                                                                                                                                                                     |

## 6. Assumptions recorded

| id  | Assumption                                                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 | Greenfield, so the Astro/static/Node-24 preference applies. Nothing was replaced.                                                                                                                                                                                                                                      |
| A-2 | **TypeScript is pinned to 6.0.3, not 7.0.2.** `@astrojs/check@0.9.10` declares a peer range of `^5.0.0 \|\| ^6.0.0`; TS 7 fails resolution. Revisit when `@astrojs/check` supports TS 7.                                                                                                                               |
| A-3 | Dynamic routes build from the placeholder slug `template-preview`, marked `noindex`, removed by Tab 03.                                                                                                                                                                                                                |
| A-4 | Document language is `en-PH`.                                                                                                                                                                                                                                                                                          |
| A-5 | `astro preview` **daemonizes when stdout is not a TTY** and its launcher exits 0, which Playwright reports as "webServer exited early". `scripts/preview-server.mjs` is a zero-dependency foreground replacement that also returns a real 404 status, so the protected-route and soft-404 checks test what they claim. |
| A-6 | **No `.github/workflows` is added**, per the standing repository rule that no CI workflow consuming tokens may be created. All gates run locally through `npm run check`.                                                                                                                                              |
| A-7 | The header, navigation and footer in `BaseLayout.astro` are a deliberate minimum. Tab 04 owns the real shell.                                                                                                                                                                                                          |

## 7. Known limitations of this command's evidence

- The scope scans in `src/tests/scope-boundary.test.ts` read **source**, not the
  built bundle. Tab 15 must scan `dist/` as well; a source scan alone is not
  proof that the shipped output is clean.
- axe-core ran on route shells that carry almost no content. A clean scan here
  is a floor, not evidence of WCAG 2.2 AA conformance. Tab 13 owns that.
- No performance budget has been measured. Tab 14 owns it.
- Screenshots in `docs/screenshots/tab-01/` are **Concept UI** and show route
  shells only.

---

## 8. Logo dimensions — measurement and adjustment (owner instruction, 2026-09-03)

**Ruling received:** _"logos i uploaded are the logos to be used. adjust them
dimensions wise to comply to the brief"_. B-1 is closed on that basis: the
supplied files are authoritative and the checksums printed in the master command
are stale. The gate still reports the divergence on every run so the decision
stays visible rather than disappearing into a passing check.

### What was actually non-compliant

Measured from the alpha channel, not assumed:

|            | Canvas      | Visible artwork                        | Padding L / T / R / B        | Weight  |
| ---------- | ----------- | -------------------------------------- | ---------------------------- | ------- |
| Square     | 2000 × 2000 | **1464 × 1747 — portrait, not square** | 269 / **81** / 267 / **172** | 1.35 MB |
| Horizontal | 1800 × 627  | 1626 × 540                             | **54** / 45 / **120** / 42   | 480 KB  |

Two real failures against the brief:

1. **Weight.** 1.8 MB of logo, against Tab 14's 1 MiB initial-transfer budget
   and 250 KiB per-image budget. Delivering a 2000 × 2000 PNG into a ~40px
   header slot fails on its own.
2. **Asymmetric baked-in safe space.** The square artwork sits 91px above its
   canvas centre; the horizontal sits 33px left of centre, with right padding
   more than double the left.

### What was done

- **Canonical originals kept byte-identical** in `public/brand/`, SHA-256
  gated. They remain the source of record and are still available to any
  placement that wants the untouched file.
- **Proportional renditions generated** into `public/brand/renditions/` by
  `npm run brand:renditions`: 600 × 209 horizontal, and 512 / 256 / 180 square.
  Each is a whole-file downscale — same artwork, same colours, same safe space,
  fewer pixels. Nothing is redrawn, recoloured, cropped, traced, regenerated or
  separated from the lockup.
- **Every scale factor is exact.** Verified by cross-multiplication
  (`w1·h2 === w2·h1`) rather than a float comparison, so no rendition distorts
  the artwork. Measured ratio drift: **0.000000%** on all four.
- **All four renditions total 324 KiB** versus 1.8 MB. A page using the header
  lockup plus a touch icon costs ~110 KiB.
- **The gate now covers both tiers**: canonical files by exact hash; renditions
  by exact pixel dimensions plus the 250 KiB budget. An unexpected file in
  either directory fails.

### What was deliberately NOT done, and why

**The artwork was not cropped to even up the safe space.** Tab 02 states plainly:
_"Do not redraw, approximate, recolor, crop, trace, clean up, or regenerate any
logo."_ Trimming the transparent margin would even out the padding but is
exactly the operation the brief forbids, and it would change the artwork's
relationship to its own safe space.

Instead the measured geometry is recorded in `src/config/brand.ts` —
`artworkBox` and `padding` per canonical logo — so Tab 02 can compensate
**optically in CSS** at each placement. A test asserts the two stay consistent
with each other, so one cannot be edited without the other.

**Consequence for Tab 02 to handle:** a favicon or badge that assumes the square
file contains centred 1:1 artwork will render low-heavy. It does not — it
contains portrait artwork above centre.

### Assumption stated

The brief also says _"Do not process the logo through an image optimizer that
alters its bytes; let the browser/framework deliver the original file with
declared dimensions."_ Read literally that forbids any rendition. It is read
here as guarding against a **build pipeline silently re-encoding** the logo and
changing how it looks — not as a ban on deliberate, documented, exactly
proportional, gated downscales, which the owner's instruction to "adjust them
dimensions wise" directly calls for. The canonical originals are untouched, so
this is fully reversible: delete `renditions/` and reference the originals.
Astro's automatic image optimisation is **not** applied to these files.
