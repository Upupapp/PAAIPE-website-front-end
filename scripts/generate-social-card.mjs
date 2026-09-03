#!/usr/bin/env node
/**
 * Composite the branded social preview card.
 *
 * WHAT THIS DOES
 * --------------
 * It places the EXACT approved horizontal logo rendition - itself a whole-file
 * proportional downscale of the canonical original - onto a flat brand-navy
 * 1200x630 canvas, optically centred. Nothing else.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not render text. The master command's default social title is the
 * approved slogan, and it would be the natural thing to set across the card -
 * but no typeface is approved (owner item B-5), so rendering it would mean
 * choosing a face on PAAIPE's behalf and baking that choice into an image that
 * appears on every share. The words are supplied through `og:image:alt` and
 * `og:title` instead, where they need no font and stay machine-readable.
 *
 * It does not redraw, recolour, crop, trace, regenerate or separate any part
 * of the logo, and it does not generate a substitute mark.
 *
 * SAFE ZONES
 * ----------
 * 1200x630 is the Open Graph 1.91:1 slot. Platforms crop it differently, so
 * the logo occupies only the central 600x209 and every edge keeps at least
 * 210px of clear navy - comfortably inside the tightest common crop (a 1:1
 * centre crop keeps x 285..915, which still contains the whole lockup).
 *
 * OPTICAL CENTRING
 * ----------------
 * The horizontal logo file is not geometrically centred: its artwork box is
 * [54, 45, 1680, 585] in an 1800x627 canvas, so there is 54px of clear space on
 * the left and 120px on the right. Centring the FILE would leave the artwork
 * visibly 11px left of centre at 1/3 scale. The offsets below centre the
 * ARTWORK, which is what the eye reads.
 *
 * Usage: node scripts/generate-social-card.mjs [--check]
 *   --check  re-render and compare against the committed file instead of writing
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const RENDITIONS = new URL('../public/brand/renditions/', import.meta.url);
const OUT = new URL('../public/social/', import.meta.url);

/** Brand navy. The single source of truth is src/config/tokens.ts. */
const NAVY = { r: 0x0a, g: 0x1f, b: 0x44, alpha: 1 };

export const SOCIAL_CARDS = [
  {
    name: 'paaipe-social-card.png',
    width: 1200,
    height: 630,
    logo: 'paaipe-horizontal-600.png',
    logoWidth: 600,
    logoHeight: 209,
    /**
     * Placement of the logo FILE, chosen so the ARTWORK lands dead centre.
     *
     *   artwork box in the 600x209 rendition = [18, 15, 560, 195]
     *   artwork centre within the file       = (289, 105)
     *   left = 600 - 289 = 311      top = 315 - 105 = 210
     */
    left: 311,
    top: 210,
  },
];

/** The tightest common platform crop: a centred square. Key content must fit. */
function safeCrop({ width, height }) {
  const side = Math.min(width, height);
  return {
    left: Math.round((width - side) / 2),
    top: Math.round((height - side) / 2),
    right: Math.round((width + side) / 2),
    bottom: Math.round((height + side) / 2),
  };
}

function assertInsideSafeCrop(card) {
  const crop = safeCrop(card);
  const logo = {
    left: card.left,
    top: card.top,
    right: card.left + card.logoWidth,
    bottom: card.top + card.logoHeight,
  };
  const overflow = [];
  if (logo.left < crop.left) overflow.push(`${crop.left - logo.left}px past the left crop edge`);
  if (logo.top < crop.top) overflow.push(`${crop.top - logo.top}px past the top crop edge`);
  if (logo.right > crop.right)
    overflow.push(`${logo.right - crop.right}px past the right crop edge`);
  if (logo.bottom > crop.bottom)
    overflow.push(`${logo.bottom - crop.bottom}px past the bottom crop edge`);
  if (overflow.length > 0) {
    throw new Error(
      `${card.name}: the logo leaves the platform-safe centre square (${overflow.join(', ')}).`,
    );
  }
  return crop;
}

async function render(card) {
  const logo = await readFile(new URL(card.logo, RENDITIONS));
  const meta = await sharp(logo).metadata();
  if (meta.width !== card.logoWidth || meta.height !== card.logoHeight) {
    throw new Error(
      `${card.logo} is ${meta.width}x${meta.height}, expected ${card.logoWidth}x${card.logoHeight}. ` +
        `Run "npm run brand:renditions" first - the card composites the exact rendition, never a resize of it.`,
    );
  }
  assertInsideSafeCrop(card);

  return sharp({
    create: { width: card.width, height: card.height, channels: 4, background: NAVY },
  })
    .composite([{ input: logo, left: card.left, top: card.top }])
    .png({ compressionLevel: 9, effort: 10, palette: false })
    .toBuffer();
}

/**
 * Compare pixels, not bytes. A PNG encoder can differ across libvips builds
 * while producing an identical image, so a byte comparison would fail on the
 * owner's machine for no real reason. Pixel comparison still catches the thing
 * that matters: someone replacing the artwork or nudging the layout.
 */
async function comparePixels(expected, actual, card) {
  const a = await sharp(expected).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(actual).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (a.info.width !== b.info.width || a.info.height !== b.info.height) {
    return `${card.name}: ${b.info.width}x${b.info.height}, expected ${a.info.width}x${a.info.height}`;
  }
  let worst = 0;
  let total = 0;
  for (let i = 0; i < a.data.length; i += 1) {
    const delta = Math.abs(a.data[i] - b.data[i]);
    if (delta > worst) worst = delta;
    total += delta;
  }
  const mean = total / a.data.length;
  if (worst > 2 || mean > 0.5) {
    return `${card.name}: pixels differ from a fresh composite of ${card.logo} (worst channel delta ${worst}, mean ${mean.toFixed(3)}). The committed card must be exactly the approved logo on brand navy.`;
  }
  return null;
}

async function main() {
  const check = process.argv.includes('--check');
  await mkdir(fileURLToPath(OUT), { recursive: true });

  let failures = 0;

  for (const card of SOCIAL_CARDS) {
    const target = new URL(card.name, OUT);
    const bytes = await render(card);

    if (check) {
      let existing;
      try {
        existing = await readFile(target);
      } catch {
        console.error(`MISSING  ${card.name}`);
        failures += 1;
        continue;
      }
      const problem = await comparePixels(bytes, existing, card);
      if (problem) {
        console.error(`FAIL  ${problem}`);
        failures += 1;
        continue;
      }
      console.log(
        `OK    ${card.name}  ${card.width}x${card.height}  ${(existing.length / 1024).toFixed(1)} KiB  (logo ${card.logoWidth}x${card.logoHeight} at ${card.left},${card.top})`,
      );
    } else {
      await writeFile(target, bytes);
      console.log(
        `WROTE ${card.name}  ${card.width}x${card.height}  ${(bytes.length / 1024).toFixed(1)} KiB`,
      );
    }
  }

  if (failures > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
