/**
 * Tab 10 Step 5 - proof that the content-integrity scanner can actually SEE
 * each thing it claims to look for.
 *
 * WHY THIS EXISTS. Run against a production build the scanner reports "no
 * findings" in every category, which is the correct answer and is also exactly
 * what a scanner with a broken matcher reports. Two categories are proved by
 * real data - the review build genuinely contains fixtures, and the same
 * scanner finds 19 artifacts of them - but the other five have nothing real to
 * find, so each matcher is driven here against text that MUST trip it.
 *
 * A scanner nobody has watched fail is a scanner with no evidence behind it.
 */
import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../../scripts/write-integrity-scan.mjs';

type Category = {
  id: string;
  title: string;
  detail: string;
  scan: (files: Array<[string, string]>) => string[];
};

const byId = (id: string): Category => {
  const found = (CATEGORIES as Category[]).find((category) => category.id === id);
  if (!found) throw new Error(`no scan category "${id}"; this test measures nothing`);
  return found;
};

describe('every scan category has a matcher that fires', () => {
  it('covers all seven Step 5 categories', () => {
    expect((CATEGORIES as Category[]).map((category) => category.id)).toEqual([
      'fixture-records',
      'illustrative-label',
      'participant-email',
      'unapproved-claim',
      'dead-control',
      'draft-legal-as-final',
      'production-mock-success',
    ]);
  });

  it('finds a fixture slug', () => {
    expect(
      byId('fixture-records').scan([['dist/a.html', 'href="/events/sample-waitlist"']]),
    ).toHaveLength(1);
    expect(byId('fixture-records').scan([['dist/a.html', 'href="/events/real-event"']])).toEqual(
      [],
    );
  });

  it('finds the review watermark', () => {
    expect(
      byId('illustrative-label').scan([
        ['dist/a.html', 'Illustrative preview - not an announced event.'],
      ]),
    ).toHaveLength(1);
  });

  it('finds a participant email but permits the placeholder', () => {
    const category = byId('participant-email');
    expect(category.scan([['dist/a.html', 'contact maria@paaipe.org']])).toHaveLength(1);
    expect(category.scan([['dist/a.html', 'Placeholder: you@example.com']])).toEqual([]);
    // A vocabulary URL is not an address.
    expect(category.scan([['dist/a.html', '"@context":"https://schema.org"']])).toEqual([]);
  });

  it('finds a capacity, attendance or urgency claim', () => {
    const category = byId('unapproved-claim');
    expect(category.scan([['dist/a.html', 'Only 3 seats left']])).not.toEqual([]);
    expect(category.scan([['dist/a.html', '250+ participants joined']])).not.toEqual([]);
    expect(category.scan([['dist/a.html', 'Hurry, closing soon']])).not.toEqual([]);
    // The honest states must NOT trip it.
    expect(category.scan([['dist/a.html', 'This event is currently full.']])).toEqual([]);
    expect(category.scan([['dist/a.html', 'Registration has closed.']])).toEqual([]);
  });

  it('finds a dead link', () => {
    expect(byId('dead-control').scan([['dist/a.html', '<a href="#">Nowhere</a>']])).toHaveLength(1);
    expect(byId('dead-control').scan([['dist/a.html', '<a href="#main">Skip</a>']])).toEqual([]);
  });

  it('finds a legal page with no draft marking', () => {
    const category = byId('draft-legal-as-final');
    expect(category.scan([['dist/privacy.html', 'Our privacy notice.']])).toHaveLength(1);
    expect(category.scan([['dist/privacy.html', 'DRAFT - awaiting review']])).toEqual([]);
    // A non-legal page is not its business.
    expect(category.scan([['dist/about.html', 'no marking here']])).toEqual([]);
  });

  it('finds a success announcement', () => {
    const category = byId('production-mock-success');
    expect(category.scan([['dist/a.html', "You're registered!"]])).not.toEqual([]);
    expect(category.scan([['dist/a.html', 'Registration received']])).not.toEqual([]);
    // The honest unavailable sentence must NOT trip it.
    expect(
      category.scan([
        [
          'dist/a.html',
          'Online registration is being connected. No registration has been recorded.',
        ],
      ]),
    ).toEqual([]);
  });
});
