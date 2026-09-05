/**
 * Build-artifact scan for the Events Continuation boundary (Tab 01 Step 7).
 *
 * WHY A NEW SCANNER RATHER THAN A LINE IN AN EXISTING ONE. `scope-boundary.test.ts`
 * already refuses Zoom links, meeting ids and passcodes - in SOURCE. Tab 02 forbids
 * twelve field names, and measuring the existing guard against that list showed TEN
 * of them would slip through: zoomUrl, joinUrl, attendees, participantEmails,
 * memberEmails, protectedRecordingUrl, privateCalendarUrl, registrationSecret,
 * confirmationToken and benefitCode all pass a regex written for `zoom.us`,
 * `meeting id` and `passcode`.
 *
 * And source is the wrong place to look for the final answer. What ships is the
 * BUILD: pre-rendered HTML, JS chunks, JSON-LD, the manifest, the sitemap. A field
 * can reach any of those from a source file that never names it literally.
 *
 * Usage: node scripts/verify-event-boundary.mjs [--dist dist]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const distIndex = process.argv.indexOf('--dist');
const DIST = join(ROOT, distIndex === -1 ? 'dist' : (process.argv[distIndex + 1] ?? 'dist'));

/** The twelve names Tab 02 forbids, plus the shapes they take once minified. */
const FORBIDDEN_FIELDS = [
  'zoomUrl',
  'joinUrl',
  'meetingId',
  'passcode',
  'attendees',
  'participantEmails',
  'memberEmails',
  'protectedRecordingUrl',
  'privateCalendarUrl',
  'registrationSecret',
  'confirmationToken',
  'benefitCode',
];

/**
 * Matched case-insensitively and across `camelCase`, `snake_case` and
 * `kebab-case`, because a serializer can rename a field on the way out and the
 * value is just as exposed under any of them.
 */
function fieldPattern(name) {
  const parts = name.split(/(?=[A-Z])/).map((p) => p.toLowerCase());
  return new RegExp(`\\b${parts.join('[-_]?')}\\b`, 'i');
}

/** A real Zoom destination, not the word "Zoom" - the page says "Private Zoom" on purpose. */
const ZOOM_LINK = /zoom\.us\/(?:j|s|w|my)\//i;

/**
 * `you@example.com` is the standardized non-deliverable placeholder and Tab 01
 * permits it as form placeholder copy. Any OTHER address in a built artifact is
 * a fixture leak.
 */
const PERMITTED_EMAILS = new Set(['you@example.com']);
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

/** Text-bearing artifacts. A binary cannot be grepped meaningfully. */
const SCANNED = new Set(['.html', '.js', '.mjs', '.css', '.json', '.xml', '.txt', '.map', '.svg']);

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walk(full);
    return SCANNED.has(extname(entry).toLowerCase()) ? [full] : [];
  });
}

if (!existsSync(DIST)) {
  console.error(`FAIL  ${DIST} does not exist. Run a build first.`);
  process.exit(1);
}

const files = walk(DIST);
/*
 * A scan of nothing proves nothing. This has bitten this repository before: a
 * suite reporting PASS over an empty file list looks exactly like a clean one.
 */
if (files.length < 10) {
  console.error(
    `FAIL  only ${files.length} artifacts found in ${DIST}. Scanning nothing is not a pass.`,
  );
  process.exit(1);
}

const failures = [];
const patterns = FORBIDDEN_FIELDS.map((name) => [name, fieldPattern(name)]);

for (const file of files) {
  const relative = file.slice(DIST.length + 1);
  const text = readFileSync(file, 'utf8');

  for (const [name, pattern] of patterns) {
    if (pattern.test(text)) failures.push(`${relative}: forbidden field \`${name}\``);
  }
  if (ZOOM_LINK.test(text)) failures.push(`${relative}: a Zoom meeting destination`);

  for (const address of text.match(EMAIL) ?? []) {
    if (!PERMITTED_EMAILS.has(address.toLowerCase())) {
      failures.push(`${relative}: email address ${address}`);
    }
  }
}

console.log(`\nEvent boundary scan — ${files.length} artifacts in ${DIST.slice(ROOT.length)}`);
console.log(`  forbidden fields checked: ${FORBIDDEN_FIELDS.length}`);
console.log(`  permitted placeholder:    ${[...PERMITTED_EMAILS].join(', ')}`);

if (failures.length > 0) {
  console.error(`\nEVENT BOUNDARY SCAN FAILED — ${failures.length} problem(s)\n`);
  for (const failure of [...new Set(failures)]) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS');
