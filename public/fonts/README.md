# Self-hosted typeface

## `public-sans-variable.woff2`

The site's typeface, owner item B-5, adopted under the owner's standing
delegation. Loaded by `src/lib/typeface.ts` from `APPROVED_TYPEFACE` in
`src/config/typeface.ts`.

- **Family:** Public Sans, variable weight axis 400–700.
- **Licence:** SIL Open Font License 1.1. The licence grants permission "to use,
  study, copy, merge, embed, modify, redistribute, and sell modified and
  unmodified copies of the Font Software", so self-hosting is squarely permitted.
  Read from the project's own licence file, not a directory listing:
  https://raw.githubusercontent.com/google/fonts/main/ofl/publicsans/OFL.txt
- **Copyright:** 2015 The Public Sans Project Authors
  (https://github.com/uswds/public-sans)
- **Source of this file:** the `latin` subset variable build served by Google
  Fonts, retrieved 2026-09-04 from
  https://fonts.gstatic.com/s/publicsans/v21/ijwRs572Xtc6ZYQws9YVwnNGfJ7QwOk1.woff2
- **Size:** 26,636 bytes, against a 150 KiB per-route font budget.

### Why the `latin` subset is the whole font, not half of it

Checked character by character rather than assumed: the `latin` unicode-range
covers everything Filipino needs — **ñ Ñ á é í ó ú ü** — plus the typographic
en dash and right single quote. No `latin-ext` file is required, so 26.6 KiB is
the complete cost.

### Replacing it

One file and one constant. `src/config/typeface.ts` names the family and the
path; `src/lib/typeface.ts` refuses a relative path, a non-WOFF2 file, an empty
file list or a family name that cannot be quoted. Figtree is the alternative on
record in `docs/typeface-shortlist.md`.
