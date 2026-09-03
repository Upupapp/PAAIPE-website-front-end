/**
 * The performance budgets, quoted from the Tab 14 project budget table.
 *
 * They live here rather than in the gate script so a unit test can assert the
 * numbers are the ones the master command states, and so the handoff document
 * is generated from the same source the gate measures against. A budget that
 * exists only inside the tool that checks it can be relaxed silently.
 *
 * "Compressed" means gzip. The gate measures gzip because it is what every
 * static host serves and what the numbers were written against; Brotli would
 * be smaller, so gzip is the conservative reading.
 */
export interface Budget {
  key: string;
  /** The master command's own wording. */
  label: string;
  limitBytes: number;
  /** gzip-compressed transfer, or raw bytes on the wire for already-compressed formats. */
  measure: 'gzip' | 'raw';
}

const KIB = 1024;

export const BUDGETS: readonly Budget[] = [
  {
    key: 'route-js',
    label: 'initial route JavaScript, compressed',
    limitBytes: 100 * KIB,
    measure: 'gzip',
  },
  { key: 'css', label: 'CSS, compressed', limitBytes: 50 * KIB, measure: 'gzip' },
  { key: 'fonts', label: 'font transfer per route', limitBytes: 150 * KIB, measure: 'raw' },
  { key: 'lcp-image', label: 'hero or LCP image', limitBytes: 250 * KIB, measure: 'raw' },
  {
    key: 'initial-transfer',
    label: 'initial transfer, excluding user-initiated media',
    limitBytes: 1024 * KIB,
    measure: 'gzip',
  },
  {
    key: 'motion-js',
    label: 'motion JavaScript, compressed',
    limitBytes: 20 * KIB,
    measure: 'gzip',
  },
];

export function budget(key: string): Budget {
  const found = BUDGETS.find((entry) => entry.key === key);
  if (!found) throw new Error(`Unknown budget: ${key}`);
  return found;
}

/**
 * The Core Web Vitals targets. These are FIELD targets and this project has no
 * field data, so nothing in the repository can claim they are met - see the
 * real-user monitoring plan in docs/performance-report.md.
 */
export const WEB_VITALS_TARGETS = {
  lcp: { label: 'Largest Contentful Paint', limit: 2.5, unit: 's' },
  inp: { label: 'Interaction to Next Paint', limit: 200, unit: 'ms' },
  cls: { label: 'Cumulative Layout Shift', limit: 0.1, unit: '' },
} as const;

/** Median-of-three Lighthouse targets. Accessibility is 100, then manual review. */
export const LIGHTHOUSE_TARGETS = {
  performance: 90,
  seo: 90,
  'best-practices': 90,
  accessibility: 100,
} as const;

/**
 * A justified exception needs an owner and an expiry, per the master command.
 * The list is empty: no budget is over today, so nothing is excepted. An entry
 * here without both fields fails the gate rather than granting an open-ended pass.
 */
export interface BudgetException {
  key: string;
  reason: string;
  owner: string;
  /** ISO date. A past date is an expired exception and fails the gate. */
  expires: string;
}

export const BUDGET_EXCEPTIONS: readonly BudgetException[] = [];
