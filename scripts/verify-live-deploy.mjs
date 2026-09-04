#!/usr/bin/env node
/**
 * Verify a REAL deploy, over the network, at a URL you pass in.
 *
 * Everything this repository has claimed about production headers, caching and
 * status codes has been UNVERIFIED, because no site existed. This is what turns
 * those rows into measurements. It closes F-27, and it is the only thing that
 * can.
 *
 * WHY IT DRIVES THE LIVE URL AND NOT THE BUILD
 * --------------------------------------------
 * A local `dist/` proves what was produced. It cannot prove what is SERVED:
 * headers, redirects, compression and status codes are the host's, not the
 * build's. And a host with a catch-all can return 200 for a path that does not
 * exist - a trap this project has hit three times - so a "the page loads" check
 * passes for a site that is serving the wrong thing entirely.
 *
 * So it asserts on things a catch-all cannot fake: a MISSING asset must 404,
 * and a real page must carry content only that page has.
 *
 * Usage: node scripts/verify-live-deploy.mjs https://your-site.netlify.app
 */
import { PUBLIC_ROUTES } from '../src/config/routes.ts';
import { ROUTE_DESIGN_INTENT, indexability } from '../src/lib/seo.ts';

const base = process.argv[2]?.replace(/\/$/, '');
if (!base || !/^https?:\/\//.test(base)) {
  console.error(
    'Usage: node --import tsx scripts/verify-live-deploy.mjs https://your-site.netlify.app',
  );
  process.exit(2);
}

const failures = [];
const notes = [];
const fail = (message) => failures.push(message);

async function get(path, { method = 'GET' } = {}) {
  const url = `${base}${path}`;
  try {
    const response = await fetch(url, { method, redirect: 'manual' });
    return {
      ok: true,
      status: response.status,
      headers: response.headers,
      body: method === 'GET' ? await response.text() : '',
    };
  } catch (error) {
    // A network failure is UNVERIFIED, not a pass and not a site defect.
    return { ok: false, error: error.message };
  }
}

const indexed = PUBLIC_ROUTES.filter(
  (route) => indexability(route, ROUTE_DESIGN_INTENT) === 'indexable',
);

console.log(`Verifying the live deploy at ${base}\n`);

/* ------------------------------------------------- 1. every page is served */

let unreachable = 0;
for (const route of indexed) {
  const response = await get(route.path);
  if (!response.ok) {
    unreachable += 1;
    fail(`${route.path}: could not be reached — ${response.error}`);
    continue;
  }
  if (response.status !== 200) {
    /*
     * A 301 here is not "the page works after a redirect" - it is a redirect
     * that EVERY internal link pays for. This site links to `/about`, so if
     * `/about` redirects, every navigation costs an extra round trip before a
     * byte of the page arrives.
     *
     * MEASURED on the first live deploy: all eleven inner routes did exactly
     * that, because Astro's `directory` output emits `about/index.html` and the
     * host canonicalises `/about` to `/about/`. Fixed by emitting `about.html`
     * so the linked URL and the served URL are the same string.
     */
    const where = response.headers?.get('location');
    fail(
      `${route.path}: returned ${response.status}${where ? ` -> ${where}` : ''}, expected 200. ` +
        `Every internal link to this route pays the redirect.`,
    );
    continue;
  }
  // Assert on something ONLY this page has. A catch-all serving the home page
  // for every path would pass a status check and fail this.
  if (!response.body.includes(route.heading)) {
    fail(
      `${route.path}: returned 200 but does not contain its own H1 (${JSON.stringify(route.heading.slice(0, 40))}…). ` +
        `A catch-all may be serving a different page.`,
    );
  }
}

if (unreachable === indexed.length) {
  console.error(`FAIL  none of the ${indexed.length} routes could be reached. Is the URL right?\n`);
  for (const failure of failures.slice(0, 3)) console.error(`  - ${failure}`);
  process.exit(1);
}

/* ------------------------------------------------ 2. a missing path 404s */

const missingPage = await get('/this-path-does-not-exist-4f2a9c');
if (missingPage.ok && missingPage.status !== 404) {
  fail(
    `a missing PAGE returned ${missingPage.status}, not 404. A soft 404 tells crawlers the page exists.`,
  );
}
const missingAsset = await get('/_astro/does-not-exist-4f2a9c.js');
if (missingAsset.ok && missingAsset.status !== 404) {
  fail(
    `a missing ASSET returned ${missingAsset.status}, not 404. This is the catch-all trap: ` +
      `every broken asset reference would look fine.`,
  );
}

/* --------------------------------------------------------- 3. the headers */

const home = await get('/');
const REQUIRED_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
};

if (home.ok) {
  for (const [header, expected] of Object.entries(REQUIRED_HEADERS)) {
    const actual = home.headers.get(header);
    if (!actual) fail(`header ${header} is absent — netlify.toml is not in force`);
    else if (actual.toLowerCase() !== expected.toLowerCase()) {
      fail(`header ${header} is "${actual}", expected "${expected}"`);
    }
  }
  if (!home.headers.get('permissions-policy')) fail('header permissions-policy is absent');

  const hsts = home.headers.get('strict-transport-security');
  if (!hsts) fail('header strict-transport-security is absent');
  else notes.push(`HSTS is "${hsts}" — staged deliberately; raise it only after HTTPS is proven`);

  const csp = home.headers.get('content-security-policy');
  notes.push(
    csp
      ? `a CSP IS set: "${csp.slice(0, 80)}…" — check it allows the inline head script`
      : 'no CSP is set, as documented: the inline head script needs its SHA-256 hash in the policy',
  );
}

/* --------------------------------------------------------- 4. the caching */

if (home.ok) {
  const htmlCache = home.headers.get('cache-control') ?? '';
  if (!/max-age=0|no-store|must-revalidate/.test(htmlCache)) {
    fail(
      `HTML Cache-Control is "${htmlCache}" — HTML must not be cached, or a content fix never reaches anyone`,
    );
  }
}

// Find a real hashed asset from the served HTML rather than guessing a filename.
const assetMatch = home.ok ? home.body.match(/\/_astro\/[A-Za-z0-9._-]+\.(?:js|css)/) : null;
if (!assetMatch) {
  fail('no /_astro/ asset was referenced by the home page — cannot check immutable caching');
} else {
  const asset = await get(assetMatch[0]);
  if (asset.ok && asset.status === 200) {
    const cache = asset.headers.get('cache-control') ?? '';
    if (!/immutable/.test(cache) || !/max-age=31536000/.test(cache)) {
      fail(
        `${assetMatch[0]} Cache-Control is "${cache}", expected "public, max-age=31536000, immutable" — ` +
          `every repeat visit is re-downloading it and billing bandwidth`,
      );
    }
  } else if (asset.ok) {
    fail(
      `${assetMatch[0]} returned ${asset.status} — the page references an asset that is not served`,
    );
  }
}

const logo = await get('/brand/renditions/paaipe-horizontal-600.png');
if (logo.ok && logo.status === 200) {
  const cache = logo.headers.get('cache-control') ?? '';
  if (!/immutable/.test(cache)) {
    fail(`the logo Cache-Control is "${cache}" — it is the largest asset on all fifteen pages`);
  }
} else if (logo.ok) {
  fail(`the logo returned ${logo.status}`);
}

/* ------------------------------------------------- 5. robots and sitemap */

const robots = await get('/robots.txt');
if (robots.ok) {
  if (robots.status !== 200) fail(`/robots.txt returned ${robots.status}`);
  else {
    if (!/^Allow: \/$/m.test(robots.body)) fail('/robots.txt does not allow crawling');
    if (/^Disallow: \/$/m.test(robots.body)) {
      fail('/robots.txt DISALLOWS everything — a review build was deployed to production');
    }
    notes.push(
      robots.body.includes('Sitemap:')
        ? 'robots.txt points at a sitemap — PUBLIC_SITE_URL is configured on the host'
        : 'robots.txt has no Sitemap line — PUBLIC_SITE_URL is not set on the host (B-7)',
    );
  }
}

const sitemap = await get('/sitemap.xml');
const hasSitemap = sitemap.ok && sitemap.status === 200;
if (robots.ok && robots.body.includes('Sitemap:') && !hasSitemap) {
  fail('robots.txt points at /sitemap.xml but it does not resolve');
}
if (hasSitemap && !robots.body.includes('Sitemap:')) {
  fail('/sitemap.xml is served but robots.txt does not mention it');
}

/* ----------------------------------------------- 6. did the build publish */

if (home.ok) {
  const canonical = /<link rel="canonical"/.test(home.body);
  const ogImage = /property="og:image"/.test(home.body);
  notes.push(
    canonical
      ? 'a canonical IS emitted — PUBLIC_SITE_URL is set on the host'
      : 'no canonical is emitted — PUBLIC_SITE_URL is NOT set on the host (B-7). Set it in the Netlify environment and redeploy',
  );
  if (canonical !== ogImage) {
    fail('canonical and og:image disagree — one is emitted and the other is not');
  }
  if (/DRAFT FOR REVIEW/.test(home.body)) {
    fail('the HOME page carries a draft banner — a review build may have been deployed');
  }
}

/* -------------------------------------------------------------- report */

console.log(`  routes checked: ${indexed.length}`);
for (const note of notes) console.log(`  note: ${note}`);

if (failures.length > 0) {
  console.error(`\nLIVE DEPLOY CHECK FAILED — ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS — every route served, missing paths 404, headers and caching as configured.');
