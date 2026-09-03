# HTML validation configuration

`npm run verify:html` runs [html-validate](https://html-validate.org) over the
**built** output — `dist/**/*.html` — with `html-validate:recommended` plus
`html-validate:document`.

It reads the build, not the templates, because a template is not what a browser
parses. Astro composes components, and a nesting error only exists in the
composed document.

## Rules configured away from their preset default

Four rules are turned off and one is narrowed. Each is a stylistic preference
about _source_ formatting that cannot apply to generated output, or a rule
narrowed back to its own documented purpose. **No rule that can detect a real
defect is disabled.**

| Rule                      | Setting       | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `void-style`              | off           | Whether Astro emits `<meta …>` or `<meta … />` is the renderer's choice, not ours, and both parse identically.                                                                                                                                                                                                                                                                                                                                                                                                    |
| `no-trailing-whitespace`  | off           | Minified output. Nothing reads it as source.                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `attribute-boolean-style` | off           | Astro emits `hidden` and `hidden=""` for the same thing depending on how the value was computed. Both are correct HTML.                                                                                                                                                                                                                                                                                                                                                                                           |
| `no-inline-style`         | off           | `LogoLockup` sets its size through CSS custom properties on a `style` attribute, because the values are per-instance and computed from the artwork's measured padding. A stylesheet cannot express a per-instance number.                                                                                                                                                                                                                                                                                         |
| `require-sri`             | `crossorigin` | **Narrowed to the rule's own stated scope, not disabled.** Subresource Integrity protects against a _third party_ serving different bytes than expected. Every script and stylesheet here is same-origin, content-hashed by Vite, and served from the same deploy as the HTML that references it — an SRI hash over our own build adds no guarantee. A cross-origin script would still fail this rule, _and_ `npm run verify:budgets`, _and_ the e2e test asserting a page load makes zero cross-origin requests. |

## One real defect this found

`AnnouncementBar` used `<div role="region" aria-label="Announcement">`.
`prefer-native-element` flagged it: `<section>` with an accessible name carries
the same semantics natively. The markup now uses `<section>`, which is
one fewer ARIA attribute doing a job the platform already does.

## What this does not check

HTML validation is a syntax and semantics check on markup. It says nothing about
whether the content is true, whether a link resolves (`npm run verify:links`),
whether the page is usable with a screen reader (`docs/accessibility-report.md`,
which records that the manual pass has **not** been done), or whether the
metadata is right (`npm run verify:seo`).
