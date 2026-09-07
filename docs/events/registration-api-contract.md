# Registration API contract — what the backend must implement

Tab 10 handoff. **Nothing here is built.** Tab 05 builds the form, Tab 07 the
gateway; both are blocked. This document exists so the contract is agreed before
either is written, rather than discovered while writing them.

## Status of this document

**Corrected 2026-09-07.** The first version of this file was written without
reading the backend's replies, which were already waiting in this lane's inbox.
It documented five outcomes against the registration POST. **That is wrong, and
the backend warned about it twice before the file existed** — bus `#0326` and
`#0366`, then definitively in `#0454`. Everything below is now taken from their
frozen contract rather than proposed to it.

## The shape

The frontend sends **one email address** and two version stamps to a same-origin
path or an allow-listed HTTPS origin set in
`PUBLIC_EVENT_REGISTRATION_ENDPOINT`. The event's own id travels in the path.

```jsonc
// POST request
{
  "email": "<the address the participant typed, trimmed of surrounding space>",
  "eventVersion": 1, // INTEGER, minimum 1
  "privacyNoticeVersion": "draft-2026-09-04", // <state>-<ISO date>, EXACT
}
```

**`eventVersion` is an integer.** Their frozen schema is
`{ type: integer, minimum: 1 }` over an `integer NOT NULL DEFAULT 1` column. The
frontend shipped `"paaipe-ai-exchange@1"`, which does not parse — every
registration from this form would have been rejected as `invalid-request`. The
slug already travels as the event id in the path, so nothing is lost.

**`privacyNoticeVersion` is exact.** Their composition root _transcribes_ this
string and **refuses to boot** if the deployed matrix disagrees. The frontend
shipped `draft-2026-09`, four characters short — a deployment that will not
start. Both values are now pinned by the schema, not by convention.

When B-9 is adopted the value becomes `adopted-YYYY-MM-DD`, and **the backend
must be told in the same change**, because they have to move their
transcription.

## The outcome vocabulary is SPLIT BY ENDPOINT, and the split is the point

### The POST returns exactly ONE value

It is a `const`, not an enum:

```jsonc
{ "outcome": "verification-required", "messageCode": "check-email" }
```

Identical body, identical status, identical headers, and a response-time floor.

**This is the enumeration-resistance decision.** If the POST could answer
`already-received` or `registered`, anyone could type an address into this form
and learn from the response whether that person is registered for that event.
The POST reveals **nothing**.

The version of getting this wrong that actually hurts: a UI built to render
`registered` from the POST shows somebody they have a place when nothing is
confirmed and no seat is held.

### The CONFIRMATION endpoint returns the real outcome

Only after a token has proven the address:

| Outcome             | Heading shown            |
| ------------------- | ------------------------ |
| `registered`        | Registration received    |
| `waitlisted`        | You're on the waitlist   |
| `eligibility-check` | Check your inbox         |
| `already-received`  | Request already received |
| `cancelled`         | Event cancelled          |

`cancelled` is in their set and was absent from the frontend's first list.

### Errors are event-level and public

They describe the event, not the person, so they are safe to return from the
POST: `invalid-request`, `state-changed`, `closed`, `cancelled`, `rate-limited`,
`temporarily-unavailable`, `network-error`, `configuration-missing`,
`idempotency-conflict`.

## Rules the backend already holds to

Confirmed by them, not assumed here: `eventVersion` is compared to the stored
value and a stale one returns **409 `state-changed`**, so a submission against
terms the person never saw is refused rather than accepted. `full` and `invalid`
exist internally and are never returned publicly.

## What the frontend guarantees in return

- The email is held in component memory only, cleared after a confirmed
  non-recoverable completion, and retained after a recoverable network error so
  the participant can retry without retyping.
- It never enters a URL, query parameter, hash, browser storage, page title,
  analytics payload, referrer, log or screenshot. The allowlist in
  `src/config/event-analytics.ts` forbids the address, its **hash** and its
  **domain**, and a build scan enforces the absence.
- No service worker and no background sync queues a registration request.
- Client validation is presented as usability, never as security.
- **No UI will be built to render a confirmed outcome from the POST.**

## The flag is a publication

Agreed with the backend as a shared rule, from their `#0454`:

> When a downstream surface derives user-visible claims from a flag, **the flag
> is publication**. It needs the review a copy change gets, not the review a
> config change gets.

Exposing `PUBLIC_EVENT_REGISTRATION_ENDPOINT` makes this site start promising
registration automatically, with no diff to review. They have committed not to
switch it on as a smoke test, and to say so **before** they flip it.

## Open questions — now answered, and what is owed BACK

Both questions this document opened with are **answered**: `#0326`, `#0366`,
`#0454`. Nothing here is blocked on the backend any more.

What this lane owes them, from their messages:

1. **`postponed` lifecycle.** Their `events.lifecycle` has four values; this
   model has three, deliberately — Tab 04 deleted a mapping that turned
   `cancelled` into `postponed`, because that wording tells a reader a new date
   is coming when none is. **This frontend will never render `postponed`**, so
   they can stop deriving it. Answered on the bus.
2. **The twelve forbidden field names.** They checked their list against ours
   and all twelve are present, plus seven more — but they were explicit that
   theirs was complete _by luck_ rather than by construction, and asked for the
   final list to assert against by name once Tab 02 settled. It has settled;
   the list is the sole property of `scripts/verify-event-boundary.mjs`.
3. **The old content bundle.** Their importer reads a checksummed
   `content-bundle.json` extracted from the _old_ registry, so Tabs 03–04
   retiring it makes their bundle **stale, not broken** — a visible failure they
   re-extract from. They asked to be told when the old registry is gone. It is:
   Tab 04 removed the last bridge.
