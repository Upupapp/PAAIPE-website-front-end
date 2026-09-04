# Release blockers — Tab 15

> **Generated file.** Produced from `src/config/qa.ts` by `npm run qa:write`.
> `npm run qa:check` fails if it drifts. Edit the config, not this document.

Tab 15 blocks completion on a defined list of defect classes. **None of them
fired.** What follows is therefore not a defect list — it is the set of things
that stand between this build and a release, and almost all of them need a
decision or an input rather than a code change.

## Blocking: needs a person, not a script

### 1. The manual accessibility sign-off has not been done

Tab 15 asks for keyboard-only, desktop screen reader, mobile screen reader,
200% zoom, 320px reflow, reduced motion, contrast, target size,
focus-obscured, captions/transcript and error-announcement checks, each with a
**recorded tester, date, browser/device, result and evidence**.

Automated coverage exists for several of these and it is not the same thing.
axe-core is a floor: it finds a known set of violations and cannot tell you
whether a page makes sense when read aloud. `docs/accessibility-report.md`
records **tester: none, date: none** for every manual row, with what each one
needs. This is F-24 and it is the single largest gap in the tab.

### 2. Owner inputs (14 items)

- **B-2** — Title separator: Tab 14 uses `-`, Tabs 05–10 use `|`. Hyphen adopted, because Tab 14 is the stated route-metadata baseline. Confirm
- **B-3** — Titles derived for `/benefits`, both `[slug]` templates and `/404`. Absent from the Tab 14 baseline table
- **B-4** — No external destination is configured (all seven `PUBLIC_*` values). All six handoffs resolve through one resolver and render honest unavailable states meanwhile. The site is correct, but every action does nothing. Unblocks Tabs 09–10 sign-off
- **B-5** — No approved typeface with a self-hosting licence. A system stack is in place meanwhile (F-13)
- **B-6** — No approved imagery in `public/media/`. The node-field / orbit / grid motif is built, but the **Philippine map contour is deliberately not drawn** — approximating a national outline is a credibility risk for a Philippine association. `NetworkField` exposes a `map` slot for an approved asset
- **B-8** — Hosting owner, release method, rollback and incident contacts unnamed. Netlify is now the named platform (owner rule, 2026-09-04) and `netlify.toml` commits the cost controls and the header plan - but the file is INERT until a site is linked, and naming a platform is not naming an owner. Still unnamed: who owns the hosting account, whether a release is atomic, how a bad release is rolled back, what monitors the site, and who is called when it breaks. See `docs/deployment-cost.md`
- **B-9** — Legal text for `/privacy` and `/terms` not approved. Both pages stay DRAFT FOR REVIEW; the schema refuses a draft policy with no banner
- **B-10** — Status colours are derived, not brand. The master command supplies no status palette and form validation cannot be built without one. `#B3261E` / `#0F6E4F` / `#8A5A00`, each clearing 4.5:1 as text on white and as a surface under white text. Approve or replace
- **B-11** — Electric blue cannot carry a white label. White on `--paaipe-blue #0878F9` measures 4.14:1, below AA, so primary actions use navy. Shifting blue 8% toward navy — `#0872EE` — reaches 4.51:1 and would make an electric-blue action legal
- **B-12** — Tab 05 names a programme Tab 06 does not. "Community Conversations" appears in the home preview but not in Tab 06's six programmes. Added with Tab 05's approved copy, giving seven. Confirm it belongs in the full list
- **B-13** — Bare hyphens where an em dash may be intended. "the AI future-not simply watch it happen", "Discover PAAIPE-a professional community", "community-helping people", "working with-or preparing for-artificial intelligence". Reproduced exactly as supplied rather than silently corrected — the slogan proves the source preserves typographic characters where it means them
- **B-14** — Two different value lists. Tab 03: five single words. Tab 06: five named values with descriptions. Only "Practical" overlaps. Both kept; About uses Tab 06's
- **B-15** — Two different audience lists. Tab 03: five categories. Tab 06: seven entries. Both kept; About uses Tab 06's, the home audience strip uses Tab 03's
- **B-16** — Two different resource-format vocabularies. Tab 03's schema enum is `guide / insight / replay / template / checklist`; Tab 08 lists Explainer, Guide, Checklist, Video, Event recap, Template, External reference. The enum stays authoritative for the type

## Not blocking, but unverified

- **F-7** — Performance budgets, Lighthouse runs, real-user monitoring plan. Tabs 14–15. Nothing has been measured yet, so no budget is claimed to pass or to fail — every number reported in this repository so far is correctness, not speed
- **F-8** — TypeScript pinned to 6.0.3, not 7.0.2. `@astrojs/check@0.9.10` peer range is `^5 || ^6`; TS 7 fails resolution. Revisit when it supports TS 7
- **F-24** — Manual WCAG 2.2 AA checklist with a named reviewer and date. Tab 13 requires it and it has NOT been done. Automated scans found no serious or critical defect on any route in two engines, but axe cannot tell whether a heading describes its section, whether alt text is useful, or whether an announcement is comprehensible. Needs a person with VoiceOver and NVDA, one mobile screen-reader path, and real iOS and Android handsets. The single largest gap between what is verified and what Tab 13 asks for — see `accessibility-report.md` §6
- **F-9** — Keyboard tab-order test on mobile WebKit. Deliberately skipped: emulated mobile WebKit has no keyboard focus ring, so it measures the harness. Tab 13 covers real-device paths
- **F-13** — Approved typeface wiring (self-hosted WOFF2, `font-display`). Blocked on B-5. A system stack is interim: local, zero network requests, one declaration to swap
- **F-14** — No content is `approved`. Every event and resource fixture is `sample`, so a production build publishes zero detail pages and no `Event` structured data. Unblocks when PAAIPE approves real articles and sessions
- **F-22** — Real-device verification on Android and on the previous iOS major. Tab 12. Both browser projects here (Chromium desktop, WebKit mobile) exercise the UNSUPPORTED path; the supported path is covered by pure-function guard tests, which is the only way to assert it without an Android handset. A real-device pass belongs with Tab 15
- **F-23** — Toast component and live-region priority rules. Tab 12 describes toasts, but nothing on this site produces one: there is no endpoint, so no confirmation, save or error message can occur. Building a toast with no caller would be a control that pretends. Revisit when B-4 lands
- **F-18** — The announcement bar is dismissible — the one use of browser storage. Tab 04 permits it explicitly. Bounded to `src/lib/dismissal.ts`, key from a closed union, value always `1`, enforced by four scope tests. Say if you would rather it were not dismissible
- **F-20** — URL-addressable filter state on `/events` and `/resources`. Allowed "if appropriate". Deferred: with nothing published, neither filter is rendered at all
- **F-26** — Real-user Core Web Vitals monitoring. Tab 14 asks for a field-data plan, and the plan is written (`performance-report.md` §3). It is not implemented: collecting field data is analytics, so it needs owner approval and a consent decision, and `verify:budgets` currently FAILS on any analytics endpoint. The lab numbers in the report are labelled as lab numbers and must not be read as field data
- **F-30** — Manual pass on Desktop Edge. Tab 15’s matrix names Edge. The chromium-desktop project covers the ENGINE; Edge layers its own features on top. Recorded in `browser-device-matrix.md` as owed rather than counted as covered
- **F-36** — A Content-Security-Policy. Confirmed absent on the live deploy. BaseLayout has one inline `<head>` script that applies motion preferences before first paint, and a static host cannot issue a per-response nonce - so a policy needs that script’s SHA-256 hash, computed at build time and written into the header. `unsafe-inline` would defeat the directive. Report-only first, then enforce

## What is NOT a blocker, and why

**The failing `cache-insight` Lighthouse audit.** It is an artefact of
`scripts/preview-server.mjs`, which sets no cache headers because it exists to
serve tests. Recommended production caching is in
`docs/security-privacy-handoff.md` and must be verified after deploy.

**The logo checksum divergence from the master command.** Superseded by owner
ruling on 2026-09-03: the uploaded files are authoritative. The audit still
prints the divergence on every run so it stays visible.

**Zero published events and resources.** Nothing in the registry is
`approved`, so a production build renders no detail pages and no `Event` or
`Article` structured data. That is the correct behaviour of a content gate, not
a fault — the pages exist, the templates are tested, and the first approved
record will publish without a code change.
