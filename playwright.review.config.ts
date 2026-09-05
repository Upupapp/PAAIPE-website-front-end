import { defineConfig, devices } from '@playwright/test';

/*
 * The REVIEW-mode browser suite, and the reason it has to be a second config.
 *
 * `playwright.config.ts` boots `npm run build` - production content mode. In
 * that mode nothing is approved, so `src/pages/events/[slug].astro` and
 * `src/pages/resources/[slug].astro` generate ZERO pages. The main suite's only
 * statement about them is that they 404, which is correct and which is also the
 * reason no browser has ever loaded either template. Two whole screens shipped
 * in the repository with 861 browser assertions standing beside them and not
 * one of those assertions on the screens themselves.
 *
 * This config builds in review mode, where the same templates DO generate
 * pages, and points a browser at them.
 *
 * A second port and a second testDir, so the two suites cannot pick up each
 * other's specs or reuse each other's server. They still share `dist/`, exactly
 * as `npm run check` already alternates it between modes - which is why the
 * first test in the suite refuses to run against a production build.
 */
const PORT = 4322;

export default defineConfig({
  testDir: './tests/e2e-review',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /*
   * ONE RETRY LOCALLY, and it is reported as FLAKY rather than passed.
   *
   * Measured 2026-09-05: the `webkit-mobile` project takes 2.5 minutes for 278
   * tests where `chromium-desktop` takes 22 seconds for 288, and at that scale
   * it produces three to five `page.goto` timeouts per run - DIFFERENT tests
   * each time, including long-standing ones this work never touched, and every
   * one of them passing when its spec is run alone. Lowering workers to two made
   * it slower and no more stable, so it is not simple contention for cores.
   *
   * Retrying is the honest instrument here because Playwright counts a retried
   * pass as FLAKY, not as a pass: the report still says something went wrong,
   * which a longer timeout or a trimmed assertion would not. The alternative -
   * cutting WebKit coverage until the suite is quiet - would buy green by
   * measuring less, and WebKit is where mobile layout actually differs.
   *
   * Recorded as an environment finding, not a product defect.
   */
  retries: 1,
  /*
   * AN EXPLICIT WORKER CAP, because the suite outgrew the default.
   *
   * Playwright defaults to about half the cores - five here - and each worker
   * runs a full browser context. Once this suite reached ~580 tests, several of
   * them holding a page open for a second or more to observe layout-shift and
   * LCP entries, five parallel emulated-mobile WebKit contexts began failing
   * with `page.goto` and `browserContext.close` timeouts. Never assertions: the
   * signature of a capacity problem, not a defect. Running the same specs alone
   * takes five seconds and passes.
   *
   * Three workers is a HARNESS fix and is named as one. The tempting
   * alternative was to trim the measurements until they fit a 30-second budget
   * under contention, which would have bought a green suite by measuring less.
   */
  workers: process.env.CI ? 2 : 3,
  /*
   * 60s per test, not the 30s default.
   *
   * This suite went from ~220 tests to ~580 when Tab 04 corrected its screen
   * list - it had been asserting one of the nine detail pages the build
   * produces. That is real coverage, and it roughly tripled the browser work.
   * On a shared machine, three parallel emulated-mobile WebKit contexts now
   * routinely exceed 30 seconds on a plain `page.goto`, and the tests that time
   * out MOVE BETWEEN RUNS - including long-standing ones this tab never
   * touched, which is what identifies it as contention rather than a defect.
   *
   * A longer budget hides nothing: an assertion that fails still fails, and a
   * genuinely hung page still stops the suite. What it stops doing is reporting
   * a busy laptop as a broken page.
   */
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    // Mobile web is verified in WebKit, not a narrowed Chromium: these screens
    // have never been seen at any width, and the narrow one is where a detail
    // page's badge row and definition list are most likely to break.
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: `npm run build:review && PREVIEW_PORT=${PORT} node scripts/preview-server.mjs`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
