# Privacy and legal approval checklist

Tab 10 Step 6 and Step 9. **Every row below is unresolved and needs a named
person at PAAIPE.** The frontend cannot supply any of them, and has not
invented any.

## What only PAAIPE can decide

| #   | Decision                                                                     | Why the frontend cannot supply it                                                                             | Blocks                                         |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Personal Information Controller identity** — registered name and address   | a legal identity, not a design choice                                                                         | the privacy notice                             |
| 2   | **DPO or privacy contact** — name and reachable channel                      | RA 10173 requires a named contact                                                                             | the notice, and NPC registration               |
| 3   | **Lawful basis** for processing a registration email                         | consent, contract, or legitimate interest — the choice has consequences for withdrawal and must be documented | Tab 05                                         |
| 4   | **Retention period and deletion criteria**                                   | "indefinite" is not a period; a determinable rule is required                                                 | the notice                                     |
| 5   | **Processor / recipient categories** — the meeting service, the mail service | a real list of who receives the data                                                                          | the notice                                     |
| 6   | **Terms of use adoption**                                                    | an act by a person with authority                                                                             | `/terms` leaving draft                         |
| 7   | **Raffle mechanics and eligibility**, if a raffle is ever run                | prize promotions have their own rules                                                                         | the raffle FAQ                                 |
| 8   | **Accessibility support contact**                                            | a channel someone actually monitors                                                                           | the support FAQ and `PUBLIC_EVENT_SUPPORT_URL` |
| 9   | **Recording / certificate policy**                                           | whether either exists at all                                                                                  | the recording FAQ                              |
| 10  | **International transfer disclosure**, if any processor is offshore          | depends on 5                                                                                                  | the notice                                     |

## What the frontend has already done

- `/privacy` and `/terms` exist, carry a **visible draft banner**, are
  `noindex`, and say what they await. One flag drives the banner, the robots
  directive and the sitemap, so they cannot disagree.
- A build scan fails if a legal page loses its draft marking while the copy is
  still draft.
- The full notice text is written and awaiting the five facts above — see
  `docs/adopting-the-legal-text.md`. Adoption is one edit per policy; a rehearsal
  found and fixed three defects that would have appeared on the day.
- **No personal data is collected anywhere today.** There is no form. The
  registration route states that in the exact required words.

## Data minimisation, as built

- Registration will collect **one email address** and nothing else. No name, no
  phone, no company, no job title, no social profile, no password, no free text.
- Necessary event communications are **separate** from optional marketing.
  Marketing is absent entirely — it may only appear when approved, and then
  unchecked, granular and non-blocking.
- The email will exist in component memory only, cleared after a confirmed
  completion.
- No service worker, no background sync, no session replay.

## The standing instruction this document obeys

The frontend must not invent a lawful basis, a retention period, a processor
list, a DPO contact, raffle terms or participation terms. Where a fact is
missing the page says so plainly rather than filling the gap — which is why
several sections are absent rather than approximated.
