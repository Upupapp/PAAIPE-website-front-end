/**
 * The event-analytics allowlist, Tab 09.
 *
 * NOTHING SENDS ANY OF THIS. `PUBLIC_ANALYTICS_ENABLED` is off, no analytics
 * script is loaded, and `verify:budgets` fails the build on any analytics
 * endpoint. This module is a SPECIFICATION, written now so that whoever wires
 * telemetry inherits the boundary instead of designing it under deadline - and
 * so the forbidden list can be scanned for today, while there is nothing to
 * find, rather than after there is.
 *
 * WHY A LIST OF FORBIDDEN NAMES IS WORTH HAVING WITH NO ANALYTICS AT ALL. The
 * expensive version of this mistake is not someone adding `email` to a payload
 * on purpose. It is someone spreading an object - `{...event, ...response}` -
 * into a track() call, and the field arriving because it existed. A scan that
 * names the forbidden properties catches that on the commit that introduces it.
 *
 * THE FIELD THAT IS NOT OBVIOUS. A HASH OF AN EMAIL IS STILL THE EMAIL. Email
 * addresses are an enumerable set: anyone holding a list can hash it and match.
 * So is the domain, which on a small professional association identifies an
 * employer and sometimes a person. Both are named in the forbidden list because
 * both have been argued for as "anonymised" in projects like this one.
 */

/** The nine events Tab 09 permits, and nothing else. */
export const ALLOWED_ANALYTICS_EVENTS = [
  'event_catalog_viewed',
  'event_filter_applied',
  'event_detail_viewed',
  'event_share_used',
  'registration_started',
  'registration_submitted',
  'registration_received',
  'registration_waitlisted',
  'registration_failed',
] as const;

export type AllowedAnalyticsEvent = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

/** The nine properties Tab 09 permits. Fixed enums, never free text. */
export const ALLOWED_ANALYTICS_PROPERTIES = [
  'event_id',
  'event_slug',
  'event_type',
  'access_label',
  'registration_state',
  'intent',
  'outcome_code',
  'error_code',
  'viewport_bucket',
] as const;

export type AllowedAnalyticsProperty = (typeof ALLOWED_ANALYTICS_PROPERTIES)[number];

/**
 * Property names that must never appear in a telemetry payload.
 *
 * Written as the identifiers a payload would actually use, in the casings this
 * codebase and its likely vendors produce, because the scan matches text.
 */
export const FORBIDDEN_ANALYTICS_PROPERTIES = [
  'email',
  'email_hash',
  'emailHash',
  'hashed_email',
  'hashedEmail',
  'email_domain',
  'emailDomain',
  'membership_result',
  'membershipResult',
  'is_member',
  'isMember',
  'eligibility',
  'participant',
  'participant_identity',
  'request_body',
  'requestBody',
  'response_body',
  'responseBody',
  'token',
  /*
   * NO ZOOM, MEETING-ID OR PASSCODE ENTRIES HERE, and their absence is the
   * point rather than an oversight.
   *
   * Listing them made `scope-boundary.test.ts` fail on THIS FILE: that guard
   * forbids `zoom.us`, `meeting_id` and `passcode` anywhere in the source tree,
   * so writing them down to forbid them was itself the violation. The right
   * question when a gate objects to a declaration is not how to exempt the
   * declaration - it is whether the declaration needs to exist.
   *
   * It does not. The existing guard is STRICTLY STRONGER than anything this
   * list could add: it bans those strings from every source file and every
   * build artifact, while an analytics list could only ban them as payload
   * keys. Two guards for one property, and the weaker one breaking the stronger
   * one's scan, is worse than one guard.
   */
  'server_message',
  'serverMessage',
  'request_id',
  'requestId',
] as const;

/**
 * A payload is valid only if every key is on the allowlist.
 *
 * ALLOWLIST, NOT BLOCKLIST. A blocklist answers "is this one of the bad names",
 * which is unanswerable for a name nobody thought of; an allowlist answers "is
 * this one of the nine agreed names", which is decidable. The forbidden list
 * above exists for the SCAN - to catch a field appearing anywhere in the source
 * - not for this function, which needs no such list to be correct.
 */
export function isAllowedPayload(payload: Record<string, unknown>): boolean {
  const allowed = new Set<string>(ALLOWED_ANALYTICS_PROPERTIES);
  return Object.keys(payload).every((key) => allowed.has(key));
}

export function isAllowedEvent(name: string): name is AllowedAnalyticsEvent {
  return (ALLOWED_ANALYTICS_EVENTS as readonly string[]).includes(name);
}

/**
 * Bucketed viewport, so a raw width cannot become a fingerprinting signal.
 *
 * A precise pixel width is far more identifying than people expect, especially
 * combined with anything else. Four buckets answer every question analytics
 * would legitimately ask of a layout.
 */
export function viewportBucket(width: number): 'xs' | 'sm' | 'md' | 'lg' {
  if (width < 480) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1200) return 'md';
  return 'lg';
}
