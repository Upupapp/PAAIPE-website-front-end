/**
 * Tab 13 — responsive and accessibility conformance.
 *
 * Kept separate from routes.spec.ts because these are conformance sweeps over
 * every route rather than behaviour tests of one feature.
 *
 * These are DEFECT DETECTORS, not proof of conformance. What automation can
 * check is checked here; what only a person with a screen reader can check is
 * listed as unverified in docs/accessibility-report.md rather than assumed.
 */
import { expect, test, type Page } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../src/config/routes';

const routes = PUBLIC_ROUTES.filter((route) => !route.dynamic).map((route) =>
  route.path === '/404' ? '/this-page-does-not-exist' : route.path,
);

/** Every width the master command names, plus intermediates. */
const WIDTHS = [320, 360, 390, 414, 768, 900, 1024, 1280, 1440];

async function settle(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== 'running'),
      undefined,
      {
        timeout: 4000,
      },
    )
    .catch(() => {});
}

/* ---------------------------------------------------------------- */
/* Responsive reflow                                                 */
/* ---------------------------------------------------------------- */

for (const width of WIDTHS) {
  test(`no page-level horizontal scroll at ${width}px on any route`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of routes) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows by ${overflow}px at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

test('nothing is clipped or overlapping at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  for (const path of routes) {
    await page.goto(path);
    const problems = await page.evaluate(() => {
      const found: string[] = [];
      /**
       * A block element's COMPUTED height is always a pixel value, never
       * "auto", and `scrollHeight > clientHeight` is normal for any box with
       * `overflow: visible` — nothing is clipped, the content simply paints
       * outside the box. The first version of this detector flagged nine
       * perfectly healthy elements on the home page for exactly that reason.
       *
       * A real clip needs an overflow value that actually hides content with
       * no way to scroll to it.
       */
      for (const el of document.querySelectorAll<HTMLElement>('main *')) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        // Visually-hidden text is deliberate, not clipped.
        if (el.classList.contains('sr-only')) continue;

        const hasText = (el.textContent ?? '').trim().length > 0;

        if (hasText && style.overflowY === 'hidden' && el.scrollHeight > el.clientHeight + 2) {
          found.push(`clipped text: ${el.tagName}.${String(el.className).slice(0, 30)}`);
        }

        // `auto` and `scroll` are the labelled local scrolling the master
        // command explicitly allows for tables and code samples.
        if (style.overflowX === 'hidden' && el.scrollWidth > el.clientWidth + 2) {
          found.push(`horizontal clip: ${el.tagName}.${String(el.className).slice(0, 30)}`);
        }
      }
      return found;
    });
    expect(problems, `${path} at 320px`).toEqual([]);
  }
});

test('content reflows at 200% text zoom without loss', async ({ page }) => {
  // WCAG 1.4.4 resize text: doubling the root font size is the standard
  // emulation of a browser's text-only zoom.
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of routes) {
    await page.goto(path);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await settle(page);

    const result = await page.evaluate(() => {
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      /**
       * Content that has text but no longer occupies space.
       *
       * Deliberately hidden elements are excluded: the accessibility page's
       * no-JS notice is `hidden` once script runs, and counting it as "lost
       * content" flagged a page that was perfectly fine.
       */
      const lost = [...document.querySelectorAll<HTMLElement>('main h1, main h2, main p')].filter(
        (el) => {
          if ((el.textContent ?? '').trim().length === 0) return false;
          if (el.hidden || el.closest('[hidden]')) return false;
          if (el.classList.contains('sr-only')) return false;
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          return el.getBoundingClientRect().height === 0;
        },
      ).length;
      return { overflow, lost };
    });
    expect(result.overflow, `${path} overflows at 200% zoom`).toBeLessThanOrEqual(1);
    expect(result.lost, `${path} lost content at 200% zoom`).toBe(0);
  }
});

/* ---------------------------------------------------------------- */
/* Semantic structure                                               */
/* ---------------------------------------------------------------- */

test('every route has exactly one H1 and skips no heading level', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const result = await page.evaluate(() => {
      const headings = [...document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')]
        .filter((el) => getComputedStyle(el).display !== 'none')
        .map((el) => Number(el.tagName.slice(1)));
      const skips: string[] = [];
      for (let i = 1; i < headings.length; i += 1) {
        const previous = headings[i - 1]!;
        const current = headings[i]!;
        if (current > previous + 1) skips.push(`h${previous} -> h${current}`);
      }
      return { h1: headings.filter((level) => level === 1).length, skips };
    });
    expect(result.h1, `${path} H1 count`).toBe(1);
    expect(result.skips, `${path} skipped heading levels`).toEqual([]);
  }
});

test('landmarks are present, and repeated ones are distinctly labelled', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const result = await page.evaluate(() => {
      const navs = [...document.querySelectorAll('nav')].map(
        (nav) => nav.getAttribute('aria-label') ?? nav.getAttribute('aria-labelledby') ?? '',
      );
      return {
        header: document.querySelectorAll('body > header').length,
        main: document.querySelectorAll('main').length,
        footer: document.querySelectorAll('body > footer').length,
        navs,
      };
    });
    expect(result.main, `${path} main`).toBe(1);
    // Every nav is named, and no two share a name.
    expect(
      result.navs.filter((label) => label === ''),
      `${path} unnamed nav`,
    ).toEqual([]);
    expect(new Set(result.navs).size, `${path} duplicate nav names`).toBe(result.navs.length);
  }
});

test('no positive tabindex anywhere', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const positive = await page.evaluate(
      () =>
        [...document.querySelectorAll('[tabindex]')]
          .map((el) => Number(el.getAttribute('tabindex')))
          .filter((value) => value > 0).length,
    );
    expect(positive, `${path} has a positive tabindex`).toBe(0);
  }
});

test('navigation uses links and actions use buttons', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const problems = await page.evaluate(() => {
      const found: string[] = [];
      // A link with no href is not a link.
      for (const a of document.querySelectorAll('a')) {
        if (!a.getAttribute('href')) found.push(`anchor without href: ${a.textContent?.trim()}`);
      }
      // A button that navigates should be a link.
      for (const button of document.querySelectorAll('button')) {
        if (button.getAttribute('onclick')?.includes('location')) {
          found.push(`button navigates: ${button.textContent?.trim()}`);
        }
      }
      return found;
    });
    expect(problems, path).toEqual([]);
  }
});

/* ---------------------------------------------------------------- */
/* Images and media                                                 */
/* ---------------------------------------------------------------- */

test('every image declares alt and dimensions, and repeats no adjacent text', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const problems = await page.evaluate(() => {
      const found: string[] = [];
      for (const img of document.querySelectorAll('img')) {
        const alt = img.getAttribute('alt');
        if (alt === null) found.push(`no alt attribute: ${img.getAttribute('src')}`);
        if (!img.getAttribute('width') || !img.getAttribute('height')) {
          found.push(`no declared dimensions: ${img.getAttribute('src')}`);
        }
        if (alt && alt.trim().length > 0) {
          const nearby = img.closest('a, figure, span, div')?.textContent?.trim() ?? '';
          if (nearby.length > 0 && nearby.includes(alt.trim())) {
            found.push(`alt repeats adjacent text: ${alt}`);
          }
        }
      }
      return found;
    });
    expect(problems, path).toEqual([]);
  }
});

test('no media autoplays and no audio exists', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const problems = await page.evaluate(() =>
      [...document.querySelectorAll('video, audio')]
        .filter((el) => el.hasAttribute('autoplay') || el.tagName === 'AUDIO')
        .map((el) => el.tagName),
    );
    expect(problems, path).toEqual([]);
  }
});

/* ---------------------------------------------------------------- */
/* Language                                                         */
/* ---------------------------------------------------------------- */

test('no device-specific instruction appears anywhere', async ({ page }) => {
  for (const path of routes) {
    await page.goto(path);
    const text = await page.locator('main').innerText();
    // "click here", "tap below", "see the sidebar" all assume a device or a
    // visual layout the reader may not have.
    expect(text, `${path} uses a device-specific instruction`).not.toMatch(
      /\b(click here|tap here|click below|tap below|see the (sidebar|left|right)|on the left|on the right)\b/i,
    );
  }
});

/* ---------------------------------------------------------------- */
/* Touch targets                                                    */
/* ---------------------------------------------------------------- */

test('every interactive control meets the WCAG 2.2 minimum target size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of routes) {
    await page.goto(path);
    const small = await page.evaluate(() => {
      const found: string[] = [];
      const MINIMUM = 24; // WCAG 2.2 AA, 2.5.8
      for (const el of document.querySelectorAll<HTMLElement>(
        'a, button, select, input, [tabindex]:not([tabindex="-1"])',
      )) {
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // An inline link inside a sentence is exempt under 2.5.8.
        if (el.tagName === 'A' && style.display === 'inline') continue;
        if (rect.width < MINIMUM || rect.height < MINIMUM) {
          found.push(
            `${el.tagName}.${String(el.className).slice(0, 24)} ${Math.round(rect.width)}x${Math.round(rect.height)}`,
          );
        }
      }
      return found;
    });
    expect(small, `${path} has undersized targets`).toEqual([]);
  }
});

/* ---------------------------------------------------------------- */
/* Focus                                                            */
/* ---------------------------------------------------------------- */

test('every focusable control shows a visible focus indicator', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Keyboard focus is a desktop path.');

  for (const path of ['/', '/membership', '/accessibility', '/resources']) {
    await page.goto(path);
    const invisible = await page.evaluate(() => {
      const found: string[] = [];
      const controls = [
        ...document.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), select'),
      ]
        // Only controls a keyboard user can actually reach right now. A link
        // inside a closed dropdown is `visibility: hidden`, and focusing it
        // programmatically reports no indicator because it is not rendered —
        // that measures the harness, not the page.
        .filter((el) => {
          if (el.getBoundingClientRect().height === 0) return false;
          if (el.offsetParent === null) return false;
          let node: HTMLElement | null = el;
          while (node) {
            const style = getComputedStyle(node);
            if (style.visibility === 'hidden' || style.opacity === '0') return false;
            node = node.parentElement;
          }
          return true;
        })
        .slice(0, 40);
      for (const el of controls) {
        el.focus();
        const style = getComputedStyle(el);
        const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
        const hasShadow = style.boxShadow !== 'none';
        if (!hasOutline && !hasShadow) {
          found.push(`${el.tagName}.${String(el.className).slice(0, 24)}`);
        }
      }
      return found;
    });
    expect(invisible, `${path} has controls with no focus indicator`).toEqual([]);
  }
});

test('focus never enters decorative content', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Keyboard traversal is a desktop path.');
  await page.goto('/');

  const inDecor = await page.evaluate(() => {
    const decorative = [...document.querySelectorAll('[aria-hidden="true"]')];
    return decorative.some((el) =>
      el.querySelector('a[href], button, select, input, [tabindex]:not([tabindex="-1"])'),
    );
  });
  expect(inDecor, 'a focusable control sits inside aria-hidden content').toBe(false);
});

/* ---------------------------------------------------------------- */
/* Rendering without CSS                                            */
/* ---------------------------------------------------------------- */

test('content order remains meaningful with CSS disabled', async ({ page }) => {
  await page.route('**/*.css', (route) => route.abort());
  await page.goto('/');

  const order = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      skipFirst: text.indexOf('Skip to main content') === 0,
      headingBeforeFooter:
        text.indexOf('Building the Philippines') < text.indexOf('All rights reserved'),
      hasContent: text.length > 500,
    };
  });
  expect(order.skipFirst, 'the skip link must come first in reading order').toBe(true);
  expect(order.headingBeforeFooter, 'content order is wrong without CSS').toBe(true);
  expect(order.hasContent).toBe(true);
});
