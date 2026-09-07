# Adopting the privacy notice and terms of use

> **One placeholder closed 2026-09-07.** The hosting-log retention period is filled
> and no longer awaits PAAIPE. Netlify's DPA is publicly downloadable and states
> "retained on-line for 90 days and offline for 1 year" (Exhibit II §5.A). The
> notice **attributes** it — _"Our host, Netlify, states in its Data Processing
> Agreement that…"_ — rather than asserting it flatly, because the clause sits
> under _Enterprise Services_ and is framed as security logging, so a bare
> assertion would claim more precision than the source carries about somebody
> else's system. **Five placeholders remain, and every one is a fact only PAAIPE
> holds.** Supplied by the research lane, bus #0329.

**Owner item B-9.** The text is written and live as a draft. What remains is five
facts only PAAIPE holds, and the act of adoption itself.

Adoption is now **one edit per policy**, and that was rehearsed rather than
assumed: setting both policies to `approved` was tried end to end, and the three
things that broke are fixed (see F-54).

## Step 1 — supply the five facts

Each appears on the page as a bracketed, upper-case placeholder, so nothing can
be mistaken for finished text.

| Placeholder                                                                             | Where it lives                           | Notes                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATA PROTECTION OFFICER — DESIGNATION, POSTAL ADDRESS, TELEPHONE AND ROLE-BASED EMAIL` | `PRIVACY_DRAFT`, _Your rights_           | Deferred by owner decision 2026-09-04. Publish the **title, never the name** — NPC Advisory 2017-01 expressly does not require the name. The address must be role-based (`dpo@`), never a personal alias, per NPC Circular 2022-04 §8. |
| `PAAIPE'S REGISTERED NAME AND POSTAL ADDRESS AS RECORDED WITH THE SEC`                  | `TERMS_DRAFT`, _Purpose of this website_ | Must be the organisation's, never a trustee's home.                                                                                                                                                                                    |
| `VENUE — THE CITY OF PAAIPE'S PRINCIPAL OFFICE`                                         | `TERMS_DRAFT`, _Governing law_           |                                                                                                                                                                                                                                        |
| `EFFECTIVE DATE, ON ADOPTION BY PAAIPE`                                                 | both documents                           | The date the board adopts the text.                                                                                                                                                                                                    |

## Step 2 — have it reviewed

This text was drafted against the statute and the NPC issuances, and every
citation is named in the register. **It has not been reviewed by a lawyer.** The
draft banner exists for that reason and should not come down before it happens.

Two things a reviewer should be pointed at specifically:

- **NPC Circular 2023-06** (Security of Personal Data) has never been read by any
  lane here — `privacy.gov.ph` serves an interstitial to automated fetches. The
  notice currently makes **no** security-measures claim, so nothing rests on it;
  that changes the moment a security section is added.
- **The §12(b) basis** stated for event registration is true only of a _deployed
  configuration_. The API reads an operator-supplied purpose-and-basis matrix, so
  a misconfiguration would make a published legal document false.

## Step 3 — adopt

For each policy in `src/content/policies.ts`:

```ts
{
  slug: 'privacy',
  title: 'Privacy Notice',
  status: 'approved',   // was 'draft-for-review'
  // reviewBanner deleted
}
```

That is the whole change. Everything follows from it:

- the draft banner stops rendering, and its `aria-describedby` reference stops
  with it;
- the page becomes indexable and enters the sitemap, because `noindexReason` is
  derived from the policy rather than written down separately;
- the release gate's B-9 row flips without anyone editing the gate.

## Step 4 — confirm

```sh
npm run check          # 647 unit tests pass in both states
npm run test:e2e       # the draft assertions skip; the adopted ones run
```

Both states are covered. If adoption breaks a test, that is a real finding and
not a test to edit — the suite was deliberately rewritten so that finishing this
work does not fail it.
