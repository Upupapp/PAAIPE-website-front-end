#!/usr/bin/env node
/**
 * The metadata matrix gate: assert the BUILT HTML against `src/config/routes.ts`
 * and `src/lib/seo.ts`.
 *
 * WHY IT READS THE BUILD
 * ----------------------
 * A unit test can prove `pageSeo()` returns the right object. It cannot prove
 * the layout renders it. Tab 14 found exactly that failure: `events/[slug]` and
 * `resources/[slug]` targeted their canonical link and their Event JSON-LD at
 * `slot="head"`, and BaseLayout declared no such slot, so Astro dropped both
 * silently. `dist/` had zero `rel="canonical"` and zero `ld+json`. Only a scan
 * of the artifact catches that.
 *
 * It runs in BOTH content modes. Production must not inherit the review build's
 * `noindex`, and the review build must not become crawlable - a gate that
 * checks one direction proves nothing about the other.
 *
 * Usage: PUBLIC_CONTENT_MODE=... node --import tsx scripts/verify-seo.mjs
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseContentMode } from '../src/config/content-mode.ts';
import { PUBLIC_ROUTES } from '../src/config/routes.ts';
import { resolvePublicConfig } from '../src/config/public-config.ts';
import {
  DEFAULT_SOCIAL,
  SOCIAL_CARD,
  indexability,
  pageSeo,
  robotsTxt,
  seoContext,
} from '../src/lib/seo.ts';
import { loadDotenv } from './load-dotenv.mjs';

const ROOT = new URL('../', import.meta.url);
const DIST = fileURLToPath(new URL('dist/', ROOT));

// The build that produced `dist/` read `.env`; a verifier that does not read
// the same one fails its own artifact. See `scripts/load-dotenv.mjs`.
loadDotenv(ROOT);

const CONTENT_MODE = parseContentMode(process.env.PUBLIC_CONTENT_MODE);
const { config } = resolvePublicConfig(process.env);
/*
 * Built through `seoContext()` for the same reason the build is: this gate
 * asserts the artifact against what the CURRENT configuration should produce,
 * so if it resolved the origin differently from the build it would either wave
 * through a wrong canonical or fail a correct one.
 */
const CONTEXT = seoContext(config.siteUrl, CONTENT_MODE);

/** Description length window. Under 50 chars says nothing; over 160 is truncated. */
const DESCRIPTION_RANGE = [50, 160];

const failures = [];
const notes = [];
function fail(where, message) {
  failures.push(`${where}: ${message}`);
}

/* --------------------------------------------------------- HTML extraction */

/**
 * Attribute reader for a known-shape document. Astro emits well-formed tags, so
 * a targeted matcher is enough - but it is written to find the tag by the
 * attribute that IDENTIFIES it (`name="description"`), then read `content` from
 * the same tag, rather than searching for `content=` near it. A window-based
 * match would key on a neighbouring tag; the label gate learned that the hard way.
 */
function tags(html, tagName) {
  const re = new RegExp(`<${tagName}\\b([^>]*?)/?>`, 'gi');
  const out = [];
  for (const match of html.matchAll(re)) out.push(attrs(match[1]));
  return out;
}

function attrs(raw) {
  const out = {};
  for (const match of raw.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g)) {
    out[match[1]] = decode(match[2]);
  }
  return out;
}

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function meta(html, key, kind = 'name') {
  return tags(html, 'meta')
    .filter((tag) => tag[kind] === key)
    .map((tag) => tag.content ?? null);
}

function links(html, rel) {
  return tags(html, 'link').filter((tag) => (tag.rel ?? '').split(/\s+/).includes(rel));
}

function titles(html) {
  return [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((match) => decode(match[1]));
}

function jsonLdBlocks(html) {
  return [
    ...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((match) => match[1]);
}

/* ------------------------------------------------------------- dist walking */

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full)));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

/** dist/about/index.html -> /about ; dist/index.html -> / ; dist/404.html -> /404 */
function servedPath(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel === '404.html') return '/404';
  return `/${rel.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`;
}

/** The registry entry for a served path: exact match, or the dynamic template. */
function routeFor(path) {
  const exact = PUBLIC_ROUTES.find((route) => route.path === path);
  if (exact) return { route: exact, detail: undefined };
  for (const route of PUBLIC_ROUTES) {
    if (!route.dynamic) continue;
    const prefix = route.path.replace(/\[[^\]]+\]$/, '');
    if (path.startsWith(prefix) && path.slice(prefix.length).length > 0) {
      return { route, detail: { approved: false } };
    }
  }
  return null;
}

/* ------------------------------------------------------------- page checks */

function checkPage(path, html, seen) {
  const found = routeFor(path);
  if (!found) {
    fail(path, 'built page has no entry in src/config/routes.ts');
    return;
  }
  const { route, detail } = found;

  // A detail page's real indexability depends on its record. The gate cannot
  // read the record from HTML, so it derives the EXPECTED state from whether
  // the page rendered a noindex tag, and then checks every OTHER tag agrees
  // with that state. This still catches the disagreement cases, which are the
  // ones that matter.
  const robots = meta(html, 'robots');
  const isNoindex = robots.some((value) => (value ?? '').includes('noindex'));
  const expected = pageSeo(route, CONTEXT, {
    path,
    detail: detail ? { approved: !isNoindex } : undefined,
  });

  // --- title
  const found_titles = titles(html);
  if (found_titles.length !== 1) {
    fail(path, `${found_titles.length} <title> elements, expected exactly 1`);
  } else {
    const title = found_titles[0].trim();
    if (title.length === 0) fail(path, '<title> is empty');
    if (!route.dynamic && title !== expected.title) {
      fail(path, `<title> is "${title}", registry says "${expected.title}"`);
    }
    const duplicate = seen.titles.get(title);
    if (duplicate) fail(path, `<title> "${title}" is not unique - also on ${duplicate}`);
    else seen.titles.set(title, path);
  }

  // --- description
  const descriptions = meta(html, 'description');
  if (descriptions.length > 1) fail(path, `${descriptions.length} meta descriptions, expected 1`);
  if (expected.description === undefined) {
    if (descriptions.length !== 0 && !route.dynamic) {
      fail(path, 'has a meta description the registry does not define');
    }
  } else if (descriptions.length === 0) {
    fail(path, 'missing meta description');
  } else {
    const description = descriptions[0] ?? '';
    if (!route.dynamic && description !== expected.description) {
      fail(path, 'meta description does not match the registry');
    }
    const [min, max] = DESCRIPTION_RANGE;
    if (description.length < min || description.length > max) {
      fail(path, `meta description is ${description.length} chars, outside ${min}-${max}`);
    }
    const duplicate = seen.descriptions.get(description);
    if (duplicate) fail(path, `meta description is not unique - also on ${duplicate}`);
    else seen.descriptions.set(description, path);
  }

  // --- indexability. Both directions.
  // An unapproved origin noindexes the whole site, detail pages included, so it
  // is decided BEFORE the per-record inference - otherwise a detail page that is
  // noindex because of the origin would be reported as unapproved CONTENT, and
  // the remedy named would be the wrong one.
  const reason = detail
    ? CONTEXT.originUnapproved
      ? 'unapproved-origin'
      : isNoindex
        ? 'unapproved-content'
        : 'indexable'
    : indexability(route, CONTEXT);
  const shouldIndex = reason === 'indexable';
  if (shouldIndex && isNoindex) {
    fail(path, 'is noindex, but nothing in the registry or the content mode makes it so');
  }
  if (!shouldIndex && !isNoindex) {
    fail(path, `should be noindex (${reason}) but carries no robots directive`);
  }
  if (CONTENT_MODE === 'review' && !isNoindex) {
    fail(path, 'a review build must not be indexable');
  }

  // --- canonical
  const canonicals = links(html, 'canonical').map((tag) => tag.href ?? '');
  if (canonicals.length > 1) fail(path, `${canonicals.length} canonical links, expected at most 1`);
  if (expected.canonical === null) {
    if (canonicals.length !== 0) {
      fail(
        path,
        `has a canonical (${canonicals[0]}) but none is derivable - noindex, or PUBLIC_SITE_URL unset`,
      );
    }
  } else if (canonicals.length === 0) {
    fail(path, 'missing canonical link');
  } else if (canonicals[0] !== expected.canonical) {
    fail(path, `canonical is ${canonicals[0]}, expected ${expected.canonical}`);
  }

  // --- Open Graph, on every page
  for (const [key, want] of [
    ['og:type', 'website'],
    ['og:locale', 'en_PH'],
  ]) {
    const values = meta(html, key, 'property');
    if (values.length !== 1) fail(path, `${values.length} ${key} tags, expected 1`);
    else if (values[0] !== want) fail(path, `${key} is "${values[0]}", expected "${want}"`);
  }
  for (const key of ['og:site_name', 'og:title', 'og:description']) {
    const values = meta(html, key, 'property');
    if (values.length !== 1) fail(path, `${values.length} ${key} tags, expected 1`);
    else if (!values[0]) fail(path, `${key} is empty`);
  }
  if (!route.dynamic) {
    const ogTitle = meta(html, 'og:title', 'property')[0];
    if (ogTitle !== expected.social.title) fail(path, 'og:title does not match the registry');
    const ogDescription = meta(html, 'og:description', 'property')[0];
    if (ogDescription !== expected.social.description) {
      fail(path, 'og:description does not match the registry');
    }
  }

  const ogUrl = meta(html, 'og:url', 'property');
  if (expected.canonical === null && ogUrl.length !== 0) {
    fail(path, 'has og:url without a canonical to derive it from');
  }
  if (expected.canonical !== null && ogUrl[0] !== expected.canonical) {
    fail(path, 'og:url does not match the canonical');
  }

  // --- social image and the card type that declares it
  const ogImage = meta(html, 'og:image', 'property');
  const card = meta(html, 'twitter:card');
  if (expected.social.image === null) {
    if (ogImage.length !== 0) {
      fail(path, 'has og:image, but no absolute image URL exists without PUBLIC_SITE_URL');
    }
    if (card[0] !== 'summary') {
      fail(path, `twitter:card is "${card[0]}", expected "summary" with no image to show`);
    }
  } else {
    if (ogImage[0] !== expected.social.image) fail(path, 'og:image is not the branded card URL');
    if (card[0] !== 'summary_large_image') fail(path, 'twitter:card should be summary_large_image');
    const alt = meta(html, 'og:image:alt', 'property')[0];
    if (alt !== DEFAULT_SOCIAL.imageAlt) fail(path, 'og:image:alt is not the approved alt text');
    const width = meta(html, 'og:image:width', 'property')[0];
    if (width !== String(SOCIAL_CARD.width)) fail(path, 'og:image:width does not match the card');
  }

  // --- icons and manifest
  if (links(html, 'icon').length < 1) fail(path, 'no favicon link');
  if (links(html, 'apple-touch-icon').length !== 1) fail(path, 'no apple-touch-icon link');
  if (links(html, 'manifest').length !== 1) fail(path, 'no manifest link');

  // --- hreflang. There are no translated versions, so there must be none.
  const alternates = links(html, 'alternate').filter((tag) => tag.hreflang);
  if (alternates.length > 0) {
    fail(path, 'declares hreflang alternates, but no translated version of this site exists');
  }

  // --- structured data
  for (const block of jsonLdBlocks(html)) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (error) {
      fail(path, `JSON-LD does not parse: ${error.message}`);
      continue;
    }
    const entries = Array.isArray(data) ? data : [data];
    for (const entry of entries) {
      if (entry['@context'] !== 'https://schema.org') {
        fail(path, `JSON-LD @context is ${JSON.stringify(entry['@context'])}`);
      }
      if (typeof entry['@type'] !== 'string') fail(path, 'JSON-LD has no @type');
      // Nothing in the registry is approved, so an Event or an Article in the
      // output would be a fabricated claim - exactly what the master command
      // forbids. If real approved content is added later, this expectation
      // changes with it, and the test file says so.
      if (
        ['Event', 'Article', 'BlogPosting', 'Offer', 'AggregateRating', 'Review'].includes(
          entry['@type'],
        )
      ) {
        fail(path, `JSON-LD asserts ${entry['@type']}, but no approved record backs it`);
      }
      if (entry['@type'] === 'BreadcrumbList') {
        const list = entry.itemListElement ?? [];
        if (list.length < 2) fail(path, 'BreadcrumbList has fewer than 2 items');
        list.forEach((item, index) => {
          if (item.position !== index + 1) fail(path, 'BreadcrumbList positions are not 1..n');
          if (!item.name) fail(path, 'BreadcrumbList item has no name');
        });
      }
    }
  }
  if (path === '/' && CONTEXT.siteUrl) {
    const types = jsonLdBlocks(html).flatMap((block) => {
      try {
        const data = JSON.parse(block);
        return (Array.isArray(data) ? data : [data]).map((entry) => entry['@type']);
      } catch {
        return [];
      }
    });
    for (const want of ['Organization', 'WebSite']) {
      if (!types.includes(want)) fail(path, `home page is missing ${want} JSON-LD`);
    }
  }
}

/* ------------------------------------------------------------------- main */

let files;
try {
  files = await walk(DIST);
} catch {
  console.error('FAIL  dist/ does not exist. Run a build first.');
  process.exit(1);
}

if (files.length < 10) {
  console.error(
    `FAIL  dist/ has only ${files.length} HTML pages. A scan of an almost-empty build is not a pass.`,
  );
  process.exit(1);
}

const seen = { titles: new Map(), descriptions: new Map() };
for (const file of files) {
  checkPage(servedPath(file), await readFile(file, 'utf8'), seen);
}

/* --- every route that should be built, is */
for (const route of PUBLIC_ROUTES) {
  if (route.dynamic) continue;
  const built = files.some((file) => servedPath(file) === route.path);
  if (route.internal) {
    // F-12: the internal surface is absent from the production build.
    if (CONTENT_MODE === 'production' && built) {
      fail(route.path, 'internal route is present in a production build');
    }
    if (CONTENT_MODE === 'review' && !built) {
      fail(route.path, 'internal route is missing from the review build');
    }
    continue;
  }
  if (!built) fail(route.path, 'registry route was not built');
}

/* --- 404: a real error page, not a soft 404 */
const notFound = files.find((file) => servedPath(file) === '/404');
if (!notFound) fail('/404', 'no 404.html in the build');
else {
  const html = await readFile(notFound, 'utf8');
  if (!/\b404\b/.test(html)) fail('/404', 'the 404 page does not identify itself as a 404');
  if (!meta(html, 'robots').some((value) => (value ?? '').includes('noindex'))) {
    fail('/404', 'the 404 page is not noindex');
  }
}

/* --- robots.txt and sitemap.xml */
const robotsPath = join(DIST, 'robots.txt');
let robots = null;
try {
  robots = await readFile(robotsPath, 'utf8');
} catch {
  fail('robots.txt', 'missing from the build');
}
if (robots !== null) {
  if (robots !== robotsTxt(CONTEXT)) {
    fail('robots.txt', 'does not match what the current configuration produces');
  }
  if (CONTENT_MODE === 'review' && !/^Disallow: \/$/m.test(robots)) {
    fail('robots.txt', 'a review build must disallow all crawling');
  }
  if (CONTENT_MODE === 'production' && /^Disallow: \/$/m.test(robots)) {
    fail('robots.txt', 'the production build must not disallow all crawling');
  }
  // robots.txt is not access control: it must not name a path that is meant to
  // be unreachable, because naming it advertises it.
  for (const route of PUBLIC_ROUTES) {
    if (route.internal && robots.includes(route.path)) {
      fail('robots.txt', `names the internal path ${route.path}, which advertises it`);
    }
  }
}

let sitemap = null;
try {
  sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
} catch {
  /* absent is correct without an origin; asserted below. */
}
if (CONTEXT.siteUrl === undefined && sitemap !== null) {
  fail('sitemap.xml', 'exists without a configured origin, so its URLs cannot be right');
}
if (CONTENT_MODE === 'review' && sitemap !== null) {
  fail('sitemap.xml', 'a review build must not publish a sitemap');
}
if (sitemap !== null) {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (locs.length === 0) fail('sitemap.xml', 'contains no <loc> entries');
  for (const loc of locs) {
    const path = new URL(loc).pathname.replace(/\/$/, '') || '/';
    const page = files.find((file) => servedPath(file) === path);
    if (!page) fail('sitemap.xml', `lists ${loc}, which is not a built page`);
    else {
      const html = await readFile(page, 'utf8');
      if (meta(html, 'robots').some((value) => (value ?? '').includes('noindex'))) {
        fail('sitemap.xml', `lists ${loc}, which is a noindex page`);
      }
    }
  }
}

/* --- the manifest */
try {
  const manifest = JSON.parse(await readFile(join(DIST, 'manifest.webmanifest'), 'utf8'));
  if (!manifest.name || !manifest.short_name) fail('manifest', 'missing name or short_name');
  if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    fail('manifest', 'declares no icons');
  }
  for (const icon of manifest.icons ?? []) {
    try {
      await stat(join(DIST, icon.src.replace(/^\//, '')));
    } catch {
      fail('manifest', `icon ${icon.src} is not in the build`);
    }
  }
} catch (error) {
  fail('manifest', `manifest.webmanifest is missing or invalid: ${error.message}`);
}

/* --- the branded social card ships */
if (CONTENT_MODE === 'production') {
  try {
    await stat(join(DIST, SOCIAL_CARD.path.replace(/^\//, '')));
  } catch {
    fail('social card', `${SOCIAL_CARD.path} is not in the build`);
  }
}

/* ------------------------------------------------------------------ report */

console.log(`SEO metadata scan - ${CONTENT_MODE} build, ${files.length} pages`);
console.log(
  CONTEXT.siteUrl
    ? `  origin: ${CONTEXT.siteUrl} (APPROVED)`
    : CONTEXT.originUnapproved
      ? `  origin: ${config.siteUrl} is CONFIGURED but NOT APPROVED (owner item B-7) - canonicals, og:url, og:image and sitemap are suppressed and every page is noindex`
      : '  origin: NOT CONFIGURED (owner item B-7) - canonicals, og:url, og:image and sitemap are absent by design',
);
for (const note of notes) console.log(`  note: ${note}`);

if (failures.length > 0) {
  console.error(`\nSEO SCAN FAILED - ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('PASS');
