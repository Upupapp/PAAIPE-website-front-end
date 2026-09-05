# Event content guide

How to add, update and cancel a PAAIPE event without exposing anything private
and without publishing a claim nobody approved.

Every rule below is **enforced at build time** by `publicEventRecordSchema`. A
record that breaks one does not render badly — the build fails and says which
rule and which field. You cannot ship a contradiction by accident.

## Where things live

| Thing                | File                                                 |
| -------------------- | ---------------------------------------------------- |
| The types            | `src/content/event-record.ts`                        |
| The rules            | `src/content/schemas.ts` (`publicEventRecordSchema`) |
| Real events          | `src/content/event-records.ts`                       |
| Review-only fixtures | `src/content/event-samples.ts`                       |
| The recurring series | `src/content/event-series.ts`                        |
| Approved speakers    | `src/content/event-speakers.ts`                      |
| Reading the catalog  | `src/lib/event-catalog.ts`                           |

## Required fields

`schemaVersion` (always `1`), `id`, `slug`, `title`, `excerpt`, `description`,
`contentStatus`, `type`, `access`, `format`, `lifecycle`, `timeZone`,
`formatLabel`, `publicAgenda`, `learningOutcomes`, `audience`, `speakerIds`,
`topicTags`, `registration`, `media`, `faqs`, `relatedSlugs`, `featured`, `seo`.

Optional: `seriesId`, `eyebrow`, `startAt`, `endAt`, `durationMinutes`,
`publishedAt`, `updatedAt`.

## The rules, and why each exists

- **`access` and `requiresVerifiedMembership` must agree.** `members-only` with
  `requiresVerifiedMembership: false` is a members-only event anyone can register
  for — a failure nobody notices until someone joins.
- **A `cancelled` or `completed` event cannot be `open` or `waitlist`.** An
  active form on an event that is not happening is the most expensive mistake
  this page can make.
- **Both `startAt` and `endAt`, or neither**, ordered, with `durationMinutes`
  matching the span exactly.
- **Timestamps carry `+08:00`.** A bare timestamp means whatever timezone the
  parsing machine is in — UTC on CI — which silently moves every event eight
  hours.
- **Registration cannot be `open` without a schedule.** A recurrence is not an
  announcement; nobody can register for a time no one has set.
- **A `waitlist` state needs `waitlistEnabled: true`.**
- **An `approved` event needs `media.rightsApproved: true`.**
- **A PAAIPE AI Exchange instance** falls on the **second Tuesday**, begins at
  **8:00 PM** Philippine time, and runs **one hour maximum**. An instance that
  drifts contradicts the published series page.
- **`showCapacity` is typed as literal `false`.** Turning it on is a deliberate
  edit to the type, not a one-character change a reviewer would skim past.

## Approval workflow

1. Add the record with `contentStatus: 'sample'`. It renders in review builds and
   is absent from production — from routes, the sitemap, feeds, metadata and
   schema.
2. Have PAAIPE approve the facts: title, date, speaker, agenda, access, imagery
   rights.
3. Change `contentStatus` to `'approved'`. The build then requires
   `media.rightsApproved`, and the page becomes indexable.

**Draft and sample never reach production.** `isPublishableEvent()` is the one
rule, and `verify:leak` builds both content modes and asserts it.

## Image rights and alt text

`media` and any speaker `portrait` carry `rightsApproved`. An approved event with
uncleared media fails the build; an approved speaker with an uncleared portrait
has the portrait dropped by the repository rather than rendered.

`alt` is **required and may be empty**. Empty means _decorative, depicting
nothing_ — correct for the generated abstract covers. A missing `alt` is an
oversight; an empty one is a decision.

## Speaker fallback

No approved speaker means the page renders **"Speaker details coming soon"**.
Never a stock face, a generated likeness, a scraped portrait, an inferred title,
a placeholder organisation or a fabricated quote.

## Registration state ownership

The frontend **displays** state; it never decides it. Capacity, eligibility,
waitlist promotion and duplicate handling belong to a future service. The client
never infers membership, and `showCapacity` stays `false` until a backend
supplies a verified public number.

## Adding an event without exposing private access details

Put the joining details **nowhere in this repository.** There is no field for
them: no `zoomUrl`, no `meetingId`, no `passcode`, no `attendees`. Twelve names
are forbidden, `.strict()` rejects them on a record, and
`scripts/verify-event-boundary.mjs` scans the **built output** in both content
modes — because a value can reach an artifact without any source file naming the
field.

Public pages may say **"Private Zoom"**. That is a format, not a location.

## Cancelling or updating honestly

- **Cancelling:** set `lifecycle: 'cancelled'` and `registration.state` to
  `'closed'`. Keep the page. Do not show a replacement date until one is
  confirmed.
- **Rescheduling:** update `startAt`, `endAt` and `durationMinutes` together —
  the build refuses them if they disagree.
- **Completing:** set `lifecycle: 'completed'`. Do not imply a recording, slides
  or a certificate exists unless one has been approved.

## Two registries, for now

The shipped pages still read the older `PublicEvent` model. Tab 02 says not to
redesign pages, and the two vocabularies differ (`postponed` versus `cancelled`,
`announcement-coming-soon` versus `waitlist`), so deriving one from the other
would be lossy and would change what the live page says today.

They coexist until Tabs 03–04 retire the old one, and a test asserts they agree
on every fact they share. If you edit one, edit both — the guard will tell you
immediately if you forget.
