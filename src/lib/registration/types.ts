/**
 * The registration gateway boundary, Tab 07.
 *
 * This defines how the public client MAY integrate with a future approved
 * service. It creates no service, no database, no email system, no member
 * lookup, no capacity engine and no Zoom integration - and there is deliberately
 * no stub server file anywhere, because a stub is the thing most likely to be
 * mistaken later for a production implementation.
 *
 * TWO PLACES WHERE THIS DIVERGES FROM THE TAB 07 TEXT, both on purpose, both
 * because the backend's contract is FROZEN and real while the command's snippet
 * was written before it existed. The command says "adapt these types without
 * weakening them"; neither change weakens anything, and one of them is the
 * strongest guarantee in this file.
 *
 *   1. `eventVersion` IS A NUMBER, NOT A STRING. The backend's schema is
 *      `{ type: integer, minimum: 1 }` over an `integer NOT NULL` column (bus
 *      #0366, #0454). This frontend shipped the string "paaipe-ai-exchange@1"
 *      and every registration would have been rejected as `invalid-request`.
 *      A string type here would have let that mistake back in.
 *
 *   2. THE POST CAN ONLY EVER RETURN `verification-required`. See
 *      `POST_OUTCOMES` below - this is the important one.
 */

/** The full vocabulary, across BOTH endpoints. Nothing else may be rendered. */
export type RegistrationOutcome =
  | 'registered'
  | 'verification-required'
  | 'eligibility-check'
  | 'waitlisted'
  | 'already-received'
  /* The backend carries this and the Tab 07 snippet did not (bus #0454). */
  | 'cancelled';

/**
 * What the REGISTRATION POST is permitted to return. Exactly one value.
 *
 * THIS IS THE ENUMERATION-RESISTANCE DECISION, and it belongs on this side too.
 *
 * The backend's POST answers `verification-required` with a constant body,
 * constant status, constant headers and a response-time floor, so that the
 * response reveals NOTHING about the address submitted. If it could answer
 * `already-received` or `registered`, anyone could type a stranger's address
 * into this form and learn whether that person is registered for a PAAIPE
 * event.
 *
 * The other outcomes are real, and they live on the CONFIRMATION endpoint,
 * after a token has proven the address belongs to the person holding it.
 *
 * ENFORCING IT HERE IS NOT REDUNDANT. The server's guarantee protects people
 * from the server. This one protects them from a misconfigured endpoint, a
 * fixture pointed at production, a proxy that rewrites a body, or a future
 * developer who "helpfully" widens the server's response. If anything other
 * than `verification-required` comes back from a POST, this client treats it as
 * an unusable response rather than as good news - which is the only reading
 * that is safe when the two ends disagree.
 */
export const POST_OUTCOMES = ['verification-required'] as const;
export type PostRegistrationOutcome = (typeof POST_OUTCOMES)[number];

/**
 * Stable error codes. Never a server message.
 *
 * `idempotency-conflict` is the backend's and was absent from the Tab 07
 * snippet; `closed` and `cancelled` are event-level and public, because they
 * describe the EVENT rather than the person, so returning them discloses
 * nothing about an address.
 */
export type RegistrationErrorCode =
  | 'invalid-request'
  | 'state-changed'
  | 'closed'
  | 'cancelled'
  | 'rate-limited'
  | 'temporarily-unavailable'
  | 'network-error'
  | 'configuration-missing'
  | 'idempotency-conflict';

export type RegistrationIntent = 'register' | 'waitlist' | 'member-registration';

export interface RegistrationRequest {
  eventId: string;
  /** INTEGER. See the header - the backend's column is `integer NOT NULL`. */
  eventVersion: number;
  /** Transient. Never stored, never in a URL, never in telemetry. */
  email: string;
  /** Must match the public state rendered when the person submitted. */
  intent: RegistrationIntent;
  source: 'paaipe-public-portal';
  /** Identifies the approved notice copy shown. Not a substitute for server records. */
  privacyNoticeVersion: string;
  /**
   * `marketingOptIn` IS DELIBERATELY ABSENT FROM THIS TYPE.
   *
   * Tab 07: "If marketing is not legally and technically approved, omit
   * marketingOptIn entirely rather than sending false or default values."
   * Nothing about marketing is approved. A field carrying `false` still asserts
   * that a marketing choice was PRESENTED and declined, which is a claim about
   * a consent interaction that never happened - and consent evidence is exactly
   * the kind of record that gets read back years later as though it were true.
   */
  /** New per deliberate attempt; reused only to retry the SAME submission. */
  idempotencyKey: string;
}

/** The only shape this client will parse. Anything else is unusable. */
export interface RegistrationResponse {
  outcome: RegistrationOutcome;
  requestId: string;
  messageCode: string;
  eventVersion: number;
}

/** A refusal the UI can render. Never carries a server string. */
export interface RegistrationFailure {
  code: RegistrationErrorCode;
  /** Seconds, only from a safe `Retry-After`. Absent unless the server said so. */
  retryAfterSeconds?: number;
}

export type RegistrationResult =
  | { state: 'received'; response: RegistrationResponse }
  | { state: 'failed'; failure: RegistrationFailure };

export interface RegistrationGateway {
  /**
   * Submit one deliberate attempt.
   *
   * RETURNS A RESULT; NEVER THROWS FOR A REFUSAL. A rejected promise invites a
   * `catch` that swallows the reason and a UI that shows a generic error, and
   * this boundary's whole purpose is that the reason survives to the surface.
   * It rejects only for programmer error - never for a network or server
   * condition, both of which are ordinary outcomes here.
   */
  submit(
    request: RegistrationRequest,
    options?: { signal?: AbortSignal },
  ): Promise<RegistrationResult>;
}
