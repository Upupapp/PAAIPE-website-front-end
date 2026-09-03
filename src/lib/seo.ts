/**
 * The metadata system: titles, descriptions, canonicals, social preview,
 * structured data, sitemap and robots.
 *
 * Every function here is browser-free and pure, so a unit test can drive it
 * without a build. Two rules run through all of it:
 *
 *  1. **An absolute URL requires a configured origin.** `PUBLIC_SITE_URL` is
 *     not known yet (owner item B-7). Rather than guess an origin - which would
 *     ship a canonical, an `og:url`, an `og:image` and a sitemap all pointing at
 *     a hostname PAAIPE never approved - every absolute-URL producer returns
 *     `null` or an empty list. The absence is visible in the metadata matrix and
 *     in the tests; a wrong hostname would not be.
 *
 *  2. **A review build is never indexable.** The reviewer build (`build:review`)
 *     renders sample and allow-listed draft content. It is served from preview
 *     URLs that have no access control, so it must not be crawlable: every page
 *     is `noindex`, robots.txt disallows everything, and no sitemap is written.
 *     Production must not inherit that - `indexability()` is driven by the
 *     content mode, and both directions are asserted.
 */
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../config/site';
import type { ContentMode } from '../config/content-mode';
import type { PublicRoute } from '../config/routes';

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

/** Joins a site-root path onto a configured origin. Null when either is unusable. */
export function absoluteUrl(path: string, siteUrl: string | undefined): string | null {
  if (!siteUrl) return null;
  try {
    return new URL(path, siteUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Why a route is or is not indexable. The reason is carried, not just the
 * boolean, so the metadata matrix can state it and a test can assert on it.
 */
export type IndexabilityReason =
  | 'indexable'
  | 'review-build'
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

export function indexability(
  route: PublicRoute,
  contentMode: ContentMode,
  detail?: DetailInstance,
): IndexabilityReason {
  // The review build check comes FIRST: a route that would be indexable in
  // production must still be noindex on a preview URL.
  if (contentMode === 'review') return 'review-build';
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

export interface SeoContext {
  siteUrl?: string;
  contentMode: ContentMode;
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
  { siteUrl, contentMode }: SeoContext,
  overrides: SeoOverrides = {},
): PageSeo {
  const reason = indexability(route, contentMode, overrides.detail);
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
  contentMode: ContentMode,
): readonly PublicRoute[] {
  return routes.filter((route) => indexability(route, contentMode) === 'indexable');
}

/**
 * A sitemap needs absolute locations, so it is written only when an origin is
 * configured. Null - no file at all - rather than an empty `<urlset>`, which a
 * crawler would read as "this site has no pages".
 */
export function sitemapXml(
  routes: readonly PublicRoute[],
  { siteUrl, contentMode }: SeoContext,
  /** Concrete detail-page paths for approved dynamic records. */
  detailPaths: readonly string[] = [],
): string | null {
  if (!siteUrl) return null;
  const paths = [...sitemapRoutes(routes, contentMode).map((route) => route.path), ...detailPaths];
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
export function robotsTxt({ siteUrl, contentMode }: SeoContext): string {
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

  const lines = ['User-agent: *', 'Allow: /', ''];
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
