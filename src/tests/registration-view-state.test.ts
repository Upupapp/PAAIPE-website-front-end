/**
 * Tab 05 - the registration state machine.
 *
 * The organising question, as in Tab 07: can a person be told something that is
 * not true. Every assertion below is a way that could happen.
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_EMAIL_LENGTH,
  canSubmit,
  isRecoverable,
  maskEmail,
  messageForProblem,
  nextState,
  retainsEmail,
  validateEmail,
} from '../lib/registration/view-state';
import { RESULT_STATES, VALIDATION_MESSAGES } from '../content/events-registration';
import type { RegistrationResult } from '../lib/registration/types';

const received = (outcome: string): RegistrationResult => ({
  state: 'received',
  response: {
    outcome: outcome as never,
    requestId: 'req_1',
    messageCode: 'check-email',
    eventVersion: 1,
  },
});

describe('validation is for usability, and never mangles an address', () => {
  it('trims surrounding whitespace only', () => {
    const result = validateEmail('  someone@example.org  ');
    expect(result).toEqual({ value: 'someone@example.org' });
  });

  it.each([
    ['a plus tag', 'a.b+events@example.org'],
    ['dots in the local part', 'first.last@example.org'],
    ['a long TLD', 'someone@example.technology'],
    ['a subdomain', 'someone@mail.example.org'],
    ['a country TLD', 'someone@example.com.ph'],
    ['digits and dashes', 'user-01@my-domain.org'],
  ])('preserves %s exactly', (_label, email) => {
    /*
     * Provider-specific normalisation would change an address the person owns
     * into one they may not. `a.b+x@gmail.com` and `ab@gmail.com` are the same
     * mailbox at ONE provider and different mailboxes at most others, and the
     * client is not entitled to decide which.
     */
    expect(validateEmail(email)).toEqual({ value: email });
  });

  it.each([
    ['empty', '', 'empty'],
    ['whitespace only', '   ', 'empty'],
    ['no at sign', 'someone.example.org', 'malformed'],
    ['no domain dot', 'someone@example', 'malformed'],
    ['a space inside', 'some one@example.org', 'malformed'],
  ])('rejects %s', (_label, email, problem) => {
    expect(validateEmail(email)).toEqual({ problem });
  });

  it('rejects an address longer than a column can hold', () => {
    const long = `${'a'.repeat(MAX_EMAIL_LENGTH)}@example.org`;
    expect(validateEmail(long)).toEqual({ problem: 'too-long' });
    expect(MAX_EMAIL_LENGTH).toBe(254);
  });

  it('uses the approved message for each problem', () => {
    expect(messageForProblem('empty')).toBe(VALIDATION_MESSAGES.empty);
    expect(messageForProblem('malformed')).toBe(VALIDATION_MESSAGES.malformed);
    expect(messageForProblem('too-long')).toBe(VALIDATION_MESSAGES.tooLong);
  });
});

describe('success is reachable only from a confirmed gateway outcome', () => {
  it('produces `received` from a parsed response', () => {
    const state = nextState(received('verification-required'), 'someone@example.org');
    expect(state.status).toBe('received');
  });

  it.each([
    ['network-error'],
    ['temporarily-unavailable'],
    ['rate-limited'],
    ['state-changed'],
    ['closed'],
    ['cancelled'],
    ['invalid-request'],
    ['idempotency-conflict'],
  ])('never produces `received` from the failure %s', (code) => {
    const state = nextState(
      { state: 'failed', failure: { code: code as never } },
      'someone@example.org',
    );
    expect(state.status).not.toBe('received');
  });

  it('maps a missing endpoint to `unavailable`, not to an error', () => {
    const state = nextState(
      { state: 'failed', failure: { code: 'configuration-missing' } },
      'someone@example.org',
    );
    expect(state.status).toBe('unavailable');
  });
});

describe('what a person is told', () => {
  it('says "Registration received" ONLY for the registered outcome', () => {
    /*
     * The most important line on the screen. Someone told they have a place
     * when only a verification email has been sent will not check their inbox,
     * and will arrive at an event expecting to be admitted.
     */
    expect(RESULT_STATES.registered.heading).toBe('Registration received');
    for (const outcome of ['verification-required', 'eligibility-check'] as const) {
      expect(RESULT_STATES[outcome].heading).toBe('Check your inbox');
      expect(RESULT_STATES[outcome].heading).not.toContain('registered');
      expect(RESULT_STATES[outcome].message.toLowerCase()).not.toContain("you're registered");
    }
  });

  it('never claims a waitlist place is a place', () => {
    expect(RESULT_STATES.waitlisted.message).toContain('does not guarantee admission');
  });

  it('reveals no membership status in the eligibility result', () => {
    const copy = `${RESULT_STATES['eligibility-check'].heading} ${RESULT_STATES['eligibility-check'].message}`;
    expect(copy).toContain('Membership status is not displayed here');
    expect(copy.toLowerCase()).not.toMatch(/\byou are a member\b|\bnot a member\b/);
  });

  it('uses neutral wording for a duplicate, so it cannot enumerate', () => {
    /*
     * "Request already received" describes the REQUEST. "You are already
     * registered" would describe the PERSON, and would answer a question the
     * page must never answer about an address someone else typed.
     */
    expect(RESULT_STATES['already-received'].heading).toBe('Request already received');
  });
});

describe('the address is kept exactly when retrying makes sense', () => {
  it('keeps it after a correctable validation problem', () => {
    expect(retainsEmail({ status: 'invalid', fieldError: 'x' })).toBe(true);
  });

  it.each([['network-error'], ['temporarily-unavailable'], ['rate-limited']])(
    'keeps it after the recoverable failure %s',
    (code) => {
      expect(isRecoverable(code as never)).toBe(true);
      expect(retainsEmail({ status: 'recoverable-error', code: code as never })).toBe(true);
    },
  );

  it.each([['state-changed'], ['closed'], ['cancelled']])(
    'clears it once the event state has moved on (%s)',
    (code) => {
      /*
       * Retrying cannot succeed however often it is attempted, so a filled
       * field inviting another attempt is a lie about what will happen.
       */
      expect(isRecoverable(code as never)).toBe(false);
      expect(retainsEmail({ status: 'recoverable-error', code: code as never })).toBe(false);
    },
  );

  it('clears it after a completed registration', () => {
    expect(retainsEmail({ status: 'received', outcome: 'registered' })).toBe(false);
  });
});

describe('the full address never returns to the page', () => {
  it.each([
    ['someone@example.org', 's•••@example.org'],
    ['first.last@mail.example.org', 'f•••@mail.example.org'],
  ])('masks %s', (email, masked) => {
    expect(maskEmail(email)).toBe(masked);
  });

  it('masks a one-character local part ENTIRELY', () => {
    /*
     * My first expectation here was `a•••@example.org`, and it was wrong: with a
     * single-character local part, showing the first character shows the WHOLE
     * local part. The general rule "reveal one character" stops being a mask at
     * length one, so the implementation drops it and the test now says so.
     */
    expect(maskEmail('a@example.org')).toBe('•••@example.org');
  });

  it('never returns the local part beyond one character', () => {
    const email = 'verydistinctivename@example.org';
    expect(maskEmail(email)).not.toContain('verydistinctivename');
  });

  it('puts only the mask into the received state', () => {
    const state = nextState(received('registered'), 'verydistinctivename@example.org');
    expect(JSON.stringify(state)).not.toContain('verydistinctivename');
  });
});

describe('one logical request per deliberate submission', () => {
  it('refuses a second submit while one is in flight', () => {
    expect(canSubmit({ status: 'submitting' })).toBe(false);
  });

  it('refuses a resubmit after completion', () => {
    expect(canSubmit({ status: 'received', outcome: 'registered' })).toBe(false);
  });

  it.each([
    [{ status: 'idle' } as const],
    [{ status: 'invalid', fieldError: 'x' } as const],
    [{ status: 'recoverable-error', code: 'network-error' } as const],
  ])('allows a deliberate attempt from %o', (state) => {
    expect(canSubmit(state)).toBe(true);
  });
});
