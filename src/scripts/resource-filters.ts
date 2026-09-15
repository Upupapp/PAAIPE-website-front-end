/**
 * Format filtering for the resources library (owner's Resources mockup,
 * 2026-09-15, F-77).
 *
 * Progressive enhancement. The chips ship `hidden`, so a visitor without
 * JavaScript is never offered a control that does nothing, and every card is in
 * the initial HTML, so without JavaScript the whole library stands. This reveals
 * the chips and hides cards; it never removes one.
 *
 * The count is a polite live region, updated once per choice.
 */
import { MOTION_TOKENS } from '../config/tokens';

/** The 140ms group fade, taken from the token scale rather than retyped. */
const GROUP_FADE_MS = Number.parseInt(MOTION_TOKENS['motion-fast'], 10);

function initResourceFilters(): void {
  const controls = document.querySelector<HTMLElement>('[data-resource-controls]');
  const grid = document.querySelector<HTMLElement>('[data-resource-grid]');
  const count = document.querySelector<HTMLElement>('[data-resource-count]');

  // Astro fires `astro:page-load` on the first load too, so the same controls
  // must not be wired twice.
  if (!controls || !grid || controls.dataset.wired === 'true') return;
  controls.dataset.wired = 'true';

  const chips = [...controls.querySelectorAll<HTMLButtonElement>('button[data-format]')];
  const cards = [...grid.querySelectorAll<HTMLElement>('[data-format]')];
  const noun = cards.length === 1 ? 'resource' : 'resources';

  const apply = (format: string): void => {
    let visible = 0;
    for (const card of cards) {
      const matches = format === 'all' || card.dataset.format === format;
      card.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const chip of chips) {
      chip.setAttribute('aria-pressed', String(chip.dataset.format === format));
    }
    if (count) count.textContent = `Showing ${visible} of ${cards.length} ${noun}`;
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      // One group fade per choice, not a per-card spectacle.
      grid.style.opacity = '0.6';
      window.setTimeout(() => {
        grid.style.opacity = '';
      }, GROUP_FADE_MS);
      apply(chip.dataset.format ?? 'all');
    });
  }

  controls.hidden = false;
}

initResourceFilters();
// Astro's client router replaces the body on navigation, so per-element
// wiring must be re-applied for the new page.
document.addEventListener('astro:page-load', initResourceFilters);

// Marks this file a module so its top-level consts are not global. Without
// this, two sibling scripts both declaring `count` collide at type-check time.
export {};
