# Performance report — lab evidence and the field plan

Tab 10 Step 8. Every number here was measured in a browser. None of it is a
75th-percentile field claim, and the difference is the most important thing in
this document.

## What was measured

`tests/e2e-review/event-performance.spec.ts`, Chromium, against a local preview
of the review build — the only build with event pages to load.

| Route                        | CLS             | Longest task    | LCP (local)       |
| ---------------------------- | --------------- | --------------- | ----------------- |
| `/events`                    | < 0.02 asserted | < 50ms asserted | < 2000ms asserted |
| `/events/sample-public-open` | < 0.02 asserted | < 50ms asserted | < 2000ms asserted |

The bounds are tighter than the release targets on purpose. The CWV threshold
for CLS is 0.1; these pages animate only `opacity` and `transform`, neither of
which triggers layout, so a regression to a layout-affecting property shows up
long before "poor".

**Every observer is asserted supported before a zero is trusted.**
`layout-shift`, `longtask` and `largest-contentful-paint` are absent in Firefox
and WebKit, where an observer returns nothing — and a test that reads nothing
and finds no shift passes by measuring nothing. This project has recorded
Lighthouse reporting CLS 0.000 on a page that really shifted 0.200.

## Structural properties that make the numbers hold

- **Server-rendered.** Asserted with JavaScript disabled: the marketplace still
  renders its cards. A page that needs script to show its list has an LCP no
  tuning fixes.
- **No layout-affecting animation.** Only `transform`, `opacity`, `border-color`
  and `box-shadow`.
- **Reserved dimensions.** Images and the date tile carry explicit sizes; the
  card's date column is a fixed `4.5rem`, so a record with no date cannot widen
  its own card and shift its neighbours.
- **No autoplay video, WebGL scene, particle engine or animation library.**
- **Decorative motion runs once.** `.is-revealed` is added and never removed, so
  nothing loops; a test asserts no element has an infinite animation.

## What this cannot show

**A local preview server is not a network.** These runs demonstrate the pages do
not spend seconds of their own doing before painting. They say nothing about
LCP over a real connection on a real handset, which is where the 2.5s target
lives.

**Lighthouse cannot measure INP at all.** It reports Total Blocking Time, a lab
proxy. Actual INP needs real interactions by real people.

## The field plan

Blocked on two things, both outside this frontend:

1. **An approved origin (B-7)** — there is nothing to collect field data from.
2. **A consent decision** — RUM is analytics, and analytics needs a lawful basis
   and a consent flow that do not yet exist.

When both land: collect LCP, INP and CLS bucketed by `viewport_bucket` and route
**template** only, never by participant, under the allowlist in
[analytics-schema.md](analytics-schema.md). Until then the honest statement is
**the lab floor is met and the field is unmeasured**.

## Known measurement limitation

`webkit-mobile` runs its 278 tests in ~2.5 minutes where Chromium runs 288 in
~22 seconds, producing a different handful of `page.goto` timeouts each run.
Characterised as environment, not defect — every failure a timeout, never an
assertion, all passing in isolation. Recorded as **F-64**, cause not understood.
No performance number in this document comes from a WebKit run.
