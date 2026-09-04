/**
 * Deterministic cover art for events and resources.
 *
 * WHY THIS IS GENERATED RATHER THAN COMMISSIONED, and what it does NOT close.
 *
 * Owner item B-6 asks for approved EDITORIAL imagery with confirmed usage
 * rights - photography or illustration of real things - and that remains
 * PAAIPE's to supply. This is not that. It is abstract, brand-derived
 * decoration, so that a card looks designed rather than unfinished while the
 * editorial question is still open.
 *
 * It therefore lives under `public/media/generated/`, which `release-facts.mjs`
 * excludes from the B-6 count by RULE rather than by filename. A repository
 * that can satisfy an owner input by writing a file is a gate measuring its own
 * output, and the earlier version of that exclusion was a hardcoded list - the
 * kind of allow-list that fails by forgetting the moment a second generated
 * asset appears. This is that second asset, eleven times over.
 *
 * NOTHING HERE DEPICTS ANYTHING. No person, no event, no place, no claim. The
 * covers carry `alt=""` because they are decoration: a screen reader that
 * announced them would be reading out noise.
 *
 * DETERMINISTIC: every cover is a pure function of its slug, so the same slug
 * always produces the same art, a diff is empty unless the slug changed, and
 * `--check` can refuse drift. No randomness reaches the output.
 *
 * DISTINCT FROM THE LOGO, on the same rules `NetworkField` obeys: no triangle
 * mark, no sun rays, no wordmark, and no gold cluster arranged the way the logo
 * arranges one - gold appears at most once per cover, as a single node.
 *
 * Usage: node scripts/generate-covers.mjs [--check]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUT_DIR = join(ROOT, 'public/media/generated/covers');

/** 16:9, matching the fixed aspect ratio every cover component enforces. */
const WIDTH = 1200;
const HEIGHT = 675;

/** Brand tokens, copied as literals because an SVG file cannot read CSS. */
const NAVY_DEEP = '#030d1f';
const NAVY = '#082c6c';
const CYAN = '#00bceb';
const GOLD = '#f7b500';

/** FNV-1a. Small, stable, and identical on every machine and Node version. */
function seedFrom(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 1;
}

/** mulberry32: a tiny deterministic PRNG. Same seed, same sequence, always. */
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value) => Math.round(value * 10) / 10;

export function coverSvg(slug) {
  const random = rng(seedFrom(slug));
  const nodeCount = 6 + Math.floor(random() * 4); // 6-9

  /*
   * Nodes are placed on a jittered grid rather than at random. Pure random
   * placement clumps, and a clump reads as a mistake rather than as a pattern.
   */
  const columns = nodeCount <= 7 ? 3 : 4;
  const rows = 3;
  const cells = [];
  for (let c = 0; c < columns; c += 1) {
    for (let r = 0; r < rows; r += 1) cells.push([c, r]);
  }
  // Deterministic shuffle, then take the first nodeCount cells.
  for (let i = cells.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const nodes = cells.slice(0, nodeCount).map(([c, r]) => {
    const cellW = WIDTH / columns;
    const cellH = HEIGHT / rows;
    return {
      x: round(cellW * (c + 0.5) + (random() - 0.5) * cellW * 0.55),
      y: round(cellH * (r + 0.5) + (random() - 0.5) * cellH * 0.55),
      r: round(4 + random() * 6),
    };
  });

  // Each node links to its nearest unlinked neighbour: a connected field, never
  // a lattice and never a star.
  const links = [];
  for (let i = 0; i < nodes.length; i += 1) {
    let best = -1;
    let bestDistance = Infinity;
    for (let j = 0; j < nodes.length; j += 1) {
      if (i === j) continue;
      const distance = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (distance < bestDistance && !links.some((l) => l[0] === j && l[1] === i)) {
        bestDistance = distance;
        best = j;
      }
    }
    if (best !== -1) links.push([i, best]);
  }

  const goldIndex = Math.floor(random() * nodes.length);
  const arcY = round(HEIGHT * (0.55 + random() * 0.3));
  const arcLift = round(HEIGHT * (0.15 + random() * 0.2));

  const linkPaths = links
    .map(([a, b]) => `M${nodes[a].x} ${nodes[a].y}L${nodes[b].x} ${nodes[b].y}`)
    .join('');
  const circles = nodes
    .map(
      (n, i) =>
        `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${i === goldIndex ? GOLD : CYAN}" opacity="${i === goldIndex ? '0.85' : '0.6'}"/>`,
    )
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="presentation" aria-hidden="true">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${NAVY_DEEP}"/></linearGradient>
<pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${CYAN}" stroke-width="1" opacity="0.07"/></pattern></defs>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#g)"/>
<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
<path d="M-40 ${arcY}Q${WIDTH / 2} ${round(arcY - arcLift)} ${WIDTH + 40} ${round(arcY - arcLift / 3)}" fill="none" stroke="${CYAN}" stroke-width="2" opacity="0.28"/>
<path d="${linkPaths}" stroke="${CYAN}" stroke-width="1.5" opacity="0.35" fill="none"/>
${circles}
</svg>
`;
}

/** Slugs come from the registries, so a removed record removes its cover. */
async function slugs() {
  const events = readFileSync(join(ROOT, 'src/content/events.ts'), 'utf8');
  const resources = readFileSync(join(ROOT, 'src/content/resources.ts'), 'utf8');
  const found = [];
  for (const source of [events, resources]) {
    for (const match of source.matchAll(/^\s{4}slug: '([a-z0-9-]+)',$/gm)) found.push(match[1]);
  }
  return [...new Set(found)];
}

/*
 * ONLY RUN WHEN RUN, and this was a bug with teeth.
 *
 * `src/tests/covers.test.ts` imports `coverSvg` from this module. Without this
 * guard, importing it executed the whole file - which in write mode deletes and
 * REGENERATES the covers directory. The test therefore repaired the very state
 * it was about to assert on: deleting a cover and adding an orphan both passed,
 * because by the time the assertions ran the directory had been rebuilt.
 *
 * A guard that cannot fail is worse than no guard, because it is counted.
 */
const RUN_DIRECTLY = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (RUN_DIRECTLY) {
  await main();
}

async function main() {
  const list = await slugs();
  if (list.length === 0) {
    console.error('FAIL  no slugs found in the registries. Generating nothing is not a success.');
    process.exit(1);
  }

  const check = process.argv.includes('--check');
  const expected = new Map(list.map((slug) => [`${slug}.svg`, coverSvg(slug)]));

  if (check) {
    if (!existsSync(OUT_DIR)) {
      console.error('FAIL  public/media/generated/covers is missing. Run: npm run media:covers');
      process.exit(1);
    }
    const onDisk = readdirSync(OUT_DIR).filter((f) => f.endsWith('.svg'));
    const problems = [];
    for (const name of onDisk) if (!expected.has(name)) problems.push(`${name} has no record`);
    for (const [name, svg] of expected) {
      const path = join(OUT_DIR, name);
      if (!existsSync(path)) problems.push(`${name} is missing`);
      else if (readFileSync(path, 'utf8') !== svg) problems.push(`${name} is out of date`);
    }
    if (problems.length > 0) {
      console.error(
        `FAIL  covers are out of date. Run: npm run media:covers\n  - ${problems.join('\n  - ')}`,
      );
      process.exit(1);
    }
    console.log(`PASS  ${expected.size} covers match their slugs`);
  } else {
    rmSync(OUT_DIR, { recursive: true, force: true });
    mkdirSync(OUT_DIR, { recursive: true });
    for (const [name, svg] of expected) writeFileSync(join(OUT_DIR, name), svg);
    console.log(`WROTE ${expected.size} covers to public/media/generated/covers/`);
  }
}
