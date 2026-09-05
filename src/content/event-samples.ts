import type { PublicEventRecord } from './event-record';

/**
 * Review-only event records, Tab 02 Step 6 — one per interface state.
 *
 * EVERY RECORD IS `sample`, which is the repository's existing exclusion
 * mechanism: `publishable()` drops them in production content mode, and
 * `verify:leak` builds BOTH modes and asserts none of this reaches production
 * output. That is the same route the resource fixtures already take, so there is
 * one exclusion rule rather than a second one invented for events.
 *
 * NOTHING HERE IS A CLAIM. The titles are the three the command permits, the
 * organisations and speakers are absent rather than invented, and the dates are
 * illustrative. They exist so a reviewer can SEE waitlist, full, cancelled and
 * the rest without PAAIPE having to announce a real event first.
 *
 * They are deterministic: no `new Date()`, no randomness. A fixture that moves
 * on its own turns a visual review into a moving target and a failing test into
 * a mystery.
 */
const base = {
  schemaVersion: 1,
  contentStatus: 'sample',
  timeZone: 'Asia/Manila',
  format: 'online',
  formatLabel: 'Online · Private Zoom',
  learningOutcomes: [],
  audience: ['Filipino professionals exploring practical AI'],
  speakerIds: [],
  topicTags: ['Practical adoption'],
  faqs: [],
  relatedSlugs: [],
  featured: false,
  media: {
    src: '/media/generated/covers/paaipe-ai-exchange.svg',
    width: 1200,
    height: 675,
    alt: '',
    rightsApproved: true,
  },
} as const;

/*
 * EACH TITLE CARRIES ITS STATE IN PARENTHESES, and that is not decoration.
 *
 * The three illustrative titles the command permits are reused across eight
 * fixtures, so several records shared a title - and a shared title means a
 * duplicate <title> element, which the SEO gate correctly refuses. It is also
 * useless to a reviewer looking at eight cards trying to tell which is which.
 * The permitted title is kept; the state is what makes it unique.
 */

/** 14:00-15:00 is sixty minutes; every record below states that explicitly. */
const SIXTY = 60;

function policy(
  state: PublicEventRecord['registration']['state'],
  options: { members?: boolean; waitlist?: boolean } = {},
): PublicEventRecord['registration'] {
  return {
    mode: 'email',
    state,
    requiresVerifiedMembership: options.members ?? false,
    waitlistEnabled: options.waitlist ?? false,
    showCapacity: false,
    privacyNoticeVersion: 'draft-2026-09',
    eventVersion: 'sample@1',
  };
}

export const EVENT_SAMPLES: readonly PublicEventRecord[] = [
  {
    ...base,
    id: 'sample-public-open',
    slug: 'sample-public-open',
    title: 'Practical AI for Everyday Work (open)',
    excerpt: 'An illustrative public session used to review the open-registration state.',
    description: [
      'An illustrative record. It exists to review an interface state, not to announce a session.',
    ],
    type: 'workshop',
    access: 'public',
    lifecycle: 'scheduled',
    startAt: '2026-10-14T14:00:00+08:00',
    endAt: '2026-10-14T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Working session' }, { label: 'Questions' }],
    registration: policy('open'),
    seo: { title: 'Practical AI for Everyday Work', description: 'Illustrative preview.' },
  },
  {
    ...base,
    id: 'sample-members-open',
    slug: 'sample-members-open',
    title: 'Responsible AI for Teams (members)',
    excerpt: 'An illustrative members-only session used to review member registration.',
    description: ['An illustrative record used to review the members-only journey.'],
    type: 'roundtable',
    access: 'members-only',
    lifecycle: 'scheduled',
    startAt: '2026-10-21T14:00:00+08:00',
    endAt: '2026-10-21T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Discussion' }],
    registration: policy('open', { members: true }),
    seo: { title: 'Responsible AI for Teams', description: 'Illustrative preview.' },
  },
  {
    ...base,
    id: 'sample-waitlist',
    slug: 'sample-waitlist',
    title: 'AI Opportunities for Filipino Businesses (waitlist)',
    excerpt: 'An illustrative session used to review the waitlist state.',
    description: ['An illustrative record used to review the waitlist journey.'],
    type: 'briefing',
    access: 'public',
    lifecycle: 'scheduled',
    startAt: '2026-10-28T14:00:00+08:00',
    endAt: '2026-10-28T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Briefing' }],
    registration: policy('waitlist', { waitlist: true }),
    seo: {
      title: 'AI Opportunities for Filipino Businesses',
      description: 'Illustrative preview.',
    },
  },
  {
    ...base,
    id: 'sample-full',
    slug: 'sample-full',
    title: 'Practical AI for Everyday Work (full)',
    excerpt: 'An illustrative session used to review the full state with no waitlist.',
    description: ['An illustrative record used to review a full event that takes no waitlist.'],
    type: 'workshop',
    access: 'public',
    lifecycle: 'scheduled',
    startAt: '2026-11-04T14:00:00+08:00',
    endAt: '2026-11-04T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Working session' }],
    registration: policy('full'),
    seo: { title: 'Practical AI for Everyday Work', description: 'Illustrative preview.' },
  },
  {
    ...base,
    id: 'sample-not-open',
    slug: 'sample-not-open',
    title: 'Responsible AI for Teams (not open)',
    excerpt: 'An illustrative session used to review the not-yet-open state.',
    description: [
      'An illustrative record used to review an event whose registration has not opened.',
    ],
    type: 'roundtable',
    access: 'public',
    lifecycle: 'scheduled',
    startAt: '2026-11-11T14:00:00+08:00',
    endAt: '2026-11-11T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Discussion' }],
    registration: policy('not-open'),
    seo: { title: 'Responsible AI for Teams', description: 'Illustrative preview.' },
  },
  {
    ...base,
    id: 'sample-closed',
    slug: 'sample-closed',
    title: 'AI Opportunities for Filipino Businesses (closed)',
    excerpt: 'An illustrative session used to review the closed state.',
    description: [
      'An illustrative record used to review an event that has stopped accepting registrations.',
    ],
    type: 'briefing',
    access: 'public',
    lifecycle: 'scheduled',
    startAt: '2026-11-18T14:00:00+08:00',
    endAt: '2026-11-18T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Briefing' }],
    registration: policy('closed'),
    seo: {
      title: 'AI Opportunities for Filipino Businesses',
      description: 'Illustrative preview.',
    },
  },
  {
    ...base,
    id: 'sample-cancelled',
    slug: 'sample-cancelled',
    title: 'Practical AI for Everyday Work (cancelled)',
    excerpt: 'An illustrative session used to review the cancellation state.',
    description: [
      'An illustrative record used to review a cancelled event. No replacement date is shown.',
    ],
    type: 'workshop',
    access: 'public',
    lifecycle: 'cancelled',
    startAt: '2026-11-25T14:00:00+08:00',
    endAt: '2026-11-25T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }],
    // The schema refuses `open` or `waitlist` on a cancelled event.
    registration: policy('closed'),
    seo: { title: 'Practical AI for Everyday Work', description: 'Illustrative preview.' },
  },
  {
    ...base,
    id: 'sample-completed',
    slug: 'sample-completed',
    title: 'Responsible AI for Teams (completed)',
    excerpt: 'An illustrative session used to review the completed state.',
    description: [
      'An illustrative record used to review a finished event. No recording is implied.',
    ],
    type: 'roundtable',
    access: 'public',
    lifecycle: 'completed',
    startAt: '2026-08-12T14:00:00+08:00',
    endAt: '2026-08-12T15:00:00+08:00',
    durationMinutes: SIXTY,
    publicAgenda: [{ label: 'Opening' }, { label: 'Discussion' }],
    registration: policy('closed'),
    seo: { title: 'Responsible AI for Teams', description: 'Illustrative preview.' },
  },
];
