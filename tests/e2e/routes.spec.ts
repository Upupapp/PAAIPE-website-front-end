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

  const unavailable = page.locator('.external-action-unavailable');
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
