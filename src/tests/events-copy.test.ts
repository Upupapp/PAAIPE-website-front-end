/**
 * The events copy, and the one property that keeps it true over time.
 *
 * PROVENANCE. These strings came from the `paaipe-researcher` lane on
 * 2026-09-04, in response to a request from this lane, and were marked
 * approved on the owner's explicit instruction that the researcher's response
 * be treated as approved content.
 *
 * The researcher itself declined to confer that status, ruling that only the
 * owner can decide what counts as approved. It was right to decline — but the
 * owner had already made the call, so the approval chain traces to a person
 * and not to an agent. That is what makes it approvable.
 *
 * What the researcher would NOT write, and what is therefore absent: an event
 * code of conduct (PAAIPE has not approved one), any notify-me or subscription
 * path (that is a mailing list, and this lane is front end only), and anything
 * describing a past session (none has happened).
 */
import { describe, expect, it } from 'vitest';
import {
  EVENTS_INDEX,
  EVENT_DETAIL_BLOCKS,
  EVENT_EMPTY_STATES,
  SIGNATURE_EVENT,
  AUDIENCES,
} from '../content';

describe('the cadence is composed, never retyped', () => {
  /*
   * The recurrence and time now appear in several strings. Written out by hand
   * each time, a schedule change would leave some stale and nothing would fail
   * — the sentences would simply disagree with each other, and the page would
   * be confidently wrong in two places at once.
   */
  it('every empty state that states the cadence derives it from SIGNATURE_EVENT', () => {
    const stated = [EVENT_EMPTY_STATES.upcoming.body, EVENT_EMPTY_STATES.membersOnly.body].filter(
      (body) => /second Tuesday|PM PHT/.test(body),
    );
    expect(stated.length, 'no string states the cadence at all').toBeGreaterThan(0);

    for (const body of stated) {
      const [first, ...rest] = SIGNATURE_EVENT.recurrence;
      expect(body, 'the recurrence is not the approved one').toContain(
        first!.toLowerCase() + rest.join(''),
      );
      /*
       * The day name must keep its capital. `.toLowerCase()` on the whole
       * phrase produced "every second tuesday" — a de-capitalised proper noun,
       * caught only by opening the visual diff rather than trusting the test.
       */
      expect(body, 'a day of the week lost its capital').not.toMatch(
        /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
      );
      expect(body, 'the time is not the approved one').toContain(SIGNATURE_EVENT.time);
    }
  });

  it('names the series by its approved title', () => {
    for (const body of [EVENT_EMPTY_STATES.upcoming.body, EVENT_EMPTY_STATES.membersOnly.body]) {
      expect(body).toContain(SIGNATURE_EVENT.title);
    }
  });
});

describe('every empty state offers a way onward', () => {
  /*
   * An empty state should say what the status is, teach what would fill it, and
   * offer a pathway (Nielsen Norman Group). This page's empty state is its
   * PRIMARY state — nothing is approved — and two of the three were dead ends.
   */
  it('upcoming and members-only both link somewhere real', () => {
    for (const state of [EVENT_EMPTY_STATES.upcoming, EVENT_EMPTY_STATES.membersOnly]) {
      expect(state.action.length, 'no action label').toBeGreaterThan(8);
      expect(state.actionHref, 'the action goes nowhere').toMatch(/^\/[a-z-]+$/);
    }
  });

  it('uses verb-first link text, never "click here" or "more"', () => {
    for (const label of [
      EVENT_EMPTY_STATES.upcoming.action,
      EVENT_EMPTY_STATES.membersOnly.action,
      EVENT_DETAIL_BLOCKS.propose.label,
    ]) {
      expect(label.toLowerCase()).not.toMatch(/\bclick here\b|\bread more\b|\blearn more\b|^more$/);
      // Front-loaded with a verb, so it stands alone out of context (WCAG 2.4.4).
      expect(label).toMatch(/^(Join|See|Suggest|Apply|Explore|Propose|Read|Find)\b/);
    }
  });
});

describe('nothing claims a mechanism that does not exist', () => {
  const everyString = [
    EVENTS_INDEX.intro,
    EVENTS_INDEX.audiences,
    EVENT_EMPTY_STATES.upcoming.body,
    EVENT_EMPTY_STATES.membersOnly.body,
    EVENT_EMPTY_STATES.membersOnly.access,
    EVENT_EMPTY_STATES.past.body,
    EVENT_DETAIL_BLOCKS.format.body,
    EVENT_DETAIL_BLOCKS.afterwards.body,
  ];

  it('promises no email, notification, reminder or subscription', () => {
    /*
     * This is a static site with no mailing list and no server. "We will let
     * you know" would describe a mechanism that does not exist, which is the
     * fabricated-success failure in a slower form.
     */
    for (const text of everyString) {
      expect(text.toLowerCase()).not.toMatch(
        /\bnotify|notified|subscribe|subscription|mailing list|we.ll email|reminder\b/,
      );
    }
  });

  it('states no number, date, count or named person', () => {
    for (const text of everyString) {
      // "20 to 30 minutes" and "one hour" are approved agenda facts; a year,
      // a member count or a headcount is not.
      expect(text).not.toMatch(/\b(19|20)\d{2}\b/);
      expect(text).not.toMatch(/\b\d{2,3}(,\d{3})*\+?\s+(members|attendees|people)\b/i);
    }
  });
});

describe('the detail blocks restate approved facts only', () => {
  it('reuses the approved audience list rather than paraphrasing it', () => {
    // A paraphrase drifts. The list is the same array the home page renders.
    expect(EVENT_DETAIL_BLOCKS.audience.items).toEqual(AUDIENCES);
  });

  it('describes the format using the approved duration and agenda shape', () => {
    const body = EVENT_DETAIL_BLOCKS.format.body;
    expect(body).toMatch(/one hour/i);
    expect(body).toMatch(/private Zoom/i);
    expect(body).toMatch(/20 to 30 minutes/);
  });

  it('points the proposal link at a page that exists', () => {
    expect(EVENT_DETAIL_BLOCKS.propose.href).toBe('/speakers');
  });

  it('does not mention a code of conduct, because none is approved', () => {
    // Every peer association publishes one, and PAAIPE has not approved one.
    // Writing the sentence would assert a document that does not exist.
    for (const text of [
      EVENT_DETAIL_BLOCKS.format.body,
      EVENT_DETAIL_BLOCKS.afterwards.body,
      EVENTS_INDEX.audiences,
    ]) {
      expect(text.toLowerCase()).not.toContain('code of conduct');
    }
  });
});
