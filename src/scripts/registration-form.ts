/**
 * The registration form controller, Tab 05.
 *
 * It wires the pure state machine to the DOM and does no deciding of its own.
 * Every question about what a person is told is answered in `view-state.ts`,
 * where it can be tested without a browser; this file only reflects the answer.
 *
 * IT ENABLES THE SUBMIT CONTROL. The button ships `disabled`, so a browser that
 * never runs this file shows no live control - which is Tab 05's rule that a
 * button which cannot submit must not be rendered.
 */
import { EMAIL_FIELD, ERROR_MESSAGES, RESULT_STATES } from '../content/events-registration';
import { newIdempotencyKey, selectRegistrationGateway } from '../lib/registration/gateway';
import {
  canSubmit,
  messageForProblem,
  nextState,
  retainsEmail,
  validateEmail,
} from '../lib/registration/view-state';
import type { RegistrationViewState } from '../lib/registration/view-state';
import type { RegistrationIntent } from '../lib/registration/types';

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-reg-form]');
  if (!root || !(root instanceof HTMLFormElement)) return;

  const input = root.querySelector<HTMLInputElement>('[data-reg-input]');
  const submit = root.querySelector<HTMLButtonElement>('[data-reg-submit]');
  const label = root.querySelector<HTMLElement>('[data-reg-submit-label]');
  const error = root.querySelector<HTMLElement>('[data-reg-error]');
  const section = root.closest('section');
  const summary = section?.querySelector<HTMLElement>('[data-reg-summary]');
  const summaryLink = section?.querySelector<HTMLAnchorElement>('[data-reg-summary-link]');
  const result = section?.querySelector<HTMLElement>('[data-reg-result]');
  if (!input || !submit || !label || !error || !summary || !summaryLink || !result) return;

  const endpoint = root.dataset.endpoint;
  const { gateway } = selectRegistrationGateway(endpoint);

  const idleLabel = label.textContent ?? '';
  let state: RegistrationViewState = { status: 'idle' };
  let inFlight: AbortController | null = null;

  /**
   * The address lives HERE and nowhere else.
   *
   * Not in storage, not in a data attribute, not in the URL, not on the element
   * after completion. One closure variable, cleared the moment the state says it
   * should be.
   */
  let email = '';

  function render(): void {
    /*
     * Narrowed on the discriminant rather than through a boolean: a
     * `const invalid = state.status === 'invalid'` reads the same to a person
     * and tells the compiler nothing, so `state.fieldError` stops type-checking.
     * Holding the narrowed value is what keeps the two in step.
     */
    const fieldError = state.status === 'invalid' ? state.fieldError : null;

    input!.setAttribute('aria-invalid', fieldError ? 'true' : 'false');
    input!.setAttribute(
      'aria-describedby',
      fieldError
        ? 'event-registration-email-hint event-registration-email-error'
        : 'event-registration-email-hint',
    );

    error!.hidden = fieldError === null;
    error!.textContent = fieldError ?? '';
    summary!.hidden = fieldError === null;
    if (fieldError) summaryLink!.textContent = fieldError;

    const busy = state.status === 'submitting';
    submit!.disabled = busy || state.status === 'received';
    submit!.setAttribute('aria-busy', busy ? 'true' : 'false');
    /*
     * The accessible name is REPLACED, never removed. A spinner alone leaves a
     * screen-reader user with an unnamed button and no idea anything happened.
     */
    label!.textContent = busy ? EMAIL_FIELD.pending : idleLabel;

    if (state.status === 'received') {
      const copy = RESULT_STATES[state.outcome];
      result!.hidden = false;
      result!.replaceChildren();
      const heading = document.createElement('p');
      heading.className = 'reg__result-heading';
      heading.textContent = copy.heading;
      const message = document.createElement('p');
      message.textContent = state.maskedEmail
        ? `${copy.message} (${state.maskedEmail})`
        : copy.message;
      result!.append(heading, message);
      /* The form is replaced in place; nothing further can be submitted. */
      root!.hidden = true;
      return;
    }

    if (state.status === 'recoverable-error' || state.status === 'unavailable') {
      const code = state.status === 'unavailable' ? 'configuration-missing' : state.code;
      result!.hidden = false;
      result!.replaceChildren();
      const message = document.createElement('p');
      message.textContent = ERROR_MESSAGES[code] ?? ERROR_MESSAGES['network-error'];
      result!.append(message);
      return;
    }

    result!.hidden = true;
    result!.replaceChildren();
  }

  function setState(next: RegistrationViewState): void {
    state = next;
    if (!retainsEmail(state)) {
      email = '';
      if (state.status === 'received') input!.value = '';
    }
    render();
  }

  root.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!canSubmit(state)) return; // a duplicate click is ignored, never queued

    const checked = validateEmail(input.value);
    if ('problem' in checked) {
      setState({ status: 'invalid', fieldError: messageForProblem(checked.problem) });
      summary.focus();
      return;
    }

    email = checked.value;

    /* Offline is decidable locally and needs no request to state honestly. */
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setState({ status: 'recoverable-error', code: 'network-error' });
      return;
    }

    setState({ status: 'submitting' });
    inFlight = new AbortController();

    void gateway
      .submit(
        {
          eventId: root.dataset.eventId ?? '',
          eventVersion: Number.parseInt(root.dataset.eventVersion ?? '1', 10),
          email,
          intent: (root.dataset.intent ?? 'register') as RegistrationIntent,
          source: 'paaipe-public-portal',
          privacyNoticeVersion: root.dataset.privacyNoticeVersion ?? '',
          idempotencyKey: newIdempotencyKey(),
        },
        { signal: inFlight.signal },
      )
      .then((outcome) => setState(nextState(outcome, email)))
      .finally(() => {
        inFlight = null;
      });
  });

  /*
   * Abandon an in-flight request when the page goes away. The person is no
   * longer there to be told the answer, and a request nobody will read is a
   * registration that may or may not have happened.
   */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') inFlight?.abort();
  });

  submit.disabled = false;
  render();
}

init();

export {};
