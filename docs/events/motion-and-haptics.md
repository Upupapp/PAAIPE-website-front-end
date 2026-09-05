# Event surfaces — motion tokens and the haptic decision log

Tab 08 deliverable. Written by hand and kept short, because the values it
records live in `src/styles/motion.css` and `src/lib/haptics.ts` and are asserted
by tests; this document explains the **decisions**, which no test can.

## Motion tokens

The command supplies a token list and says to "use existing portal tokens where
available". They already existed, from the original portal's Tab 12, and are
reused unchanged. Two differ from the command's literal values:

| Token               | Command                    | This portal               | Why the portal's value stands                                                                                                                                                                                                           |
| ------------------- | -------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--motion-instant`  | 80ms                       | 80ms                      | identical                                                                                                                                                                                                                               |
| `--motion-fast`     | 140ms                      | 140ms                     | identical                                                                                                                                                                                                                               |
| `--motion-standard` | 220ms                      | 220ms                     | identical                                                                                                                                                                                                                               |
| `--motion-slow`     | 320ms                      | 320ms                     | identical                                                                                                                                                                                                                               |
| `--motion-emphasis` | 480ms                      | 480ms                     | identical                                                                                                                                                                                                                               |
| `--ease-standard`   | `cubic-bezier(.2,.8,.2,1)` | `cubic-bezier(0.2,0,0,1)` | The portal's curve is already applied to every button, drawer and reveal on the site. Changing it would restyle the whole portal to match an events tab, which is the opposite of "clearly continuous with the accepted PAAIPE portal". |
| `--ease-enter`      | `cubic-bezier(.16,1,.3,1)` | identical                 | —                                                                                                                                                                                                                                       |
| `--ease-exit`       | `cubic-bezier(.4,0,1,1)`   | identical                 | —                                                                                                                                                                                                                                       |

### What the event components animate

Only `transform`, `opacity`, `border-color` and `box-shadow`. Nothing animates
`width`, `height`, `top`, `left` or a grid track, so no interaction can trigger
layout and shift text under a reader's eye.

| Element            | Pointer / focus                                                           | Reduced motion                                 |
| ------------------ | ------------------------------------------------------------------------- | ---------------------------------------------- |
| Event card         | `translateY(-3px)` and a cyan edge shadow, **fine pointer only**          | no travel, no shadow; the border still changes |
| Detail hero        | one-time opacity and rise via the shared `data-enter` system              | immediate, fully opaque                        |
| Registration panel | one `--motion-emphasis` border-colour settle on first entering view, once | no settle                                      |
| FAQ                | native `<details>`, no height animation                                   | identical                                      |
| Copy-link          | icon, label and one polite announcement                                   | identical                                      |

**The card lift is `any-hover: hover` and `pointer: fine`.** On a touch screen
`:hover` sticks after a tap, so a card would stay raised with an edge light that
no longer means anything.

**The FAQ deliberately does not animate.** The command permits a 180–220ms
opacity/height transition "only if stable and tested". Animating the height of a
native `<details>` is not stable across engines, and the reason `<details>` was
chosen is that its answers stay reachable with JavaScript disabled. The instant
expand is the command's own reduced-motion behaviour, applied to everyone.

## Haptic decision log

**Decision: no event-registration haptic is called in this release.**

Every guard the command asks for already exists in `src/lib/haptics.ts`, built
for the original portal's Tab 12: the flag defaults off, an explicit user
preference is required, `navigator.vibrate` is feature-detected and fails
silently, the document must be visible, a user gesture is required, firing is
rate-limited, and `cancelHaptics()` calls `navigator.vibrate(0)` on teardown.
Reduced motion disables it.

**What Tab 08 changes is the pattern, not the guards.** The portal's
`confirmed-important-action` is `[12, 36, 18]` — three pulses over 66ms. Tab 08
narrows this moment to "at most one 8–12ms pulse". The two commands disagree and
the narrower one governs the event journey, so the event confirmation must use
`light-acknowledgment` (a single 10ms pulse) and not the pattern whose name
sounds more appropriate.

**Why nothing calls it yet.** The command is explicit: "Do not call this wrapper
until a real gateway response maps to `registered` or `waitlisted` and the result
is visibly announced." No gateway exists — Tab 05 builds the form and is blocked
on the owner, Tab 07 defines the outcome mapping and is blocked on the backend.
Adding the call now would mean inventing a success state to attach it to, which
is the one thing this repository refuses to do.

A test in `src/tests/haptics.test.ts` pins the constraint so that whoever writes
the caller inherits it rather than rediscovering it.

## What was found while doing this

Recorded in full in `PENDING.md`; the short form:

- **Every event card was transparent**, and had been since Tab 03. The
  background token was undefined, so the declaration was dropped in silence.
- **The two access badges rendered identically**, so the distinction the badge
  exists to make — "anyone" versus "members" — was not being made.
- **The marketplace scrolled horizontally at 768px and 1024px.** The
  accessible-name link was a grid item, and its text sized the card's `auto`
  column to 284px of 342px, collapsing the body column to zero and pushing the
  date tile off the page.
- **The reduced-motion tests were not running in reduced motion.**
