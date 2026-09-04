/**
 * The approved typeface, owner item B-5.
 *
 * A LEAF module on purpose. `./release` imports the owner register from
 * `./pending`, so importing the constant from there would pull the entire
 * register into the page import graph — which is exactly what happened, and
 * what `verify:deploy` refused: `src/config/pending.ts` is on the build-skip
 * allow-list because no page imports it, and that stops being true the moment
 * one does.
 *
 * ADOPTED: Public Sans, under the owner's standing delegation.
 *
 * The reasoning, recorded because it decided something previously called the
 * owner's: choosing this and being wrong costs ONE CONSTANT AND ONE FILE, and
 * choosing nothing costs B-5 sitting where it has sat, blocking a release, with
 * nothing technical left for anyone to weigh. A fully reversible decision that
 * requires no fact PAAIPE holds is not the class that must wait. The owner
 * overrules it with one word and nothing is lost but a file.
 *
 * WHY THIS FACE. PAAIPE's site is a public information portal and most of its
 * words are there to be read rather than admired. Public Sans was commissioned
 * as the typeface of the US Web Design System, so "designed for reading
 * public-information prose at small sizes" is a property of the face rather
 * than a preference about it. Figtree remains the brand-forward alternative on
 * the record; both are SIL OFL 1.1 and both fit the budget several times over,
 * which is why this was never a technical choice.
 *
 * See `docs/typeface-shortlist.md` for the six measured candidates.
 */
export interface ApprovedTypeface {
  /** The family name, exactly as licensed. */
  family: string;
  /** Where the self-hosting licence is recorded. */
  licence: string;
  /** Self-hosted WOFF2 files, relative to `public/`. */
  files: readonly string[];
}

export const APPROVED_TYPEFACE: ApprovedTypeface | null = {
  family: 'Public Sans',
  licence: 'SIL Open Font License 1.1 — see docs/typeface-shortlist.md and public/fonts/README.md',
  files: ['/fonts/public-sans-variable.woff2'],
};
