/**
 * Local experience preferences.
 *
 * Three switches, all local to one browser, none of them an identifier.
 *
 * The keys come from a closed union and the values from a closed union, so this
 * module cannot express anything else — no id, no timestamp, no counter, no
 * free text. "Preferences must not become tracking identifiers" is enforced by
 * the shape of the API rather than by intention.
 *
 * Every read is safe on the server and in a browser that blocks site data.
 */
export type PreferenceKey = 'reduce-motion' | 'pause-ambient' | 'haptics';

/** `system` means "follow the operating system", and is the default. */
export type PreferenceValue = 'on' | 'off' | 'system';

const PREFIX = 'paaipe:pref:';

const DEFAULTS: Record<PreferenceKey, PreferenceValue> = {
  'reduce-motion': 'system',
  'pause-ambient': 'off',
  // Off by default, always. Haptics are opt-in.
  haptics: 'off',
};

const VALID: readonly PreferenceValue[] = ['on', 'off', 'system'];

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readPreference(key: PreferenceKey): PreferenceValue {
  try {
    const raw = storage()?.getItem(PREFIX + key);
    // An unrecognised value is treated as absent, so a hand-edited or corrupted
    // entry cannot put the UI into a state the code does not model.
    return VALID.includes(raw as PreferenceValue) ? (raw as PreferenceValue) : DEFAULTS[key];
  } catch {
    return DEFAULTS[key];
  }
}

export function writePreference(key: PreferenceKey, value: PreferenceValue): void {
  try {
    if (value === DEFAULTS[key]) {
      // Never store a value that is already the default: an empty store is the
      // most honest representation of "this person changed nothing".
      storage()?.removeItem(PREFIX + key);
      return;
    }
    storage()?.setItem(PREFIX + key, value);
  } catch {
    /* Losing a preference is acceptable; breaking the page is not. */
  }
}

/** Resolves `system` against the OS setting. */
export function prefersReducedMotion(): boolean {
  const preference = readPreference('reduce-motion');
  if (preference === 'on') return true;
  if (preference === 'off') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function hapticsEnabled(): boolean {
  return readPreference('haptics') === 'on';
}

export function ambientPaused(): boolean {
  return readPreference('pause-ambient') === 'on';
}

export const PREFERENCE_KEYS: readonly PreferenceKey[] = [
  'reduce-motion',
  'pause-ambient',
  'haptics',
];

export const PREFERENCE_DEFAULTS = DEFAULTS;
export const PREFERENCE_PREFIX = PREFIX;
