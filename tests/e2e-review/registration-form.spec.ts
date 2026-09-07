/**
 * Tab 05 - the registration form, driven in a browser.
 *
 * THE FORM DOES NOT EXIST ON THE LIVE SITE. It renders only when a validated
 * endpoint is configured, and none is - which is the whole safety property of
 * this tab. These tests therefore build the page WITH an endpoint set, so the
 * form can be exercised at all.
 *
 * That is a real tension and worth naming: a suite that only ever ran against
 * the shipped configuration would assert that a form is absent and nothing
 * about whether it behaves. Absence is asserted separately, against the
 * production build, in `registration-route.spec.ts`.
 */
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const PATH = '/events/sample-public-open/register';

/*
 * The endpoint is stubbed at the network layer, so nothing leaves the browser.
 * Every response below is one this client must handle, and the assertions are
 * about what a PERSON is told rather than about the request.
 */
async function stub(page: Page, handler: Parameters<Page['route']>[1]) {
  await page.route('**/registration-endpoint**', handler);
}

test.describe('with an endpoint configured', () => {
  /*
   * `PUBLIC_EVENT_REGISTRATION_ENDPOINT` is a build-time value, so the form
   * cannot be summoned by a runtime flag. These tests inject the markup the
   * component produces by navigating to the page and enabling it through a
   * build the review server was started with - see the spec header. Where that
   * is not available the tests skip with a stated reason rather than passing.
   */
  /*
   * THE REVIEW BUILD CARRIES A STUB ENDPOINT so this form exists to be driven.
   *
   * The first version of this file skipped every test when no endpoint was
   * configured, and 20 of 24 skipped - a suite that reported green while
   * exercising nothing, which is the quietest way for a check to stop existing.
   * `build:review` now sets `PUBLIC_EVENT_REGISTRATION_ENDPOINT` to a
   * same-origin path; production sets none, and that absence is asserted in
   * `registration-route.spec.ts` against the production build.
   *
   * Asserted rather than assumed, so a config change cannot silently return
   * this file to skipping.
   */
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH);
    await expect(
      page.locator('[data-reg-form]'),
      'the review build has no registration endpoint, so this suite would test nothing',
    ).toHaveCount(1);
  });

  test('asks for one field and never for a password or a name', async ({ page }) => {
    const inputs = page.locator('[data-reg-form] input');
    await expect(inputs).toHaveCount(1);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('input[name="name"]')).toHaveCount(0);
  });

  test('keeps a visible label, and the placeholder is not the label', async ({ page }) => {
    await expect(page.locator('label[for="event-registration-email"]')).toBeVisible();
    const placeholder = await page.locator('#event-registration-email').getAttribute('placeholder');
    expect(placeholder).toBe('you@example.com');
  });

  test('the field is set up for an email address on a phone', async ({ page }) => {
    /*
     * The command's snippet includes `autocapitalize="none"`, which `verify:html`
     * rejects on `type="email"` - correctly, since the attribute does not apply
     * to that input type and every browser already suppresses autocapitalisation
     * for it. The attribute is gone; the BEHAVIOUR it asked for is asserted here
     * through the properties that do apply.
     */
    const input = page.locator('#event-registration-email');
    await expect(input).toHaveAttribute('type', 'email');
    await expect(input).toHaveAttribute('inputmode', 'email');
    await expect(input).toHaveAttribute('autocomplete', 'email');
    await expect(input).toHaveAttribute('spellcheck', 'false');
    await expect(input).toHaveAttribute('maxlength', '254');
  });

  test('reports an empty submit in words, and sends the person to the field', async ({ page }) => {
    await stub(page, (route) => route.abort());
    await page.locator('[data-reg-submit]').click();

    const summary = page.locator('[data-reg-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('Enter your email address.');
    await expect(page.locator('#event-registration-email')).toHaveAttribute('aria-invalid', 'true');
  });

  test('keeps what was typed after a recoverable failure', async ({ page }) => {
    await stub(page, (route) => route.abort('failed'));
    await page.locator('#event-registration-email').fill('someone@example.org');
    await page.locator('[data-reg-submit]').click();

    await expect(page.locator('[data-reg-result]')).toContainText('not submitted');
    /* Retyping an address because the network hiccuped is a punishment. */
    await expect(page.locator('#event-registration-email')).toHaveValue('someone@example.org');
  });

  test('never announces success from a failure', async ({ page }) => {
    await stub(page, (route) => route.fulfill({ status: 500, body: '{}' }));
    await page.locator('#event-registration-email').fill('someone@example.org');
    await page.locator('[data-reg-submit]').click();

    const result = page.locator('[data-reg-result]');
    await expect(result).toBeVisible();
    await expect(result).not.toContainText('Registration received');
    await expect(result).not.toContainText('registered');
  });

  test('a verification outcome does NOT say the person is registered', async ({ page }) => {
    await stub(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          outcome: 'verification-required',
          requestId: 'req_1',
          messageCode: 'check-email',
          eventVersion: 1,
        }),
      }),
    );
    await page.locator('#event-registration-email').fill('someone@example.org');
    await page.locator('[data-reg-submit]').click();

    const result = page.locator('[data-reg-result]');
    await expect(result).toContainText('Check your inbox');
    await expect(result).not.toContainText('Registration received');
  });

  test('the full address never returns to the page after completion', async ({ page }) => {
    await stub(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          outcome: 'verification-required',
          requestId: 'req_1',
          messageCode: 'check-email',
          eventVersion: 1,
        }),
      }),
    );
    await page.locator('#event-registration-email').fill('verydistinctive@example.org');
    await page.locator('[data-reg-submit]').click();
    await expect(page.locator('[data-reg-result]')).toBeVisible();

    const html = await page.content();
    expect(html).not.toContain('verydistinctive@example.org');
  });

  test('no address reaches storage or the URL', async ({ page }) => {
    await stub(page, (route) => route.abort('failed'));
    await page.locator('#event-registration-email').fill('someone@example.org');
    await page.locator('[data-reg-submit]').click();

    const stored = await page.evaluate(() => ({
      local: JSON.stringify(Object.entries(localStorage)),
      session: JSON.stringify(Object.entries(sessionStorage)),
      url: window.location.href,
    }));
    expect(stored.local).not.toContain('someone@example.org');
    expect(stored.session).not.toContain('someone@example.org');
    expect(stored.url).not.toContain('someone');
  });

  test('a duplicate click sends one request', async ({ page }) => {
    let calls = 0;
    await stub(page, async (route) => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          outcome: 'verification-required',
          requestId: 'r',
          messageCode: 'check-email',
          eventVersion: 1,
        }),
      });
    });

    await page.locator('#event-registration-email').fill('someone@example.org');
    const submit = page.locator('[data-reg-submit]');
    await submit.click();
    await submit.click({ force: true }).catch(() => undefined);
    await expect(page.locator('[data-reg-result]')).toBeVisible();
    expect(calls, 'a double click produced more than one registration').toBe(1);
  });

  test('the submit control keeps an accessible name while busy', async ({ page }) => {
    await stub(page, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      await route.abort('failed');
    });
    await page.locator('#event-registration-email').fill('someone@example.org');
    await page.locator('[data-reg-submit]').click();

    const label = await page.locator('[data-reg-submit]').textContent();
    expect((label ?? '').trim().length, 'the button lost its name while pending').toBeGreaterThan(
      0,
    );
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('offers no control that cannot submit', async ({ page }) => {
    await page.goto(PATH);
    /*
     * Either there is no form at all (no endpoint configured, the shipped
     * case), or the form is present with its submit control still disabled.
     * Both are honest; a live-looking button is not.
     */
    const submit = page.locator('[data-reg-submit]');
    if ((await submit.count()) > 0) await expect(submit).toBeDisabled();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
