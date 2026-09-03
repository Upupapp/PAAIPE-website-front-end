import type { Policy } from './types';

/**
 * Legal pages. Both are DRAFT until PAAIPE's own review approves them, and the
 * schema refuses a draft policy that carries no review banner.
 */
export const POLICIES: readonly Policy[] = [
  {
    slug: 'privacy',
    title: 'Privacy Notice',
    status: 'draft-for-review',
    reviewBanner:
      'DRAFT FOR REVIEW - This page requires approved organization details and legal/privacy review before production release.',
  },
  {
    slug: 'terms',
    title: 'Terms of Use',
    status: 'draft-for-review',
    reviewBanner:
      'DRAFT FOR REVIEW - This structure requires legal review before production release.',
  },
];
