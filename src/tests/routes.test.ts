import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findRoute, INDEXABLE_ROUTES, PUBLIC_ROUTES } from '../config/routes';
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../config/site';

/** Every route the master command Tab 01 Step 4 requires. */
const REQUIRED_ROUTES = [
  '/',
  '/about',
  '/programs',
  '/events',
  '/events/[slug]',
  '/speakers',
  '/resources',
  '/resources/[slug]',
  '/membership',
  '/benefits',
  '/partners',
  '/responsible-ai',
  '/contact',
  '/privacy',
  '/terms',
  '/accessibility',
  '/internal/style-guide',
  '/404',
];

/** Routes the master command explicitly forbids. */
const FORBIDDEN_ROUTES = ['/dashboard', '/community', '/profile', '/login'];

const PAGES_DIR = new URL('../pages/', import.meta.url).pathname;

function walkPages(dir: string, prefix = ''): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return walkPages(full, `${prefix}/${entry}`);
    if (!entry.endsWith('.astro')) return [];
    const name = entry.replace(/\.astro$/, '');
    if (name === 'index') return [prefix === '' ? '/' : prefix];
    return [`${prefix}/${name}`];
  });
}

describe('public route registry', () => {
  it('declares every required public route exactly once', () => {
    const paths = PUBLIC_ROUTES.map((route) => route.path);
    expect([...paths].sort()).toEqual([...REQUIRED_ROUTES].sort());
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('has a page file on disk for every declared route, and no page that is not declared', () => {
    /*
     * One route's FILE name is not its path. Tab 14 (F-12) excludes the
     * internal style guide from the production build entirely rather than
     * merely marking it noindex - `noindex` is a request to a crawler, not
     * access control, and a static host has nowhere to put a login. The only
     * reliable exclusion is not to emit the file, which needs `getStaticPaths`,
     * which needs a dynamic filename. So `/internal/style-guide` lives in
     * `internal/[guide].astro` and returns one path in a review build and none
     * in production. `scripts/verify-seo.mjs` asserts both directions against
     * the built output; this asserts the mapping is deliberate.
     */
    const expected = PUBLIC_ROUTES.map((route) =>
      route.path === '/internal/style-guide' ? '/internal/[guide]' : route.path,
    );
    expect(walkPages(PAGES_DIR).sort()).toEqual([...expected].sort());
  });

  it('declares no protected route', () => {
    const paths = PUBLIC_ROUTES.map((route) => route.path);
    for (const forbidden of FORBIDDEN_ROUTES) {
      expect(paths).not.toContain(forbidden);
      expect(paths.some((path) => path.startsWith(`${forbidden}/`))).toBe(false);
    }
  });

  it('gives every route a non-empty, unique browser title', () => {
    const titles = PUBLIC_ROUTES.map((route) => route.title);
    expect(titles.every((title) => title.trim().length > 0)).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('gives every route exactly one non-empty main heading', () => {
    expect(PUBLIC_ROUTES.every((route) => route.heading.trim().length > 0)).toBe(true);
  });

  it('keeps dynamic routes and the 404 out of the indexable set', () => {
    const indexable = INDEXABLE_ROUTES.map((route) => route.path);
    expect(indexable).not.toContain('/404');
    expect(indexable.some((path) => path.includes('['))).toBe(false);
    expect(indexable.some((path) => path.startsWith('/internal/'))).toBe(false);
    // 18 declared routes, minus the 2 dynamic templates, the internal style
    // guide and the 404.
    expect(indexable).toHaveLength(14);
  });

  it('marks every dynamic route as a noindex placeholder until Tab 03 supplies content', () => {
    for (const route of PUBLIC_ROUTES.filter((r) => r.dynamic)) {
      expect(route.placeholderOnly).toBe(true);
    }
  });

  it('throws on an unknown route rather than rendering an untitled page', () => {
    expect(() => findRoute('/nope')).toThrow(/Unknown public route/);
  });
});

describe('approved identity strings', () => {
  it('uses the exact organisation name and acronym', () => {
    expect(ORGANIZATION_NAME).toBe('Philippine Association of AI Professionals and Entrepreneurs');
    expect(ACRONYM).toBe('PAAIPE');
  });

  // The slogan uses a typographic apostrophe and an em dash. A straight
  // apostrophe or a hyphen is a different string and fails the Tab 15 audit.
  it('uses the exact slogan, including the typographic apostrophe and em dash', () => {
    expect(SLOGAN).toBe('Building the Philippines’ AI-Powered Future—Together.');
    expect(SLOGAN).toContain('’');
    expect(SLOGAN).toContain('—');
    expect(SLOGAN).not.toContain("'");
  });
});
