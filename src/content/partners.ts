import type { ApprovedPartner, PartnerCategory } from './types';

/**
 * Approved partners.
 *
 * DELIBERATELY EMPTY. No partnership has been formally approved, so no
 * organisation name or logo may appear anywhere on the site.
 *
 * The categories below are the kinds of organisation PAAIPE invites. The master
 * command is explicit that listing a category does NOT indicate an existing
 * partnership, so they are kept in a separate export that cannot be mistaken
 * for a partner list.
 */
export const APPROVED_PARTNERS: readonly ApprovedPartner[] = [];

export const PARTNER_CATEGORIES: readonly { id: PartnerCategory; label: string }[] = [
  { id: 'ai-and-technology', label: 'AI and technology companies' },
  { id: 'education-and-training', label: 'Education and training organizations' },
  { id: 'enterprise-and-startup', label: 'Enterprises and startups' },
  { id: 'professional-association', label: 'Professional associations' },
  { id: 'academic-and-research', label: 'Academic and research institutions' },
  { id: 'public-interest', label: 'Public-interest and community organizations' },
];

export const PARTNER_CATEGORY_CAVEAT =
  'Listing a category does not indicate an existing partnership.';

export const PARTNERS_PAGE = {
  heading: 'Help expand access to meaningful AI opportunity in the Philippines.',
  body: 'PAAIPE welcomes conversations with organizations that want to support practical learning, responsible adoption and professional collaboration within the Filipino AI community.',
  cta: 'Start a Partnership Conversation',
} as const;

export const COLLABORATION_AREAS = [
  'Member learning',
  'Event and workshop support',
  'AI-tool access, eligible credits, trials, or discounts',
  'Expertise and educational content',
  'Skills and capability initiatives',
  'Community opportunities',
  'Responsible-AI initiatives',
] as const;

export const PARTNERSHIP_PROCESS = [
  'Share the idea.',
  'PAAIPE reviews fit, value, feasibility, and responsible-use considerations.',
  'Both parties agree on scope, eligibility, branding, data use, recognition, and terms.',
  'Announce only after formal approval.',
  'Review outcomes where appropriate.',
] as const;
