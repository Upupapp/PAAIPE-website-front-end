# Tab 04 evidence — Concept UI

Captured 2026-09-03 from the production build. Desktop 1440×900 (Chromium),
mobile 390×844 (**WebKit**), full page.

The pointer is parked clear of the header before each capture: a `fullPage`
screenshot perturbs the viewport and makes Chromium re-evaluate hover targets,
which previously caught the header dropdowns mid-transition and showed a menu
state no visitor sees. See `docs/shell-and-navigation.md` §9.
