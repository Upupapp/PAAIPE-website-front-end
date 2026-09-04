/**
 * The generated cover art: deterministic, present, and decorative.
 *
 * These replaced typed `placeholder` values, and the type existed to stop a
 * record referencing a file nobody supplied. Moving to `kind: 'file'` gives that
 * guarantee up at the type level, so it has to be re-earned here: every cover a
 * record names must actually exist on disk.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { coverSvg } from '../../scripts/generate-covers.mjs';
import { EVENTS } from '../content/events';
import { RESOURCES } from '../content/resources';

const ROOT = new URL('../../', import.meta.url).pathname;
const COVERS = `${ROOT}public/media/generated/covers`;

const records = [
  ...EVENTS.map((record) => ({ slug: record.slug, image: record.image })),
  ...RESOURCES.map((record) => ({ slug: record.slug, image: record.cover })),
];

describe('every record has a cover that exists', () => {
  it('has records to check', () => {
    expect(records.length).toBeGreaterThan(5);
  });

  it('names a file, and the file is there', () => {
    for (const { slug, image } of records) {
      expect(image.kind, `${slug} has no file cover`).toBe('file');
      if (image.kind !== 'file') continue;
      expect(image.src, slug).toBe(`/media/generated/covers/${slug}.svg`);
      const onDisk = `${ROOT}public${image.src}`;
      expect(existsSync(onDisk), `${image.src} is named but not present`).toBe(true);
      expect(statSync(onDisk).size, `${image.src} is empty`).toBeGreaterThan(200);
    }
  });

  it('is decorative, so the alt is deliberately empty', () => {
    /*
     * The art depicts nothing - no person, no event, no place. A screen reader
     * announcing it would be reading out noise. An empty alt is the correct
     * value here, and the type's own comment says so; what would be wrong is a
     * MISSING alt, which this asserts is not the case.
     */
    for (const { slug, image } of records) {
      if (image.kind !== 'file') continue;
      expect(image.alt, `${slug} must have an explicit empty alt`).toBe('');
      expect(image.width / image.height).toBeCloseTo(16 / 9, 2);
    }
  });

  it('leaves no orphan cover behind a deleted record', () => {
    const named = new Set(
      records.flatMap((r) => (r.image.kind === 'file' ? [r.image.src.split('/').pop()!] : [])),
    );
    const onDisk = readdirSync(COVERS).filter((f) => f.endsWith('.svg'));
    expect(onDisk.filter((f) => !named.has(f))).toEqual([]);
  });
});

describe('the art is a pure function of the slug', () => {
  it('produces identical output for the same slug', () => {
    // If it did not, every build would produce a diff and `--check` would be noise.
    expect(coverSvg('a-slug')).toBe(coverSvg('a-slug'));
  });

  it('produces different output for different slugs', () => {
    expect(coverSvg('a-slug')).not.toBe(coverSvg('b-slug'));
  });

  it('matches what is on disk', () => {
    for (const { slug } of records) {
      expect(readFileSync(`${COVERS}/${slug}.svg`, 'utf8'), slug).toBe(coverSvg(slug));
    }
  });

  it('never draws the gold accent more than once', () => {
    /*
     * The rule NetworkField obeys: nothing may read as the logo, which arranges
     * a cluster of gold nodes. One gold node is an accent; three is a quotation.
     */
    for (const { slug } of records) {
      const golds = (readFileSync(`${COVERS}/${slug}.svg`, 'utf8').match(/#f7b500/g) ?? []).length;
      expect(golds, `${slug} draws ${golds} gold nodes`).toBeLessThanOrEqual(1);
    }
  });
});
