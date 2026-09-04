/**
 * The release gate's inputs.
 *
 * Owner ruling, 2026-09-04: Tab 16 ships a CONDITIONAL release gate. The
 * machinery is built and the machinery refuses the release while any owner
 * input is missing. It FAILS - it does not warn. A gate that exits 0 with
 * caveats gets read as a pass by the next person, and by me in three weeks.
 *
 * TWO PROPERTIES THIS FILE EXISTS TO GUARANTEE
 * --------------------------------------------
 * 1. **One source of truth.** The set of blockers is not typed out here. It is
 *    derived from `src/config/pending.ts` - every owner item in state
 *    `BLOCKED`. `src/tests/release.test.ts` asserts the two sets are equal in
 *    BOTH directions, because a missing id and an extra id are different bugs
 *    and an allow-list fails by silently forgetting.
 *
 * 2. **The gate flips itself.** Supplying an input turns its row green with no
 *    edit to the gate. Each input carries a DETECTOR that reads the world -
 *    environment, filesystem, content status - rather than a boolean somebody
 *    has to remember to flip. If unblocking required editing the gate, someone
 *    would supply the input, forget the edit, and the gate would lie in the
 *    safe direction until the day it lied in the other one.
 *
 * The three config objects below - APPROVED_TYPEFACE, OPERATIONS and
 * APPROVED_ORIGIN - are the inputs with no natural signal in the environment or
 * the filesystem. They are `null` today. Filling them in is how B-5, B-8 and the
 * approval half of B-7 are supplied, and that is an edit to CONFIGURATION, not
 * to the gate.
 *
 * Property 2 has a limit and the report now states it rather than papering over
 * it: a constant cannot be "re-read from the world". Each input declares where
 * its detector looks (`readsFrom`), and the generated report tells each row the
 * truth about itself instead of appending one sentence to all of them.
 */
import { OWNER_ITEMS } from './pending';
import { PUBLIC_CONFIG_KEYS, resolvePublicConfig } from './public-config';
import { APPROVED_ORIGIN, siteOriginStateFor } from './site-origin';
/*
 * `APPROVED_TYPEFACE` lives in `./typeface` for the same reason `APPROVED_ORIGIN`
 * lives in `./site-origin`, and for one more that the gate found.
 *
 * This module imports `./pending`, so anything importing THIS module drags the
 * whole owner register into the build graph. `BaseLayout` needs the typeface
 * constant, and importing it from here put `src/config/pending.ts` on the page
 * import graph - which made its build-skip allow-list entry false, and
 * `verify:deploy` said so before a deploy could silently be skipped. A leaf
 * module keeps the register out of the graph and the saving intact.
 */
import { APPROVED_TYPEFACE } from './typeface';
import type { ApprovedTypeface } from './typeface';
import type { ApprovedOrigin, SiteOriginState } from './site-origin';

/*
 * `APPROVED_ORIGIN` and the three-state resolution live in `./site-origin`, not
 * here, and are re-exported so this file stays the one place a reader looks for
 * the owner-supplied constants.
 *
 * They moved because the BUILD needs them and must not import the release gate.
 * While they lived here, only the gate consulted them: the report said B-7 UNMET
 * and `dist/` shipped canonicals at the unapproved origin anyway. One module,
 * two consumers, no second implementation of "is this origin approved".
 */
export { APPROVED_ORIGIN, siteOriginStateFor };
export type { ApprovedOrigin, SiteOriginState };

/* ------------------------------------------------- owner-supplied constants */

export interface Operations {
  /** Who owns the hosting account. */
  hostingOwner: string;
  /** How a release is published, and whether it is atomic. */
  releaseMethod: string;
  /** How a bad release is undone, and how fast. */
  rollback: string;
  /** What watches the site after release. */
  monitoring: string;
  /** Who is called when it breaks. */
  incidentContact: string;
}

/**
 * B-8. Null until PAAIPE names them. Every recommended production header in
 * `docs/security-privacy-handoff.md` is UNVERIFIED until a host exists and a
 * real response has been inspected - the gate says UNVERIFIED, never "passing".
 */
export const OPERATIONS: Operations | null = null;

/* -------------------------------------------------------------- the inputs */

/** What the gate can observe about the world. Supplied by the runner. */
export interface ReleaseFacts {
  /** The environment of whoever ran the gate. */
  env: Record<string, string | undefined>;
  /**
   * PUBLIC_* values configured for the DEPLOY, read from `netlify.toml`.
   *
   * The gate used to evaluate these inputs against `process.env` alone, which
   * is the environment of whoever ran it - so on a developer machine it
   * reported B-7 UNMET while production had the origin set. The deploy's
   * configuration is a committed fact and belongs in the answer.
   *
   * Merged UNDER `env`, so an explicitly exported value still wins.
   */
  configuredEnv?: Record<string, string | undefined>;
  /**
   * IMAGE files in `public/media/`. Zero means no approved imagery exists.
   *
   * Images, not files. The first version of this counted every entry in the
   * directory and reported B-6 as SUPPLIED, because the directory contains a
   * `README.md` explaining that it is empty. A gate that counts the note about
   * the absence as evidence of the presence is worse than no gate: it turned a
   * blocker green in the report the owner reads.
   */
  approvedMediaFiles: number;
  /** The status of every policy record. */
  policyStatuses: readonly ('draft-for-review' | 'approved')[];

  /*
   * The three OWNER-SUPPLIED CONSTANTS, overridable per evaluation.
   *
   * They default to the module constants above, which are `null` and have been
   * `null` since the file was written. That made B-5's and B-8's true branches
   * UNREACHABLE: their detectors closed over a module constant, so no test could
   * ever see them succeed, and a detector proven only by failing is
   * indistinguishable from one that cannot succeed. B-4, B-6, B-7 and B-9 all
   * read `facts`, and all four have been observed both ways.
   *
   * Passing them through the facts object costs one optional field each and
   * makes every detector exercisable in both directions. `undefined` means "not
   * overridden - use the module constant"; an explicit `null` means "absent",
   * which is how the unsupplied case is asserted.
   */
  approvedTypeface?: ApprovedTypeface | null;
  operations?: Operations | null;
  approvedOrigin?: ApprovedOrigin | null;
}

/** What the DEPLOY will see: committed config, with the caller's env on top. */
export function deployEnv(facts: ReleaseFacts): Record<string, string | undefined> {
  return { ...(facts.configuredEnv ?? {}), ...facts.env };
}

/** The owner constants in force for one evaluation: the facts, else the module. */
export function ownerConstants(facts: ReleaseFacts): {
  approvedTypeface: ApprovedTypeface | null;
  operations: Operations | null;
  approvedOrigin: ApprovedOrigin | null;
} {
  return {
    approvedTypeface:
      facts.approvedTypeface !== undefined ? facts.approvedTypeface : APPROVED_TYPEFACE,
    operations: facts.operations !== undefined ? facts.operations : OPERATIONS,
    approvedOrigin: facts.approvedOrigin !== undefined ? facts.approvedOrigin : APPROVED_ORIGIN,
  };
}

/**
 * B-7's three states for ONE evaluation of the gate: the deploy's configured
 * origin against the approval constant in force.
 *
 * The resolution itself is `siteOriginStateFor` in `./site-origin`, shared with
 * the build. This wrapper only supplies the two inputs from the facts object.
 */
export function siteOriginState(facts: ReleaseFacts): SiteOriginState {
  return siteOriginStateFor(
    resolvePublicConfig(deployEnv(facts)).config.siteUrl,
    ownerConstants(facts).approvedOrigin,
  );
}

export interface ReleaseInput {
  /** The blocker id, from `src/config/pending.ts`. */
  id: string;
  title: string;
  /** Who can supply it. Never "the frontend lane". */
  suppliedBy: string;
  /** Exactly what is missing, in one line. */
  missing: string;
  /** What supplying it looks like, so the row can flip without a code change. */
  howToSupply: string;
  /** What the build does meanwhile. Never a guess, never a placeholder. */
  fallback: string;
  /**
   * WHERE the detector actually looks, so the report can stop telling every row
   * the same story.
   *
   * The generated report used to append one uniform sentence - "the gate
   * re-reads the world on every run, so the row turns green with no change to
   * the gate itself" - to every unmet row. It is true of `world` rows and false
   * of `configuration` rows, whose detectors read a constant in this very file:
   * supplying those DOES require an edit here, and the report was printing the
   * opposite three lines from a row where the sentence is literally true.
   */
  readsFrom: 'world' | 'configuration' | 'both';
  isSupplied(facts: ReleaseFacts): boolean;
  /**
   * Why it is not supplied, when the one-line `missing` is not the whole answer.
   *
   * Only B-7 needs it today: "no production origin" and "an origin is set and
   * nobody approved it" are different states with different remedies, and a
   * static string cannot tell them apart.
   */
  detail?(facts: ReleaseFacts): string | undefined;
}

/**
 * The detectors. Each reads the world; none reads a hand-maintained flag.
 *
 * Keyed by id so the list below can be built FROM `pending.ts` rather than
 * duplicating it. A detector with no matching blocker, or a blocker with no
 * detector, fails `src/tests/release.test.ts`.
 */
const DETECTORS: Record<string, Omit<ReleaseInput, 'id' | 'title'>> = {
  'B-4': {
    suppliedBy: 'PAAIPE',
    missing: `All seven PUBLIC_* destinations: ${PUBLIC_CONFIG_KEYS.join(', ')}`,
    howToSupply: 'Set them in `.env`. The parser refuses an http:// URL and treats it as absent.',
    fallback:
      'Every call to action renders a DISABLED control with a visible reason. Never a `#`, never a dead link, never a fabricated success.',
    readsFrom: 'world',
    isSupplied: (facts) => resolvePublicConfig(deployEnv(facts)).issues.length === 0,
  },
  'B-5': {
    suppliedBy: 'PAAIPE',
    missing: 'An approved typeface with a self-hosting licence',
    howToSupply: 'Fill `APPROVED_TYPEFACE` in `src/config/release.ts` and add the WOFF2 files.',
    fallback:
      'A system font stack: local, zero network requests, 0 KiB of font transfer against a 150 KiB budget.',
    readsFrom: 'configuration',
    isSupplied: (facts) => ownerConstants(facts).approvedTypeface !== null,
  },
  /*
   * B-6 asked for TWO things, and one of them is now done.
   *
   * The Philippine map contour is SHIPPED - `public/media/ph-contour.svg`,
   * derived from public-domain Natural Earth geodata vendored in this repo,
   * generated by `npm run media:contour` and drift-checked by `npm run
   * media:check`. It is not the approximated outline B-6 refused; every point
   * is a real coordinate from a cited source, reduced at a stated tolerance.
   *
   * What remains is EDITORIAL imagery, and that is genuinely the owner's: it
   * needs confirmed usage rights, which is a fact only PAAIPE holds.
   *
   * So the detector no longer counts the contour. A repository that can satisfy
   * an owner input by generating a file is a gate that measures its own output
   * - the same error as counting the README that explained the absence.
   */
  'B-6': {
    suppliedBy: 'PAAIPE',
    missing: 'Approved EDITORIAL imagery in `public/media/`, with confirmed usage rights',
    howToSupply: 'Add the approved files to `public/media/` with confirmed usage rights.',
    fallback:
      'Every image is a typed `placeholder`, so a fixture cannot reference a file that does not exist and every consumer must handle the absent case. The map contour half is no longer a gap: it is derived from public-domain geodata and ships.',
    readsFrom: 'world',
    isSupplied: (facts) => facts.approvedMediaFiles > 0,
  },
  'B-7': {
    suppliedBy: 'PAAIPE',
    missing: 'The APPROVED production origin — not merely a configured `PUBLIC_SITE_URL`',
    howToSupply:
      'Name the origin in `APPROVED_ORIGIN` in `src/config/site-origin.ts`, with where the approval is recorded, and set `PUBLIC_SITE_URL` to the same origin in `netlify.toml` or `.env`. Both, and they must agree.',
    fallback:
      'No canonical, `og:url`, `og:image`, JSON-LD `url` or `sitemap.xml` is emitted, and `twitter:card` degrades to `summary`. A guessed origin would de-index the real page. When an origin IS configured but unapproved, every page additionally sends `noindex, follow`, so a placeholder host cannot enter an index and compete with the real one.',
    readsFrom: 'both',
    isSupplied: (facts) => siteOriginState(facts).state === 'approved',
    detail: (facts) => {
      const state = siteOriginState(facts);
      return state.state === 'configured-not-approved' ? state.detail : undefined;
    },
  },
  'B-8': {
    suppliedBy: 'PAAIPE / the hosting owner',
    missing: 'Hosting owner, atomic release method, rollback, monitoring and incident contacts',
    howToSupply: 'Fill `OPERATIONS` in `src/config/release.ts` once they are named.',
    fallback:
      '`netlify.toml` IS committed - cost controls, caching and the header plan - but no site is linked to the remote, so it is inert and every header in it is UNVERIFIED: not passing, not failing, unmeasured. Naming Netlify as the platform is only part of B-8; the owner, rollback, monitoring and incident contacts are still unnamed.',
    readsFrom: 'configuration',
    isSupplied: (facts) => {
      const operations = ownerConstants(facts).operations;
      if (operations === null) return false;
      /*
       * The length check is not redundant. `[].every(...)` is `true`, so an
       * `OPERATIONS` with no enumerable properties - a `{}` cast, a value
       * parsed from JSON, a future refactor to getters - would report the
       * hosting arrangements as SUPPLIED while naming nobody. B-9 has carried
       * this guard since it was written; B-8 did not, and its true branch had
       * never executed, so nothing would have caught it.
       */
      const values = Object.values(operations as unknown as Record<string, unknown>);
      return (
        values.length > 0 &&
        values.every((value) => typeof value === 'string' && value.trim().length > 0)
      );
    },
  },
  'B-9': {
    suppliedBy: 'PAAIPE / legal review',
    missing: 'Approved legal text for `/privacy` and `/terms`',
    howToSupply:
      'Set each policy `status` to `approved` in `src/content/policies.ts` once the text is signed off. The schema then refuses a `reviewBanner`.',
    fallback:
      'Both pages render a visible DRAFT FOR REVIEW banner before the heading, are `noindex`, and are excluded from the sitemap by a flag in the route registry.',
    readsFrom: 'world',
    isSupplied: (facts) =>
      facts.policyStatuses.length > 0 &&
      facts.policyStatuses.every((status) => status === 'approved'),
  },
};

/**
 * The release inputs, DERIVED from the pending register.
 *
 * `state: 'BLOCKED'` in `OWNER_ITEMS` is the single source of truth for what
 * blocks a release. Adding a blocker there without a detector here fails the
 * test; adding a detector with no blocker fails it too.
 */
export const RELEASE_INPUTS: readonly ReleaseInput[] = OWNER_ITEMS.filter(
  (item) => item.state === 'BLOCKED',
).map((item) => {
  const detector = DETECTORS[item.id];
  if (!detector) {
    throw new Error(
      `${item.id} is BLOCKED in pending.ts but has no detector in release.ts. ` +
        `Every blocker needs a way to detect that it has been supplied, or the gate can never flip.`,
    );
  }
  return { id: item.id, title: item.item, ...detector };
});

/** Ids the detector table knows about. Used by the both-directions test. */
export const DETECTOR_IDS: readonly string[] = Object.keys(DETECTORS);

export interface InputResult extends ReleaseInput {
  supplied: boolean;
  /** The evaluated `detail`, resolved at evaluation time. */
  reason?: string;
}

export function evaluateInputs(facts: ReleaseFacts): InputResult[] {
  return RELEASE_INPUTS.map((input) => {
    const supplied = input.isSupplied(facts);
    return {
      ...input,
      supplied,
      // Only when unmet: a reason for a green row is noise, and a reason that
      // survives being supplied is a stale sentence waiting to be believed.
      reason: supplied ? undefined : input.detail?.(facts),
    };
  });
}

/**
 * The report's "how this one clears" sentence, per input.
 *
 * DERIVED from `readsFrom`, never typed per row, because the uniform sentence
 * this replaces was wrong for exactly the rows nobody re-read.
 */
export function clearsBy(input: Pick<ReleaseInput, 'readsFrom'>): string {
  switch (input.readsFrom) {
    case 'world':
      return 'The gate re-reads the world on every run, so the row turns green with no change to the gate itself.';
    case 'configuration':
      return "That value is a constant in the gate's own configuration, so the row turns green on the next run AFTER that edit. The gate does not discover this one from the environment.";
    case 'both':
      return 'The gate re-reads the configured value from the deploy on every run, but the row stays red until the approval constant names that same origin. A configured origin is not an approved one.';
  }
}

export { APPROVED_TYPEFACE };
export type { ApprovedTypeface };
