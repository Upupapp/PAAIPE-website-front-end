import type { ContentMode } from '../config/content-mode';
import type { EventSeriesRecord, PublicEventRecord, PublicSpeaker } from '../content/event-record';

/**
 * The event catalog repository, Tab 02 Step 5.
 *
 * Repository logic is kept OUT of presentation components on purpose: a card
 * that decides for itself which events are visible is a card that can disagree
 * with the page around it, and the two disagreeing is invisible until someone
 * notices a record on one screen and not another.
 *
 * The interface is async because it is the seam a future approved catalog
 * source would arrive through (`PUBLIC_EVENT_CATALOG_SOURCE`). Today the only
 * implementation reads validated build-time content and resolves immediately.
 */
export interface EventCatalogRepository {
  listApprovedEvents(): Promise<readonly PublicEventRecord[]>;
  getApprovedEventBySlug(slug: string): Promise<PublicEventRecord | null>;
  listApprovedSpeakers(): Promise<readonly PublicSpeaker[]>;
  getSeries(): Promise<readonly EventSeriesRecord[]>;
}

/**
 * What counts as publishable in a given content mode.
 *
 * `approved` always. `sample` and `draft` only in a review build. This mirrors
 * `publishable()` for the rest of the site rather than inventing a second rule
 * for events - two exclusion mechanisms is how a fixture eventually ships.
 */
export function isPublishableEvent(event: PublicEventRecord, mode: ContentMode): boolean {
  if (event.contentStatus === 'approved') return true;
  return mode === 'review';
}

/** Soonest first. An event with no confirmed schedule sorts after those with one. */
export function byStartAscending(a: PublicEventRecord, b: PublicEventRecord): number {
  if (!a.startAt && !b.startAt) return a.title.localeCompare(b.title);
  if (!a.startAt) return 1;
  if (!b.startAt) return -1;
  return Date.parse(a.startAt) - Date.parse(b.startAt);
}

/** Most recently finished first. */
export function byEndDescending(a: PublicEventRecord, b: PublicEventRecord): number {
  if (!a.endAt && !b.endAt) return a.title.localeCompare(b.title);
  if (!a.endAt) return 1;
  if (!b.endAt) return -1;
  return Date.parse(b.endAt) - Date.parse(a.endAt);
}

/**
 * NOT-YET-FINISHED, which includes cancelled — and the first version of this
 * was wrong in a way worth recording.
 *
 * It read `lifecycle === 'scheduled'`, reasoning that a cancelled event must not
 * be advertised as going ahead. True, but the conclusion did not follow: a
 * cancelled event then appeared in NEITHER list and vanished from the
 * marketplace entirely. Measured — 8 of 9 publishable records rendered. Tab 09
 * requires the opposite: "retain an approved cancelled event page with accurate
 * public status instead of silently removing it", and someone who registered
 * needs to find out it is cancelled.
 *
 * What stops it being advertised is not absence from the list; it is the card,
 * which carries "Event cancelled" and "View update" from the one resolver. The
 * event is listed, and it is listed as cancelled.
 */
export function isUpcoming(event: PublicEventRecord): boolean {
  return event.lifecycle !== 'completed';
}

export function isPast(event: PublicEventRecord): boolean {
  return event.lifecycle === 'completed';
}

export class StaticEventCatalogRepository implements EventCatalogRepository {
  /** Reads validated, approved build-time content only. */
  constructor(
    private readonly events: readonly PublicEventRecord[],
    private readonly speakers: readonly PublicSpeaker[],
    private readonly series: readonly EventSeriesRecord[],
    private readonly mode: ContentMode,
  ) {}

  private publishable(): readonly PublicEventRecord[] {
    return this.events.filter((event) => isPublishableEvent(event, this.mode));
  }

  async listApprovedEvents(): Promise<readonly PublicEventRecord[]> {
    return [...this.publishable()].sort(byStartAscending);
  }

  async getApprovedEventBySlug(slug: string): Promise<PublicEventRecord | null> {
    /*
     * Returns null for a record that exists but is not publishable, exactly as
     * it does for one that does not exist. A different answer for the two would
     * let a caller detect that a private draft is there.
     */
    return this.publishable().find((event) => event.slug === slug) ?? null;
  }

  async listApprovedSpeakers(): Promise<readonly PublicSpeaker[]> {
    // Only approved speakers, and never a portrait whose rights are unconfirmed.
    return this.speakers
      .filter((speaker) => speaker.contentStatus === 'approved')
      .map((speaker) =>
        speaker.portrait?.rightsApproved ? speaker : { ...speaker, portrait: undefined },
      );
  }

  async getSeries(): Promise<readonly EventSeriesRecord[]> {
    return this.series;
  }
}

/**
 * A legacy-shaped view of a Tab 02 record, for the detail template only.
 *
 * WHY THIS EXISTS AND WHY IT IS TEMPORARY. Tab 03 moved the marketplace to the
 * new registry, and the marketplace now lists nine records. Their detail links
 * must resolve, so `/events/[slug]` has to generate paths from the same
 * registry - but Tab 04 owns that page's design, and redesigning it here would
 * be doing Tab 04's work badly and early.
 *
 * So the paths come from the new registry and the existing template renders a
 * derived view. TWO MAPPINGS ARE LOSSY, and they are written down rather than
 * quietly chosen:
 *
 *   lifecycle 'cancelled'  -> legacy status 'postponed'. The old vocabulary has
 *       no "cancelled". `postponed` is the nearest and it is WRONG - postponed
 *       implies a new date will come. The detail page therefore takes its
 *       cancellation wording from the resolver, not from this field, and Tab 04
 *       removes the mapping with the legacy type.
 *   registration 'waitlist' and 'full' -> 'limited-capacity'. The old union has
 *       neither. The card, which reads the resolver directly, says the true
 *       thing; only the legacy badge is approximate.
 *
 * Nothing here is used by the marketplace. It exists to keep one registry while
 * the old template stands.
 */
import type { EventRegistrationState, EventStatus, PublicEvent } from '../content/types';

const LEGACY_STATUS: Record<PublicEventRecord['lifecycle'], EventStatus> = {
  scheduled: 'upcoming',
  completed: 'completed',
  cancelled: 'postponed',
};

const LEGACY_REGISTRATION: Record<
  PublicEventRecord['registration']['state'],
  EventRegistrationState
> = {
  'not-open': 'announcement-coming-soon',
  open: 'registration-open',
  waitlist: 'limited-capacity',
  full: 'limited-capacity',
  closed: 'registration-closed',
};

export function toLegacyEvent(record: PublicEventRecord): PublicEvent {
  return {
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    visibility: record.access,
    contentStatus: record.contentStatus,
    date: record.startAt?.slice(0, 10),
    timeZone: record.timeZone,
    format: record.format,
    duration: record.durationMinutes ? `${record.durationMinutes} minutes` : undefined,
    publicAgenda: record.publicAgenda.map((item) => item.label),
    status: LEGACY_STATUS[record.lifecycle],
    registrationState:
      record.access === 'members-only' && record.registration.state === 'not-open'
        ? 'members-only'
        : LEGACY_REGISTRATION[record.registration.state],
    image: {
      kind: 'file',
      src: record.media.src,
      alt: record.media.alt,
      width: record.media.width,
      height: record.media.height,
    },
  };
}
