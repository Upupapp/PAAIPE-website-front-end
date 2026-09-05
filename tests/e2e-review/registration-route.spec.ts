/**
 * The canonical registration route, reserved by Events Continuation Tab 01.
 *
 * It exists only in review content mode, for the same reason the detail screens
 * do: nothing is approved, so production generates no page and asserts a 404.
 * That 404 is the correct production behaviour and is covered in the production
 * suite; what is covered HERE is the shell itself, which no browser would
 * otherwise load.
 */
import { expect, test } from '@playwright/test';
import { REGISTRATION_UNAVAILABLE_MESSAGE } from '../../src/config/event-config';
import { DRAFT_ALLOW_LIST } from '../../src/config/content-mode';
import { EVENTS } from '../../src/content/events';
import { publishable } from '../../src/lib/content-visibility';

const events = publishable(EVENTS, 'review', DRAFT_ALLOW_LIST);

test('review mode publishes an event to register for', () => {
  // A loop over nothing passes in the same green as a loop over everything.
  expect(events.length).toBeGreaterThan(0);
});

for (const event of events) {
  const path = `/events/${event.slug}/register`;

  test(`${path} direct-loads with one H1`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Register');
  });

  test(`${path} is noindex, follow`, async ({ page }) => {
    /*
     * The route map requires it: a registration page is a step in a journey,
     * not a destination a search result should land on. `follow`, because its
     * links back to the event are real.
     */
    await page.goto(path);
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
    await expect(robots).toHaveAttribute('content', /follow/);
  });

  test(`${path} states the service is not connected, in the required words`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toContainText(REGISTRATION_UNAVAILABLE_MESSAGE);
  });

  test(`${path} offers NO control that cannot work`, async ({ page }) => {
    /*
     * Tab 01 reserves the route; Tab 05 builds the form. Until then there must
     * be no email field and no submit control - a control that cannot submit
     * invites an action the site cannot complete, which is worse than none.
     * Every link on the page must go somewhere real: no `#`, no empty href.
     */
    await page.goto(path);
    await expect(page.locator('input[type="email"], input[name="email"]')).toHaveCount(0);
    await expect(page.locator('button[type="submit"], form')).toHaveCount(0);

    const deadLinks = await page.$$eval('main a', (nodes) =>
      nodes
        .map((node) => node.getAttribute('href') ?? '')
        .filter((href) => href === '' || href === '#'),
    );
    expect(deadLinks).toEqual([]);
  });

  test(`${path} leads back to the event it belongs to`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`main a[href="/events/${event.slug}"]`).first()).toBeVisible();
  });
}
