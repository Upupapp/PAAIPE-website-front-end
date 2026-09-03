# Release gate

> **Generated file.** Produced by `npm run release:gate` against a detached
> worktree. Re-run it rather than editing it.

| | |
| --- | --- |
| **Outcome** | **BLOCKED** |
| Commit | `96fa22b62299a317fc12f688a07823f9386024e2` |
| Subject | Release gate: exempt its own report from the dirty-tree check |
| Run | 2026-09-03 (fast run — browser suite and Lighthouse NOT RUN) |
| Worktree | detached at `96fa22b`, clean tree required |

**This build is not releasable, and the reason is not a defect.** Every gate
that could fail on quality passed. What blocks the release is 5 owner
inputs that no amount of front-end work can supply.

## CERTIFIED

What was actually run, on this commit, in a clean checkout with a frozen install.

| Stage | Result | Time |
| --- | --- | --- |
| Frozen dependency install | exit 0 | 2.8s |
| Full gate suite (npm run check) | all 17 gates passed | 22.9s |
| Unit tests | 492/492 unit tests passed | 0.9s |
| Browser suite | NOT RUN — --fast | 0.0s |
| Lighthouse | NOT RUN — --fast | 0.0s |
| Dependency scan | no high or critical finding | 0.5s |

| Review package | Result |
| --- | --- |
| Required documents committed | 22/22 present in `git ls-files` |
| presentation screenshots | 18 committed (floor 18) |
| visual regression baselines | 20 committed (floor 20) |
| motion and reduced-motion recordings | 3 committed (floor 2) |
| content registries | 16 committed (floor 10) |

## BLOCKED

5 owner inputs are outstanding. Each is listed on its own row: a single
"not ready" would not tell anyone which input to go and get.

| Blocker | What is missing | Supplied by | What the build does meanwhile |
| --- | --- | --- | --- |
| **B-4** | All seven PUBLIC_* destinations: PUBLIC_SITE_URL, PUBLIC_MEMBERSHIP_APPLICATION_URL, PUBLIC_MEMBER_PORTAL_URL, PUBLIC_APPLICATION_STATUS_URL, PUBLIC_SPEAKER_INTEREST_URL, PUBLIC_PARTNERSHIP_INTEREST_URL, PUBLIC_CONTACT_EMAIL | PAAIPE | Every call to action renders a DISABLED control with a visible reason. Never a `#`, never a dead link, never a fabricated success. |
| **B-5** | An approved typeface with a self-hosting licence | PAAIPE | A system font stack: local, zero network requests, 0 KiB of font transfer against a 150 KiB budget. |
| **B-6** | Approved imagery in `public/media/`, and the Philippine map contour | PAAIPE | Every image is a typed `placeholder`, so a fixture cannot reference a file that does not exist and every consumer must handle the absent case. |
| **B-8** | Hosting owner, atomic release method, rollback, monitoring and incident contacts | PAAIPE / the hosting owner | No platform configuration is committed, and every recommended production header in `docs/security-privacy-handoff.md` is UNVERIFIED - not passing, not failing, unmeasured. |
| **B-9** | Approved legal text for `/privacy` and `/terms` | PAAIPE / legal review | Both pages render a visible DRAFT FOR REVIEW banner before the heading, are `noindex`, and are excluded from the sitemap by a flag in the route registry. |

### How each one clears

- **B-4** — Set them in `.env`. The parser refuses an http:// URL and treats it as absent. The gate re-reads the world on every run, so the row turns green with no change to the gate itself.
- **B-5** — Fill `APPROVED_TYPEFACE` in `src/config/release.ts` and add the WOFF2 files. The gate re-reads the world on every run, so the row turns green with no change to the gate itself.
- **B-6** — Add the approved files to `public/media/` with confirmed usage rights. The gate re-reads the world on every run, so the row turns green with no change to the gate itself.
- **B-8** — Fill `OPERATIONS` in `src/config/release.ts` once they are named. The gate re-reads the world on every run, so the row turns green with no change to the gate itself.
- **B-9** — Set each policy `status` to `approved` in `src/content/policies.ts` once the text is signed off. The schema then refuses a `reviewBanner`. The gate re-reads the world on every run, so the row turns green with no change to the gate itself.

### Already supplied

- **B-7** — Production origin unknown, so `PUBLIC_SITE_URL` has no real value


## NOT VERIFIED — three different states, kept apart

A gate that blurs these is worse than one that omits them.

| Item | State | Why it is not a pass |
| --- | --- | --- |
| Recommended production security headers | **UNVERIFIED** | No host exists (B-8). Nothing was measured. The recommendations in `docs/security-privacy-handoff.md` have never been seen in a real response, and must not be inferred from the config we would have written. |
| Manual WCAG 2.2 AA sign-off | **NOT DONE** | `docs/accessibility-report.md` records tester: none, date: none on all eleven rows. Automated axe passes are a floor, not a screen-reader pass, and the gate does not let one stand in for the other. |
| Real-device browser pass | **NOT DONE** | Playwright drives the same engines the browsers ship. That is not Chrome, Edge or Safari, and it is much further from a handset. See `docs/browser-device-matrix.md`. |
| Event and resource detail pages rendered | **ZERO, BY DESIGN** | No content is `approved`, so the content gate excludes every fixture from a production build. This is the gate working, not a regression. The first approved record publishes with no code change. |

## What this gate does NOT do

It does not deploy, does not configure a host, does not publish legal text, and
does not need push authorisation to run. Tab 16 ends by waiting for a separate
written release command from PAAIPE.
