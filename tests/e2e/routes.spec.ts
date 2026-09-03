import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PUBLIC_ROUTES } from '../../src/config/routes';

/** Static routes only; dynamic templates are covered separately. */
const staticRoutes = PUBLIC_ROUTES.filter((route) => !route.dynamic && route.path !== '/404');

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
    '/events/members-ai-exchange',
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

test('the internal style guide renders every primitive and is noindex', async ({ page }) => {
  const response = await page.goto('/internal/style-guide');
  expect(response?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');

  // The contrast tables are the Tab 02 evidence: they must actually render, and
  // every measured row must say PASS.
  const results = await page
    .locator('table')
    .first()
    .locator('tbody tr td:last-child')
    .allTextContents();
  expect(results.length).toBeGreaterThan(20);
  expect(results.every((cell) => cell.trim() === 'PASS')).toBe(true);
});

test('the logo is delivered unmodified - no filter, transform or blend mode', async ({ page }) => {
  await page.goto('/internal/style-guide');
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
  await page.goto('/internal/style-guide');
  const field = page.locator('.network-field');
  await expect(field).toHaveAttribute('aria-hidden', 'true');
  const focusable = await field.locator('[tabindex]:not([tabindex="-1"]), a, button').count();
  expect(focusable).toBe(0);
});

test('every external handoff renders an honest unavailable state, never a dead link', async ({
  page,
}) => {
  await page.goto('/internal/style-guide');

  // Scoped to main: the header and footer contribute handoffs of their own.
  const unavailable = page.locator('main .external-action-unavailable');
  // All six handoffs are unconfigured, so all six must be in this state.
  await expect(unavailable).toHaveCount(6);

  for (let i = 0; i < 6; i += 1) {
    const block = unavailable.nth(i);
    // A disabled button, not a link: there is nowhere to go.
    await expect(block.locator('button')).toBeDisabled();
    await expect(block.locator('a')).toHaveCount(0);
    // And the reason is visible text, not a tooltip.
    await expect(block.locator('.external-action-unavailable__reason')).not.toBeEmpty();
  }
});

test('no page ships a dead, empty or javascript: href', async ({ page }) => {
  for (const path of ['/', '/events', '/resources', '/membership', '/internal/style-guide']) {
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
  for (const [path, label] of [
    ['/about', 'About'],
    ['/programs', 'Programs'],
    ['/membership', 'Membership'],
  ] as const) {
    await page.goto(path);
    const current = page.locator('nav[aria-label="Primary"] a[aria-current="page"]');
    await expect(current, path).toHaveCount(1);
    await expect(current).toHaveText(label);
    // Ambiguity guard: nothing else on the page may also claim to be current.
    await expect(page.locator('a[aria-current="page"]'), path).toHaveCount(1);
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

test('the mobile drawer opens, traps focus, closes on Escape and restores focus', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Keyboard traversal is verified on the desktop project.',
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const toggle = page.locator('[data-nav-toggle]');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  // Focus moved into the drawer.
  const inDrawer = await page.evaluate(
    () => document.getElementById('primary-navigation')?.contains(document.activeElement) ?? false,
  );
  expect(inDrawer).toBe(true);

  // Tabbing repeatedly must never escape the open drawer.
  for (let i = 0; i < 30; i += 1) {
    await page.keyboard.press('Tab');
    const stillInside = await page.evaluate(
      () =>
        document.getElementById('primary-navigation')?.contains(document.activeElement) ?? false,
    );
    expect(stillInside, `focus escaped the drawer after ${i + 1} tabs`).toBe(true);
  }

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('the drawer also closes on an overlay click', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.locator('[data-nav-toggle]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.locator('[data-nav-overlay]').click({ position: { x: 10, y: 10 } });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
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
  await expect(bar).toContainText("Members' AI Exchange - every second Tuesday at 8:00 PM PHT.");
  expect(await bar.innerHTML()).not.toMatch(/zoom\.us/i);
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
