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
import { readdirSync, existsSync, readFileSync } from 'node:fs';
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

/*
 * PUBLIC_* values configured for the DEPLOY, read from netlify.toml.
 *
 * The gate evaluated the owner inputs against `process.env` - the env of
 * whoever ran it. But the production origin now lives in
 * `netlify.toml [build.environment]`, which is where the deploy reads it and
 * where a reviewer can see it in a diff. So running the gate on a developer
 * machine reported B-7 as UNMET while production had it set: the gate was
 * asking the wrong environment.
 *
 * These are merged UNDER the process env, so an explicitly exported value still
 * wins - that is how you test an alternative origin without editing the file.
 */
const NETLIFY_CONFIG = new URL('../netlify.toml', import.meta.url);
let configuredEnv = {};
try {
  const toml = readFileSync(fileURLToPath(NETLIFY_CONFIG), 'utf8');
  const section = toml.split(/^\[build\.environment\]$/m)[1]?.split(/^\[/m)[0] ?? '';
  for (const match of section.matchAll(/^\s*(PUBLIC_[A-Z0-9_]+)\s*=\s*"([^"]*)"/gm)) {
    configuredEnv[match[1]] = match[2];
  }
} catch {
  // No netlify.toml is a valid state - the repo simply has no deploy config.
  configuredEnv = {};
}

if (policyStatuses.length === 0) {
  // An empty list would make B-9's `every()` vacuously true downstream. The
  // detector guards it too, but a fact-gatherer that returns nothing has
  // failed, and it should say so here rather than emit an empty answer.
  console.error('release-facts: no policy records found — this tree cannot be evaluated.');
  process.exit(1);
}

console.log(JSON.stringify({ approvedMediaFiles, policyStatuses, configuredEnv, tree: ROOT }));
