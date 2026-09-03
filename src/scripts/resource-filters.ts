/**
 * Search and topic filtering for the resources index.
 *
 * Progressive enhancement: every card is in the initial HTML, and this only
 * hides them. Without JavaScript the full list is shown and nothing is lost.
 *
 * The result count is announced politely and DEBOUNCED, so typing a query does
 * not narrate a new total on every keystroke.
 */
import { MOTION_TOKENS } from '../config/tokens';

/** The 140ms group fade, taken from the token scale rather than retyped. */
const GROUP_FADE_MS = Number.parseInt(MOTION_TOKENS['motion-fast'], 10);
function initResourceFilters(): void {
  const controls = document.querySelector<HTMLElement>('[data-resource-controls]');
  const grid = document.querySelector<HTMLElement>('[data-resource-grid]');
  const count = document.querySelector<HTMLElement>('[data-resource-count]');
  const empty = document.querySelector<HTMLElement>('[data-resource-empty]');

  if (controls && grid) {
    const search = controls.querySelector<HTMLInputElement>('[data-resource-search]');
    const topicButtons = [...controls.querySelectorAll<HTMLButtonElement>('.topic')];
    const cards = [...grid.querySelectorAll<HTMLElement>('.resource-card')];
    const clear = document.querySelector<HTMLButtonElement>('[data-resource-clear]');

    let topic = 'all';
    let announce: ReturnType<typeof setTimeout> | undefined;

    /** One group fade per change, not a per-row animation. */
    const fadeGroup = (): void => {
      const group = document.querySelector<HTMLElement>('[data-event-grid], [data-resource-grid]');
      if (!group) return;
      group.style.opacity = '0.6';
      window.setTimeout(() => {
        group.style.opacity = '';
      }, GROUP_FADE_MS);
    };

    const apply = (): void => {
      const query = (search?.value ?? '').trim().toLowerCase();
      let visible = 0;

      for (const card of cards) {
        const topics = (card.dataset.topics ?? '').split('|');
        const haystack = card.dataset.search ?? '';
        const matches =
          (topic === 'all' || topics.includes(topic)) && (query === '' || haystack.includes(query));
        card.hidden = !matches;
        if (matches) visible += 1;
      }

      for (const button of topicButtons) {
        button.setAttribute('aria-pressed', String((button.dataset.topic ?? 'all') === topic));
      }

      if (empty) empty.hidden = visible !== 0;

      if (count) {
        clearTimeout(announce);
        announce = setTimeout(() => {
          count.textContent = visible === 1 ? '1 resource shown' : `${visible} resources shown`;
        }, 400);
      }
    };

    for (const button of topicButtons) {
      button.addEventListener('click', () => {
        topic = button.dataset.topic ?? 'all';
        fadeGroup();
        apply();
      });
    }

    // No fade while typing: a fade per keystroke is exactly the per-row
    // spectacle the master command rules out.
    search?.addEventListener('input', apply);

    clear?.addEventListener('click', () => {
      topic = 'all';
      if (search) search.value = '';
      apply();
      search?.focus();
    });

    apply();
  }
}

initResourceFilters();
// Astro's client router replaces the body on navigation, so per-element
// wiring must be re-applied for the new page.
document.addEventListener('astro:page-load', initResourceFilters);

// Marks this file a module so its top-level consts are not global. Without
// this, two sibling scripts both declaring `count` collide at type-check time.
export {};
