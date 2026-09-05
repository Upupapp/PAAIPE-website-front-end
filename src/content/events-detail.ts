/**
 * Approved detail-page copy, Tab 04.
 *
 * Reproduced exactly as the command supplies it. Where the command gives words
 * they are used verbatim rather than paraphrased - an approved string that has
 * been "improved" in transit is an unapproved string.
 *
 * WHY THE FAQ SET IS A FUNCTION AND NOT A CONSTANT. The command supplies nine
 * questions and then constrains them: "Only include an answer that matches the
 * event's real policy. Never say a recording, certificate, raffle, support
 * channel, or reply time exists when it has not been approved." Two of the nine
 * make a claim about THIS event rather than about PAAIPE:
 *
 *   - the raffle answer presumes a raffle, which only the AI Exchange agenda has;
 *   - the accessibility answer points at "the configured support option", which
 *     does not exist unless PUBLIC_EVENT_SUPPORT_URL is set.
 *
 * Rendering the full nine on every page would put both claims on events that
 * cannot honour them. So the set is DERIVED from the event and the config, and
 * the two conditional entries are absent rather than reworded - a hedged answer
 * about a support channel that does not exist is still an answer about a support
 * channel that does not exist.
 */
import type { PublicEventRecord } from './event-record';

/** The metadata template. `{{APPROVED_META_DESCRIPTION}}` wins when supplied. */
export const DETAIL_METADATA = {
  titleSuffix: 'PAAIPE Events',
  /** Used only when a record carries no approved description of its own. */
  fallbackDescription: (title: string) =>
    `View details and registration information for ${title}, a PAAIPE event for the Philippine AI community.`,
} as const;

/** Supporting lines under the hero call to action, chosen by access. */
export const CTA_SUPPORTING_LINE = {
  public: 'Email only · No password required.',
  'members-only': 'Use the email connected to your PAAIPE membership.',
} as const;

/** Section headings, fixed by the command. */
export const DETAIL_HEADINGS = {
  about: 'About this event',
  outcomes: 'What you will take away',
  audience: 'Who should join',
  agenda: 'Public agenda',
  speaker: 'Speaker',
  registration: 'How to join',
  faqs: 'Frequently asked questions',
  related: 'Related events',
  hostedBy: 'Hosted by PAAIPE',
} as const;

/**
 * The approved About fallback.
 *
 * A FUNCTION OF AN APPROVED TOPIC, and it returns null without one. The command
 * offers this structure "when approved topic content exists"; a record with no
 * approved topic gets no About section rather than a sentence with an empty slot
 * where the subject should be.
 */
export function aboutFallback(approvedTopic: string | undefined): string | null {
  if (!approvedTopic) return null;
  return (
    `This PAAIPE event brings the community together for a focused conversation on ${approvedTopic}. ` +
    'Expect a clear presentation, practical examples and time to ask questions.'
  );
}

/**
 * The PAAIPE AI Exchange agenda, for an approved AI Exchange instance only.
 *
 * No minute marks beyond the one the command itself supplies, and no claim about
 * a prize, quantity, sponsor or eligibility rule.
 */
export const AI_EXCHANGE_AGENDA = {
  heading: 'What to expect',
  items: [
    'Opening and speaker introduction',
    '20-30 minute guest presentation',
    'Moderated Q&A',
    'Raffle and close',
  ],
  note: 'The complete session will run for no more than one hour.',
} as const;

/** The registration explainer. Four steps, then the security note. */
export const REGISTRATION_EXPLAINER = {
  heading: 'How to join',
  steps: [
    'Enter an email address you can access.',
    'Check your inbox for your registration message.',
    'Complete any confirmation or eligibility step described in that email.',
    'Event access details will be sent separately when applicable.',
  ],
  securityNote:
    'Private access details are sent only to approved registrants and are never displayed on this public page. ' +
    'Please do not share a private event link.',
} as const;

/**
 * The hosted-by block. The command says "use the exact organization and
 * closing", so both strings are verbatim and a test pins them.
 */
export const HOSTED_BY = {
  heading: 'Hosted by PAAIPE',
  body:
    'The Philippine Association of AI Professionals and Entrepreneurs connects people, knowledge ' +
    'and opportunities that can help the country build a more capable, inclusive and responsible AI future.',
  closing: 'Building the Philippines’ AI-Powered Future—Together.',
} as const;

/** Share controls. Copy-link only; see `calendarControl` for why. */
export const SHARE_COPY = {
  heading: 'Share this event',
  copyLabel: 'Copy event link',
  copiedLabel: 'Link copied',
  shareLabel: 'Share',
} as const;

export interface DetailFaq {
  question: string;
  answer: string;
}

/** The seven answers that are true of every PAAIPE event page. */
const UNIVERSAL_FAQS: readonly DetailFaq[] = [
  {
    question: 'Do I need a PAAIPE account to register?',
    answer:
      'Events marked “Open to everyone” require only an email address. Events marked “Verified members only” ' +
      'require an eligible PAAIPE membership.',
  },
  {
    question: 'What happens after I register?',
    answer:
      'You will receive a message at the email you provided. For online events, private access instructions ' +
      'are sent separately and are not shown on the public event page.',
  },
  {
    question: 'Where will I find the Zoom link?',
    answer:
      'For private online events, access is sent only to approved registrants. Check the inbox, Spam, and ' +
      'Promotions folders connected to your registration.',
  },
  {
    question: 'Can I share my event link?',
    answer:
      'Please do not share a private access link. It may be unique to a registration, and unregistered ' +
      'participants may not be admitted.',
  },
  {
    question: 'What timezone does PAAIPE use?',
    answer: 'Event schedules are shown in Philippine Time, or PHT, which is UTC+8.',
  },
  {
    question: 'Will the event be recorded or provide a certificate?',
    answer:
      'A recording, public resource, or certificate is available only when the event page explicitly says so ' +
      'and approval has been confirmed.',
  },
  {
    question: 'How is my email used?',
    answer:
      'PAAIPE uses the email to manage the event registration and send necessary event messages. General news ' +
      'and future-event promotions require a separate optional choice.',
  },
];

const RAFFLE_FAQ: DetailFaq = {
  question: 'How does the raffle work?',
  answer:
    'When a raffle is included, approved mechanics and eligibility rules will be shown for that event. ' +
    'Registration or attendance does not guarantee a prize.',
};

const SUPPORT_FAQ: DetailFaq = {
  question: 'How can I request accessibility support?',
  answer:
    'Use the configured support option on the event page as early as possible. PAAIPE will review the request ' +
    'and explain what support is available.',
};

/**
 * The FAQ set for one event.
 *
 * Order: the record's own approved FAQs first - they are specific to the event
 * and answer it better than a general one - then the universal set, then the two
 * conditional entries. A record FAQ whose question duplicates a universal one
 * WINS and the universal is dropped, so an event that has approved a different
 * answer to "What happens after I register?" is not contradicted two rows below
 * by the generic one.
 */
export function detailFaqs(
  event: Pick<PublicEventRecord, 'type' | 'faqs'>,
  supportConfigured: boolean,
): readonly DetailFaq[] {
  const own = event.faqs.map((faq) => ({ question: faq.question, answer: faq.answer }));
  const claimed = new Set(own.map((faq) => faq.question.trim().toLowerCase()));
  const universal = UNIVERSAL_FAQS.filter((faq) => !claimed.has(faq.question.trim().toLowerCase()));

  const conditional: DetailFaq[] = [];
  // Only the AI Exchange agenda includes a raffle.
  if (event.type === 'ai-exchange' && !claimed.has(RAFFLE_FAQ.question.toLowerCase())) {
    conditional.push(RAFFLE_FAQ);
  }
  // "The configured support option" must actually be configured.
  if (supportConfigured && !claimed.has(SUPPORT_FAQ.question.toLowerCase())) {
    conditional.push(SUPPORT_FAQ);
  }

  return [...own, ...universal, ...conditional];
}

/**
 * Add-to-calendar is DELIBERATELY ABSENT, and the command permits this in the
 * same sentence that describes it: "If the approved calendar function does not
 * exist, omit the control."
 *
 * The gate it would have to pass is `contentStatus === 'approved'` - the command
 * says a calendar item may never be offered "before the event record is
 * approved". No record in this repository is approved: production has none at
 * all, and every review fixture is `sample` by construction. So the control
 * could not render on any page in any content mode, in production or in review.
 *
 * Building it anyway would produce a branch no test could reach and no reviewer
 * could see - the shape this repository has already met three times, where a
 * feature exists in the source, passes its own unit test, and is on no code
 * path. The reason is recorded here so the omission reads as a decision rather
 * than an oversight, and so whoever approves the first event knows this is the
 * one control that does not appear by itself.
 */
export const CALENDAR_CONTROL_OMITTED =
  'Add-to-calendar is not rendered. It may only be offered for an approved event record, and no ' +
  'event is approved, so the control could not appear in any content mode.';
