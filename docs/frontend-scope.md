# Frontend scope

**Status:** binding for this repository. Any change that contradicts this file
needs a separate written command from PAAIPE.

## What this build is

- This build is the **public PAAIPE information website frontend**.
- It is statically rendered. There is no server runtime, no database and no API.

## What is not included

No member dashboard, directory, profile, login, application-processing,
verification, backend, database, CMS, mobile app, protected download, private
meeting link, benefit redemption, payment, message, notification, or raffle
administration is included.

Specifically excluded:

- Members Portal screens and any protected member feature
- Native or hybrid mobile app
- Backend, database, CMS, server actions, real form processing
- Authentication, password flows, member verification
- Private Zoom links, protected downloads, benefit codes, AI-token allocations,
  payments, raffle administration, messaging, notifications
- Fabricated member counts, testimonials, impact statistics, founding dates,
  speakers, partners, discounts or endorsements

## External handoffs

- External handoffs may be configured, but **missing destinations must render
  honest unavailable states**.
- A missing destination must never become `#`, `javascript:`, an empty `href`, a
  dummy form submission, a local-storage write, or a fake success message.
- Configuration is validated centrally in `src/config/public-config.ts`. A value
  that is present but malformed is treated as absent and reported, so a typo
  cannot ship as a dead link.

## Data handling

- **No private or secret data belongs in client code, fixtures, HTML, build
  artifacts, screenshots, or source maps.**
- Every configuration name is `PUBLIC_`-prefixed and inlined into the client
  bundle at build time. Nothing else may be read from the environment.
- `src/tests/scope-boundary.test.ts` scans frontend source for Zoom links,
  credential-shaped assignments, non-public env reads, dead hrefs, browser
  storage and auth/payment surfaces. Tab 15 extends this to the built bundle;
  a source scan alone is not proof.

## Routes

The complete public route list lives in `src/config/routes.ts` and is asserted
against the pages on disk by `src/tests/routes.test.ts`.

`/dashboard`, `/community`, `/profile`, `/login` and any other protected route
must not exist. This is enforced by test, not by convention.
