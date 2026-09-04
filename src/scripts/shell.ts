/**
 * The shell's only client-side behaviour.
 *
 * Everything here is progressive enhancement. With this script absent the page
 * is fully usable: every navigation link is a real `<a href>` present in the
 * initial HTML, and no control is rendered that would do nothing.
 */
import { isDismissed, setDismissed } from '../lib/dismissal';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Document-level listeners are bound once; per-page wiring re-runs. */
let documentListenersBound = false;

function initAnnouncement(): void {
  const bar = document.getElementById('announcement');
  if (!bar || bar.dataset.dismissible !== 'true') return;

  if (isDismissed('announcement')) {
    bar.hidden = true;
    return;
  }

  const close = bar.querySelector<HTMLButtonElement>('[data-announcement-close]');
  if (!close) return;

  // Revealed only now: without script there is no control that does nothing.
  close.hidden = false;
  close.addEventListener('click', () => {
    setDismissed('announcement');
    bar.hidden = true;
    // Focus would otherwise be lost on a removed element.
    document.getElementById('main-content')?.focus();
  });
}

function initMobileNavigation(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const drawer = document.getElementById('primary-navigation');
  const overlay = document.querySelector<HTMLElement>('[data-nav-overlay]');
  if (!toggle || !drawer) return;

  toggle.hidden = false;

  let lastFocused: HTMLElement | null = null;

  const isModal = (): boolean =>
    // The drawer only traps focus while it is genuinely a modal overlay. Above
    // the breakpoint the same markup is an ordinary horizontal nav, and
    // trapping focus there would be a keyboard trap.
    window.matchMedia('(max-width: 63.999em)').matches;

  function open(): void {
    lastFocused = document.activeElement as HTMLElement | null;
    document.documentElement.dataset.navOpen = 'true';
    toggle!.setAttribute('aria-expanded', 'true');
    // The label says what the button will DO next, not what it is.
    toggle!.setAttribute('aria-label', 'Close navigation');
    if (overlay) overlay.hidden = false;
    drawer!.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }

  function close(restoreFocus = true): void {
    delete document.documentElement.dataset.navOpen;
    toggle!.setAttribute('aria-expanded', 'false');
    toggle!.setAttribute('aria-label', 'Open navigation');
    if (overlay) overlay.hidden = true;
    if (restoreFocus) (lastFocused ?? toggle!).focus();
  }

  toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') close();
    else open();
  });

  overlay?.addEventListener('click', () => close());

  if (documentListenersBound) return;
  documentListenersBound = true;

  document.addEventListener('keydown', (event) => {
    if (document.documentElement.dataset.navOpen !== 'true') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab' || !isModal()) return;

    const focusable = [...drawer.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (element) => element.offsetParent !== null,
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Resizing past the breakpoint must not leave a hidden drawer holding focus.
  window.matchMedia('(min-width: 64em)').addEventListener('change', (event) => {
    if (event.matches && document.documentElement.dataset.navOpen === 'true') close(false);
  });
}

function initStickyHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (!header) return;

  // A compact class only - no size change to the logo, and no layout shift:
  // the header keeps its height and only its padding and shadow change.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px;';
  document.body.prepend(sentinel);

  new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-compact', !entry?.isIntersecting),
    { threshold: 0 },
  ).observe(sentinel);
}

initAnnouncement();
initMobileNavigation();
initStickyHeader();
