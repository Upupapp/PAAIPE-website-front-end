/**
 * Tab 04 - what the event detail page must be true of in a browser.
 *
 * These are the claims a unit test cannot make: what is VISIBLE, what survives
 * with JavaScript disabled, and whether a control that looks actionable is.
 *
 * The screen list comes from the same registry the route generates from, for
 * the reason recorded in `detail-screens.spec.ts`: the previous list was built
 * from a registry the page had stopped reading, so it asserted one page of nine
 * and reported green.
 */
import { expect, test } from '@playwright/test';
import { EVENT_RECORDS } from '../../src/content/event-records';
import { EVENT_SAMPLES } from '../../src/content/event-samples';
import { isPublishableEvent } from '../../src/lib/event-catalog';

const EVENTS = [...EVENT_RECORDS, ...EVENT_SAMPLES].filter((record) =>
  isPublishableEvent(record, 'review'),
);

test('there are event pages to assert on', () => {
  expect(EVENTS.length, 'no publishable event; this file measures nothing').toBeGreaterThan(0);
});

for (const record of EVENTS) {
  const path = `/events/${record.slug}`;
  const ended = record.lifecycle === 'cancelled' || record.lifecycle === 'completed';

  test(`${path} shows the canonical PHT schedule, never a bare local time`, async ({ page }) => {
    await page.goto(path);
    if (!record.startAt) return;
    const time = page.locator('[data-local-time-anchor]').first();
    await expect(time).toBeVisible();
    await expect(time).toContainText('PHT');
    // The machine-readable value keeps the Manila offset from the record.
    await expect(time).toHaveAttribute('datetime', /\+08:00$/);
  });

  test(`${path} never renders a private meeting destination`, async ({ page }) => {
    await page.goto(path);
    const html = (await page.content()).toLowerCase();
    for (const forbidden of ['zoom.us/j/', 'meeting id', 'passcode', 'meetingid']) {
      expect(html, `${path} contains ${forbidden}`).not.toContain(forbidden);
    }
  });

  test(`${path} explains how to join only when joining is possible`, async ({ page }) => {
    /*
     * THE DEFECT THIS EXISTS FOR. A cancelled event rendered the four-step
     * "How to join" instruction - enter an email, watch your inbox - directly
     * beneath a banner saying the event was cancelled. The steps are an
     * instruction, so they belong only where the instruction can be followed.
     */
    await page.goto(path);
    const explainer = page.getByRole('heading', { name: 'How to join' });
    if (ended) {
      await expect(explainer).toHaveCount(0);
    } else {
      await expect(explainer).toBeVisible();
    }
  });

  test(`${path} offers no registration control for an ended event`, async ({ page }) => {
    await page.goto(path);
    const register = page.getByRole('link', { name: /register|waitlist/i });
    if (ended) await expect(register).toHaveCount(0);
  });

  test(`${path} carries one visible breadcrumb trail`, async ({ page }) => {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Breadcrumb' });
    await expect(nav).toHaveCount(1);
    await expect(nav).toBeVisible();
  });

  test(`${path} has exactly one registration panel`, async ({ page }) => {
    /*
     * It was rendered twice - inline for narrow viewports, sticky for wide -
     * giving two `complementary` landmarks with one accessible name and a
     * duplicate id on every page. Each viewport looked correct.
     */
    await page.goto(path);
    await expect(page.locator('#event-registration')).toHaveCount(1);
  });

  test(`${path} states the registration position rather than leaving it blank`, async ({
    page,
  }) => {
    await page.goto(path);
    const panel = page.locator('.panel').first();
    await expect(panel).toBeVisible();
    const text = ((await panel.textContent()) ?? '').replace(/\s+/g, ' ').trim();
    // Heading + badge + a real sentence, not a heading over an empty paragraph.
    expect(text.length, `the panel on ${path} says almost nothing: "${text}"`).toBeGreaterThan(40);
  });
}

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  /*
   * A record WITH A SCHEDULE. `EVENTS[0]` is the AI Exchange draft, which has no
   * approved date at all - so it renders "Time to be announced" and no time
   * element, and these assertions were checking an element that is correctly
   * absent. The first version failed for that reason, which is the useful kind
   * of failure: the fixture was wrong, not the page.
   */
  const record = EVENTS.find((candidate) => candidate.startAt !== undefined);

  test('a scheduled event exists to assert on', () => {
    expect(
      record,
      'no publishable event carries a date; the no-JS block measures nothing',
    ).toBeDefined();
  });

  test('the page still carries its facts, its schedule and its service state', async ({ page }) => {
    await page.goto(`/events/${record!.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-local-time-anchor]').first()).toContainText('PHT');
    await expect(page.locator('#event-registration')).toHaveCount(1);
  });

  test('the supplementary local time stays empty rather than showing a wrong one', async ({
    page,
  }) => {
    await page.goto(`/events/${record!.slug}`);
    const local = page.locator('[data-local-time]');
    await expect(local).toBeHidden();
    expect(((await local.textContent()) ?? '').trim()).toBe('');
  });

  test('no control is offered that cannot act', async ({ page }) => {
    /*
     * The copy button needs the clipboard API, so without script it must stay
     * disabled. A button that looks pressable and does nothing is the dead
     * control this repository has already shipped once.
     */
    await page.goto(`/events/${record!.slug}`);
    const copy = page.locator('[data-copy-link]');
    await expect(copy).toBeDisabled();
    // The link is still readable, which is what the reader actually wanted.
    await expect(page.getByText(`/events/${record!.slug}`, { exact: false }).first()).toBeVisible();
  });

  test('the FAQ answers are reachable without script', async ({ page }) => {
    await page.goto(`/events/${record!.slug}`);
    const first = page.locator('details').first();
    await expect(first).toBeVisible();
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });
});
