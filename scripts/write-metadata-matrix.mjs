#!/usr/bin/env node
/**
 * Generate `docs/metadata-matrix.md` from the route registry.
 *
 * WHY IT IS GENERATED
 * -------------------
 * The last two hand-written tables in this repository went stale without
 * anyone noticing: the README tab table was three tabs behind and
 * docs/PENDING.md was seven. A metadata matrix is exactly the kind of document
 * that rots - it restates twenty routes' worth of facts that live somewhere
 * else. So it is derived, and `--check` fails the build if the committed file
 * and the registry disagree.
 *
 * Usage: node --import tsx scripts/write-metadata-matrix.mjs [--check]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PUBLIC_ROUTES } from '../src/config/routes.ts';
import {
  DEFAULT_SOCIAL,
  ROUTE_DESIGN_INTENT,
  SOCIAL_CARD,
  indexability,
  pageSeo,
} from '../src/lib/seo.ts';

const TARGET = new URL('../docs/metadata-matrix.md', import.meta.url);

/** A row count floor: an empty parse must not be able to pass as a match. */
const MINIMUM_ROWS = 15;

const REASONS = {
  indexable: 'indexed',
  'review-build': 'noindex - review build',
  internal: 'not built in production',
  placeholder: 'noindex - placeholder',
  'dynamic-template': 'noindex - template',
  'error-page': 'noindex - error page',
  'draft-content': 'noindex - draft content',
  'unapproved-content': 'noindex - record not approved',
  'registration-route': 'noindex, follow - registration route',
};

/**
 * An unknown reason must FAIL, not render an empty cell.
 *
 * `registration-route` was added to `indexability()` in Tab 01 and never added
 * here, so for three tabs this table printed a BLANK indexability cell for
 * `/events/[slug]/register` - the one row where "is this indexed?" matters most,
 * because it is the page that will collect an email address. Nothing failed:
 * `REASONS[reason]` was `undefined`, the cell rendered empty, and
 * `metadata:check` compared the document to itself and agreed.
 *
 * A lookup that returns undefined for an unmapped key produces a document that
 * is silently incomplete. Throwing means the next reason added to the union
 * cannot reach this table unlabelled.
 */
function reasonLabel(reason) {
  const label = REASONS[reason];
  if (label === undefined) {
    throw new Error(
      `No matrix label for indexability reason "${reason}". Add it to REASONS in ` +
        'scripts/write-metadata-matrix.mjs rather than letting the cell render empty.',
    );
  }
  return label;
}

function escapeCell(value) {
  return value.replace(/\|/g, '\\|');
}

export function render() {
  const rows = PUBLIC_ROUTES.map((route) => {
    const reason = indexability(route, ROUTE_DESIGN_INTENT);
    const seo = pageSeo(route, ROUTE_DESIGN_INTENT);
    return [
      `\`${route.path}\``,
      escapeCell(seo.title),
      route.titleSource === 'derived' ? 'derived' : route.titleSource,
      seo.description ? escapeCell(seo.description) : '_none_',
      reasonLabel(reason),
      escapeCell(seo.social.title),
    ];
  });

  if (rows.length < MINIMUM_ROWS) {
    throw new Error(`Only ${rows.length} routes found; expected at least ${MINIMUM_ROWS}.`);
  }

  const indexed = PUBLIC_ROUTES.filter(
    (route) => indexability(route, ROUTE_DESIGN_INTENT) === 'indexable',
  );

  return `# Route metadata matrix

> **Generated file.** Produced from \`src/config/routes.ts\` by
> \`npm run metadata:write\`. \`npm run metadata:check\` fails if it drifts.
> Edit the registry, not this document.

${PUBLIC_ROUTES.length} routes are declared. ${indexed.length} are indexed in a production build.

## Per-route metadata

| Route | Title | Title source | Meta description | Indexability | Social title |
| --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}

## Defaults

These apply wherever a route supplies no override. Every value is composed from
\`src/config/site.ts\`, not retyped, so a change to the approved identity cannot
leave a stale copy behind.

| Field | Value |
| --- | --- |
| Social title | ${escapeCell(DEFAULT_SOCIAL.title)} |
| Social description | ${escapeCell(DEFAULT_SOCIAL.description)} |
| Social image alt | ${escapeCell(DEFAULT_SOCIAL.imageAlt)} |
| Social image | \`${SOCIAL_CARD.path}\` (${SOCIAL_CARD.width}x${SOCIAL_CARD.height} ${SOCIAL_CARD.type}) |

## What is absent, and why

**Canonical URLs, \`og:url\`, \`og:image\` and the sitemap are not emitted.**
Each needs an absolute URL, and \`PUBLIC_SITE_URL\` is not configured - owner
item **B-7**. A guessed origin would be worse than none: a canonical tag tells
a crawler the authoritative address of a page, and a wrong one de-indexes the
real page. \`twitter:card\` degrades from \`summary_large_image\` to \`summary\`
for the same reason, rather than declaring an image it cannot supply.

Set \`PUBLIC_SITE_URL\` and all of it appears with no code change.
\`src/tests/seo.test.ts\` asserts that configured state, since no build on a
developer machine reaches it.

**\`hreflang\` alternates are not emitted.** There is no translated version of
this site. Declaring one would point crawlers at pages that do not exist.

**No \`Event\`, \`Article\`, \`BlogPosting\`, \`Offer\`, \`AggregateRating\` or
\`Review\` structured data is emitted.** Nothing in the content registry is
\`approved\`, so every one of those would be a fabricated claim in
machine-readable form. The builders exist and are tested; they return \`null\`.

**No \`og:image\` text.** The branded card is the exact approved logo on brand
navy, with no rendered words, because no typeface is approved - owner item
**B-5**. The words are carried by \`og:image:alt\` and \`og:title\`, where they
need no font.
`;
}

async function main() {
  const check = process.argv.includes('--check');
  const expected = render();

  if (!check) {
    await writeFile(fileURLToPath(TARGET), expected, 'utf8');
    console.log(`WROTE docs/metadata-matrix.md  (${PUBLIC_ROUTES.length} routes)`);
    return;
  }

  let actual;
  try {
    actual = await readFile(fileURLToPath(TARGET), 'utf8');
  } catch {
    console.error('FAIL  docs/metadata-matrix.md is missing. Run npm run metadata:write.');
    process.exit(1);
  }
  if (actual !== expected) {
    console.error(
      'FAIL  docs/metadata-matrix.md is out of date with src/config/routes.ts.\n' +
        '      Run npm run metadata:write and commit the result.',
    );
    process.exit(1);
  }
  console.log(`OK    docs/metadata-matrix.md  (${PUBLIC_ROUTES.length} routes)`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
