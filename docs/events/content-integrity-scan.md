# Content-integrity scan — Tab 10 Step 5

> **Generated file.** Produced from the build by
> `scripts/write-integrity-scan.mjs`. Re-run it rather than editing it.
> `--check` fails when the committed copy and a fresh scan disagree.

Scanned **20 build artifacts** (520 KiB of
text) across HTML, JavaScript, JSON, web manifests and source maps.

**Result: no findings.**

| Category                                                    | Result |
| ----------------------------------------------------------- | ------ |
| Draft or sample event records in production output          | clear  |
| Review watermark copy in production output                  | clear  |
| Participant email values                                    | clear  |
| Unapproved statistic, capacity, attendance or urgency claim | clear  |
| Dead links and controls that pretend to work                | clear  |
| Draft legal copy exposed as final                           | clear  |
| An analytics vendor in the build                            | clear  |
| A forbidden telemetry key in the build                      | clear  |
| A production mock that reports registration success         | clear  |

## What this scan does NOT cover, and why

Two categories Step 5 names are owned by existing gates, and are deliberately
not re-implemented here:

- **The twelve forbidden private field names** — `scripts/verify-event-boundary.mjs`
  is their sole home. It reads the build for the same reason this does: a value
  can reach an artifact without any source file naming the field.
- **Zoom links, meeting ids, passcodes and credential-shaped assignments** —
  `src/tests/scope-boundary.test.ts` bans those strings from every source file
  and every artifact, which is strictly stronger than anything a second list
  could add.

Declaring either set again would place the forbidden strings in a third file,
which is itself what those guards exist to prevent. Tab 09 met that exact
collision and resolved it the same way.
