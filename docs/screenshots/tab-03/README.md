# Tab 03 evidence — Concept UI

`/internal/style-guide` after Tab 03, captured 2026-09-03 from the **production**
build. It now includes the external-handoff row: all six actions resolve to
their honest unavailable state, each showing its reason as visible text.

The content-status labels section renders nothing here, which is the point — in
a production build sample and draft records are absent from the registry
entirely, so there is nothing to label. Run `npm run build:review` to see them.
