/**
 * Progressive-enhancement filtering for the events index.
 *
 * Every event is already in the initial HTML. This only HIDES cards, and only
 * once script has run - with JavaScript unavailable nothing is filtered and
 * nothing is hidden, which is the requirement.
 *
 * The result count is announced politely, once per change, rather than on every
 * keystroke or hover.
 */
import { MOTION_TOKENS } from '../config/tokens';

/** The 140ms group fade, taken from the token scale rather than retyped. */
const GROUP_FADE_MS = Number.parseInt(MOTION_TOKENS['motion-fast'], 10);
function initEventFilters(): void {
  const container = document.querySelector<HTMLElement>('[data-event-filters]');
  const count = document.querySelector<HTMLElement>('[data-filter-count]');

  if (container) {
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('.filter')];
    const cards = [...document.querySelectorAll<HTMLElement>('.event-card')];

    /** One group fade per change, not a per-row animation. */
    const fadeGroup = (): void => {
      const group = document.querySelector<HTMLElement>('[data-event-grid], [data-resource-grid]');
      if (!group) return;
      group.style.opacity = '0.6';
      window.setTimeout(() => {
        group.style.opacity = '';
      }, GROUP_FADE_MS);
    };

    const apply = (topic: string): void => {
      let visible = 0;
      for (const card of cards) {
        const matches = topic === 'all' || card.dataset.topic === topic;
        card.hidden = !matches;
        if (matches) visible += 1;
      }
      for (const button of buttons) {
        button.setAttribute('aria-pressed', String(button.dataset.topic === topic));
      }
      if (count) {
        count.textContent = visible === 1 ? '1 event shown' : `${visible} events shown`;
      }
    };

    for (const button of buttons) {
      button.addEventListener('click', () => {
        fadeGroup();
        apply(button.dataset.topic ?? 'all');
      });
    }

    apply('all');
  }
}

initEventFilters();
// Astro's client router replaces the body on navigation, so per-element
// wiring must be re-applied for the new page.
document.addEventListener('astro:page-load', initEventFilters);

// Marks this file a module so its top-level consts are not global. Without
// this, two sibling scripts both declaring `count` collide at type-check time.
export {};
