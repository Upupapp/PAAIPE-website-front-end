/**
 * The Tab 02 event domain: every validation rule, proven by a record that
 * breaks exactly that rule.
 *
 * A schema test that only feeds it VALID records proves the schema accepts
 * things. What matters is what it refuses, and that it refuses for the stated
 * reason rather than by accident - so each case below asserts the message, not
 * merely that parsing failed.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT_MODE } from '../config/content-mode';
import type { PublicEventRecord } from '../content/event-record';
import { FORBIDDEN_FIELDS } from '../../scripts/verify-event-boundary.mjs';
import { EVENT_RECORDS } from '../content/event-records';
import { EVENT_SAMPLES } from '../content/event-samples';
import { AI_EXCHANGE_SERIES } from '../content/event-series';
import { publicEventRecordSchema } from '../content/schemas';
import {
  StaticEventCatalogRepository,
  byEndDescending,
  byStartAscending,
  isPublishableEvent,
} from '../lib/event-catalog';

/** A minimal record that passes, so each case below changes exactly one thing. */
const VALID: PublicEventRecord = {
  schemaVersion: 1,
  id: 'a-valid-event',
  slug: 'a-valid-event',
  title: 'A Valid Event',
  excerpt: 'Enough words to be a real excerpt.',
  description: ['A paragraph.'],
  contentStatus: 'sample',
  type: 'workshop',
  access: 'public',
  format: 'online',
  lifecycle: 'scheduled',
  startAt: '2026-10-14T14:00:00+08:00',
  endAt: '2026-10-14T15:00:00+08:00',
  timeZone: 'Asia/Manila',
  durationMinutes: 60,
  formatLabel: 'Online',
  publicAgenda: [{ label: 'Opening' }],
  learningOutcomes: [],
  audience: ['Someone'],
  speakerIds: [],
  topicTags: ['Practical adoption'],
  registration: {
    mode: 'email',
    state: 'open',
    requiresVerifiedMembership: false,
    waitlistEnabled: false,
    showCapacity: false,
    privacyNoticeVersion: 'draft-2026-09',
    eventVersion: 'a-valid-event@1',
  },
  media: { src: '/media/x.svg', width: 1200, height: 675, alt: '', rightsApproved: true },
  faqs: [],
  relatedSlugs: [],
  featured: false,
  seo: { title: 'A Valid Event', description: 'A valid event.' },
};

/** Drops keys without a discard binding, which the linter refuses. */
function omit<T extends object, K extends keyof T>(record: T, ...keys: K[]): Omit<T, K> {
  const copy = { ...record };
  for (const key of keys) delete copy[key];
  return copy;
}

/** Parses and returns the joined messages, so a case can assert the REASON. */
function reject(record: unknown): string {
  const result = publicEventRecordSchema.safeParse(record);
  expect(result.success, 'the schema ACCEPTED a record it should refuse').toBe(false);
  return result.success ? '' : result.error.issues.map((i) => i.message).join(' | ');
}

describe('the baseline record is genuinely valid', () => {
  it('parses, so every rejection below is caused by the one field it changed', () => {
    expect(publicEventRecordSchema.safeParse(VALID).success).toBe(true);
  });
});

describe('access and membership must agree', () => {
  it('refuses members-only that anyone can register for', () => {
    const message = reject({
      ...VALID,
      access: 'members-only',
      registration: { ...VALID.registration, requiresVerifiedMembership: false },
    });
    expect(message).toMatch(/members-only event must set requiresVerifiedMembership/i);
  });

  it('refuses a public event that demands membership', () => {
    const message = reject({
      ...VALID,
      registration: { ...VALID.registration, requiresVerifiedMembership: true },
    });
    expect(message).toMatch(/public event must set requiresVerifiedMembership: false/i);
  });
});

describe('a cancelled or completed event cannot be joined', () => {
  for (const lifecycle of ['cancelled', 'completed'] as const) {
    it(`refuses an open form on a ${lifecycle} event`, () => {
      const message = reject({ ...VALID, lifecycle });
      expect(message).toMatch(new RegExp(`${lifecycle} event cannot have registration state`, 'i'));
    });
  }
});

describe('the schedule must be internally consistent', () => {
  it('refuses endAt before startAt', () => {
    expect(reject({ ...VALID, endAt: '2026-10-14T13:00:00+08:00', durationMinutes: 60 })).toMatch(
      /startAt must be before endAt/i,
    );
  });

  it('refuses a durationMinutes that disagrees with the timestamps', () => {
    expect(reject({ ...VALID, durationMinutes: 90 })).toMatch(
      /durationMinutes is 90 but the timestamps span 60/i,
    );
  });

  it('refuses one end of the schedule without the other', () => {
    expect(reject({ ...omit(VALID, 'endAt'), durationMinutes: undefined })).toMatch(
      /both startAt and endAt, or neither/i,
    );
  });

  it('refuses a timestamp without the +08:00 offset', () => {
    /*
     * A bare timestamp means whatever timezone the parsing machine is in - UTC
     * on a CI runner - which moves every event eight hours and breaks the
     * second-Tuesday rule in a way that looks like a data error.
     */
    expect(reject({ ...VALID, startAt: '2026-10-14T14:00:00' })).toMatch(/\+08:00/);
  });

  it('refuses open registration on an event with no confirmed schedule', () => {
    expect(reject({ ...omit(VALID, 'startAt', 'endAt'), durationMinutes: undefined })).toMatch(
      /cannot be open on an event with no confirmed schedule/i,
    );
  });
});

describe('the PAAIPE AI Exchange facts are exact', () => {
  const exchange = { ...VALID, type: 'ai-exchange' as const, id: 'x', slug: 'x' };

  it('refuses an instance that is not on the second Tuesday', () => {
    // 2026-10-21 is the THIRD Tuesday.
    expect(
      reject({
        ...exchange,
        startAt: '2026-10-21T20:00:00+08:00',
        endAt: '2026-10-21T21:00:00+08:00',
      }),
    ).toMatch(/SECOND TUESDAY/i);
  });

  it('refuses an instance that does not begin at 8:00 PM', () => {
    expect(
      reject({
        ...exchange,
        startAt: '2026-10-13T19:00:00+08:00',
        endAt: '2026-10-13T20:00:00+08:00',
      }),
    ).toMatch(/begins at 8:00 PM/i);
  });

  it('refuses an instance that runs over one hour', () => {
    expect(
      reject({
        ...exchange,
        startAt: '2026-10-13T20:00:00+08:00',
        endAt: '2026-10-13T21:30:00+08:00',
        durationMinutes: 90,
      }),
    ).toMatch(/one hour maximum/i);
  });

  it('accepts a correct second-Tuesday instance', () => {
    // 2026-10-13 is the second Tuesday of October 2026.
    const ok = {
      ...exchange,
      startAt: '2026-10-13T20:00:00+08:00',
      endAt: '2026-10-13T21:00:00+08:00',
    };
    expect(publicEventRecordSchema.safeParse(ok).success).toBe(true);
  });

  it('carries the approved series facts verbatim', () => {
    expect(AI_EXCHANGE_SERIES.title).toBe('PAAIPE AI Exchange');
    expect(AI_EXCHANGE_SERIES.cadence).toBe('Every second Tuesday of the month');
    expect(AI_EXCHANGE_SERIES.time).toBe('8:00 PM Philippine Time');
    expect(AI_EXCHANGE_SERIES.format).toBe('Private Zoom');
    expect(AI_EXCHANGE_SERIES.duration).toBe('One hour maximum');
    expect(AI_EXCHANGE_SERIES.launch).toBe('September 2026');
    expect(AI_EXCHANGE_SERIES.agenda).toEqual([
      'Opening',
      '20-30 minute guest presentation',
      'Moderated Q&A',
      'Raffle and close',
    ]);
  });
});

describe('waitlist and media rules', () => {
  it('refuses a waitlist state without waitlistEnabled', () => {
    expect(
      reject({ ...VALID, registration: { ...VALID.registration, state: 'waitlist' } }),
    ).toMatch(/requires waitlistEnabled/i);
  });

  it('refuses an approved event whose media rights are unconfirmed', () => {
    expect(
      reject({
        ...VALID,
        contentStatus: 'approved',
        media: { ...VALID.media, rightsApproved: false },
      }),
    ).toMatch(/rightsApproved: true/i);
  });
});

describe('private fields cannot enter the model', () => {
  it('refuses every forbidden field name', () => {
    expect(FORBIDDEN_FIELDS.length).toBe(12);
    for (const field of FORBIDDEN_FIELDS) {
      const result = publicEventRecordSchema.safeParse({ ...VALID, [field]: 'anything' });
      expect(result.success, `the schema accepted \`${field}\``).toBe(false);
    }
  });
});

describe('sort orders', () => {
  const withDates = (id: string, start: string, end: string) =>
    ({ ...VALID, id, slug: id, startAt: start, endAt: end }) as PublicEventRecord;

  it('sorts upcoming soonest first', () => {
    const later = withDates('b', '2026-11-11T14:00:00+08:00', '2026-11-11T15:00:00+08:00');
    const sooner = withDates('a', '2026-10-14T14:00:00+08:00', '2026-10-14T15:00:00+08:00');
    expect([later, sooner].sort(byStartAscending).map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('sorts past most recent first', () => {
    const older = withDates('a', '2026-08-12T14:00:00+08:00', '2026-08-12T15:00:00+08:00');
    const newer = withDates('b', '2026-09-09T14:00:00+08:00', '2026-09-09T15:00:00+08:00');
    expect([older, newer].sort(byEndDescending).map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('sorts an undated event after dated ones rather than first', () => {
    /*
     * `Date.parse(undefined)` is NaN, and every comparison with NaN is false -
     * so a naive comparator leaves an undated record wherever it happened to be.
     * An undated event drifting to the top of "soonest first" would be the most
     * prominent thing on the page.
     */
    const undated = {
      ...omit(VALID, 'startAt', 'endAt'),
      id: 'z',
      slug: 'z',
      durationMinutes: undefined,
      registration: { ...VALID.registration, state: 'not-open' as const },
    } as PublicEventRecord;
    const dated = withDates('a', '2026-10-14T14:00:00+08:00', '2026-10-14T15:00:00+08:00');
    expect([undated, dated].sort(byStartAscending).map((e) => e.id)).toEqual(['a', 'z']);
  });
});

describe('sample records are excluded from production', () => {
  it('has samples to exclude', () => {
    expect(EVENT_SAMPLES.length).toBeGreaterThan(5);
    expect(EVENT_SAMPLES.every((e) => e.contentStatus === 'sample')).toBe(true);
  });

  it('publishes none of them in production mode, and all of them in review', () => {
    for (const sample of EVENT_SAMPLES) {
      expect(isPublishableEvent(sample, 'production'), sample.slug).toBe(false);
      expect(isPublishableEvent(sample, 'review'), sample.slug).toBe(true);
    }
  });

  it('covers the eight interface states the command lists', () => {
    const states = new Set(EVENT_SAMPLES.map((e) => `${e.lifecycle}/${e.registration.state}`));
    for (const required of [
      'scheduled/open',
      'scheduled/waitlist',
      'scheduled/full',
      'scheduled/not-open',
      'scheduled/closed',
      'cancelled/closed',
      'completed/closed',
    ]) {
      expect(states.has(required), `no sample covers ${required}`).toBe(true);
    }
    // Members-only open is a state of its own, not a lifecycle pair.
    expect(EVENT_SAMPLES.some((e) => e.access === 'members-only')).toBe(true);
  });
});

describe('the repository', () => {
  const repo = (mode: 'production' | 'review') =>
    new StaticEventCatalogRepository([...EVENT_RECORDS, ...EVENT_SAMPLES], [], [], mode);

  it('returns nothing approved in production, because nothing is approved', () => {
    // The honest current state, and the reason every screen shows an empty state.
    expect(EVENT_RECORDS.every((e) => e.contentStatus !== 'approved')).toBe(true);
  });

  it('answers null identically for an unpublishable record and a missing one', async () => {
    /*
     * A different answer for the two would let a caller detect that a private
     * draft exists - the enumeration the not-found rule exists to prevent.
     */
    const production = repo('production');
    expect(await production.getApprovedEventBySlug('sample-public-open')).toBeNull();
    expect(await production.getApprovedEventBySlug('no-such-event')).toBeNull();
  });

  it('finds a sample in review mode, so the exclusion is mode-driven and not absence', async () => {
    expect(await repo('review').getApprovedEventBySlug('sample-public-open')).not.toBeNull();
  });

  it('is wired to the build content mode', () => {
    expect(['production', 'review']).toContain(CONTENT_MODE);
  });
});

describe('the two event registries cannot drift while both exist', () => {
  /*
   * WHY BOTH EXIST. Tab 02 builds `PublicEventRecord`; the shipped pages still
   * read the older `PublicEvent`. Tab 02 says explicitly not to design the final
   * pages yet, and the two vocabularies genuinely differ - the old one has
   * `postponed` and `announcement-coming-soon`, the new one has `cancelled` and
   * `waitlist`. Deriving either from the other would be lossy in one direction
   * and would change what the live page says today.
   *
   * So they coexist until Tabs 03-04 retire the old one, and THIS is the guard
   * that stops them disagreeing in the meantime. Two registries describing one
   * event, free to drift, is the exact "two homes" failure the Tab 01 audit
   * refused elsewhere; here it is time-boxed and watched instead.
   */
  it('agrees on every fact the two models share', async () => {
    const { EVENTS } = await import('../content/events');
    const legacy = EVENTS.find((event) => event.slug === 'paaipe-ai-exchange');
    const modern = EVENT_RECORDS.find((event) => event.slug === 'paaipe-ai-exchange');
    expect(legacy, 'the legacy registry lost the series record').toBeDefined();
    expect(modern, 'the new registry lost the series record').toBeDefined();

    expect(modern!.title).toBe(legacy!.title);
    expect(modern!.excerpt).toBe(legacy!.excerpt);
    expect(modern!.access).toBe(legacy!.visibility);
    expect(modern!.contentStatus).toBe(legacy!.contentStatus);
    expect(modern!.timeZone).toBe(legacy!.timeZone);
    expect(modern!.format).toBe(legacy!.format);

    // Both must point at the same cover, or one screen shows different art.
    if (legacy!.image.kind === 'file') {
      expect(modern!.media.src).toBe(legacy!.image.src);
    }

    // Neither may carry a date, because none is approved.
    expect(legacy!.date).toBeUndefined();
    expect(modern!.startAt).toBeUndefined();
  });
});
