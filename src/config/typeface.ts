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
 * Null until PAAIPE supplies a typeface with a self-hosting licence. A system
 * stack is in place meanwhile: local, zero network requests, and one constant
 * to fill. See `docs/typeface-shortlist.md` for the measured shortlist.
 */
export interface ApprovedTypeface {
  /** The family name, exactly as licensed. */
  family: string;
  /** Where the self-hosting licence is recorded. */
  licence: string;
  /** Self-hosted WOFF2 files, relative to `public/`. */
  files: readonly string[];
}

export const APPROVED_TYPEFACE: ApprovedTypeface | null = null;
