#!/usr/bin/env node
/**
 * Canonical PAAIPE logo checksum gate (Frontend Master Command, Tab 02).
 *
 * Rules this gate enforces:
 *  - Both canonical logo files must be present in public/brand/.
 *  - Each must match its pinned SHA-256 exactly. Any re-encode, optimiser pass,
 *    crop, recolour or regeneration changes the bytes and fails.
 *  - An UNEXPECTED file in public/brand/ fails too, so an alternate or
 *    recreated logo cannot be slipped in beside the approved one.
 *
 * PROVENANCE OF THE PINNED HASHES
 * -------------------------------
 * The master command PDF prints a different pair of hashes (`SPEC_SHA256`).
 * The files supplied and confirmed as official by the owner on 2026-09-03 do
 * NOT hash to those values. The pins below are measured from the owner-supplied
 * files; the spec pair is kept so the divergence stays visible and is reported
 * on every run until PAAIPE confirms which pair is authoritative.
 * See docs/frontend-audit.md, blocker B-1.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BRAND_DIR = new URL('../public/brand/', import.meta.url);

/** Measured from the owner-confirmed official files on 2026-09-03. */
const CANONICAL = {
  'PAAIPE_Logo_Square_Final.png':
    '88f91f0e5b4a7bf70d202d49dadedae5a677a72c02f9d4eaf097962a247d1867',
  'PAAIPE_Logo_Horizontal_Final.png':
    'f332dc8c5d005b4cf46b06643d005d90071b36072c17a816107f3730021a1378',
};

/** As printed in the Frontend Master Command, Tab 02 and Tab 15. */
const SPEC_SHA256 = {
  'PAAIPE_Logo_Square_Final.png':
    'fd142bbe87429931b8cbf10d4f834d24f538b713b79a2fa69fdc660f016adf77',
  'PAAIPE_Logo_Horizontal_Final.png':
    '1e87fd4cbc683de75e240c8810c6f835928e768e849c0ddf2c92866808b55944',
};

const IGNORED = new Set(['.gitkeep', '.DS_Store', 'README.md']);

async function main() {
  const dir = fileURLToPath(BRAND_DIR);

  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    console.error('FAIL  public/brand/ does not exist.');
    process.exit(1);
  }

  const assets = entries.filter((name) => !IGNORED.has(name));
  const failures = [];

  for (const name of assets) {
    if (!CANONICAL[name]) {
      failures.push(
        `${name}: unexpected file in public/brand/ (only canonical logo files may live here)`,
      );
      continue;
    }
    const actual = createHash('sha256')
      .update(await readFile(new URL(name, BRAND_DIR)))
      .digest('hex');
    if (actual !== CANONICAL[name]) {
      failures.push(
        `${name}: SHA-256 mismatch\n      expected ${CANONICAL[name]}\n      actual   ${actual}`,
      );
    } else {
      console.log(`OK    ${name}  ${actual}`);
    }
  }

  for (const name of Object.keys(CANONICAL)) {
    if (!assets.includes(name)) failures.push(`${name}: missing from public/brand/`);
  }

  if (failures.length > 0) {
    console.error(`\nFAIL  ${failures.length} brand asset problem(s):`);
    for (const failure of failures) console.error(`    - ${failure}`);
    process.exit(1);
  }

  const divergent = Object.keys(CANONICAL).filter((name) => CANONICAL[name] !== SPEC_SHA256[name]);

  console.log('\nPASS  Both canonical PAAIPE logo files match their pinned SHA-256.');

  if (divergent.length > 0) {
    console.warn(
      `\nUNRESOLVED  ${divergent.length} file(s) do not match the checksum printed in the master command.`,
    );
    for (const name of divergent) {
      console.warn(`    - ${name}`);
      console.warn(`        master command : ${SPEC_SHA256[name]}`);
      console.warn(`        supplied file  : ${CANONICAL[name]}`);
    }
    console.warn(
      '    Pinned to the owner-supplied files (confirmed official 2026-09-03).\n' +
        '    PAAIPE must confirm which pair is authoritative. See docs/frontend-audit.md B-1.',
    );
  }
}

await main();
