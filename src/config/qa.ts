/**
 * QA governance for Tab 15: the defect policy, the test-exception rule, and the
 * browser/device matrix.
 *
 * These live in typed configuration rather than in prose so the reports are
 * GENERATED from them and a test can assert the rules. A defect policy that
 * exists only in a Markdown file is a policy nobody can enforce.
 */

/* ------------------------------------------------------------ defect policy */

/**
 * Tab 15 blocks completion on any of these. The list is the master command's,
 * verbatim in substance, with the gate that detects each one named beside it -
 * because a policy whose classes nothing checks is a policy in name only.
 */
export interface BlockingClass {
  id: string;
  description: string;
  /** The command or suite that would catch it. `null` means NOTHING here does. */
  detectedBy: string | null;
}

export const BLOCKING_CLASSES: readonly BlockingClass[] = [
  {
    id: 'a11y-critical',
    description: 'Critical or serious accessibility defect',
    detectedBy: 'npm run test:e2e (axe-core on every route, 9 widths, 4 engine projects)',
  },
  {
    id: 'broken-journey',
    description: 'A broken core journey',
    detectedBy: 'npm run test:e2e (tests/e2e/journeys.spec.ts, all 10 journeys, every engine)',
  },
  {
    id: 'secret',
    description: 'A secret, credential or private link in the shipped output',
    detectedBy: 'npm run verify:leak and npm run audit:content, both content modes',
  },
  {
    id: 'wrong-branding',
    description: 'Wrong branding: altered logo, malformed name, altered slogan',
    detectedBy: 'npm run verify:brand and npm run audit:content',
  },
  {
    id: 'data-exposure',
    description: 'Member data or personal contact data exposed',
    detectedBy: 'npm run verify:leak (built bundle, both modes)',
  },
  {
    id: 'build-error',
    description: 'A build error',
    detectedBy: 'npm run build',
  },
  {
    id: 'console-error',
    description: 'A console error on any route',
    detectedBy: 'npm run test:e2e (smoke test, every engine)',
  },
  {
    id: 'soft-404',
    description: 'A soft 404, or a wrong status code',
    detectedBy: 'npm run verify:seo and tests/e2e/seo.spec.ts',
  },
  {
    id: 'unapproved-claim',
    description: 'An unapproved claim: member totals, testimonials, awards, partners, discounts',
    detectedBy: 'npm run audit:content, source and built output, both modes',
  },
];

/* ------------------------------------------------------- medium/low defects */

/**
 * A non-blocking defect must still be recorded with an owner, an impact, a
 * remediation and a target date. An entry missing any of them fails the gate,
 * so "we will get to it" cannot be logged as a plan.
 */
export interface Defect {
  id: string;
  severity: 'medium' | 'low';
  summary: string;
  impact: string;
  remediation: string;
  owner: string;
  /** ISO date. */
  target: string;
}

export const DEFECTS: readonly Defect[] = [];

/* ---------------------------------------------------------- test exceptions */

/**
 * Tab 15: a test exception needs a named owner, a rationale, a scope, a risk, a
 * remediation date and an expiry. All six, or it is not an exception - it is a
 * disabled test.
 *
 * The list is EMPTY. No test is skipped, weakened or excluded to make this tab
 * pass. Where something cannot be verified here, it is recorded as unverified
 * in `docs/release-blockers.md` rather than waved through with an exception.
 */
export interface TestException {
  id: string;
  scope: string;
  rationale: string;
  risk: string;
  owner: string;
  /** ISO date the work is planned for. */
  remediation: string;
  /** ISO date the exception stops being valid. */
  expires: string;
}

export const TEST_EXCEPTIONS: readonly TestException[] = [];

/* ------------------------------------------------- browser and device matrix */

export interface MatrixEntry {
  target: string;
  /** How it is exercised here, or why it cannot be. */
  coverage: string;
  status: 'automated' | 'manual-pending' | 'not-possible-here';
}

/**
 * The matrix Tab 15 names, and what this machine can honestly cover.
 *
 * Playwright's engines are the SAME engines the browsers ship, but they are not
 * the same browsers: Chrome adds features on top of Chromium, Edge adds more on
 * top of that, and Playwright's WebKit is not Safari's exact build. Automated
 * coverage of an engine is strong evidence and it is not a device pass, so each
 * row says which it is.
 */
export const BROWSER_MATRIX: readonly MatrixEntry[] = [
  {
    target: 'Desktop Chrome (current)',
    coverage: 'Playwright chromium-desktop project: full suite including axe-core',
    status: 'automated',
  },
  {
    target: 'Desktop Edge (current)',
    coverage:
      'Not run. Edge is Chromium with additions; the chromium-desktop project covers the engine, not the browser. A manual pass is still owed.',
    status: 'manual-pending',
  },
  {
    target: 'Desktop Firefox (current)',
    coverage: 'Playwright firefox-desktop project: full suite including axe-core',
    status: 'automated',
  },
  {
    target: 'Desktop Safari (current)',
    coverage:
      'Playwright webkit-desktop project: full suite. Playwright WebKit is not Safari’s shipping build, so this is engine coverage.',
    status: 'automated',
  },
  {
    target: 'iOS Safari (current)',
    coverage:
      'Playwright webkit-mobile project (iPhone 13 viewport, touch, mobile UA). Real-device behaviour - input zoom, dynamic viewport units, VoiceOver - is NOT covered.',
    status: 'automated',
  },
  {
    target: 'iOS Safari (previous major)',
    coverage: 'Not run. Requires a real device or a simulator with an older iOS installed.',
    status: 'not-possible-here',
  },
  {
    target: 'Android Chrome (current)',
    coverage:
      'Not run. No Android device or emulator is available on this machine, and a resized desktop Chromium is not Android Chrome.',
    status: 'not-possible-here',
  },
];
