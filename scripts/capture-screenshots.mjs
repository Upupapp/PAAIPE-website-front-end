#!/usr/bin/env node
/**
 * Capture the desktop and mobile evidence screenshots each master-command tab
 * asks for: 1440x900 desktop and 390x844 mobile.
 *
 * Mobile is captured in WebKit, not Chromium: Chromium does not reproduce iOS
 * Safari layout or input behaviour, and headless Chrome clamps very narrow
 * viewports, which manufactures mobile defects that do not exist.
 *
 * Usage: node scripts/capture-screenshots.mjs <outDir> [baseUrl]
 * Requires a running preview server (`npm run preview`).
 *
 * Captures run under `reducedMotion: 'reduce'`, and the pointer is parked away
 * from the navigation.
 *
 * Both are needed. A fullPage capture in Chromium painted the header dropdowns
 * OPEN even though computed style at that instant read
 * `opacity: 0; visibility: hidden` - a compositing quirk where a transitioned
 * layer is painted from stale state during full-page capture. The evidence
 * showed a menu state no visitor ever sees. Removing the transition from the
 * equation fixes it, and reduced motion is the honest way to do that: it is a
 * state real users have, and the site must be correct in it.
 */
import { mkdir } from 'node:fs/promises';
import { chromium, webkit } from '@playwright/test';

const ROUTES = process.env.SHOT_ROUTES
  ? process.env.SHOT_ROUTES.split(',')
  : [
      '/',
      '/about',
      '/programs',
      '/events',
      '/resources',
      '/membership',
      '/partners',
      '/contact',
      '/404',
    ];

const outDir = process.argv[2];
const baseUrl = process.argv[3] ?? 'http://localhost:4321';

if (!outDir) {
  console.error('Usage: node scripts/capture-screenshots.mjs <outDir> [baseUrl]');
  process.exit(1);
}

const slug = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '-'));

await mkdir(outDir, { recursive: true });

/** Park the pointer clear of the header and let any transition settle. */
async function settle(page) {
  const size = page.viewportSize();
  await page.mouse.move(2, (size?.height ?? 900) - 2);
  await page.waitForTimeout(400);
}

const desktop = await chromium.launch();
const desktopContext = await desktop.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
});
const desktopPage = await desktopContext.newPage();
for (const route of ROUTES) {
  await desktopPage.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await settle(desktopPage);
  await desktopPage.screenshot({
    path: `${outDir}/desktop-1440x900-${slug(route)}.png`,
    fullPage: process.env.SHOT_FULL === '1',
  });
}
await desktop.close();

const mobile = await webkit.launch();
const mobileContext = await mobile.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'reduce',
});
const mobilePage = await mobileContext.newPage();
for (const route of ROUTES) {
  await mobilePage.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await settle(mobilePage);
  await mobilePage.screenshot({
    path: `${outDir}/mobile-390x844-${slug(route)}.png`,
    fullPage: process.env.SHOT_FULL === '1',
  });
}
await mobile.close();

console.log(`Captured ${ROUTES.length * 2} screenshots into ${outDir}`);
