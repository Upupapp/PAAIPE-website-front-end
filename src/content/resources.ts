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
    cover: { kind: 'placeholder', tone: 'navy' },
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
    cover: { kind: 'placeholder', tone: 'cyan' },
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
    cover: { kind: 'placeholder', tone: 'surface' },
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
    cover: { kind: 'placeholder', tone: 'navy' },
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
    cover: { kind: 'placeholder', tone: 'surface' },
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
    cover: { kind: 'placeholder', tone: 'cyan' },
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
    cover: { kind: 'placeholder', tone: 'navy' },
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
    cover: { kind: 'placeholder', tone: 'surface' },
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
    cover: { kind: 'placeholder', tone: 'cyan' },
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
    cover: { kind: 'placeholder', tone: 'navy' },
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

export const RESOURCES_INDEX = {
  intro:
    'Explore clear explanations, practical frameworks and responsible-use guidance created to help Filipino professionals and entrepreneurs make more informed decisions about AI.',
  searchLabel: 'Search topics, guides and insights',
  filterLabel: 'Explore by topic',
} as const;

/** "All" is a UI affordance, not a topic, so it is kept out of the topic list. */
export const RESOURCE_FILTER_ALL = 'All';

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
 */
export const RESOURCE_PREVIEWS = [
  {
    title: "What AI Is-and What It Isn't",
    topic: 'AI Foundations',
    description:
      'Understand the difference between pattern-based generation, information retrieval, automation and human judgment.',
    status: 'Coming soon',
  },
  {
    title: 'Five Questions to Ask Before You Automate a Workflow',
    topic: 'Practical Adoption',
    description:
      'Start with the problem, the people affected and the decisions that must remain accountable.',
    status: 'Coming soon',
  },
  {
    title: 'A Human-Centered Generative AI Checklist',
    topic: 'Responsible AI',
    description:
      'Review purpose, source quality, privacy, accuracy and human oversight before using an AI-generated result.',
    status: 'Coming soon',
  },
  {
    title: 'Where Small Teams Can Begin with AI',
    topic: 'Business & Entrepreneurship',
    description:
      'Look for focused, repeatable work where AI can support people without hiding responsibility.',
    status: 'Coming soon',
  },
  {
    title: 'Choosing an AI Tool: Look Beyond the Demo',
    topic: 'Tools & Workflows',
    description:
      'Evaluate fit, data handling, reliability, cost, access and the workflow around the tool.',
    status: 'Coming soon',
  },
  {
    title: 'Building AI Capability Through Community',
    topic: 'Philippine AI Community',
    description:
      'Why shared learning, honest examples and cross-industry collaboration matter as AI adoption grows.',
    status: 'Coming soon',
  },
] as const;

/**
 * Tab 08's resource-format vocabulary.
 *
 * DISCREPANCY: this is not the same set as the `format` enum Tab 03 defines for
 * `PublicResource` (guide / insight / replay / template / checklist). Tab 08
 * lists Explainer, Guide, Checklist, Video, Event recap, Template and External
 * reference. The Tab 03 enum stays authoritative for the schema, because it is
 * the typed contract; this is held as the display vocabulary PAAIPE named.
 * See B-16.
 */
export const RESOURCE_FORMAT_VOCABULARY = [
  'Explainer',
  'Guide',
  'Checklist',
  'Video',
  'Event recap',
  'Template',
  'External reference',
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

export const RESOURCE_EMPTY_STATES = {
  noResults: {
    heading: 'No resources match those filters.',
    body: 'Try a broader search or choose another topic.',
    action: 'Clear Filters',
  },
  memberPreview: {
    heading: 'More learning is available inside the Members Portal.',
    body: 'Eligible members can access selected resources, session materials and recordings when rights and availability permit.',
  },
  nothingPublished: {
    heading: 'No resources are published yet.',
    body: 'Articles appear here once they are written and approved. The topics below are what is being prepared.',
  },
} as const;
