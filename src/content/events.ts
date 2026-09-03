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

export const EVENTS_INDEX = {
  intro:
    'PAAIPE events connect the community with practitioners, leaders and subject-matter experts through focused presentations, honest questions and meaningful professional exchange.',
} as const;

export const SIGNATURE_SERIES = {
  label: 'SIGNATURE MONTHLY EVENT',
  title: "PAAIPE Members' AI Exchange",
  subtitle: 'A private monthly Zoom session for the PAAIPE community',
  description:
    'Each session features a guest speaker and a topic chosen around their expertise. The goal is simple: give members useful ideas, practical context and direct access to thoughtful conversation.',
  schedule: ['Every second Tuesday', '8:00 PM Philippine Time', 'Private Zoom', 'One hour maximum'],
} as const;

/**
 * The locked panel shown in place of a members-only session's private detail.
 *
 * It is the ONLY thing a public visitor sees beyond title, teaser, category,
 * date and public agenda. No registration field, meeting URL, password, meeting
 * ID, attachment or member record exists here or anywhere in this codebase.
 */
export const MEMBER_LOCK = {
  label: 'MEMBERS ONLY - PRIVATE ZOOM',
  heading: 'This session is reserved for verified PAAIPE members.',
  body: 'Apply to join the community, or sign in through the Members Portal if you are already verified.',
  applyCta: 'Apply for Membership',
  signInCta: 'Member Sign In',
} as const;

/** Human labels for the seven approved registration states. */
export const REGISTRATION_STATE_LABELS = {
  'registration-open': 'Registration Open',
  'members-only': 'Members Only',
  'limited-capacity': 'Limited Capacity',
  'registration-closed': 'Registration Closed',
  'event-completed': 'Event Completed',
  'recording-available-to-eligible-members': 'Recording Available to Eligible Members',
  'announcement-coming-soon': 'Announcement Coming Soon',
} as const;

/** Honest empty states. Each says what is absent and what to do instead. */
export const EVENT_EMPTY_STATES = {
  upcoming: {
    heading: 'No public events are scheduled yet.',
    body: 'Public sessions are announced here once their topic, speaker and date are confirmed. Nothing is listed until it is.',
  },
  membersOnly: {
    heading: 'No members-only sessions are announced yet.',
    body: "The monthly PAAIPE Members' AI Exchange runs every second Tuesday at 8:00 PM PHT. Each month's topic and guest speaker are announced when confirmed.",
  },
  past: {
    heading: 'No past public events to show yet.',
    body: 'Completed public sessions appear here, along with any recording that publication rights and speaker permissions allow.',
  },
  filtered: {
    heading: 'No events match those filters.',
    body: 'Try a broader selection or clear the filters to see everything currently listed.',
  },
} as const;

export const SPEAKERS_PAGE = {
  body: 'PAAIPE invites practitioners, leaders, researchers and builders to lead practical conversations for our growing professional community.',
  explains: [
    'What PAAIPE is',
    'The audience of Filipino professionals, entrepreneurs, educators, builders, and organizations',
    'The speaker chooses a topic aligned with their expertise and community value',
    'Every second Tuesday at 8:00 PM PHT',
    'Private Zoom',
    '20-30-minute presentation',
    'Live Q&A',
    'Raffle and close',
    'One hour maximum',
    'PAAIPE supports topic framing, session flow, promotion, and technical checks',
  ],
  process: [
    'Express interest and share expertise/topic direction.',
    'PAAIPE reviews relevance, clarity, responsible-use alignment, and scheduling.',
    'Selected speaker and PAAIPE agree on title, audience outcome, format, and date.',
    'Complete a short technical/flow check.',
    'Deliver the member session and, only with permission, approve any replay or recap.',
  ],
  cta: 'Express Interest as a Speaker',
  disclaimer:
    'Proposals are subject to review and scheduling availability. Submission does not guarantee selection.',
} as const;
