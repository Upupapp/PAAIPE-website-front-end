/**
 * Reflow, WCAG 2.2 SC 1.4.10, measured for what it costs rather than for
 * whether the document happens to scroll.
 *
 * `routes.spec.ts` already checks each route for sideways scrolling by reading
 * `documentElement.scrollWidth`. That measure cannot see content CLIPPED behind
 * an `overflow: hidden` ancestor, and this site has several - the page hero on
 * every route among them. A hero that swallows 880px of a heading reports the
 * same contented 320 = 320 as a hero with nothing wrong.
 *
 * So this is not a duplicate of that check. It is the half of it that was
 * missing, and it runs at the two widths where reflow actually bites.
 */
import { expect, test } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../src/config/routes';
import { findClippedContent } from '../support/clipping';

const staticRoutes = PUBLIC_ROUTES.filter(
  (route) => !route.dynamic && !route.internal && route.path !== '/404',
);

test('there are routes to measure', () => {
  // A loop over nothing passes in exactly the same green as a loop over everything.
  expect(staticRoutes.length).toBeGreaterThan(10);
});

for (const route of staticRoutes) {
  // 320 is the narrowest width in the matrix. 640 is a 1280 desktop at 200%
  // zoom, which is what SC 1.4.10 actually requires and which Playwright can
  // only reach by halving the viewport.
  for (const width of [320, 640]) {
    test(`${route.path} clips no text or control at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(route.path);
      expect(await findClippedContent(page)).toEqual([]);
    });
  }
}
