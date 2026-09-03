/**
 * Copy-link behaviour.
 *
 * Enabled by script only, so the control never offers an action it cannot
 * perform. The confirmation is an icon change, a label change and exactly ONE
 * polite announcement — repeated clicks do not re-announce until the label has
 * reverted, which is how a live region ends up narrating over itself.
 */
import { COMPONENT_MOTION_TOKENS } from '../config/tokens';

/** Tab 12: the confirmation reverts after 1.5-2 seconds. Taken from the scale. */
const REVERT_AFTER_MS = Number.parseInt(COMPONENT_MOTION_TOKENS['motion-copy-revert'], 10);

function initCopyLinks(): void {
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-copy-link]')];
  if (buttons.length === 0) return;

  const supported =
    typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';
  if (!supported) return;

  for (const button of buttons) {
    button.disabled = false;
    let revert: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener('click', async () => {
      const path = button.dataset.copyPath ?? '/';
      const label = button.querySelector<HTMLElement>('[data-copy-label]');
      const icon = button.querySelector<HTMLElement>('[data-copy-icon]');
      const status = button.parentElement?.querySelector<HTMLElement>('[data-copy-status]');

      // Already confirmed and not yet reverted: do nothing rather than
      // announce the same thing again.
      if (button.classList.contains('is-copied')) return;

      try {
        await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
      } catch {
        // Copying can be refused. Say so plainly rather than showing success.
        if (status) status.textContent = 'Could not copy the link.';
        return;
      }

      button.classList.add('is-copied');
      if (icon) icon.textContent = '✓';
      if (label) label.textContent = button.dataset.labelDone ?? 'Copied';
      if (status) status.textContent = 'Link copied';

      clearTimeout(revert);
      revert = setTimeout(() => {
        button.classList.remove('is-copied');
        if (icon) icon.textContent = '⧉';
        if (label) label.textContent = button.dataset.labelIdle ?? 'Copy link';
        if (status) status.textContent = '';
      }, REVERT_AFTER_MS);
    });
  }
}

initCopyLinks();
document.addEventListener('astro:page-load', initCopyLinks);

export {};
