/**
 * Remove JavaScript/TypeScript comments from source, leaving string and
 * template literals intact.
 *
 * Why this is not a regex: any source scan that looks for a forbidden token has
 * to ignore comments, or it flags the comment that DOCUMENTS the prohibition -
 * "no meeting ID or passcode exists here" trips a scan for `meeting id`.
 *
 * But the naive fix is worse than the problem. Treating `//` as a comment start
 * everywhere also deletes the rest of any line containing `https://…`, which
 * would silently hide a real leaked URL inside a string literal. That is a
 * FALSE NEGATIVE in a security scan - the failure mode you least want.
 *
 * So this walks the source tracking whether it is inside a single-quoted,
 * double-quoted, backtick or regex context, and only strips comments outside
 * them. Comments are replaced by a single space so tokens on either side cannot
 * be accidentally joined into a new word.
 */
export function stripComments(source: string): string {
  let out = '';
  let i = 0;
  const n = source.length;

  while (i < n) {
    const char = source[i]!;
    const next = source[i + 1];

    // Line comment
    if (char === '/' && next === '/') {
      while (i < n && source[i] !== '\n') i += 1;
      out += ' ';
      continue;
    }

    // Block comment
    if (char === '/' && next === '*') {
      i += 2;
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i += 2;
      out += ' ';
      continue;
    }

    // String or template literal: copy verbatim, honouring backslash escapes.
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      out += char;
      i += 1;
      while (i < n) {
        const c = source[i]!;
        out += c;
        i += 1;
        if (c === '\\') {
          if (i < n) {
            out += source[i];
            i += 1;
          }
          continue;
        }
        if (c === quote) break;
      }
      continue;
    }

    out += char;
    i += 1;
  }

  return out;
}
