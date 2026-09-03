#!/usr/bin/env node
/**
 * Record the two short screen recordings Tab 16 asks for: the site in DEFAULT
 * motion, and the same walk with REDUCED MOTION requested.
 *
 * Two recordings of the SAME walk, on purpose. The point of the pair is the
 * comparison: a reviewer should be able to see that reduced motion removes
 * movement without removing content, layout or any control. A single recording
 * of the reduced-motion mode proves nothing on its own - it looks like a site
 * with no animation.
 *
 * Reduced motion is requested through `emulateMedia`, the same signal an
 * operating system sends. It is not faked by setting the in-page preference,
 * because the OS path is the one most visitors who need it will actually use.
 *
 * Usage: node scripts/capture-recordings.mjs [baseUrl]
 * Requires a running preview server (`npm run preview`).
 */
import { mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const OUT = fileURLToPath(new URL('../docs/recordings/', import.meta.url));
const baseUrl = process.argv[2] ?? 'http://localhost:4321';

/** The walk. Short, and it touches every kind of motion the site has. */
async function walk(page) {
  await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
  await page.waitForTimeout(900);

  // Scroll reveals: below-the-fold cards entering, one viewport at a time.
  for (let step = 0; step < 4; step += 1) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(700);
  }

  // A desktop dropdown opening on focus, not only on hover.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  const parent = page.locator('.nav__item--group > .nav__link').first();
  if (await parent.isVisible()) {
    await parent.focus();
    await page.waitForTimeout(900);
    await page.keyboard.press('Escape');
  }

  // A route transition.
  await page.goto(`${baseUrl}/membership`, { waitUntil: 'load' });
  await page.waitForTimeout(1100);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(900);

  // An accordion, which is the one component with its own easing.
  const summary = page.locator('details > summary').first();
  if (await summary.isVisible()) {
    await summary.click();
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(400);
}

async function record(name, reducedMotion) {
  const dir = join(OUT, `.tmp-${name}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion,
    recordVideo: { dir, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  try {
    await walk(page);
  } finally {
    await context.close();
    await browser.close();
  }

  const files = (await readdir(dir)).filter((file) => file.endsWith('.webm'));
  if (files.length !== 1) {
    throw new Error(
      `${name}: expected exactly one recording in ${dir}, found ${files.length}. ` +
        `A missing video means the walk produced nothing, which is not a pass.`,
    );
  }
  const target = join(OUT, `${name}.webm`);
  await rm(target, { force: true });
  await rename(join(dir, files[0]), target);
  await rm(dir, { recursive: true, force: true });
  console.log(`WROTE docs/recordings/${name}.webm  (reducedMotion: ${reducedMotion})`);
}

await mkdir(OUT, { recursive: true });
await record('default-motion', 'no-preference');
await record('reduced-motion', 'reduce');
console.log('\nTwo recordings of the SAME walk. The comparison is the evidence:');
console.log('reduced motion must remove movement without removing content or function.');
