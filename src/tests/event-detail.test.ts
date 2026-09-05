/**
 * Tab 04 - the event detail experience.
 *
 * These assert the RULES, not the current fixture data, so a new approved event
 * cannot quietly break one. Where a test pins an exact string it is because the
 * command supplies that string exactly and a paraphrase would be unapproved
 * copy.
 */
import { describe, expect, it } from 'vitest';
import {
  AI_EXCHANGE_AGENDA,
  CTA_SUPPORTING_LINE,
  DETAIL_HEADINGS,
  DETAIL_METADATA,
  HOSTED_BY,
  REGISTRATION_EXPLAINER,
  aboutFallback,
  detailFaqs,
} from '../content/events-detail';
import { EVENT_SAMPLES } from '../content/event-samples';
import { EVENT_RECORDS } from '../content/event-records';
import { REGISTRATION_UNAVAILABLE_MESSAGE } from '../config/event-config';
import { resolveEventAction } from '../lib/event-action';
import type { PublicEventRecord } from '../content/event-record';

const ALL: readonly PublicEventRecord[] = [...EVENT_RECORDS, ...EVENT_SAMPLES];

function sample(id: string): PublicEventRecord {
  const found = ALL.find((record) => record.id === id);
  if (!found) throw new Error(`fixture ${id} is missing; this test is measuring nothing`);
  return found;
}

describe('the approved copy is reproduced exactly', () => {
  it('uses the exact hosted-by organisation sentence and closing', () => {
    expect(HOSTED_BY.body).toBe(
      'The Philippine Association of AI Professionals and Entrepreneurs connects people, knowledge ' +
        'and opportunities that can help the country build a more capable, inclusive and responsible AI future.',
    );
    expect(HOSTED_BY.closing).toBe('Building the Philippines’ AI-Powered Future—Together.');
  });

  it('gives the four registration steps in order', () => {
    expect(REGISTRATION_EXPLAINER.steps).toEqual([
      'Enter an email address you can access.',
      'Check your inbox for your registration message.',
      'Complete any confirmation or eligibility step described in that email.',
      'Event access details will be sent separately when applicable.',
    ]);
  });

  it('states that private access details never appear on the public page', () => {
    expect(REGISTRATION_EXPLAINER.securityNote).toContain(
      'sent only to approved registrants and are never displayed on this public page',
    );
  });

  it('keeps the AI Exchange agenda to the approved four lines and the one-hour limit', () => {
    expect(AI_EXCHANGE_AGENDA.items).toEqual([
      'Opening and speaker introduction',
      '20-30 minute guest presentation',
      'Moderated Q&A',
      'Raffle and close',
    ]);
    expect(AI_EXCHANGE_AGENDA.note).toBe(
      'The complete session will run for no more than one hour.',
    );
  });

  it('adds no minute mark the organizer did not approve', () => {
    /*
     * The one duration in the approved agenda is "20-30 minute". Any other
     * digits-plus-minutes string would be a schedule PAAIPE never agreed to,
     * and it is the easiest thing in the world to add while "improving" an
     * agenda.
     */
    const minuteMarks = AI_EXCHANGE_AGENDA.items.filter((item) => /\d+\s*(min|minute)/i.test(item));
    expect(minuteMarks).toEqual(['20-30 minute guest presentation']);
  });

  it('does not name a prize, sponsor, quantity or eligibility rule', () => {
    const agenda = [...AI_EXCHANGE_AGENDA.items, AI_EXCHANGE_AGENDA.note].join(' ').toLowerCase();
    for (const forbidden of ['prize', 'sponsor', 'winner', 'eligible to win', 'guaranteed']) {
      expect(agenda).not.toContain(forbidden);
    }
  });

  it('separates the agenda heading from the AI Exchange one', () => {
    /*
     * The command lists "Public agenda" as section 9 and gives "What to expect"
     * as the AI Exchange block's own heading. Collapsing them into one string
     * put "What to expect" above a workshop's agenda, which is a different
     * promise about what the section contains.
     */
    expect(DETAIL_HEADINGS.agenda).toBe('Public agenda');
    expect(AI_EXCHANGE_AGENDA.heading).toBe('What to expect');
    expect(DETAIL_HEADINGS.agenda).not.toBe(AI_EXCHANGE_AGENDA.heading);
  });
});

describe('optional content is omitted rather than invented', () => {
  it('returns no About fallback without an approved topic', () => {
    expect(aboutFallback(undefined)).toBeNull();
    expect(aboutFallback('')).toBeNull();
  });

  it('names the approved topic when one exists', () => {
    expect(aboutFallback('practical AI adoption')).toContain('practical AI adoption');
  });

  it('falls back to a description that names the event rather than a generic one', () => {
    expect(DETAIL_METADATA.fallbackDescription('A Session')).toContain('A Session');
  });
});

describe('the FAQ set matches what the event can actually honour', () => {
  const workshop = sample('sample-public-open');

  it('offers the raffle answer only for an AI Exchange', () => {
    const exchange = ALL.find((record) => record.type === 'ai-exchange');
    expect(exchange, 'no ai-exchange fixture exists; this test measures nothing').toBeDefined();

    const workshopQuestions = detailFaqs(workshop, false).map((faq) => faq.question);
    expect(workshopQuestions).not.toContain('How does the raffle work?');

    const exchangeQuestions = detailFaqs(exchange!, false).map((faq) => faq.question);
    expect(exchangeQuestions).toContain('How does the raffle work?');
  });

  it('offers the accessibility answer only when a support option is configured', () => {
    const without = detailFaqs(workshop, false).map((faq) => faq.question);
    expect(without).not.toContain('How can I request accessibility support?');

    const with_ = detailFaqs(workshop, true).map((faq) => faq.question);
    expect(with_).toContain('How can I request accessibility support?');
  });

  it("lets an event's own approved answer replace the generic one rather than sit beside it", () => {
    const overridden = detailFaqs(
      {
        type: 'workshop',
        faqs: [
          { question: 'What timezone does PAAIPE use?', answer: 'A different approved answer.' },
        ],
      },
      false,
    );
    const matches = overridden.filter((faq) => faq.question === 'What timezone does PAAIPE use?');
    expect(matches).toHaveLength(1);
    expect(matches[0]?.answer).toBe('A different approved answer.');
  });

  it('never claims a recording or certificate exists', () => {
    const answer = detailFaqs(workshop, false).find((faq) =>
      faq.question.startsWith('Will the event be recorded'),
    )?.answer;
    expect(answer).toContain('only when the event page explicitly says so');
  });
});

describe('the resolver states something for every state a page can be in', () => {
  /*
   * THE DEFECT THIS EXISTS FOR. The `open` branch carried no message at all, so
   * the detail panel rendered an empty paragraph beneath "Registration open" -
   * and that is the state a production page sits in most of the time. It was
   * invisible for the whole of Tab 03 because a marketplace card reads only the
   * badge.
   */
  it('gives every state and both service conditions a non-empty message', () => {
    for (const record of ALL) {
      for (const service of ['available', 'unavailable'] as const) {
        const action = resolveEventAction(record, service);
        expect(
          action.message?.trim(),
          `${record.id} (${record.lifecycle}/${record.registration.state}, service ${service}) has no message`,
        ).toBeTruthy();
        expect(action.badge.trim()).toBeTruthy();
      }
    }
  });

  it('uses the exact required sentence when the service is not connected', () => {
    const open = ALL.find((record) => record.registration.state === 'open');
    expect(open).toBeDefined();
    expect(resolveEventAction(open!, 'unavailable').message).toBe(REGISTRATION_UNAVAILABLE_MESSAGE);
  });

  it('offers no registration path for a cancelled or completed event, whatever the service says', () => {
    for (const record of ALL) {
      if (record.lifecycle === 'scheduled') continue;
      for (const service of ['available', 'unavailable'] as const) {
        expect(
          resolveEventAction(record, service).formEnabled,
          `${record.id} offers a registration path while ${record.lifecycle}`,
        ).toBe(false);
      }
    }
  });

  it('offers no registration path while the service is unavailable', () => {
    for (const record of ALL) {
      expect(
        resolveEventAction(record, 'unavailable').formEnabled,
        `${record.id} offers a registration path with no endpoint configured`,
      ).toBe(false);
    }
  });
});

describe('the supporting line matches the access rule', () => {
  it('never tells a public event that a membership email is required', () => {
    expect(CTA_SUPPORTING_LINE.public).toBe('Email only · No password required.');
    expect(CTA_SUPPORTING_LINE.public.toLowerCase()).not.toContain('membership');
  });

  it('tells a members-only event to use the membership email', () => {
    expect(CTA_SUPPORTING_LINE['members-only']).toContain('membership');
  });
});

describe('nothing private can be described by the model', () => {
  it('carries no field that could hold a meeting destination', () => {
    for (const record of ALL) {
      const serialised = JSON.stringify(record).toLowerCase();
      for (const forbidden of ['zoomurl', 'meetingid', 'passcode', 'joinurl', 'password']) {
        expect(serialised, `${record.id} serialises ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it('says only the approved public venue label for an online event', () => {
    for (const record of ALL) {
      if (record.format !== 'online') continue;
      expect(record.formatLabel.toLowerCase()).not.toMatch(/https?:\/\//);
    }
  });
});

describe('related events resolve to pages that exist', () => {
  it('never names a slug absent from the registry', () => {
    const slugs = new Set(ALL.map((record) => record.slug));
    for (const record of ALL) {
      for (const related of record.relatedSlugs) {
        expect(slugs.has(related), `${record.id} relates to unknown slug ${related}`).toBe(true);
      }
    }
  });

  it('never relates an event to itself', () => {
    for (const record of ALL) {
      expect(record.relatedSlugs).not.toContain(record.slug);
    }
  });
});

describe('metadata titles are unique per page', () => {
  /*
   * Tab 03 made the rendered TITLES unique to satisfy the SEO uniqueness gate
   * and left `seo.title` duplicated across six fixtures. The gate could not see
   * it because the marketplace rendered `title` and nothing rendered `seo.title`
   * until this tab. The property to hold is that whatever a page puts in its
   * <title> is unique, so it is asserted on the field the page actually uses.
   */
  it('gives every record a distinct seo title', () => {
    const titles = ALL.map((record) => record.seo.title || record.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
