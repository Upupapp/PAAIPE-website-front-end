import { describe, expect, it } from 'vitest';
import { stripComments } from '../lib/strip-comments';

describe('stripComments', () => {
  it('removes a line comment', () => {
    expect(stripComments('const a = 1; // meeting id here\nconst b = 2;')).not.toContain(
      'meeting id',
    );
  });

  it('removes a block comment, including a multi-line one', () => {
    const source = '/*\n * no passcode exists here\n */\nconst a = 1;';
    const out = stripComments(source);
    expect(out).not.toContain('passcode');
    expect(out).toContain('const a = 1;');
  });

  // The regression this file exists for: a naive `//` strip would delete the
  // rest of any line containing a URL, hiding a genuinely leaked link.
  it('keeps a URL inside a double-quoted string', () => {
    const source = 'const url = "https://zoom.us/j/123";';
    expect(stripComments(source)).toContain('https://zoom.us/j/123');
  });

  it('keeps a URL inside a single-quoted string and a template literal', () => {
    expect(stripComments("const u = 'https://zoom.us/j/1';")).toContain('zoom.us');
    expect(stripComments('const u = `https://zoom.us/j/1`;')).toContain('zoom.us');
  });

  it('does not treat a comment marker inside a string as a comment', () => {
    const source = 'const s = "keep // this"; // drop this';
    const out = stripComments(source);
    expect(out).toContain('keep // this');
    expect(out).not.toContain('drop this');
  });

  it('handles an escaped quote without ending the string early', () => {
    const source = 'const s = "a \\" // still in string"; // gone';
    const out = stripComments(source);
    expect(out).toContain('still in string');
    expect(out).not.toContain('gone');
  });

  it('separates the tokens either side of a removed comment', () => {
    // Replacing a comment with nothing could join `a` and `b` into `ab`.
    expect(stripComments('a/* x */b')).toBe('a b');
  });

  it('leaves comment-free source unchanged', () => {
    const source = 'export const a = 1;\nexport const b = "two";\n';
    expect(stripComments(source)).toBe(source);
  });
});
