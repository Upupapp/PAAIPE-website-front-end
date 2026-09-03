import type { PublicEvent } from './types';

/**
 * Event fixtures.
 *
 * The recurring members' session is the only event PAAIPE has described, and no
 * specific date, topic or guest has been approved. So the single record below:
 *
 *  - carries NO `date` - an invented date would be a commitment nobody made;
 *  - carries NO `approvedSpeaker` - the schema forbids one on non-approved
 *    content anyway, and the speaker registry is empty;
 *  - uses `announcement-coming-soon`, matching the approved "The next topic and
 *    guest speaker will be announced soon." default state;
 *  - is `members-only`, so it can never advertise open public registration;
 *  - is `sample`, so it is stripped from a production build.
 *
 * The publicly stated recurrence, time and agenda ARE approved, so they are
 * carried faithfully. No meeting URL, meeting ID or passcode exists anywhere.
 */
export const EVENTS: readonly PublicEvent[] = [
  {
    slug: 'members-ai-exchange',
    title: "PAAIPE Members' AI Exchange",
    excerpt:
      'A private monthly Zoom session for the PAAIPE community. Each session features a guest speaker and a topic chosen around their expertise.',
    visibility: 'members-only',
    contentStatus: 'sample',
    timeZone: 'Asia/Manila',
    format: 'online',
    duration: 'One hour maximum',
    publicAgenda: [
      'Opening - brief welcome and introduction',
      'Guest presentation - focused 20-30-minute talk',
      'Live Q&A - member questions and practical discussion',
      'Raffle and close - short community raffle, takeaways, and closing remarks',
    ],
    status: 'upcoming',
    registrationState: 'announcement-coming-soon',
    image: { kind: 'placeholder', tone: 'navy' },
  },
];

/** Other event types PAAIPE runs, described in Tab 07. */
export const EVENT_TYPES = [
  {
    name: 'Skills Workshops',
    description: 'Guided sessions focused on practical AI tools, methods, and workflows.',
  },
  {
    name: 'Community Roundtables',
    description: 'Member conversations centered on shared questions, challenges, and lessons.',
  },
  {
    name: 'Public Briefings',
    description: 'Selected sessions that make important AI ideas accessible to a wider audience.',
  },
  {
    name: 'Collaborative Sessions',
    description: 'Events developed with confirmed organizations, speakers, or learning partners.',
  },
] as const;

/** The approved default state when no session has been announced. */
export const NEXT_EVENT_DEFAULT = {
  label: 'NEXT SESSION',
  heading: 'The next topic and guest speaker will be announced soon.',
  copy: "PAAIPE Members' AI Exchange takes place every second Tuesday at 8:00 PM PHT.",
} as const;
