/**
 * The budget numbers themselves.
 *
 * `scripts/verify-budgets.mjs` measures the build against these. That gate is
 * only as good as the limits it reads, so the limits are asserted here against
 * the figures the master command states. A relaxed budget would otherwise pass
 * every gate in the repository.
 */
import { describe, expect, it } from 'vitest';
import {
  BUDGETS,
  BUDGET_EXCEPTIONS,
  LIGHTHOUSE_TARGETS,
  WEB_VITALS_TARGETS,
  budget,
} from '../config/budgets';

const KIB = 1024;

describe('project budgets', () => {
  it('states the master command figures exactly', () => {
    expect(budget('route-js').limitBytes).toBe(100 * KIB);
    expect(budget('css').limitBytes).toBe(50 * KIB);
    expect(budget('fonts').limitBytes).toBe(150 * KIB);
    expect(budget('lcp-image').limitBytes).toBe(250 * KIB);
    expect(budget('initial-transfer').limitBytes).toBe(1024 * KIB);
    expect(budget('motion-js').limitBytes).toBe(20 * KIB);
  });

  it('covers all six budgets and nothing else', () => {
    expect(BUDGETS.map((entry) => entry.key).sort()).toEqual([
      'css',
      'fonts',
      'initial-transfer',
      'lcp-image',
      'motion-js',
      'route-js',
    ]);
  });

  it('measures compressed transfer where the master command says compressed', () => {
    for (const key of ['route-js', 'css', 'motion-js', 'initial-transfer']) {
      expect(budget(key).measure, `${key} must be measured compressed`).toBe('gzip');
    }
    // An image or a WOFF2 is already compressed; gzipping it again measures nothing.
    expect(budget('lcp-image').measure).toBe('raw');
    expect(budget('fonts').measure).toBe('raw');
  });

  it('throws on an unknown budget rather than returning undefined', () => {
    expect(() => budget('made-up')).toThrow(/Unknown budget/);
  });
});

describe('targets', () => {
  it('states the Core Web Vitals thresholds', () => {
    expect(WEB_VITALS_TARGETS.lcp.limit).toBe(2.5);
    expect(WEB_VITALS_TARGETS.inp.limit).toBe(200);
    expect(WEB_VITALS_TARGETS.cls.limit).toBe(0.1);
  });

  it('asks for 100 on accessibility and 90 on the rest', () => {
    expect(LIGHTHOUSE_TARGETS.accessibility).toBe(100);
    expect(LIGHTHOUSE_TARGETS.performance).toBe(90);
    expect(LIGHTHOUSE_TARGETS.seo).toBe(90);
    expect(LIGHTHOUSE_TARGETS['best-practices']).toBe(90);
  });
});

describe('budget exceptions', () => {
  it('has none, because no budget is over', () => {
    expect(BUDGET_EXCEPTIONS).toEqual([]);
  });

  it('would require an owner, a reason and a future expiry on any entry', () => {
    // The property an exception must satisfy, asserted now so the rule exists
    // before the first exception is written rather than after.
    for (const exception of BUDGET_EXCEPTIONS) {
      expect(exception.owner).toBeTruthy();
      expect(exception.reason).toBeTruthy();
      expect(Number.isNaN(Date.parse(exception.expires))).toBe(false);
      expect(new Date(exception.expires).getTime()).toBeGreaterThan(Date.now());
    }
  });
});
