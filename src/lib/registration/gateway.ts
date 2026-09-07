/**
 * The two gateways and the choice between them, Tab 07.
 *
 * THE DISABLED GATEWAY IS THE DEFAULT, and it is structurally incapable of
 * reporting success: it has no branch that returns a `received` result. Not "it
 * returns unavailable today" - there is no code path to a confirmation. That is
 * the difference between a safe default and a default that happens to be safe.
 *
 * THE HTTP GATEWAY IS SELECTED ONLY BY VALIDATED CONFIGURATION, through the
 * same `parseRegistrationEndpoint` Tab 01 built: same-origin path or absolute
 * HTTPS, no credentials in the URL, no localhost. Anything else falls back to
 * disabled rather than throwing, because a misconfigured deploy must degrade to
 * "not connected" rather than to a broken page.
 */
import { parseRegistrationEndpoint } from '../../config/event-config';
import { POST_OUTCOMES } from './types';
import type {
  RegistrationFailure,
  RegistrationGateway,
  RegistrationRequest,
  RegistrationResponse,
  RegistrationResult,
} from './types';

/** How long one attempt may take before it is abandoned as unconfirmed. */
export const REQUEST_TIMEOUT_MS = 15_000;

/** A response larger than this is not our schema and is not parsed. */
export const MAX_RESPONSE_BYTES = 8 * 1024;

/**
 * The gateway that cannot succeed.
 *
 * Used whenever no validated endpoint exists, which is every build today.
 */
export class DisabledRegistrationGateway implements RegistrationGateway {
  async submit(): Promise<RegistrationResult> {
    return { state: 'failed', failure: { code: 'configuration-missing' } };
  }
}

/** Status to error code. A status this does not name is not a success. */
function failureForStatus(status: number, retryAfterSeconds?: number): RegistrationFailure {
  if (status === 409) return { code: 'idempotency-conflict' };
  if (status === 410) return { code: 'closed' };
  if (status === 422) return { code: 'invalid-request' };
  if (status === 429) return { code: 'rate-limited', retryAfterSeconds };
  return { code: 'temporarily-unavailable' };
}

/**
 * `Retry-After`, in seconds, only when it is safe to believe.
 *
 * A malicious or broken value could park a person on a "try later" screen for a
 * day. Only a plain integer within an hour is honoured; an HTTP-date form is
 * ignored rather than parsed, because the parsing is where the surprises live
 * and the cost of ignoring it is one extra manual retry.
 */
export function safeRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  if (!/^\d+$/.test(header.trim())) return undefined;
  const seconds = Number.parseInt(header, 10);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 3600) return undefined;
  return seconds;
}

/**
 * Parse a response body into the ONE shape this client accepts.
 *
 * ALLOWLIST, NOT COERCION. Every field is checked for presence and type, and
 * the outcome must be one the POST is permitted to return. A body that is
 * malformed, oversized, HTML, or merely unfamiliar returns null, and null is
 * mapped to `temporarily-unavailable` - never to success.
 */
export function parseResponse(body: unknown): RegistrationResponse | null {
  if (typeof body !== 'object' || body === null) return null;
  const value = body as Record<string, unknown>;

  const { outcome, requestId, messageCode, eventVersion } = value;
  if (typeof outcome !== 'string') return null;
  if (typeof requestId !== 'string' || requestId.length === 0) return null;
  if (typeof messageCode !== 'string' || messageCode.length === 0) return null;
  if (typeof eventVersion !== 'number' || !Number.isInteger(eventVersion)) return null;

  /*
   * THE OUTCOME MUST BE ONE THE POST MAY RETURN - today, exactly
   * `verification-required`.
   *
   * A server answering `registered` here is not good news; it is two ends
   * disagreeing about which endpoint confirms a registration, and the safe
   * reading of a disagreement is that nothing is confirmed. Rendering it would
   * tell somebody they have a place when no token has proven the address and no
   * seat is held.
   */
  if (!(POST_OUTCOMES as readonly string[]).includes(outcome)) return null;

  return {
    outcome: outcome as RegistrationResponse['outcome'],
    requestId,
    messageCode,
    eventVersion,
  };
}

export class HttpRegistrationGateway implements RegistrationGateway {
  /**
   * `fetch` IS BOUND, and the bare reference was a real bug.
   *
   * `= fetch` as a default parameter captures the function WITHOUT its receiver.
   * Browsers require `fetch` to be called with `window` as `this` and throw
   * `TypeError: Illegal invocation` otherwise - which this class caught and
   * mapped to `network-error`, so in a real browser EVERY registration reported
   * "Registration was not submitted" and no request ever left the page.
   *
   * Every unit test passed, because every one of them injects a mock. THE
   * DEFAULT PARAMETER WAS THE ONLY PATH NOTHING EXERCISED, and it is the only
   * path production uses. Found by driving the form in a browser and noticing
   * that a catch-all Playwright route saw no request at all.
   */
  constructor(
    private readonly endpoint: string,
    fetchImpl?: typeof fetch,
  ) {
    this.fetchImpl = fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  private readonly fetchImpl: typeof fetch;

  async submit(
    request: RegistrationRequest,
    options?: { signal?: AbortSignal },
  ): Promise<RegistrationResult> {
    /*
     * ONE ATTEMPT. NO AUTOMATIC RETRY, EVER.
     *
     * A registration is capacity-changing: a retry the person did not ask for
     * can take a second place, or take the last one. The idempotency key makes
     * a DELIBERATE retry safe; it does not make an automatic one acceptable.
     */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    options?.signal?.addEventListener('abort', () => controller.abort(), { once: true });

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Idempotency-Key': request.idempotencyKey,
        },
        /*
         * `omit`, so no cookie is ever attached. If cookie credentials are ever
         * required, the backend must supply CSRF protection and this line
         * changes deliberately - the frontend must not invent a token.
         */
        credentials: 'omit',
        /* No email in the URL, and no `Referer` carrying one either. */
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({
          eventId: request.eventId,
          eventVersion: request.eventVersion,
          email: request.email,
          intent: request.intent,
          source: request.source,
          privacyNoticeVersion: request.privacyNoticeVersion,
        }),
      });

      /*
       * NEVER INFER SUCCESS FROM A REDIRECT OR AN OPAQUE RESPONSE. `fetch` with
       * an opaque response reports status 0 and an unreadable body; a 3xx that
       * was followed is already resolved, and one that was not tells us
       * nothing. Both are "no confirmed response".
       */
      if (response.type === 'opaque' || response.status === 0) {
        return { state: 'failed', failure: { code: 'temporarily-unavailable' } };
      }

      const retryAfter = safeRetryAfter(response.headers.get('Retry-After'));

      if (!response.ok) {
        return { state: 'failed', failure: failureForStatus(response.status, retryAfter) };
      }

      /* An oversized body is not our schema; do not parse megabytes of HTML. */
      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) {
        return { state: 'failed', failure: { code: 'temporarily-unavailable' } };
      }

      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        return { state: 'failed', failure: { code: 'temporarily-unavailable' } };
      }

      const parsed = parseResponse(body);
      if (!parsed) return { state: 'failed', failure: { code: 'temporarily-unavailable' } };

      return { state: 'received', response: parsed };
    } catch (error) {
      /*
       * An abort is not a failure of the server and not a success either: it is
       * "we do not know". The distinction the person needs is that NOTHING WAS
       * CONFIRMED, which both codes carry into the approved copy.
       */
      const aborted = error instanceof Error && error.name === 'AbortError';
      return {
        state: 'failed',
        failure: { code: aborted ? 'temporarily-unavailable' : 'network-error' },
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Choose the gateway from configuration.
 *
 * The ONLY route to `HttpRegistrationGateway` is a validated endpoint. Every
 * other path - missing, malformed, http://, credentials in the URL, localhost -
 * returns the gateway that cannot report success.
 */
export function selectRegistrationGateway(
  rawEndpoint: string | undefined,
  fetchImpl?: typeof fetch,
): { gateway: RegistrationGateway; kind: 'http' | 'disabled'; reason?: string } {
  const parsed = parseRegistrationEndpoint(rawEndpoint);
  if (!parsed.value) {
    return { gateway: new DisabledRegistrationGateway(), kind: 'disabled', reason: parsed.reason };
  }
  return { gateway: new HttpRegistrationGateway(parsed.value, fetchImpl), kind: 'http' };
}

/**
 * A per-attempt idempotency key.
 *
 * NEW FOR EACH DELIBERATE ATTEMPT, reused only when retrying the SAME logical
 * submission. It is not proof of identity and not an authorisation token, and
 * it carries nothing derived from the email - a key derived from the address
 * would be an identifier for that person travelling in a header.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  /* A build without WebCrypto still needs a distinct key per attempt. */
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
