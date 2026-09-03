/**
 * Canonical logo assets and their measured geometry.
 *
 * Two tiers:
 *  - `canonical`  the untouched files supplied by PAAIPE. Source of record,
 *                 SHA-256 gated. Reference these only where the full-resolution
 *                 original is genuinely wanted.
 *  - `renditions` proportional downscales for actual placements. Same artwork,
 *                 same colours, same safe space, fewer pixels. Always declare
 *                 width and height so a placement cannot cause layout shift.
 */
export interface LogoAsset {
  src: string;
  width: number;
  height: number;
  /**
   * A LOSSLESS WebP twin at identical pixel dimensions, served first from a
   * <picture> with `src` as the fallback. Lossless because "the artwork is
   * delivered unmodified" is a rule: a lossy encode would be smaller still and
   * is not used. AVIF is absent because, measured on these files, lossless AVIF
   * is LARGER than the PNG. See scripts/generate-logo-renditions.mjs.
   */
  webp?: string;
}

export interface CanonicalLogo extends LogoAsset {
  sha256: string;
  /**
   * Bounds of the visible artwork inside the canvas, measured from the alpha
   * channel: [left, top, right, bottom] in source pixels.
   */
  artworkBox: readonly [number, number, number, number];
  /**
   * Transparent padding baked into the canvas, in source pixels, as
   * [left, top, right, bottom].
   *
   * These are NOT symmetric. The artwork is deliberately left uncropped - the
   * master command forbids cropping the logo - so any placement that needs the
   * mark optically centred must compensate in CSS rather than by editing the
   * file. Tab 02 owns that compensation.
   */
  padding: readonly [number, number, number, number];
}

export const LOGO_SQUARE: CanonicalLogo = {
  src: '/brand/PAAIPE_Logo_Square_Final.png',
  width: 2000,
  height: 2000,
  sha256: '88f91f0e5b4a7bf70d202d49dadedae5a677a72c02f9d4eaf097962a247d1867',
  // The artwork is 1464x1747 - portrait, not square - and sits 91px above the
  // vertical centre of its square canvas.
  artworkBox: [269, 81, 1733, 1828],
  padding: [269, 81, 267, 172],
};

export const LOGO_HORIZONTAL: CanonicalLogo = {
  src: '/brand/PAAIPE_Logo_Horizontal_Final.png',
  width: 1800,
  height: 627,
  sha256: 'f332dc8c5d005b4cf46b06643d005d90071b36072c17a816107f3730021a1378',
  // The artwork is 1626x540 and sits 33px left of the horizontal centre:
  // right padding (120) is more than double the left (54).
  artworkBox: [54, 45, 1680, 585],
  padding: [54, 45, 120, 42],
};

/** Header and footer lockup. 1800x627 scaled by exactly 1/3. */
export const LOGO_HORIZONTAL_600: LogoAsset = {
  src: '/brand/renditions/paaipe-horizontal-600.png',
  width: 600,
  height: 209,
  webp: '/brand/renditions/paaipe-horizontal-600.webp',
};

/** Square mark for badges, PWA icons and the apple-touch icon. */
export const LOGO_SQUARE_512: LogoAsset = {
  src: '/brand/renditions/paaipe-square-512.png',
  width: 512,
  height: 512,
  webp: '/brand/renditions/paaipe-square-512.webp',
};

export const LOGO_SQUARE_256: LogoAsset = {
  src: '/brand/renditions/paaipe-square-256.png',
  width: 256,
  height: 256,
  webp: '/brand/renditions/paaipe-square-256.webp',
};

export const LOGO_SQUARE_180: LogoAsset = {
  src: '/brand/renditions/paaipe-square-180.png',
  width: 180,
  height: 180,
  webp: '/brand/renditions/paaipe-square-180.webp',
};

export const CANONICAL_LOGOS = [LOGO_SQUARE, LOGO_HORIZONTAL] as const;

export const LOGO_RENDITIONS = [
  LOGO_HORIZONTAL_600,
  LOGO_SQUARE_512,
  LOGO_SQUARE_256,
  LOGO_SQUARE_180,
] as const;
