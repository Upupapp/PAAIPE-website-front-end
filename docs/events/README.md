# The Events feature — how it works and how to run it

Tab 10 handoff. This is the entry point for anyone picking the events work up.
Everything below was measured against the repository, not remembered.

**Status: READY FOR PAAIPE REVIEW. NOT READY FOR PRODUCTION.** The reasons are
in [release-checklist.md](release-checklist.md), and none of them is a code
defect.

---

## Routes and who owns what

| Route                     | Built in production?                              | Component owner                          |
| ------------------------- | ------------------------------------------------- | ---------------------------------------- |
| `/events`                 | yes, with the honest empty state                  | `src/pages/events/index.astro`           |
| `/events/[slug]`          | only for publishable records — none in production | `src/pages/events/[slug].astro`          |
| `/events/[slug]/register` | same set as the detail route                      | `src/pages/events/[slug]/register.astro` |

Components live in `src/components/events/`. The detail page composes fourteen
sections in the order the command sets; the marketplace composes the hero,
featured slot, series panel, toolbar, grid and empty state.

**Two files decide behaviour, and nothing else may.**

- `src/lib/event-action.ts` — the state resolver. Badge, heading, message, tone,
  whether a registration path exists, the action label and its destination.
- `src/content/event-record.ts` + `src/content/schemas.ts` — the model and its
  validation, which runs at module load, so an invalid record fails the build.

## Adding, updating or cancelling an approved event

1. Add a record to `src/content/event-records.ts`. The schema will reject it at
   build time if anything is inconsistent — that is the intended workflow, not
   an obstacle.
2. Set `contentStatus: 'approved'` only when PAAIPE has approved **the words as
   written**. Anything else stays `draft` and never reaches production.
3. To cancel: set `lifecycle: 'cancelled'`. Do **not** delete the record — a
   cancelled event keeps its page so someone holding an invite can find out what
   happened, and the resolver removes every registration path automatically.
4. To reschedule: change `startAt`/`endAt` **and** set `scheduleUpdatedAt`. The
   second one is what produces the "Schedule updated" notice and the
   `EventRescheduled` structured data; without it the move is silent.
5. Run `npm run check`. Several documents regenerate from the registry; commit
   what changes.

**What the schema will refuse**, so you find out now rather than later: an open
registration with no schedule; a `full` event that accepts a waitlist (its
public state is `waitlist`); a members-only event that does not require
membership; a cancelled or completed event with an open form; an AI Exchange
instance that is not a second Tuesday at 8PM PHT running an hour or less; and
any timestamp without the `+08:00` offset.

## How sample data is excluded

`PUBLIC_CONTENT_MODE` selects the content mode. `production` is the default.

- `isPublishableEvent(record, mode)` is the single predicate. In production it
  admits only `approved`; in review it also admits samples and allow-listed
  drafts.
- Exclusion is by **absence, not hiding**: an unpublishable record generates no
  page, so there is nothing to reveal by viewing source. An unknown slug reaches
  the branded 404 without disclosing that a draft exists.
- `npm run verify:leak` builds **both** modes and scans each, because the only
  proof that fixtures stay out of production is a production build with none in
  it.
- The content-integrity scan is the second half: run against the review build it
  finds 19 artifacts carrying fixtures; against production, none. That contrast
  is what shows the scanner works.

## How state resolution works

One call — `resolveEventAction(event, registrationService)` — returns the model
every surface renders. Cards, the detail page, the registration route and the
tests all read it, and no component recomputes any part of it.

Order matters and is deliberate: **lifecycle is checked before registration
state**. A cancelled event with an open form is the combination that must be
impossible rather than merely unlikely.

The full 60-cell matrix (3 lifecycles × 5 registration states × 2 access × 2
service conditions) is asserted in `src/tests/event-state-matrix.test.ts`,
generated from the type's own unions so a new state is covered without anyone
remembering.

A **changed schedule is a modifier, not a state** — it wraps whatever the
registration state resolves to, so a reader is told both facts.

## How the gateway is selected

`registrationFeatureState(config, approvedEventCount)` returns one of three
values:

| Value                               | When                                            | What the UI does                        |
| ----------------------------------- | ----------------------------------------------- | --------------------------------------- |
| `catalog-absent`                    | no approved events                              | honest empty state                      |
| `catalog-available-endpoint-absent` | events, no `PUBLIC_EVENT_REGISTRATION_ENDPOINT` | the exact unavailable sentence, no form |
| `endpoint-available`                | both present                                    | a registration path appears             |

**Today every build resolves to `catalog-absent`.** Nothing downstream may infer
success from anything other than `endpoint-available` **plus a confirmed gateway
response** — and no gateway exists yet. See
[registration-api-contract.md](registration-api-contract.md).

## Required public configuration

Every key is `PUBLIC_`-prefixed and optional; each has an honest default.

| Key                                  | Default      | Effect when unset                                       |
| ------------------------------------ | ------------ | ------------------------------------------------------- |
| `PUBLIC_SITE_URL`                    | none         | no canonical, no `og:url`, no sitemap, no Event JSON-LD |
| `PUBLIC_CONTENT_MODE`                | `production` | fixtures excluded                                       |
| `PUBLIC_EVENT_CATALOG_SOURCE`        | none         | the built-in registry is used                           |
| `PUBLIC_EVENT_REGISTRATION_ENDPOINT` | none         | no form anywhere; the unavailable sentence              |
| `PUBLIC_EVENT_SUPPORT_URL`           | none         | no support link, and the accessibility FAQ is omitted   |
| `PUBLIC_EVENT_PRIVACY_NOTICE_URL`    | `/privacy`   | this site's own notice                                  |
| `PUBLIC_EVENT_TERMS_URL`             | `/terms`     | this site's own terms                                   |
| `PUBLIC_ANALYTICS_ENABLED`           | `false`      | no telemetry; the build fails on an analytics endpoint  |
| `PUBLIC_WEB_HAPTICS_ENABLED`         | `false`      | no vibration                                            |

A flag is on only for the exact string `"true"` — not `Boolean(value)`, which
makes the string `"false"` true and is the most common way a kill switch turns
out to have been on the whole time.

## What the future backend must implement

See [registration-api-contract.md](registration-api-contract.md) for the full
shape. In one line: accept an email plus an event version and a privacy-notice
version, and return one of a **fixed set of outcome codes** — never a free-text
message, never a boolean about membership.

## How to run every test

```sh
npm run check          # the whole gate: format, lint, types, 939 unit tests, 20 verifiers
npm run test           # unit tests only
npx playwright test                                      # production browser suite
npx playwright test --config playwright.review.config.ts # review suite: the fixtures
npm run build          # production build
npm run integrity:write  # regenerate the content-integrity scan
```

**The review suite is where the event states are actually seen.** Production has
no approved events, so the production suite asserts the empty state and the 404s;
the review suite loads all ten detail pages.

**Gate from a detached worktree**, never a dirty tree:

```sh
git worktree add --detach /tmp/gate <sha> && cd /tmp/gate && npm ci && npm run check
```

## How to reproduce visual QA

Screenshots live in `docs/events/screenshots/`. To regenerate:

```sh
PUBLIC_CONTENT_MODE=review npm run build
PREVIEW_PORT=4400 node scripts/preview-server.mjs &
node scripts/capture-screenshots.mjs docs/events/screenshots http://localhost:4400
```

**Park the pointer before capturing.** A `fullPage` screenshot perturbs the
viewport and Chromium re-evaluates hover with the pointer at its `(0,0)`
default, which once produced "evidence" of both header dropdowns open on a page
that was correct at rest. `capture-screenshots.mjs` moves the pointer to the
bottom-left first; any new capture script must do the same.

## Known limitations and unresolved approvals

| Limitation                | Why it stands                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| No registration form      | Tab 05 builds it; it is the first collection of personal data and needs a DPO and a lawful basis |
| No gateway                | Tab 07; blocked on the backend for the outcome vocabulary and the `privacyNoticeVersion` format  |
| No approved event         | PAAIPE has approved no event; every record is draft or sample                                    |
| No approved speaker       | the registry is empty on purpose; the page shows the honest fallback                             |
| No `og:image` per event   | needs an approved origin (**B-7**) and a rights-cleared image                                    |
| No add-to-calendar        | may only be offered for an approved record, so it could not render in any mode                   |
| No haptic on confirmation | there is no confirmed outcome to attach one to                                                   |
| Legal text is DRAFT       | five facts only PAAIPE holds, plus the act of adoption                                           |
| WebKit suite instability  | measured, characterised, cause unknown — see **F-64**                                            |

Everything above is recorded in `docs/PENDING.md`, which is generated from
`src/config/pending.ts`. That register — not this document — is the authority.
