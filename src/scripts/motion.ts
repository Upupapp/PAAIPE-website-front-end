/**
 * The motion layer.
 *
 * Everything here is additive. `motion-ready` is added only after this module
 * initialises, and every motion rule in `motion.css` is scoped to it — so if
 * this script never runs, or throws, the page is fully readable with no
 * animation at all. Content is never hidden waiting for JavaScript.
 *
 * Reduced motion is honoured at the BEHAVIOUR level as well as in CSS: the
 * observer is not even created, so nothing is left mid-transition.
 */
import { COMPONENT_MOTION_TOKENS, MOTION_LIMITS } from '../config/tokens';
import { ambientPaused, prefersReducedMotion } from '../lib/preferences';

/** Debounce window for the scroll-end sweep, taken from the token scale. */
const SCROLL_SETTLE_MS = Number.parseInt(COMPONENT_MOTION_TOKENS['motion-scroll-settle'], 10);

/** Scroll reveals. Observes once, then unobserves — never per-frame work. */
function initReveals(): void {
  const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (targets.length === 0) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    // Reveal everything immediately rather than leaving content hidden.
    for (const target of targets) target.classList.add('is-revealed');
    return;
  }

  const pending = new Set<HTMLElement>();

  const reveal = (target: HTMLElement): void => {
    target.classList.add('is-revealed');
    pending.delete(target);
    observer.unobserve(target);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  );

  for (const target of targets) {
    // Anything already on screen at load must not wait for the observer.
    if (target.getBoundingClientRect().top < window.innerHeight) {
      target.classList.add('is-revealed');
      continue;
    }
    pending.add(target);
    observer.observe(target);
  }

  /**
   * Sweep anything the observer will never report.
   *
   * An IntersectionObserver fires on a CHANGE in intersection. An element that
   * jumps straight from below the viewport to above it - a fast scroll, an
   * in-page anchor, a restored scroll position - goes from ratio 0 to ratio 0,
   * so no entry is ever delivered and the element stays hidden permanently.
   *
   * This runs on scroll END, not per frame, so it does not measure every
   * section on every scroll frame.
   */
  const sweep = (): void => {
    if (pending.size === 0) return;
    for (const target of [...pending]) {
      if (target.getBoundingClientRect().top < window.innerHeight) reveal(target);
    }
  };

  const supportsScrollEnd =
    typeof (window as { onscrollend?: unknown }).onscrollend !== 'undefined';

  if (supportsScrollEnd) {
    window.addEventListener('scrollend', sweep, { passive: true });
  } else {
    // Debounced, for engines without scrollend.
    let timer: ReturnType<typeof setTimeout> | undefined;
    window.addEventListener(
      'scroll',
      () => {
        clearTimeout(timer);
        timer = setTimeout(sweep, SCROLL_SETTLE_MS);
      },
      { passive: true },
    );
  }

  // Card groups stagger, capped at five cards and 180ms of added delay.
  for (const group of document.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    const cards = [...group.querySelectorAll<HTMLElement>('[data-reveal]')];
    cards.forEach((card, index) => {
      if (index >= MOTION_LIMITS.maxStaggeredCards) return;
      const delay = Math.min(index * MOTION_LIMITS.staggerStepMs, MOTION_LIMITS.maxStaggerDelayMs);
      card.style.setProperty('--reveal-delay', `${delay}ms`);
    });
  }
}

/**
 * The decorative field's one-time reveal.
 *
 * Runs once, settles well inside the five-second ceiling, and never loops - so
 * no pause control is required. It is paused if the document is hidden before
 * it starts, and simply does not run under reduced motion.
 */
function initDecor(): void {
  const fields = [...document.querySelectorAll<HTMLElement>('.network-field')];
  // The ambient field also honours its own switch, independently of motion.
  if (fields.length === 0 || prefersReducedMotion() || ambientPaused()) return;

  const start = (field: HTMLElement): void => {
    if (document.visibilityState !== 'visible') return;
    field.classList.add('is-drawn');
  };

  if (!('IntersectionObserver' in window)) {
    for (const field of fields) start(field);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        start(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.1 },
  );

  for (const field of fields) observer.observe(field);
}

/**
 * After a client-side navigation, move focus to the new main landmark so a
 * keyboard or screen-reader user is not left at the bottom of the previous
 * page. `preventScroll` keeps it from jumping.
 */
function focusMainAfterNavigation(): void {
  const main = document.getElementById('main-content');
  main?.focus({ preventScroll: true });
}

function init(): void {
  document.documentElement.classList.add('motion-ready');
  initReveals();
  initDecor();
}

init();

// Astro's client router replaces the document body on navigation, so the motion
// layer is re-initialised per page rather than once per session.
document.addEventListener('astro:page-load', () => {
  init();
  if (document.documentElement.hasAttribute('data-astro-transition')) {
    focusMainAfterNavigation();
  }
});
