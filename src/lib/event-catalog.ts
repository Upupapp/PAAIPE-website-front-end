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
 * Upcoming means SCHEDULED, not "has a future date".
 *
 * A cancelled event may still hold a future timestamp - it was going to happen.
 * Sorting it into "upcoming" would advertise a session that is not going ahead,
 * which is the single most expensive thing this page could get wrong.
 */
export function isUpcoming(event: PublicEventRecord): boolean {
  return event.lifecycle === 'scheduled';
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
