# Motion and haptics

Tokens, reduced motion, support and fallback, preferences, and the performance
limits every one of them is measured against.

---

## 1. The principle

Motion here is **confirmation, not spectacle**. Every animation exists to tell a
visitor that something happened or that content has arrived. Nothing moves for
decoration, nothing loops, and nothing on the page competes with reading.

Two consequences worth stating up front:

- **Content is visible at rest.** Nothing is hidden waiting for a reveal. If the
  motion layer never runs — no JavaScript, an unsupported browser, an error —
  the page is complete.
- **A visitor who asks for less motion gets less motion, immediately.** The
  preference is applied in the `<head>` before first paint, not after.

---

## 2. Tokens

Durations and easings live in `src/config/tokens.ts` and are mirrored into
`src/styles/motion.css`. A bidirectional parity test asserts both directions.

| Token                             | Value                           | Used for                              |
| --------------------------------- | ------------------------------- | ------------------------------------- |
| `--motion-none`                   | 0 ms                            | The explicit "no motion" value        |
| `--motion-instant`                | 80 ms                           | Colour and opacity on a control       |
| `--motion-fast`                   | 140 ms                          | Hover, focus ring, chip selection     |
| `--motion-standard`               | 220 ms                          | Most transitions                      |
| `--motion-slow`                   | 320 ms                          | Larger movements                      |
| `--motion-emphasis`               | 480 ms                          | A one-time hero emphasis              |
| `--motion-ambient-once`           | 1200 ms                         | A decorative reveal that then settles |
| `--ease-standard`                 | `cubic-bezier(0.2, 0, 0, 1)`    | Entering and moving                   |
| `--ease-enter`                    | `cubic-bezier(0.16, 1, 0.3, 1)` | Reveals                               |
| `--ease-exit`                     | `cubic-bezier(0.4, 0, 1, 1)`    | Leaving                               |
| `--move-1` … `--move-4`           | 4 / 8 / 12 / 20 px              | Travel distances                      |
| `--scale-press` / `--scale-hover` | 0.98 / 1.012                    | Control feedback                      |

Component durations the master command names specifically:

| Token                    | Value   | Component                                                                      |
| ------------------------ | ------- | ------------------------------------------------------------------------------ |
| `--motion-drawer`        | 280 ms  | Mobile navigation drawer                                                       |
| `--motion-menu`          | 160 ms  | Desktop dropdown                                                               |
| `--motion-chevron`       | 180 ms  | Accordion chevron                                                              |
| `--motion-reveal`        | 280 ms  | Scroll reveal                                                                  |
| `--motion-reveal-image`  | 360 ms  | Scroll reveal, images                                                          |
| `--motion-hero-media`    | 420 ms  | Hero image emphasis                                                            |
| `--motion-stagger`       | 40 ms   | Card-group stagger step, five cards maximum                                    |
| `--motion-decor-reveal`  | 1100 ms | The decorative network field, once                                             |
| `--motion-spinner`       | 700 ms  | A loading spinner — ambient, outside the scale                                 |
| `--motion-copy-revert`   | 1800 ms | Copy confirmation reverting                                                    |
| `--motion-scroll-settle` | 150 ms  | The scroll-end sweep debounce — a settle window, not a transition              |
| `--motion-off`           | 0.01 ms | The reduced-motion escape hatch: near-zero, but it still fires `transitionend` |

### Limits, enforced

| Limit                             | Value                       | Why                                                           |
| --------------------------------- | --------------------------- | ------------------------------------------------------------- |
| Functional transition             | **≤ 320 ms**                | Anything slower reads as lag rather than feedback             |
| Hero emphasis, one-time           | **≤ 480 ms**                | The single exception, and it happens once                     |
| Decorative reveal                 | **≤ 1200 ms**, then settles | It must stop, not loop                                        |
| Auto-motion with no pause control | **< 5000 ms**               | Longer than this and a control is required                    |
| Route transition                  | **≤ 320 ms**                |                                                               |
| Card stagger step                 | **40 ms**                   | Five cards maximum                                            |
| Reveal travel                     | **≤ 12 px**                 | A large translate is spectacle, and it costs layout stability |
| Motion JavaScript                 | **≤ 20 KiB** compressed     | Measured at **2.0 KiB**                                       |

`src/tests/motion.test.ts` fails if a token exceeds its limit.

---

## 3. Reduced motion

Three ways a visitor can get it, and all three are honoured:

1. **The OS setting** — `prefers-reduced-motion: reduce` zeroes both halves of
   every transition and cancels every reveal.
2. **The in-page preference** — a `reduce-motion` control on `/accessibility`
   with `on` / `off` / `system`.
3. **`pause-ambient`** — stops the decorative network field independently, for
   someone who wants page transitions but not background movement.

**The preference is applied before first paint.** The inline `<head>` script
reads storage and stamps `data-reduce-motion` on `<html>`. Applying it later
means the motion layer starts, animations begin, and the override cancels them
mid-flight — a visible flash for exactly the person who asked for less.

A CSS trap worth recording: the override selector must be
`html[data-reduce-motion='on'].js.motion-ready [data-enter]`, with **no space**
before `.js`. The classes are on `<html>` itself, so a descendant combinator
demands a child carrying them — and a selector that can never match makes the
preference silently do nothing. It did, until a test caught it.

### What reduced motion does NOT do

It does not remove content, change layout, or disable a control. Every element
that would have animated is simply present. `tests/e2e/journeys.spec.ts` asserts
that with `reduce-motion` set, `document.getAnimations()` reports **nothing
running**.

---

## 4. Scroll reveals

Below-the-fold content fades and rises 8–12 px once, on first appearance. Never
again, never on scroll direction, and never with parallax.

**The trap that cost a tab:** an `IntersectionObserver` fires on a _change_ in
intersection. An element that jumps straight from below the viewport to above it
— a fast scroll, a jump to an anchor — goes from ratio 0 to ratio 0, so **no
entry is ever delivered** and the element stays hidden forever. Seven cards on
the home page did exactly that.

The obvious fix (checking `boundingClientRect.top` inside the callback) does
nothing, because the callback never fires. The real fix is a scroll-end sweep:
on `scrollend` (or a 150 ms debounced `scroll` where that event is unsupported),
reveal anything still pending that is now above the fold.

---

## 5. View Transitions

Astro's `ClientRouter` with **`fallback="none"`**.

The JavaScript-simulated fallback is exactly the "route spectacle" the brief
warns against, so an unsupported browser simply navigates. Every link stays a
real `<a href>`; the transition is an enhancement and never a requirement.
Reduced motion zeroes both halves.

The header carries `transition:persist` so it does not re-animate between
routes, and focus moves to the new `<main>` with `preventScroll`.

---

## 6. Haptics — offered, never assumed

Web haptics is the Vibration API. It exists on most Android browsers and **not
on iOS Safari at all**. This is stated plainly wherever it appears; nothing here
claims universal support.

|                |                                                                                       |
| -------------- | ------------------------------------------------------------------------------------- |
| Default        | **Off.** A visitor opts in                                                            |
| Where offered  | Only where `navigator.vibrate` exists — the control is not rendered otherwise         |
| Patterns       | Short confirmations only. A single pulse is **≤ 30 ms**, a whole pattern **≤ 120 ms** |
| Rate limit     | **750 ms** minimum between haptics, and at most **6 per minute**                      |
| Where it fires | Confirmation of a real action. Never on scroll, hover or page load                    |

`shouldVibrate()` in `src/lib/haptics.ts` is browser-free and pure, with **six
guards**: the API exists, the preference is on, the page is visible, reduced
motion is not requested, the rate limit allows it, and the pattern is within
limits. Any one failing is a silent no-op — never an error, never a console
warning.

### A measurement trap worth keeping

A Vibration API pattern **alternates pulse, pause, pulse**. A test that treats
every array entry as a pulse mis-measures `[12, 36, 18]` as 66 ms of vibration
when it is 30 ms. The support matrix in `docs/haptics-support-matrix.md` records
what was actually verified and what was not.

**Not verified:** real-device Android haptics. Both browser projects here
exercise the _unsupported_ path; the supported path is covered by pure-function
guard tests, which is the only way to assert it without a handset. Recorded as
**F-22**.

---

## 7. Performance, measured

| Measure                                         | Result      | Threshold |
| ----------------------------------------------- | ----------- | --------- |
| CLS while scrolling the whole home page         | **0.000**   | < 0.1     |
| Longest blocking task while animating           | **0 ms**    | < 50 ms   |
| Motion JavaScript, compressed                   | **2.0 KiB** | ≤ 20 KiB  |
| Lighthouse performance, median of three, mobile | **98–99**   | ≥ 90      |

Animation is confined to `opacity` and `transform`, neither of which triggers
layout. That is why CLS is 0 and why a regression to a layout-affecting property
would show up long before CLS became "poor".

**The measurement runs in Chromium only, and says so.** `layout-shift` and
`longtask` are not implemented in Firefox or WebKit — an observer there returns
nothing and the test would pass by measuring nothing. It asserts
`PerformanceObserver.supportedEntryTypes` contains the type **before** trusting a
zero.

### What the direct measurement found that Lighthouse did not

Lighthouse reported **CLS 0.000** for a page whose real CLS was **0.200** —
twice the threshold, on every load. The announcement bar's dismiss button ships
`hidden` and is revealed by script; as a flex item it made the bar 21 px taller
and knocked the text out of centre. Lighthouse's run never reached the state
that shifts.

The button is now out of flow with its space reserved unconditionally, so the
bar has identical geometry with JavaScript on or off. Break-checked: putting it
back in flow reproduces the shift at 0.185.

---

## 8. Evidence

| Artefact                                                | What it shows                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| `docs/recordings/`                                      | Screen recordings of default and reduced-motion modes                    |
| `docs/motion-inventory.md`                              | Every animation, its trigger, duration and easing                        |
| `docs/haptics-support-matrix.md`                        | Where haptics is offered, where it is a no-op, and what was not verified |
| `tests/e2e/journeys.spec.ts`                            | The reduced-motion assertion and the CLS/long-task measurement           |
| `src/tests/motion.test.ts`, `src/tests/haptics.test.ts` | Token limits and the six guards                                          |
