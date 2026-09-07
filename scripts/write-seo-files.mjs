#!/usr/bin/env node
/**
 * Write `robots.txt` and `sitemap.xml` into the build output.
 *
 * WHY A POST-BUILD SCRIPT RATHER THAN AN ASTRO ENDPOINT
 * -----------------------------------------------------
 * Because one of the two files must sometimes NOT EXIST. A static Astro
 * endpoint always emits a file; there is no "return nothing" for a non-dynamic
 * route. A sitemap needs absolute URLs, and the origin may be absent (owner
 * item B-7) or configured-but-unapproved, in which cases there is no honest
 * sitemap to write. The choices were:
 *
 *   - guess an origin: ships wrong canonical URLs to every crawler;
 *   - write an empty `<urlset>`: tells a crawler the site has no pages;
 *   - write no file: a 404 on /sitemap.xml, which is the truthful answer, and
 *     robots.txt then carries no Sitemap line to point at it.
 *
 * This script does the third, and DELETES a stale sitemap left by an earlier
 * build that did have an origin, so the output can never disagree with robots.txt.
 *
 * Usage: node scripts/write-seo-files.mjs [--out dist] [--check]
 *   --check  verify the files in an existing build instead of writing them
 */
import { readFile, writeFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { parseContentMode } from '../src/config/content-mode.ts';
import { PUBLIC_ROUTES } from '../src/config/routes.ts';
import { resolvePublicConfig } from '../src/config/public-config.ts';
import { indexability, robotsTxt, seoContext, sitemapRoutes, sitemapXml } from '../src/lib/seo.ts';
import { EVENT_RECORDS } from '../src/content/event-records.ts';
import { EVENT_SAMPLES } from '../src/content/event-samples.ts';
import { isPublishableEvent } from '../src/lib/event-catalog.ts';

/** The same set the detail route generates from. */
const allEventRecords = [...EVENT_RECORDS, ...EVENT_SAMPLES];
import { RESOURCES } from '../src/content/resources.ts';
import { loadDotenv } from './load-dotenv.mjs';

const ROOT = new URL('../', import.meta.url);

// Astro has already read `.env`; this script must read the same one. See
// `scripts/load-dotenv.mjs` for what went wrong when it did not.
loadDotenv(ROOT);

/**
 * Concrete detail-page paths for approved public records. Empty today: nothing
 * in the registry is `approved`, so no detail page is built and none is listed.
 * The derivation is here rather than hard-coded, so the first approved record
 * appears in the sitemap without anyone remembering to add it.
 */
function detailPaths(contentMode) {
  if (contentMode !== 'production') return [];
  /*
   * EVENT PATHS COME FROM THE REGISTRY THE ROUTE ACTUALLY GENERATES FROM.
   *
   * This read `EVENTS` - the LEGACY registry, which Tab 03 stopped rendering
   * and Tab 04 removed the last bridge to - and filtered it on `visibility`,
   * the legacy field name the new record calls `access`. It contains no
   * approved event and never will, so the sitemap listed no event page at all.
   *
   * That cost nothing while nothing was approved, and would have cost the most
   * valuable thing PAAIPE publishes the moment something was: the page would be
   * built, indexable, and absent from the sitemap, with NOTHING anywhere that
   * compares the two. The backend lane found the identical defect on their side
   * (bus #0447) and the identical cause - a well-formed sitemap, tests
   * asserting the routes it DID contain, and no test asking what was missing.
   *
   * A TEST THAT ONLY CHECKS WHAT IS PRESENT CANNOT SEE WHAT IS ABSENT.
   *
   * Exclusions match what the two lanes agreed: members-only out, unpublished
   * out, and CANCELLED EVENTS KEPT - dropping a cancelled event from the index
   * means someone searching for it finds nothing rather than finding that it
   * was cancelled, which is worse for them and for PAAIPE.
   */
  const events = allEventRecords
    .filter((event) => isPublishableEvent(event, 'production'))
    .filter((event) => event.contentStatus === 'approved' && event.access === 'public')
    .map((event) => `/events/${event.slug}`);
  const resources = RESOURCES.filter(
    (resource) =>
      resource.contentStatus === 'approved' &&
      resource.visibility === 'public' &&
      resource.publishedAt &&
      (resource.publicBody?.length ?? 0) > 0,
  ).map((resource) => `/resources/${resource.slug}`);
  return [...events, ...resources];
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function seoFiles(env) {
  const contentMode = parseContentMode(env.PUBLIC_CONTENT_MODE);
  const { config } = resolvePublicConfig(env);
  // `seoContext`, not `{ siteUrl: config.siteUrl }`: the sitemap is the single
  // most damaging artifact to publish at an unapproved host, because it hands a
  // crawler every URL on it at once.
  const context = seoContext(config.siteUrl, contentMode);
  const paths = detailPaths(contentMode);
  return {
    contentMode,
    context,
    detail: paths,
    robots: robotsTxt(context),
    sitemap: sitemapXml(PUBLIC_ROUTES, context, paths),
    listed: sitemapRoutes(PUBLIC_ROUTES, context).map((route) => route.path),
  };
}

/**
 * A sitemap must never list a page that is noindex. The two are derived from
 * one function so they cannot drift, but a wrong edit to that function would
 * break both at once - so assert the property here too, against the built
 * artifact's own inputs.
 */
function assertNoNoindexInSitemap({ context, listed, detail }) {
  const problems = [];
  for (const path of listed) {
    const route = PUBLIC_ROUTES.find((candidate) => candidate.path === path);
    const reason = indexability(route, context);
    if (reason !== 'indexable') {
      problems.push(`sitemap lists ${path}, which is noindex (${reason})`);
    }
  }
  for (const path of detail) {
    if (!path.startsWith('/events/') && !path.startsWith('/resources/')) {
      problems.push(`sitemap lists ${path}, which is not a known detail path`);
    }
  }
  return problems;
}

async function main() {
  const argv = process.argv.slice(2);
  const check = argv.includes('--check');
  const outIndex = argv.indexOf('--out');
  const outDir = resolve(
    fileURLToPath(ROOT),
    outIndex === -1 ? 'dist' : (argv[outIndex + 1] ?? 'dist'),
  );

  const result = await seoFiles(process.env);
  const robotsPath = resolve(outDir, 'robots.txt');
  const sitemapPath = resolve(outDir, 'sitemap.xml');

  const problems = assertNoNoindexInSitemap(result);

  if (!(await exists(outDir))) {
    console.error(`FAIL  ${outDir} does not exist. Run a build first.`);
    process.exit(1);
  }

  if (check) {
    const actualRobots = (await exists(robotsPath)) ? await readFile(robotsPath, 'utf8') : null;
    if (actualRobots !== result.robots) {
      problems.push(
        actualRobots === null
          ? 'robots.txt is missing from the build'
          : 'robots.txt in the build does not match what the current configuration produces',
      );
    }
    const hasSitemap = await exists(sitemapPath);
    if (result.sitemap === null && hasSitemap) {
      problems.push(
        'sitemap.xml exists in the build, but the current configuration produces none ' +
          (result.context.originUnapproved
            ? '(an origin is configured but not APPROVED - owner item B-7)'
            : '(no PUBLIC_SITE_URL)'),
      );
    }
    if (result.sitemap !== null) {
      const actual = hasSitemap ? await readFile(sitemapPath, 'utf8') : null;
      if (actual !== result.sitemap) {
        problems.push(
          hasSitemap
            ? 'sitemap.xml in the build does not match what the current configuration produces'
            : 'sitemap.xml is missing from the build',
        );
      }
    }
  } else {
    await writeFile(robotsPath, result.robots, 'utf8');
    if (result.sitemap === null) {
      // Remove a sitemap left by an earlier build that HAD an origin. Without
      // this, robots.txt (no Sitemap line) and the output would disagree.
      await rm(sitemapPath, { force: true });
    } else {
      await writeFile(sitemapPath, result.sitemap, 'utf8');
    }
  }

  if (problems.length > 0) {
    console.error('SEO FILES FAILED\n');
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const verb = check ? 'OK   ' : 'WROTE';
  console.log(`${verb} robots.txt        ${result.contentMode} mode`);
  // Say WHICH absent state this is. "No origin configured" and "an origin is
  // configured that nobody approved" produce the same empty output and need
  // completely different remedies, and reporting them identically is how the
  // second one went unnoticed.
  const noOrigin = result.context.originUnapproved
    ? 'an origin is configured but NOT APPROVED (owner item B-7), so no absolute URL may be published at it'
    : 'no PUBLIC_SITE_URL configured (owner item B-7), so no absolute URLs exist to list';
  console.log(
    result.sitemap === null
      ? `SKIP  sitemap.xml       ${noOrigin}`
      : `${verb} sitemap.xml       ${result.listed.length + result.detail.length} URLs`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
