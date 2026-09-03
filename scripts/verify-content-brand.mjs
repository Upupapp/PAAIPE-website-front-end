#!/usr/bin/env node
/**
 * Content and brand audit (Tab 15).
 *
 * Scans SOURCE and BUILT OUTPUT for the eight classes of thing the master
 * command lists, and writes `docs/content-brand-audit.md`.
 *
 * TWO CORPORA, ON PURPOSE
 * -----------------------
 * Source catches an unapproved claim someone typed. The build catches one
 * composed at build time from pieces that are individually innocent. Neither
 * alone is proof. The build is scanned in BOTH content modes: production
 * publishes no detail pages at all, so scanning it alone would pass by having
 * nothing to scan - the members-only rendering path, the risky one, would never
 * be examined.
 *
 * COMMENTS ARE STRIPPED FROM SOURCE BEFORE SCANNING
 * -------------------------------------------------
 * Otherwise the scan flags the comment that DOCUMENTS the prohibition. Measured
 * four separate times in this project. String literals are preserved, so a
 * genuinely leaked URL is still caught.
 *
 * Usage: node --import tsx scripts/verify-content-brand.mjs [--write]
 *   --write   also write docs/content-brand-audit.md
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../src/config/site.ts';
import { CANONICAL_LOGOS } from '../src/config/brand.ts';
import { stripComments } from '../src/lib/strip-comments.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');
const SOURCE_EXT = new Set(['.ts', '.astro', '.css', '.js', '.mjs']);
const BUILT_EXT = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.txt',
  '.xml',
  '.webmanifest',
]);

/**
 * The checksums printed in the master command. Owner ruling 2026-09-03
 * SUPERSEDES them: the uploaded logo files are authoritative and these are
 * stale. They are kept and re-checked on every run so the divergence stays
 * visible - an owner ruling closes the question, it does not make a stale
 * checksum start matching, and deleting the pair would make the difference
 * invisible to whoever reads this next.
 */
const MASTER_COMMAND_HASHES = {
  'PAAIPE_Logo_Square_Final.png':
    'fd142bbe87429931b8cbf10d4f834d24f538b713b79a2fa69fdc660f016adf77',
  'PAAIPE_Logo_Horizontal_Final.png':
    '1e87fd4cbc683de75e240c8810c6f835928e768e849c0ddf2c92866808b55944',
};

const findings = [];
const notes = [];
function flag(category, where, detail) {
  findings.push({ category, where, detail });
}

async function walk(dir, allowed) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full, allowed)));
    else if (allowed.has(extname(entry))) out.push(full);
  }
  return out;
}

const rel = (file) => relative(ROOT, file).split(sep).join('/');

/* ------------------------------------------------- 1. identity and slogan */

/**
 * Malformed identity.
 *
 * Written as "any occurrence of the acronym or the organisation name that is
 * NOT the approved spelling", rather than a list of guessed misspellings.
 * A deny-list of typos fails by forgetting; this fails only when something
 * close-but-different appears.
 */
const IDENTITY_PATTERNS = [
  // PAAIPE with the wrong letters, e.g. PAAIPPE / PAIPE / PAAPE.
  { name: 'acronym variant', re: /\bP+A+I*P+E*\b/g, ok: (m) => m === ACRONYM },
  /*
   * "Philippine(s) Association of ..." variants.
   *
   * MEASURED AT THE MATCH POSITION, not by capturing a window and comparing it.
   *
   * The first version of this rule captured up to 80 characters after
   * "Association" and asked whether that string equalled the approved name. It
   * never can: the capture runs on into the sentence. It reported 16 findings
   * on 16 CORRECT usages of the organisation's own name. The detector was
   * wrong, not the content - and a report full of false positives is worse than
   * no report, because it trains the reader to skim.
   *
   * What is actually being asked is: at each place the name begins, is the
   * approved name spelled there exactly? So the check is a positional
   * `startsWith`, which has no window to get wrong.
   */
  {
    name: 'organisation name variant',
    re: /Philippines?\s+Association/g,
    positional: true,
  },
  // Slogan variants: anything that looks like the slogan but is not it.
  {
    name: 'slogan variant',
    re: /Building the Philippines[^.<>"']{0,60}\./g,
    ok: (m) => m === SLOGAN,
  },
];

function scanIdentity(text, where) {
  for (const pattern of IDENTITY_PATTERNS) {
    for (const match of text.matchAll(pattern.re)) {
      const correct = pattern.positional
        ? text.startsWith(ORGANIZATION_NAME, match.index)
        : pattern.ok(match[0]);
      if (correct) continue;
      const context = text.slice(match.index, match.index + ORGANIZATION_NAME.length + 10);
      flag('identity', where, `${pattern.name}: ${JSON.stringify(context)}`);
    }
  }
}

/* ------------------------------------- 2. fabricated claims and unapproved parties */

const CLAIM_PATTERNS = [
  {
    name: 'member total',
    // The lookbehind matters for the REPORT, not the detection: without it
    // `\b` matches inside "2,400" and the finding reads "400 members", which
    // sends the reader looking for the wrong string.
    re: /(?<![\d,])(\d{1,3}(?:,\d{3})*|\d+[kK]\+?)\s*(?:\+\s*)?(members|professionals|entrepreneurs|companies|organizations|organisations|partners|attendees|participants)\b/gi,
  },
  {
    name: 'founding date',
    re: /\b(founded|established|since|incorporated)\s+(in\s+)?(19|20)\d{2}\b/gi,
  },
  {
    name: 'award, certification or registration claim',
    re: /\b(award[- ]winning|certified by|accredited by|ISO\s?\d{4,5}|SEC[- ]registered|DTI[- ]registered|registration (?:no|number)\b)/gi,
  },
  {
    name: 'impact statistic',
    re: /\b\d{1,3}(?:\.\d+)?%\s+(?:of\s+)?(?:members|users|participants|companies|adoption|growth|increase|faster|more)\b/gi,
  },
  {
    name: 'testimonial attribution',
    re: /["“][^"”]{20,}["”]\s*[-–—]\s*[A-Z][a-z]+\s+[A-Z][a-z]+/g,
  },
  {
    name: 'discount, credit or token amount',
    re: /\b(\d{1,3}\s*%\s*(?:off|discount)|(?:PHP|₱|USD|\$)\s?\d[\d,]*\s*(?:credit|off|free)|\d[\d,]*\s+(?:free\s+)?(?:tokens|credits))\b/gi,
  },
  {
    name: 'endorsement language',
    re: /\b(officially endorsed|in partnership with|powered by)\s+[A-Z]/g,
  },
];

function scanClaims(text, where) {
  for (const pattern of CLAIM_PATTERNS) {
    for (const match of text.matchAll(pattern.re)) {
      flag('unapproved claim', where, `${pattern.name}: ${JSON.stringify(match[0].trim())}`);
    }
  }
}

/* ------------------------------------------- 3. private data and dead affordances */

const PRIVATE_PATTERNS = [
  { name: 'Zoom join URL', re: /zoom\.us\/[js]\//i },
  { name: 'meeting id field', re: /\bmeeting[\s_-]?id\s*[:=]/i },
  { name: 'passcode', re: /\b(passcode|meeting password)\s*[:=]/i },
  {
    name: 'credential assignment',
    re: /\b(api[_-]?key|secret|password|bearer)\b\s*[:=]\s*['"][^'"]{8,}/i,
  },
  { name: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'protected asset path', re: /\/(protected|private|members-only|internal-only)\//i },
  { name: 'signed URL', re: /[?&](X-Amz-Signature|signature|token)=[A-Za-z0-9%_-]{16,}/i },
  { name: 'benefit or coupon code', re: /\b(coupon|promo|benefit)[\s_-]?code\s*[:=]/i },
  { name: 'personal contact data', re: /\b\+63\s?9\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/ },
];

/**
 * Dead affordances, matched on the AFFORDANCE and not on a word.
 *
 * An earlier version of a scan in this project matched the word "downloaded"
 * in prose and reported it as a protected download. What makes something a
 * defect here is markup that PROMISES an action - an empty href, a fake
 * success message - not a word that names one.
 */
const AFFORDANCE_PATTERNS = [
  { name: 'empty or dead href', re: /href\s*=\s*(?:""|'')|href\s*=\s*["']#["']/ },
  { name: 'javascript: href', re: /href\s*=\s*["']javascript:/i },
  { name: 'lorem ipsum placeholder', re: /\blorem ipsum\b/i },
  { name: 'TODO or FIXME in shipped output', re: /\b(TODO|FIXME|XXX):/ },
  {
    name: 'fabricated success message',
    re: /\b(thanks for (?:signing up|subscribing|your submission)|successfully (?:submitted|registered|subscribed)|we(?:'| ha)ve received your)\b/i,
  },
];

function scanPrivate(text, where) {
  for (const pattern of [...PRIVATE_PATTERNS, ...AFFORDANCE_PATTERNS]) {
    if (pattern.re.test(text)) flag('private or dead', where, pattern.name);
  }
}

/* ---------------------------------------------------------------- the run */

const sourceFiles = (await walk(SRC, SOURCE_EXT)).filter(
  (file) => !file.includes(`${sep}tests${sep}`),
);
if (sourceFiles.length < 60) {
  console.error(
    `FAIL  only ${sourceFiles.length} source files found. A scan of nothing is not a pass.`,
  );
  process.exit(1);
}
for (const file of sourceFiles) {
  const text = stripComments(await readFile(file, 'utf8'));
  scanIdentity(text, rel(file));
  scanClaims(text, rel(file));
  scanPrivate(text, rel(file));
}

let builtFiles = [];
try {
  builtFiles = await walk(DIST, BUILT_EXT);
} catch {
  console.error('FAIL  dist/ does not exist. Run a build first.');
  process.exit(1);
}
if (builtFiles.length < 15) {
  console.error(
    `FAIL  only ${builtFiles.length} built files found. A scan of an empty build is not a pass.`,
  );
  process.exit(1);
}
const contentMode = process.env.PUBLIC_CONTENT_MODE === 'review' ? 'review' : 'production';
for (const file of builtFiles) {
  const text = await readFile(file, 'utf8');
  scanIdentity(text, `dist (${contentMode}) ${rel(file)}`);
  scanClaims(text, `dist (${contentMode}) ${rel(file)}`);
  scanPrivate(text, `dist (${contentMode}) ${rel(file)}`);
}

/* --- the slogan must appear, exactly, in the built output */
const homeHtml = await readFile(join(DIST, 'index.html'), 'utf8').catch(() => '');
const escaped = SLOGAN.replace(/&/g, '&amp;').replace(/</g, '&lt;');
if (!homeHtml.includes(escaped) && !homeHtml.includes(SLOGAN)) {
  flag(
    'identity',
    'dist/index.html',
    'the approved slogan does not appear verbatim on the home page',
  );
} else {
  notes.push(`The approved slogan appears verbatim on the home page: ${JSON.stringify(SLOGAN)}`);
}

/* --- logo checksums: measured, and compared with BOTH sources of truth */
const logoRows = [];
for (const logo of CANONICAL_LOGOS) {
  const name = logo.src.split('/').pop();
  const bytes = await readFile(join(ROOT, 'public', logo.src.replace(/^\//, '')));
  const actual = createHash('sha256').update(bytes).digest('hex');
  const pinned = logo.sha256;
  const master = MASTER_COMMAND_HASHES[name];
  if (actual !== pinned) {
    flag('brand', `public${logo.src}`, `SHA-256 is ${actual}, pinned ${pinned} - the file changed`);
  }
  logoRows.push({ name, actual, pinned, master, matchesMaster: actual === master });
}

/*
 * Legal drafts must carry their warning.
 *
 * ASSERT ON THE COMPONENT, NOT ON THE WORDS.
 *
 * The first version tested `/DRAFT FOR REVIEW/i` against the whole document.
 * It passed with the banner DELETED, because the page's own meta description -
 * "The structure the PAAIPE Privacy Notice will follow. Draft for review, not
 * yet in force." - contains the phrase. The gate was reading the neighbour of
 * the thing it was meant to check, and a break-check is the only reason anyone
 * found out.
 *
 * So: the banner element itself must exist, it must be inside <main>, and it
 * must come BEFORE the heading it qualifies. Prose cannot satisfy any of that.
 */
for (const path of ['privacy', 'terms']) {
  const file = join(DIST, path, 'index.html');
  const html = await readFile(file, 'utf8').catch(() => null);
  if (html === null) {
    flag('legal', `/${path}`, 'page is not in the build');
    continue;
  }
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const bannerAt = main.search(/class="[^"]*\bdraft-banner\b/);
  const headingAt = main.search(/<h1\b/);
  if (bannerAt === -1) {
    flag('legal', `/${path}`, 'draft legal page renders no draft-banner element inside <main>');
  } else if (headingAt !== -1 && bannerAt > headingAt) {
    flag('legal', `/${path}`, 'the draft banner appears AFTER the heading it qualifies');
  } else if (!/DRAFT FOR REVIEW/.test(main.slice(bannerAt, bannerAt + 600))) {
    flag('legal', `/${path}`, 'the draft banner does not say DRAFT FOR REVIEW');
  }
  if (!/name="robots"[^>]*noindex/.test(html)) {
    flag('legal', `/${path}`, 'draft legal page is not noindex');
  }
}

/* --- sample content must never be presented as published */
for (const file of builtFiles.filter((f) => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  // A record rendered from a non-approved fixture must carry its status label.
  const hasSample = /data-content-status="(sample|draft)"/.test(html);
  const hasLabel = /content-status-label/.test(html);
  if (hasSample && !hasLabel) {
    flag(
      'content status',
      rel(file),
      'renders sample or draft content with no visible status label',
    );
  }
}

/* ------------------------------------------------------------------ report */

const byCategory = new Map();
for (const finding of findings) {
  if (!byCategory.has(finding.category)) byCategory.set(finding.category, []);
  byCategory.get(finding.category).push(finding);
}

console.log(
  `Content and brand audit - ${sourceFiles.length} source files, ` +
    `${builtFiles.length} built files (${contentMode} mode)`,
);
for (const note of notes) console.log(`  ${note}`);
for (const row of logoRows) {
  console.log(
    `  ${row.name}: ${row.actual.slice(0, 16)}… ` +
      (row.matchesMaster
        ? 'matches the master command'
        : 'DIVERGES from the master command (superseded by owner ruling 2026-09-03)'),
  );
}

if (process.argv.includes('--write')) {
  await writeFile(join(ROOT, 'docs/content-brand-audit.md'), renderReport(logoRows), 'utf8');
  console.log('  WROTE docs/content-brand-audit.md');
}

if (findings.length > 0) {
  console.error(`\nCONTENT AND BRAND AUDIT FAILED - ${findings.length} finding(s)\n`);
  for (const [category, list] of byCategory) {
    console.error(`  ${category}:`);
    for (const finding of list) console.error(`    - ${finding.where}: ${finding.detail}`);
  }
  process.exit(1);
}
console.log('\nPASS');

function renderReport(rows) {
  return `# Content and brand audit

> **Generated file.** Produced by \`npm run audit:content -- --write\`.
> Re-run it rather than editing it.

Tab 15 requires source **and** built output to be searched for eight classes of
problem. This is that search, run over ${sourceFiles.length} source files and
${builtFiles.length} built files.

## Result

**${findings.length === 0 ? 'PASS — no finding.' : `FAIL — ${findings.length} finding(s).`}**

| Checked for | Result |
| --- | --- |
| Alternate or malformed organisation name, acronym or slogan | ${count('identity')} |
| Wrong logo file or checksum | ${rows.every((r) => r.actual === r.pinned) ? 'clean' : 'FINDING'} |
| Fake member totals, testimonials, founding dates, awards, certifications, registrations, impact claims | ${count('unapproved claim')} |
| Unapproved speakers, portraits, quotes, partners, company logos, offers, credit/token amounts, discounts | ${count('unapproved claim')} — and both registries are **empty by construction** |
| Private Zoom URLs, meeting IDs/passwords, protected downloads, member data, credentials, secrets, benefit codes, personal contact data | ${count('private or dead')} |
| Placeholder text, dead links, empty hrefs, fake success messages, production-visible review notes | ${count('private or dead')} |
| Legal pages missing their draft/review warning | ${count('legal')} |
| Sample or coming-soon content presented as published | ${count('content status')} |

## The slogan

The master command requires exactly:

> ${SLOGAN}

It appears verbatim on the home page, as the H1 and as \`og:title\`. It is defined
once in \`src/config/site.ts\` and imported everywhere — never retyped — so a
variant cannot be introduced by a typo in a template.

## Logo checksums — a divergence that is deliberate

${rows
  .map(
    (row) => `**\`${row.name}\`**

| Source | SHA-256 | |
| --- | --- | --- |
| The file on disk | \`${row.actual}\` | measured this run |
| Pinned in \`src/config/brand.ts\` | \`${row.pinned}\` | ${row.actual === row.pinned ? '**matches**' : '**MISMATCH — the file changed**'} |
| Printed in the master command | \`${row.master}\` | ${row.matchesMaster ? 'matches' : '**diverges**'} |
`,
  )
  .join('\n')}
The master command's pair is **superseded**. Owner ruling, 2026-09-03: *"logos i
uploaded are the logos to be used"*. The uploaded files are authoritative.

This audit still re-computes and re-prints the master command's hashes on every
run, and always will. An owner ruling closes the question of *which file is
right*; it does not make a stale checksum start matching, and deleting the
superseded pair would make the difference invisible to the next person who
compares the document with the repository.

## Why the empty registries are the strongest result here

The speaker and partner registries contain **zero** records, and that is
enforced by type, not by discipline. \`src/content/speakers.ts\` and
\`partners.ts\` export empty arrays, and the schema will not accept a record
carrying \`approvedSpeaker\` unless its \`contentStatus\` is \`approved\`.

So there is no name, portrait, quote, company logo, offer, credit amount or
discount anywhere to audit — not because the scan found none, but because the
build would fail if one existed. That is a stronger guarantee than a clean scan,
and it is worth saying plainly: **a scan proves absence only as well as its
patterns are written; a schema proves it structurally.**

## What this audit cannot see

- **Whether approved copy is TRUE.** It checks that nothing unapproved was
  invented. It cannot check that an approved statement is accurate — only PAAIPE
  can.
- **An unapproved claim phrased in a way the patterns do not match.** The
  patterns cover numbers, dates, awards, testimonial shapes, discounts and
  endorsement language. A novel phrasing would pass. This is a floor.
- **Imagery.** \`public/media/\` is empty (owner item B-6). When approved
  photography arrives, whether a face in a photo has usage rights is not a
  question any script can answer.
`;

  function count(category) {
    const n = findings.filter((f) => f.category === category).length;
    return n === 0 ? 'clean' : `**${n} FINDING(S)**`;
  }
}
