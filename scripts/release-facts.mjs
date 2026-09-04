#!/usr/bin/env node
/**
 * Print the release gate's facts as JSON, read from THIS script's own tree.
 *
 * WHY IT IS A SEPARATE SCRIPT
 * ---------------------------
 * The gate runs the suite in a DETACHED WORKTREE at a committed SHA, precisely
 * so it certifies a committed state rather than whatever is on disk. But it
 * evaluated the owner inputs from facts gathered in TWO different trees: the
 * media count came from the worktree, while the policy statuses came from an
 * `import` at the top of the gate script - which resolves against the main
 * checkout.
 *
 * So an uncommitted edit to `src/content/policies.ts` could have flipped B-9
 * green in a report stamped with a commit that did not contain it. A gate that
 * certifies a SHA must read every fact from that SHA.
 *
 * Running this inside the worktree makes the tree the single source: it reads
 * its own `src/` and its own `public/`, and prints what it found.
 *
 * Usage: node --import tsx scripts/release-facts.mjs
 */
import { readdirSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLICIES } from '../src/content/policies.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/*
 * Count IMAGES, not files. `public/media/` contains a README explaining that it
 * is empty; counting every entry once reported B-6 as SUPPLIED - it read the
 * note about the absence as evidence of the presence.
 */
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);
const mediaDir = join(ROOT, 'public/media');
const approvedMediaFiles = existsSync(mediaDir)
  ? readdirSync(mediaDir).filter((entry) => IMAGE_EXTENSIONS.has(extname(entry).toLowerCase()))
      .length
  : 0;

const policyStatuses = POLICIES.map((policy) => policy.status);

if (policyStatuses.length === 0) {
  // An empty list would make B-9's `every()` vacuously true downstream. The
  // detector guards it too, but a fact-gatherer that returns nothing has
  // failed, and it should say so here rather than emit an empty answer.
  console.error('release-facts: no policy records found — this tree cannot be evaluated.');
  process.exit(1);
}

console.log(JSON.stringify({ approvedMediaFiles, policyStatuses, tree: ROOT }));
