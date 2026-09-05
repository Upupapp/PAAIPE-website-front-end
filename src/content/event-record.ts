/**
 * The Events Continuation event domain model (Tab 02).
 *
 * ONE SOURCE OF TRUTH. Cards, detail pages, registration availability, metadata
 * and tests all derive from a record validated here, so page copy cannot drift
 * from the data it claims to describe.
 *
 * WHY THE TYPES ARE SHAPED THIS WAY. The command asks that "impossible
 * combinations are rejected before rendering". Two axes do most of that work:
 *
 *   - LIFECYCLE and REGISTRATION are separate. A cancelled event still has a
 *     registration field, and the pair is what decides the interface. Collapsing
 *     them into one enum is how "cancelled but the form is still up" happens.
 *   - ACCESS and requiresVerifiedMembership are cross-checked. `members-only`
 *     with `requiresVerifiedMembership: false` is a members-only event anyone can
 *     register for, which is the failure nobody notices until someone joins.
 *
 * PRIVATE FIELDS ARE ABSENT FROM THE TYPE, not merely undocumented. There is no
 * `zoomUrl`, no `meetingId`, no `attendees`. A field that does not exist cannot
 * be populated by a well-meaning edit, cannot be serialised into JSON-LD, and
 * cannot leak into a bundle. `.strict()` then rejects it if someone adds it to a
 * record anyway. `scripts/verify-event-boundary.mjs` is the third line: it reads
 * the BUILD, because a value can reach an artifact without any source file
 * naming the field.
 */
export type ContentStatus = 'approved' | 'draft' | 'sample';
export type EventAccess = 'public' | 'members-only';
export type EventType =
  'ai-exchange' | 'workshop' | 'briefing' | 'roundtable' | 'collaborative-session';
export type EventFormat = 'online' | 'in-person' | 'hybrid';
export type EventLifecycle = 'scheduled' | 'cancelled' | 'completed';
export type RegistrationState = 'not-open' | 'open' | 'waitlist' | 'full' | 'closed';

/** An image with its rights position recorded, because the rights ARE the gate. */
export interface EventImage {
  src: string;
  width: number;
  height: number;
  /** Empty string is a deliberate decorative choice, never an oversight. */
  alt: string;
  credit?: string;
  rightsApproved: boolean;
}

export interface PublicSpeaker {
  id: string;
  contentStatus: ContentStatus;
  name: string;
  role?: string;
  organization?: string;
  shortBio?: string;
  portrait?: EventImage;
  profileUrl?: string;
}

export interface AgendaItem {
  label: string;
  detail?: string;
}

export interface EventFaq {
  question: string;
  answer: string;
}

export interface EventSeo {
  title: string;
  description: string;
}

export interface RegistrationPolicy {
  mode: 'email';
  state: RegistrationState;
  opensAt?: string;
  closesAt?: string;
  requiresVerifiedMembership: boolean;
  waitlistEnabled: boolean;
  /**
   * Literal `false` in the type, not a boolean.
   *
   * Tab 03: "Do not show seats remaining unless a future approved backend
   * supplies a verified public number. For this release, showCapacity remains
   * false." Typing it as `boolean` would make turning it on a one-character
   * edit that no reviewer would question; typing it as `false` makes turning it
   * on a deliberate change to this file, which is what it should be.
   */
  showCapacity: false;
  /** Identifies the approved notice copy a registrant was shown. */
  privacyNoticeVersion: string;
  /** Travels with a registration so a stale submission can be refused. */
  eventVersion: string;
}

/*
 * The array fields below are `readonly`.
 *
 * Content is read, never mutated - and the sample registry spreads one shared
 * `base` object into eight records, so a mutable empty array would be the SAME
 * array in all eight. A single `.push()` anywhere would silently appear in
 * records nobody touched, which is the kind of bug that gets blamed on the
 * renderer.
 */
export interface PublicEventRecord {
  schemaVersion: 1;
  id: string;
  slug: string;
  seriesId?: string;
  title: string;
  eyebrow?: string;
  excerpt: string;
  description: readonly string[];
  contentStatus: ContentStatus;
  type: EventType;
  access: EventAccess;
  format: EventFormat;
  lifecycle: EventLifecycle;
  /** Concrete ISO timestamps with the +08:00 offset. Never a placeholder. */
  startAt?: string;
  endAt?: string;
  timeZone: 'Asia/Manila';
  durationMinutes?: number;
  formatLabel: string;
  publicAgenda: readonly AgendaItem[];
  learningOutcomes: readonly string[];
  audience: readonly string[];
  speakerIds: readonly string[];
  topicTags: readonly string[];
  registration: RegistrationPolicy;
  media: EventImage;
  faqs: readonly EventFaq[];
  relatedSlugs: readonly string[];
  featured: boolean;
  seo: EventSeo;
  publishedAt?: string;
  updatedAt?: string;
}

/** A recurring series is NOT an event. It has no date and cannot be registered for. */
export interface EventSeriesRecord {
  id: string;
  title: string;
  positioning: string;
  description: string;
  cadence: string;
  time: string;
  format: string;
  duration: string;
  agenda: readonly string[];
  launch: string;
}

/** Shown in place of a speaker nobody has approved. Never a stock face. */
export const SPEAKER_PENDING = {
  heading: 'Speaker details coming soon',
  body: 'The confirmed speaker profile will appear here after approval.',
} as const;

/** The label every non-approved record carries in a review build. */
export const ILLUSTRATIVE_LABEL = 'Illustrative preview - not an announced event.';
