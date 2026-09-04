/**
 * The decorative Philippine contour, and the honesty rule attached to it.
 *
 * B-6 held this back for a stated reason: an APPROXIMATED national outline is a
 * credibility risk for a Philippine association. The asset answers that by
 * being derived rather than drawn — so these tests guard the derivation, the
 * provenance, and the one thing that could quietly turn a good asset into a
 * false claim: letting it satisfy an owner input it does not satisfy.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../../', import.meta.url).pathname;
const svg = readFileSync(`${ROOT}public/media/generated/ph-contour.svg`, 'utf8');
const source = JSON.parse(readFileSync(`${ROOT}scripts/data/ph-outline.geojson`, 'utf8')) as {
  properties: Record<string, string>;
  geometry: { type: string; coordinates: number[][][][] };
};

describe('the generated contour', () => {
  it('draws a real path, not an empty file', () => {
    const d = /<path d="([^"]+)"/.exec(svg)?.[1];
    expect(d, 'no path in the generated asset').toBeTruthy();
    // 48 rings at the chosen tolerance. A file that lost its geometry would
    // still be valid SVG and still render nothing.
    expect((d!.match(/M/g) ?? []).length, 'ring count').toBeGreaterThan(30);
    expect((d!.match(/L/g) ?? []).length, 'point count').toBeGreaterThan(300);
  });

  it('carries no information, so it reaches no assistive technology', () => {
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('focusable="false"');
  });

  it('states where it came from, inside the artefact itself', () => {
    // Provenance in a README can be separated from the file it describes.
    expect(svg).toMatch(/Natural Earth/);
    expect(svg).toMatch(/public domain/i);
    expect(svg).toMatch(/not a statement of territorial extent/i);
  });
});

describe('the vendored source', () => {
  it('is the Philippines, and says so with its licence', () => {
    expect(source.properties.iso_a2).toBe('PH');
    expect(source.properties.source).toMatch(/Natural Earth/);
    expect(source.properties.licence).toMatch(/public domain/i);
    expect(source.properties.source_url).toMatch(/^https:\/\//);
  });

  it('has a bounding box that is actually the Philippine archipelago', () => {
    /*
     * The guard against a silently swapped country. A different nation's
     * outline would still be valid GeoJSON, still generate a clean SVG, and
     * still pass every other test in this file.
     */
    const lons: number[] = [];
    const lats: number[] = [];
    for (const polygon of source.geometry.coordinates) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          lons.push(lon!);
          lats.push(lat!);
        }
      }
    }
    expect(Math.min(...lons)).toBeGreaterThan(116);
    expect(Math.max(...lons)).toBeLessThan(127);
    expect(Math.min(...lats)).toBeGreaterThan(4);
    expect(Math.max(...lats)).toBeLessThan(22);
    expect(source.geometry.coordinates.length, 'an archipelago is many polygons').toBeGreaterThan(
      20,
    );
  });
});

describe('the contour does not satisfy an owner input', () => {
  it('is excluded from the B-6 media count', () => {
    /*
     * THE POINT OF THIS FILE.
     *
     * B-6 asks for two things: approved imagery AND the map contour. Its
     * detector counts images in `public/media/`, so the moment this asset
     * landed there it would have flipped B-6 green — and the editorial imagery
     * B-6 actually blocks on would still be missing.
     *
     * A repository that can satisfy an owner input by generating a file is a
     * gate measuring its own output. It is the same error as the earlier bug
     * that counted the README explaining the absence as evidence of presence.
     */
    const facts = JSON.parse(
      execFileSync('npx', ['tsx', 'scripts/release-facts.mjs'], {
        cwd: ROOT,
        encoding: 'utf8',
      }),
    ) as { approvedMediaFiles: number; inputs: { id: string; supplied: boolean }[] };

    expect(svg.length, 'the contour must exist for this test to mean anything').toBeGreaterThan(
      1000,
    );
    expect(facts.approvedMediaFiles, 'the generated contour was counted as supplied imagery').toBe(
      0,
    );
    const b6 = facts.inputs.find((input) => input.id === 'B-6');
    expect(b6, 'B-6 is missing from the release inputs').toBeDefined();
    expect(b6!.supplied, 'B-6 reported supplied on the strength of our own output').toBe(false);
  });
});
