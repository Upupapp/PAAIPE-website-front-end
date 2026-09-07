#!/usr/bin/env node
/**
 * Tab 10 Step 5 - the content-integrity scan, machine- and human-readable.
 *
 * WHAT THIS IS NOT: a summary of whether the other gates passed. A report that
 * reads its own suite's exit code and prints "all clear" is the shape this
 * repository has recorded three times - the gate measuring its own output. This
 * reads the BUILD, counts what it finds, and states the finding.
 *
 * WHAT IT DOES NOT DUPLICATE. `verify-event-boundary.mjs` is the sole home of
 * the twelve forbidden field names, and `scope-boundary.test.ts` owns the Zoom,
 * passcode and credential patterns. Redeclaring either here would put the
 * forbidden strings in a second file - which, as Tab 09 found, is itself a
 * violation of the guard that bans them. This scan therefore covers the
 * categories those two do NOT: fixture leakage, unapproved claims, dead
 * controls, and draft legal copy exposed as final.
 *
 * BOTH FORMATS FROM ONE PASS. The JSON is what a future CI step would read; the
 * Markdown is what a person reviews. Generating them from one traversal is the
 * only way they cannot disagree - two writers would drift, and the one nobody
 * runs would be the one that is wrong.
 *
 * Usage: node --import tsx scripts/write-integrity-scan.mjs [--check]
 */
import { readFileSync, writeFileSync, globSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { FORBIDDEN_ANALYTICS_PROPERTIES } from '../src/config/event-analytics.ts';

const MD_TARGET = new URL('../docs/events/content-integrity-scan.md', import.meta.url);
const JSON_TARGET = new URL('../docs/events/content-integrity-scan.json', import.meta.url);

/**
 * A floor on what a real build contains.
 *
 * Not a guessed count - Tab 09 tried that and the number was wrong on a
 * perfectly good build. These are files that MUST exist, so an empty or partial
 * scan cannot pass as a clean one.
 */
const REQUIRED_ARTIFACTS = ['dist/events.html', 'dist/index.html'];

/** Every category Step 5 names, with what "found" would mean for each. */
export const CATEGORIES = [
  {
    id: 'fixture-records',
    title: 'Draft or sample event records in production output',
    detail:
      'A review fixture reaching a production build would present an illustrative session as an announcement.',
    scan: (files) =>
      files
        .filter(([name]) => name.endsWith('.html'))
        .filter(([, text]) =>
          /sample-(public-open|members-open|waitlist|full|closed|cancelled|completed|not-open|rescheduled)/.test(
            text,
          ),
        )
        .map(([name]) => name),
  },
  {
    id: 'illustrative-label',
    title: 'Review watermark copy in production output',
    detail:
      'The illustrative label belongs only to a review build. In production it would either be a lie about real content, or evidence that fixtures shipped.',
    scan: (files) =>
      files
        .filter(([name]) => name.endsWith('.html'))
        .filter(([, text]) => text.includes('Illustrative preview'))
        .map(([name]) => name),
  },
  {
    id: 'participant-email',
    title: 'Participant email values',
    detail:
      'Only the non-deliverable placeholder you@example.com is permitted, and only as form placeholder copy.',
    scan: (files) => {
      const found = [];
      const address = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      for (const [name, text] of files) {
        for (const match of text.match(address) ?? []) {
          if (match === 'you@example.com') continue;
          // Schema.org and W3C vocabulary URLs are not addresses.
          if (match.includes('schema.org') || match.includes('w3.org')) continue;
          found.push(`${match} in ${name}`);
        }
      }
      return found;
    },
  },
  {
    id: 'unapproved-claim',
    title: 'Unapproved statistic, capacity, attendance or urgency claim',
    detail:
      'A seat count, an attendance figure or an urgency phrase would each be a fact PAAIPE has not supplied.',
    scan: (files) => {
      const claims = [
        /\b\d+\s+(seats?|places?|spots?)\s+(left|remaining|available)/i,
        /\b(only|just)\s+\d+\s+(seats?|places?|spots?)/i,
        /\b\d+[+]?\s+(attendees|participants|members)\s+(joined|attended|registered)/i,
        /\b(hurry|last chance|closing soon|almost full|selling fast)\b/i,
      ];
      const found = [];
      for (const [name, text] of files) {
        for (const claim of claims) {
          const match = text.match(claim);
          if (match) found.push(`"${match[0]}" in ${name}`);
        }
      }
      return found;
    },
  },
  {
    id: 'dead-control',
    title: 'Dead links and controls that pretend to work',
    detail:
      'An href="#" or a disabled-looking control that is keyboard-active invites an action the site cannot complete.',
    scan: (files) =>
      files
        .filter(([name]) => name.endsWith('.html'))
        .flatMap(([name, text]) => {
          const dead = text.match(/href=["']#["']/g) ?? [];
          return dead.length > 0 ? [`${dead.length} href="#" in ${name}`] : [];
        }),
  },
  {
    id: 'draft-legal-as-final',
    title: 'Draft legal copy exposed as final',
    detail:
      'A policy still awaiting review must say so on the page. A draft presented as in force is the failure mode with legal consequences.',
    scan: (files) => {
      const found = [];
      for (const [name, text] of files) {
        if (!/\/(privacy|terms)\.html$/.test(name)) continue;
        const saysDraft = /draft/i.test(text);
        if (!saysDraft) found.push(`${name} carries no draft marking`);
      }
      return found;
    },
  },
  {
    id: 'analytics-vendor',
    title: 'An analytics vendor in the build',
    detail:
      'This portal ships no analytics. A vendor script in an artifact would be telemetry nobody consented to.',
    scan: (files) => {
      const vendors = [
        'googletagmanager',
        'google-analytics',
        'segment.io',
        'plausible',
        'mixpanel',
      ];
      const found = [];
      for (const [name, text] of files) {
        const lower = text.toLowerCase();
        for (const vendor of vendors)
          if (lower.includes(vendor)) found.push(`${vendor} in ${name}`);
      }
      return found;
    },
  },
  {
    id: 'analytics-payload-key',
    title: 'A forbidden telemetry key in the build',
    detail:
      'Matched as a payload KEY rather than a bare word: this site legitimately says "email" in its privacy notice, its FAQ and its form label, and a guard nobody can keep green is a guard that gets deleted.',
    scan: (files) => {
      /*
       * The names are imported from the analytics config rather than restated,
       * so the allowlist module stays their sole home. Zoom, meeting-id and
       * passcode are deliberately NOT among them - `scope-boundary.test.ts`
       * bans those strings from every source file and artifact already, which
       * is strictly stronger.
       */
      const found = [];
      for (const [name, text] of files) {
        for (const key of FORBIDDEN_ANALYTICS_PROPERTIES) {
          if (new RegExp(`["']?${key}["']?\\s*:`, 'i').test(text)) {
            found.push(`${key} as a key in ${name}`);
          }
        }
      }
      return found;
    },
  },
  {
    id: 'production-mock-success',
    title: 'A production mock that reports registration success',
    detail:
      'No build may contain a code path that announces a completed registration without a confirmed gateway response.',
    scan: (files) => {
      const found = [];
      const success =
        /(registration (received|confirmed|complete)|you'?re registered|successfully registered)/i;
      for (const [name, text] of files) {
        const match = text.match(success);
        if (match) found.push(`"${match[0]}" in ${name}`);
      }
      return found;
    },
  },
];

function loadBuild() {
  const names = [
    ...globSync('dist/**/*.html'),
    ...globSync('dist/**/*.js'),
    ...globSync('dist/**/*.json'),
    ...globSync('dist/**/*.webmanifest'),
    ...globSync('dist/**/*.map'),
  ];
  return names.map((name) => [name, readFileSync(name, 'utf8')]);
}

export function scan() {
  const files = loadBuild();
  const names = files.map(([name]) => name);

  const missing = REQUIRED_ARTIFACTS.filter((required) => !names.includes(required));
  if (missing.length > 0) {
    throw new Error(
      `Build artifacts missing: ${missing.join(', ')}. Run \`npm run build\` first - ` +
        'an empty scan reports "no findings" exactly like a clean one.',
    );
  }

  const results = CATEGORIES.map((category) => {
    const findings = category.scan(files);
    return { ...category, findings, clear: findings.length === 0, scan: undefined };
  });

  return {
    scannedAt: 'derived from the build; see the run that produced it',
    fileCount: files.length,
    byteCount: files.reduce((total, [, text]) => total + text.length, 0),
    categories: results,
    clear: results.every((result) => result.clear),
  };
}

/**
 * A markdown table with padded columns.
 *
 * Prettier reformats tables to aligned columns, so a generator that emits
 * unpadded ones produces a file that `format:check` rejects the moment it is
 * written - and the only repairs are to exclude the generated file from
 * formatting, or to run the formatter over it by hand after every generation.
 * Emitting the aligned form is the version that stays true on its own.
 */
function table(headers, rows) {
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rows.map((row) => row[column].length)),
  );
  const line = (cells) =>
    `| ${cells.map((cell, column) => cell.padEnd(widths[column])).join(' | ')} |`;
  return [
    line(headers),
    `| ${widths.map((width) => '-'.repeat(width)).join(' | ')} |`,
    ...rows.map(line),
  ].join('\n');
}

function renderMarkdown(report) {
  const rows = table(
    ['Category', 'Result'],
    report.categories.map((category) => [
      category.title,
      category.clear ? 'clear' : `**${category.findings.length} finding(s)**`,
    ]),
  );

  const details = report.categories
    .filter((category) => !category.clear)
    .map(
      (category) =>
        `### ${category.title}\n\n${category.detail}\n\n` +
        category.findings.map((finding) => `- ${finding}`).join('\n'),
    )
    .join('\n\n');

  return (
    `# Content-integrity scan — Tab 10 Step 5

> **Generated file.** Produced from the build by
> \`scripts/write-integrity-scan.mjs\`. Re-run it rather than editing it.
> \`--check\` fails when the committed copy and a fresh scan disagree.

Scanned **${report.fileCount} build artifacts** (${Math.round(report.byteCount / 1024)} KiB of
text) across HTML, JavaScript, JSON, web manifests and source maps.

**Result: ${report.clear ? 'no findings.' : `${report.categories.filter((c) => !c.clear).length} category with findings.`}**

${rows}

## What this scan does NOT cover, and why

Two categories Step 5 names are owned by existing gates, and are deliberately
not re-implemented here:

- **The twelve forbidden private field names** — \`scripts/verify-event-boundary.mjs\`
  is their sole home. It reads the build for the same reason this does: a value
  can reach an artifact without any source file naming the field.
- **Zoom links, meeting ids, passcodes and credential-shaped assignments** —
  \`src/tests/scope-boundary.test.ts\` bans those strings from every source file
  and every artifact, which is strictly stronger than anything a second list
  could add.

Declaring either set again would place the forbidden strings in a third file,
which is itself what those guards exist to prevent. Tab 09 met that exact
collision and resolved it the same way.

${details ? `## Findings\n\n${details}\n` : ''}`
      .replace(/\n{3,}/g, '\n\n')
      // Exactly one trailing newline, which is what the formatter expects.
      .replace(/\s*$/, '\n')
  );
}

async function main() {
  const check = process.argv.includes('--check');
  const report = scan();
  const markdown = renderMarkdown(report);
  const json = `${JSON.stringify(report, null, 2)}\n`;

  if (!check) {
    writeFileSync(MD_TARGET, markdown);
    writeFileSync(JSON_TARGET, json);
    console.log(
      `WROTE docs/events/content-integrity-scan.{md,json}  (${report.fileCount} artifacts, ` +
        `${report.clear ? 'no findings' : 'FINDINGS PRESENT'})`,
    );
    return report.clear ? 0 : 1;
  }

  const currentMd = readFileSync(MD_TARGET, 'utf8');
  if (currentMd !== markdown) {
    console.error(
      'FAIL  docs/events/content-integrity-scan.md is out of date with the build.\n' +
        '      Run `npm run integrity:write` and commit the result.',
    );
    return 1;
  }
  if (!report.clear) {
    console.error('FAIL  the content-integrity scan found something. See the report.');
    return 1;
  }
  console.log(`OK    content-integrity scan  (${report.fileCount} artifacts, no findings)`);
  return 0;
}

/*
 * Entry-point guard. Importing this module must not RUN it - a previous script
 * here rebuilt the directory it was about to assert on, which made two guards
 * unable to fail.
 *
 * THE FIRST VERSION OF THIS GUARD NEVER GUARDED. It read
 * `import.meta.url === pathToFileURL(fileURLToPath(import.meta.url)).href`,
 * which compares the module's URL to itself round-tripped through a path and is
 * therefore ALWAYS true. Importing the module called `process.exit`, and the
 * test that imports it reported "no tests" rather than a failure - the process
 * was gone before the suite ran. The comparison must be against
 * `process.argv[1]`, the file node was ASKED to run, which is the only thing
 * that distinguishes "executed" from "imported".
 */
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  process.exit(await main());
}
