# Accessibility report

Tab 13 deliverable. Target: **WCAG 2.2 Level AA**.

Automated scans are **defect detectors, not proof of conformance.** This report
separates what has been measured from what has not, because a checklist with
every row ticked by a machine is a claim nobody verified.

Measured: 2026-09-03 · production build · Chromium 141 (desktop 1440×900) and
WebKit (iPhone 13, 390×844).

---

## 1. Headline status

|                           |                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Automated axe-core scans  | **No serious or critical defects** on any of the 16 routes, in both engines                                                    |
| Colour contrast           | **37 combinations measured, all passing**; 6 combinations recorded as forbidden with the ratio that justifies each             |
| Reflow                    | **No page-level horizontal scroll on any route at 320, 360, 390, 414, 768, 900, 1024, 1280 or 1440px**                         |
| 200% text zoom            | **No overflow and no lost content** on any route                                                                               |
| Keyboard                  | Every reachable control shows a focus indicator; no positive `tabindex`; no keyboard trap outside the intentional modal drawer |
| Target size               | Every control meets WCAG 2.2 §2.5.8 (24px); primary controls are 44px                                                          |
| Manual screen-reader pass | **NOT DONE — see §6**                                                                                                          |

## 2. Viewport matrix

Every route, every width, asserted on each build.

| Width  | Result                                 |
| ------ | -------------------------------------- |
| 320px  | Pass — no page scroll, nothing clipped |
| 360px  | Pass                                   |
| 390px  | Pass                                   |
| 414px  | Pass                                   |
| 768px  | Pass                                   |
| 900px  | Pass                                   |
| 1024px | Pass — breakpoint boundary             |
| 1280px | Pass                                   |
| 1440px | Pass                                   |

Plus: 1280px at **200% text zoom** — pass, after the fix in §4.

Local horizontal scrolling is used only where the master command allows it —
wide tables in `ui/ScrollRegion`, which is keyboard-operable and labelled. The
page itself never scrolls sideways.

## 3. What is verified by automation

Each row runs on every build. "Where" names the gate.

| Criterion                    | Verified                                                                                                                                           | Where                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1.1.1 Non-text content       | Every `img` has an `alt` attribute and declared dimensions; alt never repeats adjacent text; decorative graphics are `aria-hidden` and unfocusable | `accessibility.spec.ts`, `routes.spec.ts` |
| 1.3.1 Info and relationships | One `h1` per route, no skipped heading levels, landmarks present, every `nav` uniquely named                                                       | `accessibility.spec.ts`                   |
| 1.3.2 Meaningful sequence    | Content order asserted with **CSS disabled**                                                                                                       | `accessibility.spec.ts`                   |
| 1.4.3 Contrast (minimum)     | 37 pairings measured against 4.5:1 / 3:1                                                                                                           | `npm run verify:contrast`                 |
| 1.4.4 Resize text            | 200% root font size, no overflow, no lost content                                                                                                  | `accessibility.spec.ts`                   |
| 1.4.10 Reflow                | 320px on every route                                                                                                                               | `accessibility.spec.ts`                   |
| 1.4.11 Non-text contrast     | Focus ring ≥3:1 on all four surfaces; control borders use `--paaipe-muted` (5.69:1), never the 1.29:1 decorative border                            | `verify:contrast`, `tokens.test.ts`       |
| 1.4.12 Text spacing          | Body clamps at a 16px floor; no fixed-height text container clips                                                                                  | `motion.test.ts`, `accessibility.spec.ts` |
| 2.1.1 Keyboard               | Drawer opens, traps, closes on Escape, restores focus; 30 consecutive Tab presses never escape                                                     | `routes.spec.ts`                          |
| 2.1.2 No keyboard trap       | Trap is conditional on the mobile media query — above the breakpoint the same markup is an ordinary nav                                            | `routes.spec.ts`                          |
| 2.2.2 Pause, stop, hide      | Nothing loops; zero running animations two seconds after load                                                                                      | `routes.spec.ts`                          |
| 2.3.1 Three flashes          | No flashing content exists                                                                                                                         | —                                         |
| 2.4.1 Bypass blocks          | Skip link present, first in tab order, targets a focusable `main`                                                                                  | `routes.spec.ts`                          |
| 2.4.2 Page titled            | Every route has a unique non-empty title                                                                                                           | `routes.test.ts`                          |
| 2.4.3 Focus order            | No positive `tabindex`; focus never enters `aria-hidden` content                                                                                   | `accessibility.spec.ts`                   |
| 2.4.4 Link purpose           | No "click here" or device-specific instruction on any route                                                                                        | `accessibility.spec.ts`                   |
| 2.4.7 Focus visible          | Every reachable control has an outline or shadow on focus                                                                                          | `accessibility.spec.ts`                   |
| 2.4.11 Focus not obscured    | Anything scrolled to clears the sticky header by **≥16px**                                                                                         | `routes.spec.ts`                          |
| 2.5.3 Label in name          | Visible label is the accessible name on every control                                                                                              | axe                                       |
| 2.5.8 Target size            | ≥24px for every control, 44px for primary ones                                                                                                     | `accessibility.spec.ts`                   |
| 3.1.1 Language of page       | `lang="en-PH"`                                                                                                                                     | axe                                       |
| 3.2.3 Consistent navigation  | One nav registry drives every page                                                                                                                 | `content-registry.test.ts`                |
| 3.3.1 Error identification   | Errors are text plus a glyph, associated by `aria-describedby`                                                                                     | `Field.astro`                             |
| 3.3.2 Labels or instructions | Every input has a persistent visible label                                                                                                         | axe, `routes.spec.ts`                     |
| 4.1.2 Name, role, value      | axe on all 16 routes, both engines                                                                                                                 | `routes.spec.ts`                          |

## 4. Defects found and fixed in this tab

### The desktop navigation was unreachable at 200% text zoom

Measured at 1280px with 200% text: the horizontal nav ran **142px off the right
edge**, and its links and both action buttons were unreachable. A WCAG 1.4.4 and
1.4.10 failure.

The cause is worth recording: **a media query's `em` resolves against the
initial 16px, not the root font size.** `@media (min-width: 64em)` stays at
1024px however far a reader zooms text, while everything inside the nav doubles.
A breakpoint expressed in `em` looks text-relative and is not.

Fixed by letting the desktop nav and its list **wrap** rather than overflow.

### A `<select>` was 23px tall on mobile WebKit

The preference controls set `min-height: 44px`, which a native `<select>` on
mobile WebKit ignores — they rendered **23px**, under the 24px WCAG 2.2 minimum.
Fixed with `appearance: none` plus an explicit `height`, drawing the arrow in
CSS.

### Three detectors of mine that were wrong

Recorded because a wrong detector is worse than none — it reports defects that
do not exist and hides the ones that do:

1. **"Clipped text" flagged nine healthy elements.** A block's _computed_ height
   is always a pixel value, never `auto`, and `scrollHeight > clientHeight` is
   normal for any box with `overflow: visible`. A real clip needs an overflow
   value that actually hides content.
2. **"No focus indicator" flagged links inside a closed dropdown.** They are
   `visibility: hidden`; focusing them programmatically reports no indicator
   because they are not rendered. Now restricted to controls a keyboard user can
   currently reach.
3. **"Lost content at 200% zoom" flagged the no-JS notice**, which is
   deliberately `hidden` once script runs.

## 5. Contrast results

`npm run verify:contrast` prints the full table each run. Summary:

- **37 required combinations, all passing.**
- **6 forbidden combinations**, each recorded with the ratio that justifies the
  ban — including `--paaipe-blue` at 4.14:1 against white (below AA, which is
  why the primary action fill is navy), `--paaipe-border` at 1.29:1 (decorative
  dividers only), and muted grey at 2.32:1 on navy (found by an axe scan the
  hand-written contract had missed).

Contrast is preserved through hover, pressed, disabled and loading states —
each state's pairing is a separate row in the contract.

## 6. WCAG 2.2 AA manual checklist — NOT COMPLETED

**Reviewer: none. Date: none.**

This is the honest status. The master command asks for a manual checklist
"completed with named reviewer/date", and that has not happened. What follows is
the checklist itself, with every row that automation cannot settle marked
**UNVERIFIED** and what it needs.

| Check                                                      | Status         | Needs                                                                             |
| ---------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------- |
| Complete keyboard-only review of every route and state     | **UNVERIFIED** | A person navigating with no pointer                                               |
| VoiceOver on macOS Safari                                  | **UNVERIFIED** | A person with VoiceOver                                                           |
| NVDA on Windows                                            | **UNVERIFIED** | A person with NVDA, on the Windows lane                                           |
| One mobile screen-reader path (VoiceOver iOS or TalkBack)  | **UNVERIFIED** | A real handset                                                                    |
| Spoken page titles, landmarks, headings, link purpose      | **UNVERIFIED** | Screen-reader listening                                                           |
| Spoken field labels, errors, dialogs, status messages      | **UNVERIFIED** | Screen-reader listening                                                           |
| Selected filter states announced correctly                 | **UNVERIFIED** | Screen-reader listening — and no filter renders today, since nothing is published |
| Real-device iOS Safari and Android Chrome smoke test       | **UNVERIFIED** | Physical devices                                                                  |
| 200% zoom judged by eye for readability, not only overflow | **UNVERIFIED** | Human judgement                                                                   |
| Reduced-motion pass judged by eye                          | **UNVERIFIED** | Human judgement                                                                   |

**Automated scans cannot substitute for these.** axe-core detects roughly a
third of WCAG issues by common estimates; it cannot tell whether a heading
_describes_ its section, whether alt text is _useful_, or whether an announcement
is _comprehensible_. Everything in §3 is a floor.

Tracked as **F-24**. This is the single largest gap between what this build has
verified and what the master command's Tab 13 acceptance checks require, and
Tab 15 asks for the same sign-off again in a stricter form.

### Tab 15 sign-off record — every field empty, on purpose

Tab 15 requires each manual check to record **tester, date, browser/device,
result and evidence**. The record exists so it can be filled in; leaving it out
until someone does the work would let the tab close with the gap invisible.

| Check                         | Tester | Date | Browser / device | Result                             | Evidence |
| ----------------------------- | ------ | ---- | ---------------- | ---------------------------------- | -------- |
| Keyboard-only                 | none   | none | none             | NOT RUN                            | none     |
| Desktop screen reader         | none   | none | none             | NOT RUN                            | none     |
| Mobile screen reader          | none   | none | none             | NOT RUN                            | none     |
| 200% zoom, judged by eye      | none   | none | none             | NOT RUN                            | none     |
| 320px reflow, judged by eye   | none   | none | none             | NOT RUN                            | none     |
| Reduced motion, judged by eye | none   | none | none             | NOT RUN                            | none     |
| Contrast, judged in context   | none   | none | none             | NOT RUN                            | none     |
| Target size                   | none   | none | none             | NOT RUN                            | none     |
| Focus not obscured            | none   | none | none             | NOT RUN                            | none     |
| Captions / transcript         | none   | none | none             | N/A — no media exists              | none     |
| Error announcement            | none   | none | none             | NOT RUN — no form submits anywhere | none     |

**Three of these rows have automated evidence, and it does not close them.**
200% zoom, 320px reflow and reduced motion are each asserted by test — see §3 and
the geometry checks in `tests/e2e/journeys.spec.ts`. What automation establishes
is that nothing overflows or is clipped, and that animation stops. Whether the
result is _readable_, whether the reflowed order still makes sense, and whether
the reduced-motion page still communicates what the animated one did are
judgements only a person makes.

Tab 15's 200% zoom check is where automation found real defects that no earlier
sweep had: see §4.

## 6b. What the Tab 15 zoom sweep found

Tab 13 checked nine widths at normal text size and passed. Tab 15 checked 200%
text zoom on **every** public route at 390px, and found content being lost on
six of them.

| Defect                                                                              | Where            | Measured                                                                                             |
| ----------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| A text input never shrinks below its intrinsic width                                | `Field.astro`    | The email field rendered **430.25px** inside a 390px viewport, scrolling the whole document sideways |
| A grid item's `min-width: auto` floors the column at its widest child's min-content | `HomeHero.astro` | The hero column sized to **418px**; heading, lead and both buttons ran 48px past the viewport        |
| The same, on the shared page hero                                                   | `PageHero.astro` | 395–449px on `/programs`, `/events`, `/responsible-ai`, `/contact`, `/accessibility`                 |

The hero case is the one worth remembering: `.hero` sets `overflow: hidden`, so
the 48px was **clipped, not scrolled**. A check that asks only "does the page
scroll horizontally" passes while the content is gone. The test now asserts on
both — document overflow _and_ any element whose right edge is past the viewport.

## 7. What is deliberately not applicable

| Criterion                                      | Why                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1.2.x Captions, audio description, transcripts | No video or audio exists. Required before any is published — recorded in the register |
| 1.4.2 Audio control                            | No audio, and none may autoplay; asserted by test                                     |
| 3.3.4 Error prevention                         | No form submits anywhere, so there is nothing to prevent                              |
| 2.5.4 Motion actuation                         | Nothing responds to device motion                                                     |
| Parallax constraints                           | Parallax is not implemented; asserted by test                                         |

## 8. How to reproduce

```sh
npm ci
npx playwright install chromium webkit
npm run verify:contrast          # the 37-combination table
npm run test:e2e                 # includes 42 accessibility assertions
npm run test:e2e -- tests/e2e/accessibility.spec.ts
```
