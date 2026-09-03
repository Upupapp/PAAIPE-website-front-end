# Tab 13 evidence — Concept UI

The two states Tab 13 asks for evidence of, both on `/membership`, captured
2026-09-03 from the production build under `reducedMotion: 'reduce'`.

| File                           | State                                                              |
| ------------------------------ | ------------------------------------------------------------------ |
| `reflow-320-membership.png`    | 320 CSS px — the narrowest width the master command names          |
| `zoom-200-1280-membership.png` | 1280px with the root font size doubled — WCAG 1.4.4 text-only zoom |

In the 200% capture the desktop navigation **wraps onto two rows** — links
above, the two actions below — rather than overflowing. Before the fix it ran
142px off the right edge and its links were unreachable, because a media
query's `em` resolves against the initial 16px and the `64em` breakpoint never
moves however far text is zoomed.

Full findings in `docs/accessibility-report.md`, including three detectors of
mine that were reporting defects that did not exist.
