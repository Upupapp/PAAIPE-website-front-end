# Events Continuation — Tab 01 audit and extension plan

Audit of the accepted PAAIPE Public Information Portal before extending it with the
Events Continuation Master Command (Version 1.0, September 2026). **Nothing in the
existing portal was changed to reach these findings** — this is inspection.

## 1. What the repository actually is

| Concern       | Finding                                                                                                                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework     | Astro 7.2.10, `output: 'static'`, `build.format: 'file'` (so `/events` is `dist/events.html`, and every internal link avoids a 301)                            |
| Language      | TypeScript 6.0.3, strict. `noUncheckedIndexedAccess` is on — indexed reads need narrowing                                                                      |
| Content       | 16 typed registries under `src/content/`, validated by Zod 4 `.strict()` **at module load**, so a bad record is a build failure rather than a runtime surprise |
| Config        | `src/config/` — `routes.ts` (18 routes), `public-config.ts`, `release.ts`, `typeface.ts`, `site-origin.ts`, `content-mode.ts`, `budgets.ts`, `pending.ts`      |
| Components    | By domain: `decor/`, `events/`, `home/`, `resources/`, `shell/`, `ui/`                                                                                         |
| Logic         | `src/lib/` — pure modules, imported by pages and tested directly                                                                                               |
| Unit tests    | Vitest 4.1.11, **647 passing**                                                                                                                                 |
| Browser tests | Playwright 1.62.1, two configs: production (`playwright.config.ts`, 5 projects, 981 assertions) and review (`playwright.review.config.ts`, 208)                |
| Accessibility | `@axe-core/playwright` at WCAG 2.2 AA on every route                                                                                                           |
| Deployment    | Netlify, `netlify.toml`, an `ignore` build-skip hook proven by `verify:deploy`                                                                                 |
| Content modes | `production` (default, safe) and `review`; `PUBLIC_CONTENT_MODE=review` publishes sample records                                                               |

## 2. The existing events implementation, which this continuation extends

| Route                     | State                                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/events`                 | Exists. Hero, featured series panel, a topic filter, upcoming / members-only / past sections with honest empty states, "other kinds of session", speaker CTA, membership panel |
| `/events/[slug]`          | Exists. Badges, agenda, member-lock panel, breadcrumbs, JSON-LD. **Generates zero pages in production** because no event is approved; asserted to 404                          |
| `/events/[slug]/register` | **Does not exist**                                                                                                                                                             |
| `/speakers`               | Exists, unchanged by this continuation                                                                                                                                         |

The event model is `PublicEvent` — `slug, title, excerpt, visibility, contentStatus, timeZone, format, duration, publicAgenda, status, registrationState, image`. One record, `paaipe-ai-exchange`, `contentStatus: 'sample'`.

**This is the read-only events section from the ORIGINAL portal command.** It is not a partial
implementation of this continuation; it predates it.

## 3. Exactly what this continuation replaces or extends

- **Replaced:** the original prohibition on event pages processing RSVP or registration. Nothing else.
- **Extended:** `/events` gains search, filters, sort and a past archive; `/events/[slug]` gains
  the fuller 14-section hierarchy; the event model gains scheduling, lifecycle, speakers and a
  registration policy.
- **Added:** `/events/[slug]/register`, a registration gateway boundary, and a state resolver.

Everything else in the accepted portal — routes, shell, tokens, logo, accessibility behaviour,
tests, the release gate, the legal pages — is preserved.

## 4. Conflicts and decisions this audit had to make

### 4.1 `src/features/events/` versus the existing architecture

Tab 01 Step 5 lists a `src/features/events/{components,content,data,registration,schema,tests}`
structure, and Tab 01 also says _"Adapt names to the existing framework"_ and _"Do not erase
working architecture to force a preferred stack."_

This repository is organised by **layer** (`content/`, `config/`, `lib/`, `components/<domain>/`,
`tests/`), and the events domain already occupies `src/components/events/`, `src/content/events.ts`
and `src/lib/events.ts`. Creating a parallel feature tree would give the events domain **two homes**,
and the failure mode is specific: the next person adds a component to whichever one they find first,
and the two drift.

**Decision: adapt, and record the mapping.** No `src/features/` tree is created.

| Command's folder               | This repository                          |
| ------------------------------ | ---------------------------------------- |
| `features/events/components`   | `src/components/events/`                 |
| `features/events/content`      | `src/content/events.ts`                  |
| `features/events/data`         | `src/lib/events.ts`                      |
| `features/events/registration` | `src/lib/registration/` (new, Tab 05/07) |
| `features/events/schema`       | `src/content/schemas.ts`                 |
| `features/events/tests`        | `src/tests/` and `tests/e2e/`            |
| `docs/events`                  | `docs/events/` — created as specified    |

### 4.2 The seven `PUBLIC_EVENT_*` names must NOT join `PUBLIC_CONFIG_KEYS`

Owner item **B-4** is "all seven `PUBLIC_*` destinations", and its release-gate row builds its own
text from that array:

```ts
missing: `All seven PUBLIC_* destinations: ${PUBLIC_CONFIG_KEYS.join(', ')}`;
```

The word "seven" is **hardcoded in a sentence that interpolates the list**. Adding the event keys
to that array would produce a gate row reading "All seven" above a list of fourteen — and it would
silently redefine what B-4 measures, folding feature configuration into a count of owner-supplied
destinations.

**Decision:** the event keys live in their own group, `PUBLIC_EVENT_CONFIG_KEYS`, validated by the
same parser. B-4 continues to mean exactly what it meant. This is recorded because it is the same
defect class as the hardcoded counts found and removed elsewhere in this repository (F-53, F-54).

### 4.3 The register route cannot direct-load in production, and that is correct

Tab 01's acceptance asks that the three routes "direct-load safely". In production content mode no
event is approved, so `/events/[slug]` generates no pages and `/events/[slug]/register` generates
none either. Both return the branded not-found response, which is what Tab 01 Step 3 requires for
unpublished slugs. **Safe direct-load here means the 404, not a page.** Review mode is where the
shells render, and that is where the screenshots come from.

## 5. Assumptions

1. `PUBLIC_EVENT_PRIVACY_NOTICE_URL` and `PUBLIC_EVENT_TERMS_URL` default to the site's own
   `/privacy` and `/terms` when unset, rather than rendering unavailable — those pages exist. The
   env names remain for the case where PAAIPE hosts the notices elsewhere.
2. "Analytics allowlist" (Tab 09) is a specification, not an instruction to add analytics. This
   portal loads no analytics and shows no consent banner by deliberate decision; `PUBLIC_ANALYTICS_ENABLED`
   defaults to off and adding a provider is a separate owner decision.
3. Haptics default off, per Tab 08 and Tab 01 Step 4.

## 6. Blockers and decisions that need PAAIPE

| #   | Item                                                                                                                                                 | Why it blocks                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Tab 02 changes the event model.** `paaipe-backend` has already imported the current registries into a checksummed bundle (their Tab 10, `319b095`) | Their importer is written against today's shape. They must be told before the model changes, not after                      |
| 2   | **Tab 05 collects personal data for the first time.** The live privacy notice describes registration in a section that says it is not enabled        | Building the form makes that section describe something real. The notice must change with it                                |
| 3   | Legal basis, retention, processors, notice wording, raffle terms, participation terms                                                                | The command itself requires owner approval before publication. The DPO designation is deferred (owner decision, 2026-09-04) |
| 4   | No approved event instance exists                                                                                                                    | Every screen this continuation builds will render its empty or sample state until PAAIPE approves a real event              |
| 5   | `PUBLIC_EVENT_REGISTRATION_ENDPOINT`                                                                                                                 | Until it exists, the disabled gateway is the only correct behaviour, and no tab may report a success                        |

None of 1–5 blocks Tab 01. Items 1 and 2 must be resolved before Tab 02 and Tab 05 respectively.
