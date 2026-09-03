/**
 * Search and topic filtering for the resources index.
 *
 * Progressive enhancement: every card is in the initial HTML, and this only
 * hides them. Without JavaScript the full list is shown and nothing is lost.
 *
 * The result count is announced politely and DEBOUNCED, so typing a query does
 * not narrate a new total on every keystroke.
 */
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
        apply();
      });
    }

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
