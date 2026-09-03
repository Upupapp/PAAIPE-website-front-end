/**
 * Tests for the metadata system.
 *
 * The gate script `scripts/verify-seo.mjs` asserts the BUILT HTML. These
 * assert the logic that produces it, including the cases the current
 * configuration cannot reach - above all "what happens once PUBLIC_SITE_URL is
 * set", which is the state the site will actually deploy in and which no build
 * on this machine exercises.
 */
import { describe, expect, it } from 'vitest';
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../config/site';
import { PUBLIC_ROUTES, findRoute, type PublicRoute } from '../config/routes';
import {
  DEFAULT_SOCIAL,
  SOCIAL_CARD,
  absoluteUrl,
  breadcrumbStructuredData,
  escapeXml,
  indexability,
  organizationStructuredData,
  pageSeo,
  robotsTxt,
  serializeJsonLd,
  sitemapRoutes,
  sitemapXml,
  webSiteStructuredData,
} from '../lib/seo';
import { articleStructuredData } from '../lib/resources';
import type { PublicResource } from '../content/types';
import { allResources } from '../content';

const ORIGIN = 'https://example.test';
const PROD = { contentMode: 'production' } as const;
const PROD_WITH_ORIGIN = { contentMode: 'production', siteUrl: ORIGIN } as const;
const REVIEW = { contentMode: 'review' } as const;

describe('default social copy', () => {
  it('uses the approved slogan and identity rather than a retyped copy', () => {
    expect(DEFAULT_SOCIAL.title).toBe(SLOGAN);
    expect(DEFAULT_SOCIAL.imageAlt).toContain(ACRONYM);
    expect(DEFAULT_SOCIAL.imageAlt).toContain(ORGANIZATION_NAME);
  });

  it('states the master command default description verbatim', () => {
    expect(DEFAULT_SOCIAL.description).toBe(
      'PAAIPE connects Filipino AI professionals and entrepreneurs through practical learning, responsible innovation and meaningful collaboration.',
    );
  });
});

describe('absoluteUrl', () => {
  it('returns null without an origin', () => {
    expect(absoluteUrl('/about', undefined)).toBeNull();
  });

  it('returns null for an unusable origin rather than throwing', () => {
    expect(absoluteUrl('/about', 'not a url')).toBeNull();
  });

  it('joins a path onto a configured origin', () => {
    expect(absoluteUrl('/about', ORIGIN)).toBe(`${ORIGIN}/about`);
  });
});

describe('indexability', () => {
  const route = (overrides: Partial<PublicRoute> = {}): PublicRoute => ({
    path: '/x',
    title: 't',
    titleSource: 'derived',
    heading: 'h',
    headingSource: 'derived',
    ownedBy: 'Tab 14',
    ...overrides,
  });

  it('marks EVERY route noindex in a review build', () => {
    for (const entry of PUBLIC_ROUTES) {
      expect(indexability(entry, 'review')).toBe('review-build');
    }
  });

  it('does not let production inherit the review build noindex', () => {
    // The complement of the test above. Checking one direction only would pass
    // for a function that returned 'review-build' unconditionally.
    const indexableInProduction = PUBLIC_ROUTES.filter(
      (entry) => indexability(entry, 'production') === 'indexable',
    );
    expect(indexableInProduction.length).toBeGreaterThan(10);
  });

  it('names the reason, not just the boolean', () => {
    expect(indexability(route({ internal: true }), 'production')).toBe('internal');
    expect(indexability(route({ path: '/404' }), 'production')).toBe('error-page');
    expect(indexability(route({ placeholderOnly: true }), 'production')).toBe('placeholder');
    expect(indexability(route({ noindexReason: 'draft-content' }), 'production')).toBe(
      'draft-content',
    );
    expect(indexability(route(), 'production')).toBe('indexable');
  });

  it('treats a dynamic route as a template until a record is supplied', () => {
    const template = route({ dynamic: true, placeholderOnly: true });
    expect(indexability(template, 'production')).toBe('dynamic-template');
    expect(indexability(template, 'production', { approved: false })).toBe('unapproved-content');
    expect(indexability(template, 'production', { approved: true })).toBe('indexable');
  });

  it('keeps the draft policies out of the index', () => {
    for (const path of ['/privacy', '/terms']) {
      expect(indexability(findRoute(path), 'production')).toBe('draft-content');
    }
  });
});

describe('pageSeo', () => {
  it('emits no canonical, no og:url and no og:image without an origin', () => {
    const seo = pageSeo(findRoute('/about'), PROD);
    expect(seo.canonical).toBeNull();
    expect(seo.social.image).toBeNull();
  });

  it('degrades the twitter card to summary when there is no image to show', () => {
    expect(pageSeo(findRoute('/about'), PROD).social.card).toBe('summary');
    expect(pageSeo(findRoute('/about'), PROD_WITH_ORIGIN).social.card).toBe('summary_large_image');
  });

  it('produces an absolute canonical and card image once an origin is set', () => {
    const seo = pageSeo(findRoute('/about'), PROD_WITH_ORIGIN);
    expect(seo.canonical).toBe(`${ORIGIN}/about`);
    expect(seo.social.image).toBe(`${ORIGIN}${SOCIAL_CARD.path}`);
  });

  it('never gives a noindex page a canonical, even with an origin', () => {
    for (const path of ['/privacy', '/terms', '/404', '/internal/style-guide']) {
      expect(pageSeo(findRoute(path), PROD_WITH_ORIGIN).canonical).toBeNull();
    }
  });

  it('uses the served path, not the template, for a detail page canonical', () => {
    const seo = pageSeo(findRoute('/events/[slug]'), PROD_WITH_ORIGIN, {
      path: '/events/a-real-event',
      detail: { approved: true },
    });
    expect(seo.canonical).toBe(`${ORIGIN}/events/a-real-event`);
  });

  it('falls back through overrides, then openGraph, then description, then the default', () => {
    const bare: PublicRoute = {
      path: '/bare',
      title: 'Bare',
      titleSource: 'derived',
      heading: 'Bare',
      headingSource: 'derived',
      ownedBy: 'Tab 14',
    };
    expect(pageSeo(bare, PROD).social.description).toBe(DEFAULT_SOCIAL.description);
    expect(pageSeo(bare, PROD, { description: 'From the page' }).social.description).toBe(
      'From the page',
    );
    expect(
      pageSeo(bare, PROD, { description: 'x', social: { description: 'Social wins' } }).social
        .description,
    ).toBe('Social wins');
  });
});

describe('the route metadata baseline', () => {
  const indexable = PUBLIC_ROUTES.filter(
    (route) => indexability(route, 'production') === 'indexable',
  );

  it('gives every indexable route a description', () => {
    const missing = indexable.filter((route) => !route.description);
    expect(missing.map((route) => route.path)).toEqual([]);
  });

  it('gives every route in the registry a unique title', () => {
    const titles = PUBLIC_ROUTES.map((route) => route.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('gives every description a unique value inside the meta-description window', () => {
    const seen = new Map<string, string>();
    for (const route of PUBLIC_ROUTES) {
      if (!route.description) continue;
      expect(
        route.description.length,
        `${route.path} description is ${route.description.length} chars`,
      ).toBeGreaterThanOrEqual(50);
      expect(
        route.description.length,
        `${route.path} description is ${route.description.length} chars`,
      ).toBeLessThanOrEqual(160);
      expect(seen.get(route.description), `${route.path} duplicates a description`).toBeUndefined();
      seen.set(route.description, route.path);
    }
  });
});

describe('sitemap', () => {
  it('produces no sitemap at all without an origin', () => {
    expect(sitemapXml(PUBLIC_ROUTES, PROD)).toBeNull();
  });

  it('produces no sitemap for a review build even with an origin', () => {
    expect(sitemapXml(PUBLIC_ROUTES, { ...REVIEW, siteUrl: ORIGIN })).toBeNull();
  });

  it('lists only indexable routes', () => {
    const xml = sitemapXml(PUBLIC_ROUTES, PROD_WITH_ORIGIN);
    expect(xml).not.toBeNull();
    for (const route of PUBLIC_ROUTES) {
      const listed = xml!.includes(`<loc>${ORIGIN}${route.path === '/' ? '/' : route.path}</loc>`);
      expect(listed, `${route.path} should${listed ? '' : ' not'} be listed`).toBe(
        indexability(route, 'production') === 'indexable',
      );
    }
  });

  it('never lists a noindex page - the property, not just the current data', () => {
    for (const route of sitemapRoutes(PUBLIC_ROUTES, 'production')) {
      expect(indexability(route, 'production')).toBe('indexable');
    }
  });

  it('adds approved detail paths and de-duplicates them', () => {
    const xml = sitemapXml(PUBLIC_ROUTES, PROD_WITH_ORIGIN, [
      '/events/one',
      '/events/one',
      '/resources/two',
    ]);
    expect(xml!.match(/\/events\/one/g)).toHaveLength(1);
    expect(xml).toContain(`${ORIGIN}/resources/two`);
  });

  it('escapes XML metacharacters in a location', () => {
    expect(escapeXml(`a&b<c>"d'`)).toBe('a&amp;b&lt;c&gt;&quot;d&apos;');
  });
});

describe('robots.txt', () => {
  it('disallows everything in a review build', () => {
    expect(robotsTxt(REVIEW)).toMatch(/^Disallow: \/$/m);
  });

  it('does not disallow everything in production', () => {
    expect(robotsTxt(PROD)).not.toMatch(/^Disallow: \/$/m);
    expect(robotsTxt(PROD)).toMatch(/^Allow: \/$/m);
  });

  it('points at a sitemap only when one exists', () => {
    expect(robotsTxt(PROD)).not.toContain('Sitemap:');
    expect(robotsTxt(PROD_WITH_ORIGIN)).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it('never names an internal path - robots.txt is not access control', () => {
    const internal = PUBLIC_ROUTES.filter((route) => route.internal);
    expect(internal.length).toBeGreaterThan(0);
    for (const context of [PROD, PROD_WITH_ORIGIN, REVIEW]) {
      for (const route of internal) {
        expect(robotsTxt(context)).not.toContain(route.path);
      }
    }
  });
});

describe('structured data', () => {
  it('emits nothing without an origin, because every builder needs an absolute url', () => {
    expect(organizationStructuredData(PROD)).toBeNull();
    expect(webSiteStructuredData(PROD)).toBeNull();
    expect(
      breadcrumbStructuredData([{ label: 'Home', href: '/' }, { label: 'X' }], PROD),
    ).toBeNull();
  });

  it('asserts only approved organisation facts', () => {
    const data = organizationStructuredData(PROD_WITH_ORIGIN) as Record<string, unknown>;
    expect(data.name).toBe(ORGANIZATION_NAME);
    expect(data.alternateName).toBe(ACRONYM);
    // Nothing below is an approved fact, so none of it may appear.
    for (const forbidden of [
      'foundingDate',
      'address',
      'telephone',
      'email',
      'sameAs',
      'numberOfEmployees',
      'member',
      'aggregateRating',
      'award',
    ]) {
      expect(data, `Organization must not assert ${forbidden}`).not.toHaveProperty(forbidden);
    }
  });

  it('does not declare a site search that does not exist', () => {
    const data = webSiteStructuredData(PROD_WITH_ORIGIN) as Record<string, unknown>;
    expect(data).not.toHaveProperty('potentialAction');
  });

  it('needs two crumbs before a breadcrumb trail says anything', () => {
    expect(breadcrumbStructuredData([{ label: 'Home', href: '/' }], PROD_WITH_ORIGIN)).toBeNull();
  });

  it('numbers breadcrumb positions from 1 and omits item on the current page', () => {
    const data = breadcrumbStructuredData(
      [{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: 'Leaf' }],
      PROD_WITH_ORIGIN,
    ) as { itemListElement: Array<Record<string, unknown>> };
    expect(data.itemListElement.map((item) => item.position)).toEqual([1, 2, 3]);
    expect(data.itemListElement[0]!.item).toBe(`${ORIGIN}/`);
    expect(data.itemListElement[2]).not.toHaveProperty('item');
  });

  it('escapes a closing script tag so JSON-LD cannot end its own element', () => {
    const serialized = serializeJsonLd({ name: 'a</script><script>alert(1)</script>' });
    expect(serialized).not.toContain('</script>');
    expect(JSON.parse(serialized).name).toBe('a</script><script>alert(1)</script>');
  });

  it('leaves < and & alone, which are legal in JSON-LD', () => {
    expect(serializeJsonLd({ name: 'a < b & c' })).toContain('a < b & c');
  });
});

describe('Article structured data', () => {
  /*
   * Typed as PublicResource, not as an inferred literal. The first version was
   * a bare object with `format: 'article'` and a `cover` with a `description`
   * field - neither of which exists in the schema. Vitest ran it happily
   * because the values are only read, not validated; only `astro check` said
   * the shape was wrong. A fixture that cannot exist proves nothing about the
   * records that can.
   */
  const base: PublicResource = {
    slug: 'x',
    title: 'T',
    excerpt: 'E',
    visibility: 'public',
    contentStatus: 'approved',
    format: 'guide',
    topics: ['AI Foundations'],
    cover: { kind: 'placeholder', tone: 'surface' },
    publishedAt: '2026-01-01',
    publicBody: [{ type: 'paragraph', text: 'body' }],
  };

  it('emits nothing for any registry resource today, because none is approved', () => {
    for (const resource of allResources) {
      expect(articleStructuredData(resource, ORIGIN)).toBeNull();
    }
  });

  it('requires every one of its five preconditions', () => {
    expect(articleStructuredData(base, ORIGIN)).not.toBeNull();
    expect(articleStructuredData({ ...base, contentStatus: 'sample' }, ORIGIN)).toBeNull();
    expect(articleStructuredData({ ...base, visibility: 'members-only' }, ORIGIN)).toBeNull();
    expect(articleStructuredData({ ...base, publishedAt: undefined }, ORIGIN)).toBeNull();
    expect(articleStructuredData({ ...base, publicBody: [] }, ORIGIN)).toBeNull();
    expect(articleStructuredData(base, undefined)).toBeNull();
  });

  it('does not invent an author', () => {
    const data = articleStructuredData(base, ORIGIN) as Record<string, unknown>;
    expect(data).not.toHaveProperty('author');
    expect(data.datePublished).toBe('2026-01-01');
  });
});
