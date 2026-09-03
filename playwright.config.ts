import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    // Mobile web is verified in WebKit, not Chromium: Chromium does not
    // reproduce iOS input-zoom or Safari layout behaviour.
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'] } },
  ],
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
