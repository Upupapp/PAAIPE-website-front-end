/**
 * The metadata system: titles, descriptions, canonicals, social preview,
 * structured data, sitemap and robots.
 *
 * Every function here is browser-free and pure, so a unit test can drive it
 * without a build. Three rules run through all of it:
 *
 *  1. **An absolute URL requires an APPROVED origin.** Not a configured one.
 *     `PUBLIC_SITE_URL` is what a deploy points at; `APPROVED_ORIGIN` is what
 *     PAAIPE has said is theirs (owner item B-7), and only the second may reach
 *     a crawler. Rather than guess - which would ship a canonical, an `og:url`,
 *     an `og:image` and a sitemap all pointing at a hostname PAAIPE never
 *     approved - every absolute-URL producer returns `null` or an empty list.
 *     The absence is visible in the metadata matrix and in the tests; a wrong
 *     hostname would not be.
 *
 *     Every `SeoContext` is built by `seoContext()`, which is where that
 *     distinction is enforced. Nothing hands `siteUrl` in raw from
 *     `publicConfig`: that is the presence-for-approval substitution this whole
 *     file exists to avoid, and it is what shipped canonicals at
 *     `classy-quokka-2b788f.netlify.app` while the release report said B-7 UNMET.
 *
 *  2. **A review build is never indexable.** The reviewer build (`build:review`)
 *     renders sample and allow-listed draft content. It is served from preview
 *     URLs that have no access control, so it must not be crawlable: every page
 *     is `noindex`, robots.txt disallows everything, and no sitemap is written.
 *     Production must not inherit that - `indexability()` is driven by the
 *     content mode, and both directions are asserted.
 *
 *  3. **Nor is an unapproved origin.** A production build served at an origin
 *     nobody approved is `noindex` on every page. Absence of a canonical stops
 *     us from naming the wrong host; it does not stop a crawler indexing the
 *     placeholder host it arrived at, which would then compete with the real
 *     one. Suppressing the emission and noindexing the origin are two different
 *     defences against two different failures, and rule 1 only provides the first.
 */
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../config/site';
import type { ContentMode } from '../config/content-mode';
import type { PublicRoute } from '../config/routes';
import { originEmission, type ApprovedOrigin } from '../config/site-origin';

/**
 * The default social preview copy, quoted from the master command's route
 * metadata baseline. The title IS the approved slogan and the alt text IS the
 * acronym and full name - both are composed from `config/site.ts` rather than
 * retyped, so a change to the approved identity cannot leave a stale copy here.
 */
export const DEFAULT_SOCIAL = {
  title: SLOGAN,
  description:
    'PAAIPE connects Filipino AI professionals and entrepreneurs through practical learning, responsible innovation and meaningful collaboration.',
  imageAlt: `${ACRONYM}—${ORGANIZATION_NAME}.`,
} as const;

/**
 * The branded social card. Composited from the exact approved logo file by
 * `scripts/generate-social-card.mjs` - not redrawn, not regenerated, and with
 * no rendered text, because no typeface is approved yet (owner item B-5). The
 * words live in `og:image:alt` instead, where they need no font.
 */
export const SOCIAL_CARD = {
  path: '/social/paaipe-social-card.png',
  width: 1200,
  height: 630,
  type: 'image/png',
} as const;

/** Joins a site-root path onto an approved origin. Null when either is unusable. */
export function absoluteUrl(path: string, siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------- the context */

/**
 * Everything about the BUILD that the metadata depends on. Every producer below
 * takes one of these, and `seoContext()` is the only sanctioned way to make one
 * from real configuration.
 */
export interface SeoContext {
  /**
   * The origin absolute URLs are formed from - APPROVED, never merely
   * configured. Undefined suppresses every absolute URL, which is why
   * `seoContext()` and not the caller decides what goes here.
   */
  siteUrl?: string;
  contentMode: ContentMode;
  /**
   * An origin is configured but not approved. Forces `noindex` on every page
   * and stops robots.txt advertising a sitemap that does not exist.
   *
   * Optional and defaulting to false, so the doc generators and route selectors
   * that ask the design-intent question - `{ contentMode: 'production' }`, no
   * origin at all - keep asking exactly that and are not answered "noindex".
   */
  originUnapproved?: boolean;
}

/**
 * Build the context for one build, from the configured `PUBLIC_SITE_URL` and
 * the content mode.
 *
 * THIS IS THE GATE. Every call site - `BaseLayout.astro`, the home page, the
 * detail pages, `write-seo-files.mjs`, `verify-seo.mjs` - goes through here, so
 * `APPROVED_ORIGIN` is consulted once and cannot be forgotten at a sixth call
 * site added later. Passing `publicConfig.siteUrl` straight into a context is
 * the defect this replaces.
 *
 * `approved` is a parameter so a test can drive both directions; it defaults to
 * the module constant, which is how production reads it.
 */
export function seoContext(
  configuredSiteUrl: string | undefined,
  contentMode: ContentMode,
  approved?: ApprovedOrigin | null,
): SeoContext {
  const emission =
    approved === undefined
      ? originEmission(configuredSiteUrl)
      : originEmission(configuredSiteUrl, approved);
  return {
    siteUrl: emission.siteUrl,
    contentMode,
    originUnapproved: emission.unapproved,
  };
}

/**
 * The DESIGN-INTENT context: production content mode, no origin, nothing
 * unapproved. It answers "is this route meant to be indexed at all", which is
 * a question about the ROUTE REGISTRY and not about any particular deploy.
 *
 * The documentation generators, the metadata matrix and the end-to-end specs
 * that pick which routes to assert on all want this question, and none of them
 * wants today's origin folded into the answer: a metadata matrix that reported
 * every route as `unapproved-origin` would document nothing, and an e2e suite
 * that selected zero indexable routes would pass by testing nothing.
 *
 * A shared named constant rather than a literal at each site, so the intent is
 * stated once and a reader can tell it apart from a build context at a glance.
 */
export const ROUTE_DESIGN_INTENT: SeoContext = { contentMode: 'production' };

/**
 * Why a route is or is not indexable. The reason is carried, not just the
 * boolean, so the metadata matrix can state it and a test can assert on it.
 */
export type IndexabilityReason =
  | 'indexable'
  | 'review-build'
  /** An origin is configured and nobody has approved it. Whole-origin, not per-route. */
  | 'unapproved-origin'
  | 'internal'
  | 'placeholder'
  | 'dynamic-template'
  | 'error-page'
  | 'draft-content'
  | 'unapproved-content';

/**
 * A concrete instance of a dynamic route. A registry entry like
 * `/events/[slug]` is a template and never indexable on its own; a real detail
 * page is indexable only when the record behind it is approved public content.
 */
export interface DetailInstance {
  approved: boolean;
}

/**
 * Takes the whole context, not just the content mode, because indexability is
 * no longer a property of the route alone: an origin nobody approved makes
 * every route on it noindex. A `ContentMode`-only signature would let a call
 * site ask the question in a form that cannot express the answer.
 */
export function indexability(
  route: PublicRoute,
  { contentMode, originUnapproved = false }: SeoContext,
  detail?: DetailInstance,
): IndexabilityReason {
  // The two whole-origin checks come FIRST: a route that would be indexable in
  // production must still be noindex on a preview URL, and on an origin nobody
  // approved. Review build wins the tie because it is the narrower, already
  // asserted claim - both answers are `noindex` either way.
  if (contentMode === 'review') return 'review-build';
  if (originUnapproved) return 'unapproved-origin';
  if (route.internal) return 'internal';
  if (route.path === '/404') return 'error-page';
  if (route.dynamic) {
    if (!detail) return 'dynamic-template';
    if (!detail.approved) return 'unapproved-content';
    return 'indexable';
  }
  if (route.placeholderOnly) return 'placeholder';
  if (route.noindexReason) return route.noindexReason;
  return 'indexable';
}

export interface SocialPreview {
  title: string;
  description: string;
  /** Absolute, per the Open Graph spec. Null until an origin is configured. */
  image: string | null;
  imageAlt: string;
  /**
   * `summary_large_image` claims a large image exists. Without an origin there
   * is no absolute image URL to give, so the card degrades to `summary` rather
   * than declaring an image it cannot supply.
   */
  card: 'summary' | 'summary_large_image';
}

export interface PageSeo {
  title: string;
  description?: string;
  /** Absolute canonical. Null when there is no origin, or the page is noindex. */
  canonical: string | null;
  indexable: boolean;
  indexabilityReason: IndexabilityReason;
  social: SocialPreview;
}

/** Per-page overrides for a route rendered from a registry entry. */
export interface SeoOverrides {
  title?: string;
  description?: string;
  path?: string;
  social?: { title?: string; description?: string };
  detail?: DetailInstance;
}

export function pageSeo(
  route: PublicRoute,
  context: SeoContext,
  overrides: SeoOverrides = {},
): PageSeo {
  const { siteUrl } = context;
  const reason = indexability(route, context, overrides.detail);
  const indexable = reason === 'indexable';
  const path = overrides.path ?? route.path;
  const image = absoluteUrl(SOCIAL_CARD.path, siteUrl);

  return {
    title: overrides.title ?? route.title,
    description: overrides.description ?? route.description,
    canonical: indexable ? absoluteUrl(path, siteUrl) : null,
    indexable,
    indexabilityReason: reason,
    social: {
      title: overrides.social?.title ?? route.openGraph?.title ?? overrides.title ?? route.title,
      description:
        overrides.social?.description ??
        route.openGraph?.description ??
        overrides.description ??
        route.description ??
        DEFAULT_SOCIAL.description,
      image,
      imageAlt: DEFAULT_SOCIAL.imageAlt,
      card: image ? 'summary_large_image' : 'summary',
    },
  };
}

/* ------------------------------------------------------------------ sitemap */

/** The routes a production sitemap lists: real, public, non-placeholder pages. */
export function sitemapRoutes(
  routes: readonly PublicRoute[],
  context: SeoContext,
): readonly PublicRoute[] {
  return routes.filter((route) => indexability(route, context) === 'indexable');
}

/**
 * A sitemap needs absolute locations, so it is written only when an origin is
 * configured. Null - no file at all - rather than an empty `<urlset>`, which a
 * crawler would read as "this site has no pages".
 */
export function sitemapXml(
  routes: readonly PublicRoute[],
  context: SeoContext,
  /** Concrete detail-page paths for approved dynamic records. */
  detailPaths: readonly string[] = [],
): string | null {
  const { siteUrl } = context;
  if (!siteUrl) return null;
  const paths = [...sitemapRoutes(routes, context).map((route) => route.path), ...detailPaths];
  const entries = [...new Set(paths)]
    .map((path) => absoluteUrl(path, siteUrl))
    .filter((loc): loc is string => loc !== null);
  if (entries.length === 0) return null;

  const urls = entries.map((loc) => `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/* ------------------------------------------------------------------- robots */

/**
 * robots.txt is a crawling hint, never access control - nothing private is
 * named in it. The internal review surface is excluded from the production
 * build entirely rather than listed here, because naming a path in robots.txt
 * advertises it.
 */
export function robotsTxt({ siteUrl, contentMode, originUnapproved = false }: SeoContext): string {
  if (contentMode === 'review') {
    return [
      '# Reviewer build. Sample and draft content is visible here, so this',
      '# origin must not be crawled or indexed. Every page also sends',
      '# <meta name="robots" content="noindex">.',
      'User-agent: *',
      'Disallow: /',
      '',
    ].join('\n');
  }

  /*
   * An unapproved origin ALLOWS crawling, deliberately, and that is not a
   * softer version of the review build's `Disallow: /`.
   *
   * `noindex` only works if it is read, and a disallowed URL is never fetched -
   * so `Disallow` HIDES the very directive that keeps this host out of the
   * index, and the URL can still be indexed bare from any external link. The
   * two files must say the same thing as the pages: crawl it, and do not index
   * it. The review build accepts that trade because its content must not be
   * FETCHED at all; here the content is public, only the hostname is wrong.
   */
  const lines = ['User-agent: *', 'Allow: /', ''];
  if (originUnapproved) {
    lines.push(
      '# Every page on this origin sends <meta name="robots" content="noindex">:',
      '# an origin is configured, but it is not the APPROVED production origin',
      '# (owner item B-7), so it must not enter an index and compete with the',
      '# real one. Crawling is left ALLOWED on purpose - a Disallow would stop',
      '# the noindex above from ever being read.',
      '# No Sitemap line: there is no approved origin to form absolute URLs from.',
      '',
    );
    return lines.join('\n');
  }

  const sitemap = absoluteUrl('/sitemap.xml', siteUrl);
  if (sitemap) lines.push(`Sitemap: ${sitemap}`, '');
  else
    lines.push(
      '# No Sitemap line: PUBLIC_SITE_URL is not configured, so no absolute',
      '# sitemap URL exists to point at (owner item B-7).',
      '',
    );
  return lines.join('\n');
}

/* --------------------------------------------------------- structured data */

/**
 * JSON-LD may only assert facts that are approved AND visible on the page.
 * Each builder returns null when it cannot do that - most often because there
 * is no origin to form the required `url` and `logo` from.
 */
export function organizationStructuredData({ siteUrl }: SeoContext): object | null {
  if (!siteUrl) return null;
  const url = absoluteUrl('/', siteUrl);
  // The 512px rendition, not the 1.35 MB canonical original. A crawler fetches
  // this URL, and the rendition is the same artwork proportionally downscaled.
  const logo = absoluteUrl('/brand/renditions/paaipe-square-512.png', siteUrl);
  if (!url || !logo) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORGANIZATION_NAME,
    alternateName: ACRONYM,
    url,
    logo,
    // No sameAs, foundingDate, address, telephone, email, memberOf, numberOfEmployees
    // or aggregateRating: none of those are approved facts. An absent property is
    // correct; a guessed one is a fabricated claim in machine-readable form.
  };
}

export function webSiteStructuredData({ siteUrl }: SeoContext): object | null {
  if (!siteUrl) return null;
  const url = absoluteUrl('/', siteUrl);
  if (!url) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: ORGANIZATION_NAME,
    alternateName: ACRONYM,
    url,
    inLanguage: 'en-PH',
    // No potentialAction/SearchAction: the site has no search endpoint, and
    // declaring one that 404s is a broken claim.
  };
}

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * BreadcrumbList for inner pages. Needs at least two crumbs (a single-item
 * trail describes nothing) and an origin, because `item` must be absolute.
 */
export function breadcrumbStructuredData(
  crumbs: readonly Crumb[],
  { siteUrl }: SeoContext,
): object | null {
  if (!siteUrl || crumbs.length < 2) return null;
  const items = crumbs.map((crumb, index) => {
    const item = crumb.href ? absoluteUrl(crumb.href, siteUrl) : null;
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(item ? { item } : {}),
    };
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

/**
 * JSON-LD is embedded in a `<script type="application/ld+json">`. `</script>`
 * inside a string would end the element early, so the closing-tag sequence is
 * escaped. `<` and `&` are left alone: they are legal in JSON-LD and escaping
 * them would corrupt the data.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/<\/(script)/gi, '<\\/$1');
}
