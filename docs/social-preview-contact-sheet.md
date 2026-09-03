# Social preview contact sheet

> **Generated file.** Produced from `src/config/routes.ts` and `src/lib/seo.ts`
> by `npm run handoff:write`.

What each route sends to a social platform. This is the sheet to check before
anything is shared publicly.

## The card

| | |
| --- | --- |
| File | `/social/paaipe-social-card.png` |
| Size | 1200 × 630 (the Open Graph 1.91:1 slot) |
| Type | image/png |
| Alt text | PAAIPE—Philippine Association of AI Professionals and Entrepreneurs. |
| Built from | The exact approved horizontal logo rendition, composited on brand navy |
| Verified by | `npm run verify:social` — re-composites and compares pixels |

**It carries no rendered text.** The approved default social title is the
slogan, and setting it across the card would be the obvious thing to do — but no
typeface is approved (B-5), so it would mean choosing a face on PAAIPE's behalf
and baking it into an image that appears on every share. The words travel in
`og:image:alt` and `og:title`, where they need no font.

## Per-route preview copy

12 indexed routes. Each row is what a platform reads.

| Route | og:title | og:description |
| --- | --- | --- |
| `/` | Building the Philippines’ AI-Powered Future—Together. | Discover PAAIPE-a professional community helping Filipino talent and organizations learn, connect and move forward with AI responsibly. |
| `/about` | About PAAIPE - Mission, Vision and Community | Learn why PAAIPE is building a connected, capable and responsible community of Filipino AI professionals and entrepreneurs. |
| `/programs` | Programs - PAAIPE | Explore PAAIPE programs for AI education, professional learning, community exchange and responsible innovation. |
| `/events` | AI Events and Workshops - PAAIPE | PAAIPE events, the monthly Members AI Exchange, and how the Filipino AI community meets practitioners and subject-matter experts. |
| `/speakers` | Speak at PAAIPE - Share Practical AI Expertise | Propose a session for the PAAIPE community. What a session involves, how proposals are reviewed, and how to express interest. |
| `/resources` | AI Insights and Resources - PAAIPE | Clear explanations, practical frameworks and responsible-use guidance for Filipino professionals and entrepreneurs working with AI. |
| `/membership` | PAAIPE Membership - Learn, Connect and Build | Apply to join a verified community of Filipino AI professionals and entrepreneurs with access to events, resources and collaborative opportunities. |
| `/benefits` | Member Benefits - PAAIPE | The kinds of benefit PAAIPE membership works towards, and the conditions each depends on. |
| `/partners` | Partner with PAAIPE | Work with PAAIPE to support practical AI learning, responsible adoption and professional collaboration in the Philippines. |
| `/responsible-ai` | Responsible AI Principles - PAAIPE | The principles PAAIPE encourages for AI adoption: human accountability, transparency, privacy, fairness, verification and continuous learning. |
| `/contact` | Contact PAAIPE | How to reach PAAIPE about membership, programs, speaking opportunities, partnerships, media and other organization matters. |
| `/accessibility` | Accessibility - PAAIPE | How PAAIPE works toward accessible digital information, what is checked on every build, and how to report a barrier. |

## What is NOT emitted today, and why

`og:url` and `og:image` need an **absolute** URL, and `PUBLIC_SITE_URL` is not
configured (**B-7**). So neither is emitted, and `twitter:card` is `summary`
rather than `summary_large_image` — declaring a large image the page cannot
supply would produce a broken card.

**A share today shows title and description, with no image.** Setting
`PUBLIC_SITE_URL` turns the image on with no code change;
`src/tests/seo.test.ts` covers that configured state, because no build on a
developer machine reaches it.

## Defaults

| Field | Value |
| --- | --- |
| Default social title | Building the Philippines’ AI-Powered Future—Together. |
| Default social description | PAAIPE connects Filipino AI professionals and entrepreneurs through practical learning, responsible innovation and meaningful collaboration. |
| Image alt | PAAIPE—Philippine Association of AI Professionals and Entrepreneurs. |

All three are composed from `src/config/site.ts` rather than retyped, so a
change to the approved identity cannot leave a stale copy behind.
