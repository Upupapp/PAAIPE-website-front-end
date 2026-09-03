/**
 * Tab 14 in a real browser: metadata, delivered assets, statuses, and the two
 * things a static scan cannot see - what the network actually requests, and
 * what the layout engine actually renders.
 */
import { expect, test } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../src/config/routes';
import { indexability } from '../../src/lib/seo';

/** Production build: exactly what `npm run build` produces for the preview server. */
const indexable = PUBLIC_ROUTES.filter(
  (route) => indexability(route, 'production') === 'indexable',
);
const noindexPages = PUBLIC_ROUTES.filter(
  (route) => !route.dynamic && !route.internal && indexability(route, 'production') !== 'indexable',
);

test.describe('rendered logo geometry', () => {
  /**
   * The regression guard for the squashed lockup.
   *
   * global.css sets `img { max-width: 100% }`, and the optical variant narrows
   * the wrapper below the image's own width - so the image was clamped to the
   * wrapper and rendered 9.7% too narrow on every page. A static scan of the
   * markup cannot see this: the width and height ATTRIBUTES were right, and
   * only the layout engine knows what `max-width` did to them.
   */
  for (const path of ['/', '/about', '/membership']) {
    test(`${path} renders every logo at its own aspect ratio`, async ({ page }) => {
      await page.goto(path);
      const measured = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLImageElement>('.logo-lockup img')].map((img) => {
          const style = getComputedStyle(img);
          return {
            rendered: parseFloat(style.width) / parseFloat(style.height),
            intrinsic: img.naturalWidth / img.naturalHeight,
            width: style.width,
          };
        }),
      );
      expect(measured.length, 'no logo found on the page').toBeGreaterThan(0);
      for (const logo of measured) {
        // 0.5% tolerance: enough for sub-pixel rounding, far tighter than the
        // 9.7% distortion this guards against.
        expect(
          Math.abs(logo.rendered - logo.intrinsic) / logo.intrinsic,
          `logo rendered at ${logo.rendered.toFixed(4)} against an intrinsic ${logo.intrinsic.toFixed(4)} (width ${logo.width})`,
        ).toBeLessThan(0.005);
      }
    });
  }
});

test.describe('metadata in the served document', () => {
  for (const route of indexable) {
    test(`${route.path} carries a description and no robots directive`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);

      await expect(page.locator('head title')).toHaveCount(1);
      const description = page.locator('head meta[name="description"]');
      await expect(description).toHaveCount(1);
      await expect(description).toHaveAttribute('content', route.description!);

      // Production must not inherit the review build's noindex.
      await expect(page.locator('head meta[name="robots"]')).toHaveCount(0);

      // No origin is configured, so no absolute URL can be formed.
      await expect(page.locator('head link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('head meta[property="og:image"]')).toHaveCount(0);
      await expect(page.locator('head meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary',
      );

      // Social copy is present regardless: it needs no origin.
      await expect(page.locator('head meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('head meta[property="og:description"]')).toHaveCount(1);
    });
  }

  for (const route of noindexPages) {
    test(`${route.path} says noindex and gives the reason`, async ({ page }) => {
      await page.goto(route.path);
      const robots = page.locator('head meta[name="robots"]');
      await expect(robots).toHaveCount(1);
      await expect(robots).toHaveAttribute('content', /noindex/);
      await expect(robots).toHaveAttribute(
        'data-noindex-reason',
        indexability(route, 'production'),
      );
    });
  }
});

test.describe('crawler and platform files', () => {
  test('robots.txt is served, allows crawling, and names no internal path', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/plain');
    const body = await response.text();
    expect(body).toMatch(/^Allow: \/$/m);
    expect(body).not.toMatch(/^Disallow: \/$/m);
    for (const route of PUBLIC_ROUTES.filter((entry) => entry.internal)) {
      expect(body).not.toContain(route.path);
    }
  });

  test('there is no sitemap, because there is no configured origin', async ({ request }) => {
    // The honest answer to "where is your sitemap" is 404, not an empty
    // <urlset> (which reads as "this site has no pages") and not a sitemap of
    // guessed URLs. robots.txt agrees: it carries no Sitemap line.
    expect((await request.get('/sitemap.xml')).status()).toBe(404);
    expect(await (await request.get('/robots.txt')).text()).not.toContain('Sitemap:');
  });

  test('the web manifest is served as a manifest and parses', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/manifest+json');
    const manifest = JSON.parse(await response.text());
    expect(manifest.name).toContain('Philippine Association');
    expect(manifest.display).toBe('browser');
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status(), `${icon.src} is not served`).toBe(200);
    }
  });

  test('every icon the document links actually resolves', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLLinkElement>(
          'head link[rel~="icon"], head link[rel="apple-touch-icon"], head link[rel="manifest"]',
        ),
      ].map((link) => link.getAttribute('href')!),
    );
    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const href of hrefs) {
      expect((await request.get(href)).status(), `${href} is not served`).toBe(200);
    }
  });

  test('the branded social card ships at its declared size', async ({ request }) => {
    const response = await request.get('/social/paaipe-social-card.png');
    expect(response.status()).toBe(200);
    const bytes = await response.body();
    // PNG IHDR: width and height are big-endian uint32 at byte 16 and 20.
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
  });

  test('an unknown path is a real 404, not a soft one', async ({ request }) => {
    const response = await request.get('/no-such-page-here');
    expect(response.status()).toBe(404);
    const body = await response.text();
    expect(body).toContain('404');
    expect(body).toMatch(/name="robots"[^>]*noindex/);
  });
});

test.describe('privacy and third parties', () => {
  test('a page load requests nothing from another origin', async ({ page, baseURL }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith(baseURL!) && !url.startsWith('data:') && !url.startsWith('blob:')) {
        external.push(url);
      }
    });
    await page.goto('/');
    await page.waitForLoadState('load');
    expect(external, 'the page contacted a third party').toEqual([]);
  });

  test('nothing is stored before anyone interacts', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('load');
    expect(await context.cookies(), 'a cookie was set on first load').toEqual([]);
    const stored = await page.evaluate(() => ({
      local: Object.keys(localStorage),
      session: Object.keys(sessionStorage),
    }));
    expect(stored.local, 'localStorage was written before any interaction').toEqual([]);
    expect(stored.session).toEqual([]);
  });
});
