/**
 * Persisted UI dismissal preferences.
 *
 * THIS IS THE ONLY MODULE PERMITTED TO TOUCH BROWSER STORAGE, and it may store
 * exactly one kind of thing: a boolean "this person closed that banner".
 *
 * Tab 04 allows it explicitly - "If dismissible, store only the non-sensitive
 * dismissal preference" - while Tab 03 forbids using storage to mimic success
 * or access. Both hold as long as the value is a UI preference and nothing
 * else, so the API below cannot express anything else: the key is drawn from a
 * fixed union and the value is always the literal '1'.
 *
 * No identifier, status, viewer state, session or personal data goes here, and
 * a test asserts no other source file reads or writes storage.
 */

/** Every key that may ever be written. Adding one is a deliberate change. */
export type DismissalKey = 'announcement';

const PREFIX = 'paaipe:dismissed:';

function storage(): Storage | null {
  // Private browsing, blocked site data and server rendering all end up here.
  // A dismissal preference is a convenience; losing it must never break a page.
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function isDismissed(key: DismissalKey): boolean {
  try {
    return storage()?.getItem(PREFIX + key) === '1';
  } catch {
    return false;
  }
}

export function setDismissed(key: DismissalKey): void {
  try {
    storage()?.setItem(PREFIX + key, '1');
  } catch {
    /* Nothing to do: the banner simply reappears next visit. */
  }
}
