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
