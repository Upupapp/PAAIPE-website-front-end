# Release checklist — Tab 10 Step 10

## Verdict

> ## READY FOR PAAIPE REVIEW
>
> ## NOT READY FOR PRODUCTION

Both halves are true at once, and the command asks for exactly that
distinction. The frontend is complete, tested and honest about what it cannot
do. It must not go live as a registration system, because it is not one yet —
and every reason for that is a decision or a fact PAAIPE holds, not a defect in
this repository.

---

## Evidence

Measured at the commit this document ships in, from a clean `npm ci` detached
worktree.

| Gate                                      | Result                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run check` (21 ordered steps)        | **PASS**                                                                                                     |
| Unit and component tests                  | **939 passed**, 42 files                                                                                     |
| Production browser suite                  | **981 passed**, 35 skipped                                                                                   |
| Review browser suite                      | **570 passed**, 38 skipped                                                                                   |
| Production build                          | 20 artifacts                                                                                                 |
| Content-integrity scan                    | **no findings** across 7 categories                                                                          |
| Dependency audit (`npm audit --omit=dev`) | **0 vulnerabilities**                                                                                        |
| Toolchain                                 | Node 24.19.0 · npm 11.17.0 · Astro 7.2.10 · TypeScript 6.0.3 · Vitest 4.1.11 · Playwright 1.62.1 · Zod 4.5.4 |

Nothing was relaxed to reach this. No rule was disabled, no test removed, no
snapshot blindly updated, no event file excluded.

---

## Why NOT READY FOR PRODUCTION

Each row is a Step 10 blocker. **None is a code defect.**

| #   | Blocker                                                              | Owner                   | What unblocks it                                                                                        |
| --- | -------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | **Registration endpoint not approved or connected**                  | PAAIPE + backend        | an approved endpoint in `PUBLIC_EVENT_REGISTRATION_ENDPOINT`, and Tab 05 to build the form              |
| 2   | **Privacy Notice, lawful basis, retention, processors not approved** | PAAIPE DPO / legal      | the ten decisions in [privacy-and-legal-approval-checklist.md](privacy-and-legal-approval-checklist.md) |
| 3   | **Terms of use not adopted**                                         | a person with authority | an act of adoption; the text is written                                                                 |
| 4   | **No real event instance content approved**                          | PAAIPE content owner    | one record moved to `contentStatus: 'approved'`                                                         |
| 5   | **Accessibility: no manual screen-reader pass**                      | a reviewer              | VoiceOver + NVDA journeys — tracked as **F-24**                                                         |
| 6   | ~~No approved production origin~~ — **not a blocker; corrected**     | —                       | already supplied: the origin is approved, configured and live (see below)                               |
| 7   | **Support contact not configured**                                   | PAAIPE                  | a monitored channel for accessibility requests                                                          |

**Row 6 was wrong when this document was first written**, and is struck rather
than silently deleted. `PUBLIC_SITE_URL` **is** set on the host: measured on the
live deploy 2026-09-07, `/events` carries a canonical and an `og:url`, and
`sitemap.xml` serves 12 URLs — exactly the indexable routes, with the noindex
ones correctly absent. The origin was approved by the owner on 2026-09-04. B-7
stays a tracked release input because its detector is a live check, which is the
right design, but nothing is blocked on it. **Six real blockers, not seven.**

**No blocker on this list is "a failed test", "private data in an artifact", or
"a missing unavailable state".** Those three Step 10 conditions are clear, and
that is the substantive result of this tab.

---

## The Step 2 functional matrix, honestly

The command names **26 scenarios**. **16 are verified. 10 cannot be tested**, and
the reason is the same for all ten.

### Verified (16)

`/events` direct load, refresh and no-JavaScript usefulness · upcoming default
sort and past archive sort · search by title, topic, speaker and keyword ·
timing, type and access filters · URL state, Clear filters, Back/Forward and the
mobile filter sheet · event detail direct load · unknown, draft, sample and
unpublished slug behaviour · share/copy-link · not open · full without waitlist ·
closed · schedule changed · cancelled · completed · no catalog · endpoint absent.

One qualification on share: **add-to-calendar is deliberately absent**, not
untested. It may only be offered for an approved record and none is approved, so
the control could not render in any content mode; building it would have left a
branch no test could reach. The reason is recorded beside the code.

### Not testable (10), and why

Public-open registration · members-only registration request · waitlist join ·
offline/network error · timeout/abort · malformed or unknown response · rate
limit · duplicate logical click · open-to-waitlist/full/closed/cancelled race
during submission · dialog/drawer and canonical route equivalence.

**Every one of them requires a form that submits, and there is none.** Tab 05
builds it and is blocked on the DPO; Tab 07 defines the outcome mapping and is
blocked on the backend. Simulating a gateway to tick these rows would mean
building a mock that reports success — the one thing Step 5 forbids outright,
and the failure this repository has guarded against since Tab 01.

They are recorded as **not testable**. Not as passed, and not quietly omitted.

---

## What was found and fixed while doing this work

Tabs 04, 06, 08 and 09 each found defects that every prior gate had passed.

Three were **in shipped code**. A precision that matters, and that an earlier
draft of this document got wrong: they were **not visible to a visitor of the
production site**, because production renders no event cards at all — no record
has ever been `approved`, so the marketplace has always shown its empty state.
Each would have appeared the moment PAAIPE approved its first event, which is
the single change most likely to happen next.

That makes them latent rather than live, and the distinction is worth keeping:
"live on the site" is a claim about what people saw, and nobody saw these.

- every event card rendered **transparent** — an undefined CSS token makes the
  browser discard the declaration in silence
- the marketplace **scrolled sideways** at 768px and 1024px — a visually-hidden
  link was sizing a grid column to 284px of 342px
- the two access badges rendered **identically**, so the distinction the badge
  exists to make was not being made

And three were in the gates themselves:

- the review suite asserted **1 of the 9** detail pages the build produced, and
  its own "list is non-empty" guard could not fire because one is greater than
  zero
- the **reduced-motion tests were not in reduced motion**, and two of three
  passed
- the metadata matrix printed a **blank** indexability cell for the registration
  route

Full detail in `docs/PENDING.md`, entries **F-55** through **F-64**.

---

## What has NOT happened, and must not before approval

- No deployment. Four tabs sit committed and unpushed.
- No production endpoint connected.
- No Zoom connected.
- No announcement scheduled, no participant emailed.
- No personal data collected — there is nowhere to enter any.

---

## Exact next steps, by owner

**PAAIPE content owner** — approve one event record's words, and the marketplace
stops showing an empty state.

**PAAIPE DPO / legal** — the ten decisions in the privacy checklist. Items 1–5
block Tab 05 entirely; the notice text is written and waiting.

**PAAIPE owner** — supply `PUBLIC_SITE_URL` (B-7), which alone restores
canonicals, `og:url`, the sitemap and Event JSON-LD with no code change; and
decide whether the withheld "register using your email" clause returns with
Tab 05.

**Backend lane** — answer bus `#0322` and `#0340`: the `privacyNoticeVersion`
format and the outcome vocabulary. Tab 07 cannot start without them, and they
have been open since Tab 03.

**A reviewer with a screen reader** — the manual WCAG pass, F-24. It is the one
acceptance check no automation here can close.
