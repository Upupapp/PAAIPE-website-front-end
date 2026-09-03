/**
 * Event partitioning and public-field selection.
 *
 * Pure functions, so the rules that decide what a visitor may see are testable
 * without a browser. The important one is `publicEventFields`: it builds the
 * object a template renders from, so a members-only session cannot leak a field
 * by a template forgetting to omit it - the field never reaches the template.
 */
import type { PublicEvent, ResourceTopic } from '../content/types';

export type EventSection = 'upcoming' | 'members-only' | 'past';

export function sectionOf(event: PublicEvent): EventSection {
  if (event.status === 'completed') return 'past';
  if (event.visibility === 'members-only') return 'members-only';
  return 'upcoming';
}

export function partition(events: readonly PublicEvent[]): Record<EventSection, PublicEvent[]> {
  const buckets: Record<EventSection, PublicEvent[]> = {
    upcoming: [],
    'members-only': [],
    past: [],
  };
  for (const event of events) buckets[sectionOf(event)].push(event);
  return buckets;
}

/**
 * Exactly what a PUBLIC visitor may see for an event.
 *
 * For a members-only session this is title, teaser, category, date and the
 * public agenda - nothing else. `registrationHref` is present only for a public
 * event with a configured destination, so a private session has no field that
 * could hold a meeting URL even if a template asked for one.
 */
export interface PublicEventView {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date?: string;
  timeZone: string;
  publicAgenda: string[];
  locked: boolean;
  /** Public events only. */
  format?: string;
  duration?: string;
  description?: string;
  speakerName?: string;
  speakerTitle?: string;
}

export function publicEventFields(event: PublicEvent): PublicEventView {
  const base: PublicEventView = {
    slug: event.slug,
    title: event.title,
    excerpt: event.excerpt,
    category: event.format,
    date: event.date,
    timeZone: event.timeZone,
    publicAgenda: [...event.publicAgenda],
    locked: event.visibility === 'members-only',
  };

  if (base.locked) return base;

  return {
    ...base,
    format: event.format,
    duration: event.duration,
    description: event.excerpt,
    speakerName: event.approvedSpeaker?.name,
    speakerTitle: event.approvedSpeaker?.title,
  };
}

/**
 * JSON-LD for an event, or null.
 *
 * Structured data is emitted ONLY for a real, approved, public event with a
 * confirmed date. A sample, a draft, a members-only session or an event with no
 * date produces nothing - marking up an event that does not exist would put a
 * fabricated listing into search results.
 */
export function eventStructuredData(event: PublicEvent): Record<string, unknown> | null {
  if (event.contentStatus !== 'approved') return null;
  if (event.visibility !== 'public') return null;
  if (!event.date) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.excerpt,
    startDate: event.date,
    eventAttendanceMode:
      event.format === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : event.format === 'hybrid'
          ? 'https://schema.org/MixedEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus:
      event.status === 'postponed'
        ? 'https://schema.org/EventPostponed'
        : 'https://schema.org/EventScheduled',
  };
}

/** Topics available as filters, derived from what is actually listed. */
export function topicsOf(events: readonly PublicEvent[]): string[] {
  return [...new Set(events.map((event) => event.format))].sort();
}

export type { ResourceTopic };
