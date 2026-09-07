/**
 * The registration view state machine, Tab 05.
 *
 * PURE, AND SEPARATE FROM THE DOM ON PURPOSE. Every rule that matters here is a
 * rule about what a person is TOLD - when an address is kept, when it is
 * cleared, what counts as success. Those are decidable without a browser, and a
 * rule that can only be tested by driving a form is a rule that mostly is not.
 *
 * THE ONE INVARIANT EVERYTHING ELSE SERVES: `received` is reachable only from a
 * gateway result that was parsed from an allowlisted body. No timeout, no
 * network failure, no unknown status and no local decision can produce it.
 */
import { VALIDATION_MESSAGES } from '../../content/events-registration';
import type { RegistrationErrorCode, RegistrationOutcome, RegistrationResult } from './types';

export type RegistrationViewState =
  | { status: 'idle' }
  | { status: 'invalid'; fieldError: string }
  | { status: 'submitting' }
  | { status: 'received'; outcome: RegistrationOutcome; maskedEmail?: string }
  | { status: 'recoverable-error'; code: RegistrationErrorCode }
  | { status: 'unavailable' };

/** The maximum an `email` column is required to hold. */
export const MAX_EMAIL_LENGTH = 254;

export type EmailProblem = 'empty' | 'malformed' | 'too-long';

/**
 * Validate for USABILITY, never as a security control.
 *
 * TRIM ONLY. No lowercasing, no dot-stripping, no plus-tag removal - those are
 * provider-specific transformations, and applying them changes an address the
 * person owns into one they may not. `a.b+events@gmail.com` and
 * `a.b@gmail.com` are the same mailbox at one provider and different mailboxes
 * at most others; the client is not entitled to decide which.
 *
 * The syntax check is deliberately loose - one `@`, something either side, a dot
 * in the domain. An over-strict TLD or domain regex rejects real addresses, and
 * the server validates properly anyway. Rejecting a valid address is the more
 * expensive error: the person cannot register at all and has no way to argue.
 */
export function validateEmail(raw: string): { value: string } | { problem: EmailProblem } {
  const value = raw.trim();
  if (value.length === 0) return { problem: 'empty' };
  if (value.length > MAX_EMAIL_LENGTH) return { problem: 'too-long' };
  if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value)) return { problem: 'malformed' };
  return { value };
}

export function messageForProblem(problem: EmailProblem): string {
  if (problem === 'empty') return VALIDATION_MESSAGES.empty;
  if (problem === 'too-long') return VALIDATION_MESSAGES.tooLong;
  return VALIDATION_MESSAGES.malformed;
}

/**
 * Mask an address for a result screen.
 *
 * The full address NEVER goes back into the DOM after completion. The mask
 * exists so a person can tell WHICH address they used - useful when they have
 * several - without the page carrying it.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '•••';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return `•••${domain}`;
  return `${local[0]}•••${domain}`;
}

/**
 * Which failures let a person try again with what they typed?
 *
 * KEEP THE EMAIL for a transport-level failure - nothing was confirmed, and
 * making someone retype an address because the network hiccuped is a punishment
 * for the network's behaviour.
 *
 * CLEAR IT once the event's own state has moved on. `closed`, `cancelled` and
 * `state-changed` mean this submission cannot succeed no matter how often it is
 * retried, so a filled field inviting another attempt is a lie about what will
 * happen.
 */
export function isRecoverable(code: RegistrationErrorCode): boolean {
  return code === 'network-error' || code === 'temporarily-unavailable' || code === 'rate-limited';
}

/**
 * Should the component keep the address in memory after this state?
 *
 * The command: clear after a confirmed non-recoverable completion; keep it only
 * after a recoverable error so the person can retry.
 */
export function retainsEmail(state: RegistrationViewState): boolean {
  if (state.status === 'invalid') return true;
  if (state.status === 'recoverable-error') return isRecoverable(state.code);
  if (state.status === 'submitting') return true;
  return false;
}

/**
 * Turn a gateway result into what the person sees.
 *
 * A `received` state is produced ONLY from `result.state === 'received'`, which
 * the gateway produces only from a body it parsed against the allowlist. There
 * is no other path into it - which is what makes "no success without a
 * confirmed outcome" a property of the code rather than a promise about it.
 */
export function nextState(result: RegistrationResult, email: string): RegistrationViewState {
  if (result.state === 'received') {
    return {
      status: 'received',
      outcome: result.response.outcome,
      maskedEmail: maskEmail(email),
    };
  }

  if (result.failure.code === 'configuration-missing') return { status: 'unavailable' };
  return { status: 'recoverable-error', code: result.failure.code };
}

/**
 * May a submission start from this state?
 *
 * ONE LOGICAL REQUEST PER DELIBERATE SUBMISSION. A second click while a request
 * is in flight is ignored rather than queued or aborted-and-retried: a
 * registration is capacity-changing, and the safe reading of a double click is
 * that the person meant one registration.
 */
export function canSubmit(state: RegistrationViewState): boolean {
  return state.status !== 'submitting' && state.status !== 'received';
}
