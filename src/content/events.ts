import { AUDIENCES, SIGNATURE_EVENT } from './organization';
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
 *  - uses `announcement-coming-soon`, whose LABEL is now "Date Not Announced";
 *    the key is the state, and the state is still that no date exists;
 *  - is `members-only`, so it can never advertise open public registration;
 *  - is `sample`, so it is stripped from a production build.
 *
 * The publicly stated recurrence, time and agenda ARE approved, so they are
 * carried faithfully. No meeting URL, meeting ID or passcode exists anywhere.
 */
export const EVENTS: readonly PublicEvent[] = [
  {
    slug: 'paaipe-ai-exchange',
    title: 'PAAIPE AI Exchange',
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
    image: {
      kind: 'file',
      src: '/media/generated/covers/paaipe-ai-exchange.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
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
  /*
   * NOT "will be announced soon", for the same reason the
   * `announcement-coming-soon` badge no longer says "Coming Soon": "soon" is a
   * claim about timing PAAIPE has not established. It was the more visible of
   * the two - the badge sits on a detail page, this sentence is on the /events
   * hero - and changing one while leaving the other would have left the page
   * making the promise in the larger type.
   *
   * This says where the announcement will appear, which is a fact, instead of
   * when it will happen, which is not.
   */
  heading: 'The next topic and guest speaker are announced on this page.',
  copy: 'PAAIPE AI Exchange takes place every second Tuesday at 8:00 PM PHT.',
} as const;

export const EVENTS_INDEX = {
  intro:
    'PAAIPE events connect the community with practitioners, leaders and subject-matter experts through focused presentations, honest questions and meaningful professional exchange.',
  /**
   * How the page is divided, stated before a visitor scrolls.
   *
   * The page had four event types and seven registration labels and no sentence
   * telling a first-time reader which sessions were for them. Peer bodies solve
   * this with filters or tabs; a static page can solve it with a sentence.
   * Asserts nothing beyond what the approved label set already asserts.
   */
  audiences:
    'Two kinds of session appear on this page. Public sessions are open to everyone. Members\u2019 sessions are open to verified PAAIPE members.',
} as const;

export const SIGNATURE_SERIES = {
  label: 'SIGNATURE MONTHLY EVENT',
  title: 'PAAIPE AI Exchange',
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
  heading: 'This session is for PAAIPE members',
  /*
   * Says what a non-member DOES get, before saying what they do not.
   *
   * The panel previously offered two external handoffs and nothing else. Both
   * are unconfigured (owner item B-4), so both render an unavailable state, and
   * a reader who was not already a member met two dead controls and no way
   * onward. NPC Advisory 2023-01 names ASYMMETRIC EFFORT - the organisation's
   * preferred path easy, every alternative tedious or absent - as a deceptive
   * design pattern, and NN/g's login-wall research is that a wall placed before
   * any value is abandoned rather than climbed.
   *
   * So the panel now states the basis on which someone can actually decide, and
   * carries a route that WORKS regardless of what the owner has configured.
   */
  body: 'What you can see above - the topic, the format and who the session is for - is everything PAAIPE publishes openly, and it is meant to be enough to decide on. The date, the speaker and the joining link go to members.',
  terms:
    'Membership cost, terms and everything else it covers are set out in full on the membership page, so you can weigh it before joining rather than after.',
  membershipCta: 'Read the membership terms',
  membershipHref: '/membership',
  /*
   * Equally prominent, and deliberately not a smaller or greyer control: this
   * is the path for a reader who is not ready to join, and making it harder to
   * find than the join path is the pattern the advisory prohibits. `/contact`
   * is an internal route that exists and works today.
   */
  askCta: 'Ask us a question first',
  askHref: '/contact',
  applyCta: 'Apply for Membership',
  signInCta: 'Member Sign In',
} as const;

/**
 * Human labels for the three event formats.
 *
 * `format` is a machine value - `online`, `in-person`, `hybrid` - and it was
 * being rendered straight into the page. A visitor saw "Format: online",
 * lowercase, next to properly-written fields like "To be announced". A closed
 * union that reaches the screen needs a label map; this is the same pattern
 * REGISTRATION_STATE_LABELS already uses, it was just never applied here.
 */
export const EVENT_FORMAT_LABELS = {
  online: 'Online',
  'in-person': 'In person',
  hybrid: 'Hybrid',
} as const;

/**
 * Human label for the time zone.
 *
 * `Asia/Manila` is an IANA identifier - correct in a `datetime` attribute and
 * meaningless to a reader. The approved copy already says "8:00 PM PHT" and
 * "Philippine Time" elsewhere, so this matches strings PAAIPE has approved
 * rather than inventing a new way to say it.
 */
export const TIME_ZONE_LABELS = {
  'Asia/Manila': 'Philippine Time (PHT)',
} as const;

/** Human labels for the seven approved registration states. */
export const REGISTRATION_STATE_LABELS = {
  'registration-open': 'Registration Open',
  'members-only': 'Members Only',
  'limited-capacity': 'Limited Capacity',
  'registration-closed': 'Registration Closed',
  'event-completed': 'Event Completed',
  'recording-available-to-eligible-members': 'Recording Available to Eligible Members',
  /*
   * NOT "Announcement Coming Soon". "Soon" is a claim about timing that PAAIPE
   * has not established and cannot keep - the FTC's dark-patterns report treats
   * a timing signal unsupported by a timing fact as creating a misleading
   * impression, and NPC Advisory 2023-01, which binds PAAIPE directly as a
   * personal information controller, names misleading information as a
   * content-based deceptive pattern. GOV.UK's rule is to trail a change only
   * when it is "certain or very likely to happen".
   *
   * This states the fact instead. It promises no date, and it does not age.
   * Title Case to match the six labels beside it.
   */
  'announcement-coming-soon': 'Date Not Announced',
} as const;

/** Honest empty states. Each says what is absent and what to do instead. */
/**
 * The cadence, composed from the approved constant rather than retyped.
 *
 * It appears in several strings on this page. Written out by hand each time, a
 * change to the schedule would leave some of them stale and nothing would fail
 * - the sentences would simply disagree with each other. Composed, they cannot.
 */
/*
 * Only the FIRST letter is lowered, not the whole string.
 *
 * `.toLowerCase()` on the approved "Every second Tuesday" produced "every
 * second tuesday" — it de-capitalised a day of the week, which is a proper
 * noun. The sentence needs a lowercase opening because the phrase sits
 * mid-sentence; it does not need the rest of it flattened.
 */
const lowerFirst = (value: string) => value.charAt(0).toLowerCase() + value.slice(1);

const CADENCE = `${lowerFirst(SIGNATURE_EVENT.recurrence)} at ${SIGNATURE_EVENT.time}`;

export const EVENT_EMPTY_STATES = {
  upcoming: {
    /*
     * A positive statement of what the space is FOR, not a negation of what is
     * absent - IBM Carbon's empty-state anatomy. "No public events are
     * scheduled yet" tells a reader what they already worked out from the empty
     * list; this tells them what will appear and that the list is maintained.
     */
    heading: 'Public events will be listed here',
    /*
     * The empty state is the PRIMARY state of this page, and it was a dead end.
     * An empty state should do three things - say what the status is, teach
     * what would fill it, and offer a way onward (Nielsen Norman Group, 2021).
     * The first two were here; the third was not, and the page never mentioned
     * the members' cadence that already runs.
     */
    body: `A public session appears here once its topic, speaker and date are confirmed. Nothing is listed until it is. In the meantime, PAAIPE members meet ${CADENCE} for the ${SIGNATURE_EVENT.title}.`,
    /*
     * `/programs` rather than `/membership`, and the destination was CHECKED:
     * /programs renders "PAAIPE programs" and "Programs in detail" with real
     * content, so the reader who follows this lands on something.
     *
     * `/resources` was the other candidate and is REJECTED: it currently says
     * "No resources are published yet." Sending a reader from an empty list to
     * an empty list is the same hollow promise this empty state exists to
     * avoid, and it would have been invisible to anyone reading only the copy.
     */
    action: 'See what PAAIPE runs',
    actionHref: '/programs',
  },
  membersOnly: {
    heading: 'Member sessions are previewed here',
    body: `The monthly ${SIGNATURE_EVENT.title} runs ${CADENCE}. Each month\u2019s topic and guest speaker are announced when confirmed.`,
    /*
     * Deliberately says nothing about HOW a member hears about a session. This
     * is a static site with no mailing list, so "you will be notified" would
     * describe a mechanism that does not exist.
     */
    access: 'Members\u2019 sessions are open to verified PAAIPE members.',
    action: 'See how to join',
    actionHref: '/membership',
  },
  past: {
    heading: 'Past public events will be archived here',
    /*
     * Active voice, and it names who decides. The previous wording - "any
     * recording that publication rights and speaker permissions allow" - made
     * the same commitment in the passive, which reads as procedure rather than
     * as a promise someone is keeping.
     */
    body: 'Completed public sessions appear here. We publish a recording only when the speaker has agreed and we hold the rights to do so.',
  },
  filtered: {
    heading: 'No events match those filters.',
    body: 'Try a broader selection or clear the filters to see everything currently listed.',
  },
} as const;

/**
 * What a members-only detail page can offer a NON-member.
 *
 * Every line restates a fact already approved - the format, the agenda, the
 * audiences - so the page describes what a session IS without promising
 * anything about a session that has not been announced. Composed from the
 * approved constants, not retyped.
 */
export const EVENT_DETAIL_BLOCKS = {
  format: {
    heading: 'What happens in this session',
    body: `Each session runs for one hour on a private Zoom call. It opens, a guest speaker presents for 20 to 30 minutes, members ask questions live, and the session closes with a raffle.`,
  },
  audience: {
    heading: 'Who this is for',
    intro: 'PAAIPE members:',
    /** The approved audience list, reused rather than paraphrased. */
    items: AUDIENCES,
  },
  afterwards: {
    heading: 'After the session',
    body: 'We publish a recording only when the speaker has agreed and we hold the rights to do so. Anything cleared for publication appears under past events.',
  },
  /**
   * A real destination: `/speakers` is the proposal page and it explains how
   * proposals are reviewed. The submission control on it is disabled with a
   * visible reason until a destination is configured (B-4), which is honest -
   * a link to a page that explains the process is not a promise to accept one.
   */
  propose: {
    label: 'Suggest a topic or a speaker for a future session',
    href: '/speakers',
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
