import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  /*
   * See F-64, which is now EXPLAINED rather than merely characterised. Both
   * WebKit projects on this machine freeze as a FLEET: every WebKit context
   * stops issuing requests at the same instant for about 54 seconds, then
   * resumes. Measured, not inferred - an instrumented preview server saw 5,475
   * requests with a 15ms worst case and then 54.2s of total silence, while an
   * independent HTTP client polling the same server through the same freeze
   * logged no gap over 1.5s. So it is not the server and not the machine.
   *
   * DO NOT LOWER THIS TIMEOUT, AND DO NOT ADD A SHORTER navigationTimeout.
   * The 60s budget is load-bearing precisely BECAUSE it outlives the ~54s
   * freeze: the test dies once, and the retry then runs in clean air and
   * passes. "Fail fast" is the standard advice and here it is actively
   * harmful - a 20s navigation timeout would start the retry while the freeze
   * is still going, so both attempts die and a recovered flake becomes a hard
   * red suite.
   *
   * DO NOT LOWER `workers` EITHER. Turning workers down to "reduce contention"
   * measurably makes this WORSE: 4 workers produced 4 timeouts on each of four
   * runs and 2 workers produced 4, while 5 produced 0 to 1. Failures track how
   * many workers are mid-navigation when a freeze lands, so a faster run is a
   * safer one.
   *
   * A retried pass is reported as FLAKY rather than as a pass, so the run still
   * says something went wrong.
   */
  retries: 1,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // Tab 15 requires Chromium, Firefox AND WebKit. Firefox is a desktop
    // project: it has no mobile build, and pretending otherwise by shrinking a
    // desktop viewport would report a "mobile Firefox" result that no device
    // produces.
    {
      name: 'firefox-desktop',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    // Mobile web is verified in WebKit, not Chromium: Chromium does not
    // reproduce iOS input-zoom or Safari layout behaviour.
    {
      name: 'webkit-mobile',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['iPhone 13'] },
    },
    // Desktop Safari as well as mobile: the two share an engine but not a
    // viewport, and Tab 15's matrix names desktop Safari explicitly.
    {
      name: 'webkit-desktop',
      testIgnore: /visual\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
    /*
     * Visual regression runs in ONE engine only.
     *
     * A pixel baseline is engine-specific - font rasterisation, sub-pixel
     * antialiasing and scrollbar width all differ - so three engines means
     * three sets of baselines and three ways for an unrelated engine update to
     * turn the suite red. Chromium is the reference; layout DIFFERENCES between
     * engines are caught by the assertions in routes.spec.ts, which measure
     * geometry rather than compare pixels, and those do run everywhere.
     */
    {
      name: 'visual-chromium',
      testMatch: /visual\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Visual baselines are compared against the reference project's snapshots.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  webServer: {
    // Browser tests run against the real production build, not the dev server.
    // `astro preview` daemonizes without a TTY and exits 0, which Playwright
    // reads as an early exit, so a foreground server is used instead.
    command: `npm run build && PREVIEW_PORT=${PORT} node scripts/preview-server.mjs`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
