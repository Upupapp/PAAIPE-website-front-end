/**
 * Enables the preference panel.
 *
 * The controls ship disabled and the no-JS explanation ships visible; this
 * reverses both. A visitor without JavaScript is never shown a switch that
 * would silently do nothing.
 */
import { cancelHaptics, haptic } from '../lib/haptics';
import {
  PREFERENCE_KEYS,
  readPreference,
  writePreference,
  type PreferenceKey,
  type PreferenceValue,
} from '../lib/preferences';

function applyDocumentState(): void {
  const root = document.documentElement;
  root.dataset.reduceMotion = readPreference('reduce-motion');
  root.dataset.pauseAmbient = readPreference('pause-ambient');
}

function initPreferencePanel(): void {
  applyDocumentState();

  const panel = document.querySelector<HTMLElement>('[data-preference-panel]');
  if (!panel) return;

  const status = panel.querySelector<HTMLElement>('[data-preference-status]');
  const nojs = panel.querySelector<HTMLElement>('[data-preference-nojs]');
  if (nojs) nojs.hidden = true;

  // Haptics is offered only where it could actually do something.
  const hapticsRow = panel.querySelector<HTMLElement>('[data-haptics-row]');
  const vibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  if (hapticsRow) hapticsRow.hidden = !vibrationSupported;

  for (const key of PREFERENCE_KEYS) {
    const control = panel.querySelector<HTMLSelectElement>(`[data-preference="${key}"]`);
    if (!control) continue;

    control.value = readPreference(key);
    control.disabled = false;

    control.addEventListener('change', () => {
      const value = control.value as PreferenceValue;
      writePreference(key as PreferenceKey, value);
      applyDocumentState();

      if (key === 'haptics') {
        if (value === 'on') {
          // The one caller on this site: a major user-enabled toggle, which is
          // exactly what the light acknowledgment pattern is for. Silent no-op
          // wherever vibration is unsupported.
          haptic('light-acknowledgment');
        } else {
          cancelHaptics();
        }
      }

      if (status) {
        const label = panel.querySelector(`label[for="${control.id}"]`)?.textContent?.trim();
        status.textContent = `${label} set to ${control.selectedOptions[0]?.textContent?.trim()}.`;
      }
    });
  }
}

// Stop any vibration when the page goes away or is hidden.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') cancelHaptics();
});
window.addEventListener('pagehide', cancelHaptics);

initPreferencePanel();
document.addEventListener('astro:page-load', initPreferencePanel);

export {};
