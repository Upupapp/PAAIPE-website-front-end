#!/usr/bin/env node
/**
 * axe-scan the REVIEW build — the UI the production suite can never see.
 *
 * THE GAP THIS CLOSES
 * -------------------
 * `npm run test:e2e` builds in PRODUCTION mode, and nothing in the content
 * registry is `approved`. So on a production build `/events` renders 0 cards
 * and 0 filters, and there are 0 event or resource detail pages at all.
 *
 * Which means the components most likely to have accessibility problems —
 * interactive filter controls, record cards, the members-only lock panel with
 * its two calls to action, the status and visibility badges, and every detail
 * page — had **never been scanned in a browser**. The suite was green because
 * it was looking at pages where those components do not exist.
 *
 * This is the same shape as the Tab 15 finding where two of three
 * html-validate defects existed ONLY in the review build. A gate run in one
 * content mode proves one content mode.
 *
 * Not part of `npm run check`: it needs browser binaries, like `test:e2e`.
 * Run both before handing work over.
 *
 * Usage: node --import tsx scripts/verify-a11y-review.mjs
 */
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { chromium, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { PUBLIC_ROUTES } from '../src/config/routes.ts';

const PORT = Number(process.env.PREVIEW_PORT ?? 4374);

/** Every WCAG tag the production suite uses, so the two are comparable. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

function waitForPort(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = createConnection({ port, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`preview server never opened port ${port}`));
        else setTimeout(attempt, 250);
      });
    };
    attempt();
  });
}

/**
 * The routes worth scanning, plus every detail page the review build produced.
 *
 * Detail routes are DISCOVERED from the build rather than listed, so a new
 * fixture is scanned without anyone remembering to add it here.
 */
async function routesToScan() {
  const { readdir } = await import('node:fs/promises');
  const listed = PUBLIC_ROUTES.filter((route) => !route.dynamic && !route.internal).map(
    (route) => route.path,
  );
  const detail = [];
  for (const dir of ['events', 'resources']) {
    const entries = await readdir(new URL(`../dist/${dir}/`, import.meta.url)).catch(() => []);
    for (const entry of entries) {
      if (entry.endsWith('.html')) detail.push(`/${dir}/${entry.replace(/\.html$/, '')}`);
    }
  }
  return { listed, detail };
}

const { listed, detail } = await routesToScan();

/*
 * FLOOR: the whole point is the review-only UI. If the build produced no detail
 * page, this scan is looking at the same thing the production suite already
 * looks at, and a green result would mean nothing. Fail rather than pass.
 */
if (detail.length === 0) {
  console.error('FAIL  the review build produced no detail pages.');
  console.error('      This scan exists to cover review-only UI. With none present it would');
  console.error('      pass by scanning what the production suite already scans.');
  console.error('      Run `npm run build:review` first.');
  process.exit(1);
}

const routes = [...listed, ...detail];
const server = spawn(process.execPath, ['scripts/preview-server.mjs'], {
  env: { ...process.env, PREVIEW_PORT: String(PORT) },
  stdio: ['ignore', 'ignore', 'inherit'],
});
const stop = () => {
  if (!server.killed) server.kill('SIGTERM');
};
process.on('exit', stop);

const failures = [];
let scanned = 0;

try {
  await waitForPort(PORT);

  for (const [name, engine, viewport] of [
    ['chromium-desktop', chromium, { width: 1280, height: 900 }],
    // WebKit at a phone viewport: it has already found accessibility defects in
    // this project that Chromium did not.
    ['webkit-mobile', webkit, { width: 390, height: 844 }],
  ]) {
    const browser = await engine.launch();
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();

    for (const route of routes) {
      const response = await page.goto(`http://localhost:${PORT}${route}`);
      if (response?.status() !== 200) {
        failures.push(`${name} ${route}: HTTP ${response?.status()}`);
        continue;
      }
      // Scan at REST. axe reads colour mid-transition and reports contrast
      // violations that no visitor ever sees — measured in an earlier tab.
      await page
        .waitForFunction(
          () => document.getAnimations().every((animation) => animation.playState !== 'running'),
          undefined,
          { timeout: 4000 },
        )
        .catch(() => {
          /* something loops; the scan below still runs */
        });

      const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      scanned += 1;
      for (const violation of result.violations) {
        if (!['serious', 'critical'].includes(violation.impact)) continue;
        failures.push(
          `${name} ${route}: [${violation.impact}] ${violation.id} — ${violation.help} ` +
            `(${violation.nodes.length} node(s), first: ${violation.nodes[0]?.target.join(' ')})`,
        );
      }
    }
    await browser.close();
  }
} finally {
  stop();
}

const expected = routes.length * 2;
if (scanned < expected) {
  failures.push(
    `only ${scanned} of ${expected} page scans completed — a partial scan is not a pass`,
  );
}

console.log(`Accessibility scan of the REVIEW build`);
console.log(`  ${listed.length} listed routes + ${detail.length} detail page(s), 2 engines`);
console.log(`  ${scanned} page scans completed`);
console.log(`  review-only UI covered: event cards, filters, status labels, member lock panels`);

if (failures.length > 0) {
  console.error(`\nREVIEW ACCESSIBILITY SCAN FAILED — ${failures.length} problem(s)\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS — no serious or critical violation in either engine.');
