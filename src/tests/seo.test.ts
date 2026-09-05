/**
 * Tests for the metadata system.
 *
 * The gate script `scripts/verify-seo.mjs` asserts the BUILT HTML. These
 * assert the logic that produces it, including the cases the current
 * configuration cannot reach - above all "what happens once PUBLIC_SITE_URL is
 * set", which is the state the site will actually deploy in and which no build
 * on this machine exercises.
 */
import { POLICIES } from '../content/policies';
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
  seoContext,
  serializeJsonLd,
  sitemapRoutes,
  sitemapXml,
  webSiteStructuredData,
} from '../lib/seo';
import { APPROVED_ORIGIN } from '../config/site-origin';
import { articleStructuredData } from '../lib/resources';
import type { PublicResource } from '../content/types';
import { allResources } from '../content';

const ORIGIN = 'https://example.test';
const PROD = { contentMode: 'production' } as const;
const PROD_WITH_ORIGIN = { contentMode: 'production', siteUrl: ORIGIN } as const;
const REVIEW = { contentMode: 'review' } as const;

/*
 * The two origins the APPROVED_ORIGIN gate is driven with.
 *
 * `UNAPPROVED` is the real shape of the value that caused this: a host that is
 * configured, resolvable and deployable, that a presence check reads as a
 * supplied production origin, and that nobody has approved. It is deliberately
 * NOT the host in `APPROVED_ORIGIN` — the owner approved the Netlify subdomain
 * on 2026-09-04, so using it as the unapproved fixture would make the fixture
 * name a lie and would hide a bug where approval is ignored entirely.
 */
const UNAPPROVED = 'https://some-other-host.netlify.app';
const APPROVAL = { origin: ORIGIN, approvedIn: 'a test' };

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
      expect(indexability(entry, REVIEW)).toBe('review-build');
    }
  });

  it('does not let production inherit the review build noindex', () => {
    // The complement of the test above. Checking one direction only would pass
    // for a function that returned 'review-build' unconditionally.
    const indexableInProduction = PUBLIC_ROUTES.filter(
      (entry) => indexability(entry, PROD) === 'indexable',
    );
    expect(indexableInProduction.length).toBeGreaterThan(10);
  });

  it('names the reason, not just the boolean', () => {
    expect(indexability(route({ internal: true }), PROD)).toBe('internal');
    expect(indexability(route({ path: '/404' }), PROD)).toBe('error-page');
    expect(indexability(route({ placeholderOnly: true }), PROD)).toBe('placeholder');
    expect(indexability(route({ noindexReason: 'draft-content' }), PROD)).toBe('draft-content');
    expect(indexability(route(), PROD)).toBe('indexable');
  });

  it('treats a dynamic route as a template until a record is supplied', () => {
    const template = route({ dynamic: true, placeholderOnly: true });
    expect(indexability(template, PROD)).toBe('dynamic-template');
    expect(indexability(template, PROD, { approved: false })).toBe('unapproved-content');
    expect(indexability(template, PROD, { approved: true })).toBe('indexable');
  });

  it('keeps a registration route out of the index even for an APPROVED event', () => {
    /*
     * Tested with an approved detail instance on purpose.
     *
     * With no instance the route resolves to `dynamic-template`, which is
     * already noindex - so a browser test of the shell passes whether or not
     * the `registration-route` reason exists, and removing it changes nothing
     * visible. The reason only becomes load-bearing on the day an event is
     * approved, which is exactly the day nobody is testing this.
     *
     * A registration page for a REAL event is still a step in a journey rather
     * than a destination: its content belongs to the event, already indexed at
     * the detail URL.
     */
    expect(indexability(findRoute('/events/[slug]/register'), PROD, { approved: true })).toBe(
      'registration-route',
    );

    // And the detail route it belongs to IS indexable once approved, so this is
    // a property of the registration route and not of approval in general.
    expect(indexability(findRoute('/events/[slug]'), PROD, { approved: true })).toBe('indexable');
  });

  it('keeps a policy out of the index while, and only while, it is a draft', () => {
    /*
     * Asserted as the RULE rather than as today's answer.
     *
     * This read `toBe('draft-content')` unconditionally, which made adopting the
     * legal text - the correct act, and the one this whole item exists for - a
     * test failure. Worse, it hid a real defect: `noindexReason` used to be
     * hardcoded in the route registry, so a policy could be marked approved and
     * the page would go on emitting `noindex` with the reason `draft-content`.
     * Two sources of truth for one fact, disagreeing in exactly the situation
     * nobody rehearses.
     *
     * Now the reason is derived from the policy, and this asserts the pair moves
     * together in both directions.
     */
    for (const slug of ['privacy', 'terms']) {
      const policy = POLICIES.find((entry) => entry.slug === slug)!;
      const expected = policy.status === 'approved' ? 'indexable' : 'draft-content';
      expect(indexability(findRoute(`/${slug}`), PROD), slug).toBe(expected);
    }
  });
});

/**
 * THE APPROVED_ORIGIN GATE, BOTH DIRECTIONS.
 *
 * Either direction alone proves nothing. A gate observed only refusing is
 * indistinguishable from one that refuses always; a gate observed only emitting
 * is indistinguishable from no gate at all. Both mattered in turn: the constant
 * was null from the day it was written until the owner named the origin on
 * 2026-09-04, and it is filled in now. Every case below is therefore asserted
 * twice - once with the origin unapproved, once with an approved one.
 *
 * The defect this covers: the release gate learned to tell CONFIGURED from
 * APPROVED, and the BUILD did not. The report said B-7 unmet while `dist/`
 * shipped canonicals, `og:url`, JSON-LD and a sitemap at the placeholder host.
 */
describe('the APPROVED_ORIGIN gate', () => {
  const unapproved = seoContext(UNAPPROVED, 'production', null);
  const approved = seoContext(ORIGIN, 'production', APPROVAL);

  it('names an origin, and the build reads that one and not the configured one', () => {
    // The whole gate rests on the constant being consulted rather than on
    // `PUBLIC_SITE_URL` being non-empty. Changing it is a deliberate, visible
    // edit here; `src/tests/release.test.ts` holds it to `netlify.toml`.
    expect(APPROVED_ORIGIN).not.toBeNull();
    expect(seoContext(UNAPPROVED, 'production', APPROVED_ORIGIN).siteUrl).toBeUndefined();
  });

  it('withholds the origin when it is configured but not approved', () => {
    expect(unapproved.siteUrl).toBeUndefined();
    expect(unapproved.originUnapproved).toBe(true);
  });

  it('hands the origin over once the approval names it', () => {
    expect(approved.siteUrl).toBe(ORIGIN);
    expect(approved.originUnapproved).toBe(false);
  });

  it('does not flag an absent origin as unapproved - nothing is served from it', () => {
    const absent = seoContext(undefined, 'production', null);
    expect(absent.siteUrl).toBeUndefined();
    expect(absent.originUnapproved).toBe(false);
  });

  it('withholds it when an approval exists but names a DIFFERENT host', () => {
    // The deploy moved, or the approval did. Either way the two disagree, and
    // a canonical at the wrong one of them is the exact failure B-7 names.
    const mismatch = seoContext(UNAPPROVED, 'production', APPROVAL);
    expect(mismatch.siteUrl).toBeUndefined();
    expect(mismatch.originUnapproved).toBe(true);
  });

  it('noindexes every route on an unapproved origin, and stops when approved', () => {
    for (const route of PUBLIC_ROUTES) {
      expect(indexability(route, unapproved), route.path).toBe('unapproved-origin');
    }
    const indexableWhenApproved = PUBLIC_ROUTES.filter(
      (route) => indexability(route, approved) === 'indexable',
    );
    expect(indexableWhenApproved.length).toBeGreaterThan(10);
  });

  it('emits no canonical, og:url or og:image on an unapproved origin, and all three when approved', () => {
    const suppressed = pageSeo(findRoute('/about'), unapproved);
    expect(suppressed.canonical).toBeNull();
    expect(suppressed.social.image).toBeNull();
    expect(suppressed.social.card).toBe('summary');
    expect(suppressed.indexable).toBe(false);
    expect(suppressed.indexabilityReason).toBe('unapproved-origin');
    // The canonical must not merely be absent - it must not be the wrong host.
    expect(JSON.stringify(suppressed)).not.toContain(UNAPPROVED);

    const emitted = pageSeo(findRoute('/about'), approved);
    expect(emitted.canonical).toBe(`${ORIGIN}/about`);
    expect(emitted.social.image).toBe(`${ORIGIN}${SOCIAL_CARD.path}`);
    expect(emitted.social.card).toBe('summary_large_image');
    expect(emitted.indexable).toBe(true);
  });

  it('writes no sitemap on an unapproved origin, and a populated one when approved', () => {
    expect(sitemapXml(PUBLIC_ROUTES, unapproved)).toBeNull();
    // Detail paths must not sneak past the gate either: a sitemap is the most
    // damaging artifact to publish at a placeholder host, because it hands a
    // crawler every URL on it at once.
    expect(sitemapXml(PUBLIC_ROUTES, unapproved, ['/events/one'])).toBeNull();
    expect(sitemapRoutes(PUBLIC_ROUTES, unapproved)).toEqual([]);

    const xml = sitemapXml(PUBLIC_ROUTES, approved, ['/events/one']);
    expect(xml).not.toBeNull();
    expect(xml).toContain(`${ORIGIN}/events/one`);
    expect(sitemapRoutes(PUBLIC_ROUTES, approved).length).toBeGreaterThan(10);
  });

  it('builds no structured data on an unapproved origin, and both blocks when approved', () => {
    expect(organizationStructuredData(unapproved)).toBeNull();
    expect(webSiteStructuredData(unapproved)).toBeNull();
    expect(
      breadcrumbStructuredData([{ label: 'Home', href: '/' }, { label: 'About' }], unapproved),
    ).toBeNull();

    expect(organizationStructuredData(approved)).not.toBeNull();
    expect(webSiteStructuredData(approved)).not.toBeNull();
  });

  it('keeps robots.txt crawlable but sitemap-less on an unapproved origin', () => {
    const robots = robotsTxt(unapproved);
    expect(robots).not.toContain('Sitemap:');
    expect(robots).not.toContain(UNAPPROVED);
    // ALLOW, not Disallow, and this is the point rather than an oversight: a
    // disallowed page is never fetched, so its noindex is never read, and the
    // URL can still be indexed bare from an external link.
    expect(robots).toMatch(/^Allow: \/$/m);
    expect(robots).not.toMatch(/^Disallow: \/$/m);
    expect(robots).toContain('noindex');

    expect(robotsTxt(approved)).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it('stays noindex in a review build served at an approved origin', () => {
    // The two whole-origin rules are independent. Approving the origin must not
    // make the reviewer build, with its sample and draft content, crawlable.
    const reviewAtApproved = seoContext(ORIGIN, 'review', APPROVAL);
    expect(indexability(findRoute('/about'), reviewAtApproved)).toBe('review-build');
    expect(sitemapXml(PUBLIC_ROUTES, reviewAtApproved)).toBeNull();
    expect(robotsTxt(reviewAtApproved)).toMatch(/^Disallow: \/$/m);
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
    /*
     * The subjects are routes that are noindex STRUCTURALLY - a 404 and an
     * internal surface - rather than the legal pages, which are noindex only
     * while their policy is a draft. Using those as the example meant this test
     * would start passing vacuously, or failing, the day PAAIPE adopted its
     * legal text: the fixture would have changed underneath the property.
     *
     * The legal pages are still covered, conditionally, so nothing is lost.
     */
    for (const path of ['/404', '/internal/style-guide']) {
      expect(pageSeo(findRoute(path), PROD_WITH_ORIGIN).canonical, path).toBeNull();
    }
    for (const slug of ['privacy', 'terms']) {
      const policy = POLICIES.find((entry) => entry.slug === slug)!;
      if (policy.status === 'approved') continue;
      expect(pageSeo(findRoute(`/${slug}`), PROD_WITH_ORIGIN).canonical, slug).toBeNull();
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
  const indexable = PUBLIC_ROUTES.filter((route) => indexability(route, PROD) === 'indexable');

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
        indexability(route, PROD) === 'indexable',
      );
    }
  });

  it('never lists a noindex page - the property, not just the current data', () => {
    for (const route of sitemapRoutes(PUBLIC_ROUTES, PROD)) {
      expect(indexability(route, PROD)).toBe('indexable');
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
      expect(articleStructuredData(resource, PROD_WITH_ORIGIN)).toBeNull();
    }
  });

  it('requires every one of its five preconditions', () => {
    expect(articleStructuredData(base, PROD_WITH_ORIGIN)).not.toBeNull();
    expect(
      articleStructuredData({ ...base, contentStatus: 'sample' }, PROD_WITH_ORIGIN),
    ).toBeNull();
    expect(
      articleStructuredData({ ...base, visibility: 'members-only' }, PROD_WITH_ORIGIN),
    ).toBeNull();
    expect(articleStructuredData({ ...base, publishedAt: undefined }, PROD_WITH_ORIGIN)).toBeNull();
    expect(articleStructuredData({ ...base, publicBody: [] }, PROD_WITH_ORIGIN)).toBeNull();
    expect(articleStructuredData(base, PROD)).toBeNull();
  });

  it('does not invent an author', () => {
    const data = articleStructuredData(base, PROD_WITH_ORIGIN) as Record<string, unknown>;
    expect(data).not.toHaveProperty('author');
    expect(data.datePublished).toBe('2026-01-01');
  });
});
