# Tab 11 evidence — Concept UI

| File                                                   | What it shows                                                  |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `desktop-1440x900-home-default-motion.png`             | The home page **at rest** with motion enabled, 1.5s after load |
| `desktop-1440x900-home-reduced-motion.png`             | The same page under `prefers-reduced-motion: reduce`           |
| `desktop-1440x900-home.png`, `mobile-390x844-home.png` | Full-page captures                                             |

## The two motion captures, compared

The pair exists to answer one question: **does turning motion off change what
the page says?** It must not — motion may change how content arrives, never
what arrives or where it settles.

Measured at rest, three seconds after load:

|                                     | motion | reduced |
| ----------------------------------- | ------ | ------- |
| Running animations                  | 0      | 0       |
| Hero `h1` opacity                   | 1      | 1       |
| Decorative node opacity             | 1      | 1       |
| Decorative line `stroke-dashoffset` | 0px    | 0px     |

**Computed style is identical.** The images differ by a mean of 0.34/255, with
about 0.3% of pixels above a visible threshold — all of them inside the header's
navigation text, and invisible when the region is cropped and compared at 1.5×.
The cause is text antialiasing: `view-transition-name` promotes the header to
its own compositing layer, which can switch text from subpixel to greyscale
rendering. No element differs in content, position, size or colour.

Recorded rather than claimed identical, because "the screenshots match" would
have been an overstatement of what was actually measured.

All captures run under `reducedMotion: 'reduce'` by default in
`scripts/capture-screenshots.mjs` — see `docs/shell-and-navigation.md` §9 for
why a `fullPage` capture otherwise paints a mid-transition state.
