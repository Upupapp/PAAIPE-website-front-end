/**
 * Marketplace enhancement.
 *
 * Everything here only hides, reorders and counts what the server already
 * rendered. With scripting off none of it runs, nothing is hidden, and the full
 * list stands — which is what makes the no-JavaScript claim true rather than
 * aspirational.
 *
 * It lives in a typed module rather than an inline `<script>` so `astro check`
 * type-checks it. An inline script is invisible to the strict typecheck the rest
 * of this repository runs, which is a poor place to keep the only untyped code.
 */
const filterBar = document.querySelector<HTMLElement>('[data-event-toolbar]');
const results = document.querySelector<HTMLElement>('#event-results');
const summary = document.querySelector<HTMLElement>('[data-event-summary]');
const noMatches = document.querySelector<HTMLElement>('[data-event-no-matches]');
const upcomingSection = document.querySelector<HTMLElement>('#upcoming');
const pastSection = document.querySelector<HTMLElement>('#past');

if (filterBar && results && summary) {
  const search = filterBar.querySelector<HTMLInputElement>('[data-event-search]');
  const filters = new Map<string, HTMLSelectElement>();
  for (const element of filterBar.querySelectorAll<HTMLSelectElement>('[data-event-filter]')) {
    filters.set(element.dataset.eventFilter ?? '', element);
  }
  const items = [...results.querySelectorAll<HTMLElement>('[data-event-item]')];

  /** Announce only a CHANGED count: repeating an unchanged one is noise. */
  let lastCount = Number(summary.dataset.count ?? items.length);

  const read = (name: string): string => filters.get(name)?.value ?? '';

  const cardOf = (item: HTMLElement) => item.querySelector<HTMLElement>('.event-card');

  function apply(deliberate: boolean): void {
    const query = (search?.value ?? '').trim().toLowerCase();
    const type = read('type');
    const access = read('access');
    const timing = read('timing') || 'upcoming';

    let shown = 0;
    for (const item of items) {
      const card = cardOf(item);
      const haystack = `${card?.dataset.title ?? ''} ${card?.dataset.tags ?? ''}`;
      const matches =
        (!query || haystack.includes(query)) &&
        (!type || card?.dataset.eventType === type) &&
        (!access || card?.dataset.access === access);
      item.hidden = !matches;
      if (matches) shown += 1;
    }

    /*
     * Sorting MOVES nodes rather than restyling them, so the DOM order matches
     * the visible order and a screen reader reads what a sighted user sees.
     */
    const direction = read('sort') === 'recent' ? -1 : 1;
    [...items]
      .sort((a, b) => {
        const left = cardOf(a)?.dataset.start ?? '';
        const right = cardOf(b)?.dataset.start ?? '';
        if (!left && !right) return 0;
        if (!left) return 1;
        if (!right) return -1;
        if (left === right) return 0;
        return left < right ? -direction : direction;
      })
      .forEach((item) => results!.append(item));

    if (noMatches) noMatches.hidden = shown !== 0 || items.length === 0;
    if (upcomingSection) upcomingSection.hidden = timing !== 'upcoming';
    if (pastSection) pastSection.hidden = timing !== 'past';

    if (shown !== lastCount) {
      summary!.textContent = `${shown} ${shown === 1 ? 'event' : 'events'} shown`;
      lastCount = shown;
    }

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (type) params.set('type', type);
    if (access) params.set('access', access);
    if (timing !== 'upcoming') params.set('view', timing);
    if (read('sort') && read('sort') !== 'soonest') params.set('sort', read('sort'));
    const url = params.toString() ? `/events?${params.toString()}` : '/events';
    /* replaceState for rapid typing; a deliberate view switch earns an entry. */
    if (deliberate) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  }

  /* A shared link opens filtered. */
  const initial = new URLSearchParams(location.search);
  if (search && initial.get('q')) search.value = initial.get('q') ?? '';
  for (const [name, param] of [
    ['type', 'type'],
    ['access', 'access'],
    ['timing', 'view'],
    ['sort', 'sort'],
  ] as const) {
    const value = initial.get(param);
    const element = filters.get(name);
    if (element && value) element.value = value;
  }
  if ([...initial.keys()].length > 0) apply(false);

  search?.addEventListener('input', () => apply(false));
  for (const [name, element] of filters) {
    element.addEventListener('change', () => apply(name === 'timing'));
  }
  filterBar
    .querySelector<HTMLButtonElement>('[data-event-clear]')
    ?.addEventListener('click', () => {
      if (search) search.value = '';
      for (const [name, element] of filters) {
        element.value = name === 'timing' ? 'upcoming' : (element.options[0]?.value ?? '');
      }
      apply(true);
    });

  /*
   * The sheet MOVES the toolbar rather than copying it. Two copies would be two
   * sources of state, disagreeing the first time someone used both.
   */
  const sheet = document.querySelector<HTMLDialogElement>('[data-sheet]');
  const slot = document.querySelector<HTMLElement>('[data-sheet-slot]');
  const opener = document.querySelector<HTMLButtonElement>('[data-sheet-open]');
  if (sheet && slot && opener) {
    const home = filterBar.parentElement;
    opener.addEventListener('click', () => {
      slot.append(filterBar);
      filterBar.style.display = 'flex';
      sheet.showModal();
    });
    sheet
      .querySelector<HTMLButtonElement>('[data-sheet-close]')
      ?.addEventListener('click', () => sheet.close());
    /* `close` fires for Escape too, so focus return is handled in one place. */
    sheet.addEventListener('close', () => {
      filterBar.style.display = '';
      home?.append(filterBar);
      opener.focus();
    });
    const count = document.querySelector<HTMLElement>('[data-sheet-count]');
    if (count) count.textContent = `(${items.length})`;
  }
}

/*
 * Makes this file a MODULE. Without an import or export TypeScript treats it as
 * a global script, and its top-level `const` names collide with the DOM globals
 * - `toolbar` resolved to `window.toolbar` (a BarProp) rather than the element,
 * which is why the variable is also named `filterBar` now.
 */
export {};
