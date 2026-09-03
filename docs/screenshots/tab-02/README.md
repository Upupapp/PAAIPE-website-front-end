# Tab 02 evidence — Concept UI

Full-page captures of `/internal/style-guide`, 2026-09-03, from the production
build served by `scripts/preview-server.mjs`.

- `desktop-1440x900-internal-style-guide.png` — Chromium, full page
- `mobile-390x844-internal-style-guide.png` — **WebKit**, full page

The page renders every primitive in every state, the colour tokens, the type and
spacing scales, and both contrast tables. The contrast figures are computed at
build time from `src/config/tokens.ts`, so the screenshot shows the same numbers
`npm run verify:contrast` reports.

Label these **Concept UI** in review material.
