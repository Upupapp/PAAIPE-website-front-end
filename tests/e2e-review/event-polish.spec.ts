/**
 * Tab 08 - motion, responsive behaviour and accessibility on the event surfaces.
 *
 * Every assertion here is one that reading the source cannot make. The
 * repository has already shipped a stylesheet that said the right thing while
 * the page did something else - a card background whose token was undefined, so
 * the declaration was dropped and every card was transparent for two tabs - and
 * the lesson from that is not "check the CSS harder". It is that the computed
 * value is the only evidence.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const MARKETPLACE = '/events';
const DETAIL = '/events/sample-public-open';

/* The widths the command names, plus the 200%-zoom equivalent of 640px. */
const WIDTHS = [320, 390, 768, 1024, 1440] as const;

test.describe('the event surfaces reflow without clipping', () => {
  for (const path of [MARKETPLACE, DETAIL]) {
    for (const width of WIDTHS) {
      test(`${path} has no horizontal page scroll at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth - doc.clientWidth;
        });
        expect(
          overflow,
          `${path} scrolls horizontally by ${overflow}px at ${width}`,
        ).toBeLessThanOrEqual(0);
      });
    }

    test(`${path} keeps its content inside the viewport at 200% zoom`, async ({ page }) => {
      /*
       * 200% zoom is modelled as half the viewport width at double the device
       * scale - the geometry a browser actually produces - rather than a CSS
       * `zoom`, which several engines treat differently.
       */
      await page.setViewportSize({ width: 640, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('primary touch targets meet the size floor', () => {
  test('every event card link and panel action is at least 44px tall', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MARKETPLACE);

    /*
     * MEASURE THE TARGET, NOT THE ELEMENT THAT CARRIES THE NAME. The card's
     * link is a 1px visually-hidden anchor whose `::after` stretches over the
     * whole card, so the thing a finger can hit is the CARD. Measuring the
     * anchor reported 0px tall and failed - a measurement artefact, not a
     * defect, and the kind that gets "fixed" by padding a control nobody
     * touches.
     */
    const targets = page.locator('.event-card, .panel a');
    const count = await targets.count();
    expect(count, 'no primary controls found; this test measures nothing').toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await targets.nth(index).boundingBox();
      expect(box, `control ${index} has no box`).not.toBeNull();
      expect(box!.height, `control ${index} is ${box!.height}px tall`).toBeGreaterThanOrEqual(44);
      expect(box!.width, `control ${index} is ${box!.width}px wide`).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('nothing is conveyed by colour alone', () => {
  test('the two access badges differ in more than hue', async ({ page }) => {
    /*
     * THE DEFECT THIS EXISTS FOR. `--color-text-accent` was undefined, so the
     * members-only rule was dropped and both chips rendered identically.
     * Substituting `--color-link` did not fix it either - that token resolves to
     * the same navy - so the two still matched. Only the COMPUTED style shows
     * this; the CSS reads as though the distinction is there.
     */
    await page.goto(MARKETPLACE);
    const members = page.locator('.access--members-only').first();
    const publicChip = page.locator('.access--public').first();
    await expect(members).toBeVisible();
    await expect(publicChip).toBeVisible();

    const read = async (locator: typeof members) =>
      locator.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { color: cs.color, background: cs.backgroundColor, text: el.textContent?.trim() };
      });

    const a = await read(members);
    const b = await read(publicChip);

    expect(
      a.color !== b.color || a.background !== b.background,
      'the access badges are visually identical',
    ).toBe(true);
    // And the words carry the meaning on their own.
    expect(a.text).not.toBe(b.text);
  });

  test('the card surface is actually painted, not merely declared', async ({ page }) => {
    await page.goto(MARKETPLACE);
    const card = page.locator('.event-card').first();
    await expect(card).toBeVisible();
    const background = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
    // A dropped declaration computes to transparent, which is what shipped.
    expect(background, 'the card background is transparent').not.toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('reduced motion removes travel, never feedback', () => {
  /*
   * EMULATED EXPLICITLY, AND THEN ASSERTED.
   *
   * `test.use({ reducedMotion: 'reduce' })` at describe level did NOT take
   * effect here - measured 2026-09-05, `matchMedia('(prefers-reduced-motion:
   * reduce)').matches` was FALSE inside these tests. Every assertion in this
   * block was therefore exercising the DEFAULT path a second time: a
   * reduced-motion suite that was not in reduced motion, which is the most
   * comfortable kind of wrong because two of its three tests passed.
   *
   * `emulateMedia` is applied per test, and `expectReducedMotion` asserts the
   * mode is really on before anything is measured. Without that assertion this
   * block could silently revert to testing nothing again, and nobody would
   * learn it from a green run.
   */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  async function expectReducedMotion(page: Page) {
    const active = await page.evaluate(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    expect(active, 'reduced motion is not active; this test would measure nothing').toBe(true);
  }

  test('the card does not travel on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(MARKETPLACE);
    await expectReducedMotion(page);
    const card = page.locator('.event-card').first();
    await card.hover();
    await page.waitForTimeout(200);
    const transform = await card.evaluate((el) => getComputedStyle(el).transform);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)']).toContain(transform);
  });

  test('the registration state is still stated in full', async ({ page }) => {
    await page.goto(DETAIL);
    await expectReducedMotion(page);
    const panel = page.locator('.panel').first();
    await expect(panel).toBeVisible();
    const text = ((await panel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    expect(text.length, 'reduced motion removed the panel content').toBeGreaterThan(40);
  });

  test('the hero is visible immediately rather than waiting to be revealed', async ({ page }) => {
    await page.goto(DETAIL);
    await expectReducedMotion(page);
    const hero = page.locator('.hero').first();
    await expect(hero).toBeVisible();
    expect(await hero.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
  });
});

test.describe('forced-colors mode keeps state perceivable', () => {
  /*
   * Emulated per test and then asserted, for the reason recorded above: the
   * describe-level `test.use` did not apply, and these two tests PASSED while
   * forced colors was off - which is the worse half of that discovery, because
   * nothing about a green run said they were testing the ordinary palette.
   */
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
  });

  async function expectForcedColors(page: Page) {
    const active = await page.evaluate(() => window.matchMedia('(forced-colors: active)').matches);
    expect(active, 'forced colors is not active; this test would measure nothing').toBe(true);
  }

  test('borders and text survive when the palette is replaced', async ({ page }) => {
    /*
     * In forced-colors the OS supplies every colour, so a state carried by a
     * background fill or a glow disappears. What must remain is a BORDER and
     * TEXT - which is why the access badge uses an outline plus words, and why
     * the panel's entrance animates border-color rather than adding a glow.
     */
    await page.goto(MARKETPLACE);
    await expectForcedColors(page);
    const badge = page.locator('.access--members-only').first();
    await expect(badge).toBeVisible();
    const style = await badge.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { borderWidth: cs.borderTopWidth, text: el.textContent?.trim() ?? '' };
    });
    expect(
      parseFloat(style.borderWidth),
      'the badge has no border in forced colors',
    ).toBeGreaterThan(0);
    expect(style.text.length, 'the badge has no text to read').toBeGreaterThan(0);
  });

  test('the detail page still states its registration position', async ({ page }) => {
    await page.goto(DETAIL);
    await expectForcedColors(page);
    await expect(page.locator('#event-registration')).toHaveCount(1);
    await expect(page.locator('.panel').first()).toBeVisible();
  });
});

test.describe('no manipulative or looping motion', () => {
  test('nothing on the event surfaces animates indefinitely', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const path of [MARKETPLACE, DETAIL]) {
      await page.goto(path);
      await page.waitForTimeout(600);
      const looping = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('*')]
          .filter((el) => {
            const cs = getComputedStyle(el);
            return cs.animationName !== 'none' && cs.animationIterationCount === 'infinite';
          })
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`),
      );
      expect(looping, `${path} has an infinite animation`).toEqual([]);
    }
  });

  test('no capacity or urgency wording is animated', async ({ page }) => {
    await page.goto(MARKETPLACE);
    const animated = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('*')]
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.animationName === 'none') return false;
          const text = (el.textContent ?? '').toLowerCase();
          return /full|limited|places|hurry|last chance|closing soon/.test(text);
        })
        .map((el) => el.textContent?.trim().slice(0, 40)),
    );
    expect(animated, 'capacity wording is animated').toEqual([]);
  });
});
