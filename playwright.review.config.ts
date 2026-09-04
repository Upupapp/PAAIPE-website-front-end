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
  retries: process.env.CI ? 1 : 0,
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
