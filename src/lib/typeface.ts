import type { ApprovedTypeface } from '../config/typeface';

/**
 * The font-loading machinery for owner item B-5, built so that supplying the
 * input is a DECISION rather than a project.
 *
 * Until today `APPROVED_TYPEFACE` was a constant nothing read. "Supplying B-5"
 * therefore meant choosing a typeface AND writing the `@font-face` rules, the
 * preload, the token override and the tests — so the item could not be closed
 * by the person who is actually able to close it. This is that work, done in
 * advance and inert while the constant is null.
 *
 * IT SHIPS NOTHING UNTIL IT IS ASKED TO. With `APPROVED_TYPEFACE === null` this
 * returns null, no `@font-face` reaches the page, no font is fetched, and the
 * system stack in `tokens.css` stands. That is the current state, and it is
 * asserted rather than assumed.
 *
 * A CODE PATH GUARDED BY A CONSTANT IS UNTESTED BY DEFAULT — the branch that
 * matters only runs on the day someone flips it, which is the worst day to
 * discover it is wrong. So the configured branch is tested against a fixture,
 * not left to be exercised for the first time in production.
 */
export interface TypefaceAssets {
  /** `@font-face` plus the family override, ready to inline in <head>. */
  css: string;
  /** Absolute paths to preload, in the order they should be fetched. */
  preloads: readonly string[];
}

/**
 * Expects a VARIABLE woff2 covering the four weights `tokens.css` uses
 * (400/500/600/700). Static weights would need a weight per file, which the
 * `ApprovedTypeface` contract does not carry — if PAAIPE supplies statics, the
 * contract gains a weight field and this gains a branch. Recorded rather than
 * guessed at.
 */
export function typefaceAssets(approved: ApprovedTypeface | null): TypefaceAssets | null {
  if (approved === null) return null;

  const { family, files } = approved;
  if (files.length === 0) {
    throw new Error(
      'APPROVED_TYPEFACE names no files. A typeface with no woff2 would silently fall back to the system stack while the gate reported B-5 supplied.',
    );
  }
  for (const file of files) {
    if (!file.startsWith('/') || !file.endsWith('.woff2')) {
      throw new Error(
        `APPROVED_TYPEFACE file ${JSON.stringify(file)} must be an absolute path ending in .woff2 (relative to public/). Anything else 404s at runtime, which looks exactly like a font that simply did not load.`,
      );
    }
  }
  if (family.includes('"') || family.includes('\\')) {
    throw new Error(`APPROVED_TYPEFACE family ${JSON.stringify(family)} cannot be quoted safely.`);
  }

  const faces = files
    .map(
      (file) =>
        `@font-face{font-family:"${family}";src:url("${file}") format("woff2");` +
        // The full range tokens.css uses. `swap` because text a reader can read
        // in a fallback face beats text they cannot read at all.
        `font-weight:400 700;font-style:normal;font-display:swap;}`,
    )
    .join('');

  // Prepended to the existing stack rather than replacing it: if the file fails
  // to load, the page keeps the system fallback it has today.
  const override = `:root{--font-sans:"${family}",var(--font-sans-fallback);}`;

  return { css: `${faces}${override}`, preloads: files };
}
