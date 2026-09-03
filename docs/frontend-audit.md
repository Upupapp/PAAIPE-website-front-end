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

---

## 11. Tab 04 — global shell, navigation and footer

Full detail in [`shell-and-navigation.md`](shell-and-navigation.md).

### Delivered

Skip link, announcement bar, sticky header, responsive navigation with a mobile
drawer, grouped footer, branded 404, plus `PageHero`, `CTASection`,
`EmptyState` and `Breadcrumbs`. Every navigation link is a real `<a href>` in
the initial HTML.

### Four real defects the gates caught

Every one would have shipped, and none was visible by looking at the page:

1. **The no-JS menu button rendered and did nothing.** `[hidden]` gets
   `display: none` from the UA stylesheet, but **any** author `display` rule
   outranks it — and `.site-header__toggle { display: grid }` did. Fixed with a
   global `[hidden] { display: none !important }`. Caught by a browser test run
   with `javaScriptEnabled: false`.
2. **Two links claimed `aria-current="page"`.** A destination appeared twice in
   the nav — `/about` as both parent and child, `/programs` as both a top-level
   item and a child of About. Ambiguous to announce. Fixed in the nav data, and
   a unit test now asserts every href appears exactly once, catching the class
   at the source rather than in a browser.
3. **Opening the mobile drawer left focus on the toggle.** `visibility` was
   transitioned symmetrically, so the drawer was still `visibility: hidden`
   while sliding in — and `focus()` on a hidden element **silently does
   nothing**. Fixed by flipping `visibility` instantly on open and delaying it
   only on close.
4. **The screenshot tool was lying.** Tab 04's first evidence showed both header
   dropdowns open while the page was correct at rest. The first diagnosis — a
   `fullPage` capture re-triggering hover — was **wrong**; parking the pointer
   did not fix it. Measuring around the capture showed computed style reading
   `opacity: 0; visibility: hidden` immediately before _and_ after, while the
   PNG still painted the panels: a Chromium compositing quirk where a
   transitioned layer is painted from stale state during full-page capture.
   Captures now run under `reducedMotion: 'reduce'`, and a browser test measures
   the dropdown at rest, on hover and on focus. State is measured, not
   photographed.

The third is the one worth remembering: `focus()` fails **silently** on a
`visibility: hidden` element. Nothing throws, nothing logs, and the page looks
right. Only a test that asks _where is focus now_ finds it.

### The storage exception, bounded

Tab 04 permits storing a dismissal preference; Tab 03 forbids storage that mimics
access. Both hold because `src/lib/dismissal.ts` cannot express anything else —
key from a closed union, value always the literal `'1'`. The blanket ban became
four narrower assertions rather than being deleted: storage confined to one
allow-listed file; that file asserted to still exist and still use storage;
every `setItem` in it matched against `PREFIX + key, '1'`; and no file anywhere
storing viewer, member, status, token, session, email or auth.

### Commands and results

| Command            | Result                    |
| ------------------ | ------------------------- |
| `npm run check`    | pass                      |
| `npm run test`     | **211 passed**            |
| `npm run build`    | 16 pages                  |
| `npm run test:e2e` | **141 passed, 2 skipped** |

Break-checks, each confirmed to fail then restored: removing the `[hidden]`
override; reintroducing a duplicate nav destination; writing a non-flag value to
storage; restoring the symmetric `visibility` transition.

---

## 12. Tab 05 — home page

CTA matrix in [`cta-destinations.md`](cta-destinations.md).

### Delivered

All eleven required sections, in order, each rendering only from
`src/content/home.ts` — the page composes approved copy, it never authors it. A
browser test reads the DOM order of the eleven section headings and fails if the
narrative is resequenced.

One primary action runs through the page: **Join PAAIPE**, the only `primary`
button, in the hero and again in the final CTA.

### The contrast contract was incomplete, and axe found it

The home page failed its axe scan on `color-contrast` while
`npm run verify:contrast` reported all 33 combinations passing.

The failing node was the reason text beside an unavailable external action:
`--color-text-secondary` (`#5A6780`) is **5.69:1 on white but 2.32:1 on navy**,
and the final CTA is navy. `ExternalAction` had no on-dark treatment for it.

Fixed in the component, and — more importantly — **four missing pairings were
added to `CONTRAST_CONTRACT`**, plus a new forbidden pair recording that muted
grey on navy measures 2.32:1. The contract now covers 37 combinations and 6 bans.

The lesson is about the gates, not the colour: a hand-written contrast contract
is only as complete as the list someone thought to write. The rendered axe scan
found a combination the contract did not contain. **Both are needed** — the
contract catches regressions at build time with a named reason; the scan finds
pairings nobody enumerated.

### Honest states, enforced

- **The three insights cards contain no link and no button at all.** Nothing is
  published, so nothing may be opened, read now or downloaded. A test asserts
  zero `a, button` inside each card and no download/read-now language.
- **The updates signup has no `<form>` element**, both controls are disabled and
  the reason is visible text. A test asserts `localStorage` stays empty, so
  nothing typed is retained.
- The members-only session is labelled as such and carries no meeting link; a
  test greps the rendered section for `zoom.us`, `meeting id` and `passcode`.
- The partner caveat renders directly beside the benefits preview.

### A gate that flagged approved copy

The "no superlative claim" scan flagged the approved line _"…adopting and
**leading** with AI."_ — a verb, not a claim. The fix was to the measurement,
never the copy: the pattern now matches the claim shape (`the leading …`), and a
worked example confirms it still flags "the leading community", "#1" and
"fastest-growing" while passing "leading with AI".

Writing that example immediately exposed a second bug in the same regex: `\b#1\b`
can never match, because a word boundary cannot fire between a space and `#`.

### Two silently-failed patches, caught by asserting

Two edits to `routes.ts` and `tokens.ts` did not apply — Prettier had reflowed
the anchor text between writing the patch and running it. Both were caught
because the edit script asserts its anchor exists before writing. An unasserted
patch would have left the Open Graph tags and four contrast pairings missing
while everything still reported green.

### Commands and results

| Command                   | Result                                 |
| ------------------------- | -------------------------------------- |
| `npm run check`           | pass                                   |
| `npm run test`            | **228 passed**                         |
| `npm run verify:contrast` | **37 required pass, 6 bans justified** |
| `npm run build`           | 16 pages                               |
| `npm run test:e2e`        | **163 passed, 3 skipped**              |

Break-checks, each confirmed to fail then restored: reverting the on-dark reason
colour; linking an unpublished insight card; making the signup submittable;
reordering the narrative sections.

---

## 13. Tab 06 — About and Programs

### Delivered

`/about` explains why PAAIPE exists: who we are, mission and vision, five named
values, what PAAIPE does, who it is for, and the progress statement.
`/programs` shows the activity: seven programme cards each linked to its own
detail section, availability and rights notes, the signature session schedule,
and the speaker invitation.

Every programme's **Public / Members Only** badge is derived from its
`visibility` by a shared `VisibilityBadge` component, never typed per card, so a
card cannot be labelled Public while pointing at members-only content.

### Two content discrepancies between tabs, both carried rather than reconciled

Choosing one would have deleted approved copy, so both are held and flagged:

| id       | Discrepancy                                                                                                                                                                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B-14** | Tab 03 gives five **single-word** values (Responsible, Inclusive, Practical, Collaborative, Future-focused). Tab 06 gives five **named** values with descriptions (Bayanihan in technology, People-centered innovation, Practical value, Responsible trust, Continuous learning). Only "Practical" overlaps at all — these are different lists, not one paraphrasing the other. |
| **B-15** | Tab 03 gives five audience **categories**; Tab 06 gives seven more granular "who PAAIPE is for" entries.                                                                                                                                                                                                                                                                        |

The About page uses Tab 06's lists, as Tab 06 specifies. Tab 03's remain
available for short summaries. A test asserts both exist and are not equal, so
neither can be quietly dropped in favour of the other.

### The progress statement stays prose

Tab 06 is explicit: _"Do not turn this statement into a numerical impact chart
until verified data exists."_ It renders as five plain outcome lines with no
counter, figure, chart or unit. Two tests enforce it — a content test asserting
**no digit** appears anywhere in the statement, and a browser test reading the
rendered section's text and asserting the same.

### A test of mine that claimed to check something and did not

The "About and Programs share no long passage" check stringified both pages'
content and split the JSON on sentence boundaries. **JSON puts no space after
the period that ends a field**, so the last sentence of every field merged with
the next field's punctuation and could never match anything. The check passed
while testing nothing.

It was found by break-checking: a duplicated passage was planted, the browser
test caught it, and the unit test that claimed to cover the same rule stayed
green. Rewritten to collect the actual string leaves and split those; the same
break now fails both.

A gate that passes for the wrong reason is worse than no gate — it is a green
tick standing where a check should be.

### Commands and results

| Command            | Result                    |
| ------------------ | ------------------------- |
| `npm run check`    | pass                      |
| `npm run test`     | **267 passed**            |
| `npm run build`    | 16 pages                  |
| `npm run test:e2e` | **179 passed, 3 skipped** |

Break-checks, each confirmed to fail then restored: a figure in the progress
statement; a members-only programme mislabelled Public; an About passage
repeated on Programs; the About and home missions drifting apart.

---

## 14. Tab 07 — Events and Speakers

### Delivered

`/events` with all eight required sections, `/events/[slug]` with the
members-only locked panel, and `/speakers`.

Nothing is approved, so **every listing section renders its honest empty state**
and no event card is invented to fill the space. The topic filter is not
rendered at all when there is nothing to filter — offering a control that can
only do nothing is its own kind of dishonesty.

### The privacy boundary is a type, not a template rule

`publicEventFields()` builds the object a template renders from. For a
members-only session that object **does not carry** `speakerName`,
`speakerTitle`, `duration` or `description` — the fields are absent, not empty.
A template cannot leak a field the object does not have, so the protection does
not depend on every future template remembering to omit something.

A test asserts the exact key set for a locked event, and asserts `'speakerName'
in view === false` rather than checking it is undefined.

### Structured data describes only real events

`eventStructuredData()` returns `null` unless an event is `approved`, `public`
**and** has a confirmed date. Everything in the registry is `sample`, so the
site currently ships **no `Event` markup at all** — asserted both as a unit test
over the registry and as a browser test grepping every page's JSON-LD.

Marking up an event that does not exist would put a fabricated listing into
search results, which is worse than showing nothing.

### A third defence layer: scanning the built bundle

`npm run verify:leak` scans **`dist/`** — not source — for meeting URLs, meeting
IDs, passcodes, credential assignments, private keys, protected paths, signed
URLs and benefit codes.

It runs against the **review** build as well as production, deliberately. A
production build currently contains no event or resource detail pages at all, so
scanning production alone would pass by having nothing to scan — and the
members-only rendering path, which is exactly the risky one, would never be
examined. It also refuses to pass on an empty `dist/`.

Proved end to end: planting `https://zoom.us/j/… (passcode 4471)` in the access
note failed **all three** layers — the source scope scan, the built-bundle scan,
and the review-label check.

### Two break-checks that broke nothing, and one gate that misfired

- **Two break-check patches silently applied nothing** because their anchor text
  did not match — one targeted the wrong file, one assumed a line wrap that
  Prettier had removed. Both were caught only because the patch asserts its
  anchor first. Without that, `exit=0` would have read as "the gate failed to
  catch it" when in truth nothing was ever planted. **A break-check that does
  not break anything is indistinguishable from a gate that does not work.**
- **`verify:leak` was misfiring.** A leading `VAR=value` applies to the first
  command of a `&&` chain only, so the review _build_ saw
  `PUBLIC_CONTENT_MODE=review` but the _scan_ did not — and the review bundle
  was checked against production-only rules, failing on its own review labels.
  It failed safe rather than passing falsely, but it was still wrong. Split into
  `verify:leak:review` and `verify:leak:production`, each properly scoped.

### Commands and results

| Command               | Result                                               |
| --------------------- | ---------------------------------------------------- |
| `npm run check`       | pass                                                 |
| `npm run test`        | **288 passed**                                       |
| `npm run verify:leak` | 31 review files + 20 production files scanned, clean |
| `npm run test:e2e`    | **201 passed, 3 skipped**                            |

Break-checks, each confirmed to fail then restored: leaking a speaker onto a
locked event view; marking up a sample event as structured data; planting a Zoom
join URL and passcode; a review label reaching a production build; scanning an
empty `dist/`.
