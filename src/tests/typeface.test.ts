/**
 * The B-5 font machinery, and specifically the branch that does not run today.
 *
 * `APPROVED_TYPEFACE` is null, so `typefaceAssets()` returns null on every real
 * build. A test suite that only ever exercised that would prove the site ships
 * no font — true, and useless on the one day it matters. The configured branch
 * is therefore driven by a FIXTURE, so the code that runs when PAAIPE supplies
 * a typeface has been run before the day PAAIPE supplies one.
 */
import { describe, expect, it } from 'vitest';
import { APPROVED_TYPEFACE } from '../config/release';
import { typefaceAssets } from '../lib/typeface';

const FIXTURE = {
  family: 'Public Sans',
  licence: 'SIL OFL 1.1, recorded in docs/typeface-shortlist.md',
  files: ['/fonts/public-sans-variable.woff2'],
} as const;

describe('the shipped state', () => {
  it('emits no font at all while B-5 is unsupplied', () => {
    // The link between the constant and the page, asserted rather than assumed:
    // this is what BaseLayout calls, with the value it actually passes.
    expect(APPROVED_TYPEFACE).toBeNull();
    expect(typefaceAssets(APPROVED_TYPEFACE)).toBeNull();
  });
});

describe('the branch that runs when a typeface is supplied', () => {
  const assets = typefaceAssets(FIXTURE);

  it('declares the family with the full weight range the tokens use', () => {
    expect(assets).not.toBeNull();
    expect(assets!.css).toContain('@font-face');
    expect(assets!.css).toContain('font-family:"Public Sans"');
    // tokens.css uses 400/500/600/700. A face declared at a single weight makes
    // the browser synthesise the other three, which looks like a broken font.
    expect(assets!.css).toContain('font-weight:400 700');
  });

  it('uses font-display: swap, so text is readable while the font loads', () => {
    expect(assets!.css).toContain('font-display:swap');
  });

  it('PREPENDS the family, keeping the system fallback behind it', () => {
    /*
     * The failure this prevents: replacing the stack outright means a 404 on
     * the woff2 drops the page to the browser default rather than to the
     * carefully chosen system stack it has today.
     */
    expect(assets!.css).toContain('--font-sans:"Public Sans",var(--font-sans-fallback)');
  });

  it('preloads exactly the files it declares', () => {
    expect(assets!.preloads).toEqual(FIXTURE.files);
  });
});

describe('it refuses a configuration that would fail quietly', () => {
  it('rejects a typeface with no files', () => {
    expect(() => typefaceAssets({ ...FIXTURE, files: [] })).toThrow(/names no files/i);
  });

  it('rejects a relative path', () => {
    // A relative URL resolves against the current route, so it would 404 on
    // every nested page and load on the home page - the worst kind of bug.
    expect(() => typefaceAssets({ ...FIXTURE, files: ['fonts/x.woff2'] })).toThrow(
      /absolute path/i,
    );
  });

  it('rejects a format that is not woff2', () => {
    expect(() => typefaceAssets({ ...FIXTURE, files: ['/fonts/x.ttf'] })).toThrow(/\.woff2/i);
  });

  it('rejects a family name that cannot be quoted safely', () => {
    expect(() => typefaceAssets({ ...FIXTURE, family: 'Bad"Name' })).toThrow(/quoted safely/i);
  });
});
