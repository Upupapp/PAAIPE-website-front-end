/**
 * The sitemap must list every event page the build publishes.
 *
 * WHY THIS EXISTS. The sitemap was generated from a filter over the LEGACY
 * event registry - the one Tab 03 stopped rendering and Tab 04 removed the last
 * bridge to - using `visibility`, the field the new record calls `access`. It
 * therefore listed NO event page, and could not have listed one. The cost was
 * zero while nothing was approved, and would have been the most valuable thing
 * PAAIPE publishes the moment something was.
 *
 * THE REASON IT WAS INVISIBLE is the transferable part, and the backend lane
 * hit the identical defect on their side (bus #0447): the sitemap was
 * well-formed, and the tests asserted the routes it DID contain. There was no
 * error, no malformed XML, no failing assertion - just a shorter list than it
 * should have been, and nothing anywhere comparing that list against what ought
 * to be in it.
 *
 * A TEST THAT ONLY CHECKS WHAT IS PRESENT CANNOT SEE WHAT IS ABSENT.
 *
 * So this derives the two halves DIFFERENTLY on purpose: one from the registry
 * through the same predicate the route generates from, the other from the
 * sitemap the build actually wrote. A change that drops a page from one and not
 * the other fails here.
 */
import { describe, expect, it } from 'vitest';
import { EVENT_RECORDS } from '../content/event-records';
import { EVENT_SAMPLES } from '../content/event-samples';
import { isPublishableEvent } from '../lib/event-catalog';
import { seoContext, sitemapXml } from '../lib/seo';
import { PUBLIC_ROUTES } from '../config/routes';

const ORIGIN = 'https://example.org';

/** The set the sitemap OUGHT to contain, derived from the live registry. */
function expectedEventPaths(): string[] {
  return [...EVENT_RECORDS, ...EVENT_SAMPLES]
    .filter((event) => isPublishableEvent(event, 'production'))
    .filter((event) => event.contentStatus === 'approved' && event.access === 'public')
    .map((event) => `/events/${event.slug}`);
}

describe('the sitemap lists every published public event', () => {
  const context = seoContext(ORIGIN, 'production', {
    origin: ORIGIN,
    approvedIn: 'test',
  });

  it('is honestly empty today, and that is a MEASURED fact', () => {
    /*
     * No record is approved, so the correct event count is zero. Asserted so
     * the emptiness is measured rather than assumed - and so approving the
     * first event makes this fail and be re-read.
     */
    expect(expectedEventPaths()).toEqual([]);
  });

  it('includes an approved public event when one exists', () => {
    /*
     * THE PAIRED POSITIVE, and the whole point of the file. Without it every
     * assertion here passes over an empty set, which is exactly how the defect
     * survived. A synthetic path is fed through the real builder.
     */
    const xml = sitemapXml(PUBLIC_ROUTES, context, ['/events/a-real-event']);
    expect(xml).not.toBeNull();
    expect(xml).toContain(`${ORIGIN}/events/a-real-event`);
  });

  it('never lists a members-only or unapproved event', () => {
    const all = [...EVENT_RECORDS, ...EVENT_SAMPLES];
    const excluded = all.filter(
      (event) => event.contentStatus !== 'approved' || event.access !== 'public',
    );
    expect(
      excluded.length,
      'no excluded record exists; this test measures nothing',
    ).toBeGreaterThan(0);

    const listed = new Set(expectedEventPaths());
    for (const event of excluded) {
      expect(listed.has(`/events/${event.slug}`), `${event.id} is listed`).toBe(false);
    }
  });

  it('keeps a cancelled event, deliberately', () => {
    /*
     * Agreed with the backend lane (#0447): dropping a cancelled event from the
     * index means someone searching for it finds NOTHING rather than finding
     * that it was cancelled - worse for them and for PAAIPE. The filter turns
     * on approval and access, never on lifecycle, and this asserts that the
     * lifecycle plays no part.
     */
    const cancelled = [...EVENT_RECORDS, ...EVENT_SAMPLES].filter(
      (event) => event.lifecycle === 'cancelled',
    );
    expect(cancelled.length, 'no cancelled fixture exists').toBeGreaterThan(0);

    for (const event of cancelled) {
      const wouldList = event.contentStatus === 'approved' && event.access === 'public';
      const isListed = expectedEventPaths().includes(`/events/${event.slug}`);
      expect(isListed, `${event.id}: lifecycle changed the answer`).toBe(wouldList);
    }
  });
});
