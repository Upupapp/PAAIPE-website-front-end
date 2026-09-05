# Event SEO, structured data, analytics and security — Tab 09

Tab 09 deliverable. The canonical/indexing matrix is generated into
`docs/metadata-matrix.md`; this document holds the decisions and the things a
generator cannot state.

## Structured data, and what it does not claim

`src/lib/event-structured-data.ts` emits Schema.org `Event` JSON-LD from the
same record the page renders.

**It is not a bid for a Google rich result.** PAAIPE's events are virtual and
mostly private or member-gated, which Google's Event experience does not cover,
and its listed regional availability does not include the Philippines. A
validator reporting _no eligible enhancement_ is the correct outcome, not a
defect. A test scans this repository and fails if any file promises a carousel,
a rich card or search eligibility.

**Five gates, each removing a way to publish something untrue:**

| Gate                           | Why                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `contentStatus === 'approved'` | a sample or draft is not an event; marking one up puts a fabricated listing into a machine-readable index                                              |
| `access === 'public'`          | announcing a members-only session as open invites people who cannot attend                                                                             |
| `startAt` present              | `startDate` is required, and an undated event has no honest value for it                                                                               |
| `format === 'online'`          | the record carries no street address, so a `Place` would have to be invented and an in-person event would otherwise be described as happening at a URL |
| approved origin                | absolute URLs need one; owner item **B-7** is open, so today there is none                                                                             |

**Nothing is emitted today**, and a test asserts that against the live registry
rather than assuming it — so approving the first event makes that test fail and
be re-read.

`eventStatus` distinguishes three cases, and the third is the one that is easy
to lose: a **rescheduled** event is `EventRescheduled`, not `EventScheduled`. It
is still going ahead, so the lifecycle alone would drop the one fact a
subscriber most needs — that the time they already have is wrong.

There is deliberately no `EventPostponed`. The legacy mapping Tab 04 deleted
turned `cancelled` into `postponed`, which tells a reader a new date is coming
when none is.

`location.url` is the **public event page**. The record has no meeting link, id
or passcode to leak, and a test asserts the serialised output contains no
mention of Zoom.

No `offers`, no price, no capacity. `showCapacity` is the literal `false` in the
type, so a seat count cannot exist to publish; absent is honest, zero would be a
claim.

## Indexing

Generated per route in `docs/metadata-matrix.md`. Two rules worth stating here:

- **Registration routes are `noindex, follow`.** One flag drives both the meta
  tag and the sitemap, so they cannot disagree.
- **A cancelled event keeps its page**, with accurate public status, rather than
  disappearing. Someone holding a calendar invite needs to be able to find out
  what happened.

The matrix printed a **blank** indexability cell for the registration route for
three tabs, because the label map had no entry for its reason and the lookup
returned `undefined`. It now throws instead.

## Analytics

`src/config/event-analytics.ts` is a **specification**. Nothing sends anything:
the flag is off, no vendor script is loaded, and `verify:budgets` fails the
build on an analytics endpoint.

Nine allowed events, nine allowed properties, and an **allowlist rather than a
blocklist** — "is this one of the nine agreed names" is decidable, "is this one
of the bad names" is not, for a name nobody thought of.

**A hash of an email is still the email**, and so is the domain. Email addresses
are an enumerable set: anyone holding a list can hash it and match. Both are
named explicitly because both get argued for as anonymised.

The forbidden list exists for the **build scan**, which reads `dist` rather than
source — a value can reach an artifact through a spread without any source file
naming the field. It matches payload _keys_, not bare words, because this site
legitimately says "email" in its privacy notice, its FAQ and its form label, and
a guard nobody can keep green is a guard that gets deleted.

## Security headers

Committed in `netlify.toml` and **unverified**: no site is linked, so the file is
inert and no header has been observed in a response. `X-Content-Type-Options`,
`Referrer-Policy`, `X-Frame-Options`, both Cross-Origin policies, a
`Permissions-Policy` disabling nineteen capabilities, and HSTS at a deliberately
short `max-age` until the domain is settled.

**No Content-Security-Policy.** `BaseLayout` has one inline `<head>` script that
applies motion preferences before first paint, and a static host cannot issue a
per-response nonce — enforcing a policy needs that script's SHA-256 hash.
Shipping `unsafe-inline` instead would defeat the directive entirely.

## Performance

Measured in-browser on `/events` and an event detail page, in Chromium, with the
entry types asserted supported before any zero is trusted:

| Measure      | Bound asserted | Why the bound                                                                                                                                        |
| ------------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLS          | < 0.02         | the CWV threshold is 0.1; these pages animate only opacity and transform, so a regression to a layout-affecting property shows up long before "poor" |
| Longest task | < 50ms         | the standard long-task definition, and what makes INP feel slow                                                                                      |
| LCP (local)  | < 2000ms       | a local preview is not a network; this only shows the page does not spend seconds of its own doing before painting                                   |

**This is lab evidence and it is not a 75th-percentile claim.** The field plan:
once an origin is approved (B-7) and a consent decision exists, collect
privacy-safe RUM for LCP, INP and CLS, bucketed by `viewport_bucket` and route
template only — never by participant. Until then the honest statement is that
the lab floor is met and the field is unmeasured.

The marketplace is also asserted to render its cards **with JavaScript
disabled**, which is the cheapest proof that event content is server-rendered.

## The one place this tab and Tab 04 disagree

Tab 09 restates the marketplace meta description ending _"View details and
register using your email."_ That clause is still **withheld**, for the reason
recorded as F-55: production has no approved events and the register route ships
no form, so the sentence promises an action the site refuses to perform — in the
one place a reader meets it before they can discover it is unavailable.

Restating a sentence does not change the machinery it describes. The clause
returns when Tab 05 connects registration, in one edit.
