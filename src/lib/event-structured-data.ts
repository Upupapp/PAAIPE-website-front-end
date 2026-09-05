/**
 * Schema.org `Event` JSON-LD, Tab 09.
 *
 * WHAT THIS IS NOT. It is not a bid for a Google rich result. PAAIPE's events
 * are virtual, and mostly private or member-gated, which Google's Event
 * experience does not cover; its listed regional availability does not include
 * the Philippines either. The command is explicit that a validator showing "no
 * eligible enhancement" is the correct outcome and not a defect. This markup
 * exists for semantic interoperability - a calendar, a reader, an aggregator
 * that understands Schema.org - and nothing in this repository may claim
 * otherwise. `docs/events/seo-and-indexing.md` says so in prose, and a test
 * asserts no file promises a carousel or a rich card.
 *
 * IT IS GENERATED FROM THE SAME RECORD THE PAGE RENDERS. Not from a parallel
 * description of the event, which is how markup and page drift apart and how a
 * search engine ends up being told something no reader can see.
 *
 * FOUR GATES, and each removes a way of publishing something untrue:
 *
 *   approved      - a sample or draft is not an event; marking one up puts a
 *                   fabricated listing into a machine-readable index.
 *   public        - a members-only session is not open, and announcing it as
 *                   though it were invites people who cannot attend.
 *   dated         - `startDate` is required by the vocabulary, and an event
 *                   with no confirmed date has no honest value for it.
 *   absolute URL  - `location.url`, `url` and `organizer.url` must be absolute.
 *                   With no `PUBLIC_SITE_URL` configured (owner item B-7) there
 *                   is no origin to build them from, and a guessed one would
 *                   point a machine at a site nobody owns.
 *
 * Any gate failing returns `null`, and the page emits nothing. That is the
 * honest degradation the rest of this portal already uses for canonicals and
 * the sitemap: the machinery is complete and silent until its inputs exist.
 */
import type { PublicEventRecord, PublicSpeaker } from '../content/event-record';

/** The approved organisation name, in full. Never an abbreviation. */
export const ORGANIZER_NAME = 'Philippine Association of AI Professionals and Entrepreneurs';

const ATTENDANCE_MODE = {
  online: 'https://schema.org/OnlineEventAttendanceMode',
  hybrid: 'https://schema.org/MixedEventAttendanceMode',
  'in-person': 'https://schema.org/OfflineEventAttendanceMode',
} as const;

/**
 * Lifecycle to `eventStatus`.
 *
 * A RESCHEDULED EVENT IS `EventRescheduled`, NOT `EventScheduled`. It is still
 * going ahead, so the lifecycle alone would say "scheduled" and the markup would
 * lose the one fact a subscriber most needs - that the time they already have is
 * wrong. `scheduleUpdatedAt` is what distinguishes them.
 *
 * There is deliberately no `EventPostponed`. This model has no postponed
 * lifecycle: an event is scheduled, cancelled or completed. The legacy mapping
 * that Tab 04 deleted turned `cancelled` into `postponed`, which told a reader a
 * new date was coming when none was.
 */
function eventStatus(event: PublicEventRecord): string {
  if (event.lifecycle === 'cancelled') return 'https://schema.org/EventCancelled';
  if (event.scheduleUpdatedAt) return 'https://schema.org/EventRescheduled';
  return 'https://schema.org/EventScheduled';
}

export interface StructuredDataContext {
  /** Absolute site origin, or undefined while owner item B-7 is open. */
  origin?: string;
  speakers?: readonly PublicSpeaker[];
}

export function eventRecordStructuredData(
  event: PublicEventRecord,
  context: StructuredDataContext = {},
): Record<string, unknown> | null {
  if (event.contentStatus !== 'approved') return null;
  if (event.access !== 'public') return null;
  if (!event.startAt) return null;

  const origin = context.origin?.replace(/\/$/, '');
  if (!origin) return null;

  const url = `${origin}/events/${event.slug}`;

  /*
   * ONLY AN ONLINE EVENT GETS A VirtualLocation, and everything else gets no
   * markup at all.
   *
   * The first draft of this used VirtualLocation for every format, which would
   * have described an in-person session in Manila as taking place at a URL. The
   * record carries no street address - `formatLabel` is a display string like
   * "Online · Private Zoom", not structured data - so there is nothing honest to
   * put in a `Place`, and inventing one is worse than emitting nothing.
   *
   * The virtual URL is the PUBLIC EVENT PAGE, never the meeting. The record has
   * no link, id or passcode to leak, but the rule is stated because this is the
   * single field where a future edit would be most tempting and most damaging.
   */
  if (event.format !== 'online') return null;
  const location = { '@type': 'VirtualLocation', url };

  /* Only a speaker PAAIPE has approved, and only with a usable name. */
  const performers = (context.speakers ?? [])
    .filter((speaker) => event.speakerIds.includes(speaker.id))
    .filter((speaker) => speaker.contentStatus === 'approved')
    .map((speaker) => ({ '@type': 'Person', name: speaker.name }));

  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.seo.description || event.excerpt,
    startDate: event.startAt,
    eventStatus: eventStatus(event),
    eventAttendanceMode: ATTENDANCE_MODE[event.format],
    location,
    organizer: { '@type': 'Organization', name: ORGANIZER_NAME, url: origin },
    url,
  };

  if (event.endAt) data.endDate = event.endAt;
  if (performers.length > 0) data.performer = performers;

  /*
   * An image only when its RIGHTS are approved, not merely when a file exists.
   * The question is never whether PAAIPE has the picture; it is whether PAAIPE
   * may publish it.
   */
  if (event.media.rightsApproved && event.media.src) {
    data.image = [
      event.media.src.startsWith('http') ? event.media.src : `${origin}${event.media.src}`,
    ];
  }

  /*
   * NO `offers`, NO `remainingAttendeeCapacity`, NO `maximumAttendeeCapacity`.
   * The command forbids them without approved real data, and this frontend has
   * none: `showCapacity` is the literal `false` in the type, so a seat count
   * cannot exist to publish. Absent is the honest value; zero would be a claim.
   */

  return data;
}
