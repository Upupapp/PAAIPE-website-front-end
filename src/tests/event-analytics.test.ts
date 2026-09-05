/**
 * Tab 09 - the analytics allowlist, and a scan of the BUILT OUTPUT for the
 * things that must never reach telemetry.
 */
import { readFileSync, globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALLOWED_ANALYTICS_EVENTS,
  ALLOWED_ANALYTICS_PROPERTIES,
  FORBIDDEN_ANALYTICS_PROPERTIES,
  isAllowedEvent,
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

  it('permits exactly the nine properties', () => {
    expect(ALLOWED_ANALYTICS_PROPERTIES).toHaveLength(9);
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

describe('nothing forbidden reaches the built output', () => {
  /*
   * SCANNED FROM `dist`, not from source. A value can arrive in an artifact
   * without any source file naming it - through a spread, a build-time inline,
   * or a dependency - which is why `verify-event-boundary.mjs` reads the build
   * too. This is the analytics half of that idea.
   */
  const files = [
    ...globSync('dist/**/*.html'),
    ...globSync('dist/**/*.js'),
    ...globSync('dist/**/*.json'),
  ];

  it('has a build to scan, and it is THIS site', () => {
    /*
     * An empty glob scans nothing and passes, which is the exact failure this
     * repository has already shipped once.
     *
     * A NUMERIC FLOOR WAS THE WRONG GUARD, and I wrote it first: 20 files,
     * picked because "a real build is dozens". The production build has 19, so
     * the floor failed on a perfectly good build - and the tempting repair is to
     * lower the number until it passes, which leaves a threshold that means
     * nothing and would not notice the build halving.
     *
     * Naming files that MUST exist is decidable where a count is not. If the
     * events pages are present, the scan below is looking at this site.
     */
    expect(files.length, 'no build output found; run `npm run build` first').toBeGreaterThan(0);
    expect(files, 'the marketplace page is missing from the build').toContain('dist/events.html');
    expect(
      files.some((file) => file.startsWith('dist/_astro/') && file.endsWith('.js')),
      'no bundled script found; the scan would not see client code',
    ).toBe(true);
  });

  it('contains no analytics endpoint', () => {
    const vendors = ['googletagmanager', 'google-analytics', 'segment.io', 'plausible', 'mixpanel'];
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8').toLowerCase();
      for (const vendor of vendors) if (text.includes(vendor)) hits.push(`${vendor} in ${file}`);
    }
    expect(hits, 'an analytics vendor is present in the build').toEqual([]);
  });

  it('carries no telemetry payload key that is forbidden', () => {
    /*
     * Matched as a PAYLOAD KEY - `"email":` or `email:` - not as a bare word.
     * The bare word appears legitimately all over this site: the privacy notice
     * explains what an email address is used for, the register page names the
     * field, and the FAQ answers "How is my email used?". A scan that flagged
     * those would be a scan nobody could keep green, and a guard nobody can keep
     * green is a guard that gets deleted.
     */
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const name of FORBIDDEN_ANALYTICS_PROPERTIES) {
        const asKey = new RegExp(`["']?${name}["']?\\s*:`, 'i');
        if (asKey.test(text)) offenders.push(`${name} as a key in ${file}`);
      }
    }
    expect(offenders, 'a forbidden property name appears as a key in the build').toEqual([]);
  });

  it('proves the scan can see a key when one is present', () => {
    /*
     * THE PAIRED POSITIVE. Every assertion above is an absence, and an absence
     * over an empty or unreadable set looks identical to an absence over a clean
     * one. This runs the same matcher against text that MUST match.
     */
    const asKey = new RegExp(`["']?email["']?\\s*:`, 'i');
    expect(asKey.test('{"email": "a@b.c"}')).toBe(true);
    expect(asKey.test('email: value')).toBe(true);
    // And does not fire on the prose this site legitimately contains.
    expect(asKey.test('PAAIPE uses your email to process this registration')).toBe(false);
  });
});
