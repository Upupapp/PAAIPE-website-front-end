/**
 * The generated report's headline — the one sentence a reader actually stops at.
 *
 * It has claimed an all-clear over a table contradicting it twice, in the same
 * shape both times: a summary computed from a DIFFERENT input than the table it
 * summarises. What is asserted here is that EACH stage-table outcome, alone, is
 * enough to withhold the claim.
 */
import { describe, expect, it } from 'vitest';
import { headline } from '../../scripts/release-report.mjs';

const NOTHING = { problems: [], unverifiedStages: [], unmet: [] };
const ALL_CLEAR = 'Every gate\nthat could fail on quality passed';

describe('the headline consults every input to the table it summarises', () => {
  it('says nothing when there is nothing outstanding', () => {
    expect(headline(NOTHING)).toBe('');
  });

  it('claims the all-clear only when stages are clean and inputs are the blocker', () => {
    const text = headline({ ...NOTHING, unmet: ['B-4', 'B-7'] });
    expect(text).toContain(ALL_CLEAR);
    expect(text).toContain('every stage actually ran');
    expect(text).toContain('2 owner inputs');
  });

  it('withholds the all-clear on a FAILED stage', () => {
    /*
     * The original defect. The headline was computed from the owner-input count
     * alone, so a run with a failing stage printed "every gate that could fail
     * on quality passed" directly above a table showing the failure.
     */
    const text = headline({ ...NOTHING, problems: ['Unit tests: FAILED'], unmet: ['B-4'] });
    expect(text).not.toContain(ALL_CLEAR);
    expect(text).toContain('1 stage FAILED');
    expect(text).toContain('This is a defect, not a');
  });

  it('withholds the all-clear on an UNVERIFIED stage', () => {
    /*
     * The residual, and the reason this module exists. The fix for the original
     * consulted `problems` and `unmet`. The same commit added a THIRD stage
     * outcome — UNVERIFIED, a stage that could not run — which the headline
     * never learned about, so an unverified run printed the all-clear again.
     */
    const text = headline({
      ...NOTHING,
      unverifiedStages: ['Dependency scan: could not reach the registry'],
      unmet: ['B-4'],
    });
    expect(text).not.toContain(ALL_CLEAR);
    expect(text).toContain('1 stage could not run');
    expect(text).toContain('not a pass, not a failure, unmeasured');
    expect(text, 'the blockers must still be mentioned').toContain('1 owner');
  });

  it('withholds it for an unverified stage even with every owner input supplied', () => {
    // The case that would otherwise reach READY on machinery that never ran.
    const text = headline({ ...NOTHING, unverifiedStages: ['Lighthouse: no result'] });
    expect(text).not.toContain(ALL_CLEAR);
    expect(text).toContain('could not run');
    expect(text, 'no owner input is outstanding, so none may be claimed').not.toContain('besides');
  });

  it('reports a FAILURE ahead of an unverified stage — severity, not order of discovery', () => {
    const text = headline({
      problems: ['Unit tests: FAILED'],
      unverifiedStages: ['Dependency scan: could not reach the registry'],
      unmet: ['B-4'],
    });
    expect(text).toContain('FAILED');
    expect(text).not.toContain('could not run');
  });

  it('agrees with itself on singular and plural', () => {
    expect(headline({ ...NOTHING, problems: ['a', 'b'] })).toContain('2 stages FAILED');
    expect(headline({ ...NOTHING, unverifiedStages: ['a', 'b'] })).toContain(
      '2 stages could not run',
    );
    expect(headline({ ...NOTHING, unmet: ['B-4'] })).toContain('1 owner input that');
  });
});

describe('the gate reads its detectors from the worktree it certifies', () => {
  it('imports nothing from src/ into the gate runner', async () => {
    /*
     * An `import` in `scripts/release-gate.mjs` resolves against the MAIN
     * checkout, never the detached worktree. The gate gathered its facts in the
     * worktree and then evaluated them through `evaluateInputs` imported from
     * this tree — correct facts, whichever detectors happened to be on disk. An
     * uncommitted edit to `release.ts` or `pending.ts` could have changed a
     * verdict stamped with a SHA that did not contain it.
     *
     * The evaluation now runs inside the worktree in `release-facts.mjs`. This
     * asserts the door stays shut: a source path in the gate runner is the
     * defect returning, whatever it is imported for.
     */
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(
      new URL('../../scripts/release-gate.mjs', import.meta.url),
      'utf8',
    );
    const crossTree = [...source.matchAll(/^import .*from '(\.\..*)';$/gm)].map(
      (match) => match[1],
    );
    expect(crossTree, 'the gate must not import anything from the certified tree').toEqual([]);
  });

  it('evaluates the owner inputs in the fact gatherer, which runs in the worktree', async () => {
    const { readFile } = await import('node:fs/promises');
    const source = await readFile(
      new URL('../../scripts/release-facts.mjs', import.meta.url),
      'utf8',
    );
    expect(source).toContain("from '../src/config/release.ts'");
    expect(source, 'the evaluated inputs must be serialised for the gate').toMatch(
      /JSON\.stringify\(\{[^}]*inputs/s,
    );
  });
});
