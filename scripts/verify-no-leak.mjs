#!/usr/bin/env node
/**
 * Built-bundle privacy scan (Frontend Master Command, Tab 07 and Tab 15).
 *
 * Scans `dist/` for anything that must never reach a visitor: meeting URLs,
 * meeting IDs, passcodes, credentials, protected asset paths and member
 * records.
 *
 * WHY IT SCANS THE BUILD AND NOT THE SOURCE
 * -----------------------------------------
 * The unit-level scope scan reads source files, and a source scan is not proof
 * about the shipped output - a value can be composed at build time from parts
 * that are individually innocent. This reads what is actually served.
 *
 * It is normally run against a REVIEW build (`npm run verify:leak`), because a
 * production build currently contains no event or resource detail pages at all.
 * Scanning production alone would pass by having nothing to scan - the members-
 * only rendering path, which is exactly the risky one, would never be examined.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SCANNED = new Set(['.html', '.js', '.mjs', '.css', '.json', '.txt', '.xml', '.map']);

const PATTERNS = [
  { name: 'Zoom join URL', re: /zoom\.us\/[js]\//i },
  { name: 'meeting id', re: /\bmeeting[\s_-]?id\b/i },
  { name: 'passcode or meeting password', re: /\b(passcode|meeting password)\b/i },
  {
    name: 'credential-shaped assignment',
    re: /\b(api[_-]?key|secret|password|bearer)\b\s*[:=]\s*['"][^'"]{8,}/i,
  },
  { name: 'private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'protected asset path', re: /\/(protected|private|members-only|internal-only)\//i },
  { name: 'signed URL', re: /[?&](X-Amz-Signature|signature|token)=[A-Za-z0-9%_-]{16,}/i },
  { name: 'benefit or coupon code', re: /\b(coupon|promo|benefit)[\s_-]?code\b/i },
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full)));
    else if (SCANNED.has(extname(entry))) out.push(full);
  }
  return out;
}

let files;
try {
  files = await walk(DIST);
} catch {
  console.error('FAIL  dist/ does not exist. Run a build first.');
  process.exit(1);
}

if (files.length === 0) {
  console.error('FAIL  dist/ contains no scannable files. A scan of nothing is not a pass.');
  process.exit(1);
}

const findings = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const { name, re } of PATTERNS) {
    const match = re.exec(text);
    if (match) {
      findings.push(`${file.slice(DIST.length)}: ${name} -> ${match[0].slice(0, 60)}`);
    }
  }
}

console.log(`Scanned ${files.length} built files for ${PATTERNS.length} leak patterns.`);

if (findings.length > 0) {
  console.error(`\nFAIL  ${findings.length} leak(s) in the built output:`);
  for (const finding of findings) console.error(`    - ${finding}`);
  process.exit(1);
}

// Sample/draft content must never reach a production build.
if (process.env.PUBLIC_CONTENT_MODE !== 'review') {
  const labelled = files.filter((f) => f.endsWith('.html'));
  for (const file of labelled) {
    const text = await readFile(file, 'utf8');
    if (/Concept preview|Internal draft/.test(text)) {
      console.error(`\nFAIL  review-only label found in a production build: ${file}`);
      process.exit(1);
    }
  }
}

console.log('PASS  No meeting link, credential, protected path or member record in the bundle.');
