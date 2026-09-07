import type { PublicEventRecord } from './event-record';
import { AI_EXCHANGE_SERIES } from './event-series';

/**
 * The real event registry.
 *
 * ONE RECORD, and it is `sample`, because PAAIPE has approved no event
 * instance. That is the honest state and the whole site is built to render it:
 * a sample record never reaches a production route, sitemap, feed or schema.
 *
 * IT CARRIES NO DATE. The series recurs on the second Tuesday, but a recurrence
 * is not an announcement - nobody has confirmed which second Tuesday, or the
 * speaker. Inventing `startAt` to make the page look finished would publish a
 * commitment nobody made, and the schema would accept it, which is exactly why
 * the rule against it is written down rather than left to judgement.
 *
 * Registration is `not-open` for the same reason. The schema refuses `open` on
 * an event with no schedule.
 */
export const EVENT_RECORDS: readonly PublicEventRecord[] = [
  {
    schemaVersion: 1,
    id: 'paaipe-ai-exchange',
    slug: 'paaipe-ai-exchange',
    seriesId: AI_EXCHANGE_SERIES.id,
    title: AI_EXCHANGE_SERIES.title,
    eyebrow: 'MONTHLY EVENT SERIES',
    excerpt:
      'A private monthly Zoom session for the PAAIPE community. Each session features a guest speaker and a topic chosen around their expertise.',
    description: [
      AI_EXCHANGE_SERIES.description,
      'Sessions are held on Zoom and run for no more than one hour, so the conversation stays focused and the time is easy to commit to.',
    ],
    contentStatus: 'sample',
    type: 'ai-exchange',
    access: 'members-only',
    format: 'online',
    lifecycle: 'scheduled',
    timeZone: 'Asia/Manila',
    formatLabel: 'Online · Private Zoom',
    publicAgenda: AI_EXCHANGE_SERIES.agenda.map((label) => ({ label })),
    learningOutcomes: [],
    audience: [
      'Filipino professionals working with or around AI',
      'Founders and entrepreneurs weighing where AI fits',
      'Educators, researchers and builders',
    ],
    speakerIds: [],
    topicTags: ['Practical adoption', 'Responsible AI'],
    registration: {
      mode: 'email',
      state: 'not-open',
      requiresVerifiedMembership: true,
      waitlistEnabled: false,
      showCapacity: false,
      privacyNoticeVersion: 'draft-2026-09-04',
      eventVersion: 1,
    },
    media: {
      src: '/media/generated/covers/paaipe-ai-exchange.svg',
      width: 1200,
      height: 675,
      /* Abstract brand art depicting nothing, so an empty alt is correct. */
      alt: '',
      rightsApproved: true,
    },
    faqs: [],
    relatedSlugs: [],
    featured: true,
    seo: {
      title: 'PAAIPE AI Exchange - PAAIPE Events',
      description:
        'A private monthly Zoom session for the PAAIPE community, with a guest speaker and a topic chosen around their expertise.',
    },
  },
];
