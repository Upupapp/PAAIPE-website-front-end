# PAAIPE brand usage

Implementation reference for Tab 02. Every figure here is measured, not asserted:
`npm run verify:brand` and `npm run verify:contrast` reproduce them, and the
internal style guide at `/internal/style-guide` renders them from the same
source the components use.

---

## 1. Identity

|              | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Organisation | Philippine Association of AI Professionals and Entrepreneurs |
| Acronym      | PAAIPE                                                       |
| Slogan       | Building the Philippines’ AI-Powered Future—Together.        |

All three live in `src/config/site.ts` and are imported, never retyped. A test
asserts the slogan's **typographic apostrophe (’) and em dash (—)** — a straight
apostrophe or a hyphen is a different string and fails the Tab 15 audit.

## 2. Logo files

### Canonical originals — `public/brand/`

| File                               | Size        | SHA-256             |
| ---------------------------------- | ----------- | ------------------- |
| `PAAIPE_Logo_Square_Final.png`     | 2000 × 2000 | `88f91f0e…247d1867` |
| `PAAIPE_Logo_Horizontal_Final.png` | 1800 × 627  | `f332dc8c…021a1378` |

Authoritative by owner ruling, 2026-09-03. The master command prints a different
pair; those are superseded and the gate reports the divergence on every run.

### Renditions — `public/brand/renditions/`

Whole-file proportional downscales. Same artwork, colours and safe space, fewer
pixels. Regenerate with `npm run brand:renditions`.

| File                        | Size      | Weight  | Use                      |
| --------------------------- | --------- | ------- | ------------------------ |
| `paaipe-horizontal-600.png` | 600 × 209 | 80 KiB  | Header and footer lockup |
| `paaipe-square-512.png`     | 512 × 512 | 154 KiB | Large badge, PWA icon    |
| `paaipe-square-256.png`     | 256 × 256 | 49 KiB  | Compact badge            |
| `paaipe-square-180.png`     | 180 × 180 | 29 KiB  | apple-touch-icon         |

## 3. The `LogoLockup` component

Every logo placement goes through `src/components/LogoLockup.astro`. It picks
the smallest rendition that satisfies 2× for the requested width, derives the
height from the source ratio, and always emits `width`/`height`.

```astro
<LogoLockup variant="horizontal" width={240} />
<!-- header -->
<LogoLockup variant="horizontal" width={240} align="optical" /><!-- flush artwork -->
<LogoLockup variant="square" width={96} decorative />
<!-- text names the org -->
<LogoLockup variant="horizontal" width={200} onDark />
<!-- white badge -->
```

| Prop         | Effect                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| `variant`    | `horizontal` (header/footer lockup) or `square` (badge, icon source)   |
| `width`      | Rendered CSS width. Height is **derived**, never typed                 |
| `align`      | `canvas` keeps the file's safe space; `optical` aligns the artwork box |
| `decorative` | `alt=""` when adjacent text already names the organisation             |
| `onDark`     | Places the unmodified artwork on a clean white badge                   |
| `priority`   | Eager + high fetch priority for a logo that is part of the LCP         |

### Optical alignment — why it exists

The artwork is **not centred inside either canvas**:

|            | Canvas      | Artwork                                | Padding L / T / R / B        |
| ---------- | ----------- | -------------------------------------- | ---------------------------- |
| Square     | 2000 × 2000 | **1464 × 1747 — portrait, not square** | 269 / **81** / 267 / **172** |
| Horizontal | 1800 × 627  | 1626 × 540                             | **54** / 45 / **120** / 42   |

The square artwork sits **91px above** its canvas centre; the horizontal sits
**33px left** of centre. Tab 02 forbids cropping the logo, so the files are left
alone and `align="optical"` compensates with exact negative margins computed
from `padding` in `src/config/brand.ts`. Only empty padding is ever clipped —
never artwork.

**A badge or favicon that assumes the square file holds centred 1:1 artwork will
render low-heavy. It does not.**

### Prohibitions, enforced by test

A browser test reads computed style on every `.logo-lockup img` and fails if any
`filter`, `transform`, `mix-blend-mode` or `mask` is applied, or if `width`/
`height` are missing. Beyond that: never separate or animate the sun, orbit,
nodes, triangles, letters or wordmark; never invert on dark; the only permitted
logo motion is a whole-logo opacity fade of 120–160ms.

## 4. Colour

The eleven raw palette values are exactly as specified in Tab 02 and are not
edited. Components use **semantic role tokens** layered on top, and only
combinations that clear their WCAG requirement.

### Three findings that shaped the system

1. **`--paaipe-blue` #0878F9 cannot carry a white label.** White on blue is
   **4.14:1**, below the 4.5:1 AA threshold, and blue on white is the same 4.14.
   So the primary action fill is **navy** (white on navy = 13.23:1). Blue remains
   the focus ring (≥3:1 on every surface), an on-dark text colour (4.68:1 on deep
   navy) and an accent.
   _For PAAIPE:_ shifting blue just 8% toward navy — `#0872EE` — reaches 4.51:1
   and would make an electric-blue action legal. Not adopted; it changes a brand
   value. See B-11.
2. **`--paaipe-border` #D8E3F2 is 1.29:1 on white.** Fine as a decorative
   divider, but **it cannot bound a form control** (WCAG 1.4.11 needs 3:1).
   Control boundaries use `--color-border-control` (`--paaipe-muted`, 5.69:1).
3. **Cyan and gold are on-dark colours.** 2.23:1 and 1.81:1 on white — unusable
   as body text there, exactly as the master command says. On navy they are
   5.91:1 and 7.28:1, so they work as eyebrows and highlights on hero surfaces.

### Status colours — derived, awaiting approval (B-10)

The master command supplies no status palette, and form validation and alerts
cannot be built without one. Each clears 4.5:1 **in both directions** — as text
on white, and as a filled surface carrying white text.

| Token              | Value     | On white | White on it |
| ------------------ | --------- | -------- | ----------- |
| `--paaipe-error`   | `#B3261E` | 6.53:1   | 6.53:1      |
| `--paaipe-success` | `#0F6E4F` | 6.24:1   | 6.24:1      |
| `--paaipe-warning` | `#8A5A00` | 5.92:1   | 5.92:1      |

These are functional UI colours, not brand identity.

### The contrast contract

`CONTRAST_CONTRACT` in `src/config/tokens.ts` lists every combination the
components actually use, with the requirement each must meet. `npm run
verify:contrast` measures all of them: **33 required combinations pass**.

`FORBIDDEN_PAIRS` lists five banned combinations **with the measurement that
justifies the ban**, and the gate re-checks those too — if a palette change ever
makes one legal, the gate says so, so a prohibition cannot outlive its reason.

## 5. Typography

`--font-sans` is a **system stack**: local, zero network requests, no
third-party runtime dependency. This is **interim** — PAAIPE has not supplied an
approved typeface (B-5). Replacing it changes one declaration.

Fluid scale via `clamp()`: `display`, `h1`–`h4`, `body-lg`, `body`, plus fixed
`label` and `caption`. **`--text-body` clamps at a 1rem minimum** — a test
asserts body text can never resolve below 16px. Long-form copy is capped at
`--width-prose: 68ch`, inside the 55–75 character band.

## 6. Scales

- **Spacing**: 4px base. A test asserts every step is a multiple of 4.
- **Radius**: `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 24 · `pill`. A test
  asserts card radii (`md`/`lg`/`xl`) stay inside the 12–24px band.
- **Elevation**: three shadows, all tinted with `--paaipe-ink` rather than pure
  black.

## 7. Decorative graphics

`src/components/decor/NetworkField.astro` — connected-node field, orbit arcs and
a fine grid. It is `aria-hidden`, unfocusable, static, and carries no triangle
mark, sun rays or wordmark, so it cannot be confused with the logo. A browser
test asserts the aria-hidden and the absence of any focusable descendant.

**Deliberate gap:** the "subtle independent Philippine map contours" the master
command also asks for are **not** drawn. Approximating a national outline is a
credibility risk for a Philippine association and no approved geographic asset
has been supplied. The component exposes a `map` slot as the seam for one (B-6).

Avoided throughout, as instructed: generic robots, glowing brains, humanoid
android heads, code walls, crypto aesthetics, fake circuitry and fake technology
company logos.

## 8. Component inventory

| Component            | Notes                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| `LogoLockup`         | Variants, optical alignment, decorative mode, dark badge                                                      |
| `ui/Button`          | primary / secondary / ghost · md / lg · hover, pressed, focus-visible, disabled, loading · on-dark · external |
| `ui/TextLink`        | Always underlined; external marked visibly and for screen readers                                             |
| `ui/Badge`           | 6 tones; status tones add a glyph so colour is never the only signal                                          |
| `ui/Chip`            | Filter chip: fill + check glyph + `aria-pressed`                                                              |
| `ui/Card`            | default / inverse; optional whole-card link with lift on hover and focus                                      |
| `ui/SectionHeading`  | Eyebrow + heading + lead slot; level and size chosen independently                                            |
| `ui/Container`       | content / narrow / prose widths                                                                               |
| `ui/MediaFrame`      | Fixed aspect ratio, required `alt`, optional caption                                                          |
| `ui/Divider`         | Decorative by default, `semantic` renders a real `<hr>`                                                       |
| `ui/Callout`         | info / success / warning / error, each with a label and glyph; optional live region                           |
| `ui/Field`           | Persistent visible label, hint, programmatic error, 16px input floor, disabled reason                         |
| `ui/Skeleton`        | Restrained opacity pulse, fully static under reduced motion                                                   |
| `ui/ScrollRegion`    | Keyboard-operable horizontal scroll for wide tables                                                           |
| `decor/NetworkField` | Decorative node field, `aria-hidden`, unfocusable                                                             |

Rendered together, responsively, at `/internal/style-guide`.

## 9. Two defects this tab's gates caught

Recorded because they are the kind that ship silently:

1. **A loading button lost its accessible name.** Hiding the label with
   `visibility: hidden` to keep the button width stable also removes it from the
   accessibility tree; axe reported `button-name`. Fixed with `opacity: 0`, which
   keeps both the width and the name.
2. **Scrollable tables were not keyboard-reachable** — WebKit only. A wide table
   in an `overflow-x: auto` box cannot be scrolled by a keyboard-only user unless
   the container is focusable. Fixed by extracting `ui/ScrollRegion`, which adds
   `tabindex="0"`, `role="region"` and a required label.
