# Content and brand audit

> **Generated file.** Produced by `npm run audit:content -- --write`.
> Re-run it rather than editing it.

Tab 15 requires source **and** built output to be searched for eight classes of
problem. This is that search, run over 111 source files and
26 built files.

## Result

**PASS — no finding.**

| Checked for | Result |
| --- | --- |
| Alternate or malformed organisation name, acronym or slogan | clean |
| Wrong logo file or checksum | clean |
| Fake member totals, testimonials, founding dates, awards, certifications, registrations, impact claims | clean |
| Unapproved speakers, portraits, quotes, partners, company logos, offers, credit/token amounts, discounts | clean — and both registries are **empty by construction** |
| Private Zoom URLs, meeting IDs/passwords, protected downloads, member data, credentials, secrets, benefit codes, personal contact data | clean |
| Placeholder text, dead links, empty hrefs, fake success messages, production-visible review notes | clean |
| Legal pages missing their draft/review warning | clean |
| Sample or coming-soon content presented as published | clean |

## The slogan

The master command requires exactly:

> Building the Philippines’ AI-Powered Future—Together.

It appears verbatim on the home page, as the H1 and as `og:title`. It is defined
once in `src/config/site.ts` and imported everywhere — never retyped — so a
variant cannot be introduced by a typo in a template.

## Logo checksums — a divergence that is deliberate

**`PAAIPE_Logo_Square_Final.png`**

| Source | SHA-256 | |
| --- | --- | --- |
| The file on disk | `88f91f0e5b4a7bf70d202d49dadedae5a677a72c02f9d4eaf097962a247d1867` | measured this run |
| Pinned in `src/config/brand.ts` | `88f91f0e5b4a7bf70d202d49dadedae5a677a72c02f9d4eaf097962a247d1867` | **matches** |
| Printed in the master command | `fd142bbe87429931b8cbf10d4f834d24f538b713b79a2fa69fdc660f016adf77` | **diverges** |

**`PAAIPE_Logo_Horizontal_Final.png`**

| Source | SHA-256 | |
| --- | --- | --- |
| The file on disk | `f332dc8c5d005b4cf46b06643d005d90071b36072c17a816107f3730021a1378` | measured this run |
| Pinned in `src/config/brand.ts` | `f332dc8c5d005b4cf46b06643d005d90071b36072c17a816107f3730021a1378` | **matches** |
| Printed in the master command | `1e87fd4cbc683de75e240c8810c6f835928e768e849c0ddf2c92866808b55944` | **diverges** |

The master command's pair is **superseded**. Owner ruling, 2026-09-03: *"logos i
uploaded are the logos to be used"*. The uploaded files are authoritative.

This audit still re-computes and re-prints the master command's hashes on every
run, and always will. An owner ruling closes the question of *which file is
right*; it does not make a stale checksum start matching, and deleting the
superseded pair would make the difference invisible to the next person who
compares the document with the repository.

## Why the empty registries are the strongest result here

The speaker and partner registries contain **zero** records, and that is
enforced by type, not by discipline. `src/content/speakers.ts` and
`partners.ts` export empty arrays, and the schema will not accept a record
carrying `approvedSpeaker` unless its `contentStatus` is `approved`.

So there is no name, portrait, quote, company logo, offer, credit amount or
discount anywhere to audit — not because the scan found none, but because the
build would fail if one existed. That is a stronger guarantee than a clean scan,
and it is worth saying plainly: **a scan proves absence only as well as its
patterns are written; a schema proves it structurally.**

## What this audit cannot see

- **Whether approved copy is TRUE.** It checks that nothing unapproved was
  invented. It cannot check that an approved statement is accurate — only PAAIPE
  can.
- **An unapproved claim phrased in a way the patterns do not match.** The
  patterns cover numbers, dates, awards, testimonial shapes, discounts and
  endorsement language. A novel phrasing would pass. This is a floor.
- **Imagery.** `public/media/` is empty (owner item B-6). When approved
  photography arrives, whether a face in a photo has usage rights is not a
  question any script can answer.
