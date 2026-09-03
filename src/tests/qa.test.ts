/**
 * The QA governance rules themselves.
 *
 * `docs/qa-report.md` and `docs/release-blockers.md` are generated from
 * `src/config/qa.ts`, so these assert the rules the documents will state. A
 * defect policy is only worth as much as the check that a defect cannot be
 * logged without an owner and a date.
 */
import { describe, expect, it } from 'vitest';
import { BLOCKING_CLASSES, BROWSER_MATRIX, DEFECTS, TEST_EXCEPTIONS } from '../config/qa';

describe('defect policy', () => {
  it('covers every blocking class the master command names', () => {
    expect(BLOCKING_CLASSES.map((entry) => entry.id).sort()).toEqual([
      'a11y-critical',
      'broken-journey',
      'build-error',
      'console-error',
      'data-exposure',
      'secret',
      'soft-404',
      'unapproved-claim',
      'wrong-branding',
    ]);
  });

  it('names a gate for every blocking class', () => {
    // A blocking class nothing detects is a promise, not a policy. If one is
    // ever added with `detectedBy: null`, this fails and says which - which is
    // the honest outcome, because the gap is real either way.
    const undetected = BLOCKING_CLASSES.filter((entry) => entry.detectedBy === null);
    expect(undetected.map((entry) => entry.id)).toEqual([]);
  });

  it('requires an owner, an impact, a remediation and a target date on every defect', () => {
    for (const defect of DEFECTS) {
      expect(defect.owner, `${defect.id} has no owner`).toBeTruthy();
      expect(defect.impact, `${defect.id} has no impact`).toBeTruthy();
      expect(defect.remediation, `${defect.id} has no remediation`).toBeTruthy();
      expect(Number.isNaN(Date.parse(defect.target)), `${defect.id} target date`).toBe(false);
    }
  });
});

describe('test exceptions', () => {
  it('has none - no test is skipped or weakened to pass this tab', () => {
    expect(TEST_EXCEPTIONS).toEqual([]);
  });

  it('would require all six fields, with a future expiry', () => {
    // Asserted now so the rule exists before the first exception is written
    // rather than after it.
    for (const exception of TEST_EXCEPTIONS) {
      expect(exception.owner).toBeTruthy();
      expect(exception.rationale).toBeTruthy();
      expect(exception.scope).toBeTruthy();
      expect(exception.risk).toBeTruthy();
      expect(Number.isNaN(Date.parse(exception.remediation))).toBe(false);
      expect(new Date(exception.expires).getTime()).toBeGreaterThan(Date.now());
    }
  });
});

describe('browser and device matrix', () => {
  it('covers every target the master command names', () => {
    const targets = BROWSER_MATRIX.map((entry) => entry.target).join(' | ');
    for (const required of [
      'iOS Safari (current)',
      'iOS Safari (previous major)',
      'Android Chrome',
      'Desktop Chrome',
      'Desktop Edge',
      'Desktop Firefox',
      'Desktop Safari',
    ]) {
      expect(targets, `${required} is missing from the matrix`).toContain(required);
    }
  });

  it('says WHY, for every target that is not automated', () => {
    // The point of the matrix is the uncovered rows. A row that says
    // "manual-pending" or "not-possible-here" with no explanation is the same
    // as no row at all.
    for (const entry of BROWSER_MATRIX) {
      if (entry.status === 'automated') continue;
      expect(entry.coverage.length, `${entry.target} gives no reason`).toBeGreaterThan(40);
    }
  });

  it('does not claim a real-device pass anywhere', () => {
    // Playwright's engines are not the shipping browsers, and no row may imply
    // otherwise. This is the assertion that stops "automated" quietly becoming
    // "verified on device" in a later edit.
    const automated = BROWSER_MATRIX.filter((entry) => entry.status === 'automated');
    for (const entry of automated) {
      expect(entry.coverage).not.toMatch(/real device|on device|physical/i);
    }
    expect(automated.length).toBeGreaterThan(2);
  });
});
