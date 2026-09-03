# Haptics and microinteractions

Tab 12 deliverable: the guarded helper, the preference behaviour, and the
support matrix.

---

## 1. The short version

**Haptics are off by default, and nothing on this site depends on them.**

The Vibration API is unsupported on iOS/Safari and may silently do nothing
elsewhere. Every guard in `src/lib/haptics.ts` returns `false` rather than
throwing or logging: normal non-support is not an error and is never reported as
one. A browser test deletes `Navigator.prototype.vibrate`, exercises every
control, and asserts **no console output and identical behaviour**.

## 2. Support matrix

| Platform                        | Vibration API                  | What a visitor sees                                                   |
| ------------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| iOS Safari (all versions)       | **Not supported**              | The haptics row is **not rendered at all**. Nothing else changes      |
| iOS, other browsers             | Not supported (all use WebKit) | Same                                                                  |
| Android Chrome                  | Supported                      | The row appears, off by default. Switching it on gives one 10ms pulse |
| Android Firefox                 | Supported                      | Same                                                                  |
| Desktop Chrome / Edge           | API present, no hardware       | Row appears; `vibrate()` returns and nothing happens. No error        |
| Desktop Safari / Firefox        | Not supported                  | Row not rendered                                                      |
| Any platform, reduced motion on | Irrelevant                     | Guarded off regardless of the preference                              |

The row is hidden rather than disabled where the API is absent: offering a
preference that could never take effect is its own kind of dishonesty.

Both paths are covered by test — the browser projects here (Chromium desktop,
WebKit mobile) exercise the **unsupported** path, and the supported path is
covered by the pure-function guard tests, which is the only way to assert it
without an Android device.

## 3. The guarded helper

`shouldVibrate()` is separated from the browser so **every guard is testable
without one**. Each is asserted independently:

| Guard           | Blocks when                                                   |
| --------------- | ------------------------------------------------------------- |
| Preference      | Haptics not switched on — the default                         |
| Reduced motion  | `prefers-reduced-motion: reduce`                              |
| Support         | `'vibrate' in navigator` is false                             |
| Visibility      | `document.visibilityState !== 'visible'`                      |
| User activation | `navigator.userActivation.isActive` is false                  |
| Rate limit      | Under 750ms since the last, or six already in the last minute |

No blocking permission flow is ever requested. Vibration is cancelled with
`navigator.vibrate(0)` on `visibilitychange`, on `pagehide`, and when the
preference is switched off.

### Rate limiting, actually tested

The limiter has state, so `recordHaptic()` is exported and the tests drive it
directly: one fire, then blocked at +1ms and +749ms, allowed at +750ms; six
fires at the minimum interval, the seventh blocked even though 750ms has passed,
and allowed again once the first ages out of the 60-second window.

## 4. A finding about the approved patterns

The master command says _"No single pulse may exceed 30ms"_ and gives
`[12, 36, 18]` as an approved pattern. Read as "no array entry above 30", that
pattern is non-compliant.

It is not. **A Vibration API pattern array alternates pulse, pause, pulse,
pause…** so in `[12, 36, 18]` the 36 is _silence_. The pulses are 12ms and 18ms,
and the total vibrating time is 30ms across a 66ms span.

`patternPulses()` and `patternPauses()` make that explicit in code, and the
tests assert the 30ms ceiling against pulses only. The first version of the test
treated every entry as a pulse and reported an approved pattern as a violation —
a measurement error, not a spec error.

| Pattern                                       | Span | Actual vibrating time | Longest pulse |
| --------------------------------------------- | ---- | --------------------- | ------------- |
| `light-acknowledgment` = `10`                 | 10ms | 10ms                  | 10ms          |
| `confirmed-important-action` = `[12, 36, 18]` | 66ms | 30ms                  | 18ms          |
| `recoverable-warning` = `[18, 55, 18]`        | 91ms | 36ms                  | 18ms          |

## 5. What actually calls it

**One caller: the haptics toggle being switched on.**

That is a genuine "major user-enabled toggle", which is exactly what the light
acknowledgment pattern is for, and it doubles as the honest way to show whether
the device supports it at all.

Nothing else vibrates — not page load, route change, scroll, hover, focus,
typing, menu traversal, a notification, or an ordinary tap. The other two
patterns are defined and tested but **have no caller**, because no
server-confirmed action exists yet and fabricating one to demonstrate a pattern
is exactly what the master command forbids.

## 6. Preferences

Three switches, on `/accessibility`, all local to one browser.

| Preference                 | Default       | Effect                               |
| -------------------------- | ------------- | ------------------------------------ |
| Reduce motion              | Follow system | `on` removes all animation site-wide |
| Pause background animation | Allow         | `on` stops the decorative field only |
| Haptic feedback            | **Off**       | Shown only where vibration exists    |

**Not identifiers.** Keys come from a closed union and values from
`'on' | 'off' | 'system'`, so the module cannot express an id, a timestamp or a
counter. `Math.random`, `crypto.randomUUID` and `Date.now()` are asserted
absent. Returning a preference to its default **removes** the entry rather than
storing the default — an empty store is the honest representation of "changed
nothing", and a test asserts it.

Controls ship `disabled` and the no-JS explanation ships visible; script
reverses both, so a visitor without JavaScript is never shown a switch that
would silently do nothing.

### Storage boundary: read and write are now separate

The pre-paint inline script reads a preference before first paint. Setting the
attribute later meant animation started and was then cancelled mid-flight — a
visible flash for precisely the person who asked for less motion.

That made `BaseLayout.astro` a third file touching storage, so the guard was
split: three files may **read**, only two may **write**, and a test asserts the
layout contains no `setItem`, `removeItem` or `clear`.

## 7. Microinteractions

| Interaction    | Behaviour                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Desktop menu   | opacity + 6px rise over 160ms, opens on hover **and** focus-within                                                |
| Mobile drawer  | 280ms, focus trapped while modal, Escape closes, focus returns                                                    |
| Button press   | Visual feedback within 80ms; width fixed through loading                                                          |
| Card           | 220ms lift with a cyan border, no layout shift                                                                    |
| Accordion      | Native `<details>`; chevron 180ms, instant under reduced motion                                                   |
| Filter chips   | Fill **plus** a check glyph **plus** `aria-pressed` — never colour alone                                          |
| Filter results | One group fade per change; result count announced politely, debounced 400ms so typing does not narrate            |
| Copy link      | Icon → check, label → "Copied", one polite announcement, reverts after 1800ms. Repeated clicks do not re-announce |
| Form errors    | Border transitions over 120ms with a persistent inline message and glyph. **Never a shake**                       |
| Skeleton       | Restrained opacity pulse; static under reduced motion                                                             |

### A defect the linter caught

The 140ms group fade was written as a helper and **never called**. The
requirement was documented, the code existed, and nothing happened —
`no-unused-vars` was the only thing that noticed. It is now invoked on a topic
change but _not_ on every keystroke, since a fade per character is the per-row
spectacle the master command rules out.

## 8. Nothing pretends

No fake form submission, RSVP, registration, save or benefit claim exists
anywhere. `/contact` has no form at all; the updates signup has no `<form>`
element; every external action resolves to a disabled control with its reason in
text. A success animation is reachable only after a real endpoint confirms, and
there is no endpoint.
