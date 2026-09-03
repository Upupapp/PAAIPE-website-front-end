#!/usr/bin/env node
/**
 * Generate dimension-correct delivery renditions of the canonical PAAIPE logos.
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * It does not redraw, approximate, recolour, crop, trace, clean up or
 * regenerate the artwork, and it does not separate any element of it. Every
 * rendition is a whole-file proportional downscale of the canonical original:
 * the same artwork, the same colours, the same safe space, fewer pixels.
 *
 * WHY IT EXISTS
 * -------------
 * The canonical originals are 1.35 MB (2000x2000) and 480 KB (1800x627).
 * Serving those into a ~40px header slot fails the Tab 14 budgets
 * (initial transfer 1 MiB, hero/LCP image 250 KiB) on their own. The canonical
 * files stay byte-identical in public/brand/ as the source of record; these
 * renditions are what pages actually reference, with declared width/height so
 * no placement causes layout shift.
 *
 * Every scale factor below is EXACT, so no rendition changes the aspect ratio:
 *   horizontal 1800x627 -> 1200x418 (x2/3) and 600x209 (x1/3)
 *   square     2000x2000 -> any square size
 *
 * Usage: node scripts/generate-logo-renditions.mjs [--check]
 *   --check  verify existing renditions instead of writing them
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const BRAND = new URL('../public/brand/', import.meta.url);
const OUT = new URL('renditions/', BRAND);

/** width x height must be an exact proportional scale of the source. */
export const RENDITIONS = [
  // Horizontal lockup - header and footer. 1800x627 scaled by exactly 1/3.
  // 600px covers a 300 CSS px lockup on a 2x display, which is a generous
  // header size. The only other exact scale below 1:1 is 2/3 (1200x418), and
  // at 254 KiB that breaches the Tab 14 image budget with no consumer, so it
  // is deliberately not generated. Add it only with budget evidence.
  {
    source: 'PAAIPE_Logo_Horizontal_Final.png',
    name: 'paaipe-horizontal-600.png',
    width: 600,
    height: 209,
  },
  // Square mark - badge, favicon source and apple-touch icon. 2000x2000.
  {
    source: 'PAAIPE_Logo_Square_Final.png',
    name: 'paaipe-square-512.png',
    width: 512,
    height: 512,
  },
  {
    source: 'PAAIPE_Logo_Square_Final.png',
    name: 'paaipe-square-256.png',
    width: 256,
    height: 256,
  },
  {
    source: 'PAAIPE_Logo_Square_Final.png',
    name: 'paaipe-square-180.png',
    width: 180,
    height: 180,
  },
];

function assertExactScale({ source, width, height }, meta) {
  const sx = meta.width / width;
  const sy = meta.height / height;
  if (Math.abs(sx - sy) > 1e-9) {
    throw new Error(
      `${source} -> ${width}x${height} is not a proportional scale ` +
        `(x${sx.toFixed(6)} horizontally vs x${sy.toFixed(6)} vertically). ` +
        `Aspect ratio must be preserved exactly.`,
    );
  }
}

async function render({ source, width, height }) {
  const input = await readFile(new URL(source, BRAND));
  const meta = await sharp(input).metadata();
  assertExactScale({ source, width, height }, meta);

  return sharp(input)
    .resize(width, height, { kernel: 'lanczos3', fit: 'fill' })
    .png({ compressionLevel: 9, effort: 10, palette: false })
    .toBuffer();
}

async function main() {
  const check = process.argv.includes('--check');
  await mkdir(fileURLToPath(OUT), { recursive: true });

  let failures = 0;

  for (const rendition of RENDITIONS) {
    const target = new URL(rendition.name, OUT);
    const bytes = await render(rendition);

    if (check) {
      let existing;
      try {
        existing = await readFile(target);
      } catch {
        console.error(`MISSING  ${rendition.name}`);
        failures += 1;
        continue;
      }
      const meta = await sharp(existing).metadata();
      if (meta.width !== rendition.width || meta.height !== rendition.height) {
        console.error(
          `WRONG SIZE  ${rendition.name}: ${meta.width}x${meta.height}, expected ${rendition.width}x${rendition.height}`,
        );
        failures += 1;
        continue;
      }
      console.log(
        `OK    ${rendition.name}  ${meta.width}x${meta.height}  ${(existing.length / 1024).toFixed(1)} KiB`,
      );
    } else {
      await writeFile(target, bytes);
      console.log(
        `WROTE ${rendition.name}  ${rendition.width}x${rendition.height}  ${(bytes.length / 1024).toFixed(1)} KiB`,
      );
    }
  }

  if (failures > 0) process.exit(1);
}

// Only generate when run directly. The brand gate IMPORTS this module for the
// RENDITIONS manifest, and an import must never write files.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
