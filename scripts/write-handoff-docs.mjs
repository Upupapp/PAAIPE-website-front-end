#!/usr/bin/env node
/**
 * Generate the three Tab 16 handoff documents that are DERIVED from
 * configuration: the route/content map, the configuration reference, and the
 * social-preview contact sheet.
 *
 * Generated for the same reason every other derived document here is: the two
 * hand-written tables in this repository went three and seven tabs stale
 * without anyone noticing. `--check` fails when a document and its source
 * disagree.
 *
 * Usage: node --import tsx scripts/write-handoff-docs.mjs [--check]
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
import { PUBLIC_CONFIG_KEYS } from '../src/config/public-config.ts';
import { RELEASE_INPUTS } from '../src/config/release.ts';

const DOCS = new URL('../docs/', import.meta.url);
const MINIMUM_ROUTES = 15;

const SOURCE_LABELS = {
  'tab-05': 'Tab 05 (approved)',
  'tab-06': 'Tab 06 (approved)',
  'tab-07': 'Tab 07 (approved)',
  'tab-08': 'Tab 08 (approved)',
  'tab-09': 'Tab 09 (approved)',
  'tab-10': 'Tab 10 (approved)',
  'tab-14': 'Tab 14 (approved)',
  derived: '**derived — needs approval (B-3)**',
};

const INDEXABILITY_LABELS = {
  indexable: 'indexed',
  'review-build': 'noindex (review build)',
  internal: 'not built in production',
  placeholder: 'noindex (placeholder)',
  'dynamic-template': 'noindex (template)',
  'error-page': 'noindex (error page)',
  'draft-content': 'noindex (draft content)',
  'unapproved-content': 'noindex (record not approved)',
};

const cell = (value) => value.replace(/\|/g, '\\|');

/* ------------------------------------------------- route-content-map.md */

function routeContentMap() {
  const rows = PUBLIC_ROUTES.map((route) => {
    const reason = indexability(route, ROUTE_DESIGN_INTENT);
    const seo = pageSeo(route, ROUTE_DESIGN_INTENT);
    const approval =
      route.headingSource === 'derived' || route.titleSource === 'derived'
        ? 'Copy needs PAAIPE approval (B-3)'
        : route.noindexReason === 'draft-content'
          ? 'Legal text needs approval (B-9)'
          : 'Copy approved';
    return [
      `\`${route.path}\``,
      cell(route.heading),
      SOURCE_LABELS[route.headingSource] ?? route.headingSource,
      cell(seo.title),
      INDEXABILITY_LABELS[reason],
      route.ownedBy,
      approval,
    ];
  });

  if (rows.length < MINIMUM_ROUTES) {
    throw new Error(`Only ${rows.length} routes; expected at least ${MINIMUM_ROUTES}.`);
  }

  return `# Route and content map

> **Generated file.** Produced from \`src/config/routes.ts\` by
> \`npm run handoff:write\`. \`npm run handoff:check\` fails if it drifts.

Every route the frontend declares, with its H1, where that copy came from, its
browser title, whether it is indexed, which tab implemented it, and what still
needs PAAIPE's approval.

| Route | H1 | H1 source | Title | Indexability | Implemented in | Approval still needed |
| --- | --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}

## Where the content comes from

Nothing on a page is authored in the page. Every string is imported from a typed
registry under \`src/content/\`, validated by Zod **at module load** - so an
invalid record fails the build rather than rendering.

| Registry | Records | Notes |
| --- | --- | --- |
| \`organization.ts\` | identity, audiences, values, the signature event | Quoted verbatim from the master command |
| \`home.ts\` | the eleven home sections | |
| \`about.ts\`, \`programs.ts\` | about copy, 7 programmes | |
| \`events.ts\` | event fixtures | **None is \`approved\`** — a production build renders zero detail pages |
| \`resources.ts\` | 10 resource fixtures | **None is \`approved\`** — same |
| \`speakers.ts\` | **empty** | A name or portrait is a claim about a real person |
| \`partners.ts\` | **empty** | A logo is a claim about a real organisation |
| \`benefits.ts\`, \`faqs.ts\` | benefit categories, 7 FAQs | |
| \`policies.ts\` | \`/privacy\`, \`/terms\` | Both \`draft-for-review\` (B-9) |
| \`navigation.ts\`, \`legal.ts\` | nav and footer structure | |

## The two states that control publication

\`visibility\` says who content is **for**; \`contentStatus\` says whether it may be
**published**. They are independent, and both are enforced by schema rather than
by convention:

- a members-only event may not be \`registration-open\`;
- only an \`approved\` record may carry an approved speaker;
- a members-only resource may not carry public body copy;
- only an \`approved\` record may carry a publication date;
- a draft policy must carry a review banner.

Each of those refusals is a build failure, not a warning.
`;
}

/* ---------------------------------------------------- configuration.md */

const CONFIG_ROWS = {
  PUBLIC_SITE_URL: {
    what: 'The production origin',
    format: 'Absolute `https://` URL',
    fallback:
      'No canonical, `og:url`, `og:image` or `sitemap.xml` is emitted; `twitter:card` degrades to `summary`',
    blocker: 'B-7',
  },
  PUBLIC_MEMBERSHIP_APPLICATION_URL: {
    what: 'Where “Join PAAIPE” goes',
    format: 'Absolute `https://` URL',
    fallback: 'A disabled button plus a visible reason',
    blocker: 'B-4',
  },
  PUBLIC_MEMBER_PORTAL_URL: {
    what: 'Where “Member Sign In” goes',
    format: 'Absolute `https://` URL',
    fallback: 'A disabled button plus a visible reason',
    blocker: 'B-4',
  },
  PUBLIC_APPLICATION_STATUS_URL: {
    what: 'Where an applicant checks their status',
    format: 'Absolute `https://` URL',
    fallback: 'A disabled button plus a visible reason',
    blocker: 'B-4',
  },
  PUBLIC_SPEAKER_INTEREST_URL: {
    what: 'Where a speaker proposal goes',
    format: 'Absolute `https://` URL',
    fallback: 'A disabled button plus a visible reason',
    blocker: 'B-4',
  },
  PUBLIC_PARTNERSHIP_INTEREST_URL: {
    what: 'Where a partnership enquiry goes',
    format: 'Absolute `https://` URL',
    fallback: 'A disabled button plus a visible reason',
    blocker: 'B-4',
  },
  PUBLIC_CONTACT_EMAIL: {
    what: 'The public contact address',
    format: 'An email address',
    fallback: 'A disabled control plus a visible reason; no `mailto:` is invented',
    blocker: 'B-4',
  },
};

function configuration() {
  const missing = PUBLIC_CONFIG_KEYS.filter((key) => !(key in CONFIG_ROWS));
  if (missing.length > 0) {
    throw new Error(`Config keys with no documented row: ${missing.join(', ')}`);
  }

  return `# Configuration reference

> **Generated file.** Produced from \`src/config/public-config.ts\` by
> \`npm run handoff:write\`. A key added to the code with no row here fails the
> generator, so this cannot fall behind.

## Every value is PUBLIC

These are inlined into the built client at build time. **Never put a secret, a
token, a private Zoom link or a protected download URL here** — anything in this
file is readable by every visitor. \`npm run verify:leak\` scans the built bundle
and fails on a credential-shaped value.

Copy \`.env.example\` to \`.env\` and fill in what you have. **Every value is
optional.** A missing destination degrades to an honest unavailable state; it
never becomes \`#\`, an empty \`href\`, or a fabricated success.

| Name | What it is | Expected format | If it is absent | Blocker | Owner |
| --- | --- | --- | --- | --- | --- |
${PUBLIC_CONFIG_KEYS.map((key) => {
  const row = CONFIG_ROWS[key];
  return `| \`${key}\` | ${row.what} | ${row.format} | ${row.fallback} | ${row.blocker} | PAAIPE |`;
}).join('\n')}

| Name | What it is | Values | Default |
| --- | --- | --- | --- |
| \`PUBLIC_CONTENT_MODE\` | Which content a build may publish | \`production\` \\| \`review\` | \`production\` — the safe one, so an unconfigured build cannot publish fixtures |

## A malformed value is treated as ABSENT, and reported

This is deliberate and worth understanding before setting anything:

- a value that is not a valid absolute URL is **rejected**, not passed through;
- an \`http://\` URL is **rejected** as insecure, so a plaintext destination
  cannot ship as mixed content;
- a rejected value is reported at build time, so a typo surfaces rather than
  becoming a dead link.

The consequence: **setting a destination wrongly looks exactly like not setting
it.** The control stays disabled with its reason visible. That is the safe
failure, and \`npm run release:gate\` will still report the blocker as unmet —
which is the signal that something was set incorrectly.

## Current state

${RELEASE_INPUTS.map((input) => `- **${input.id}** — ${input.missing}. Supplied by ${input.suppliedBy}.`).join('\n')}

Run \`npm run release:gate\` for the live status; it reads the environment on
every run rather than trusting a recorded answer.
`;
}

/* ------------------------------------- social-preview-contact-sheet.md */

function socialContactSheet() {
  const indexable = PUBLIC_ROUTES.filter(
    (route) => indexability(route, ROUTE_DESIGN_INTENT) === 'indexable',
  );

  return `# Social preview contact sheet

> **Generated file.** Produced from \`src/config/routes.ts\` and \`src/lib/seo.ts\`
> by \`npm run handoff:write\`.

What each route sends to a social platform. This is the sheet to check before
anything is shared publicly.

## The card

| | |
| --- | --- |
| File | \`${SOCIAL_CARD.path}\` |
| Size | ${SOCIAL_CARD.width} × ${SOCIAL_CARD.height} (the Open Graph 1.91:1 slot) |
| Type | ${SOCIAL_CARD.type} |
| Alt text | ${DEFAULT_SOCIAL.imageAlt} |
| Built from | The exact approved horizontal logo rendition, composited on brand navy |
| Verified by | \`npm run verify:social\` — re-composites and compares pixels |

**It carries no rendered text.** The approved default social title is the
slogan, and setting it across the card would be the obvious thing to do — but no
typeface is approved (B-5), so it would mean choosing a face on PAAIPE's behalf
and baking it into an image that appears on every share. The words travel in
\`og:image:alt\` and \`og:title\`, where they need no font.

## Per-route preview copy

${indexable.length} indexed routes. Each row is what a platform reads.

| Route | og:title | og:description |
| --- | --- | --- |
${indexable
  .map((route) => {
    const seo = pageSeo(route, ROUTE_DESIGN_INTENT);
    return `| \`${route.path}\` | ${cell(seo.social.title)} | ${cell(seo.social.description)} |`;
  })
  .join('\n')}

## What is NOT emitted today, and why

\`og:url\` and \`og:image\` need an **absolute** URL. On a developer machine and in
this repository's own checks nothing sets one, so neither is emitted and
\`twitter:card\` is \`summary\` rather than \`summary_large_image\` — declaring a
large image the page cannot supply would produce a broken card.

**A share from a local build shows title and description, with no image.**
Setting \`PUBLIC_SITE_URL\` turns the image on with no code change;
\`src/tests/seo.test.ts\` covers that configured state, because no build on a
developer machine reaches it.

> **The deploy is a different case, and the difference is measurable.**
> \`netlify.toml [build.environment]\` commits
> \`PUBLIC_SITE_URL = "https://classy-quokka-2b788f.netlify.app"\`, and the owner
> approved that origin on 2026-09-04, so \`APPROVED_ORIGIN\` in
> \`src/config/site-origin.ts\` names it too. A build with that environment emits
> canonicals, \`og:url\`, \`og:image\`, a 12-URL sitemap and a \`Sitemap:\` line in
> \`robots.txt\`, all at that origin.
>
> **Configuring an origin is still not the same as approving one.** The two
> values are checked against each other, not merely for presence: if
> \`PUBLIC_SITE_URL\` and \`APPROVED_ORIGIN\` name different hosts, every absolute
> URL is withheld and every page sends \`noindex, follow\` until they agree. That
> is what a move to a custom domain looks like if only one half is updated — and
> a canonical left pointing at the old host tells crawlers the new site is a copy.

## Defaults

| Field | Value |
| --- | --- |
| Default social title | ${cell(DEFAULT_SOCIAL.title)} |
| Default social description | ${cell(DEFAULT_SOCIAL.description)} |
| Image alt | ${cell(DEFAULT_SOCIAL.imageAlt)} |

All three are composed from \`src/config/site.ts\` rather than retyped, so a
change to the approved identity cannot leave a stale copy behind.
`;
}

/* ------------------------------------------------------------------- main */

const DOCUMENTS = [
  ['route-content-map.md', routeContentMap],
  ['configuration.md', configuration],
  ['social-preview-contact-sheet.md', socialContactSheet],
];

async function main() {
  const check = process.argv.includes('--check');
  let drifted = 0;

  for (const [name, render] of DOCUMENTS) {
    const expected = render();
    const target = new URL(name, DOCS);
    if (!check) {
      await writeFile(fileURLToPath(target), expected, 'utf8');
      console.log(`WROTE docs/${name}`);
      continue;
    }
    let actual = null;
    try {
      actual = await readFile(fileURLToPath(target), 'utf8');
    } catch {
      /* reported below */
    }
    if (actual !== expected) {
      console.error(
        actual === null
          ? `FAIL  docs/${name} is missing. Run npm run handoff:write.`
          : `FAIL  docs/${name} is out of date with its source. Run npm run handoff:write.`,
      );
      drifted += 1;
    } else {
      console.log(`OK    docs/${name}`);
    }
  }

  if (drifted > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
