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
const container = document.querySelector<HTMLElement>('[data-event-filters]');
const count = document.querySelector<HTMLElement>('[data-filter-count]');

if (container) {
  const buttons = [...container.querySelectorAll<HTMLButtonElement>('.filter')];
  const cards = [...document.querySelectorAll<HTMLElement>('.event-card')];

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
    button.addEventListener('click', () => apply(button.dataset.topic ?? 'all'));
  }

  apply('all');
}
