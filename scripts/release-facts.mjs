#!/usr/bin/env node
/**
 * Print the release gate's facts AND its evaluated owner inputs as JSON, read
 * from THIS script's own tree.
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
 * WHY THE EVALUATION MOVED HERE TOO
 * ---------------------------------
 * Gathering the facts in the worktree only closed half the split. The gate then
 * imported `evaluateInputs` from `../src/config/release.ts` - which resolves
 * against the MAIN checkout - so the detectors, the blocker list derived from
 * `pending.ts`, and the B-5/B-8/B-7 approval constants all still came from
 * whatever was on disk. Correct facts through the wrong detectors is the same
 * defect wearing the other shoe: an uncommitted edit to `release.ts` or
 * `pending.ts` could change a verdict stamped with a SHA that does not contain
 * it.
 *
 * The evaluation now happens where the facts do. The gate consumes the answer
 * and never imports the detectors at all.
 *
 * The one fact that stays ambient is the ENVIRONMENT, and that is correct: the
 * environment is a property of the deploy, not of the commit. This script
 * inherits it from the gate runner, and the report says so.
 *
 * Usage: node --import tsx scripts/release-facts.mjs
 */
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POLICIES } from '../src/content/policies.ts';
import { clearsBy, evaluateInputs } from '../src/config/release.ts';

const ROOT = fileURLToPath(new URL('../', import.meta.url));

/*
 * Count IMAGES, not files. `public/media/` contains a README explaining that it
 * is empty; counting every entry once reported B-6 as SUPPLIED - it read the
 * note about the absence as evidence of the presence.
 */
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.svg']);

/*
 * And do not count what WE generated, for the same reason the README is
 * excluded above.
 *
 * B-6 asks for approved EDITORIAL imagery with confirmed usage rights - a fact
 * only PAAIPE holds. Assets this repository generates are real and useful, but
 * counting them would let the repository satisfy an owner input by writing a
 * file, which is a gate measuring its own output.
 *
 * EXCLUDED BY DIRECTORY, NOT BY FILENAME. The first version of this was a set
 * containing one name, and that is an allow-list that fails by forgetting: it
 * was already wrong the moment a second generated asset appeared, which it did
 * eleven times over when the covers landed. `public/media/generated/` is the
 * rule, so a future generated asset is excluded by where it lives rather than
 * by someone remembering to add it here.
 *
 * The walk is recursive so that an owner-supplied image in a subfolder is still
 * counted; only the generated tree is skipped.
 */
const GENERATED_DIR = 'generated';

function imagesUnder(dir, relative = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      if (relative === '' && entry.name === GENERATED_DIR) return [];
      return imagesUnder(join(dir, entry.name), `${relative}${entry.name}/`);
    }
    return IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase())
      ? [`${relative}${entry.name}`]
      : [];
  });
}

const mediaDir = join(ROOT, 'public/media');
const approvedMediaFiles = imagesUnder(mediaDir).length;

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

/*
 * The evaluation. Detectors, blocker list and owner constants all come from
 * THIS tree, so the verdict belongs to the SHA the gate stamped.
 *
 * Only the fields the report prints are serialised - `isSupplied` and `detail`
 * are functions and would silently vanish through JSON, which is exactly the
 * kind of quiet loss this gate exists to refuse. `reason` is the ALREADY
 * RESOLVED string.
 */
const inputs = evaluateInputs({
  env: process.env,
  configuredEnv,
  approvedMediaFiles,
  policyStatuses,
}).map((input) => ({
  id: input.id,
  title: input.title,
  suppliedBy: input.suppliedBy,
  missing: input.missing,
  howToSupply: input.howToSupply,
  fallback: input.fallback,
  readsFrom: input.readsFrom,
  supplied: input.supplied,
  reason: input.reason,
  clearsBy: clearsBy(input),
}));

if (inputs.length === 0) {
  // No blockers derived means `pending.ts` was not read, not that the release
  // is clear. Downstream, an empty list and a satisfied list look identical.
  console.error('release-facts: no owner inputs were derived — this tree cannot be evaluated.');
  process.exit(1);
}

console.log(
  JSON.stringify({ approvedMediaFiles, policyStatuses, configuredEnv, inputs, tree: ROOT }),
);
