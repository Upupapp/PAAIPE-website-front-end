# Tab 12 evidence — Concept UI

`/accessibility`, which is where the preference panel lives. Captured
2026-09-03 from the production build.

The haptics row **is** visible in these captures because desktop Chromium
exposes `navigator.vibrate` even with no hardware behind it — the API is
present, so the preference could in principle take effect. On iOS Safari and
desktop Safari/Firefox the API is absent and the row is **not rendered at all**,
rather than being shown disabled: offering a preference that could never take
effect is its own kind of dishonesty.

See `docs/haptics-support-matrix.md` for the full platform table and for why
`[12, 36, 18]` is compliant with the 30ms pulse ceiling.
