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
 * The two config objects at the bottom - APPROVED_TYPEFACE and OPERATIONS - are
 * the only inputs with no natural signal in the environment or the filesystem.
 * They are `null` today. Filling them in is how B-5 and B-8 are supplied, and
 * that is an edit to CONFIGURATION, not to the gate.
 */
import { OWNER_ITEMS } from './pending';
import { PUBLIC_CONFIG_KEYS, resolvePublicConfig } from './public-config';

/* ------------------------------------------------- owner-supplied constants */

export interface ApprovedTypeface {
  /** The family name, exactly as licensed. */
  family: string;
  /** Where the self-hosting licence is recorded. */
  licence: string;
  /** Self-hosted WOFF2 files, relative to `public/`. */
  files: readonly string[];
}

/**
 * B-5. Null until PAAIPE supplies a typeface with a self-hosting licence.
 * A system font stack is in place meanwhile: local, zero network requests, and
 * one declaration to swap.
 */
export const APPROVED_TYPEFACE: ApprovedTypeface | null = null;

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
  env: Record<string, string | undefined>;
  /** Files in `public/media/`. Zero means no approved imagery exists. */
  approvedMediaFiles: number;
  /** The status of every policy record. */
  policyStatuses: readonly ('draft-for-review' | 'approved')[];
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
  isSupplied(facts: ReleaseFacts): boolean;
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
    isSupplied: (facts) => resolvePublicConfig(facts.env).issues.length === 0,
  },
  'B-5': {
    suppliedBy: 'PAAIPE',
    missing: 'An approved typeface with a self-hosting licence',
    howToSupply: 'Fill `APPROVED_TYPEFACE` in `src/config/release.ts` and add the WOFF2 files.',
    fallback:
      'A system font stack: local, zero network requests, 0 KiB of font transfer against a 150 KiB budget.',
    isSupplied: () => APPROVED_TYPEFACE !== null,
  },
  'B-6': {
    suppliedBy: 'PAAIPE',
    missing: 'Approved imagery in `public/media/`, and the Philippine map contour',
    howToSupply: 'Add the approved files to `public/media/` with confirmed usage rights.',
    fallback:
      'Every image is a typed `placeholder`, so a fixture cannot reference a file that does not exist and every consumer must handle the absent case.',
    isSupplied: (facts) => facts.approvedMediaFiles > 0,
  },
  'B-7': {
    suppliedBy: 'PAAIPE',
    missing: 'The production origin, so `PUBLIC_SITE_URL` has a real value',
    howToSupply: 'Set `PUBLIC_SITE_URL` in `.env`.',
    fallback:
      'No canonical, `og:url`, `og:image` or `sitemap.xml` is emitted, and `twitter:card` degrades to `summary`. A guessed origin would de-index the real page.',
    isSupplied: (facts) => resolvePublicConfig(facts.env).config.siteUrl !== undefined,
  },
  'B-8': {
    suppliedBy: 'PAAIPE / the hosting owner',
    missing: 'Hosting owner, atomic release method, rollback, monitoring and incident contacts',
    howToSupply: 'Fill `OPERATIONS` in `src/config/release.ts` once they are named.',
    fallback:
      'No platform configuration is committed, and every recommended production header in `docs/security-privacy-handoff.md` is UNVERIFIED - not passing, not failing, unmeasured.',
    isSupplied: () =>
      OPERATIONS !== null &&
      Object.values(OPERATIONS as Record<string, string>).every(
        (value) => typeof value === 'string' && value.trim().length > 0,
      ),
  },
  'B-9': {
    suppliedBy: 'PAAIPE / legal review',
    missing: 'Approved legal text for `/privacy` and `/terms`',
    howToSupply:
      'Set each policy `status` to `approved` in `src/content/policies.ts` once the text is signed off. The schema then refuses a `reviewBanner`.',
    fallback:
      'Both pages render a visible DRAFT FOR REVIEW banner before the heading, are `noindex`, and are excluded from the sitemap by a flag in the route registry.',
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
}

export function evaluateInputs(facts: ReleaseFacts): InputResult[] {
  return RELEASE_INPUTS.map((input) => ({ ...input, supplied: input.isSupplied(facts) }));
}
