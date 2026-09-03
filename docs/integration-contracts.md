# Frontend integration contracts

Nine future adapters. **Documented, not implemented.**

Tab 16 is explicit: _"Document but do not implement future adapters."_ Nothing
in this file exists in the codebase. There is no fetch, no API client, no
endpoint constant, and no environment variable pointing at a server. Owner
ruling 2026-09-04 restated the wall after a PAAIPE backend lane was created:
**the front end stays static and front end only** until a separate written
command from PAAIPE says otherwise.

No credential appears here, and no endpoint is invented. Where a URL is unknown
it says **unknown**.

---

## How to read the "current fallback" column

Every unconfigured destination today renders the **same** honest state: a
disabled control with a visible reason in text beside it. Never a `#`, never an
empty `href`, never a `mailto:` we guessed, and never a fabricated success
message.

That is enforced by type, not by discipline. The external-action resolver
returns one of two shapes, and the `unavailable` one **has no `href` field at
all** — so a template cannot render a dead link even by mistake:

```ts
{
  state: 'available';
  href: string;
  kind: 'url' | 'email';
}
{
  state: 'unavailable';
  message: string;
}
```

---

## 1. Membership application destination

|               |                                                                                                                       |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Owner**     | PAAIPE                                                                                                                |
| **Blocker**   | B-4                                                                                                                   |
| **Interface** | A public `https://` URL. `PUBLIC_MEMBERSHIP_APPLICATION_URL`                                                          |
| **Shape**     | An outbound link. The visitor leaves the site                                                                         |
| **Loading**   | None. A link navigates                                                                                                |
| **Success**   | Owned by the destination. This site never reports one                                                                 |
| **Error**     | Owned by the destination                                                                                              |
| **Privacy**   | Applicant data is collected **there**, never here. No field on this site collects a name, an email or an organisation |
| **Fallback**  | Disabled "Join PAAIPE" button, with "Applications opening soon" beside it                                             |

**Do not replace this with a form on this site** without a separate ruling. A
form here would need an endpoint, which is a backend, which is outside this
lane's scope — and a form that posts nowhere is the fabricated-success failure
the master command forbids.

## 2. Member Portal sign-in destination

|                     |                                                                                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**           | PAAIPE                                                                                                                                                                     |
| **Blocker**         | B-4                                                                                                                                                                        |
| **Interface**       | A public `https://` URL. `PUBLIC_MEMBER_PORTAL_URL`                                                                                                                        |
| **Shape**           | An outbound link to a system that owns authentication                                                                                                                      |
| **Success / error** | Owned by the portal                                                                                                                                                        |
| **Privacy**         | **No credential may ever be typed on this site.** No password field exists, and none may be added — the public site must never be a place where a member enters a password |
| **Fallback**        | Disabled "Member Sign In" button, "Member Portal opening soon" beside it                                                                                                   |

**The highest-risk integration on this list.** A sign-in form on a public
information site is a phishing surface even when it is genuine, because it
trains members to type credentials wherever they see PAAIPE branding. The link
must go to the portal's own origin.

## 3. Application-status destination

|               |                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**     | PAAIPE                                                                                                                              |
| **Blocker**   | B-4                                                                                                                                 |
| **Interface** | A public `https://` URL. `PUBLIC_APPLICATION_STATUS_URL`                                                                            |
| **Privacy**   | Status is **member data**. It must not be readable from a URL a third party could guess, and no status may be rendered on this site |
| **Fallback**  | Disabled control with its reason                                                                                                    |

The `applicant-pending` viewer state exists in the type system for component
tests only. **The public build always supplies `public`**, and the state is never
derived from a query parameter, a cookie, storage or a fake sign-in. If a real
status view is ever wanted, that is authenticated and belongs in the portal.

## 4. Speaker-interest destination

|               |                                                                             |
| ------------- | --------------------------------------------------------------------------- |
| **Owner**     | PAAIPE                                                                      |
| **Blocker**   | B-4                                                                         |
| **Interface** | A public `https://` URL. `PUBLIC_SPEAKER_INTEREST_URL`                      |
| **Privacy**   | Proposals contain personal and professional data. Collected there, not here |
| **Fallback**  | Disabled control on `/speakers`, with the reason visible                    |

The page already carries the approved disclaimer that submission does not
guarantee selection. Keep it beside the control wherever the control moves.

## 5. Partnership-interest destination

|               |                                                            |
| ------------- | ---------------------------------------------------------- |
| **Owner**     | PAAIPE                                                     |
| **Blocker**   | B-4                                                        |
| **Interface** | A public `https://` URL. `PUBLIC_PARTNERSHIP_INTEREST_URL` |
| **Privacy**   | Commercial enquiry data. Collected there                   |
| **Fallback**  | Disabled control on `/partners`                            |

**No partner may be shown until formally approved.** The partner registry is
empty by construction, and the approved-partner schema requires an `approvedOn`
date. A logo on this site is a claim about a real organisation.

## 6. Contact or newsletter endpoint

|                               |                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**                     | PAAIPE                                                                                                                                       |
| **Blocker**                   | B-4                                                                                                                                          |
| **Interface**                 | `PUBLIC_CONTACT_EMAIL` for contact. **The newsletter endpoint does not exist and no name is reserved for it**                                |
| **Shape**                     | Contact is a `mailto:`. A newsletter would be a POST to a service                                                                            |
| **Loading / success / error** | Would need a real live region, a real error path, and a real duplicate-submission answer. None exists                                        |
| **Privacy**                   | An email address is personal data. A **just-in-time notice** belongs beside the field at the moment of entry, not only in the privacy notice |
| **Fallback**                  | The "Stay updated" block renders a disabled field and button with the reason in text. **There is no `<form>` element**                       |

**The absent `<form>` is deliberate.** With no endpoint, a form element could
only ever produce a false success — the browser would navigate, or the page
would lie. `npm run audit:content` fails on a fabricated success message, and
`tests/e2e/journeys.spec.ts` asserts `main form` count is **0** on the handoff
pages.

Adding this needs three things beyond a URL: a consent decision, a spam
strategy, and an answer to what a duplicate submission does.

## 7. Approved public CMS or content service

|                     |                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| **Owner**           | PAAIPE                                                                                                 |
| **Interface**       | **Unknown.** No service is chosen and none may be assumed                                              |
| **Shape**           | Would replace the typed registries under `src/content/` as the source of records                       |
| **Loading / error** | A build-time fetch: a fetch failure must **fail the build**, never publish a page with content missing |
| **Privacy**         | Depends entirely on the service. A CMS that stores member data is not a public content service         |
| **Fallback**        | The typed registries, validated by Zod at module load                                                  |

**Four properties the current model has that a CMS must not lose:**

1. **Two independent axes.** `visibility` (public / members-only) and
   `contentStatus` (approved / draft / sample). A CMS that models publication as
   one boolean destroys the distinction, and members-only content starts
   publishing.
2. **Validation before render.** Records are validated when the module loads, so
   an invalid record fails the **build**. A CMS fetch must validate at the same
   boundary.
3. **Body copy is a closed block union**, never raw HTML —
   `paragraph | heading | list`. Accepting HTML from a CMS is an injection point.
4. **Cross-field rules** the schema enforces: a members-only event may not be
   `registration-open`; only an approved record may carry an approved speaker;
   only an approved record may carry a publication date; a draft policy must
   carry a review banner.

The full field list, with required/optional and what renders when a field is
absent, was sent to the `paaipe-backend` lane on 2026-09-04 as an ALIGN message.

## 8. Analytics and consent service

|               |                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**     | PAAIPE                                                                                                                                                |
| **Interface** | **Unknown.** None is approved, and none may be added without a written command                                                                        |
| **Shape**     | Would be a first-party endpoint receiving Core Web Vitals                                                                                             |
| **Privacy**   | No name, email, member ID, free-text field or query string may enter a payload. A coarse route identifier from the route registry, never the full URL |
| **Fallback**  | **None loads.** No pixel, no fingerprinting, no session replay                                                                                        |

**Adding this deliberately breaks a gate.** `npm run verify:budgets` **fails** on
any analytics endpoint, and an e2e test asserts a page load makes **zero**
cross-origin requests. Someone must change those gates on purpose — which is the
point.

Consent rules if it is ever approved: nothing non-essential loads before consent,
and **Reject Optional must be as prominent and as easy as Accept** — same size,
same contrast, same number of clicks. No cookie interface is shown today, because
nothing needs consent, and a banner for a site that stores nothing would be a
false statement about what it does.

The real-user monitoring plan is in `docs/performance-report.md` §3. It is a
plan; it is not implemented.

## 9. Event registration service

|                               |                                                                                                                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**                     | PAAIPE                                                                                                                                                                                                                                              |
| **Interface**                 | **Unknown.** No registration URL exists in any record, and none may be added for a members-only session                                                                                                                                             |
| **Shape**                     | Per-event outbound link, for **public** events only                                                                                                                                                                                                 |
| **Loading / success / error** | Owned by the service                                                                                                                                                                                                                                |
| **Privacy**                   | **The hardest boundary on this list.** A private Zoom URL, a meeting ID or a passcode must never enter this codebase in any form                                                                                                                    |
| **Fallback**                  | Registration state renders as an approved label — `registration-open`, `members-only`, `limited-capacity`, `registration-closed`, `event-completed`, `recording-available-to-eligible-members`, `announcement-coming-soon` — with no link behind it |

**Two structural protections that must survive this integration:**

- `publicEventFields()` returns an object that, for a members-only event,
  **does not carry** a registration field. There is no key a meeting URL could
  occupy.
- `npm run verify:leak` scans the **built bundle** in both content modes and
  fails on a Zoom join URL, a meeting-ID field, a passcode, a signed URL or a
  protected asset path.

`limited-capacity` is refused by schema unless `capacityConfigured` is true — the
label may not be shown without real capacity data behind it.

---

## What a future integration must not quietly change

| Property                               | Why it is load-bearing                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Static output                          | No server runtime is part of the threat model. Adding one changes what a compromise costs |
| No credential typed on this site       | See §2                                                                                    |
| The two content axes                   | See §7                                                                                    |
| Body copy as a closed union            | Accepting HTML is an injection point                                                      |
| The `unavailable` shape with no `href` | It is why a dead link is unrepresentable                                                  |
| Zero cross-origin requests             | Asserted by test. It is what makes the privacy claim checkable                            |
| Nothing stored before an interaction   | Asserted by test                                                                          |

Any of these can be changed — by a written command from PAAIPE that says so,
with the cost understood. None should change by accident while wiring up a URL.
