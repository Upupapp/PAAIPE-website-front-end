/**
 * Generate the decorative Philippine contour that `NetworkField` has had a slot
 * for since Tab 02.
 *
 * WHY THIS IS GENERATED AND NOT DRAWN. The master command asks for "subtle
 * independent Philippine map contours", and B-6 held it back for a stated
 * reason: an APPROXIMATED national outline is a credibility risk for a
 * Philippine association. Drawing one by eye would have earned that risk. This
 * derives one instead, from Natural Earth 1:50m Admin 0 - Countries, which is
 * public domain: "All versions of Natural Earth raster + vector map data found
 * on this website are in the public domain." No permission and no attribution
 * are required, and derivative use is explicitly permitted.
 *
 * The source geometry is VENDORED at `scripts/data/ph-outline.geojson` rather
 * than fetched, so a build never depends on a network call and the exact bytes
 * the asset came from are in the repository.
 *
 * WHAT THIS IS NOT. It is decoration, and it is not a statement of territorial
 * extent. It draws the archipelago as Natural Earth maps it, at one stated
 * resolution, and it takes no position on any maritime or territorial question.
 * It is `aria-hidden` wherever it is used, because it carries no information.
 *
 * PROJECTION: equirectangular, with longitude scaled by cos(mean latitude).
 * Over 5-21 degrees north that is within about a percent of Mercator, and it
 * keeps the shape upright and unstretched at the size this renders. A
 * decorative outline does not need a conformal projection; it needs to be
 * recognisably right, and derived rather than guessed.
 *
 * Usage: node scripts/generate-ph-contour.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('./data/ph-outline.geojson', import.meta.url));
const OUT = fileURLToPath(new URL('../public/media/ph-contour.svg', import.meta.url));

/** Width of the generated viewBox. Height follows from the aspect ratio. */
const WIDTH = 1000;
/** Coordinate precision in the path data. One decimal at this width is ~0.1px. */
const DP = 1;

/*
 * SIMPLIFICATION, and why it is still derivation rather than the guesswork B-6
 * refused.
 *
 * The 1:50m source carries 1238 points, which gzips to about 7 KiB. Inlined,
 * that would have roughly DOUBLED the home page's 8.9 KiB of compressed HTML
 * for a background decoration - a real cost paid by every visitor on every
 * load, for detail nobody can see at the size this renders.
 *
 * So the geometry is reduced by Ramer-Douglas-Peucker at a STATED tolerance,
 * expressed in projected units of the viewBox above. Every retained point is a
 * real coordinate from the public-domain source; none is invented, moved or
 * smoothed. That is the difference from drawing an outline by eye: the error is
 * bounded, stated, and reproducible from the vendored input.
 *
 * Rings whose projected bounding box is smaller than MIN_RING are dropped.
 * At the width this renders they are a fraction of a pixel - not islands a
 * reader could see, just noise in the path data.
 */
const TOLERANCE = 5;
const MIN_RING = 6;

/** Ramer-Douglas-Peucker. Keeps original points; never interpolates new ones. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [first] = points;
  const last = points[points.length - 1];
  let index = -1;
  let furthest = 0;
  const [x1, y1] = first;
  const [x2, y2] = last;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const denom = Math.hypot(dx, dy);
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const distance =
      denom === 0
        ? Math.hypot(px - x1, py - y1)
        : Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / denom;
    if (distance > furthest) {
      furthest = distance;
      index = i;
    }
  }
  if (furthest <= tolerance || index === -1) return [first, last];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

const feature = JSON.parse(readFileSync(SOURCE, 'utf8'));
const polygons = feature.geometry.coordinates;

const lons = [];
const lats = [];
for (const polygon of polygons) {
  for (const ring of polygon) {
    for (const [lon, lat] of ring) {
      lons.push(lon);
      lats.push(lat);
    }
  }
}
if (lons.length === 0) {
  console.error(
    'FAIL  the vendored geometry has no coordinates. Generating nothing is not a success.',
  );
  process.exit(1);
}

const minLon = Math.min(...lons);
const maxLon = Math.max(...lons);
const minLat = Math.min(...lats);
const maxLat = Math.max(...lats);
const meanLat = ((minLat + maxLat) / 2) * (Math.PI / 180);
const lonScale = Math.cos(meanLat);

const spanX = (maxLon - minLon) * lonScale;
const spanY = maxLat - minLat;
const scale = WIDTH / spanX;
const HEIGHT = Math.round(spanY * scale);

const subpaths = [];
let dropped = 0;
let kept = 0;
for (const polygon of polygons) {
  // Ring 0 is the outer ring; any further rings are holes. A contour drawn as
  // an outline needs both - a lake or an enclosed bay is part of the shape.
  for (const ring of polygon) {
    const projected = ring.map(([lon, lat]) => [
      (lon - minLon) * lonScale * scale,
      (maxLat - lat) * scale,
    ]);
    const xs = projected.map((p) => p[0]);
    const ys = projected.map((p) => p[1]);
    if (
      Math.max(...xs) - Math.min(...xs) < MIN_RING &&
      Math.max(...ys) - Math.min(...ys) < MIN_RING
    ) {
      dropped += 1;
      continue;
    }
    const points = simplify(projected, TOLERANCE);
    if (points.length < 3) {
      dropped += 1;
      continue;
    }
    kept += points.length;
    const fmt = (p) => `${p[0].toFixed(DP)} ${p[1].toFixed(DP)}`;
    const [first, ...rest] = points;
    subpaths.push(`M${fmt(first)}` + rest.map((p) => `L${fmt(p)}`).join('') + 'Z');
  }
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" aria-hidden="true" focusable="false" role="presentation">
<title>Decorative contour of the Philippine archipelago</title>
<desc>Derived from Natural Earth 1:50m Admin 0 - Countries, which is in the public domain. Decorative only; not a statement of territorial extent.</desc>
<path d="${subpaths.join('')}" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
</svg>
`;

const check = process.argv.includes('--check');
if (check) {
  let current = '';
  try {
    current = readFileSync(OUT, 'utf8');
  } catch {
    console.error('FAIL  public/media/ph-contour.svg does not exist. Run: npm run media:contour');
    process.exit(1);
  }
  if (current !== svg) {
    console.error('FAIL  public/media/ph-contour.svg is out of date. Run: npm run media:contour');
    process.exit(1);
  }
  console.log(
    `PASS  ph-contour.svg matches its source (${subpaths.length} rings, ${WIDTH}x${HEIGHT})`,
  );
} else {
  writeFileSync(OUT, svg);
  console.log(
    `WROTE public/media/ph-contour.svg  ${subpaths.length} rings (${dropped} sub-pixel dropped), ${kept} points, ${WIDTH}x${HEIGHT}, ${svg.length} bytes`,
  );
}
