# Screen recordings

Two recordings of the **same walk**, at 1280×800, captured by
`npm run recordings`.

| File                  | Motion preference                                  |
| --------------------- | -------------------------------------------------- |
| `default-motion.webm` | `no-preference` — the site as most visitors see it |
| `reduced-motion.webm` | `reduce` — the same walk with the OS setting on    |

## Why two, and why the same walk

The pair is the evidence. A single recording of the reduced-motion mode proves
nothing on its own: it looks like a site with no animation. Watching the two
side by side is what shows the property that matters — **reduced motion removes
movement without removing content, layout or any control.**

Reduced motion is requested through `emulateMedia`, the same signal an operating
system sends, rather than by setting the in-page preference. The OS path is the
one most visitors who need it will actually use, and it is the path that has to
work before any in-page control matters.

## The walk

1. Home page load, then four scroll steps — the below-the-fold reveals.
2. Back to the top; a desktop dropdown opened by **keyboard focus**, not hover,
   then dismissed with Escape.
3. A route transition to `/membership`, then a scroll.
4. An accordion opening — the one component with its own easing.

## What to look for in the comparison

|                               | Default               | Reduced                          |
| ----------------------------- | --------------------- | -------------------------------- |
| Cards entering on scroll      | Fade and rise 8–12 px | Present immediately, no movement |
| Dropdown                      | 160 ms fade and lift  | Appears                          |
| Route change                  | View transition       | Plain navigation                 |
| Accordion                     | 180 ms chevron        | Opens                            |
| **Content, layout, controls** | **Identical**         | **Identical**                    |

If anything is missing from the reduced-motion recording that is present in the
other, that is a defect — reduced motion is a request for less movement, never
for less site.

Format is WebM (VP8), which every current browser plays. They are ~1 MB each.
