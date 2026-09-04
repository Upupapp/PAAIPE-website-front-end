/**
 * The two detail screens no browser had ever loaded.
 *
 * `src/pages/events/[slug].astro` and `src/pages/resources/[slug].astro` are
 * only reachable in review content mode. The production suite asserts they 404,
 * which is right, and which also meant every claim about how they LOOK and
 * whether they are ACCESSIBLE rested on reading the source.
 *
 * The routes are computed with the same `publishable()` the build calls, so a
 * record that stops being published stops being asserted here, and one that
 * starts being published is covered without anyone remembering to add it.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { DRAFT_ALLOW_LIST } from '../../src/config/content-mode';
import { EVENTS } from '../../src/content/events';
import { RESOURCES } from '../../src/content/resources';
import { publishable, reviewLabel } from '../../src/lib/content-visibility';
import { findClippedContent } from '../support/clipping';
import { settleAnimations } from '../support/settle-animations';

/*
 * The LEAF content modules, not the `src/content` barrel. The barrel pulls in
 * `src/config`, which reads `import.meta.env` - defined by Astro at build time
 * and undefined under Playwright's loader, so importing it here fails at
 * collection with `Cannot read properties of undefined (reading
 * 'PUBLIC_SITE_URL')` and Playwright reports "No tests found". A suite that
 * collects nothing exits non-zero here, but "no tests found" is one config
 * change away from looking like a pass, which is why the first test below
 * asserts the screen list is non-empty.
 */
const events = publishable(EVENTS, 'review', DRAFT_ALLOW_LIST);
const resources = publishable(RESOURCES, 'review', DRAFT_ALLOW_LIST);

const SCREENS = [
  ...events.map((record) => ({ path: `/events/${record.slug}`, record })),
  ...resources.map((record) => ({ path: `/resources/${record.slug}`, record })),
];

/*
 * A suite that silently covers nothing looks exactly like a suite that passes.
 * If review mode ever stops publishing these records, this fails rather than
 * reporting a green run over an empty loop.
 */
test('review mode publishes detail screens to assert on', () => {
  expect(events.length, 'no event detail screen is published in review mode').toBeGreaterThan(0);
  expect(resources.length, 'no resource detail screen is published in review mode').toBeGreaterThan(
    0,
  );
});

/*
 * Both suites build into `dist/`. If a production build is what is actually
 * being served - a stale server on this port, or a `npm run build` that landed
 * after the review one - every test below would 404 and read as "the detail
 * screens are broken". This says which it is.
 */
test('the server under test is a REVIEW build, not a production one', async ({ page }) => {
  const first = SCREENS[0];
  expect(first, 'no detail screen to probe').toBeDefined();
  const response = await page.goto(first!.path);
  expect(
    response?.status(),
    `${first!.path} is absent. dist/ holds a PRODUCTION build; run this suite through ` +
      '`npm run test:e2e:review`, which builds review mode first.',
  ).toBe(200);
});

for (const { path, record } of SCREENS) {
  test(`${path} direct-loads with one H1 and its title`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(record.title);
    expect(await page.title()).toContain(record.title);
  });

  test(`${path} skips no heading level`, async ({ page }) => {
    await page.goto(path);
    const levels = await page.$$eval('h1,h2,h3,h4,h5,h6', (nodes) =>
      nodes.map((node) => Number(node.tagName.slice(1))),
    );
    expect(levels.length, 'a detail screen with no headings is not a screen').toBeGreaterThan(1);
    const skips: string[] = [];
    for (let i = 1; i < levels.length; i += 1) {
      const previous = levels[i - 1]!;
      const current = levels[i]!;
      if (current > previous + 1) skips.push(`h${previous} -> h${current}`);
    }
    expect(skips).toEqual([]);
  });

  test(`${path} withholds member detail STRUCTURALLY, not by hiding it`, async ({ page }) => {
    /*
     * A members-only page must not carry the private fields at all. "Hidden"
     * is not withheld - anything served to the browser is readable by anyone
     * who opens the source, whatever CSS says about it.
     */
    test.skip(record.visibility !== 'members-only', 'record is public');
    await page.goto(path);
    const html = await page.content();
    for (const pattern of [/zoom\.us/i, /passcode/i, /meeting\s*id/i, /\bwebinar\s*id\b/i]) {
      expect(html, `${path} carries ${pattern}`).not.toMatch(pattern);
    }
    /*
     * And nothing is merely HIDDEN either - served to the browser and then
     * concealed with CSS, which withholds nothing from anyone who opens the
     * source.
     *
     * Scoped to <main>, and the scope is the point rather than a convenience.
     * Unscoped, this reported five "hidden blocks" on every page: <head>, a
     * <script> and three <style> elements, for which `display: none` is simply
     * the default. Those are the document's machinery, not concealed prose, and
     * a probe that counts them is measuring something other than what it
     * claims. Private content would be in the page body or nowhere.
     */
    const hidden = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main) return ['no <main> to inspect'];
      return Array.from(main.querySelectorAll('*'))
        .filter((el) => {
          if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return false;
          return (
            getComputedStyle(el).display === 'none' && (el.textContent ?? '').trim().length > 120
          );
        })
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${String(el.className || '').split(' ')[0]} hides ` +
            `${(el.textContent ?? '').trim().length} chars`,
        );
    });
    expect(hidden, 'text is served to the browser and hidden with CSS').toEqual([]);
  });

  test(`${path} says it is not approved content`, async ({ page }) => {
    /*
     * The house rule: a review build must never look like a published one. A
     * non-approved record carries a visible label, and the label is the whole
     * reason a review build is safe to show anyone.
     */
    const label = reviewLabel(record.contentStatus);
    test.skip(label === null, 'record is approved, so it carries no review label');
    await page.goto(path);
    await expect(page.getByText(label!, { exact: false }).first()).toBeVisible();
  });

  test(`${path} has no serious or critical accessibility defect`, async ({ page }) => {
    await page.goto(path);
    await settleAnimations(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  for (const width of [320, 640]) {
    test(`${path} neither scrolls nor CLIPS at ${width}px`, async ({ page }) => {
      /*
       * 320 is the narrowest width in the matrix. 640 is the 1280 desktop at
       * 200% zoom - WCAG 2.2 SC 1.4.10 Reflow - emulated by halving the
       * viewport, because Playwright cannot set a browser zoom level.
       *
       * WHY THIS DOES NOT MEASURE `documentElement.scrollWidth`, which is the
       * obvious way and the way the production suite still does it: a 1200px
       * element planted in this very page did NOT move it. `section.page-hero`
       * carries `overflow-x: hidden`, so the element was CLIPPED instead of
       * widening the document, and the document reported a contented 320 = 320
       * while 880px of content sat outside the visible box.
       *
       * Clipping is the WORSE outcome of the two. A page that scrolls sideways
       * is ugly and reachable; content clipped behind `overflow: hidden` cannot
       * be reached at all, at any zoom, by any input.
       *
       * So the assertion looks for the clip itself - an element whose own
       * content is wider than its own box while its overflow is hidden - and
       * only then falls back to the document-level check for the plain
       * sideways-scroll case.
       */
      await page.setViewportSize({ width, height: 720 });
      await page.goto(path);
      await settleAnimations(page);
      const problems = await findClippedContent(page);
      expect(problems).toEqual([]);
    });
  }

  test(`${path} ends its breadcrumb trail on a non-link`, async ({ page }) => {
    // The current page is not somewhere you can navigate to.
    await page.goto(path);
    const trail = page.locator('nav[aria-label="Breadcrumb"] li').last();
    await expect(trail).toBeVisible();
    await expect(trail.locator('a')).toHaveCount(0);
  });

  test(`${path} claims no restriction it does not actually impose`, async ({ page }) => {
    /*
     * The rule this enforces, and the recommendation it REFUSES.
     *
     * The research lane proposed marking members-only detail pages with
     * `isAccessibleForFree: false` plus a `hasPart` `WebPageElement` whose
     * `cssSelector` names the restricted region - Google's documented way to
     * declare gated content honestly. Read against Google's own spec, it does
     * not fit these pages, and using it would be the dishonesty it exists to
     * prevent:
     *
     *   "Add a class name around each paywalled section of your page ... The
     *    cssSelector references the class name that you added."
     *
     * The selector points at the RESTRICTED CONTENT, which must be present in
     * the HTML - hidden from the reader, but served. Our privacy boundary is
     * structural instead: the date, the speaker and the joining link are not
     * hidden on a members-only page, they are ABSENT from it. Measured on this
     * build: no hidden-content wrapper, no `display:none`, and no meeting id,
     * passcode or Zoom URL anywhere in the document. There is nothing for a
     * selector to point at, and `isAccessibleForFree: false` over a page whose
     * every word is free to read would misdescribe it - which Google's general
     * guidelines forbid outright.
     *
     * So nothing is emitted. This test is what makes that decision durable: if
     * someone adds the markup later, it has to be TRUE. A restriction claim
     * must name an element, and that element must exist and hold content.
     */
    await page.goto(path);
    const problems = await page.evaluate(() => {
      const found: string[] = [];
      const blocks = Array.from(
        document.querySelectorAll('script[type="application/ld+json"]'),
      ).map((node) => node.textContent ?? '');

      const walk = (value: unknown): void => {
        if (Array.isArray(value)) {
          value.forEach(walk);
          return;
        }
        if (!value || typeof value !== 'object') return;
        const node = value as Record<string, unknown>;

        const selectorOf = (part: unknown): string | null => {
          if (!part || typeof part !== 'object') return null;
          const raw = (part as Record<string, unknown>).cssSelector;
          return typeof raw === 'string' ? raw : null;
        };
        const parts = Array.isArray(node.hasPart) ? node.hasPart : [node.hasPart];
        const selectors = parts.map(selectorOf).filter((s): s is string => s !== null);

        if (node.isAccessibleForFree === false && selectors.length === 0) {
          found.push(
            'isAccessibleForFree:false with no hasPart cssSelector naming what is restricted',
          );
        }
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (!el) {
            found.push(`cssSelector ${JSON.stringify(selector)} matches no element on the page`);
          } else if ((el.textContent ?? '').trim().length === 0) {
            found.push(`cssSelector ${JSON.stringify(selector)} matches an EMPTY element`);
          }
        }
        Object.values(node).forEach(walk);
      };

      for (const block of blocks) {
        try {
          walk(JSON.parse(block));
        } catch {
          /* the parse test beside this one reports unparseable blocks */
        }
      }
      return found;
    });
    expect(problems).toEqual([]);
  });

  test(`${path} emits structured data that parses`, async ({ page }) => {
    await page.goto(path);
    const blocks = await page.$$eval('script[type="application/ld+json"]', (nodes) =>
      nodes.map((node) => node.textContent ?? ''),
    );
    for (const block of blocks) {
      expect(() => JSON.parse(block) as unknown, `unparseable JSON-LD on ${path}`).not.toThrow();
    }
  });
}
