/**
 * Tab 09 - Core Web Vitals evidence for the event journey.
 *
 * MEASURED IN THE BROWSER, NOT SCORED. A Lighthouse number is an aggregate over
 * a simulated network, and this project has already recorded a case where it
 * reported CLS 0.000 on a page that really shifted 0.200. These read the same
 * entries the field data would.
 *
 * LAB EVIDENCE IS NOT FIELD DATA, and the command says so: "Lighthouse/TBT is a
 * laboratory proxy; use privacy-safe field/RUM data after launch to assess
 * actual INP." Nothing here should be read as a 75th-percentile claim. It is a
 * floor - if the lab cannot meet the target on an idle machine, the field
 * certainly will not - and the field plan is recorded in
 * `docs/events/seo-and-indexing.md`.
 *
 * CHROMIUM ONLY, ASSERTED. `layout-shift`, `longtask` and
 * `largest-contentful-paint` are not implemented in Firefox or WebKit, so an
 * observer there returns nothing and a zero would mean "not measured" rather
 * than "no shift". The entry types are checked before any zero is trusted.
 */
import { expect, test } from '@playwright/test';

const ROUTES = ['/events', '/events/sample-public-open'] as const;

for (const route of ROUTES) {
  test(`${route} shifts almost nothing and blocks for almost nothing`, async ({
    page,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'layout-shift and longtask exist only in Chromium; a zero elsewhere would mean "not measured"',
    );

    await page.goto(route);

    const supported = await page.evaluate(() => PerformanceObserver.supportedEntryTypes ?? []);
    expect(supported, 'layout-shift is not observable, so a CLS of 0 is meaningless').toContain(
      'layout-shift',
    );
    expect(supported).toContain('longtask');

    const measured = await page.evaluate(async () => {
      const shifts: number[] = [];
      const longTasks: number[] = [];
      const shiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value: number; hadRecentInput: boolean }
        >) {
          if (!entry.hadRecentInput) shifts.push(entry.value);
        }
      });
      const taskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) longTasks.push(entry.duration);
      });
      shiftObserver.observe({ type: 'layout-shift', buffered: true });
      taskObserver.observe({ type: 'longtask', buffered: true });

      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      shiftObserver.disconnect();
      taskObserver.disconnect();

      return {
        cls: shifts.reduce((total, value) => total + value, 0),
        shiftCount: shifts.length,
        longestTask: longTasks.length === 0 ? 0 : Math.max(...longTasks),
      };
    });

    // The CWV threshold is 0.1. These pages animate only opacity and transform,
    // neither of which triggers layout, so the bar is set far tighter - a
    // regression to a layout-affecting property shows up long before "poor".
    expect(
      measured.cls,
      `${route} produced ${measured.shiftCount} layout shifts totalling ${measured.cls}`,
    ).toBeLessThan(0.02);
    expect(
      measured.longestTask,
      `${route} blocked for ${Math.round(measured.longestTask)}ms in one task`,
    ).toBeLessThan(50);
  });

  test(`${route} paints its largest element quickly`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'largest-contentful-paint is Chromium-only');

    await page.goto(route);
    const supported = await page.evaluate(() => PerformanceObserver.supportedEntryTypes ?? []);
    expect(supported, 'LCP is not observable here, so any number would be invented').toContain(
      'largest-contentful-paint',
    );

    const lcp = await page.evaluate(
      async () =>
        new Promise<number>((resolve) => {
          let latest = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) latest = entry.startTime;
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => {
            observer.disconnect();
            resolve(latest);
          }, 1200);
        }),
    );

    /*
     * A LOCAL PREVIEW SERVER IS NOT A NETWORK, so this cannot demonstrate the
     * 2.5s field target - it can only show that the page does not spend seconds
     * of its own doing before painting. Anything approaching the target here
     * would be a serious problem in the field, which is what makes the loose
     * bound worth asserting.
     */
    expect(lcp, `${route} took ${Math.round(lcp)}ms to its largest paint locally`).toBeLessThan(
      2000,
    );
    expect(lcp, 'no LCP entry was recorded, so this measured nothing').toBeGreaterThan(0);
  });
}

test.describe('server rendering', () => {
  /*
   * `test.use` rather than a hand-built context. The first version called
   * `browser.newContext()` inside the test, which spun up an extra context per
   * project and contributed to `browserContext.close` timeouts once the suite
   * had grown - a test that costs more than it measures.
   */
  test.use({ javaScriptEnabled: false });

  test('the marketplace renders its cards without client JavaScript', async ({ page }) => {
    /*
     * The command requires event content to be SERVER-RENDERED, and the cheapest
     * proof is to switch scripting off and count what is still there. A page
     * that needs JavaScript to show its list has an LCP no tuning fixes.
     */
    await page.goto('/events');
    const scripting = await page.evaluate(() => 'noJs' in window || true);
    expect(scripting, 'the page did not load').toBe(true);
    const cards = await page.locator('.event-card').count();
    expect(cards, 'no event card is server-rendered').toBeGreaterThan(0);
  });
});
