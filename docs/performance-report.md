# Performance report

Tab 14 of the PAAIPE Frontend Master Command. Measured, not estimated. Every
number below is reproducible with the command named beside it.

---

## 1. Measured bytes

`npm run verify:budgets` — gzip for text, raw bytes for already-compressed
images, read from the actual production build.

```
Performance budgets - measured from the build (gzip for text, raw for images)

  route                 html        js       css       img    initial
  /                  8.5 KiB   9.6 KiB   5.7 KiB  80.3 KiB  104.1 KiB
  /membership        7.9 KiB   9.6 KiB   5.8 KiB  80.3 KiB  103.6 KiB
  /events            6.8 KiB  10.1 KiB   5.7 KiB  80.3 KiB  102.9 KiB
  /resources         7.2 KiB  10.2 KiB   4.7 KiB  80.3 KiB  102.4 KiB
  /programs          7.4 KiB   9.6 KiB   4.7 KiB  80.3 KiB  102.1 KiB
  /about             6.7 KiB   9.6 KiB   4.7 KiB  80.3 KiB  101.3 KiB
  /accessibility     6.6 KiB   9.6 KiB   4.7 KiB  80.3 KiB  101.2 KiB
  /benefits          6.3 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.9 KiB
  /speakers          5.9 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.5 KiB
  /partners          5.9 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.5 KiB
  /responsible-ai    5.7 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.4 KiB
  /privacy           5.6 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.3 KiB
  /contact           5.5 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.2 KiB
  /terms             5.4 KiB   9.6 KiB   4.7 KiB  80.3 KiB  100.0 KiB
  /404               2.9 KiB   9.6 KiB   4.7 KiB   0.0 KiB   17.3 KiB

  route-js           worst  10.2 KiB  of 100.0 KiB  (90% headroom)
  css                worst   5.8 KiB  of  50.0 KiB  (88% headroom)
  fonts              worst   0.0 KiB  of 150.0 KiB  (100% headroom)
  lcp-image          worst  80.3 KiB  of 250.0 KiB  (68% headroom)
  initial-transfer   worst 104.1 KiB  of 1024.0 KiB  (90% headroom)
  motion-js          worst   2.0 KiB  of  20.0 KiB  (90% headroom)

  Images are budgeted against the PNG fallback. A browser with WebP support
  downloads up to 21.5 KiB less per page than the figures above.

  Not measured here: LCP, INP, CLS and Lighthouse scores. Those need a rendered
  page on real hardware over a real network - see docs/performance-report.md.

PASS
```

The worst route is the home page at ~103 KiB of initial transfer against a
1 MiB budget. Roughly **78% of that is one image**: the header logo, at 80.3 KiB
as PNG. Everything else on the page — HTML, all JavaScript, all CSS — is about
23 KiB compressed.

### Why the logo is the whole story

The canonical brand files are 1.35 MB (2000x2000) and 480 KB (1800x627). They
are the source of record and are never altered, so delivery uses proportional
downscales. The horizontal lockup has exactly **two** exact downscales below
1:1 — 1200x418 and 600x209 — because `gcd(1800, 627) = 3`. There is no
integer-dimension 300px-wide rendition, so `srcset` by width is not available
without changing the aspect ratio, which is forbidden.

What _is_ available is a better codec at the same pixels:

| Format            | Bytes        | Note                                                                  |
| ----------------- | ------------ | --------------------------------------------------------------------- |
| PNG (fallback)    | 82.2 KiB     | The rendition of record                                               |
| **lossless WebP** | **58.8 KiB** | **Shipped first via `<picture>`. Pixel-identical wherever alpha > 0** |
| lossy WebP, q90   | 32.4 KiB     | **Not used.** It alters the artwork                                   |
| lossless AVIF     | 100.6 KiB    | **Not used.** Larger than the PNG                                     |

A browser with WebP support downloads **21.5 KiB less per page**. AVIF is absent
because adding it would cost bytes — a format chosen to satisfy a word in a
brief rather than to make the page faster.

Font transfer is **0 KiB** on every route. No webfont is loaded, because no
typeface is approved (owner item **B-5**); the site uses a system font stack.
When a typeface is approved it must be self-hosted, subset, WOFF2, and
`font-display: swap`, and it has 150 KiB of budget to fit in.

---

## 2. Lighthouse

`npm run lighthouse` — median of three runs per route, Lighthouse's default
**mobile** preset with simulated throttling. Full per-run output in
`docs/lighthouse.json`.

| Route         | Performance | Accessibility | Best Practices | SEO | LCP   | CLS   | TBT |
| ------------- | ----------- | ------------- | -------------- | --- | ----- | ----- | --- |
| `/`           | 98          | 100           | 100            | 100 | 2.10s | 0.000 | 0ms |
| `/resources`  | 99          | 100           | 100            | 100 | 1.95s | 0.000 | 0ms |
| `/membership` | 98          | 100           | 100            | 100 | 2.10s | 0.000 | 0ms |

Targets are 90 for Performance, SEO and Best Practices, and 100 for
Accessibility. All are met.

Those three routes were chosen for what they exercise, not for being the
easiest: `/` is the richest page and holds the LCP candidate, `/resources`
runs the most client-side JavaScript on the site (the topic filters), and
`/membership` has the most form controls and the deepest content.

### What Lighthouse found that nothing else had

The first run scored **96** on Best Practices, from a single failing audit:
`image-aspect-ratio`. Chasing it uncovered a real defect that had been
shipping since Tab 02.

`global.css` sets `img { max-width: 100%; height: auto }` for responsive
content images. `LogoLockup` uses optical alignment — negative margins that
pull the artwork so its _visible_ box, not its padded canvas, aligns to the
element box — which makes the wrapper **narrower than the image**.
`max-width: 100%` then clamped the image to that narrower wrapper, while the
component's explicit `height` overrode the `height: auto` that would
otherwise have preserved the ratio.

Measured on the home page header:

| State                     | Rendered       | Ratio  |
| ------------------------- | -------------- | ------ |
| As shipped through Tab 13 | 177.05 x 68.27 | 2.5935 |
| With `max-width: none`    | 196.00 x 68.27 | 2.8711 |
| Intrinsic (600 x 209)     | —              | 2.8708 |

**The PAAIPE logo was squashed 9.7% horizontally on every page of the site.**
No visual review had caught it, no test asserted the ratio, and the width and
height attributes in the markup were correct — only the layout engine knew what
`max-width` had done to them. Two smaller faults were fixed alongside it: the
declared height was rounded to an integer (68 instead of 68.273, a 0.4%
vertical stretch), and the width/height _attributes_ now carry the rendition's
own intrinsic dimensions so the browser reserves space from the correct ratio.

`tests/e2e/seo.spec.ts` now asserts rendered ratio against intrinsic ratio on
three routes in both browsers, with a 0.5% tolerance. Removing
`max-width: none` fails it with the measured numbers in the message.

### The other failing audits, and why they stay

| Audit                                                        | Verdict                                                                                                                                                                                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache-insight`                                              | An artefact of `scripts/preview-server.mjs`, which sets no cache headers. It serves tests, not visitors. The recommended production caching is in §2 of `docs/security-privacy-handoff.md` and must be verified against the real host. |
| `render-blocking-insight`, `network-dependency-tree-insight` | The stylesheet is render-blocking by design. Inlining it would remove the block but make every page carry its CSS in the HTML, uncached across navigations. At 4.7–5.8 KiB compressed and 0 CLS, blocking is the right trade.          |
| `document-latency-insight`, `image-delivery-insight`         | Both are dominated by the same thing: no compression or cache headers from the preview server, and the 80 KiB PNG fallback. Re-measure after deploy.                                                                                   |

---

## 3. Core Web Vitals

| Metric | Target  | Lab reading                 |
| ------ | ------- | --------------------------- |
| LCP    | ≤ 2.5s  | 1.95–2.10s                  |
| INP    | ≤ 200ms | not measurable in a lab run |
| CLS    | ≤ 0.1   | 0.000                       |

**These are lab numbers and the targets are field targets.** They are not the
same claim. A simulated-throttling run on a developer Mac in Manila's daytime
does not tell you what a visitor on a mid-range Android over mobile data gets,
and reporting it as if it did would be the most convenient available lie.

INP in particular cannot be produced by a lab run at all: it measures real
interactions. Total Blocking Time is 0ms, which is a good sign and not the same
metric.

### Animation, measured directly — Tab 15

Tab 15 asks specifically whether animation causes CLS, slow INP or long
animation frames. That is a narrower question than a Lighthouse score, so it is
measured directly in the browser, with `PerformanceObserver` watching
`layout-shift` and `longtask` while the page is scrolled end to end so every
reveal animation runs.

| Measure                                 | Result    | Threshold                                 |
| --------------------------------------- | --------- | ----------------------------------------- |
| CLS while scrolling the whole home page | **0.000** | < 0.02 asserted, 0.1 is the CWV threshold |
| Longest blocking task while animating   | **0 ms**  | < 50 ms                                   |

The check runs in Chromium only, and says so: `layout-shift` and `longtask` are
not implemented in Firefox or WebKit, so an observer there would return nothing
and the test would pass by measuring nothing. It asserts the entry types are
supported before it trusts a zero.

#### What it found: CLS 0.200 on every page load

The first run measured **0.200** — twice the Core Web Vitals threshold — from a
single shift 29 ms after load.

The dismiss button on the announcement bar ships `hidden` and is revealed by
script. As a flex item it changed the bar in two ways at once: it is a 44 px
touch target, taller than the text row, so the bar grew **21 px** and pushed the
whole page down; and its `margin-inline-start: auto` absorbed the free space,
which left `justify-content: center` nothing to distribute, so the text stopped
being centred and snapped to the left.

**Lighthouse reported CLS 0.000 for the same page.** Its run did not reach the
state that shifts. That is the finding to carry forward: a lab score is an
aggregate of one particular run, and a targeted observer asking one question
answered it in a way the score could not.

The button is now out of flow, with its space reserved unconditionally, so the
bar has identical geometry with JavaScript on or off. Putting it back in flow
reproduces the shift at 0.185 — the guard was break-checked.

### Real-user monitoring plan

Nothing here is implemented, because it needs a decision this lane cannot make.

1. **Collect field data with the `web-vitals` library**, reporting LCP, INP
   and CLS. It is ~2 KiB and adds no third-party request if the endpoint is
   first-party.
2. **The payload must carry no personal data**: metric name, value, rating,
   navigation type, and a coarse route identifier taken from the route
   registry — never the full URL with its query string, never a session or
   member identifier, never a user agent string beyond a device-class bucket.
3. **This is analytics, so it needs approval and consent.** Per Tab 14 the site
   ships with no trackers, and `scripts/verify-budgets.mjs` currently _fails_
   on an analytics endpoint. Enabling this means changing that gate
   deliberately.
4. **Segment by device class and connection**, or the median hides exactly the
   visitors the targets exist to protect.
5. **Re-run `npm run lighthouse` after deploy against the real origin**, so
   the compression and caching the host actually applies are in the numbers.

---

## 4. Implementation notes

- Every public route is **prerendered static HTML**. There is no server runtime
  and no client-side framework.
- **No island hydrates.** The only client JavaScript is progressive
  enhancement: the shell (drawer, sticky header, announcement dismissal), the
  motion layer, the preference panel, the two filter controls and the copy
  control. Route JS peaks at 10.2 KiB compressed, of which the motion layer is
  2.0 KiB.
- **The LCP candidate is not lazy-loaded.** The header lockup is
  `loading="eager"`, `decoding="sync"`, `fetchpriority="high"`. It is the
  _only_ image on the site with high priority — the gate fails if a second one
  claims it, because prioritising everything prioritises nothing.
- **Every other image is `loading="lazy"`**, including the footer lockup.
- **Every image declares width and height**, and the gate fails on one that
  does not. CLS is 0.000 on all three measured routes.
- No autoplay video, no WebGL, no large background blur, no third-party script.
  The one decorative canvas (`NetworkField`) draws once and settles, so it
  needs no pause control; it is also disabled by the ambient-motion preference.

---

## 5. Reproducing this

```sh
npm ci
npm run verify:budgets      # bytes, from the build
npm run lighthouse          # median of three, mobile preset, writes docs/lighthouse.json
npm run check               # every gate, including budgets
```

---

## 6. Budgets in CI

The master command says to track budgets in CI and to document justified
exceptions with an owner and an expiry.

**There is no CI workflow, by standing repository rule** — no
`.github/workflows`, and no workflow scope on any token. The budgets are
tracked instead by `npm run verify:budgets`, which is part of `npm run check`
and therefore runs before every commit and every push.

This is a substitution of _where_ the gate runs, not a reduction in _what_ it
gates. It is worth being explicit about what is lost: a local gate can be
skipped by someone who does not run it, and CI cannot. That risk is accepted
knowingly, and it is the reason `check` is a single command rather than a
checklist.

Exceptions live in `BUDGET_EXCEPTIONS` in `src/config/budgets.ts`. **The list
is empty** — no budget is over, so nothing is excepted. An entry missing an
owner, a reason or a future expiry date fails the gate rather than granting an
open-ended pass, and `src/tests/budgets.test.ts` asserts that rule now, before
the first exception is written rather than after.
