# Configuration reference

> **Generated file.** Produced from `src/config/public-config.ts` by
> `npm run handoff:write`. A key added to the code with no row here fails the
> generator, so this cannot fall behind.

## Every value is PUBLIC

These are inlined into the built client at build time. **Never put a secret, a
token, a private Zoom link or a protected download URL here** — anything in this
file is readable by every visitor. `npm run verify:leak` scans the built bundle
and fails on a credential-shaped value.

Copy `.env.example` to `.env` and fill in what you have. **Every value is
optional.** A missing destination degrades to an honest unavailable state; it
never becomes `#`, an empty `href`, or a fabricated success.

| Name | What it is | Expected format | If it is absent | Blocker | Owner |
| --- | --- | --- | --- | --- | --- |
| `PUBLIC_SITE_URL` | The production origin | Absolute `https://` URL | No canonical, `og:url`, `og:image` or `sitemap.xml` is emitted; `twitter:card` degrades to `summary` | B-7 | PAAIPE |
| `PUBLIC_MEMBERSHIP_APPLICATION_URL` | Where “Join PAAIPE” goes | Absolute `https://` URL | A disabled button plus a visible reason | B-4 | PAAIPE |
| `PUBLIC_MEMBER_PORTAL_URL` | Where “Member Sign In” goes | Absolute `https://` URL | A disabled button plus a visible reason | B-4 | PAAIPE |
| `PUBLIC_APPLICATION_STATUS_URL` | Where an applicant checks their status | Absolute `https://` URL | A disabled button plus a visible reason | B-4 | PAAIPE |
| `PUBLIC_SPEAKER_INTEREST_URL` | Where a speaker proposal goes | Absolute `https://` URL | A disabled button plus a visible reason | B-4 | PAAIPE |
| `PUBLIC_PARTNERSHIP_INTEREST_URL` | Where a partnership enquiry goes | Absolute `https://` URL | A disabled button plus a visible reason | B-4 | PAAIPE |
| `PUBLIC_CONTACT_EMAIL` | The public contact address | An email address | A disabled control plus a visible reason; no `mailto:` is invented | B-4 | PAAIPE |

| Name | What it is | Values | Default |
| --- | --- | --- | --- |
| `PUBLIC_CONTENT_MODE` | Which content a build may publish | `production` \| `review` | `production` — the safe one, so an unconfigured build cannot publish fixtures |

## A malformed value is treated as ABSENT, and reported

This is deliberate and worth understanding before setting anything:

- a value that is not a valid absolute URL is **rejected**, not passed through;
- an `http://` URL is **rejected** as insecure, so a plaintext destination
  cannot ship as mixed content;
- a rejected value is reported at build time, so a typo surfaces rather than
  becoming a dead link.

The consequence: **setting a destination wrongly looks exactly like not setting
it.** The control stays disabled with its reason visible. That is the safe
failure, and `npm run release:gate` will still report the blocker as unmet —
which is the signal that something was set incorrectly.

## Current state

- **B-4** — All seven PUBLIC_* destinations: PUBLIC_SITE_URL, PUBLIC_MEMBERSHIP_APPLICATION_URL, PUBLIC_MEMBER_PORTAL_URL, PUBLIC_APPLICATION_STATUS_URL, PUBLIC_SPEAKER_INTEREST_URL, PUBLIC_PARTNERSHIP_INTEREST_URL, PUBLIC_CONTACT_EMAIL. Supplied by PAAIPE.
- **B-5** — An approved typeface with a self-hosting licence. Supplied by PAAIPE.
- **B-6** — Approved imagery in `public/media/`, and the Philippine map contour. Supplied by PAAIPE.
- **B-7** — The APPROVED production origin — not merely a configured `PUBLIC_SITE_URL`. Supplied by PAAIPE.
- **B-8** — Hosting owner, atomic release method, rollback, monitoring and incident contacts. Supplied by PAAIPE / the hosting owner.
- **B-9** — Approved legal text for `/privacy` and `/terms`. Supplied by PAAIPE / legal review.

Run `npm run release:gate` for the live status; it reads the environment on
every run rather than trusting a recorded answer.
