# Data and technology inventory

Required by Tab 10 (and again by Tab 14). This records what this website
actually does with information — measured against the built output, not
intended behaviour.

**Status: the public site collects nothing, sends nothing to anyone, and loads
no third-party resource.**

---

## 1. Third-party services

| Vendor   | Purpose | Fields | Consent basis | Recipients | Retention |
| -------- | ------- | ------ | ------------- | ---------- | --------- |
| _(none)_ | —       | —      | —             | —          | —         |

There is no analytics, no advertising pixel, no session replay, no tag manager,
no third-party font, no embedded video and no external script of any kind.

A browser test listens to every network request on four representative pages and
asserts **zero requests leave the origin**. That is the check that would catch a
font or script being added later without this document being updated.

## 2. Information collected from visitors

| Source   | Fields | Where it goes |
| -------- | ------ | ------------- |
| _(none)_ | —      | —             |

There is no form, no `<input>` outside the internal style guide, no account and
no submission of any kind on the public site. The updates-signup presentation on
the home page is a disabled preview with no `<form>` element, and `/contact` has
no form at all.

## 3. Browser storage

| Key                             | Value           | Written when                                                   | Purpose                                                | Shared with                         |
| ------------------------------- | --------------- | -------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `paaipe:dismissed:announcement` | the literal `1` | Only when a visitor clicks the announcement bar's close button | Remembers that they closed it, so it does not reappear | Nobody. It never leaves the browser |

This is the **only** value this site stores. It is strictly functional, contains
no identifier, and is written solely in response to a deliberate user action.

The boundary is enforced, not asserted: storage APIs may appear in exactly one
allow-listed module, every `setItem` in it is matched against
`PREFIX + key, '1'`, and no file anywhere may store anything matching viewer,
member, status, token, session, email or auth. A browser test also asserts that
`localStorage` is **empty on page load** across four routes.

## 4. Cookies

None. The site sets no cookie, first-party or otherwise.

## 5. Why there is no consent banner

Tab 10 is explicit: _"Implement a cookie interface only if non-essential storage
or scripts actually exist. Necessary-only sites should not show a performative
consent banner."_

Nothing non-essential exists. A banner would ask permission for something that
is not happening, train people to dismiss consent prompts without reading them,
and imply tracking that does not occur. A browser test asserts no consent
language appears on any page.

**This changes the moment analytics is approved.** At that point a cookie
interface becomes required, Reject Optional must be as easy as Accept, and no
optional tag may load before valid consent. Tab 14 owns that work; this
document is where the trigger is recorded.

## 6. Handoffs to external destinations

Six external actions exist. **None is configured**, so none currently sends a
visitor anywhere.

| Action                   | Destination                           | Data carried                                  |
| ------------------------ | ------------------------------------- | --------------------------------------------- |
| Apply for Membership     | `PUBLIC_MEMBERSHIP_APPLICATION_URL`   | Nothing — a plain link, no query parameters   |
| Member Sign In           | `PUBLIC_MEMBER_PORTAL_URL`            | Nothing                                       |
| Check Application Status | `PUBLIC_APPLICATION_STATUS_URL`       | Nothing                                       |
| Speaker interest         | `PUBLIC_SPEAKER_INTEREST_URL`         | Nothing                                       |
| Partnership interest     | `PUBLIC_PARTNERSHIP_INTEREST_URL`     | Nothing                                       |
| Contact                  | `mailto:` from `PUBLIC_CONTACT_EMAIL` | Nothing — opens the visitor's own mail client |

No handoff appends a query parameter, referrer token or identifier. When a
destination is configured, each becomes an ordinary link with
`rel="noopener noreferrer"`.

**Each destination will have its own privacy notice**, which the privacy page
must reference once the destinations are known — that is the
`[EXTERNAL DESTINATIONS AND THEIR NOTICES]` placeholder.

## 7. Server-side logging

PAAIPE's hosting provider is not yet chosen (**B-8**), so what is logged, for
how long, and by whom is unknown. This is the `[HOSTING PROVIDER]`,
`[LOG FIELDS RETAINED]` and `[LOG RETENTION PERIOD]` placeholder set on the
privacy page, and it cannot be resolved from the frontend.

## 8. What must be revisited

| Trigger                               | What changes                                                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Analytics approved                    | Cookie interface becomes required; this inventory gains a vendor row; the privacy page gains a real analytics section |
| A real contact or newsletter endpoint | Just-in-time notice beside the field; fields, recipient and retention recorded here                                   |
| Hosting chosen                        | Section 7 becomes answerable                                                                                          |
| Any external font, script or embed    | Section 1 gains a row — and the zero-external-request test will fail first, which is the point                        |
