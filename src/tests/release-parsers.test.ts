/**
 * The release gate's output parsers.
 *
 * These are the part of the gate most likely to fail silently. A parser that
 * returns a cheerful string for empty output turns "nothing ran" into
 * "everything passed", and nothing downstream can tell the difference — the
 * report says PASS, the exit code says 0, and the stage never happened.
 *
 * So each one is tested against the three shapes that matter: a real pass, a
 * real failure, and the several ways a stage can produce NOTHING.
 */
import { describe, expect, it } from 'vitest';
import {
  parseAudit,
  parseCheck,
  parseLighthouse,
  parsePlaywright,
  parseVitest,
} from '../../scripts/release-parsers.mjs';

const EMPTY_INPUTS = ['', '   ', '\n\n', 'command not found', 'Killed: 9'];

describe('every parser rejects empty and unrecognised output', () => {
  const parsers: Array<[string, (output: string) => string | null]> = [
    ['vitest', parseVitest],
    ['playwright', parsePlaywright],
    ['lighthouse', (output) => parseLighthouse(output)],
    ['audit', parseAudit],
    ['check', (output) => parseCheck(output, 17)],
  ];

  for (const [name, parse] of parsers) {
    it(`${name} returns null rather than a pass`, () => {
      for (const input of EMPTY_INPUTS) {
        expect(parse(input), `${name} accepted ${JSON.stringify(input)}`).toBeNull();
      }
    });
  }
});

describe('vitest', () => {
  it('accepts a real all-passing run', () => {
    expect(parseVitest('  Tests  491 passed (491)')).toBe('491/491 unit tests passed');
  });

  it('REJECTS "0 tests, all passed"', () => {
    // The single most dangerous shape: it is grammatically a pass. An empty
    // test directory has already made a suite in this project exit 0 with zero
    // tests while the repo claimed CERTIFIED.
    expect(parseVitest('  Tests  0 passed (0)')).toBeNull();
  });

  it('rejects a partial pass', () => {
    expect(parseVitest('  Tests  3 failed | 488 passed (491)')).toBeNull();
  });
});

describe('playwright', () => {
  it('accepts a real run, with skips', () => {
    expect(parsePlaywright('  27 skipped\n  861 passed (2.1m)')).toBe(
      '861 browser assertions passed, 27 skipped',
    );
  });

  it('rejects a run with any failure, even alongside passes', () => {
    expect(parsePlaywright('  3 failed\n  858 passed (2.1m)')).toBeNull();
  });

  it('rejects a run where nothing passed', () => {
    expect(parsePlaywright('  0 passed (0.2s)')).toBeNull();
  });
});

describe('lighthouse', () => {
  const table = '  /            98            100            100            100     2.10s\n';

  it('accepts scores at or above the floor', () => {
    expect(parseLighthouse(table)).toBe('1 routes, lowest median category score 98');
  });

  it('rejects a score below the floor', () => {
    const low = '  /            88            100            100            100     2.10s\n';
    expect(parseLighthouse(low)).toBeNull();
  });

  it('rejects output with no table at all', () => {
    // A Lighthouse run that crashed still prints plenty of reassuring text.
    expect(parseLighthouse('Running Lighthouse...\nDone.')).toBeNull();
  });
});

describe('audit', () => {
  it('accepts only the exact clean result', () => {
    expect(parseAudit('found 0 vulnerabilities')).toBe('no high or critical finding');
    expect(parseAudit('found 3 vulnerabilities (2 high, 1 critical)')).toBeNull();
  });
});

describe('check', () => {
  it('keys on the LAST stage of the chain, not on the first', () => {
    /*
     * `npm run check` chains seventeen commands. A chain that stopped at stage
     * three still printed sixteen lines of reassuring output. Keying on the
     * budget table - which only the final stage prints - is what proves the
     * chain reached the end.
     */
    expect(parseCheck('  route-js           worst  10.2 KiB', 17)).toBe('all 17 gates passed');
    expect(
      parseCheck('> format:check\n> lint\nAll matched files use Prettier code style!', 17),
    ).toBeNull();
  });

  it('reports the count it was given rather than a hard-coded one', () => {
    // The first version said "all sixteen gates passed" as a fixed string, on
    // the same day a seventeenth gate was added.
    expect(parseCheck('route-js worst', 21)).toContain('21');
  });
});
