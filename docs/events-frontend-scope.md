# Events frontend scope — the continuation boundary

The Events Continuation Master Command supersedes **one** thing in the accepted portal: the
prohibition on event pages processing RSVP or registration. Every other frontend-only and privacy
boundary in the original scope stays in force.

## What this frontend owns

- The event marketplace at `/events`, the detail pages at `/events/[slug]`, and the email
  registration interface at `/events/[slug]/register` are **public frontend features**.
- The frontend may send a typed request to a configured secure endpoint and render **only mapped
  response codes**. It never interprets a raw response body.

## What it does not own

The frontend does not own database writes, email delivery, mailbox verification, membership
eligibility, capacity, waitlist promotion, private meeting access, cancellation-token creation,
payments, raffle administration, or deployment.

## The rules that make the boundary checkable

- **A missing endpoint must show:** "Online registration is being connected. Please check back soon.
  No registration has been recorded."
- **No production mock may report a successful registration.** Success comes from a confirmed
  gateway response or it does not appear. Not from a timeout, an optimistic update, local state, a
  query parameter, or a fixture.
- **No Zoom URL, meeting ID, passcode, attendee data, private calendar URL, member email, token or
  secret may enter public code or artifacts** — source, DOM, bundles, fixtures, JSON-LD,
  screenshots, logs, analytics, error reports, or source maps.

## How each rule is enforced, not merely stated

A boundary that is only written down is a boundary nobody notices crossing. Each of the above has a
guard, and each guard has been seen to fail on the defect it exists for:

| Rule                                               | Enforced by                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Forbidden private fields absent from all artifacts | `src/tests/scope-boundary.test.ts`, extended in Tab 01 to the full twelve-name list        |
| Dev fixtures never reach production                | `src/tests/content-visibility.test.ts` plus `verify:leak`, which builds BOTH content modes |
| A missing endpoint cannot report success           | Tab 07's `DisabledRegistrationGateway`; until then, no submit control exists at all        |
| Registration routes are not indexed                | `noindex, follow` asserted per route in `src/tests/seo.test.ts`                            |

## The honest-unavailable principle

Where a destination is unconfigured, the interface says so in words a reader can act on, and renders
no control that cannot work. Never a `#` link, never a disabled button with no reason, never a
fabricated success. This is the same pattern the rest of the portal already follows, and Tab 01 does
not weaken it.
