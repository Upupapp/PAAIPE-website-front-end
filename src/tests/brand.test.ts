import { statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CANONICAL_LOGOS, LOGO_HORIZONTAL, LOGO_RENDITIONS, LOGO_SQUARE } from '../config/brand';

const PUBLIC_DIR = new URL('../../public', import.meta.url).pathname;

const assetPath = (src: string) => `${PUBLIC_DIR}${src}`;

describe('brand assets', () => {
  it('has every declared canonical file and rendition on disk', () => {
    for (const asset of [...CANONICAL_LOGOS, ...LOGO_RENDITIONS]) {
      expect(statSync(assetPath(asset.src)).isFile(), asset.src).toBe(true);
    }
  });

  it('keeps every rendition an exact proportional scale of its canonical source', () => {
    const sourceOf = (src: string) => (src.includes('horizontal') ? LOGO_HORIZONTAL : LOGO_SQUARE);
    for (const rendition of LOGO_RENDITIONS) {
      const source = sourceOf(rendition.src);
      // Cross-multiply rather than compare floats: an exact scale means
      // w1*h2 === w2*h1, with no rounding involved at all.
      expect(rendition.width * source.height, `${rendition.src} distorts the aspect ratio`).toBe(
        source.width * rendition.height,
      );
    }
  });

  it('keeps every rendition inside the Tab 14 image budget', () => {
    for (const rendition of LOGO_RENDITIONS) {
      expect(statSync(assetPath(rendition.src)).size, rendition.src).toBeLessThanOrEqual(
        250 * 1024,
      );
    }
  });

  it('records the measured artwork box inside the canvas for each canonical logo', () => {
    for (const logo of CANONICAL_LOGOS) {
      const [left, top, right, bottom] = logo.artworkBox;
      expect(right).toBeGreaterThan(left);
      expect(bottom).toBeGreaterThan(top);
      expect(right).toBeLessThanOrEqual(logo.width);
      expect(bottom).toBeLessThanOrEqual(logo.height);
      // padding must be the complement of the artwork box, or one of the two
      // was edited without the other and both become untrustworthy.
      expect(logo.padding).toEqual([left, top, logo.width - right, logo.height - bottom]);
    }
  });

  it('records that the square canvas holds portrait artwork, so a badge cannot assume 1:1', () => {
    const [left, top, right, bottom] = LOGO_SQUARE.artworkBox;
    expect(LOGO_SQUARE.width).toBe(LOGO_SQUARE.height);
    expect(right - left).toBeLessThan(bottom - top);
  });
});
