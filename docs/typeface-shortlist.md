# B-5: the typeface decision, reduced to one yes/no

**Status:** waiting on PAAIPE. Everything else is done.

B-5 has been blocked as "an approved typeface with a self-hosting licence". Part
of why it stayed blocked is that supplying it was not one decision — it was a
decision _plus_ an implementation, and the person who can make the decision is
not the person who writes `@font-face` rules. The implementation now exists and
is inert. What is left is the decision.

## What "yes" costs, now

1. Put one variable WOFF2 in `public/fonts/`.
2. Fill one constant in `src/config/release.ts`:

```ts
export const APPROVED_TYPEFACE: ApprovedTypeface | null = {
  family: 'Public Sans',
  licence: 'SIL OFL 1.1 — see docs/typeface-shortlist.md',
  files: ['/fonts/public-sans-variable.woff2'],
};
```

That is all. The `@font-face`, the `preload`, the token override and the
fallback behaviour are built, tested and verified on the rendered page. The
release gate flips B-5 green on its own, with no edit to the gate.

**No font binary has been committed.** Committing one for a face that may not be
chosen would be speculative, and PAAIPE may hold a licence for something else
entirely.

## The shortlist

Every candidate was **measured**, not quoted: the figures are the actual
`latin`-subset variable WOFF2 that Google serves today, fetched and weighed.

| Typeface        | Measured WOFF2 (latin, wght 400–700) | Licence     | Character of the face                                |
| --------------- | -----------------------------------: | ----------- | ---------------------------------------------------- |
| **Public Sans** |                         **26.0 KiB** | SIL OFL 1.1 | Neutral, civic, built for dense public-interest text |
| Figtree         |                             19.7 KiB | SIL OFL 1.1 | Geometric, contemporary, warmer                      |
| Inter           |                             47.2 KiB | SIL OFL 1.1 | The most-tested UI face; very widely used            |
| Manrope         |                             24.0 KiB | SIL OFL 1.1 | Geometric, semi-rounded, distinctive                 |
| Source Sans 3   |                             28.1 KiB | SIL OFL 1.1 | Humanist, quiet, long-established                    |
| IBM Plex Sans   |                             39.2 KiB | SIL OFL 1.1 | Corporate-technical, strong personality              |

### Two things that turn out not to decide it

- **Licence does not discriminate.** All six are SIL OFL 1.1, verified against
  each project's own licence file rather than a directory listing. The operative
  clause, verbatim: _"Permission is hereby granted, free of charge, to any person
  obtaining a copy of the Font Software, to use, study, copy, merge, embed,
  modify, redistribute, and sell modified and unmodified copies of the Font
  Software, subject to the following conditions"_. Self-hosting is squarely
  permitted. The conditions that matter in practice: the font itself may not be
  sold on its own, and it must stay under OFL.
- **Performance does not discriminate.** The budget is 150 KiB of font transfer
  per route. The heaviest candidate uses **31%** of it; the lightest **13%**.
  Any of these is affordable.

So this is a design and identity decision, which is PAAIPE's, not a technical
one dressed up as one.

### Filipino coverage — checked, not assumed

The `latin` subset was tested character by character for what Filipino actually
needs: **ñ Ñ á é í ó ú ü** and the typographic **– ’**. All covered by every
candidate. No `latin-ext` subset is required, which is why the figures above are
the whole cost rather than half of it.

## Recommendation: Public Sans

PAAIPE's site is a **public information portal**. Most of its words are policies,
resources, membership terms and event facts — text people read to find something
out, not to be impressed. Public Sans was commissioned for exactly that job (it
is the typeface of the US Web Design System), and it brings no personality that
competes with the logo.

**If PAAIPE wants the site to feel more distinctive than neutral, choose Figtree
instead** — it matches the geometric feel the hero already has, and it is the
lightest of the six. That is the real trade-off, and it is a matter of taste
rather than correctness.

Inter is the safe third choice; its only drawback is ubiquity.

## What this document does not decide

- Whether PAAIPE already holds a licence for a commissioned or purchased face.
  If so, name it and the machinery takes it, provided the licence permits
  self-hosting — that is the one licence question that must be answered before
  any file is added.
- Any display/heading face distinct from the body face. The tokens carry one
  family. A second is a design decision and a second file.
