#!/usr/bin/env node
/**
 * Median-of-three Lighthouse runs on representative mobile routes.
 *
 * WHY THIS IS NOT IN `npm run check`
 * ----------------------------------
 * Nine full Lighthouse passes take minutes and need a real Chrome. `check` runs
 * on every change and has to stay fast. This is a release-gate command: run it,
 * and record the numbers with the commit SHA in docs/performance-report.md.
 *
 * WHAT THESE NUMBERS ARE, AND ARE NOT
 * -----------------------------------
 * They are LAB numbers from simulated mobile throttling on a developer Mac.
 * The master command's Core Web Vitals targets are FIELD targets - what real
 * visitors experience on real devices and networks. A lab LCP of 1.2s does not
 * mean a visitor in the Philippines on a mid-range Android over mobile data
 * gets 1.2s. The report says which is which; see the real-user monitoring plan.
 *
 * Usage: node scripts/run-lighthouse.mjs [--runs 3] [--json <path>]
 */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { createConnection } from 'node:net';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { LIGHTHOUSE_TARGETS } from '../src/config/budgets.ts';

const PORT = Number(process.env.PREVIEW_PORT ?? 4399);
const ORIGIN = `http://localhost:${PORT}`;

/**
 * Representative routes, chosen for what they EXERCISE rather than for being
 * the smallest three:
 *   /            the richest page and the LCP candidate (the header lockup)
 *   /resources   a filtered list - the most client-side JavaScript on the site
 *   /membership  the page with the most form controls and the deepest content
 */
const ROUTES = ['/', '/resources', '/membership'];

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

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

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

const runsIndex = process.argv.indexOf('--runs');
const RUNS = runsIndex === -1 ? 3 : Number(process.argv[runsIndex + 1]);
const jsonIndex = process.argv.indexOf('--json');
const JSON_OUT = jsonIndex === -1 ? null : process.argv[jsonIndex + 1];

const server = spawn(process.execPath, ['scripts/preview-server.mjs'], {
  env: { ...process.env, PREVIEW_PORT: String(PORT) },
  stdio: ['ignore', 'ignore', 'inherit'],
});
const stopServer = () => {
  if (!server.killed) server.kill('SIGTERM');
};
process.on('exit', stopServer);
process.on('SIGINT', () => {
  stopServer();
  process.exit(130);
});

let chrome;
const results = [];
const failures = [];

try {
  await waitForPort(PORT);
  chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
  });

  for (const route of ROUTES) {
    const perRun = [];
    for (let run = 1; run <= RUNS; run += 1) {
      // Lighthouse's default preset is mobile emulation with simulated
      // throttling, which is the "three representative mobile runs" the
      // master command asks for. It is not overridden.
      const { lhr } = await lighthouse(
        `${ORIGIN}${route}`,
        { port: chrome.port, output: 'json', logLevel: 'error' },
        undefined,
      );
      const scores = Object.fromEntries(
        CATEGORIES.map((key) => [key, Math.round((lhr.categories[key]?.score ?? 0) * 100)]),
      );
      const vitals = {
        lcp: lhr.audits['largest-contentful-paint']?.numericValue ?? null,
        cls: lhr.audits['cumulative-layout-shift']?.numericValue ?? null,
        tbt: lhr.audits['total-blocking-time']?.numericValue ?? null,
      };
      perRun.push({ run, scores, vitals });
      console.log(
        `  ${route.padEnd(12)} run ${run}  ` +
          CATEGORIES.map((key) => `${key} ${String(scores[key]).padStart(3)}`).join('  '),
      );
    }

    const medians = Object.fromEntries(
      CATEGORIES.map((key) => [key, median(perRun.map((entry) => entry.scores[key]))]),
    );
    const vitalMedians = {
      lcp: median(perRun.map((entry) => entry.vitals.lcp ?? 0)),
      cls: median(perRun.map((entry) => entry.vitals.cls ?? 0)),
      tbt: median(perRun.map((entry) => entry.vitals.tbt ?? 0)),
    };
    results.push({ route, runs: perRun, medians, vitalMedians });

    for (const [key, target] of Object.entries(LIGHTHOUSE_TARGETS)) {
      if (medians[key] < target) {
        failures.push(`${route}: median ${key} is ${medians[key]}, target ${target}`);
      }
    }
  }
} finally {
  if (chrome) await chrome.kill();
  stopServer();
}

console.log('\nMedian of', RUNS, 'runs - Lighthouse mobile preset\n');
const width = Math.max(...ROUTES.map((route) => route.length));
console.log(
  `  ${'route'.padEnd(width)}  ` +
    CATEGORIES.map((key) => key.padStart(14)).join(' ') +
    `  ${'LCP'.padStart(8)} ${'CLS'.padStart(6)} ${'TBT'.padStart(8)}`,
);
for (const result of results) {
  console.log(
    `  ${result.route.padEnd(width)}  ` +
      CATEGORIES.map((key) => String(result.medians[key]).padStart(14)).join(' ') +
      `  ${`${(result.vitalMedians.lcp / 1000).toFixed(2)}s`.padStart(8)}` +
      ` ${result.vitalMedians.cls.toFixed(3).padStart(6)}` +
      ` ${`${Math.round(result.vitalMedians.tbt)}ms`.padStart(8)}`,
  );
}
console.log(
  '\n  LCP, CLS and TBT above are LAB figures under simulated mobile throttling on\n' +
    '  this machine. They are not field data and must not be reported as if they were.',
);

if (JSON_OUT) {
  await writeFile(JSON_OUT, `${JSON.stringify({ runs: RUNS, results }, null, 2)}\n`, 'utf8');
  console.log(`\n  Wrote ${JSON_OUT}`);
}

if (failures.length > 0) {
  console.error(`\nLIGHTHOUSE FAILED - ${failures.length} target(s) missed\n`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log('\nPASS');
