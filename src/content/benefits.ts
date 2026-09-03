import type { BenefitCategory } from './types';

/** Member benefits, from Tab 09. */
export const MEMBER_BENEFITS: readonly BenefitCategory[] = [
  {
    slug: 'professional-community',
    name: 'A professional AI community',
    description:
      'Connect with practitioners, entrepreneurs, educators and leaders across fields and levels of adoption.',
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'members-only-events',
    name: 'Members-only events',
    description:
      "Join the monthly PAAIPE Members' AI Exchange and other private sessions as announced.",
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'workshops-and-training',
    name: 'Practical workshops and training',
    description:
      'Participate in eligible learning activities focused on tools, workflows, implementation and responsible practice.',
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'curated-resources',
    name: 'Curated resources',
    description:
      'Access selected guides, templates, event materials and recordings when available and permissioned.',
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'opportunities-to-contribute',
    name: 'Opportunities to contribute',
    description:
      'Propose topics, share relevant experience and participate in discussions that strengthen the community.',
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'professional-connection',
    name: 'Professional connection',
    description:
      'Participate in opt-in professional discovery when the future Members Portal supports it.',
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'partner-opportunities',
    name: 'Partner opportunities',
    description:
      'Access eligible offers that may include AI-platform credits, tokens, trials, product access, training rates, or discounts from confirmed providers.',
    // The partner caveat must sit directly beside this one.
    requiresPartnerDisclaimer: true,
  },
];

/** The /benefits page presents CATEGORIES, never fabricated offers. */
export const BENEFIT_CATEGORIES: readonly BenefitCategory[] = [
  {
    slug: 'ai-tools-and-credits',
    name: 'AI tools and eligible usage credits',
    description: 'Eligible access to AI platforms, where a confirmed provider agreement allows it.',
    requiresPartnerDisclaimer: true,
  },
  {
    slug: 'learning-and-certification',
    name: 'Learning and certification opportunities',
    description: 'Eligible learning activities and study opportunities as they are confirmed.',
    requiresPartnerDisclaimer: true,
  },
  {
    slug: 'member-events',
    name: 'Member events',
    description: "Members-only sessions including the monthly PAAIPE Members' AI Exchange.",
    requiresPartnerDisclaimer: false,
  },
  {
    slug: 'business-and-professional-services',
    name: 'Business and professional services',
    description: 'Eligible services offered by confirmed providers.',
    requiresPartnerDisclaimer: true,
  },
  {
    slug: 'community-access',
    name: 'Community access',
    description: 'Participation in the verified professional community and its discussions.',
    requiresPartnerDisclaimer: false,
  },
];

/**
 * The public status explanations from Tab 09. These are EDUCATIONAL ONLY - the
 * public site never determines or displays a real applicant's status, and no
 * status is ever read from a query parameter or storage.
 */
export const APPLICATION_STATUS_EXPLANATIONS = [
  {
    slug: 'email-verification-required',
    label: 'Email verification required',
    explanation: 'Verify your email to continue.',
  },
  {
    slug: 'application-incomplete',
    label: 'Application incomplete',
    explanation: 'Complete the remaining professional information.',
  },
  {
    slug: 'under-review',
    label: 'Under review',
    explanation:
      'PAAIPE will notify the applicant when the status changes or more information is needed.',
  },
  {
    slug: 'more-information-required',
    label: 'More information required',
    explanation: 'Follow the request sent to the registered email.',
  },
  { slug: 'approved', label: 'Approved', explanation: 'Sign in to the Members Portal.' },
  {
    slug: 'review-completed',
    label: 'Review completed',
    explanation: 'Refer to the private email for available next steps.',
  },
] as const;

/** The five-step verification journey. No approval or timeline is promised. */
export const VERIFICATION_JOURNEY = [
  {
    step: 'Create your application',
    detail: 'Provide basic account and contact details through the configured application service.',
  },
  { step: 'Verify your email', detail: 'Confirm that the email address belongs to you.' },
  {
    step: 'Tell us about your work',
    detail: 'Add relevant professional, business, or learning information.',
  },
  {
    step: 'Wait for review',
    detail: 'PAAIPE reviews submitted information before enabling member access.',
  },
  {
    step: 'Receive your status',
    detail: 'Get an update after review or when more information is required.',
  },
] as const;

export const MEMBERSHIP_PAGE = {
  eyebrow: 'PAAIPE MEMBERSHIP',
  heading: 'Build your AI future with people who want the Philippines to move forward.',
  body: 'PAAIPE membership connects you with a professional community committed to continuous learning, practical innovation and responsible AI adoption.',
  primaryCta: 'Apply for Membership',
  secondaryCta: 'Review Member Benefits',
  trustNote:
    'Membership applications are reviewed to help preserve the relevance, trust and professional integrity of the community.',
} as const;

export const WHO_CAN_APPLY = {
  intro:
    'PAAIPE is designed for Filipino professionals and entrepreneurs who build, use, teach, study, manage or make decisions about artificial intelligence.',
  examples: [
    'AI, machine-learning, data, and software professionals',
    'Founders, entrepreneurs, and business owners',
    'Product, operations, marketing, and innovation professionals',
    'Educators, trainers, and researchers',
    'Leaders responsible for AI adoption or governance',
    'Other professionals with a clear interest in contributing to the community',
  ],
} as const;

export const BENEFITS_PAGE = {
  heading: 'Benefits designed to help members learn, build and connect.',
  intro:
    'These are the kinds of benefit PAAIPE works towards. Each depends on a confirmed agreement, and none is guaranteed.',
} as const;

/**
 * Guidance the pages must honour, kept beside the copy it constrains.
 *
 * The master command is explicit that no provider logo, discount percentage,
 * peso value, credit or token amount, coupon code or entitlement may appear
 * without written approval, and that applicants and members must never be
 * described as certified, accredited, licensed or officially endorsed.
 * Tests enforce both.
 */
export const MEMBERSHIP_NOTES = {
  statusIsEducational:
    'These are the states an application can be in. They are shown here for information only — PAAIPE does not determine or display your status on this website. Check your own application through the Members Portal.',
  noTimeline:
    'Review time varies with the information submitted and current review volume. No timeline is promised, and submitting an application does not guarantee approval.',
} as const;
