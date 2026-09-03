# Browser and device matrix — Tab 15

> **Generated file.** Produced from `src/config/qa.ts` by `npm run qa:write`.
> `npm run qa:check` fails if it drifts. Edit the config, not this document.

4 of 7 targets are covered by an automated engine
project. 3 are **not**, and the reason is stated for each — an
uncovered row with no explanation is the same as no row at all.

| Target | Status | Coverage |
| --- | --- | --- |
| Desktop Chrome (current) | automated | Playwright chromium-desktop project: full suite including axe-core |
| Desktop Edge (current) | manual-pending | Not run. Edge is Chromium with additions; the chromium-desktop project covers the engine, not the browser. A manual pass is still owed. |
| Desktop Firefox (current) | automated | Playwright firefox-desktop project: full suite including axe-core |
| Desktop Safari (current) | automated | Playwright webkit-desktop project: full suite. Playwright WebKit is not Safari’s shipping build, so this is engine coverage. |
| iOS Safari (current) | automated | Playwright webkit-mobile project (iPhone 13 viewport, touch, mobile UA). Real-device behaviour - input zoom, dynamic viewport units, VoiceOver - is NOT covered. |
| iOS Safari (previous major) | not-possible-here | Not run. Requires a real device or a simulator with an older iOS installed. |
| Android Chrome (current) | not-possible-here | Not run. No Android device or emulator is available on this machine, and a resized desktop Chromium is not Android Chrome. |

## The distinction this table exists to preserve

**An engine is not a browser, and a viewport is not a device.**

Playwright drives the same engines the browsers ship — Chromium, Gecko, WebKit —
and that is strong evidence. It is not the same thing as running Chrome, Edge or
Safari, each of which layers its own features, defaults and quirks on top. It is
much further from running on a real handset, where touch targets, input zoom,
the dynamic viewport, throttled hardware and a screen reader all behave
differently from an emulated viewport on a developer Mac.

So every row says which kind of coverage it is. A row marked `automated` is
engine coverage. Nothing in this repository is a real-device pass, and
`src/tests/qa.test.ts` asserts that no row claims to be.

## What each automated project runs

| Project | Viewport | Suite |
| --- | --- | --- |
| `chromium-desktop` | Desktop Chrome | Full suite including axe-core |
| `firefox-desktop` | Desktop Firefox | Full suite including axe-core |
| `webkit-desktop` | Desktop Safari | Full suite including axe-core |
| `webkit-mobile` | iPhone 13, touch, mobile UA | Full suite including axe-core |
| `visual-chromium` | 320 / 390 / 768 / 1024 / 1440 | Pixel baselines only |

Visual regression runs in **one** engine deliberately: a pixel baseline is
engine-specific, so three engines would mean three sets of baselines and three
ways for an unrelated browser update to turn the suite red for no product
reason. Cross-engine differences are caught by the geometry and behaviour
assertions, which do run everywhere — and did: Firefox found a measurement fault
in the logo aspect-ratio test that Chromium and WebKit had both masked by
decoding a lazy image early.

## What is still owed

- **Desktop Edge**, current: a manual pass. Chromium covers the engine.
- **iOS Safari**, previous major: a real device or an older simulator runtime.
- **Android Chrome**, current: a real device or an emulator. A resized desktop
  Chromium is not Android Chrome and must not be recorded as one.
