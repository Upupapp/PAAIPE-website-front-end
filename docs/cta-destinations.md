# CTA destination matrix

Required by Tab 05. Every call to action on the site, what it points at, and
what a visitor sees today.

Nothing is configured yet (**B-4**), so every external handoff renders a
disabled control with its reason in visible text. None is a `#`, an empty
`href`, a `javascript:` URL, a dummy submit or a fabricated success — a browser
test walks every page and asserts no dead href exists anywhere.

## External handoffs

All six resolve through one resolver, `resolveExternalAction()`.

| Action                                            | Config value                        | Appears on                        | State today     | Shown instead                            |
| ------------------------------------------------- | ----------------------------------- | --------------------------------- | --------------- | ---------------------------------------- |
| Join PAAIPE / Apply for Membership                | `PUBLIC_MEMBERSHIP_APPLICATION_URL` | Header, home hero, home final CTA | **Unavailable** | Applications opening soon                |
| Member Sign In                                    | `PUBLIC_MEMBER_PORTAL_URL`          | Header                            | **Unavailable** | Member Portal opening soon               |
| Check Application Status                          | `PUBLIC_APPLICATION_STATUS_URL`     | Style guide (Tab 09 will use it)  | **Unavailable** | Application status checking opening soon |
| Propose a Session / Express Interest as a Speaker | `PUBLIC_SPEAKER_INTEREST_URL`       | Home monthly-event section        | **Unavailable** | Speaker proposals opening soon           |
| Start a Partnership Conversation                  | `PUBLIC_PARTNERSHIP_INTEREST_URL`   | Home partnership section          | **Unavailable** | Partnership enquiries opening soon       |
| Contact PAAIPE                                    | `PUBLIC_CONTACT_EMAIL`              | Footer, 404                       | **Unavailable** | Contact channel being finalized          |

When configured, each becomes a real link. Contact becomes a `mailto:` and is
deliberately **not** marked as opening a new browsing context — it opens a mail
client, not a tab.

## Internal navigation on the home page

Real `<a href>` links to real routes, working with JavaScript disabled.

| Label                  | Destination  | Section                     |
| ---------------------- | ------------ | --------------------------- |
| Explore Our Mission    | `/about`     | Hero (secondary CTA)        |
| View All Programs      | `/programs`  | Programmes preview          |
| Explore Events         | `/events`    | Monthly event (primary CTA) |
| Review Member Benefits | `/benefits`  | Benefits preview            |
| Explore Resources      | `/resources` | Insights preview            |
| Privacy Notice         | `/privacy`   | Updates consent line        |
| Partner with PAAIPE    | `/partners`  | Partnership invitation      |
| Contact Us             | `/contact`   | Final CTA (secondary)       |

## Things that deliberately go nowhere

| Element                             | Why                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The three insights preview cards    | Nothing is published. They carry a **Coming soon** badge and contain **no link or button at all**, so none can be opened, read now or downloaded. Asserted by test.                                     |
| The updates signup field and button | No approved endpoint exists. There is **no `<form>` element**, both controls are disabled, and the reason is visible text. Nothing typed is sent or stored — a test asserts `localStorage` stays empty. |

## The single primary action

**Join PAAIPE.** It is the only `primary` button on the home page, appearing in
the hero and again in the final CTA. Everything else is secondary, ghost or a
plain link, so the page has one obvious next step.
