import type { Page } from '@playwright/test';

/**
 * Wait until nothing is animating.
 *
 * A rendered probe reports three different pages depending on when it looks:
 * at rest, mid-transition, and mid-animation. Anything asserting about colour
 * or position must look at the resting state, or it measures the renderer's
 * timing rather than the page.
 *
 * Shared rather than copied. Two divergent copies of a timing helper is how one
 * suite quietly stops waiting while the other still does, and the difference
 * shows up as a flake nobody can reproduce in the other file.
 */
export async function settleAnimations(page: Page): Promise<void> {
  await page
    .waitForFunction(
      // Document.getAnimations() takes no options; only Element.getAnimations()
      // accepts { subtree }. It already covers the whole document.
      () => document.getAnimations().every((animation) => animation.playState !== 'running'),
      undefined,
      { timeout: 4000 },
    )
    .catch(() => {
      /* Something loops; the assertion that follows will say so. */
    });
}
