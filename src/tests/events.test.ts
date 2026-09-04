import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { stripComments } from '../lib/strip-comments';

const EVENTS_SOURCE = new URL('../content/events.ts', import.meta.url).pathname;
import {
  eventStructuredData,
  partition,
  publicEventFields,
  sectionOf,
  topicsOf,
} from '../lib/events';
import {
  EVENTS_INDEX,
  EVENT_EMPTY_STATES,
  MEMBER_LOCK,
  NEXT_EVENT_DEFAULT,
  REGISTRATION_STATE_LABELS,
  SIGNATURE_SERIES,
  SPEAKERS_PAGE,
  allEvents,
  approvedSpeakers,
} from '../content';
import type { PublicEvent } from '../content/types';

const base: PublicEvent = {
  slug: 'sample-session',
  title: 'A session',
  excerpt: 'A teaser.',
  visibility: 'public',
  contentStatus: 'approved',
  timeZone: 'Asia/Manila',
  format: 'online',
  publicAgenda: ['Opening', 'Talk'],
  status: 'upcoming',
  registrationState: 'registration-open',
  image: { kind: 'placeholder', tone: 'navy' },
};

const memberEvent: PublicEvent = {
  ...base,
  slug: 'member-session',
  visibility: 'members-only',
  registrationState: 'members-only',
  duration: 'One hour maximum',
  approvedSpeaker: {
    slug: 'someone',
    name: 'A Person',
    title: 'CTO, Example',
    approvedOn: '2026-09-01',
  },
};

describe('publicEventFields is the privacy boundary', () => {
  it('exposes only the permitted fields for a members-only session', () => {
    const view = publicEventFields(memberEvent);
    // Title, teaser, category, date and public agenda - and nothing else.
    expect(Object.keys(view).sort()).toEqual(
      ['slug', 'title', 'excerpt', 'category', 'date', 'timeZone', 'publicAgenda', 'locked'].sort(),
    );
    expect(view.locked).toBe(true);
  });

  it('carries NO speaker, duration or description field at all for a locked session', () => {
    // Absent, not empty: a template cannot leak a field the object does not have.
    const view = publicEventFields(memberEvent);
    expect('speakerName' in view).toBe(false);
    expect('speakerTitle' in view).toBe(false);
    expect('duration' in view).toBe(false);
    expect('description' in view).toBe(false);
  });

  it('exposes the fuller set for a public session', () => {
    const view = publicEventFields({ ...base, duration: 'One hour maximum' });
    expect(view.locked).toBe(false);
    expect(view.duration).toBe('One hour maximum');
    expect(view.description).toBe(base.excerpt);
  });

  it('never invents a date', () => {
    expect(publicEventFields(base).date).toBeUndefined();
  });
});

describe('structured data only describes real, approved, public events', () => {
  it('emits nothing for a members-only session', () => {
    expect(eventStructuredData({ ...memberEvent, date: '2027-03-09' })).toBeNull();
  });

  it('emits nothing for sample or draft content', () => {
    expect(
      eventStructuredData({ ...base, contentStatus: 'sample', date: '2027-03-09' }),
    ).toBeNull();
    expect(eventStructuredData({ ...base, contentStatus: 'draft', date: '2027-03-09' })).toBeNull();
  });

  it('emits nothing when no date is approved', () => {
    expect(eventStructuredData(base)).toBeNull();
  });

  it('emits a valid Event for an approved public dated event', () => {
    const data = eventStructuredData({ ...base, date: '2027-03-09' });
    expect(data).toMatchObject({
      '@type': 'Event',
      startDate: '2027-03-09',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    });
  });

  it('emits nothing for anything currently in the registry', () => {
    // Everything is `sample`, so the site ships no Event markup at all today.
    expect(allEvents.map(eventStructuredData).filter(Boolean)).toEqual([]);
  });
});

describe('event sectioning', () => {
  it('routes completed events to past regardless of visibility', () => {
    expect(sectionOf({ ...memberEvent, status: 'completed' })).toBe('past');
  });

  it('routes members-only upcoming events to the members section', () => {
    expect(sectionOf(memberEvent)).toBe('members-only');
  });

  it('routes public upcoming events to upcoming', () => {
    expect(sectionOf(base)).toBe('upcoming');
  });

  it('partitions without losing or duplicating an event', () => {
    const events = [base, memberEvent, { ...base, slug: 'done', status: 'completed' as const }];
    const buckets = partition(events);
    const total = buckets.upcoming.length + buckets['members-only'].length + buckets.past.length;
    expect(total).toBe(events.length);
  });

  it('derives filter topics from what is actually listed', () => {
    expect(topicsOf([base, { ...base, slug: 'b', format: 'hybrid' }])).toEqual([
      'hybrid',
      'online',
    ]);
    expect(topicsOf([])).toEqual([]);
  });
});

describe('approved copy', () => {
  it('promises no timing PAAIPE has not established', () => {
    /*
     * The DURABLE half of the two pins above, which only hold the exact
     * sentences someone happened to write.
     *
     * "Soon" and "shortly" are claims about WHEN, and PAAIPE has established no
     * when: no date is approved for any session. The FTC's dark-patterns report
     * treats a timing signal unsupported by a timing fact as creating a
     * misleading impression, and NPC Advisory 2023-01 - binding on PAAIPE as a
     * personal information controller - names misleading information as a
     * content-based deceptive pattern.
     *
     * This file said it TWICE, in the badge and in the hero, and fixing one
     * left the other in larger type. A pin on each sentence would not have
     * caught the second; this does, and it catches the third.
     *
     * Comments are stripped first. The comments in this module EXPLAIN the
     * prohibition and necessarily quote the words it forbids - a scan that read
     * them would flag the explanation and not the defect, which is a trap this
     * project has hit repeatedly.
     */
    const source = stripComments(readFileSync(EVENTS_SOURCE, 'utf8'));
    /*
     * A hyphen on either side means a machine value, not prose:
     * `announcement-coming-soon` is a union member that names the STATE and is
     * never rendered - the label beside it is what a reader sees, and that one
     * now reads "Date Not Announced". Prose never carries a hyphen tight
     * against the word, so this needs no list of exceptions to keep current.
     */
    const offenders = [...source.matchAll(/[^\n]*(?<![\w-])(soon|shortly)(?![\w-])[^\n]*/gi)].map(
      (m) => m[0].trim(),
    );
    expect(offenders).toEqual([]);
  });

  it('states the signature series schedule exactly', () => {
    expect(SIGNATURE_SERIES.schedule).toEqual([
      'Every second Tuesday',
      '8:00 PM Philippine Time',
      'Private Zoom',
      'One hour maximum',
    ]);
    expect(SIGNATURE_SERIES.subtitle).toBe(
      'A private monthly Zoom session for the PAAIPE community',
    );
  });

  it('uses the approved default next-event state', () => {
    expect(NEXT_EVENT_DEFAULT.heading).toBe(
      'The next topic and guest speaker are announced on this page.',
    );
    // No countdown, attendance count or capacity label may appear in it.
    const text = JSON.stringify(NEXT_EVENT_DEFAULT);
    expect(text).not.toMatch(
      /\b(seats|spots|remaining|attendees|capacity|countdown|days? left)\b/i,
    );
  });

  it('supports exactly the seven approved registration states', () => {
    expect(Object.keys(REGISTRATION_STATE_LABELS)).toHaveLength(7);
    expect(Object.values(REGISTRATION_STATE_LABELS)).toContain(
      'Recording Available to Eligible Members',
    );
  });

  it('gives every listing section an honest empty state', () => {
    for (const key of ['upcoming', 'membersOnly', 'past', 'filtered'] as const) {
      expect(EVENT_EMPTY_STATES[key].heading.length, key).toBeGreaterThan(10);
      expect(EVENT_EMPTY_STATES[key].body.length, key).toBeGreaterThan(20);
    }
  });

  it('states the members-only lock copy without any access detail', () => {
    const text = JSON.stringify(MEMBER_LOCK);
    expect(MEMBER_LOCK.heading).toBe('This session is for PAAIPE members');
    expect(text).not.toMatch(/zoom\.us|http|meeting|passcode|password/i);
  });

  it('offers a non-member a route that works whatever the owner has configured', () => {
    /*
     * The panel used to offer two EXTERNAL handoffs and nothing else. Both are
     * unconfigured under owner item B-4, so a reader who was not already a
     * member met two unavailable controls and no way onward - the
     * asymmetric-effort pattern NPC Advisory 2023-01 prohibits.
     *
     * These two routes are internal, so they work regardless of B-4. Asserting
     * they are RELATIVE is the point: the moment either becomes an external URL
     * it inherits the availability problem this exists to prevent.
     */
    for (const href of [MEMBER_LOCK.membershipHref, MEMBER_LOCK.askHref]) {
      expect(href.startsWith('/'), `${href} must be an internal route`).toBe(true);
      expect(href).not.toMatch(/^\/\//);
    }
    expect(MEMBER_LOCK.membershipHref).not.toBe(MEMBER_LOCK.askHref);
    for (const label of [MEMBER_LOCK.membershipCta, MEMBER_LOCK.askCta]) {
      expect(label.length).toBeGreaterThan(8);
    }
  });

  it('carries the events index intro and the speakers page process', () => {
    expect(EVENTS_INDEX.intro).toContain('PAAIPE events connect the community');
    expect(SPEAKERS_PAGE.process).toHaveLength(5);
    expect(SPEAKERS_PAGE.explains).toHaveLength(10);
  });

  it('names nobody as a confirmed speaker', () => {
    expect(approvedSpeakers).toEqual([]);
    expect(JSON.stringify(SPEAKERS_PAGE)).not.toMatch(/\b(inc\.|corp\.|ltd\.|cto|ceo) \b/i);
  });
});
