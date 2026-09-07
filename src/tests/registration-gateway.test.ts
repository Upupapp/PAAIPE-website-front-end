/**
 * Tab 07 - the registration gateway contract.
 *
 * The organising question for almost every test here is not "does it work" but
 * "can it possibly report success when it should not". A registration UI that
 * says "you're registered" over an unconfirmed submission is the single worst
 * thing this frontend could do, and every path below that could reach one is
 * driven at least once.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  DisabledRegistrationGateway,
  HttpRegistrationGateway,
  MAX_RESPONSE_BYTES,
  newIdempotencyKey,
  parseResponse,
  safeRetryAfter,
  selectRegistrationGateway,
} from '../lib/registration/gateway';
import type { RegistrationRequest } from '../lib/registration/types';

const REQUEST: RegistrationRequest = {
  eventId: 'paaipe-ai-exchange',
  eventVersion: 1,
  email: 'you@example.com',
  intent: 'register',
  source: 'paaipe-public-portal',
  privacyNoticeVersion: 'draft-2026-09-04',
  idempotencyKey: 'attempt-1',
};

/** A response body the client is permitted to accept. */
const GOOD_BODY = {
  outcome: 'verification-required',
  requestId: 'req_123',
  messageCode: 'check-email',
  eventVersion: 1,
};

function respond(body: unknown, init: ResponseInit = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return vi.fn(async () => new Response(text, { status: 200, ...init }));
}

describe('the disabled gateway cannot report success', () => {
  it('always returns configuration-missing', async () => {
    const result = await new DisabledRegistrationGateway().submit();
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.failure.code).toBe('configuration-missing');
  });

  it('has no branch that returns a received state', async () => {
    /*
     * Driven twenty times rather than argued from the source: if any input
     * could produce a confirmation, this is where it would show.
     */
    const gateway = new DisabledRegistrationGateway();
    for (let i = 0; i < 20; i += 1) {
      expect((await gateway.submit()).state).toBe('failed');
    }
  });
});

describe('gateway selection', () => {
  it.each([
    ['nothing configured', undefined],
    ['an empty string', ''],
    ['plain http', 'http://example.org/register'],
    ['credentials in the URL', 'https://user:pass@example.org/register'],
    ['localhost', 'https://localhost/register'],
    ['a loopback address', 'https://127.0.0.1/register'],
    ['not a URL at all', 'not-a-url'],
  ])('falls back to the disabled gateway for %s', (_label, endpoint) => {
    const { gateway, kind } = selectRegistrationGateway(endpoint);
    expect(kind).toBe('disabled');
    expect(gateway).toBeInstanceOf(DisabledRegistrationGateway);
  });

  it.each([
    ['a same-origin path', '/api/events/register'],
    ['an absolute HTTPS origin', 'https://api.example.org/register'],
  ])('selects the HTTP gateway for %s', (_label, endpoint) => {
    const { gateway, kind } = selectRegistrationGateway(endpoint);
    expect(kind).toBe('http');
    expect(gateway).toBeInstanceOf(HttpRegistrationGateway);
  });
});

describe('response parsing accepts exactly one shape', () => {
  it('accepts the approved body', () => {
    expect(parseResponse(GOOD_BODY)).not.toBeNull();
  });

  it.each([
    ['null', null],
    ['a string', 'ok'],
    ['an array', []],
    ['a missing requestId', { ...GOOD_BODY, requestId: undefined }],
    ['an empty messageCode', { ...GOOD_BODY, messageCode: '' }],
    ['a string eventVersion', { ...GOOD_BODY, eventVersion: '1' }],
    ['a fractional eventVersion', { ...GOOD_BODY, eventVersion: 1.5 }],
    ['an unknown outcome', { ...GOOD_BODY, outcome: 'definitely-registered' }],
  ])('rejects %s', (_label, body) => {
    expect(parseResponse(body)).toBeNull();
  });

  it.each([['registered'], ['waitlisted'], ['already-received'], ['eligibility-check']])(
    'REFUSES the confirmation-endpoint outcome %s from a POST',
    (outcome) => {
      /*
       * THE MOST IMPORTANT ASSERTION IN THIS FILE. These outcomes are real, and
       * they belong to the CONFIRMATION endpoint after a token has proven the
       * address. A POST answering one of them means the two ends disagree about
       * which endpoint confirms a registration, and the safe reading of a
       * disagreement is that nothing is confirmed. Rendering it would tell
       * somebody they have a place when no seat is held.
       */
      expect(parseResponse({ ...GOOD_BODY, outcome })).toBeNull();
    },
  );
});

describe('status mapping', () => {
  const cases: Array<[number, string]> = [
    [409, 'idempotency-conflict'],
    [410, 'closed'],
    [422, 'invalid-request'],
    [429, 'rate-limited'],
    [503, 'temporarily-unavailable'],
    [500, 'temporarily-unavailable'],
    [418, 'temporarily-unavailable'],
  ];

  it.each(cases)('maps %i to %s', async (status, code) => {
    const gateway = new HttpRegistrationGateway(
      'https://api.example.org/r',
      respond({}, { status }),
    );
    const result = await gateway.submit(REQUEST);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.failure.code).toBe(code);
  });

  it('accepts a 200 carrying the approved body', async () => {
    const gateway = new HttpRegistrationGateway('https://api.example.org/r', respond(GOOD_BODY));
    const result = await gateway.submit(REQUEST);
    expect(result.state).toBe('received');
    if (result.state === 'received') expect(result.response.outcome).toBe('verification-required');
  });
});

describe('nothing unconfirmed is ever reported as success', () => {
  it('treats a malformed body as temporarily unavailable', async () => {
    const gateway = new HttpRegistrationGateway('https://api.example.org/r', respond('<html>oops'));
    const result = await gateway.submit(REQUEST);
    expect(result.state).toBe('failed');
  });

  it('treats an oversized body as temporarily unavailable', async () => {
    const huge = JSON.stringify({ ...GOOD_BODY, padding: 'x'.repeat(MAX_RESPONSE_BYTES) });
    const gateway = new HttpRegistrationGateway('https://api.example.org/r', respond(huge));
    expect((await gateway.submit(REQUEST)).state).toBe('failed');
  });

  it('treats a network error as network-error, not success', async () => {
    const failing = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const gateway = new HttpRegistrationGateway('https://api.example.org/r', failing);
    const result = await gateway.submit(REQUEST);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.failure.code).toBe('network-error');
  });

  it('treats an abort as unconfirmed rather than failed-for-good', async () => {
    const aborting = vi.fn(async () => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    });
    const gateway = new HttpRegistrationGateway('https://api.example.org/r', aborting);
    const result = await gateway.submit(REQUEST);
    expect(result.state).toBe('failed');
    if (result.state === 'failed') expect(result.failure.code).toBe('temporarily-unavailable');
  });

  it('honours a caller abort signal', async () => {
    const controller = new AbortController();
    const hanging = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );
    const gateway = new HttpRegistrationGateway(
      'https://api.example.org/r',
      hanging as unknown as typeof fetch,
    );
    const promise = gateway.submit(REQUEST, { signal: controller.signal });
    controller.abort();
    expect((await promise).state).toBe('failed');
  });
});

describe('the request carries only what it must', () => {
  it('sends the email in the BODY and never in the URL', async () => {
    const spy = respond(GOOD_BODY);
    await new HttpRegistrationGateway('https://api.example.org/r', spy).submit(REQUEST);

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain('you@example.com');
    expect(url).not.toContain('%40');
    expect(String(init.body)).toContain('you@example.com');
  });

  it('omits marketingOptIn entirely rather than sending false', async () => {
    const spy = respond(GOOD_BODY);
    await new HttpRegistrationGateway('https://api.example.org/r', spy).submit(REQUEST);
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(init.body)).not.toContain('marketing');
  });

  it('attaches no credentials and leaks no referrer', async () => {
    const spy = respond(GOOD_BODY);
    await new HttpRegistrationGateway('https://api.example.org/r', spy).submit(REQUEST);
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.credentials).toBe('omit');
    expect(init.referrerPolicy).toBe('no-referrer');
  });

  it('sends the idempotency key as a header', async () => {
    const spy = respond(GOOD_BODY);
    await new HttpRegistrationGateway('https://api.example.org/r', spy).submit(REQUEST);
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('attempt-1');
  });
});

describe('idempotency keys', () => {
  it('are distinct per attempt and derived from nothing personal', () => {
    const keys = new Set(Array.from({ length: 200 }, () => newIdempotencyKey()));
    expect(keys.size).toBe(200);
    for (const key of keys) expect(key).not.toContain('example.com');
  });

  it('a duplicate click reuses the SAME key when the caller reuses it', async () => {
    /*
     * The client's job is one logical submission per deliberate action. The key
     * makes a deliberate retry safe on the server; it is not a security control
     * and is not treated as one anywhere here.
     */
    const spy = respond(GOOD_BODY);
    const gateway = new HttpRegistrationGateway('https://api.example.org/r', spy);
    await gateway.submit(REQUEST);
    await gateway.submit(REQUEST);
    const keys = spy.mock.calls.map(
      (call) =>
        ((call as unknown as [string, RequestInit])[1].headers as Record<string, string>)[
          'Idempotency-Key'
        ],
    );
    expect(keys).toEqual(['attempt-1', 'attempt-1']);
  });

  it('never retries automatically', async () => {
    const failing = vi.fn(async () => new Response('{}', { status: 503 }));
    await new HttpRegistrationGateway('https://api.example.org/r', failing).submit(REQUEST);
    expect(failing).toHaveBeenCalledTimes(1);
  });
});

describe('Retry-After is believed only when it is safe', () => {
  it.each([
    ['30', 30],
    ['0', 0],
    ['3600', 3600],
  ])('accepts %s', (header, expected) => {
    expect(safeRetryAfter(header)).toBe(expected);
  });

  it.each([
    ['an HTTP date', 'Wed, 21 Oct 2026 07:28:00 GMT'],
    ['a negative value', '-5'],
    ['beyond an hour', '86400'],
    ['a non-number', 'soon'],
    ['nothing', null],
  ])('ignores %s', (_label, header) => {
    expect(safeRetryAfter(header)).toBeUndefined();
  });
});
