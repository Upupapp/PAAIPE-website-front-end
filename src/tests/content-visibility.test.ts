import { describe, expect, it } from 'vitest';
import { parseContentMode, DRAFT_ALLOW_LIST } from '../config/content-mode';
import { isPublishable, publishable, reviewLabel } from '../lib/content-visibility';
import type { ContentStatus } from '../content/types';

const record = (slug: string, contentStatus: ContentStatus) => ({ slug, contentStatus });

describe('parseContentMode', () => {
  it('defaults to production for anything that is not exactly "review"', () => {
    for (const raw of [undefined, '', 'prod', 'production', 'REVIEW', 'reviewer', 'true', '1']) {
      expect(parseContentMode(raw), String(raw)).toBe('production');
    }
  });

  it('accepts "review", with surrounding whitespace tolerated', () => {
    expect(parseContentMode('review')).toBe('review');
    expect(parseContentMode('  review  ')).toBe('review');
  });
});

describe('isPublishable', () => {
  it('publishes approved content in every mode', () => {
    expect(isPublishable(record('a', 'approved'), 'production', [])).toBe(true);
    expect(isPublishable(record('a', 'approved'), 'review', [])).toBe(true);
  });

  it('strips sample and draft from a production build without exception', () => {
    expect(isPublishable(record('a', 'sample'), 'production', [])).toBe(false);
    expect(isPublishable(record('a', 'draft'), 'production', [])).toBe(false);
    // Even an allow-listed draft stays out of production.
    expect(isPublishable(record('a', 'draft'), 'production', ['a'])).toBe(false);
  });

  it('publishes sample in review mode', () => {
    expect(isPublishable(record('a', 'sample'), 'review', [])).toBe(true);
  });

  it('publishes a draft in review mode ONLY when it is explicitly allow-listed', () => {
    expect(isPublishable(record('a', 'draft'), 'review', [])).toBe(false);
    expect(isPublishable(record('a', 'draft'), 'review', ['b'])).toBe(false);
    expect(isPublishable(record('a', 'draft'), 'review', ['a'])).toBe(true);
  });

  it('ships with an empty draft allow-list', () => {
    expect(DRAFT_ALLOW_LIST).toEqual([]);
  });
});

describe('publishable', () => {
  const records = [
    record('approved-one', 'approved'),
    record('sample-one', 'sample'),
    record('draft-one', 'draft'),
  ];

  it('keeps only approved records in production', () => {
    expect(publishable(records, 'production', ['draft-one']).map((r) => r.slug)).toEqual([
      'approved-one',
    ]);
  });

  it('keeps approved plus sample plus allow-listed drafts in review', () => {
    expect(publishable(records, 'review', ['draft-one']).map((r) => r.slug)).toEqual([
      'approved-one',
      'sample-one',
      'draft-one',
    ]);
  });
});

describe('reviewLabel', () => {
  it('labels non-approved content visibly and says nothing for approved', () => {
    expect(reviewLabel('sample')).toBe('Concept preview');
    expect(reviewLabel('draft')).toBe('Internal draft - not for publication');
    expect(reviewLabel('approved')).toBeNull();
  });
});
