# Motion inventory

Tab 11 deliverable. Every animation on the site, what it costs, and what
switches it off.

**Token file:** `src/styles/motion.css` (mirrored by `MOTION_TOKENS` in
`src/config/tokens.ts`, with a parity test).

---

## 1. The rule that makes the rest checkable

**No component may contain a raw millisecond literal.** Every duration is a
token. A unit test strips comments from all 30+ component and page templates
and fails on any `\d+ms` outside the token file.

Comments are stripped first because the first run flagged the comment
_documenting_ the 180ms cap — the fourth time in this build that a scan matched
the text explaining a rule rather than a violation of it.

## 2. The scale

| Token                                              | Value       | Used for                            |
| -------------------------------------------------- | ----------- | ----------------------------------- |
| `--motion-instant`                                 | 80ms        | Button press                        |
| `--motion-fast`                                    | 140ms       | Hover, colour shifts, header shadow |
| `--motion-standard`                                | 220ms       | Cards, route entry, accordion panel |
| `--motion-slow`                                    | 320ms       | Ceiling for functional transitions  |
| `--motion-emphasis`                                | 480ms       | One-time hero emphasis, node reveal |
| `--motion-ambient-once`                            | 1200ms      | Ambient ceiling                     |
| `--ease-standard` / `--ease-enter` / `--ease-exit` | —           | The three curves                    |
| `--move-1` … `--move-4`                            | 4/8/12/20px | Travel distances                    |
| `--scale-press` / `--scale-hover`                  | .98 / 1.012 | Press and lift                      |

Named component durations that are not in the shared scale — `--motion-drawer`
(280ms), `--motion-chevron` (180ms), `--motion-menu` (160ms), `--motion-reveal`
(280ms), `--motion-hero-media` (420ms), `--motion-decor-reveal` (1100ms),
`--motion-spinner` (700ms), `--motion-off` (0.01ms) — are still tokens, so they
are greppable and still not arbitrary.

Ceilings are asserted, not assumed: functional ≤ 320ms, hero emphasis ≤ 480ms,
decorative reveal within 900–1200ms, route transition ≤ 320ms, stagger capped at
five cards and 180ms.

## 3. Every animation

| What                                  | Duration                                                 | Property                          | Disabled by                                            |
| ------------------------------------- | -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| Hero eyebrow / title / lead / actions | 220 / 320 / 260 / 220ms, overlapping to settle in ~700ms | opacity + translateY              | reduced motion; absent without JS                      |
| Scroll reveal (cards, sections)       | 280ms, 40ms stagger to 5 cards                           | opacity + translateY              | reduced motion; absent without JS                      |
| Decorative node field draw            | 1100ms, once                                             | stroke-dashoffset, opacity, scale | reduced motion; absent without JS                      |
| Route transition                      | 120ms out + 220ms in                                     | opacity + translateY              | reduced motion; unsupported browsers navigate normally |
| Button hover / press                  | 140 / 80ms                                               | colour, translateY, scale         | reduced motion                                         |
| Card lift                             | 220ms                                                    | transform, border, shadow         | reduced motion                                         |
| Mobile drawer                         | 280ms                                                    | transform                         | reduced motion                                         |
| Accordion chevron                     | 180ms                                                    | rotate                            | reduced motion                                         |
| Loading spinner                       | 700ms loop                                               | rotate                            | reduced motion (becomes a static ring)                 |

**Nothing loops except the loading spinner**, which only exists while a real
action is in flight. A browser test waits two seconds after load and asserts
zero running animations — which is why **no Pause/Stop/Hide control is needed**:
the five-second threshold that would require one is never approached.

## 4. Motion is additive, never load-bearing

Every motion rule is scoped to `.motion-ready`, a class the script adds **after**
it initialises. If the script never runs, or throws, the page is fully readable
with no animation at all.

Two tests enforce it: a unit test asserting every `opacity: 0` rule in
`motion.css` is scoped to `.motion-ready` (keyframe bodies excluded — a
`from { opacity: 0 }` is a starting state, not a hiding rule), and a browser
test with JavaScript disabled asserting the hero and cards are fully opaque.

## 5. A real defect: content could stay permanently invisible

An `IntersectionObserver` fires on a **change** in intersection. An element that
jumps straight from below the viewport to above it — a fast scroll, an in-page
anchor, a restored scroll position — goes from ratio 0 to ratio 0, so **no entry
is ever delivered**. Seven cards on the home page stayed hidden forever after a
single jump to the bottom.

The first fix, checking `entry.boundingClientRect.top < 0` inside the callback,
did nothing: the callback was never invoked at all.

The fix is a **scroll-end sweep** that reveals anything still pending once
scrolling stops. It runs on `scrollend` where supported and on a 150ms-debounced
`scroll` otherwise — never per frame, which the master command forbids.
Verified in both Chromium and WebKit: 10 reveal targets, 0 left hidden.

## 6. Reduced motion

CSS zeroes every animation, transition and transform, including both halves of
the route transition. Behaviour-level too: the observer is not created at all
and everything is revealed immediately, so nothing is left mid-transition.

No meaning is ever carried by motion — every status is text or an icon — so
switching motion off removes no information.

## 7. Route transitions

Astro's `ClientRouter` with `fallback="none"`. Where the View Transition API is
unsupported the browser simply navigates: the JS-simulated fallback is exactly
the "route spectacle" the master command warns against.

The header carries `transition:persist`, so the same element survives a
navigation — asserted by marking it and checking the marker after navigating.
Focus moves to the new `main` with `preventScroll`, so a keyboard user is not
left at the bottom of the previous page.

**Scripts re-run per page.** The client router replaces the body, so `shell.ts`,
the two filter islands and the motion layer all re-initialise on
`astro:page-load`; document-level listeners are guarded to bind once. A test
navigates client-side and then opens the mobile drawer, which would be dead if
this were wrong.

## 8. Parallax: deliberately not implemented

Tab 11's parallax policy applies **if** parallax exists. It does not.

There is no approved hero imagery (B-6), and "purpose before spectacle" gives no
reason to attach scroll-linked movement to a text hero. A test asserts no
component mentions parallax or scroll-linked transforms, so the acceptance check
_"parallax is clamped and disabled on touch/reduced-motion/Save-Data"_ is
answered honestly — by absence — rather than vacuously.

## 9. The official logo does not move

A unit test asserts `LogoLockup.astro` contains no `animation`, `@keyframes`,
`filter`, `mix-blend-mode` or rotate/scale/skew transform, and carries no
`data-reveal` or `data-enter` attribute. A browser test additionally reads
computed style on every rendered logo.

The only motion the master command permits — a 120–160ms whole-badge opacity
fade — is **not used**. The logo is simply present.

## 10. Performance posture

Only `transform` and `opacity` are animated; a test asserts no keyframe touches
width, height, top, left, margin or padding. `will-change` is never applied. No
`setInterval`, no WebGL, no canvas, no autoplay video.

The motion layer is one small module with no dependencies, well inside the 20KiB
budget. A browser test asserts **no console error on any route**.

_Not yet measured:_ frame rate on a representative mobile device. Tab 15 owns
performance sign-off, and no claim about 60fps is made here.
