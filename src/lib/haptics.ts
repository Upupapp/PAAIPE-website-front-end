/**
 * Web haptics — a guarded, optional, silent-on-failure helper.
 *
 * The Vibration API is unsupported on iOS/Safari and may silently do nothing
 * elsewhere. **No confirmation, accessibility cue, navigation, form state or
 * information on this site depends on it.** Every guard below returns `false`
 * rather than throwing or logging: normal non-support is not an error.
 *
 * Nothing here fires on page load, route change, scroll, hover, focus, typing,
 * menu traversal, a notification, or an ordinary tap. In this frontend-only
 * build the ONLY caller is the haptics toggle itself being switched on — a
 * genuine major user-enabled toggle, which is exactly what the light
 * acknowledgment pattern is for. No server-confirmed action exists yet, so
 * none is fabricated in order to demonstrate a pattern.
 */
import { hapticsEnabled } from './preferences';

/** The three approved patterns. Nothing else may be passed. */
export const HAPTIC_PATTERNS = {
  /** A major user-enabled toggle or bookmark. */
  'light-acknowledgment': 10,
  /** Only after a real server-confirmed action exists in a future integration. */
  'confirmed-important-action': [12, 36, 18],
  /** Only after the user explicitly submits an invalid or destructive action. */
  'recoverable-warning': [18, 55, 18],
} as const satisfies Record<string, number | number[]>;

export type HapticPattern = keyof typeof HAPTIC_PATTERNS;

/** Ceilings the master command states. */
export const HAPTIC_LIMITS = {
  maxSinglePulseMs: 30,
  maxPatternTotalMs: 120,
  minIntervalMs: 750,
  maxPerMinute: 6,
} as const;

/* -- Rate limiting ---------------------------------------------------- */

let recent: number[] = [];

/** Exported for tests; also used to reset state between page navigations. */
export function resetRateLimit(): void {
  recent = [];
}

export function rateLimited(now: number = Date.now()): boolean {
  recent = recent.filter((time) => now - time < 60_000);
  if (recent.length >= HAPTIC_LIMITS.maxPerMinute) return true;
  const last = recent[recent.length - 1];
  if (last !== undefined && now - last < HAPTIC_LIMITS.minIntervalMs) return true;
  return false;
}

/** Records a fire. Exported so the limiter's state is testable without a browser. */
export function recordHaptic(now: number = Date.now()): void {
  recent.push(now);
}

/* -- The helper ------------------------------------------------------- */

interface HapticEnvironment {
  enabled: boolean;
  reducedMotion: boolean;
  supported: boolean;
  visible: boolean;
  userActivated: boolean;
  vibrate: (pattern: number | number[]) => boolean;
  now: number;
}

/**
 * The decision, separated from the browser so every guard is testable without
 * one. `haptic()` below is the thin browser wrapper.
 */
export function shouldVibrate(env: HapticEnvironment): boolean {
  if (!env.enabled) return false;
  if (env.reducedMotion) return false;
  if (!env.supported) return false;
  if (!env.visible) return false;
  // A gesture is required: never vibrate without one, and never request a
  // blocking permission flow to obtain one.
  if (!env.userActivated) return false;
  if (rateLimited(env.now)) return false;
  return true;
}

function readEnvironment(): HapticEnvironment | null {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;
  const nav = navigator as Navigator & { userActivation?: { isActive: boolean } };
  return {
    enabled: hapticsEnabled(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    supported: 'vibrate' in navigator,
    visible: document.visibilityState === 'visible',
    userActivated: Boolean(nav.userActivation?.isActive),
    vibrate: (pattern) => navigator.vibrate(pattern),
    now: Date.now(),
  };
}

/** Returns false — never throws, never logs — when anything is not satisfied. */
export function haptic(pattern: HapticPattern): boolean {
  const env = readEnvironment();
  if (!env) return false;
  if (!shouldVibrate(env)) return false;

  try {
    const fired = env.vibrate(HAPTIC_PATTERNS[pattern]);
    if (fired) recordHaptic(env.now);
    return fired;
  } catch {
    // Normal non-support. Not an error, and not logged.
    return false;
  }
}

/** Stop any vibration immediately. Called on teardown, hide and opt-out. */
export function cancelHaptics(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(0);
  } catch {
    /* nothing to cancel */
  }
  resetRateLimit();
}

/** Total wall-clock duration of a pattern, pauses included. */
export function patternDuration(pattern: HapticPattern): number {
  const value = HAPTIC_PATTERNS[pattern];
  return typeof value === 'number' ? value : value.reduce((total, part) => total + part, 0);
}

/**
 * The vibrating parts of a pattern.
 *
 * A Vibration API pattern array alternates pulse, pause, pulse, pause… so in
 * `[12, 36, 18]` the 36 is SILENCE, not a 36ms buzz. The master command's
 * "no single pulse may exceed 30ms" therefore constrains the even indices only
 * — and reading it as "no array entry may exceed 30ms" makes the approved
 * patterns look non-compliant when they are not.
 */
export function patternPulses(pattern: HapticPattern): number[] {
  const value = HAPTIC_PATTERNS[pattern];
  if (typeof value === 'number') return [value];
  return value.filter((_part, index) => index % 2 === 0);
}

/** The silent gaps between pulses. */
export function patternPauses(pattern: HapticPattern): number[] {
  const value = HAPTIC_PATTERNS[pattern];
  if (typeof value === 'number') return [];
  return value.filter((_part, index) => index % 2 === 1);
}
