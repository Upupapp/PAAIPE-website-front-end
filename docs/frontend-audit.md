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

---

## 9. Tab 02 — brand system and exact assets

### Delivered

| Area                         | Outcome                                                                                                                                                                                                          |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colour                       | 11 raw palette tokens exactly as specified, plus semantic role tokens. `src/config/tokens.ts` is the single source of truth; `src/styles/tokens.css` mirrors it and a test asserts parity **in both directions** |
| Contrast                     | `CONTRAST_CONTRACT` — **33 required combinations, all passing**, measured by `npm run verify:contrast`. Plus 5 `FORBIDDEN_PAIRS` re-measured every run so a ban cannot outlive its reason                        |
| Typography                   | Fluid `clamp()` scale, display → caption. Body clamps at a 1rem floor, asserted by test. Prose capped at 68ch                                                                                                    |
| Spacing / radius / elevation | 4px base (asserted), 12–24px card radii (asserted), three ink-tinted shadows                                                                                                                                     |
| Logo                         | One `LogoLockup` component: variants, derived height, optical alignment, decorative mode, dark badge, priority                                                                                                   |
| Primitives                   | 14 components — see `docs/brand-usage.md` §8                                                                                                                                                                     |
| Decorative language          | `decor/NetworkField` — node field, orbit arcs, fine grid; `aria-hidden`, unfocusable, static                                                                                                                     |
| Component preview            | `/internal/style-guide`, rendering every primitive and both contrast tables from the same source the components use                                                                                              |

### Three measurements that changed the design

1. **White on `--paaipe-blue` is 4.14:1 — below AA.** An "electric-blue action"
   with a white label does not pass. Primary actions use navy (13.23:1); blue is
   the focus ring, an on-dark text colour and an accent. **B-11** offers PAAIPE
   the alternative: `#0872EE` is an 8% shift and reaches 4.51:1.
2. **`--paaipe-border` is 1.29:1 on white.** Decorative dividers only. Form
   control boundaries use `--paaipe-muted` (5.69:1), or they fail WCAG 1.4.11.
3. **Cyan 2.23:1 and gold 1.81:1 on white** — confirming the master command's own
   statement. On navy they reach 5.91:1 and 7.28:1, so they work as eyebrows and
   highlights on hero surfaces.

### Two real defects the gates caught

Both would have shipped silently:

1. **A loading button lost its accessible name.** `visibility: hidden` on the
   label kept the button width stable but removed the label from the
   accessibility tree; axe reported `button-name`. Fixed with `opacity: 0`.
2. **Scrollable tables were not keyboard-reachable**, WebKit only. Fixed by
   extracting `ui/ScrollRegion` (`tabindex="0"` + `role="region"` + required
   label) — which Tab 13 needs anyway for wide tables and code samples.

The second is the argument for running axe in **WebKit as well as Chromium**:
the Chromium run was already green when WebKit found it.

### Deliberately not done

- **The artwork was not cropped** to even up its asymmetric safe space — Tab 02
  forbids cropping. `align="optical"` compensates in CSS instead.
- **The Philippine map contour is not drawn.** Approximating a national outline
  is a credibility risk for a Philippine association; `NetworkField` exposes a
  `map` slot for an approved asset (B-6).
- **No dark-mode palette.** One light system is specified; inventing a second
  set of brand colours is out of scope.
- **No approved typeface.** A system stack is interim — local, zero network
  requests, one declaration to swap (B-5 / F-13).

### New items for PAAIPE

| id       | Item                                                                                                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B-10** | Status colours are **derived**, not brand: `#B3261E` / `#0F6E4F` / `#8A5A00`. Each clears 4.5:1 as text on white and as a surface under white text. Approve or replace |
| **B-11** | Electric blue cannot carry a white label (4.14:1). Accept navy primary actions, or approve `#0872EE` (4.51:1) to keep the electric-blue action                         |

### Commands and results

| Command                         | Result                                       |
| ------------------------------- | -------------------------------------------- |
| `npm run format:check` / `lint` | pass                                         |
| `npm run typecheck`             | 0 errors, 0 warnings                         |
| `npm run test`                  | **138 passed**                               |
| `npm run verify:brand`          | pass                                         |
| `npm run verify:contrast`       | **33 required pass, 5 bans still justified** |
| `npm run build`                 | 18 pages                                     |
| `npm run test:e2e`              | **105 passed, 1 skipped**                    |

Break-checks, each confirmed to fail then restored: a hex drifting in
`tokens.css` only; a failing pair added to the contract; a forbidden pair
silently becoming legal; a spacing step off the 4px base; body text below 16px.

---

## 10. Tab 03 — content architecture and static data

Full detail in [`content-architecture.md`](content-architecture.md).

### Delivered

| Area             | Outcome                                                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Types            | `Visibility`, `ContentStatus`, `ViewerState`, `PublicImage`, `ContentBlock`, `PublicEvent`, `PublicResource`, `ApprovedSpeaker`, `ApprovedPartner`, `Program`, `BenefitCategory`, `Faq`, `Policy`, `NavItem`, `SocialLink`, `MemberSynopsis`, `ExternalActionId` |
| Schemas          | One strict Zod schema per registry, parsed at **build time**. A bad record fails `astro build` with registry, index and field path                                                                                                                               |
| Registries       | 11 populated + 2 deliberately empty (speakers, partners)                                                                                                                                                                                                         |
| Content mode     | `production` (default) publishes `approved` only; `review` adds `sample` and allow-listed `draft`                                                                                                                                                                |
| External actions | One resolver for all six handoffs, with honest unavailable states                                                                                                                                                                                                |
| Tests            | 207 unit, 109 e2e                                                                                                                                                                                                                                                |

### The measurement that matters

**Nothing is `approved`.** Every event and resource fixture is `sample`, so:

| Build                        | Detail pages |
| ---------------------------- | ------------ |
| `npm run build` (production) | **0**        |
| `npm run build:review`       | **11**       |

A production build publishes `/events` and `/resources` index pages and nothing
beneath them. That is correct: PAAIPE has approved no article and no session.
Non-approved records are **stripped from the registry**, not hidden with CSS —
they are absent from the built HTML, asserted by a browser test that greps the
served page source.

### Cross-field invariants, all proved by breaking the build

Each was deliberately violated and confirmed to fail, then restored:

| Break                                    | Build said                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Sample resource claims `publishedAt`     | _Only approved content may claim a publication date._                                                 |
| Members-only resource gains `publicBody` | _…must expose only a synopsis. Public body copy would leak protected content into the client bundle._ |
| Key typo `titel:`                        | _Unrecognized key: "titel"_                                                                           |
| Sample event names a speaker             | _Only approved content may name a speaker._                                                           |
| `limited-capacity` without capacity data | _"Limited Capacity" may be shown only when real capacity data is configured._                         |

The third is why every schema is `.strict()`: a non-strict Zod object silently
**drops** unknown keys, so a typo would validate cleanly and the field would just
be missing at render time — the failure would look like missing content rather
than a bad key.

### A gate that failed against its own explanation

The scope scan for `zoom.us` / `meeting id` / `passcode` flagged the **comment**
in `events.ts` stating that no meeting URL, meeting ID or passcode exists.

The naive fix — strip everything after `//` — also deletes any line containing
`https://…`, which would silently hide a **real** leaked URL in a string
literal. That is a false negative in a security scan.

`src/lib/strip-comments.ts` tracks string, template and escape state and strips
comments only outside them. It has its own tests, and a break-check confirms
that with the stripper in place a planted `https://zoom.us/j/…` in a string
still fails the suite.

### Deliberately not done

- **Astro Content Collections.** This content is structured registries, not
  authored markdown. TS modules plus Zod give the same validation with less
  indirection, and a later swap is contained to `src/content/`.
- **The speaker and partner registries are empty**, and stay that way until
  PAAIPE approves a named party with usage rights.
- **No social link is rendered** — no account has been supplied, and a guessed
  handle could point at somebody else's profile.
- **No fabricated imagery.** `PublicImage` encodes the absence in the type, so a
  fixture cannot reference a file that does not exist.

### Commands and results

| Command                                    | Result                             |
| ------------------------------------------ | ---------------------------------- |
| `npm run typecheck`                        | 0 errors, 0 warnings               |
| `npm run test`                             | **207 passed**                     |
| `npm run verify:brand` / `verify:contrast` | pass                               |
| `npm run build`                            | 16 pages (production content mode) |
| `npm run build:review`                     | 27 pages                           |
| `npm run test:e2e`                         | **109 passed, 1 skipped**          |
