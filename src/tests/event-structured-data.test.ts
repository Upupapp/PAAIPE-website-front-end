/**
 * Tab 09 - `Event` JSON-LD.
 *
 * The gates matter more than the fields here: almost every way of getting this
 * wrong publishes something machine-readable and untrue, which is worse than
 * publishing nothing, because a crawler will repeat it without a reader ever
 * seeing it.
 */
import { readFileSync, globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EVENT_RECORDS } from '../content/event-records';
import { EVENT_SAMPLES } from '../content/event-samples';
import { ORGANIZER_NAME, eventRecordStructuredData } from '../lib/event-structured-data';
import type { PublicEventRecord } from '../content/event-record';

const ORIGIN = 'https://example.org';
const ALL = [...EVENT_RECORDS, ...EVENT_SAMPLES];

/** An approved, public, dated, online event - the only shape that emits. */
function approved(extra: Partial<PublicEventRecord> = {}): PublicEventRecord {
  return {
    schemaVersion: 1,
    id: 'ld',
    slug: 'ld',
    title: 'An Approved Session',
    excerpt: 'A short approved summary.',
    description: [],
    contentStatus: 'approved',
    type: 'workshop',
    access: 'public',
    format: 'online',
    lifecycle: 'scheduled',
    startAt: '2026-10-14T14:00:00+08:00',
    endAt: '2026-10-14T15:00:00+08:00',
    durationMinutes: 60,
    timeZone: 'Asia/Manila',
    formatLabel: 'Online · Private Zoom',
    publicAgenda: [],
    learningOutcomes: [],
    audience: [],
    speakerIds: [],
    topicTags: [],
    registration: {
      mode: 'email',
      state: 'open',
      requiresVerifiedMembership: false,
      waitlistEnabled: false,
      showCapacity: false,
      privacyNoticeVersion: 'draft-2026-09-04',
      eventVersion: 1,
    },
    media: { src: '/x.png', width: 1, height: 1, alt: '', rightsApproved: false },
    faqs: [],
    relatedSlugs: [],
    featured: false,
    seo: { title: 'An Approved Session', description: 'An approved description.' },
    ...extra,
  };
}

describe('it emits only for an event that really is one', () => {
  it('emits for an approved, public, dated, online event with an origin', () => {
    const data = eventRecordStructuredData(approved(), { origin: ORIGIN });
    expect(data).not.toBeNull();
    expect(data!['@type']).toBe('Event');
    expect(data!.url).toBe(`${ORIGIN}/events/ld`);
  });

  it.each([
    ['a sample', { contentStatus: 'sample' as const }],
    ['a draft', { contentStatus: 'draft' as const }],
    ['a members-only session', { access: 'members-only' as const }],
    ['an undated event', { startAt: undefined }],
    ['an in-person event with no approved address', { format: 'in-person' as const }],
    ['a hybrid event with no approved address', { format: 'hybrid' as const }],
  ])('emits nothing for %s', (_label, patch) => {
    expect(eventRecordStructuredData(approved(patch), { origin: ORIGIN })).toBeNull();
  });

  it('emits nothing without an approved origin', () => {
    expect(eventRecordStructuredData(approved(), {})).toBeNull();
    expect(eventRecordStructuredData(approved(), { origin: undefined })).toBeNull();
  });

  it('emits nothing for anything currently in the registry', () => {
    /*
     * The honest state today: no record is approved. Asserted so that the
     * emptiness is a MEASURED fact rather than an assumption, and so approving
     * the first event makes this fail and be re-read.
     */
    const emitted = ALL.map((record) =>
      eventRecordStructuredData(record, { origin: ORIGIN }),
    ).filter(Boolean);
    expect(emitted).toEqual([]);
  });
});

describe('what it says is accurate', () => {
  it('marks a cancelled event cancelled, never postponed', () => {
    const data = eventRecordStructuredData(approved({ lifecycle: 'cancelled' }), {
      origin: ORIGIN,
    });
    expect(data!.eventStatus).toBe('https://schema.org/EventCancelled');
    // `EventPostponed` asserts a new date is coming. Nothing here may say that.
    expect(JSON.stringify(data)).not.toContain('EventPostponed');
  });

  it('marks a rescheduled event rescheduled, not merely scheduled', () => {
    const data = eventRecordStructuredData(
      approved({ scheduleUpdatedAt: '2026-09-20T09:00:00+08:00' }),
      { origin: ORIGIN },
    );
    expect(data!.eventStatus).toBe('https://schema.org/EventRescheduled');
  });

  it('points the virtual location at the public page, never a meeting', () => {
    const data = eventRecordStructuredData(approved(), { origin: ORIGIN });
    const location = data!.location as Record<string, string>;
    expect(location['@type']).toBe('VirtualLocation');
    expect(location.url).toBe(`${ORIGIN}/events/ld`);
    expect(JSON.stringify(data).toLowerCase()).not.toContain('zoom');
  });

  it('names the organisation in full', () => {
    const data = eventRecordStructuredData(approved(), { origin: ORIGIN });
    expect((data!.organizer as Record<string, string>).name).toBe(ORGANIZER_NAME);
    expect(ORGANIZER_NAME).toContain('Philippine Association of AI Professionals');
  });

  it('claims no price, capacity or availability', () => {
    const serialised = JSON.stringify(eventRecordStructuredData(approved(), { origin: ORIGIN }));
    for (const forbidden of [
      'offers',
      'price',
      'availability',
      'remainingAttendeeCapacity',
      'maximumAttendeeCapacity',
    ]) {
      expect(serialised, `structured data claims ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('includes an image only when its rights are approved', () => {
    expect(eventRecordStructuredData(approved(), { origin: ORIGIN })!.image).toBeUndefined();
    const cleared = eventRecordStructuredData(
      approved({
        media: { src: '/ok.png', width: 1, height: 1, alt: 'x', rightsApproved: true },
      }),
      { origin: ORIGIN },
    );
    expect(cleared!.image).toEqual([`${ORIGIN}/ok.png`]);
  });

  it('lists a performer only when the speaker is approved', () => {
    const withSpeaker = approved({ speakerIds: ['s1'] });
    const draftSpeaker = eventRecordStructuredData(withSpeaker, {
      origin: ORIGIN,
      speakers: [{ id: 's1', contentStatus: 'draft', name: 'A Person' }],
    });
    expect(draftSpeaker!.performer).toBeUndefined();

    const approvedSpeaker = eventRecordStructuredData(withSpeaker, {
      origin: ORIGIN,
      speakers: [{ id: 's1', contentStatus: 'approved', name: 'A Person' }],
    });
    expect(approvedSpeaker!.performer).toEqual([{ '@type': 'Person', name: 'A Person' }]);
  });
});

describe('nothing in this repository promises a Google rich result', () => {
  /*
   * The command is explicit: PAAIPE's virtual, member-gated events are not
   * eligible for Google's Event experience, and its regional availability does
   * not include the Philippines. A validator reporting "no eligible
   * enhancement" is the CORRECT outcome.
   *
   * This guards the claim rather than the markup, because the markup cannot
   * make the claim - a person writing a handoff document can, and that document
   * is what an owner reads before deciding the work succeeded.
   */
  const CLAIMS = [
    /rich result[s]? (are |will be )?(enabled|guaranteed|eligible)/i,
    /google (event )?carousel/i,
    /will appear in google/i,
    /guarantee[sd]? (a )?rich (card|snippet|result)/i,
  ];

  /*
   * THIS FILE IS EXCLUDED, and that is structural rather than an exemption.
   *
   * It is the sole home of the patterns, so it necessarily contains every
   * phrase it forbids - including the break-check string below, which exists to
   * prove the matcher fires. A scanner that reads its own declarations reports
   * itself, every time, and the only repairs available are to obfuscate the
   * patterns or to add a blanket ignore. Excluding exactly one file - the one
   * that must contain them - keeps the rest of the repository honestly covered.
   *
   * This is the fourth time this shape has come up here: a guard flagging the
   * text that describes the guard.
   */
  const SELF = 'src/tests/event-structured-data.test.ts';
  const files = [
    ...globSync('docs/**/*.md'),
    ...globSync('src/**/*.ts'),
    ...globSync('README.md'),
  ].filter((file) => file !== SELF);

  it('has files to scan, and does not include itself', () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files, 'the scanner is reading its own pattern declarations').not.toContain(SELF);
    // The exclusion must remove exactly one file, not silently match nothing.
    expect(globSync('src/**/*.ts')).toContain(SELF);
  });

  it('makes no eligibility or carousel claim', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const claim of CLAIMS) if (claim.test(text)) offenders.push(`${claim} in ${file}`);
    }
    expect(offenders, 'a file promises a Google rich result').toEqual([]);
  });

  it('proves the matcher fires on a claim', () => {
    expect(CLAIMS.some((claim) => claim.test('This guarantees a rich card in Google.'))).toBe(true);
  });
});
