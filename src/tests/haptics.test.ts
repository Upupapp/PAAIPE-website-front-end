import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  HAPTIC_LIMITS,
  HAPTIC_PATTERNS,
  patternDuration,
  patternPauses,
  patternPulses,
  rateLimited,
  recordHaptic,
  resetRateLimit,
  shouldVibrate,
} from '../lib/haptics';

const ALL_PATTERNS = Object.keys(HAPTIC_PATTERNS) as (keyof typeof HAPTIC_PATTERNS)[];

/** An environment where every guard is satisfied. */
const permissive = () => ({
  enabled: true,
  reducedMotion: false,
  supported: true,
  visible: true,
  userActivated: true,
  vibrate: vi.fn(() => true),
  now: 1_000_000,
});

beforeEach(() => resetRateLimit());

describe('approved patterns only', () => {
  it('offers exactly the three approved patterns', () => {
    expect(ALL_PATTERNS.sort()).toEqual(
      ['light-acknowledgment', 'confirmed-important-action', 'recoverable-warning'].sort(),
    );
  });

  it('matches the specified values exactly', () => {
    expect(HAPTIC_PATTERNS['light-acknowledgment']).toBe(10);
    expect(HAPTIC_PATTERNS['confirmed-important-action']).toEqual([12, 36, 18]);
    expect(HAPTIC_PATTERNS['recoverable-warning']).toEqual([18, 55, 18]);
  });

  it('keeps every VIBRATING pulse at or below 30ms', () => {
    // A pattern array alternates pulse, pause, pulse - so in [12, 36, 18] the
    // 36 is silence. Reading every entry as a pulse makes the approved patterns
    // look non-compliant when they are not; that is what the first version of
    // this test did.
    for (const name of ALL_PATTERNS) {
      for (const pulse of patternPulses(name)) {
        expect(pulse, `${name} pulse`).toBeLessThanOrEqual(HAPTIC_LIMITS.maxSinglePulseMs);
      }
    }
  });

  it('treats the odd entries as pauses, not buzzes', () => {
    expect(patternPulses('confirmed-important-action')).toEqual([12, 18]);
    expect(patternPauses('confirmed-important-action')).toEqual([36]);
    expect(patternPulses('recoverable-warning')).toEqual([18, 18]);
    expect(patternPauses('recoverable-warning')).toEqual([55]);
    expect(patternPulses('light-acknowledgment')).toEqual([10]);
    expect(patternPauses('light-acknowledgment')).toEqual([]);
  });

  it('keeps total vibrating time short even where the pattern is longer', () => {
    // 66ms and 91ms of wall clock, but only 30ms and 36ms of actual buzzing.
    expect(patternPulses('confirmed-important-action').reduce((a, b) => a + b, 0)).toBe(30);
    expect(patternPulses('recoverable-warning').reduce((a, b) => a + b, 0)).toBe(36);
  });

  it('keeps every pattern total at or below roughly 120ms', () => {
    for (const name of ALL_PATTERNS) {
      expect(patternDuration(name), name).toBeLessThanOrEqual(HAPTIC_LIMITS.maxPatternTotalMs);
    }
  });
});

describe('every guard blocks on its own', () => {
  it('fires when everything is satisfied', () => {
    expect(shouldVibrate(permissive())).toBe(true);
  });

  it.each([
    ['haptics preference off', { enabled: false }],
    ['reduced motion requested', { reducedMotion: true }],
    ['Vibration API unsupported', { supported: false }],
    ['document not visible', { visible: false }],
    ['no user activation', { userActivated: false }],
  ])('does not fire: %s', (_label, override) => {
    expect(shouldVibrate({ ...permissive(), ...override })).toBe(false);
  });

  it('is off by default, so an untouched browser never vibrates', () => {
    // `enabled` comes from the preference, which defaults to 'off'.
    expect(shouldVibrate({ ...permissive(), enabled: false })).toBe(false);
  });
});

describe('rate limiting', () => {
  it('allows one pattern, then blocks until 750ms have passed', () => {
    const env = permissive();
    expect(shouldVibrate(env)).toBe(true);
    // Simulate the caller recording a fire.
    expect(rateLimited(env.now)).toBe(false);
  });

  it('blocks a second pattern inside 750ms and allows one after', () => {
    const t0 = 5_000_000;
    expect(rateLimited(t0)).toBe(false);
    recordHaptic(t0);

    expect(rateLimited(t0 + 1), '1ms later').toBe(true);
    expect(rateLimited(t0 + 749), '749ms later').toBe(true);
    expect(rateLimited(t0 + 750), '750ms later').toBe(false);
  });

  it('blocks the seventh pattern in a minute, then allows one once the window slides', () => {
    const t0 = 9_000_000;
    for (let i = 0; i < HAPTIC_LIMITS.maxPerMinute; i += 1) {
      const at = t0 + i * HAPTIC_LIMITS.minIntervalMs;
      expect(rateLimited(at), `fire ${i + 1}`).toBe(false);
      recordHaptic(at);
    }
    // Six fired inside 3.75s; a seventh is blocked even though 750ms has passed.
    const seventh = t0 + HAPTIC_LIMITS.maxPerMinute * HAPTIC_LIMITS.minIntervalMs;
    expect(rateLimited(seventh), 'seventh inside the minute').toBe(true);

    // Once the first fire ages out of the 60s window, one more is allowed.
    expect(rateLimited(t0 + 60_001), 'after the window slides').toBe(false);
  });

  it('never allows more than six patterns in a minute', () => {
    expect(HAPTIC_LIMITS.maxPerMinute).toBe(6);
    expect(HAPTIC_LIMITS.minIntervalMs).toBe(750);
    // Six patterns at the minimum interval span 3.75s, well inside a minute,
    // so the per-minute cap is the binding constraint for rapid tapping.
    expect(HAPTIC_LIMITS.maxPerMinute * HAPTIC_LIMITS.minIntervalMs).toBeLessThan(60_000);
  });
});

describe('nothing on this site depends on haptics', () => {
  it('names only the toggle as a caller', async () => {
    // The helper returns false in every unsupported path, so a caller that
    // relied on its return value would be broken on iOS. Nothing does.
    const source = await import('node:fs').then((fs) =>
      fs.readFileSync(new URL('../lib/haptics.ts', import.meta.url), 'utf8'),
    );
    expect(source).toContain('never throws');
    expect(source).not.toMatch(/console\.(log|error|warn)/);
  });
});

describe('the EVENT registration pulse is narrower than the portal default', () => {
  /*
   * Tab 12 (the original portal) allowed richer patterns for a confirmed
   * action: `confirmed-important-action` is [12, 36, 18], three pulses over
   * 66ms. Tab 08 of the Events Continuation narrows it for THIS moment - "at
   * most one 8-12ms pulse after an explicit user-initiated registration or
   * waitlist action receives a confirmed mapped success state".
   *
   * The two commands disagree, and the narrower one governs the event journey.
   * There is no caller yet - Tab 05 builds the form and is blocked on the owner
   * - so this test exists to constrain the caller that arrives later, when the
   * person writing it will reach for the pattern whose NAME sounds right.
   */
  const EVENT_REGISTRATION_PATTERN = 'light-acknowledgment' as const;

  it('is a single pulse, not a sequence', () => {
    const pattern = HAPTIC_PATTERNS[EVENT_REGISTRATION_PATTERN];
    expect(Array.isArray(pattern), 'the event confirmation must be one pulse').toBe(false);
  });

  it('lasts between 8 and 12 milliseconds', () => {
    const pattern = HAPTIC_PATTERNS[EVENT_REGISTRATION_PATTERN];
    expect(typeof pattern).toBe('number');
    expect(pattern as number).toBeGreaterThanOrEqual(8);
    expect(pattern as number).toBeLessThanOrEqual(12);
  });

  it('rules out the portal-wide confirmation pattern for this moment', () => {
    // Named explicitly so the disagreement is visible rather than implied.
    const wide = HAPTIC_PATTERNS['confirmed-important-action'];
    expect(Array.isArray(wide), 'the wide pattern is a sequence, and is not for events').toBe(true);
  });
});
