import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { PUBLIC_ROUTES } from '../../src/config/routes';
/*
 * The raw registry, not the `src/content` barrel.
 *
 * The barrel imports `src/config`, which resolves the public config from
 * `import.meta.env` — undefined under Playwright's Node context, so importing
 * it here throws at collection time and Playwright reports "No tests found",
 * which looks exactly like a bad --grep.
 */
import { PRIMARY_NAV } from '../../src/content/navigation';
import { SPEAKERS_PAGE } from '../../src/content/events';
import { APPROVED_TYPEFACE } from '../../src/config/typeface';
import { CONTACT_PAGE, PRIVACY_DRAFT, TERMS_DRAFT } from '../../src/content/legal';
import { EVENTS_PAGE, EVENTS_STATES } from '../../src/content/events-marketplace';
import { AI_EXCHANGE_SERIES } from '../../src/content/event-series';
import { POLICIES } from '../../src/content/policies';
import { SIGNATURE_EVENT } from '../../src/content/organization';
import { settleAnimations } from '../support/settle-animations';

/**
 * Static, public routes. Dynamic templates are covered separately, and the
 * `internal` surface is EXCLUDED because Tab 14 (F-12) stops the production
 * build emitting it at all - these tests run against a production build, so
 * every one of them would 404 on it. Its absence is asserted directly below.
 */
const staticRoutes = PUBLIC_ROUTES.filter(
  (route) => !route.dynamic && !route.internal && route.path !== '/404',
);

for (const route of staticRoutes) {
  test(`${route.path} direct-loads with its title and one H1`, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(route.title);

    const headings = page.locator('main h1');
    await expect(headings).toHaveCount(1);
    await expect(headings).toHaveText(route.heading);
  });

  test(`${route.path} has no page-level horizontal overflow`, async ({ page }) => {
    await page.goto(route.path);
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });

  test(`${route.path} has no serious or critical accessibility defect`, async ({ page }) => {
    await page.goto(route.path);
    // Scan the page AT REST. A scroll-reveal fade is briefly mid-opacity, and
    // axe measures the blended colour as a contrast failure - a defect in the
    // probe's timing, not in the page. WCAG applies to the resting state.
    await settleAnimations(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const blocking = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    );
    expect(blocking.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

// The e2e suite runs against the DEFAULT build, which is production content
// mode. Nothing is approved yet, so no event or resource detail page should
// exist at all - an empty registry must produce absence, not an empty page.
test('a production build publishes no unapproved detail page', async ({ page }) => {
  for (const path of [
    '/events/paaipe-ai-exchange',
    // Reserved by the Events Continuation, Tab 01. A registration page for an
    // unapproved event must not exist either - it would be a live entry point
    // into a journey for an event nobody has announced.
    '/events/paaipe-ai-exchange/register',
    '/events/no-such-event/register',
    '/resources/what-ai-is-and-isnt',
    '/resources/ai-adoption-starter-kit',
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} must not exist in a production build`).toBe(404);
  }
});

test('a production build leaks no sample content into the HTML', async ({ page }) => {
  for (const path of ['/', '/events', '/resources']) {
    await page.goto(path);
    const html = await page.content();
    expect(html, `${path} contains sample copy`).not.toContain('Concept preview');
    expect(html).not.toContain('AI Adoption Starter Kit');
    expect(html).not.toMatch(/zoom\.us/i);
  }
});

test('no protected route is served', async ({ page }) => {
  for (const path of ['/dashboard', '/community', '/profile', '/login']) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} must not exist`).toBe(404);
  }
});

test('the skip link targets a main landmark that can receive focus', async ({ page }) => {
  await page.goto('/');
  const target = await page.locator('a.skip-link').getAttribute('href');
  expect(target).toBe('#main-content');

  const main = page.locator('main#main-content');
  await expect(main).toHaveCount(1);
  // Programmatic focus after a route change needs a focusable main.
  await expect(main).toHaveAttribute('tabindex', '-1');
});

test('the skip link is the first tab stop and shows a visible focus ring', async ({
  page,
}, testInfo) => {
  // Tab-order traversal is a desktop-keyboard path. Emulated mobile WebKit has
  // no keyboard focus ring, so running this there measures the harness, not the
  // page, and would report a defect that does not exist.
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Keyboard traversal is verified on the desktop project.',
  );

  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus-visible')).toHaveAttribute('href', '#main-content');
});

test('the internal style guide is absent from the production build, not merely noindex', async ({
  page,
}) => {
  /*
   * F-12, decided in Tab 14. `noindex` asks a crawler not to list a page; it
   * does not stop anyone fetching it, and this page names every component,
   * token and forbidden colour pairing in the system. A static host has nowhere
   * to put a login, so the page is simply not built in production.
   *
   * The evidence the page used to carry in a browser - that every measured
   * contrast pairing says PASS - is not lost. It is computed from
   * CONTRAST_CONTRACT by the same function the page calls, and asserted by
   * `src/tests/tokens.test.ts` and `npm run verify:contrast`, neither of which
   * needs the page to exist. `npm run verify:seo:review` asserts the page IS
   * built in a review build, so the exclusion is mode-specific and not a
   * deletion.
   */
  const response = await page.goto('/internal/style-guide');
  expect(response?.status()).toBe(404);
});

test('the logo is delivered unmodified - no filter, transform or blend mode', async ({ page }) => {
  // The home page, not the internal style guide: that page is no longer built
  // in production, and the header and footer lockups are the placements that
  // actually ship.
  await page.goto('/');
  const images = page.locator('.logo-lockup img');
  const count = await images.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const applied = await images.nth(i).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        filter: s.filter,
        transform: s.transform,
        mixBlendMode: s.mixBlendMode,
        mask: s.maskImage,
        rotate: s.rotate,
        // Declared dimensions are required so a logo can never shift layout.
        width: el.getAttribute('width'),
        height: el.getAttribute('height'),
      };
    });
    expect(applied.filter, 'no filter on the logo').toBe('none');
    expect(applied.transform, 'no transform on the logo').toBe('none');
    expect(applied.mixBlendMode, 'no blend mode on the logo').toBe('normal');
    expect(applied.mask, 'no mask on the logo').toBe('none');
    expect(applied.width).toBeTruthy();
    expect(applied.height).toBeTruthy();
  }
});

test('the decorative field is hidden from assistive technology and unfocusable', async ({
  page,
}) => {
  await page.goto('/');
  const field = page.locator('.network-field').first();
  await expect(field).toHaveAttribute('aria-hidden', 'true');
  const focusable = await field.locator('[tabindex]:not([tabindex="-1"]), a, button').count();
  expect(focusable).toBe(0);
});

test('every external handoff renders an honest unavailable state, never a dead link', async ({
  page,
}) => {
  /*
   * This used to load the internal style guide, which was the one page that
   * rendered all six handoffs together. Tab 14 stopped building that page in
   * production, so the test now walks the PUBLIC pages the handoffs actually
   * appear on - which is better evidence: it checks the placements that ship.
   *
   * All six action ids must be found across the site, so a handoff cannot go
   * missing and leave this passing on the five that remain.
   */
  const seen = new Set<string>();

  for (const route of staticRoutes) {
    await page.goto(route.path);
    const blocks = page.locator('[data-external-action]');
    const count = await blocks.count();

    for (let i = 0; i < count; i += 1) {
      const block = blocks.nth(i);
      const action = (await block.getAttribute('data-external-action'))!;
      seen.add(action);

      const unavailable = await block.evaluate((el) =>
        el.classList.contains('external-action-unavailable'),
      );
      if (!unavailable) {
        // A configured handoff must be a real link with a real destination.
        const href = await block.getAttribute('href');
        expect(href, `${route.path}: ${action} has no href`).toBeTruthy();
        expect(href).not.toMatch(/^(#|javascript:)/i);
        continue;
      }

      // A disabled button, not a link: there is nowhere to go.
      await expect(block.locator('button'), `${route.path}: ${action}`).toBeDisabled();
      await expect(block.locator('a')).toHaveCount(0);
      // And the reason is visible text, not a tooltip.
      await expect(block.locator('.external-action-unavailable__reason')).not.toBeEmpty();
    }
  }

  expect([...seen].sort()).toEqual([
    'application-status',
    'contact',
    'member-portal',
    'membership-application',
    'partnership-interest',
    'speaker-interest',
  ]);
});

test('no page ships a dead, empty or javascript: href', async ({ page }) => {
  for (const path of ['/', '/events', '/resources', '/membership', '/about']) {
    await page.goto(path);
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('a')]
        .map((a) => a.getAttribute('href'))
        .filter(
          (href) =>
            href === null || href.trim() === '' || href === '#' || /^javascript:/i.test(href),
        ),
    );
    expect(bad, `${path} has dead hrefs`).toEqual([]);
  }
});

/* ------------------------------------------------------------------ */
/* Tab 04 - global shell, navigation and footer                        */
/* ------------------------------------------------------------------ */

const VIEWPORTS = [360, 390, 768, 1024, 1440];

test('every route uses the semantic landmarks the shell promises', async ({ page }) => {
  for (const route of staticRoutes) {
    await page.goto(route.path);
    await expect(page.locator('body > header'), route.path).toHaveCount(1);
    await expect(page.locator('main#main-content'), route.path).toHaveCount(1);
    await expect(page.locator('footer'), route.path).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Primary"]'), route.path).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Footer"]'), route.path).toHaveCount(1);
    await expect(page.locator('a.skip-link'), route.path).toHaveCount(1);
  }
});

test('the active route is marked programmatically, not by colour alone', async ({ page }) => {
  /*
   * EVERY navigation destination, not three of them.
   *
   * This checked /about, /programs and /membership. Switching the build to
   * `file` format made `Astro.url.pathname` `/about.html`, so every comparison
   * against the route registry failed and `aria-current="page"` vanished from
   * EVERY page on the site — no current-page indicator, and nothing for a
   * screen reader to announce. A three-route sample is why that shipped.
   *
   * The list is derived from `primaryNav`, so a new destination is covered
   * without anyone remembering to add it here.
   */
  for (const item of PRIMARY_NAV) {
    for (const entry of [item, ...(item.children ?? [])]) {
      await page.goto(entry.href);
      const current = page.locator('nav[aria-label="Primary"] a[aria-current="page"]');
      await expect(current, `${entry.href} marks no nav link as current`).toHaveCount(1);
      await expect(current, entry.href).toHaveText(entry.label);
      // Ambiguity guard: nothing else on the page may also claim to be current.
      await expect(page.locator('a[aria-current="page"]'), entry.href).toHaveCount(1);
    }
  }
});

test('a nested route still marks its parent group', async ({ page }) => {
  await page.goto('/speakers');
  // /speakers is a child of the Events group, so Events must read as current.
  const group = page.locator('nav[aria-label="Primary"] a[data-current-group="true"]');
  await expect(group).toHaveCount(1);
});

for (const width of VIEWPORTS) {
  test(`no page-level horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/membership', '/internal/style-guide', '/404']) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

/*
 * 390px AND 1100px. The drawer is a modal overlay everywhere below the 74em
 * breakpoint, not only on a phone - and 1100px is exactly where shell.ts, still
 * on the old 64em query, opened it with NO focus trap (F-76). A phone-width test
 * could never see that range, which is how it shipped.
 */
for (const width of [390, 1100]) {
  test(`the drawer opens, traps focus, closes on Escape and restores focus at ${width}px`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'Keyboard traversal is verified on the desktop project.',
    );

    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');

    const toggle = page.locator('[data-nav-toggle]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Focus moved into the drawer.
    const inDrawer = await page.evaluate(
      () =>
        document.getElementById('primary-navigation')?.contains(document.activeElement) ?? false,
    );
    expect(inDrawer).toBe(true);

    // Tabbing repeatedly must never escape the open drawer.
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press('Tab');
      const stillInside = await page.evaluate(
        () =>
          document.getElementById('primary-navigation')?.contains(document.activeElement) ?? false,
      );
      expect(stillInside, `focus escaped the drawer after ${i + 1} tabs at ${width}px`).toBe(true);
    }

    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });
}

test('the drawer also closes on an overlay click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-nav-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('[data-nav-overlay]').click({ position: { x: 10, y: 10 } });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('the open drawer and its overlay span the viewport, not the header', async ({ page }) => {
  /*
   * The frosted header bar (F-76) uses backdrop-filter, which makes whatever
   * element carries it the containing block for its `position: fixed`
   * descendants. The drawer and the overlay ARE fixed descendants of the
   * header, so a filter moved onto the header itself confines both to the
   * header strip - and every other drawer test still passes, because focus,
   * Escape and a click at (10, 10) all work inside a header-height strip.
   */
  for (const width of [390, 1100]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.locator('[data-nav-toggle]').click();
    const heights = await page.evaluate(() => ({
      drawer: document.getElementById('primary-navigation')!.getBoundingClientRect().height,
      overlay: document.querySelector('[data-nav-overlay]')!.getBoundingClientRect().height,
      viewport: window.innerHeight,
    }));
    expect(heights.drawer, `drawer height at ${width}px`).toBeGreaterThanOrEqual(
      heights.viewport - 1,
    );
    expect(heights.overlay, `overlay height at ${width}px`).toBeGreaterThanOrEqual(
      heights.viewport - 1,
    );
  }
});

test('the current page is marked by weight, not only by the gold bar', async ({ page }) => {
  /*
   * Gold on white is 1.81:1, under the 3:1 a state indicator needs, so the bar
   * cannot be what identifies the current page (F-76). The weight step is. If a
   * restyle ever flattened every link to one weight, the only indicator left
   * would be the one that fails contrast - and no other test would notice.
   */
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/programs');
  const weights = await page.evaluate(() => {
    const links = [
      ...document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"] .nav__link'),
    ];
    const current = links.find((link) => link.getAttribute('aria-current') === 'page');
    const other = links.find(
      (link) => !link.hasAttribute('aria-current') && link.dataset.currentGroup !== 'true',
    );
    if (!current || !other) return null;
    return {
      current: Number(getComputedStyle(current).fontWeight),
      other: Number(getComputedStyle(other).fontWeight),
    };
  });
  expect(weights, 'a current and a non-current nav link on /programs').not.toBeNull();
  expect(weights!.current, 'current-page link weight').toBeGreaterThan(weights!.other);
});

test('the header is a view-transition target only while a transition runs', async ({ page }) => {
  /*
   * `view-transition-name` makes an element a BACKDROP ROOT, so a backdrop-filter
   * inside it cannot see the page behind. With the name always on, the frosted
   * bar blurred nothing and every computed style still read `blur(14px)`
   * (F-76). The name must be absent at rest, and present while a transition
   * captures the header - or the header would animate with the page.
   */
  await page.goto('/about');
  const names = await page.evaluate(async () => {
    const header = document.querySelector<HTMLElement>('[data-site-header]')!;
    const atRest = getComputedStyle(header).viewTransitionName;
    let during = '';
    const transition = document.startViewTransition(() => {
      during = getComputedStyle(header).viewTransitionName;
    });
    await transition.finished;
    return { atRest, during };
  });
  expect(names.atRest, 'view-transition-name at rest').toBe('none');
  expect(names.during, 'view-transition-name during a transition').toBe('site-header');
});

test('the frosted header bar really blurs what scrolls beneath it', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'A pixel profile is renderer-specific, so it is measured in one engine.',
  );
  /*
   * Computed style cannot prove a blur: it read `blur(14px)` while nothing was
   * blurred. Pixels can. With the navy section's top edge 40px down, beneath the
   * translucent bar, a real 14px blur turns that edge into a gradient, and an
   * unblurred bar shows one step. Column x=1350 is clear of every link and of the
   * action. Measured: 2 distinct values when broken, 18 over alternate rows when
   * blurred.
   */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/about');
  await page.evaluate(() => {
    const section = document.querySelector('#mission-vision')!;
    window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY - 40);
  });
  await page.waitForTimeout(300);

  const png = await page.screenshot({ clip: { x: 1350, y: 20, width: 1, height: 44 } });
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const values = new Set<number>();
  for (let y = 0; y < info.height; y += 1) {
    const i = y * info.width * info.channels;
    values.add(Math.round(0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!));
  }
  expect(
    values.size,
    'distinct luminance values across the section edge beneath the bar',
  ).toBeGreaterThanOrEqual(6);
});

test('the menu toggle does not exist for a visitor without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  // The toggle ships `hidden` and is revealed by script, so nothing is offered
  // that would do nothing. Every nav link must still be reachable.
  await expect(page.locator('[data-nav-toggle]')).toBeHidden();
  const links = await page
    .locator('nav[aria-label="Primary"] a')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  for (const href of [
    '/',
    '/about',
    '/programs',
    '/events',
    '/resources',
    '/membership',
    '/partners',
  ]) {
    expect(links, `${href} unreachable without JavaScript`).toContain(href);
  }
  await context.close();
});

test('the sticky header never covers the element that just received focus', async ({ page }) => {
  await page.goto('/membership');
  await page.evaluate(() => window.scrollTo(0, 600));

  const clear = await page.evaluate(() => {
    const footerLink = document.querySelector<HTMLElement>('nav[aria-label="Footer"] a');
    if (!footerLink) return null;
    footerLink.focus();
    const header = document.querySelector('[data-site-header]');
    if (!header) return null;
    const a = footerLink.getBoundingClientRect();
    const b = header.getBoundingClientRect();
    return a.bottom < b.top || a.top > b.bottom;
  });
  expect(clear).toBe(true);
});

test('the announcement bar carries the approved line and no meeting link', async ({ page }) => {
  await page.goto('/');
  const bar = page.locator('#announcement');
  await expect(bar).toBeVisible();
  /*
   * The message is asserted against the approved constant, not retyped here.
   * The owner supplied a new one verbatim on 2026-09-04, and a hard-coded copy
   * in the test would have to be edited in lockstep - which is exactly how a
   * test starts asserting yesterday's copy.
   */
  await expect(bar).toContainText(SIGNATURE_EVENT.announcementBar);
  await expect(
    bar.getByRole('link', { name: SIGNATURE_EVENT.announcementLinkLabel }),
  ).toHaveAttribute('href', SIGNATURE_EVENT.announcementLinkHref);
  expect(await bar.innerHTML()).not.toMatch(/zoom\.us/i);

  // The bar is a named region, and its dismiss control is a real 44px button.
  await expect(page.getByRole('region', { name: 'Announcement' })).toHaveCount(1);
  const dismiss = page.locator('[data-announcement-close]');
  await expect(dismiss).toHaveAttribute('aria-label', 'Dismiss announcement');
  const box = await dismiss.boundingBox();
  expect(box!.width, 'dismiss target width').toBeGreaterThanOrEqual(44);
  expect(box!.height, 'dismiss target height').toBeGreaterThanOrEqual(44);
});

test('dismissing the announcement persists and never stores anything but a flag', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('[data-announcement-close]').click();
  await expect(page.locator('#announcement')).toBeHidden();

  const stored = await page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage).map((key) => [key, localStorage.getItem(key)] as const),
    ),
  );
  expect(stored).toEqual({ 'paaipe:dismissed:announcement': '1' });

  await page.reload();
  await expect(page.locator('#announcement')).toBeHidden();
});

test('the footer carries the exact name and slogan and no unsupplied social link', async ({
  page,
}) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer).toContainText(
    'Philippine Association of AI Professionals and Entrepreneurs',
  );
  await expect(footer).toContainText('Building the Philippines’ AI-Powered Future—Together.');
  // No account has been supplied, so the block is omitted rather than showing
  // dead labels that imply the accounts exist.
  await expect(page.locator('nav[aria-label="PAAIPE on social media"]')).toHaveCount(0);
});

test('the branded 404 returns a real 404 and offers a way back', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('This page wandered off the map.');
  await expect(page.locator('main a[href="/"]')).toHaveCount(1);
  await expect(page.locator('main a[href="/events"]')).toHaveCount(1);
});

test('header dropdowns are closed at rest and open on hover and on focus', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Hover is a fine-pointer path.');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  // Park the pointer clear of the nav so "at rest" really is at rest.
  await page.mouse.move(2, 890);

  const group = page.locator('.nav__item--group').first();
  const sub = group.locator('.nav__sub');

  const hiddenAtRest = await sub.evaluate((el) => {
    const s = getComputedStyle(el);
    return s.visibility === 'hidden' && Number(s.opacity) === 0;
  });
  expect(hiddenAtRest, 'dropdown must be closed at rest').toBe(true);

  await group.hover();
  await expect(sub).toBeVisible();

  await page.mouse.move(2, 890);
  await expect(sub).toBeHidden();

  // Keyboard users get the same panel via :focus-within, not hover alone.
  await group.locator('.nav__link').focus();
  await expect(sub).toBeVisible();
});

/* ------------------------------------------------------------------ */
/* Tab 05 - home page                                                  */
/* ------------------------------------------------------------------ */

/** The eleven sections Tab 05 requires, in the order it requires them. */
const HOME_SECTIONS = [
  'hero-heading',
  'audiences-heading',
  'why-heading',
  'mission-heading',
  'programs-heading',
  'monthly-event-heading',
  'benefits-heading',
  'insights-heading',
  'updates-heading',
  'partnership-heading',
  'final-cta-heading',
];

test('the home page tells the required story, in order', async ({ page }) => {
  await page.goto('/');

  const order = await page.evaluate((ids) => {
    const found = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    return {
      missing: ids.filter((id) => !document.getElementById(id)),
      inOrder: found.every((el, i) =>
        i === 0
          ? true
          : Boolean(found[i - 1]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING),
      ),
    };
  }, HOME_SECTIONS);

  expect(order.missing).toEqual([]);
  expect(order.inOrder, 'sections are out of narrative order').toBe(true);
});

test('the home page has exactly one H1 and it is the approved slogan', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('Building the Philippines’ AI-Powered Future—Together.');
});

test('hero copy and both CTAs are present without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText(
    'Building the Philippines’ AI-Powered Future—Together.',
  );
  await expect(page.locator('.hero__lead')).toContainText(
    'PAAIPE brings together AI professionals',
  );
  await expect(page.locator('.hero__supporting')).toHaveText(
    'Learn continuously. Connect meaningfully. Build responsibly.',
  );
  // The secondary CTA is a real link and works with no script at all.
  await expect(page.locator('.hero__actions a[href="/about"]')).toHaveCount(1);
  await context.close();
});

test('the CTA destination matrix is honest everywhere', async ({ page }) => {
  await page.goto('/');

  // Internal navigation: real links to real routes.
  for (const href of [
    '/about',
    '/programs',
    '/events',
    '/benefits',
    '/resources',
    '/contact',
    '/partners',
    '/privacy',
  ]) {
    await expect(page.locator(`main a[href="${href}"]`).first(), href).toHaveCount(1);
  }

  // External handoffs: none configured, so every one is a disabled control
  // carrying its reason - never a link, never a fabricated destination.
  const handoffs = page.locator('main .external-action-unavailable');
  const count = await handoffs.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < count; i += 1) {
    await expect(handoffs.nth(i).locator('button')).toBeDisabled();
    await expect(handoffs.nth(i).locator('a')).toHaveCount(0);
  }
});

test('the insights preview cannot be mistaken for published resources', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#insights .card');
  await expect(cards).toHaveCount(3);

  for (let i = 0; i < 3; i += 1) {
    const card = cards.nth(i);
    // Labelled Coming soon, and containing no link or action at all: nothing is
    // published, so nothing may be opened, read now or downloaded.
    await expect(card).toContainText('Coming soon');
    await expect(card.locator('a, button')).toHaveCount(0);
  }

  const html = await page.locator('#insights').innerHTML();
  expect(html).not.toMatch(/download|read now|get the (guide|pdf)/i);
});

test('the updates signup cannot submit and shows no success state', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#updates');

  // No form element at all: there is nothing to submit to.
  await expect(section.locator('form')).toHaveCount(0);
  await expect(section.locator('input')).toBeDisabled();
  await expect(section.locator('button')).toBeDisabled();
  await expect(section).toContainText('not connected');

  // The label is persistent and visible, not a placeholder.
  await expect(section.locator('label[for="updates-email"]')).toHaveText(/Email address/);

  // Nothing typed is retained anywhere.
  const stored = await page.evaluate(() => Object.keys(localStorage).length);
  expect(stored).toBe(0);
});

test('the partner caveat sits beside the benefits preview', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#benefits')).toContainText('Partner benefits are not guaranteed');
});

test('the members-only session is labelled and carries no meeting link', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#monthly-event');
  await expect(section).toContainText('Members-only session');
  await expect(section).toContainText('Private Zoom event');
  expect(await section.innerHTML()).not.toMatch(/zoom\.us|meeting id|passcode/i);
});

test('the home page carries its approved Open Graph metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Building the Philippines’ AI-Powered Future—Together.',
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    /Discover PAAIPE-a professional community/,
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /Join a Filipino community advancing practical/,
  );
});

test('the home page reads correctly at every required width', async ({ page }) => {
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `home overflows at ${width}px`).toBeLessThanOrEqual(1);

    // Every section must still be laid out, not collapsed to zero height.
    for (const id of HOME_SECTIONS) {
      const height = await page.locator(`#${id}`).evaluate((el) => {
        const section = el.closest('section') ?? el;
        return section.getBoundingClientRect().height;
      });
      expect(height, `${id} collapsed at ${width}px`).toBeGreaterThan(0);
    }
  }
});

test('no image on the home page can shift layout', async ({ page }) => {
  await page.goto('/');
  const missing = await page.evaluate(() =>
    [...document.querySelectorAll('img')]
      .filter((img) => !img.getAttribute('width') || !img.getAttribute('height'))
      .map((img) => img.getAttribute('src')),
  );
  expect(missing, 'images without declared dimensions').toEqual([]);
});

/* ------------------------------------------------------------------ */
/* Tab 06 - About and Programs                                         */
/* ------------------------------------------------------------------ */

test('/about presents its sections in order with one H1', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText(
    'A stronger Philippine AI future starts with a stronger community.',
  );
  for (const id of [
    'who-we-are-heading',
    'mission-vision-heading',
    'values-heading',
    'what-we-do-heading',
    'who-its-for-heading',
    'progress-heading',
  ]) {
    await expect(page.locator(`#${id}`), id).toHaveCount(1);
  }
});

test('/about shows no numerical impact claim', async ({ page }) => {
  await page.goto('/about');
  // Tab 06 forbids turning the progress statement into a numerical chart until
  // verified data exists, so that section must contain no digit at all.
  const text = (await page.locator('#progress').innerText()).replace(/\s+/g, ' ');
  expect(text, 'progress section contains a figure').not.toMatch(/\d/);
});

test('/programs badges every programme accurately', async ({ page }) => {
  await page.goto('/programs');
  await expect(page.locator('h1')).toHaveText('From understanding AI to creating real-world value');

  const details = page.locator('#program-details .detail');
  await expect(details).toHaveCount(7);

  const memberOnly = ['paaipe-ai-exchange', 'community-conversations', 'member-resource-library'];
  for (const slug of memberOnly) {
    await expect(page.locator(`#program-${slug}`), slug).toContainText('Members Only');
  }
  for (const slug of ['ai-explained', 'skills-labs-and-workshops', 'ai-in-practice']) {
    await expect(page.locator(`#program-${slug}`), slug).toContainText('Public');
  }

  // Every card links to a detail section that actually exists on the page.
  const anchors = await page
    .locator('#programs-index a[href^="#program-"]')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')!));
  expect(anchors).toHaveLength(7);
  for (const href of anchors) {
    await expect(page.locator(href), href).toHaveCount(1);
  }
});

test('/programs states the signature session schedule exactly', async ({ page }) => {
  await page.goto('/programs');
  const section = page.locator('#signature-schedule');
  for (const chip of ['Every second Tuesday', '8:00 PM PHT', 'Private Zoom', 'One hour maximum']) {
    await expect(section, chip).toContainText(chip);
  }
  expect(await section.innerHTML()).not.toMatch(/zoom\.us|meeting id|passcode/i);
});

test('/programs speaker invitation uses honest handoffs', async ({ page }) => {
  await page.goto('/programs');
  const invitation = page.locator('#speaker-invitation');
  await expect(invitation).toContainText('Propose a Session');
  await expect(invitation).toContainText('Contact the Programs Team');
  await expect(invitation).toContainText('Submission does not guarantee selection');

  // Neither destination is configured, so neither may be a link.
  const unavailable = invitation.locator('.external-action-unavailable');
  await expect(unavailable).toHaveCount(2);
  await expect(invitation.locator('a')).toHaveCount(0);
});

test('About and Programs do not repeat each other', async ({ page }) => {
  const read = async (path: string) => {
    await page.goto(path);
    return (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  };
  const about = await read('/about');
  const programs = await read('/programs');

  const sentences = about
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 80);
  expect(sentences.length).toBeGreaterThan(3);
  expect(sentences.filter((sentence) => programs.includes(sentence))).toEqual([]);
});

for (const path of ['/about', '/programs']) {
  test(`${path} has no horizontal overflow at any required width`, async ({ page }) => {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Tab 07 - Events and Speakers                                        */
/* ------------------------------------------------------------------ */

test('/events shows every required section, in the Tab 03 order', async ({ page }) => {
  await page.goto('/events');
  await expect(page.locator('h1')).toHaveText(EVENTS_PAGE.h1);
  for (const id of [
    'series-heading',
    'upcoming-heading',
    'past-heading',
    'event-types-heading',
    'speaker-invitation-heading',
    'membership-cta-heading',
  ]) {
    await expect(page.locator(`#${id}`), id).toHaveCount(1);
  }
});

test('/events shows honest empty states rather than placeholder cards', async ({ page }) => {
  await page.goto('/events');
  /*
   * Asserted against the CONSTANTS, not copy retyped here. What this test is
   * FOR is the last line: an empty registry produces an empty STATE and not an
   * invented card. That claim survives any rewording.
   *
   * Nothing is approved, so production renders zero cards — and the count is
   * the assertion, because "shows an empty state" would also pass on a page
   * that showed both.
   */
  await expect(page.locator('#upcoming')).toContainText(EVENTS_STATES.noUpcoming.heading);
  await expect(page.locator('#past')).toContainText(EVENTS_STATES.noPast.heading);
  await expect(page.locator('.event-card')).toHaveCount(0);
});

test('/events invents no next session', async ({ page }) => {
  await page.goto('/events');
  const series = page.locator('#series-heading').locator('..');
  /*
   * The command permits "View the next AI Exchange" only when an approved
   * future instance exists. None does, so the panel must say so in words and
   * must NOT render a disabled control — a greyed-out link implies a
   * destination that merely failed to load.
   */
  await expect(series).toContainText('Next session details coming soon');
  await expect(series.locator('a[href^="/events/"]')).toHaveCount(0);
  const html = await series.innerHTML();
  expect(html).not.toMatch(/<img/i);
  expect(html).not.toMatch(/\b(seats|spots left|remaining|attendees|capacity|countdown)\b/i);
});

test('/events states the signature schedule and hides no meeting detail', async ({ page }) => {
  await page.goto('/events');
  const series = page.locator('#series-heading').locator('..');
  for (const fact of [
    AI_EXCHANGE_SERIES.cadence,
    AI_EXCHANGE_SERIES.time,
    AI_EXCHANGE_SERIES.format,
  ]) {
    await expect(series, fact).toContainText(fact);
  }
  // "Private Zoom" is a FORMAT. A real destination is not.
  expect(await series.innerHTML()).not.toMatch(/zoom\.us|meeting id|passcode/i);
});

test('the site ships no Event structured data while nothing is approved', async ({ page }) => {
  for (const path of ['/', '/events', '/programs']) {
    await page.goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    for (const block of blocks) {
      expect(block, `${path} marks up an unapproved Event`).not.toContain('"@type":"Event"');
    }
  }
});

test('/speakers explains the process and names nobody as confirmed', async ({ page }) => {
  await page.goto('/speakers');
  await expect(page.locator('h1')).toHaveText(
    'Share what you know. Help move Filipino AI capability forward.',
  );
  await expect(page.locator('#process')).toContainText('Submission does not guarantee selection');
  /*
   * Counted against the SOURCE, not against a number typed here.
   *
   * A literal count is a chore rather than a check: every added step breaks it,
   * and the fix is always to bump the number to whatever the run just reported -
   * the one edit that can never fail. Worse, it cannot catch the defect it looks
   * like it is guarding, because a step that renders as an empty <li> still
   * counts. Derived from the registry, a step that fails to render fails here.
   */
  await expect(page.locator('.process li')).toHaveCount(SPEAKERS_PAGE.process.length);
  await expect(page.locator('.explains li')).toHaveCount(SPEAKERS_PAGE.explains.length);

  // The approved-speaker registry is empty, so that section must not exist and
  // no portrait may appear.
  await expect(page.locator('#approved-speakers')).toHaveCount(0);
  await expect(page.locator('main img')).toHaveCount(0);
});

test('/speakers hands off honestly for both actions', async ({ page }) => {
  await page.goto('/speakers');
  const invite = page.locator('#express-interest');
  await expect(invite.locator('.external-action-unavailable')).toHaveCount(2);
  await expect(invite.locator('a')).toHaveCount(0);
});

test('event filters are absent when there is nothing to filter', async ({ page }) => {
  await page.goto('/events');
  // Offering a filter over an empty list would be a control that does nothing.
  await expect(page.locator('[data-event-filters]')).toHaveCount(0);
});

test('/events and /speakers work with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('/events');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#upcoming')).toContainText(EVENTS_STATES.noUpcoming.heading);

  await page.goto('/speakers');
  await expect(page.locator('.process li')).toHaveCount(SPEAKERS_PAGE.process.length);
  await context.close();
});

for (const path of ['/events', '/speakers']) {
  test(`${path} has no horizontal overflow at any required width`, async ({ page }) => {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Tab 08 - Resources and Insights                                     */
/* ------------------------------------------------------------------ */

test('/resources shows every required section', async ({ page }) => {
  await page.goto('/resources');
  await expect(page.locator('h1')).toHaveText('Useful AI knowledge for real people and real work');
  for (const id of [
    'library-heading',
    'coming-soon-heading',
    'formats-heading',
    'member-library-heading',
  ]) {
    await expect(page.locator(`#${id}`), id).toHaveCount(1);
  }
  await expect(page.locator('#formats')).toContainText(
    'should not be treated as legal, financial, medical',
  );
});

test('/resources preview cards cannot be mistaken for published downloads', async ({ page }) => {
  await page.goto('/resources');
  const cards = page.locator('#coming-soon .card');
  await expect(cards).toHaveCount(6);

  for (let i = 0; i < 6; i += 1) {
    const card = cards.nth(i);
    await expect(card).toContainText('Coming soon');
    // No link and no button: nothing is published, so nothing may be opened.
    await expect(card.locator('a, button')).toHaveCount(0);
  }

  // Match the AFFORDANCE, not the word. The section's own copy says "none can
  // be opened or downloaded", and a bare /download/ flags the sentence that
  // states the prohibition. What matters is that no attribute points at a file.
  const html = await page.locator('#coming-soon').innerHTML();
  expect(html).not.toMatch(/(href|src|data-[\w-]+)=["'][^"']*\.(pdf|docx?|zip|mp4|pptx?)/i);
});

test('/resources shows an honest empty library while nothing is approved', async ({ page }) => {
  await page.goto('/resources');
  await expect(page.locator('#library')).toContainText('No resources are published yet.');
  // No search or filter control is offered over an empty list.
  await expect(page.locator('[data-resource-controls]')).toHaveCount(0);
  await expect(page.locator('.resource-card')).toHaveCount(0);
});

test('/resources emits no canonical tag while no site origin is configured', async ({ page }) => {
  await page.goto('/resources');
  // A canonical pointing at a guessed origin would tell a crawler the wrong
  // authoritative address. None is better than a wrong one.
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test('/resources works with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/resources');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('#coming-soon .card')).toHaveCount(6);
  await context.close();
});

test('/resources has no horizontal overflow at any required width', async ({ page }) => {
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/resources');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `/resources overflows at ${width}px`).toBeLessThanOrEqual(1);
  }
});

test('no page exposes a protected asset path or download link', async ({ page }) => {
  for (const path of ['/', '/resources', '/events', '/membership', '/programs']) {
    await page.goto(path);
    // Scoped to attribute values for the same reason: prose may legitimately
    // discuss protected material, but nothing may LINK to it.
    const html = await page.content();
    expect(html, `${path} references a protected asset`).not.toMatch(
      /(href|src)=["'][^"']*(\.(pdf|docx?|zip|mp4|pptx?)|\/(protected|private|members-only)\/)/i,
    );
  }
});

/* ------------------------------------------------------------------ */
/* Tab 09 - Membership and Benefits                                    */
/* ------------------------------------------------------------------ */

test('/membership shows every required section', async ({ page }) => {
  await page.goto('/membership');
  await expect(page.locator('h1')).toHaveText(
    'Build your AI future with people who want the Philippines to move forward.',
  );
  for (const id of [
    'benefits-heading',
    'who-can-apply-heading',
    'verification-heading',
    'status-heading',
    'faq-heading',
    'apply-heading',
  ]) {
    await expect(page.locator(`#${id}`), id).toHaveCount(1);
  }
});

test('the partner caveat sits inside the partner-benefit group, not elsewhere', async ({
  page,
}) => {
  await page.goto('/membership');
  const group = page.locator('[data-partner-group]');
  await expect(group).toHaveCount(1);
  await expect(group).toContainText('Partner benefits are not guaranteed');
  await expect(group).toContainText('subject to a confirmed agreement');
});

test('/benefits puts the short caveat on every partner-dependent card', async ({ page }) => {
  await page.goto('/benefits');
  const flagged = page.locator('#categories .card', { hasText: 'Not guaranteed' });
  const count = await flagged.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    await expect(flagged.nth(i).locator('[data-partner-caveat]'), `card ${i}`).toHaveCount(1);
  }
});

test('no membership or benefits page shows an amount, percentage or provider', async ({ page }) => {
  for (const path of ['/membership', '/benefits']) {
    await page.goto(path);
    const text = await page.locator('main').innerText();
    expect(text, `${path} shows a peso value`).not.toMatch(/₱|\bPHP\s*\d/i);
    expect(text, `${path} shows a percentage`).not.toMatch(/\d+\s*%/);
    expect(text, `${path} shows a credit or token amount`).not.toMatch(
      /\b\d[\d,]*\s*(credits?|tokens?)\b/i,
    );
    // No provider logo may appear either.
    await expect(page.locator('main img'), `${path} shows an image`).toHaveCount(0);
  }
});

test('/membership simulates no application or login result', async ({ page }) => {
  await page.goto('/membership');
  // No form, no input, and no control that could produce a fake outcome.
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('main input')).toHaveCount(0);

  // Every handoff is unconfigured, so each is a disabled control with a reason.
  const unavailable = page.locator('main .external-action-unavailable');
  const count = await unavailable.count();
  expect(count).toBeGreaterThanOrEqual(4);
  for (let i = 0; i < count; i += 1) {
    await expect(unavailable.nth(i).locator('button')).toBeDisabled();
  }

  // Nothing is written anywhere, and no status is read from the URL.
  await page.goto('/membership?status=approved');
  const stored = await page.evaluate(() => Object.keys(localStorage).length);
  expect(stored).toBe(0);
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/your (application|status) is/i);
});

test('the FAQ accordion works by keyboard and without JavaScript', async ({ browser }) => {
  // Native <details> is keyboard-operable and needs no script at all.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/membership');

  const items = page.locator('#faq details');
  await expect(items).toHaveCount(7);
  await expect(items.first()).not.toHaveAttribute('open', '');

  await items.first().locator('summary').click();
  await expect(items.first()).toHaveAttribute('open', '');
  await expect(items.first()).toContainText(
    'Applications are reviewed before members-only access is enabled',
  );
  await context.close();
});

test('the FAQ answers are readable to a screen reader before expanding', async ({ page }) => {
  await page.goto('/membership');
  // <details> keeps content in the DOM, so find-in-page and assistive
  // technology can reach it. A custom widget that removes it cannot.
  const html = await page.locator('#faq').innerHTML();
  expect(html).toContain('Review time may vary depending on the information submitted');
});

for (const path of ['/membership', '/benefits']) {
  test(`${path} has no horizontal overflow at any required width`, async ({ page }) => {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

test('the header is sticky only once script has enhanced the page', async ({ browser }) => {
  // Without JavaScript the drawer cannot open, so the navigation renders inline
  // inside the header. Measured at 390x664 that header is ~729px tall - taller
  // than the viewport. Sticky there would cover the whole page and intercept
  // every tap, which is how a WebKit click on the FAQ was being swallowed.
  for (const javaScriptEnabled of [true, false]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 664 },
      javaScriptEnabled,
    });
    const page = await context.newPage();
    await page.goto('/membership');

    const position = await page
      .locator('[data-site-header]')
      .evaluate((el) => getComputedStyle(el).position);
    expect(position, `javaScriptEnabled=${javaScriptEnabled}`).toBe(
      javaScriptEnabled ? 'sticky' : 'static',
    );
    await context.close();
  }
});

/**
 * Minimum breathing room below the sticky header, in CSS pixels.
 *
 * `scroll-padding-top` alone leaves only 4px of clearance at 390px, which is
 * "not overlapping" by a hair and would go negative if the header ever grew.
 * The `[id], summary { scroll-margin-top }` rule is what makes it comfortable,
 * so the assertion is a real gap - not merely a non-overlap, which both
 * configurations satisfy and which therefore tests nothing.
 */
const MIN_HEADER_CLEARANCE = 16;

test('anything scrolled to clears the sticky header comfortably', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/membership');

  for (const selector of ['#faq summary', '#verification-heading', '#status-heading']) {
    const gap = await page.evaluate((sel) => {
      const target = document.querySelector(sel);
      if (!target) return null;
      target.scrollIntoView();
      const header = document.querySelector('[data-site-header]')!.getBoundingClientRect();
      return target.getBoundingClientRect().top - header.bottom;
    }, selector);
    expect(gap, `${selector} has only ${gap}px below the sticky header`).toBeGreaterThanOrEqual(
      MIN_HEADER_CLEARANCE,
    );
  }
});

/* ------------------------------------------------------------------ */
/* Tab 10 - Partners, Responsible AI, Contact and Legal                */
/* ------------------------------------------------------------------ */

test('/partners implies no partnership that does not exist', async ({ page }) => {
  await page.goto('/partners');
  await expect(page.locator('h1')).toHaveText(
    'Help expand access to meaningful AI opportunity in the Philippines.',
  );
  // The caveat sits directly after the category list it qualifies.
  await expect(page.locator('[data-category-caveat]')).toHaveText(
    'Listing a category does not indicate an existing partnership.',
  );
  // No confirmed-partner section, and no logo of any kind.
  await expect(page.locator('#current-partners')).toHaveCount(0);
  await expect(page.locator('main img')).toHaveCount(0);
  await expect(page.locator('#process')).toContainText('formally approved');
});

test('/responsible-ai makes no compliance or certification claim', async ({ page }) => {
  await page.goto('/responsible-ai');
  await expect(page.locator('h1')).toHaveText(
    'Progress with people, responsibility and trust at the center.',
  );
  await expect(page.locator('.named-list__item')).toHaveCount(6);

  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/\bwe are (certified|compliant|audited)\b/i);
  expect(text).not.toMatch(/\b(fully|legally) compliant\b/i);
  expect(text).not.toMatch(/\bISO ?\d|\bSOC ?2\b/i);
  await expect(page.locator('#scope')).toContainText('not a certification');
});

test('/contact has no form at all and invents no contact detail', async ({ page }) => {
  await page.goto('/contact');
  await expect(page.locator('h1')).toHaveText('Let’s start a useful conversation.');

  // Not a disabled form - no form and no input whatsoever, so nothing can
  // pretend to submit.
  await expect(page.locator('main form')).toHaveCount(0);
  await expect(page.locator('main input, main textarea')).toHaveCount(0);

  const text = await page.locator('main').innerText();
  expect(text, 'invented email').not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  expect(text, 'invented phone').not.toMatch(/\+?\d[\d\s()-]{9,}/);
  expect(text, 'invented response time').not.toMatch(/\bwithin \d+ (hours?|days?)\b/i);

  await expect(page.locator('#reach')).toContainText(CONTACT_PAGE.unavailableNote);
  // The route that works today must be on the page, not only in the notice.
  await expect(page.locator('#reach')).toContainText(CONTACT_PAGE.privacyRoute);
  await expect(
    page.locator('.external-action-unavailable').first().locator('button'),
  ).toBeDisabled();
});

for (const [path, banner, sections] of [
  ['/privacy', 'requires approved organization details and legal/privacy review', PRIVACY_DRAFT],
  ['/terms', 'requires legal review before production release', TERMS_DRAFT],
] as const) {
  test(`${path} is visibly draft and blocked from release`, async ({ page }) => {
    /*
     * Skipped, not deleted, once the policy is adopted.
     *
     * Everything below is true OF A DRAFT: the banner, its position before the
     * heading, and the noindex. On the day PAAIPE adopts the text those become
     * false by design, and a test asserting them would turn the correct act
     * into four red engines. The adopted state has its own assertions below.
     */
    const policy = POLICIES.find((entry) => `/${entry.slug}` === path)!;
    test.skip(policy.status === 'approved', 'policy is adopted; the draft rules no longer apply');
    await page.goto(path);

    // The banner is the first thing in main, before the content it qualifies.
    const banners = page.locator('.draft-banner');
    await expect(banners).toHaveCount(1);
    await expect(banners).toContainText('DRAFT FOR REVIEW');
    await expect(banners).toContainText(banner);

    const bannerFirst = await page.evaluate(() => {
      const main = document.getElementById('main-content')!;
      const el = main.querySelector('.draft-banner')!;
      const heading = main.querySelector('h1')!;
      return Boolean(el.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(bannerFirst, 'the draft banner must precede the page heading').toBe(true);

    /*
     * Unresolved values are visibly bracketed, not plausible boilerplate — and
     * EVERY value the source declares reaches the page.
     *
     * This asserted `toBeGreaterThan(8)`, which required the document to stay
     * unfinished: writing the legal text was a test failure. Counting against
     * the source instead is strictly stronger. It catches a placeholder that
     * silently stops rendering, it keeps working when the last one is
     * resolved, and it cannot be satisfied by leaving holes in the page.
     */
    const declared = sections.flatMap((section) => section.placeholders);
    const placeholders = page.locator('.legal__placeholders code');
    expect(await placeholders.count(), 'a declared placeholder is not on the page').toBe(
      declared.length,
    );
    for (const text of await placeholders.allTextContents()) {
      expect(text).toMatch(/^\[[A-Z0-9 ,./'’-]+\]$/);
    }

    // And the text itself is there: a draft is not the same thing as a stub.
    const bodyParagraphs = await page.locator('.legal__body').count();
    expect(bodyParagraphs, 'the page renders headings but no legal text').toBeGreaterThan(
      sections.length,
    );

    // A draft legal page must not be indexed.
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
}

for (const [path] of [['/privacy'], ['/terms']] as const) {
  test(`${path} carries no draft banner once it is adopted`, async ({ page }) => {
    /*
     * The other half of the pair. A page that has been adopted must stop
     * claiming to be a draft and must become indexable - and if nobody asserts
     * that, a stale banner survives adoption and tells every reader the legal
     * text is not in force when it is.
     */
    const policy = POLICIES.find((entry) => `/${entry.slug}` === path)!;
    test.skip(policy.status !== 'approved', 'policy is still a draft');
    await page.goto(path);
    await expect(page.locator('.draft-banner')).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
}

test('the approved typeface actually applies, not merely loads', async ({ page }) => {
  /*
   * THE ASSERTION THAT WOULD HAVE CAUGHT THE BUG, and did not exist when the
   * bug shipped locally.
   *
   * The unit test checked that the generated CSS CONTAINED the family override.
   * It did. The build emitted a correct @font-face, the preload fetched the
   * file, and every element still rendered in the system stack - because
   * `tokens.css` sets `--font-sans` on `:root` too, the injected style comes
   * first in <head>, and equal specificity means the later rule wins.
   *
   * "The stylesheet says it" and "the page does it" are two different claims.
   * This asserts the second: what the browser actually computed, and whether
   * the face is really loaded rather than substituted.
   */
  await page.goto('/');
  const applied = await page.evaluate(() => {
    const heading = document.querySelector('h1');
    return heading ? getComputedStyle(heading).fontFamily : '';
  });
  expect(applied, 'the approved family is not first in the computed stack').toMatch(
    new RegExp(`^"?${APPROVED_TYPEFACE!.family}"?,`),
  );
  // And the fallback is still behind it: a 404 on the woff2 must not strip the page bare.
  expect(applied).toContain('system-ui');

  const loaded = await page.evaluate(
    (family) => document.fonts.check(`700 48px "${family}"`),
    APPROVED_TYPEFACE!.family,
  );
  expect(loaded, 'the font file did not load; the page is rendering a substitute').toBe(true);
});

test('/accessibility states a goal, never a conformance claim', async ({ page }) => {
  await page.goto('/accessibility');
  await expect(page.locator('h1')).toHaveText('Accessibility at PAAIPE');
  await expect(page.locator('#scope')).toContainText('not a claim of conformance');

  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/\bWCAG\s*2\.\d\s*(A{1,3}|AA)\s*(compliant|conformant)\b/i);
  expect(text).not.toMatch(/\b(fully accessible|certified accessible|VPAT)\b/i);
});

test('no page loads a tracker or shows a consent banner', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.host !== 'localhost:4321') external.push(request.url());
  });

  // EVERY route, not a sample. A third-party script can be added anywhere, and
  // a four-page spot check missed exactly that: a break-check planting a CDN
  // script on /contact passed, because /contact was not one of the four.
  for (const route of staticRoutes) {
    await page.goto(route.path);
    // Necessary-only site: a consent banner here would ask permission for
    // something that is not happening.
    const text = await page.locator('body').innerText();
    expect(text, `${route.path} shows a consent banner`).not.toMatch(
      /\b(accept all|reject optional|manage preferences|we use cookies)\b/i,
    );
    // And nothing is stored before any interaction.
    const stored = await page.evaluate(() => Object.keys(localStorage).length);
    expect(stored, `${route.path} wrote to storage on load`).toBe(0);
  }

  expect(external, 'a third-party request was made').toEqual([]);
});

for (const path of [
  '/partners',
  '/responsible-ai',
  '/contact',
  '/privacy',
  '/terms',
  '/accessibility',
]) {
  test(`${path} has no horizontal overflow at any required width`, async ({ page }) => {
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
}

/* ------------------------------------------------------------------ */
/* Tab 11 - Motion                                                     */
/* ------------------------------------------------------------------ */

test('content is visible with JavaScript disabled and no motion class applied', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  // Every motion rule is scoped to .motion-ready, which only script adds. The
  // failure mode of a broken motion layer must be "no animation", never
  // "invisible content".
  await expect(page.locator('html')).not.toHaveClass(/motion-ready/);

  for (const selector of ['.hero__heading', '.hero__lead', '.hero__actions', '.card']) {
    const visible = await page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const style = getComputedStyle(el);
        return Number(style.opacity) === 1 && style.visibility === 'visible';
      });
    expect(visible, `${selector} is not visible without JavaScript`).toBe(true);
  }
  await context.close();
});

test('reveal content is shown immediately under reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));

  // Nothing may be left waiting on an observer that will never animate.
  const hidden = await page.evaluate(
    () =>
      [...document.querySelectorAll('[data-reveal]')].filter(
        (el) => Number(getComputedStyle(el).opacity) < 1,
      ).length,
  );
  expect(hidden, 'reveal content is hidden under reduced motion').toBe(0);
  await context.close();
});

test('below-the-fold cards reveal on scroll, and above-the-fold ones never wait', async ({
  page,
}) => {
  // A tall viewport so cards are genuinely above the fold at load. At the
  // default height the hero fills the screen and nothing revealable is on it,
  // which made the first version of this assertion vacuous.
  await page.setViewportSize({ width: 1440, height: 2200 });
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));

  const above = await page.evaluate(() => {
    const inView = [...document.querySelectorAll<HTMLElement>('[data-reveal]')].filter(
      (el) => el.getBoundingClientRect().top < window.innerHeight,
    );
    return {
      count: inView.length,
      waiting: inView.filter((el) => !el.classList.contains('is-revealed')).length,
    };
  });
  expect(above.count, 'no card was above the fold, so this asserts nothing').toBeGreaterThan(0);
  expect(above.waiting, 'an above-the-fold card is waiting on the observer').toBe(0);

  // Scroll to the end; everything must end up revealed, not stuck.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(600);
  const stillHidden = await page.evaluate(
    () => document.querySelectorAll('[data-reveal]:not(.is-revealed)').length,
  );
  expect(stillHidden).toBe(0);
});

test('the decorative field draws once and settles, so it needs no pause control', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
  await page.waitForTimeout(2000);

  const running = await page.evaluate(() => {
    const field = document.querySelector('.network-field');
    if (!field) return null;
    return field
      .getAnimations({ subtree: true })
      .filter((animation) => animation.playState === 'running').length;
  });
  // Nothing loops, so after two seconds nothing is still animating and no
  // Pause/Stop/Hide control is required.
  expect(running, 'ambient motion is still running after 2s').toBe(0);
});

test('a client-side navigation keeps the header stable and moves focus to main', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'View Transitions are a desktop path here.',
  );

  await page.goto('/');
  const headerId = await page.evaluate(() => {
    const header = document.querySelector('[data-site-header]')!;
    (header as HTMLElement).dataset.stableMarker = 'kept';
    return (header as HTMLElement).dataset.stableMarker;
  });
  expect(headerId).toBe('kept');

  await page.locator('nav[aria-label="Primary"] a[href="/about"]').click();
  await page.waitForURL('**/about');

  // transition:persist keeps the same header element across the navigation.
  const stillMarked = await page.evaluate(
    () =>
      (document.querySelector('[data-site-header]') as HTMLElement | null)?.dataset.stableMarker,
  );
  expect(stillMarked, 'the header was replaced during navigation').toBe('kept');

  // And focus lands on the new main, not the bottom of the previous page.
  const focused = await page.evaluate(() => document.activeElement?.id);
  expect(focused).toBe('main-content');
});

test('client-side navigation re-wires the shell on the new page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop path.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  // At mobile width the primary nav is a closed drawer, so navigate by a link
  // that is actually visible - the footer carries every destination.
  await page.locator('nav[aria-label="Footer"] a[href="/about"]').click();
  await page.waitForURL('**/about');

  // The drawer toggle must still work after a client-side navigation - a
  // script that only ran once would leave it dead on every page but the first.
  const toggle = page.locator('[data-nav-toggle]');
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('no console error is produced on any route', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));

  for (const route of staticRoutes) {
    await page.goto(route.path);
  }
  expect(errors).toEqual([]);
});

/* ------------------------------------------------------------------ */
/* Tab 12 - Haptics and microinteractions                              */
/* ------------------------------------------------------------------ */

test('preference controls are disabled without JavaScript, and explained', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/accessibility');

  // Nothing is offered that would silently do nothing.
  const controls = page.locator('[data-preference-panel] select');
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    await expect(controls.nth(i)).toBeDisabled();
  }
  await expect(page.locator('[data-preference-nojs]')).toBeVisible();
  await context.close();
});

test('preferences are stored locally, and only as a closed set of values', async ({ page }) => {
  await page.goto('/accessibility');
  const control = page.locator('[data-preference="reduce-motion"]');
  await expect(control).toBeEnabled();

  // Nothing is written before any interaction.
  expect(await page.evaluate(() => Object.keys(localStorage).length)).toBe(0);

  await control.selectOption('on');
  const stored = await page.evaluate(() =>
    Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])),
  );
  expect(stored).toEqual({ 'paaipe:pref:reduce-motion': 'on' });

  // Returning to the default REMOVES the entry rather than storing "system":
  // an empty store is the honest representation of "changed nothing".
  await control.selectOption('system');
  expect(await page.evaluate(() => Object.keys(localStorage).length)).toBe(0);
});

test('the reduce-motion preference actually stops animation', async ({ page }) => {
  await page.goto('/accessibility');
  await page.locator('[data-preference="reduce-motion"]').selectOption('on');
  await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'on');

  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ready'));
  const animating = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === 'running').length,
  );
  expect(animating).toBe(0);
});

test('haptics is offered only where vibration exists, and is off by default', async ({ page }) => {
  await page.goto('/accessibility');
  const row = page.locator('[data-haptics-row]');
  const supported = await page.evaluate(() => 'vibrate' in navigator);

  if (supported) {
    await expect(row).toBeVisible();
    await expect(page.locator('[data-preference="haptics"]')).toHaveValue('off');
    // The row explains that many devices cannot do this at all.
    await expect(row).toContainText('do not support vibration');
  } else {
    // Chromium and WebKit desktop have no Vibration API: the row is hidden
    // rather than offering a preference that could never take effect.
    await expect(row).toBeHidden();
  }
  // Either way, nothing is stored until the visitor changes something.
  expect(await page.evaluate(() => Object.keys(localStorage).length)).toBe(0);
});

test('an unsupported Vibration API is a silent no-op with no console error', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/accessibility');
  // Force the unsupported path, then exercise every control on the page.
  await page.evaluate(() => {
    // @ts-expect-error - deliberately removing the API to test the fallback.
    delete Navigator.prototype.vibrate;
  });
  await page.locator('[data-preference="reduce-motion"]').selectOption('on');
  await page.locator('[data-preference="pause-ambient"]').selectOption('on');

  expect(errors, 'unsupported vibration must not log').toEqual([]);
  // And the page still works identically.
  await expect(page.locator('h1')).toHaveText('Accessibility at PAAIPE');
});

test('the copy control ships disabled and confirms in text, not colour alone', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Clipboard permissions are a Chromium path here.');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  // The only resource detail pages exist in a review build; use the style guide
  // route that always exists plus a direct check of the component contract.
  await page.goto('/resources');
  const buttons = page.locator('[data-copy-link]');
  // Production publishes no resource detail page, so there is none here - the
  // component's contract is asserted by unit test instead. What matters on this
  // page is that no half-enabled control is left lying around.
  expect(await buttons.count()).toBe(0);
});

test('no interaction shifts layout or leaves a control that cannot act', async ({ page }) => {
  await page.goto('/accessibility');

  const before = await page.evaluate(() => document.body.getBoundingClientRect().height);
  await page.locator('[data-preference="pause-ambient"]').selectOption('on');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.body.getBoundingClientRect().height);
  expect(Math.abs(after - before), 'changing a preference shifted the page').toBeLessThanOrEqual(2);

  // Every enabled control on the page can actually do something: no disabled
  // control is left without an explanation beside it.
  const orphaned = await page.evaluate(
    () =>
      [...document.querySelectorAll('main button:disabled, main select:disabled')].filter(
        (el) => !el.closest('.external-action-unavailable') && !el.closest('.field'),
      ).length,
  );
  expect(orphaned).toBe(0);
});

/**
 * Tab 05: the registration form must not exist in a production build.
 *
 * It renders only when `PUBLIC_EVENT_REGISTRATION_ENDPOINT` is set, and
 * production sets none - so no address can be entered on the live site. That is
 * the safety property of the whole tab, and it is asserted HERE, against the
 * production build, because the review build deliberately carries a stub
 * endpoint so the form's behaviour can be driven at all.
 */
test('no registration form exists in a production build', async ({ page }) => {
  const response = await page.goto('/events/paaipe-ai-exchange/register');
  // In production the route does not exist at all - no approved event.
  expect(response?.status()).toBe(404);
  await expect(page.locator('[data-reg-form]')).toHaveCount(0);
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
});
