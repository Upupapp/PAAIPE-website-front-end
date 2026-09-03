# Content architecture

Tab 03 deliverable: the typed, schema-validated public content layer. Pages
render from registries; no page repeats copy.

---

## 1. Registry map

| Registry          | File                      | Records | Notes                                                                               |
| ----------------- | ------------------------- | ------- | ----------------------------------------------------------------------------------- |
| Organisation copy | `content/organization.ts` | —       | Name, acronym, slogan, description, audiences, values, signature event, disclaimers |
| Programs          | `content/programs.ts`     | 6       | All `approved`                                                                      |
| Events            | `content/events.ts`       | 1       | `sample` — see §5                                                                   |
| Resources         | `content/resources.ts`    | 10      | All `sample` — see §5                                                               |
| Member benefits   | `content/benefits.ts`     | 7       | Plus 5 benefit _categories_ for `/benefits`                                         |
| Membership FAQ    | `content/faqs.ts`         | 7       | Approved copy, quoted verbatim                                                      |
| Approved speakers | `content/speakers.ts`     | **0**   | Deliberately empty                                                                  |
| Approved partners | `content/partners.ts`     | **0**   | Deliberately empty; 6 _categories_ held separately                                  |
| Policies          | `content/policies.ts`     | 2       | Both `draft-for-review`                                                             |
| Navigation        | `content/navigation.ts`   | —       | Primary nav, grouped footer nav, social links                                       |
| Page metadata     | `config/routes.ts`        | 18      | The route registry **is** the page-metadata registry — one source, not two          |
| External actions  | `lib/external-action.ts`  | 6       | The single resolver                                                                 |

Everything is re-exported through `src/content/index.ts`. **Pages import from
there, never from a raw registry file**, so nothing can bypass validation or the
content-mode filter.

## 2. Validation

`src/content/schemas.ts` holds a Zod schema per registry. `src/content/index.ts`
parses every registry at module load — which is **build time**. A malformed
record fails `astro build` with the registry name, the record index and the
field path. It does not render as an empty card.

**Every object schema is `.strict()`.** A non-strict Zod object silently _drops_
unknown keys, so a typo like `titel:` would validate cleanly and the title would
simply be missing at render time — the failure would look like missing content
rather than a bad key. A test and a build break-check both cover this.

### Cross-field invariants — the rules that make lying hard

These are refinements, not field types, and each encodes a master-command rule
that a type alone cannot express:

| Invariant                                                   | Why                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `limited-capacity` requires `capacityConfigured: true`      | "Only use Limited Capacity when real capacity data is configured"                                     |
| A `members-only` event cannot be `registration-open`        | A private session must never advertise public registration                                            |
| Only `approved` content may carry an `approvedSpeaker`      | An unapproved fixture cannot name a real person                                                       |
| A `members-only` resource cannot have `publicBody`          | The public route may show only a synopsis; body copy would put protected content in the client bundle |
| Only `approved` content may have `publishedAt`              | Sample content must not claim publication                                                             |
| `updatedAt` cannot precede `publishedAt`                    |                                                                                                       |
| A `draft-for-review` policy must have a `reviewBanner`      | Legal pages cannot appear final                                                                       |
| Image `src` must be site-relative                           | An absolute URL would make the build depend on a third party                                          |
| Dates must be ISO `yyyy-mm-dd` **and** a real calendar date |                                                                                                       |

## 3. Content status vs visibility — two independent axes

- **`visibility`** — who the content is _for_: `public` or `members-only`.
  A members-only record still appears publicly, but only as a synopsis.
- **`contentStatus`** — whether it may be _published_: `approved`, `sample`, `draft`.

They are orthogonal on purpose. A members-only record can be approved; a public
record can be a sample.

## 4. Content mode — how production stays clean

`PUBLIC_CONTENT_MODE` selects the build's content mode. **The default is
`production`**, deliberately: a build with no configuration must not accidentally
publish fixtures.

| Mode                   | Publishes                                                                        |
| ---------------------- | -------------------------------------------------------------------------------- |
| `production` (default) | `approved` only                                                                  |
| `review`               | `approved` + `sample`, and `draft` **only if the slug is in `DRAFT_ALLOW_LIST`** |

`DRAFT_ALLOW_LIST` is currently empty. The master command requires an explicit
allow-list rather than "all drafts in review mode", so an unfinished record
cannot ride along.

**Non-approved records are stripped from the registry, not hidden with CSS.**
They are absent from the built HTML. Measured:

| Build                        | Detail pages generated                              |
| ---------------------------- | --------------------------------------------------- |
| `npm run build` (production) | **0** — `/events` and `/resources` index pages only |
| `npm run build:review`       | **11**                                              |

`isPublishable()` in `src/lib/content-visibility.ts` is the only place this is
decided. No page filters on `contentStatus` by hand, so the rule cannot be right
in one page and forgotten in another.

## 5. Why the fixtures look the way they do

**Every event and resource is `sample`.** PAAIPE has approved no article and no
specific session, so nothing is `approved` and a production build publishes no
detail pages at all. That is the honest state, not a gap.

The single event record carries:

- **no `date`** — an invented date is a commitment nobody made;
- **no `approvedSpeaker`** — the registry is empty and the schema forbids one on
  non-approved content anyway;
- `announcement-coming-soon`, matching the approved default state;
- `members-only`, so it can never advertise open registration.

The publicly stated recurrence, time, duration and agenda **are** approved, so
they are carried faithfully. No meeting URL, meeting ID or passcode exists
anywhere in this codebase.

Resource fixtures carry no `publishedAt`, no author or byline, and no
certification, partnership or measurable-result claim.

### Imagery: the absence is in the type

```ts
type PublicImage =
  | { kind: 'placeholder'; tone: 'navy' | 'surface' | 'cyan' }
  | { kind: 'file'; src: string; alt: string; width: number; height: number };
```

No approved photography or illustration has been supplied (B-6), and inventing
imagery for a professional association is not acceptable. Encoding the absence
in the **type** means a fixture cannot quietly reference a file that does not
exist, and every consumer is forced to handle the placeholder case.

## 6. External actions

All six handoffs — Apply, Member Sign In, Application Status, Speaker Interest,
Partnership Interest, Contact — resolve through
`resolveExternalAction()`. Pages never build a destination themselves.

```ts
type ExternalActionResolution =
  | { state: 'available'; href: string; kind: 'url' | 'email' }
  | { state: 'unavailable'; message: string };
```

None is configured, so all six currently resolve to `unavailable`. The
`ExternalAction` component then renders a **disabled control plus the reason in
visible text** — not a tooltip, so it is readable without a pointer and
announced with the control.

It is never `#`, never `javascript:`, never an empty href, never a dummy submit,
never a fabricated success, and never a local-storage write. A browser test
walks every page and asserts no dead, empty or `javascript:` href exists
anywhere.

Contact resolves to `mailto:` and is deliberately _not_ marked as opening a new
browsing context — it opens a mail client.

## 7. Viewer state

```ts
type ViewerState = 'public' | 'applicant-pending';
```

The production public build **always** supplies `public`. `applicant-pending`
exists for component tests only. A source scan fails the suite if any file
mentioning `applicant-pending` also touches `URLSearchParams`, `location.search`,
`document.cookie` or `localStorage` — so the state cannot be activated by a
visitor, which would be simulating private access.

## 8. A gate that failed against its own explanation

The scope-boundary scan looks for `zoom.us`, `meeting id` and `passcode` in
source. It failed — on the comment in `events.ts` that says _"No meeting URL,
meeting ID or passcode exists anywhere."_ The scan was flagging the sentence
documenting the prohibition.

The naive fix is worse than the problem. Stripping everything after `//` also
deletes any line containing `https://…`, which would silently hide a **real**
leaked URL inside a string literal — a false negative in a security scan.

So `src/lib/strip-comments.ts` walks the source tracking string, template and
escape state, and strips comments only outside them. It has its own test file,
including a case asserting `"https://zoom.us/j/123"` survives. Proved by
break-check: with the stripper in place, planting a real Zoom join URL in a
string still fails the suite.
