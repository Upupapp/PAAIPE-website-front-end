/**
 * Visual regression at the five widths Tab 15 names: 320, 390, 768, 1024, 1440.
 *
 * ONE ENGINE, ON PURPOSE
 * ----------------------
 * A pixel baseline is engine-specific: font rasterisation, sub-pixel
 * antialiasing and scrollbar width all differ. Three engines would mean three
 * sets of baselines and three ways for an unrelated browser update to turn the
 * suite red for no product reason. Chromium is the reference. Cross-engine
 * differences are caught by `routes.spec.ts` and `journeys.spec.ts`, which
 * measure geometry and behaviour rather than compare pixels, and those DO run
 * in every engine.
 *
 * WHY THE CAPTURES ARE FORCED INTO A FIXED STATE
 * ----------------------------------------------
 * `reducedMotion: 'reduce'` and an animation settle, because a screenshot taken
 * mid-transition is a different page every run. The pointer is parked, because
 * a hovered nav item repaints the dropdown. Both were measured problems in
 * earlier tabs, not precautions.
 *
 * WHAT A FAILURE MEANS
 * --------------------
 * A diff is not automatically a defect - it is a CHANGE that nobody has looked
 * at. Review the diff image Playwright writes, and if the change is intended,
 * re-run with `--update-snapshots`. Never update baselines without opening the
 * diff: a baseline updated blind turns this suite into a stamp.
 */
import { expect, test, type Page } from '@playwright/test';

/** 375 and 390 are the same breakpoint; 390 is the iPhone 13 width already used. */
const WIDTHS = [320, 390, 768, 1024, 1440];

/** One page per layout family, rather than all fourteen: a diff on the shared
 *  shell would otherwise be reported fourteen times and read as fourteen faults. */
const ROUTES = [
  { path: '/', name: 'home' },
  { path: '/membership', name: 'membership' },
  { path: '/events', name: 'events' },
  { path: '/privacy', name: 'privacy-draft' },
];

/*
 * `reducedMotion` belongs to the CONTEXT options, and `test.use` types it as a
 * fixture override - which it is not. Setting it on each page instead keeps the
 * capture deterministic without lying to the type system.
 */
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function freeze(page: Page): Promise<void> {
  // Park the pointer away from the navigation: a hovered item opens a dropdown.
  await page.mouse.move(0, 0);
  await page
    .waitForFunction(
      () => document.getAnimations().every((animation) => animation.playState !== 'running'),
      undefined,
      { timeout: 4000 },
    )
    .catch(() => {
      /* the assertion below will show whatever is still moving */
    });
  // The reveal layer only runs elements it has seen; scroll the page once so
  // below-the-fold content is in its final state rather than its pre-reveal one.
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(200);
}

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    test(`${route.name} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route.path);
      await freeze(page);

      await expect(page).toHaveScreenshot(`${route.name}-${width}.png`, {
        fullPage: true,
        /*
         * AN ABSOLUTE BUDGET, NOT A RATIO, and the difference is not academic.
         *
         * This was `maxDiffPixelRatio: 0.002`. On a FULL-PAGE capture the
         * denominator is the whole page, so the allowance grows with page
         * length: the home page is 1440x6976, and 0.002 of it is 20,090 pixels
         * that may differ before anything fails. A tall page bought a bigger
         * blind spot, and the taller the page grew the less the gate saw.
         *
         * MEASURED: an entire decorative Philippine contour was added to the
         * home hero - roughly 600x1020 of visible stroke - and all five widths
         * passed against baselines that did not contain it. Removing it again
         * also passed. The gate could not tell the two apart.
         *
         * A fixed budget cannot be inflated by page length. 4000 sits about
         * three times above the measured run-to-run noise on this machine
         * (1,232-1,323 differing pixels across a full page, from sub-pixel text
         * rendering), and five times below what the ratio was permitting.
         */
        maxDiffPixels: 4000,
        /*
         * AND A PER-PIXEL SENSITIVITY, which is the half that was actually
         * blind. Playwright's default `threshold` is 0.2 - a pixel must differ
         * by that much in YIQ before it is counted as different AT ALL. A faint
         * decorative layer never clears it, so the budget above is never even
         * consulted.
         *
         * MEASURED, by removing the home hero's contour and re-running:
         *   threshold 0.2 (default)  ->  passes. The gate sees nothing.
         *   threshold 0.1            ->  passes. Still nothing.
         *   threshold 0.05           ->  FAILS, correctly.
         * So 0.05 is not a guess; it is the first value at which this gate can
         * see a change a person can see.
         */
        threshold: 0.05,
        animations: 'disabled',
        caret: 'hide',
      });
    });
  }
}
