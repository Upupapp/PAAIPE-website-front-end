import type { PublicEventRecord } from '../content/event-record';
import { REGISTRATION_UNAVAILABLE_MESSAGE } from '../config/event-config';

/**
 * ONE resolver for what an event offers a visitor.
 *
 * Tab 03 needs it for card actions; Tab 06 formalises it for detail pages,
 * registration routes and sticky bars. Writing it once now is the point: the
 * command's rule is that "components must not reproduce conditional state logic
 * independently", and the failure it prevents is a card saying "Register" beside
 * a detail page saying "Registration closed" — two screens disagreeing about one
 * event, each correct by its own logic.
 */
export type EventActionKind = 'register' | 'waitlist' | 'view' | 'refresh' | 'none';

export interface EventActionModel {
  badge: string;
  heading?: string;
  message?: string;
  action: EventActionKind;
  actionLabel?: string;
  formEnabled: boolean;
  memberCheckRequired: boolean;
  tone: 'default' | 'info' | 'warning' | 'critical' | 'complete';
}

export type RegistrationService = 'available' | 'unavailable';

/** Human labels for the five registration states. Never a bare machine value. */
export const REGISTRATION_BADGES = {
  'not-open': 'Registration opens soon',
  open: 'Registration open',
  waitlist: 'Waitlist open',
  full: 'Event full',
  closed: 'Registration closed',
} as const;

export const ACCESS_LABELS = {
  public: 'Open to everyone',
  'members-only': 'Verified members only',
} as const;

export const FORMAT_LABELS = {
  online: 'Online',
  'in-person': 'In person',
  hybrid: 'Hybrid',
} as const;

/**
 * Lifecycle is checked BEFORE registration state, always.
 *
 * A cancelled event may still carry `registration.state` from before it was
 * called off. Reading registration first would offer a place on a session that
 * is not happening — the single most expensive thing these pages can get wrong.
 * The schema already refuses `open` on a cancelled record; this is the second
 * line, because a resolver that depends on the schema having been right is a
 * resolver that fails the day a record arrives from somewhere else.
 */
export function resolveEventAction(
  event: PublicEventRecord,
  registrationService: RegistrationService,
): EventActionModel {
  const memberCheckRequired = event.registration.requiresVerifiedMembership;

  if (event.lifecycle === 'cancelled') {
    return {
      badge: 'Event cancelled',
      heading: 'Event cancelled',
      message:
        'This event has been cancelled. Registered participants will receive updates through the email used to register. A new schedule will appear only after it is confirmed.',
      action: 'view',
      actionLabel: 'View update',
      formEnabled: false,
      memberCheckRequired,
      tone: 'critical',
    };
  }

  if (event.lifecycle === 'completed') {
    return {
      badge: 'Event completed',
      heading: 'Event completed',
      message:
        'This event has ended. Approved public resources or highlights will appear here if and when they become available.',
      action: 'view',
      actionLabel: 'View event',
      formEnabled: false,
      memberCheckRequired,
      tone: 'complete',
    };
  }

  /*
   * A service that cannot accept a registration must not offer one, whatever
   * the record says. This is the honest-unavailable rule reaching the card:
   * without it, a card would say "Register" and the page behind it would
   * explain that registration is not connected.
   */
  const serviceDown = registrationService === 'unavailable';

  switch (event.registration.state) {
    case 'open':
      return {
        badge: REGISTRATION_BADGES.open,
        /*
         * THE OPEN BRANCH HAD NO MESSAGE AT ALL until Tab 04.
         *
         * The marketplace card reads only the badge, so an absent message was
         * invisible for the whole of Tab 03 - and this is the state a production
         * page will be in most often: registration open on the record, no
         * endpoint configured, nothing to say. The detail panel rendered an
         * empty paragraph under "Registration open", which reads as a page that
         * failed to load rather than a service that is not connected yet.
         *
         * The unavailable wording is the exact sentence Tab 01 Step 2 requires,
         * taken from the shared constant rather than retyped, so the panel, the
         * register route and the card cannot word it differently.
         */
        message: serviceDown
          ? REGISTRATION_UNAVAILABLE_MESSAGE
          : memberCheckRequired
            ? 'Registration is open to verified members. Use the email connected to your PAAIPE membership.'
            : 'Registration is open. You will need an email address you can access before the event.',
        action: serviceDown ? 'view' : 'register',
        actionLabel: serviceDown ? 'View event' : 'Register',
        formEnabled: !serviceDown,
        memberCheckRequired,
        tone: serviceDown ? 'info' : 'default',
      };
    case 'waitlist':
      return {
        badge: REGISTRATION_BADGES.waitlist,
        heading: 'Event full',
        message:
          'This event has reached its current capacity. Leave your email and we will contact you if a place becomes available.',
        action: serviceDown ? 'view' : 'waitlist',
        actionLabel: serviceDown ? 'View event' : 'Join the waitlist',
        formEnabled: !serviceDown,
        memberCheckRequired,
        tone: 'warning',
      };
    case 'full':
      return {
        badge: REGISTRATION_BADGES.full,
        heading: 'Event full',
        message: 'This event is currently full. Registration is no longer available.',
        action: 'view',
        actionLabel: 'View event',
        formEnabled: false,
        memberCheckRequired,
        tone: 'warning',
      };
    case 'closed':
      return {
        badge: REGISTRATION_BADGES.closed,
        heading: 'Registration closed',
        message:
          'This event is no longer accepting registrations. Explore upcoming PAAIPE events for another opportunity to join.',
        action: 'view',
        actionLabel: 'View event',
        formEnabled: false,
        memberCheckRequired,
        tone: 'info',
      };
    case 'not-open':
    default:
      return {
        badge: REGISTRATION_BADGES['not-open'],
        heading: 'Registration opens soon',
        message:
          'Registration is not open yet. The confirmed opening time will appear here when available.',
        action: 'view',
        actionLabel: 'View event',
        formEnabled: false,
        memberCheckRequired,
        tone: 'info',
      };
  }
}

/**
 * The month/day/weekday parts for a date tile, read from the +08:00 string.
 *
 * Never via `toLocaleDateString` with a runtime timezone: the canonical time is
 * Philippine time, and rendering it in the build machine's zone would print a
 * different day for the same event depending on where it was built.
 */
export function manilaDateParts(startAt: string): {
  month: string;
  day: string;
  weekday: string;
  machine: string;
} {
  const [, y, m, d] = /^(\d{4})-(\d{2})-(\d{2})/.exec(startAt)!;
  const utc = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return {
    month: utc.toLocaleDateString('en-PH', { month: 'short', timeZone: 'UTC' }).toUpperCase(),
    day: String(Number(d)),
    weekday: utc.toLocaleDateString('en-PH', { weekday: 'short', timeZone: 'UTC' }),
    machine: startAt,
  };
}

/** "8:00 PM" from a +08:00 instant, without consulting a runtime timezone. */
export function manilaTime(instant: string): string {
  const [, hh, mm] = /T(\d{2}):(\d{2})/.exec(instant)!;
  const hour = Number(hh);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve}:${mm} ${suffix}`;
}
