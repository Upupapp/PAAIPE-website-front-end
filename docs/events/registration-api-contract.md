# Registration API contract — what the backend must implement

Tab 10 handoff. **Nothing here is built.** Tab 05 builds the form, Tab 07 the
gateway; both are blocked. This document exists so the contract is agreed before
either is written, rather than discovered while writing them.

## The shape

The frontend will send **one email address** and two version stamps, to a
same-origin path or an allow-listed HTTPS origin set in
`PUBLIC_EVENT_REGISTRATION_ENDPOINT`.

```jsonc
// request
{
  "email": "<the address the participant typed, trimmed of surrounding space>",
  "eventVersion": "<from the record; lets a stale submission be refused>",
  "privacyNoticeVersion": "<identifies the notice the participant was shown>",
}
```

**The two version stamps are the point.** Without `eventVersion` a submission
made before a state change is indistinguishable from one made after it. Without
`privacyNoticeVersion` there is no record of _which_ notice a person agreed to,
which is the first question a regulator asks.

## The response: a fixed vocabulary, never a message

The UI renders only these outcomes. A free-text server message is never
displayed — it is the most common way a raw exception body, an internal
hostname, or the existence of an account reaches a page.

| Outcome                 | Heading shown            | What it must mean                                          |
| ----------------------- | ------------------------ | ---------------------------------------------------------- |
| `registered`            | Registration received    | the registration is recorded and no further step is needed |
| `verification-required` | Check your inbox         | recorded, pending mailbox confirmation                     |
| `eligibility-check`     | Check your inbox         | a members-only request is under review                     |
| `waitlisted`            | You're on the waitlist   | recorded on the waitlist, no place held                    |
| `already-received`      | Request already received | a prior request exists for this address                    |

Error codes are similarly fixed: `invalid-email`, `too-long`, `rate-limited`,
`state-changed`, `server-error`, `offline`. Each maps to approved copy.

## Rules the backend must hold to

- **Never return a boolean about membership**, and never differ observably
  between a recognised member, a non-member and an address under review. The
  neutral response is not a UI convenience; it is what stops the page becoming a
  membership-enumeration oracle.
- **`already-received` must be returned for an unknown address too**, or it
  becomes an account-existence oracle by another route.
- **Do not echo the email** in the response body.
- **Idempotency:** a repeated submission of the same address for the same event
  returns `already-received`, not a second registration.
- **A capacity-changing request is never retried automatically.** If the state
  moved from open to waitlist during submission, say so with `state-changed` and
  require a fresh deliberate action.
- **Rate limiting must not confirm anything.** `rate-limited` says the request
  was not processed, never that it was.

## What the frontend guarantees in return

- The email is held in component memory only, cleared after a confirmed
  non-recoverable completion, and retained after a recoverable network error so
  the participant can retry without retyping.
- It never enters a URL, a query parameter, a hash, browser storage, a page
  title, an analytics payload, a referrer, a log, or a screenshot. The allowlist
  in `src/config/event-analytics.ts` forbids the address, its hash **and** its
  domain, and a build scan enforces the absence.
- No service worker and no background sync queues a registration request.
- Client validation is presented as usability, never as security. The server
  validates length, syntax, policy, eligibility, duplicates and capacity.

## Open questions for the backend lane

Both have been on the bus since Tab 03 (`#0322`, `#0340`) and are unanswered.

1. **What FORMAT will `privacyNoticeVersion` take?** A date, a semver, an opaque
   id? The frontend will store and send whatever is agreed, but it will not
   invent one — a version string nobody can resolve to a document is worse than
   no version at all.
2. **Is the outcome vocabulary above accepted as written?** If the backend
   returns a different set, the mapping layer belongs on the server side, not in
   the page: the UI must render a stable vocabulary, and a translation table in
   the client is a second place for it to drift.
