import type { PublicResource } from './types';

/**
 * Resource fixtures.
 *
 * Every record below carries `contentStatus: 'sample'`. They are REVIEW
 * FIXTURES, stripped from a production build, and they exist so the resources
 * templates can be reviewed before real articles are written.
 *
 * Constraints the master command puts on sample content, all held here:
 *  - No `publishedAt`. Claiming a publication date would be a lie, and the
 *    schema refuses one on non-approved content.
 *  - No author or byline. Nobody wrote these.
 *  - No certification, partnership or measurable-result claim.
 *  - No `publicBody` on a members-only record, so nothing protected can leak.
 *  - Neutral placeholder imagery: no approved photography exists (B-6).
 *
 * The five titles are those listed in Tab 03; the sixth onward are the
 * additional preview cards named in Tab 08.
 */
export const RESOURCES: readonly PublicResource[] = [
  {
    slug: 'what-ai-is-and-isnt',
    title: "What AI Is-and What It Isn't",
    excerpt:
      'Understand the difference between pattern-based generation, information retrieval, automation and human judgment.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'insight',
    topics: ['AI Foundations'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/what-ai-is-and-isnt.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'can-ai-be-wrong',
    title: 'Can AI Be Wrong?',
    excerpt:
      'Where AI-generated answers come from, why they can be confidently incorrect, and what to check before acting on one.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'guide',
    topics: ['AI Foundations', 'Responsible AI'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/can-ai-be-wrong.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'ai-adoption-starter-kit',
    title: 'AI Adoption Starter Kit',
    excerpt:
      'A structured starting point for teams introducing AI into existing work, with the decisions that must stay accountable.',
    visibility: 'members-only',
    contentStatus: 'sample',
    format: 'guide',
    topics: ['Practical Adoption'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/ai-adoption-starter-kit.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'responsible-ai-checklist-for-teams',
    title: 'Responsible AI Checklist for Teams',
    excerpt:
      'Purpose, source quality, privacy, accuracy and human oversight, as a working checklist for a team.',
    visibility: 'members-only',
    contentStatus: 'sample',
    format: 'checklist',
    topics: ['Responsible AI'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/responsible-ai-checklist-for-teams.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'from-curiosity-to-capability',
    title: 'From Curiosity to Capability',
    excerpt:
      'How individual interest in AI becomes practical capability that a team or organisation can rely on.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'insight',
    topics: ['Practical Adoption', 'Philippine AI Community'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/from-curiosity-to-capability.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'five-questions-before-automating-a-workflow',
    title: 'Five Questions to Ask Before You Automate a Workflow',
    excerpt:
      'Start with the problem, the people affected and the decisions that must remain accountable.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'guide',
    topics: ['Practical Adoption'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/five-questions-before-automating-a-workflow.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'human-centered-generative-ai-checklist',
    title: 'A Human-Centered Generative AI Checklist',
    excerpt:
      'Review purpose, source quality, privacy, accuracy and human oversight before using an AI-generated result.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'checklist',
    topics: ['Responsible AI'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/human-centered-generative-ai-checklist.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'where-small-teams-can-begin-with-ai',
    title: 'Where Small Teams Can Begin with AI',
    excerpt:
      'Look for focused, repeatable work where AI can support people without hiding responsibility.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'insight',
    topics: ['Business & Entrepreneurship'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/where-small-teams-can-begin-with-ai.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'choosing-an-ai-tool-look-beyond-the-demo',
    title: 'Choosing an AI Tool: Look Beyond the Demo',
    excerpt:
      'Evaluate fit, data handling, reliability, cost, access and the workflow around the tool.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'guide',
    topics: ['Tools & Workflows'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/choosing-an-ai-tool-look-beyond-the-demo.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
  {
    slug: 'building-ai-capability-through-community',
    title: 'Building AI Capability Through Community',
    excerpt:
      'Why shared learning, honest examples and cross-industry collaboration matter as AI adoption grows.',
    visibility: 'public',
    contentStatus: 'sample',
    format: 'insight',
    topics: ['Philippine AI Community'],
    cover: {
      kind: 'file',
      src: '/media/generated/covers/building-ai-capability-through-community.svg',
      /* Decorative: abstract brand art depicting nothing, so an empty alt is
         the correct value rather than a missing one. */
      alt: '',
      width: 1200,
      height: 675,
    },
  },
];

/** Topic filters offered on /resources. "All" is a UI affordance, not a topic. */
export const RESOURCE_TOPICS = [
  'AI Foundations',
  'Practical Adoption',
  'Responsible AI',
  'Business & Entrepreneurship',
  'Tools & Workflows',
  'Philippine AI Community',
  'Event Recaps',
] as const;

/**
 * The /resources copy. `intro` is Tab 08's approved line; everything else is the
 * owner's Resources mockup (2026-09-15, F-77).
 */
export const RESOURCES_INDEX = {
  intro:
    'Explore clear explanations, practical frameworks and responsible-use guidance created to help Filipino professionals and entrepreneurs make more informed decisions about AI.',
  /*
   * The mockup reads "PDFs, slides, videos and templates". "slides" is left out
   * while the only slide deck in it is held (B-17): the sentence would otherwise
   * promise a format the library does not contain.
   */
  introFormats:
    'PDFs, videos and templates — every resource says up front what it is and how to get it.',
  libraryLead:
    "Filter by format. Each card shows exactly what you'll get and how to get it — a file to view or download, or a link that opens elsewhere.",
  formatFilterLabel: 'Filter by format',
} as const;

/** "All formats" is a UI affordance, not a format, so it is kept out of the vocabulary. */
export const RESOURCE_FILTER_ALL = 'All formats';

/**
 * Announced upcoming articles - NOT resources.
 *
 * Tab 08 supplies these six titles and descriptions as review-safe preview
 * cards carrying a visible "Coming soon" status until real approved articles
 * exist. They are therefore APPROVED announcements and appear in a production
 * build, exactly like the home page insights preview.
 *
 * They deliberately have no slug and no href: nothing is published, so nothing
 * may be opened, read now or downloaded. They share titles with the `sample`
 * PublicResource fixtures by design - an announcement announces the future
 * article, and the fixture exercises the detail template in a review build.
 *
 * `format` and `medium` are the owner's Resources mockup (2026-09-15, F-77),
 * which also ordered the first four and reworded "Choosing an AI Tool" as a
 * worksheet. The mockup showed four of the six; the owner ruled that all six
 * stay, so the two it left out follow, with the format their titles name and
 * the medium the mockup gave every non-template announcement.
 */
export const RESOURCE_PREVIEWS = [
  {
    title: "What AI Is-and What It Isn't",
    format: 'Explainer',
    medium: 'PDF',
    topic: 'AI Foundations',
    description:
      'Understand the difference between pattern-based generation, information retrieval, automation and human judgment.',
    status: 'Coming soon',
  },
  {
    title: 'Five Questions to Ask Before You Automate a Workflow',
    format: 'Checklist',
    medium: 'PDF',
    topic: 'Practical Adoption',
    description:
      'Start with the problem, the people affected and the decisions that must remain accountable.',
    status: 'Coming soon',
  },
  {
    title: 'Where Small Teams Can Begin with AI',
    format: 'Guide',
    medium: 'PDF',
    topic: 'Business & Entrepreneurship',
    description:
      'Look for focused, repeatable work where AI can support people without hiding responsibility.',
    status: 'Coming soon',
  },
  {
    title: 'Choosing an AI Tool: Look Beyond the Demo',
    format: 'Template',
    medium: 'Template',
    topic: 'Tools & Workflows',
    description:
      'A side-by-side worksheet to evaluate fit, data handling, reliability, cost, access and the workflow around the tool.',
    status: 'Coming soon',
  },
  {
    title: 'A Human-Centered Generative AI Checklist',
    format: 'Checklist',
    medium: 'PDF',
    topic: 'Responsible AI',
    description:
      'Review purpose, source quality, privacy, accuracy and human oversight before using an AI-generated result.',
    status: 'Coming soon',
  },
  {
    title: 'Building AI Capability Through Community',
    format: 'Explainer',
    medium: 'PDF',
    topic: 'Philippine AI Community',
    description:
      'Why shared learning, honest examples and cross-industry collaboration matter as AI adoption grows.',
    status: 'Coming soon',
  },
] as const;

/**
 * The display vocabulary for resource formats, in the order the /resources
 * filter offers them.
 *
 * The owner's Resources mockup (2026-09-15, F-77) settled B-16. It names Video,
 * Presentation, Explainer, Checklist, Guide and Template, in that order. Tab 08's
 * Event recap and External reference follow, unused today. The filter offers
 * only the formats that at least one card carries, so an unused name costs
 * nothing and no choice can empty the library.
 *
 * The Tab 03 `format` enum on `PublicResource` stays the typed contract for
 * articles; RESOURCE_FORMAT_DISPLAY names it in this vocabulary.
 */
export const RESOURCE_FORMAT_VOCABULARY = [
  'Video',
  'Presentation',
  'Explainer',
  'Checklist',
  'Guide',
  'Template',
  'Event recap',
  'External reference',
] as const;

export type ResourceFormatName = (typeof RESOURCE_FORMAT_VOCABULARY)[number];

/**
 * Published resources that live on another site: linked, never embedded.
 *
 * OWNER RULING 2026-09-15 (F-77): the film "Which Side of the Change" is
 * published as a link to Streamable. A plain link loads nothing from Streamable
 * on this site - the host's own scripts run only for a visitor who follows it,
 * which is why the card names the host and says it opens in a new tab.
 *
 * "1 min" is measured, not copied: Streamable's public API gave 62.3 seconds at
 * 1920x1080, titled `paaipe-which-side-of-the-change`, the same day.
 *
 * No poster image. A frame of the film would be the first file in
 * `public/media/` outside `generated/`, and the release gate reads any such file
 * as B-6 (approved editorial imagery) SUPPLIED - which one thumbnail is not. The
 * card draws its head until the owner approves the frame as imagery.
 */
export const RESOURCE_LINKS = [
  {
    title: 'Which Side of the Change',
    format: 'Video',
    medium: 'Video · 1 min',
    detail: 'Film on Streamable · AI Exchange opening film',
    topic: 'Philippine AI Community',
    description:
      'Our short film on why PAAIPE exists: the speed of AI, what it means for Filipino jobs and industries, and the community built in response.',
    href: 'https://streamable.com/q2877z',
    host: 'streamable.com',
    actionLabel: 'Watch video',
  },
] as const;

/**
 * The locked panel for a members-only resource.
 *
 * The public route may show only cover, title, synopsis, topics, format and
 * value proposition. Nothing here is a file URL, a signed URL, a replay link or
 * a filename that would reveal protected content.
 */
export const MEMBER_RESOURCE_LOCK = {
  label: 'MEMBERS-ONLY RESOURCE',
  heading: 'Available to verified PAAIPE members',
  body: 'Get the complete guide, replay or template through the PAAIPE Members Portal.',
  applyCta: 'Apply for Membership',
  signInCta: 'Member Sign In',
  relatedCta: 'Explore Related Public Resources',
} as const;

/**
 * The members band copy. The library's former "nothing published" and "no
 * results" states are gone with the owner's layout (F-77): the library always
 * holds the film and six announcements, and the filter offers only formats
 * that have cards, so neither state can occur.
 */
export const RESOURCE_EMPTY_STATES = {
  memberPreview: {
    heading: 'More learning is available inside the Members Portal.',
    body: 'Eligible members can access selected resources, session materials and recordings when rights and availability permit.',
  },
} as const;
