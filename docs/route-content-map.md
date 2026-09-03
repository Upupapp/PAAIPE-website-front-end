# Route and content map

> **Generated file.** Produced from `src/config/routes.ts` by
> `npm run handoff:write`. `npm run handoff:check` fails if it drifts.

Every route the frontend declares, with its H1, where that copy came from, its
browser title, whether it is indexed, which tab implemented it, and what still
needs PAAIPE's approval.

| Route | H1 | H1 source | Title | Indexability | Implemented in | Approval still needed |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Building the Philippines’ AI-Powered Future—Together. | Tab 05 (approved) | PAAIPE - Filipino AI Professionals and Entrepreneurs | indexed | Tab 05 | Copy approved |
| `/about` | A stronger Philippine AI future starts with a stronger community. | Tab 06 (approved) | About PAAIPE - Mission, Vision and Community | indexed | Tab 06 | Copy approved |
| `/programs` | From understanding AI to creating real-world value | Tab 06 (approved) | Programs - PAAIPE | indexed | Tab 06 | Copy approved |
| `/events` | Conversations that turn fast-moving AI ideas into useful understanding | Tab 07 (approved) | AI Events and Workshops - PAAIPE | indexed | Tab 07 | Copy approved |
| `/events/[slug]` | Event detail template | **derived — needs approval (B-3)** | Event - PAAIPE | noindex (template) | Tab 07 | Copy needs PAAIPE approval (B-3) |
| `/speakers` | Share what you know. Help move Filipino AI capability forward. | Tab 07 (approved) | Speak at PAAIPE - Share Practical AI Expertise | indexed | Tab 07 | Copy approved |
| `/resources` | Useful AI knowledge for real people and real work | Tab 08 (approved) | AI Insights and Resources - PAAIPE | indexed | Tab 08 | Copy approved |
| `/resources/[slug]` | Resource detail template | **derived — needs approval (B-3)** | Resource - PAAIPE | noindex (template) | Tab 08 | Copy needs PAAIPE approval (B-3) |
| `/membership` | Build your AI future with people who want the Philippines to move forward. | Tab 09 (approved) | PAAIPE Membership - Learn, Connect and Build | indexed | Tab 09 | Copy approved |
| `/benefits` | Benefits designed to help members learn, build and connect. | Tab 09 (approved) | Member Benefits - PAAIPE | indexed | Tab 09 | Copy needs PAAIPE approval (B-3) |
| `/partners` | Help expand access to meaningful AI opportunity in the Philippines. | Tab 10 (approved) | Partner with PAAIPE | indexed | Tab 10 | Copy approved |
| `/responsible-ai` | Progress with people, responsibility and trust at the center. | Tab 10 (approved) | Responsible AI Principles - PAAIPE | indexed | Tab 10 | Copy approved |
| `/contact` | Let’s start a useful conversation. | Tab 10 (approved) | Contact PAAIPE | indexed | Tab 10 | Copy approved |
| `/privacy` | Privacy Notice | **derived — needs approval (B-3)** | Privacy Notice - PAAIPE | noindex (draft content) | Tab 10 | Copy needs PAAIPE approval (B-3) |
| `/terms` | Terms of Use | **derived — needs approval (B-3)** | Terms of Use - PAAIPE | noindex (draft content) | Tab 10 | Copy needs PAAIPE approval (B-3) |
| `/accessibility` | Accessibility at PAAIPE | Tab 10 (approved) | Accessibility - PAAIPE | indexed | Tab 10 | Copy approved |
| `/internal/style-guide` | PAAIPE design system | **derived — needs approval (B-3)** | Internal style guide - PAAIPE | not built in production | Tab 02 | Copy needs PAAIPE approval (B-3) |
| `/404` | This page wandered off the map. | Tab 10 (approved) | Page Not Found - PAAIPE | noindex (error page) | Tab 10 | Copy needs PAAIPE approval (B-3) |

## Where the content comes from

Nothing on a page is authored in the page. Every string is imported from a typed
registry under `src/content/`, validated by Zod **at module load** - so an
invalid record fails the build rather than rendering.

| Registry | Records | Notes |
| --- | --- | --- |
| `organization.ts` | identity, audiences, values, the signature event | Quoted verbatim from the master command |
| `home.ts` | the eleven home sections | |
| `about.ts`, `programs.ts` | about copy, 7 programmes | |
| `events.ts` | event fixtures | **None is `approved`** — a production build renders zero detail pages |
| `resources.ts` | 10 resource fixtures | **None is `approved`** — same |
| `speakers.ts` | **empty** | A name or portrait is a claim about a real person |
| `partners.ts` | **empty** | A logo is a claim about a real organisation |
| `benefits.ts`, `faqs.ts` | benefit categories, 7 FAQs | |
| `policies.ts` | `/privacy`, `/terms` | Both `draft-for-review` (B-9) |
| `navigation.ts`, `legal.ts` | nav and footer structure | |

## The two states that control publication

`visibility` says who content is **for**; `contentStatus` says whether it may be
**published**. They are independent, and both are enforced by schema rather than
by convention:

- a members-only event may not be `registration-open`;
- only an `approved` record may carry an approved speaker;
- a members-only resource may not carry public body copy;
- only an `approved` record may carry a publication date;
- a draft policy must carry a review banner.

Each of those refusals is a build failure, not a warning.
