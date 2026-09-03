/**
 * Canonical logo asset descriptors.
 *
 * Intrinsic dimensions are recorded so every placement can declare width and
 * height and avoid layout shift. Tab 02 builds the LogoLockup component on top
 * of this; the files themselves are gated by `npm run verify:brand`.
 */
export interface LogoAsset {
  src: string;
  width: number;
  height: number;
  /** SHA-256 the file is pinned to in scripts/verify-brand-assets.mjs. */
  sha256: string;
}

export const LOGO_SQUARE: LogoAsset = {
  src: '/brand/PAAIPE_Logo_Square_Final.png',
  width: 2000,
  height: 2000,
  sha256: '88f91f0e5b4a7bf70d202d49dadedae5a677a72c02f9d4eaf097962a247d1867',
};

export const LOGO_HORIZONTAL: LogoAsset = {
  src: '/brand/PAAIPE_Logo_Horizontal_Final.png',
  width: 1800,
  height: 627,
  sha256: 'f332dc8c5d005b4cf46b06643d005d90071b36072c17a816107f3730021a1378',
};
