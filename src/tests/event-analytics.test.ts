/**
 * Tab 09 - the analytics allowlist, and a scan of the BUILT OUTPUT for the
 * things that must never reach telemetry.
 */
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_ANALYTICS_EVENTS,
  ALLOWED_ANALYTICS_PROPERTIES,
  FORBIDDEN_ANALYTICS_PROPERTIES,
  isAllowedEvent,
  durationBucket,
  isAllowedPayload,
  viewportBucket,
} from '../config/event-analytics';

describe('the allowlist says what Tab 09 says', () => {
  it('permits exactly the nine events', () => {
    expect(ALLOWED_ANALYTICS_EVENTS).toHaveLength(9);
    expect(ALLOWED_ANALYTICS_EVENTS).toContain('registration_received');
    expect(isAllowedEvent('registration_received')).toBe(true);
    expect(isAllowedEvent('registration_email_captured')).toBe(false);
  });

  it('permits the ten properties the two tabs name between them', () => {
    /*
     * Tab 09 lists nine; Tab 07 adds `request_duration_bucket` for registration
     * telemetry and omits two of Tab 09's. The allowlist is their UNION,
     * because dropping either would forbid a property a command permits.
     */
    expect(ALLOWED_ANALYTICS_PROPERTIES).toHaveLength(10);
    expect(ALLOWED_ANALYTICS_PROPERTIES).toContain('request_duration_bucket');
  });

  it('buckets a request duration rather than reporting a timing', () => {
    /*
     * The backend applies a response-time floor so its POST reveals nothing
     * about the address. A precise duration would hand that distinction back.
     */
    expect(durationBucket(120)).toBe('fast');
    expect(durationBucket(800)).toBe('normal');
    expect(durationBucket(2500)).toBe('slow');
    expect(durationBucket(9000)).toBe('very-slow');
  });

  it('accepts a payload of allowed keys and rejects any other key', () => {
    expect(isAllowedPayload({ event_id: 'a', outcome_code: 'registered' })).toBe(true);
    expect(isAllowedPayload({ event_id: 'a', email: 'x@y.z' })).toBe(false);
    // The one people argue about: a hash is still the identifier.
    expect(isAllowedPayload({ email_hash: 'deadbeef' })).toBe(false);
    expect(isAllowedPayload({ email_domain: 'example.com' })).toBe(false);
  });

  it('buckets the viewport rather than reporting a width', () => {
    expect(viewportBucket(320)).toBe('xs');
    expect(viewportBucket(768)).toBe('md');
    expect(viewportBucket(1440)).toBe('lg');
  });

  it('shares no name between the allowed and forbidden lists', () => {
    /*
     * A name on both lists would make the allowlist authorise something the
     * scan then reports - two guards disagreeing, which is worse than one.
     */
    const allowed = new Set<string>(ALLOWED_ANALYTICS_PROPERTIES);
    const overlap = FORBIDDEN_ANALYTICS_PROPERTIES.filter((name) => allowed.has(name));
    expect(overlap).toEqual([]);
  });
});

/*
 * THE BUILD SCAN THAT WAS HERE HAS MOVED to `scripts/write-integrity-scan.mjs`,
 * as the `analytics-vendor` and `analytics-payload-key` categories.
 *
 * It scanned `dist/`, and `npm run test` runs at step 4 of the check chain while
 * the build happens later - so in a clean checkout there was nothing to scan and
 * the run failed. It passed in my working tree only because a stale `dist/` was
 * lying around, which is precisely the difference a detached-worktree gate
 * exists to expose.
 *
 * The floor assertion I had written to stop an empty scan passing quietly is
 * what caught it. It worked exactly as intended, against me.
 *
 * What remains in this file is everything decidable from source: the allowlist
 * itself, the payload validator, the bucketing, and the two lists not
 * overlapping.
 */
