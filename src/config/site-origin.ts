/**
 * WHICH ORIGIN THE BUILD IS ALLOWED TO SPEAK AT.
 *
 * This module is the single answer to one question, asked by two different
 * consumers that must never disagree:
 *
 *  - the RELEASE GATE asks "is B-7 supplied?", to colour a row in a report;
 *  - the BUILD asks "may I emit a canonical, an `og:url`, a sitemap entry?",
 *    which is the question that actually reaches a crawler.
 *
 * WHY THE TWO WERE SPLIT, AND WHY THAT WAS THE BUG
 * ------------------------------------------------
 * The gate learned on 2026-09-04 to distinguish a CONFIGURED origin from an
 * APPROVED one, because `PUBLIC_SITE_URL` was set to
 * `https://classy-quokka-2b788f.netlify.app` - an auto-generated Netlify host
 * committed in `netlify.toml` so the deploy had somewhere to point. Fixing the
 * detector made the REPORT honest. It did nothing to the BUILD, which went on
 * emitting canonicals, `og:url`, structured data and a sitemap at that host,
 * because every absolute-URL producer keyed off "is `siteUrl` non-empty" -
 * the same presence-for-approval substitution the gate had just been cured of.
 *
 * So the report said B-7 UNMET while `dist/` shipped the exact artefact B-7
 * exists to prevent, and `src/config/pending.ts` FE:B-7 declared in words -
 * "No canonical, `og:url`, `og:image` or `sitemap.xml` is emitted" - a sentence
 * the build made false. Nothing executes a declaration.
 *
 * THE RULING THIS IMPLEMENTS
 * --------------------------
 * Research lane, bus #0175, 2026-09-04, decided under delegation:
 *
 *   Gate the emission on `APPROVED_ORIGIN`, and noindex any origin that is
 *   configured but not approved.
 *
 * The asymmetry that settles it: a wrong canonical de-indexes the real domain
 * and takes weeks to undo, and the damage is done by crawlers rather than by
 * us. An absent canonical is honestly absent and costs a few weeks of no
 * canonicals. When one branch is catastrophic and irreversible and the other is
 * trivially recoverable, take the recoverable one.
 *
 * THE ORIGIN IS NOW NAMED, AND THE GATE DID NOT BECOME DECORATION
 * --------------------------------------------------------------
 * The owner named the production origin on 2026-09-04 (`pending.ts` B-7, and
 * research lane bus #0182 carrying the owner's direct confirmation), so
 * `APPROVED_ORIGIN` below is filled in and the suppression is SWITCHED, not
 * removed. What it guards from here is the transition the owner's own record
 * anticipates - "WHEN A CUSTOM DOMAIN IS ADDED THAT LINE MUST CHANGE". The day
 * a custom domain is added to Netlify and only one of the two halves is
 * updated, `PUBLIC_SITE_URL` and `APPROVED_ORIGIN` disagree, and everything
 * suppresses until someone updates both. That sentence in the record is a hope;
 * the mismatch branch below is what makes it enforceable.
 */

export interface ApprovedOrigin {
  /** The origin exactly as PAAIPE approved it, e.g. `https://paaipe.org`. */
  origin: string;
  /** Where the approval is recorded, so the row can be audited rather than trusted. */
  approvedIn: string;
}

/**
 * B-7. The origin PAAIPE has approved the build to speak at.
 *
 * WHY THIS EXISTS AS A SEPARATE INPUT FROM `PUBLIC_SITE_URL`
 * ---------------------------------------------------------
 * B-7's detector used to ask "is `PUBLIC_SITE_URL` non-empty". That is a
 * PRESENCE check standing in for an APPROVAL check, and it flipped B-7 green on
 * a Netlify subdomain nobody had approved. Presence and approval are different
 * facts: one is configuration, the other is a decision, and only the decision
 * can be wrong in the way B-7's own fallback names - "a guessed origin would
 * de-index the real page". Keeping the two separate is what lets the approval
 * be AUDITED rather than trusted, which is what `approvedIn` is for.
 *
 * That distinction still earns its keep now the value is filled in, because the
 * host below is a Netlify auto-generated subdomain and is EXPECTED to change.
 * When it does, the approval and the configuration must move together.
 *
 * No value may be invented here. What PAAIPE's production origin IS is a fact
 * about the organisation, and no amount of engineering supplies it. The value
 * below is not engineering's; it is the owner's decision, recorded twice - in
 * `src/config/pending.ts` B-7 and in the owner's direct confirmation of that
 * record on 2026-09-04.
 *
 * CHANGING IT: edit this AND `PUBLIC_SITE_URL` in `netlify.toml`. Both, and
 * they must agree, or the build suppresses every absolute URL until they do.
 */
export const APPROVED_ORIGIN: ApprovedOrigin | null = {
  origin: 'https://classy-quokka-2b788f.netlify.app',
  approvedIn: 'src/config/pending.ts B-7, owner decision 2026-09-04',
};

/**
 * B-7 has THREE states, not two, and the middle one is the dangerous one.
 *
 *  - `absent`                  nothing is configured. Honest, and the build
 *                              emits no absolute URL at all.
 *  - `configured-not-approved` something resolvable is configured and NOBODY has
 *                              said it is PAAIPE's. This reads as supplied to a
 *                              presence check and would ship a wrong canonical.
 *  - `approved`                the configured origin is the approved one.
 */
export type SiteOriginState =
  | { state: 'absent' }
  | { state: 'configured-not-approved'; detail: string }
  | { state: 'approved' };

/** The origin of an absolute URL, or null when it is not one. */
export function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * The three-state resolution, pure: what is configured against what is approved.
 *
 * Both the gate and the build call this. A second implementation of "is this
 * origin approved" is exactly how the report and the artifact came to disagree.
 */
export function siteOriginStateFor(
  configured: string | undefined,
  approved: ApprovedOrigin | null,
): SiteOriginState {
  if (configured === undefined) return { state: 'absent' };

  if (approved === null) {
    return {
      state: 'configured-not-approved',
      detail:
        `\`PUBLIC_SITE_URL\` is set to ${configured}, but no origin has been APPROVED. ` +
        'A configured origin is not an approved one: that value was committed so the ' +
        'deploy had somewhere to point, and until PAAIPE names the production origin in ' +
        '`APPROVED_ORIGIN` the build treats it as a placeholder.',
    };
  }

  const configuredOrigin = originOf(configured);
  const approvedOrigin = originOf(approved.origin);
  if (approvedOrigin === null) {
    return {
      state: 'configured-not-approved',
      detail: `\`APPROVED_ORIGIN.origin\` (${approved.origin}) is not a parseable absolute URL, so nothing can be checked against it.`,
    };
  }
  if (configuredOrigin !== approvedOrigin) {
    return {
      state: 'configured-not-approved',
      detail:
        `\`PUBLIC_SITE_URL\` resolves to ${configuredOrigin}, but the approved origin is ` +
        `${approvedOrigin} (${approved.approvedIn}). A canonical pointing at the wrong ` +
        'host tells crawlers the real site is a copy.',
    };
  }
  return { state: 'approved' };
}

/** What the build may emit, derived from the three states. */
export interface OriginEmission {
  /**
   * The origin every absolute-URL producer forms its URLs from - canonical,
   * `og:url`, `og:image`, JSON-LD `url`/`logo`, the sitemap and the `Sitemap:`
   * line in robots.txt.
   *
   * `undefined` unless the configured origin is the APPROVED one. Undefined is
   * the same value those producers already receive when nothing is configured,
   * so the suppressed state IS the honest absent state, reached by one code
   * path rather than two.
   */
  siteUrl?: string;
  /**
   * An origin is configured but not approved: something is deployed somewhere,
   * and it must not be indexed. Drives `noindex` on every page and the
   * crawl directive in robots.txt.
   *
   * False in the `absent` state, deliberately: nothing is served from an
   * unconfigured origin, so there is nothing to keep out of an index.
   */
  unapproved: boolean;
}

/**
 * Resolve what one build may emit.
 *
 * `approved` is a parameter with the module constant as its default, so both
 * branches are reachable from a test whichever way the constant points. A gate
 * observed only suppressing is indistinguishable from one that suppresses
 * always; now that the constant names an origin, a gate observed only emitting
 * is indistinguishable from one with no gate in it at all.
 */
export function originEmission(
  configured: string | undefined,
  approved: ApprovedOrigin | null = APPROVED_ORIGIN,
): OriginEmission {
  const state = siteOriginStateFor(configured, approved);
  if (state.state === 'approved') return { siteUrl: configured, unapproved: false };
  return { unapproved: state.state === 'configured-not-approved' };
}
