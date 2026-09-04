import type { Page } from '@playwright/test';

/**
 * What a narrow viewport actually COSTS this page.
 *
 * WHY NOT `documentElement.scrollWidth`, which is the obvious measure and the
 * one the older assertions use: a 1200px element planted inside an event detail
 * page did not move it by a pixel. `section.page-hero` carries
 * `overflow-x: hidden`, so the element was CLIPPED rather than widening the
 * document, and the document reported a contented 320 = 320 while 880px of
 * content sat outside the visible box.
 *
 * Clipping is the worse of the two failures. A page that scrolls sideways is
 * ugly and still reachable; content clipped behind `overflow: hidden` cannot be
 * reached at all - not by scrolling, not at any zoom, not by any input.
 *
 * But "something overflows a hidden box" is not a defect on its own, and
 * asserting it directly produced only false positives on this site:
 *
 *   - The visually-hidden idiom IS a 1px box with clipped content. That is how
 *     `.sr-only` text stays available to a screen reader while taking no space.
 *   - The logo renders 132px wide inside a 119px box, because negative margins
 *     trim the asset's transparent padding so the wordmark aligns optically
 *     with the text beside it. Measured on the shipped asset: 41px of
 *     transparent pixels on the right, and the trim removes the equivalent of
 *     40px. What `overflow: hidden` cuts there is empty space.
 *
 * So this asks what the clip costs, not whether one exists. Only text a reader
 * must read, and controls a reader must reach, are counted.
 */
export async function findClippedContent(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    const name = (el: Element) =>
      el.tagName.toLowerCase() +
      (el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : '');

    for (const el of Array.from(document.querySelectorAll('*'))) {
      const overflowX = getComputedStyle(el).overflowX;
      if (overflowX !== 'hidden' && overflowX !== 'clip') continue;
      if (el.scrollWidth <= el.clientWidth + 1) continue;
      // The visually-hidden idiom, which is the intended state.
      if (el.clientWidth <= 1 || el.clientHeight <= 1) continue;

      const limit = el.getBoundingClientRect().right + 1;
      let worst = 0;
      let sample = '';

      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent?.trim() ?? '';
        if (text) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of Array.from(range.getClientRects())) {
            if (rect.width > 0 && rect.right - limit > worst) {
              worst = rect.right - limit;
              sample = text.slice(0, 40);
            }
          }
        }
        node = walker.nextNode();
      }

      for (const control of Array.from(
        el.querySelectorAll('a, button, input, select, textarea, [tabindex]'),
      )) {
        const rect = control.getBoundingClientRect();
        if (rect.width > 0 && rect.right - limit > worst) {
          worst = rect.right - limit;
          sample = `<${control.tagName.toLowerCase()}>`;
        }
      }

      if (worst > 1) {
        found.push(`${name(el)} clips ${Math.round(worst)}px of ${JSON.stringify(sample)}`);
      }
    }

    const doc = document.documentElement;
    if (doc.scrollWidth > doc.clientWidth + 1) {
      found.push(`document scrolls sideways: ${doc.scrollWidth} > ${doc.clientWidth}`);
    }
    return found;
  });
}
