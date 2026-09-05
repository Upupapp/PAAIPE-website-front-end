import type { PublicEventRecord } from '../content/event-record';
import { REGISTRATION_UNAVAILABLE_MESSAGE } from '../config/event-config';
import { SCHEDULE_UPDATED_NOTICE } from '../content/events-detail';

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
  /**
   * Where the action goes.
   *
   * THE RESOLVER OWNS THE DESTINATION, not the component. Tab 06: "Components
   * must not reproduce conditional state logic independently." The registration
   * panel was choosing its own label from the action kind while ignoring
   * `actionLabel`, so the approved "Browse upcoming events" on a full event was
   * silently replaced by a link back to the page the reader was already on.
   *
   * Absent means there is nowhere useful to send anyone, and the component then
   * renders no control at all rather than a disabled-looking one.
   */
  actionHref?: string;
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
      actionLabel: 'Browse upcoming events',
      actionHref: '/events',
      formEnabled: false,
      memberCheckRequired,
      tone: 'critical',
    };
  }

  if (event.lifecycle === 'completed') {
    return {
      badge: 'Event completed',
      /*
       * The approved heading is the thank-you line, not a repeat of the badge.
       * Tab 06 supplies "Event completed" as the LABEL and "Thank you for being
       * part of the conversation." as the heading beneath it; using the badge
       * twice dropped the only warm sentence on an ended event's page.
       */
      heading: 'Thank you for being part of the conversation.',
      message:
        'This event has ended. Approved public resources or highlights will appear here if and when they become available.',
      action: 'view',
      actionLabel: 'Browse upcoming events',
      actionHref: '/events',
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

  /*
   * A CHANGED SCHEDULE MODIFIES A STATE; IT IS NOT ONE.
   *
   * It was tempting to give this its own branch, and that would have been wrong:
   * a rescheduled event is still open, or still full, or still not open yet, and
   * a branch would have had to answer the registration question a second time.
   * The notice is layered ON TOP of whatever the registration state resolves to,
   * so the reader is told both things - the schedule moved, AND where
   * registration stands - instead of one replacing the other.
   *
   * Only for a SCHEDULED event. On a cancelled or completed one the schedule
   * moving is not news the reader can act on, and both of those return earlier.
   */
  const rescheduled = event.scheduleUpdatedAt !== undefined;

  const withScheduleNotice = (model: EventActionModel): EventActionModel =>
    rescheduled
      ? {
          ...model,
          heading: SCHEDULE_UPDATED_NOTICE.heading,
          message: `${SCHEDULE_UPDATED_NOTICE.body} ${model.message ?? ''}`.trim(),
          tone: model.tone === 'default' ? 'info' : model.tone,
        }
      : model;

  switch (event.registration.state) {
    case 'open':
      return withScheduleNotice({
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
        actionLabel: serviceDown ? 'Browse upcoming events' : 'Register for this event',
        actionHref: serviceDown ? '/events' : `/events/${event.slug}/register`,
        formEnabled: !serviceDown,
        memberCheckRequired,
        tone: serviceDown ? 'info' : 'default',
      });
    case 'waitlist':
      return withScheduleNotice({
        badge: REGISTRATION_BADGES.waitlist,
        heading: 'Event full',
        message:
          'This event has reached its current capacity. Leave your email and we will contact you if a place becomes available.',
        action: serviceDown ? 'view' : 'waitlist',
        actionLabel: serviceDown ? 'Browse upcoming events' : 'Join the waitlist',
        actionHref: serviceDown ? '/events' : `/events/${event.slug}/register`,
        formEnabled: !serviceDown,
        memberCheckRequired,
        tone: 'warning',
      });
    case 'full':
      /*
       * `full` here always means full WITHOUT a waitlist: the schema rejects a
       * record that is `full` while accepting one, because that record's public
       * state is `waitlist`. So this branch is the end of the journey, and the
       * approved action sends the reader somewhere that is not - "Browse
       * upcoming events" rather than "View event", which would return them to
       * the page they are already on.
       */
      return withScheduleNotice({
        badge: REGISTRATION_BADGES.full,
        heading: 'Event full',
        message: 'This event is currently full. Registration is no longer available.',
        action: 'view',
        actionLabel: 'Browse upcoming events',
        actionHref: '/events',
        formEnabled: false,
        memberCheckRequired,
        tone: 'warning',
      });
    case 'closed':
      return withScheduleNotice({
        badge: REGISTRATION_BADGES.closed,
        heading: 'Registration closed',
        message:
          'This event is no longer accepting registrations. Explore upcoming PAAIPE events for another opportunity to join.',
        action: 'view',
        actionLabel: 'Browse upcoming events',
        actionHref: '/events',
        formEnabled: false,
        memberCheckRequired,
        tone: 'info',
      });
    case 'not-open':
    default:
      return withScheduleNotice({
        badge: REGISTRATION_BADGES['not-open'],
        heading: 'Registration opens soon',
        message:
          'Registration is not open yet. The confirmed opening time will appear here when available.',
        action: 'view',
        actionLabel: 'Browse upcoming events',
        actionHref: '/events',
        formEnabled: false,
        memberCheckRequired,
        tone: 'info',
      });
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
