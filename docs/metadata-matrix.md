# Route metadata matrix

> **Generated file.** Produced from `src/config/routes.ts` by
> `npm run metadata:write`. `npm run metadata:check` fails if it drifts.
> Edit the registry, not this document.

18 routes are declared. 12 are indexed in a production build.

## Per-route metadata

| Route | Title | Title source | Meta description | Indexability | Social title |
| --- | --- | --- | --- | --- | --- |
| `/` | PAAIPE - Filipino AI Professionals and Entrepreneurs | tab-14 | Join a Filipino community advancing practical, responsible AI through learning, professional events, useful resources and meaningful collaboration. | indexed | Building the Philippines’ AI-Powered Future—Together. |
| `/about` | About PAAIPE - Mission, Vision and Community | tab-14 | Learn why PAAIPE is building a connected, capable and responsible community of Filipino AI professionals and entrepreneurs. | indexed | About PAAIPE - Mission, Vision and Community |
| `/programs` | Programs - PAAIPE | tab-14 | Explore PAAIPE programs for AI education, professional learning, community exchange and responsible innovation. | indexed | Programs - PAAIPE |
| `/events` | AI Events and Workshops - PAAIPE | tab-14 | PAAIPE events, the monthly Members AI Exchange, and how the Filipino AI community meets practitioners and subject-matter experts. | indexed | AI Events and Workshops - PAAIPE |
| `/events/[slug]` | Event - PAAIPE | derived | _none_ | noindex - template | Event - PAAIPE |
| `/speakers` | Speak at PAAIPE - Share Practical AI Expertise | tab-07 | Propose a session for the PAAIPE community. What a session involves, how proposals are reviewed, and how to express interest. | indexed | Speak at PAAIPE - Share Practical AI Expertise |
| `/resources` | AI Insights and Resources - PAAIPE | tab-14 | Clear explanations, practical frameworks and responsible-use guidance for Filipino professionals and entrepreneurs working with AI. | indexed | AI Insights and Resources - PAAIPE |
| `/resources/[slug]` | Resource - PAAIPE | derived | _none_ | noindex - template | Resource - PAAIPE |
| `/membership` | PAAIPE Membership - Learn, Connect and Build | tab-14 | Apply to join a verified community of Filipino AI professionals and entrepreneurs with access to events, resources and collaborative opportunities. | indexed | PAAIPE Membership - Learn, Connect and Build |
| `/benefits` | Member Benefits - PAAIPE | derived | The kinds of benefit PAAIPE membership works towards, and the conditions each depends on. | indexed | Member Benefits - PAAIPE |
| `/partners` | Partner with PAAIPE | tab-14 | Work with PAAIPE to support practical AI learning, responsible adoption and professional collaboration in the Philippines. | indexed | Partner with PAAIPE |
| `/responsible-ai` | Responsible AI Principles - PAAIPE | tab-10 | The principles PAAIPE encourages for AI adoption: human accountability, transparency, privacy, fairness, verification and continuous learning. | indexed | Responsible AI Principles - PAAIPE |
| `/contact` | Contact PAAIPE | tab-14 | How to reach PAAIPE about membership, programs, speaking opportunities, partnerships, media and other organization matters. | indexed | Contact PAAIPE |
| `/privacy` | Privacy Notice - PAAIPE | tab-14 | The structure the PAAIPE Privacy Notice will follow. Draft for review, not yet in force. | noindex - draft content | Privacy Notice - PAAIPE |
| `/terms` | Terms of Use - PAAIPE | tab-14 | The structure the PAAIPE Terms of Use will follow. Draft for review, not yet in force. | noindex - draft content | Terms of Use - PAAIPE |
| `/accessibility` | Accessibility - PAAIPE | tab-14 | How PAAIPE works toward accessible digital information, what is checked on every build, and how to report a barrier. | indexed | Accessibility - PAAIPE |
| `/internal/style-guide` | Internal style guide - PAAIPE | derived | _none_ | not built in production | Internal style guide - PAAIPE |
| `/404` | Page Not Found - PAAIPE | derived | _none_ | noindex - error page | Page Not Found - PAAIPE |

## Defaults

These apply wherever a route supplies no override. Every value is composed from
`src/config/site.ts`, not retyped, so a change to the approved identity cannot
leave a stale copy behind.

| Field | Value |
| --- | --- |
| Social title | Building the Philippines’ AI-Powered Future—Together. |
| Social description | PAAIPE connects Filipino AI professionals and entrepreneurs through practical learning, responsible innovation and meaningful collaboration. |
| Social image alt | PAAIPE—Philippine Association of AI Professionals and Entrepreneurs. |
| Social image | `/social/paaipe-social-card.png` (1200x630 image/png) |

## What is absent, and why

**Canonical URLs, `og:url`, `og:image` and the sitemap are not emitted.**
Each needs an absolute URL, and `PUBLIC_SITE_URL` is not configured - owner
item **B-7**. A guessed origin would be worse than none: a canonical tag tells
a crawler the authoritative address of a page, and a wrong one de-indexes the
real page. `twitter:card` degrades from `summary_large_image` to `summary`
for the same reason, rather than declaring an image it cannot supply.

Set `PUBLIC_SITE_URL` and all of it appears with no code change.
`src/tests/seo.test.ts` asserts that configured state, since no build on a
developer machine reaches it.

**`hreflang` alternates are not emitted.** There is no translated version of
this site. Declaring one would point crawlers at pages that do not exist.

**No `Event`, `Article`, `BlogPosting`, `Offer`, `AggregateRating` or
`Review` structured data is emitted.** Nothing in the content registry is
`approved`, so every one of those would be a fabricated claim in
machine-readable form. The builders exist and are tested; they return `null`.

**No `og:image` text.** The branded card is the exact approved logo on brand
navy, with no rendered words, because no typeface is approved - owner item
**B-5**. The words are carried by `og:image:alt` and `og:title`, where they
need no font.
