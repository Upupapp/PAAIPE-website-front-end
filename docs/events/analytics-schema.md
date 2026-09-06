# Analytics schema — the allowlist, and why nothing sends yet

Tab 10 handoff. The authority is `src/config/event-analytics.ts`; this explains
the decisions.

**Nothing sends anything.** `PUBLIC_ANALYTICS_ENABLED` is off, no vendor script
is loaded, `verify:budgets` fails the build on an analytics endpoint, and a
build scan asserts no vendor string is present. This schema is written now so
that whoever wires telemetry inherits the boundary instead of designing it under
deadline.

## Allowed events (9)

`event_catalog_viewed` · `event_filter_applied` · `event_detail_viewed` ·
`event_share_used` · `registration_started` · `registration_submitted` ·
`registration_received` · `registration_waitlisted` · `registration_failed`

## Allowed properties (9)

`event_id` · `event_slug` · `event_type` · `access_label` ·
`registration_state` · `intent` · `outcome_code` · `error_code` ·
`viewport_bucket`

All fixed enums. No free text — a free-text property is where a server message,
a search term, or an address eventually arrives.

## Forbidden, and the two people argue about

Email, membership result, participant identity, request or response bodies,
tokens, server messages, full request ids. And:

- **A hash of an email is still the email.** Addresses are an enumerable set;
  anyone holding a list can hash it and match. "Hashed" is not "anonymised".
- **So is the domain.** On a small professional association an employer domain
  identifies an organisation and often a person.

## Allowlist, not blocklist

`isAllowedPayload()` asks _"is every key one of the nine agreed names"_, which
is decidable. A blocklist asks _"is this one of the bad names"_, which is
unanswerable for a name nobody thought of.

The forbidden list exists for the **build scan**, not for the validator — the
validator needs no such list to be correct. The scan matches payload **keys**,
not bare words, because this site legitimately says "email" in its privacy
notice, its FAQ and its form label, and a guard nobody can keep green is a guard
that gets deleted.

Zoom, meeting-id and passcode names are deliberately **absent** from that list:
`scope-boundary.test.ts` already bans those strings from every source file and
artifact, which is strictly stronger. Listing them here made that guard fail on
this file — the right question was whether the declaration needed to exist.

## Rules for whoever wires it

- Analytics failure never blocks registration or changes its result.
- Never fire success telemetry before a confirmed adapter response.
- `viewport_bucket` is four buckets, never a raw width — a precise pixel width
  is far more identifying than people expect.
- RUM may measure route and template performance, never a participant.
