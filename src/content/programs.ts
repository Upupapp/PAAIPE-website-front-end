import type { Program } from './types';

/** The six programmes described in Tab 06. Copy is quoted, not paraphrased. */
export const PROGRAMS: readonly Program[] = [
  {
    slug: 'ai-explained',
    name: 'AI, Explained',
    category: 'Public education',
    summary:
      'Important AI ideas, made clear. Accessible language, relatable examples and strong visual storytelling help people understand foundational AI concepts, capabilities and limitations.',
    visibility: 'public',
    contentStatus: 'approved',
    badge: 'Public learning series',
  },
  {
    slug: 'members-ai-exchange',
    name: 'PAAIPE AI Exchange',
    category: 'Monthly members-only event',
    summary:
      'Learn directly from people doing the work. Every second Tuesday at 8:00 PM PHT, a guest speaker shares a topic connected to their experience and relevant to the PAAIPE community.',
    visibility: 'members-only',
    contentStatus: 'approved',
    badge: 'Members-only online event',
  },
  {
    slug: 'skills-labs-and-workshops',
    name: 'Skills Labs & Workshops',
    category: 'Practical learning',
    summary:
      'Learn by working through real challenges. Guided sessions explore AI tools, workflows and decision frameworks that participants can apply in professional or business settings.',
    visibility: 'public',
    contentStatus: 'approved',
    badge: 'Sessions announced throughout the year',
  },
  {
    slug: 'ai-in-practice',
    name: 'AI in Practice',
    category: 'Case-based learning',
    summary:
      'Go behind the outcome. Discussions and case features examine opportunities, implementation choices, limitations and lessons learned.',
    visibility: 'public',
    contentStatus: 'approved',
    badge: 'Case-based learning',
  },
  {
    slug: 'responsible-ai-conversations',
    name: 'Responsible AI Conversations',
    category: 'Trust and accountability',
    summary:
      'Progress requires judgment-not just capability. Thoughtful conversations cover accuracy, privacy, bias, transparency, human oversight and the real impact of AI-powered decisions.',
    visibility: 'public',
    contentStatus: 'approved',
    badge: 'Trust and accountability',
  },
  {
    // Named in Tab 05's home preview but absent from Tab 06's programme list.
    // Carried here with Tab 05's approved copy; the discrepancy is B-12.
    slug: 'community-conversations',
    name: 'Community Conversations',
    category: 'Member community',
    summary:
      'Thoughtful discussions where members exchange perspectives, lessons, and challenges from their fields.',
    visibility: 'members-only',
    contentStatus: 'approved',
    badge: 'Member community',
  },
  {
    slug: 'member-resource-library',
    name: 'Member Resource Library',
    category: 'Members-only knowledge',
    summary:
      'Useful knowledge, organized for continued learning. Eligible members can access selected guides, templates, recordings and event materials through the Members Portal.',
    visibility: 'members-only',
    contentStatus: 'approved',
    badge: 'Members-only knowledge',
  },
];

export const PROGRAM_NOTES = {
  availability:
    'Workshop schedules, eligibility and capacity are announced when each session is confirmed.',
  rights:
    'Recordings and materials are provided only when publication rights and speaker permissions allow.',
} as const;
