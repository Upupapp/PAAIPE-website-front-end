/**
 * No content record may occupy a path the token landings need.
 *
 * `/events/[slug]` is dynamic, so an event slugged "confirm" would sit on the
 * same URL as the registration confirmation landing. One of the two would be
 * silently unreachable, and if it were the landing, the symptom is a person
 * unable to complete a registration from an email - found by them, not by us.
 */
import { describe, expect, it } from 'vitest';
import { RESERVED_SLUGS } from '../config/routes';
import { EVENTS } from '../content/events';
import { RESOURCES } from '../content/resources';

describe('reserved path segments', () => {
  it('is a non-empty reservation', () => {
    // A loop over an empty list passes in the same green as a loop over a full one.
    expect(RESERVED_SLUGS.length).toBeGreaterThan(0);
  });

  it('collides with no event or resource slug', () => {
    const reserved = new Set<string>(RESERVED_SLUGS);
    const collisions = [
      ...EVENTS.map((record) => ({ kind: 'event', slug: record.slug })),
      ...RESOURCES.map((record) => ({ kind: 'resource', slug: record.slug })),
    ].filter((record) => reserved.has(record.slug));
    expect(collisions.map((c) => `${c.kind} "${c.slug}" occupies a reserved path segment`)).toEqual(
      [],
    );
  });
});
