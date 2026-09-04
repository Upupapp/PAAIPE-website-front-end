/**
 * Approved organisation copy. Every string here is quoted verbatim from the
 * Frontend Master Command. Nothing is paraphrased and nothing is invented.
 */
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../config/site';

export const ORGANIZATION = {
  name: ORGANIZATION_NAME,
  acronym: ACRONYM,
  slogan: SLOGAN,
  shortDescription:
    'PAAIPE brings Filipino AI professionals, entrepreneurs, educators and organizations into one trusted community-helping people understand AI, build capability and create responsible opportunities.',
  footerDescription:
    'A trusted community for Filipino AI professionals, entrepreneurs, educators and organizations-building capability, connection and responsible opportunity.',
} as const;

/** The five approved audience categories. */
export const AUDIENCES = [
  'AI professionals and practitioners',
  'Entrepreneurs and founders',
  'Educators and researchers',
  'Companies and institutions',
  'Emerging AI talent',
] as const;

/** The five approved values. */
export const VALUES = [
  'Responsible',
  'Inclusive',
  'Practical',
  'Collaborative',
  'Future-focused',
] as const;

/**
 * The monthly members event. Recurrence, time zone and duration are approved;
 * the meeting URL is not held anywhere in this codebase and never will be.
 */
export const SIGNATURE_EVENT = {
  title: "PAAIPE Members' AI Exchange",
  recurrence: 'Every second Tuesday',
  time: '8:00 PM PHT',
  timeZone: 'Asia/Manila',
  venue: 'Private Zoom',
  duration: 'One hour maximum',
  /*
   * Supplied verbatim by the owner on 2026-09-04 as the exact announcement
   * message. Note it names the series "PAAIPE AI Exchange", while `title`
   * above is "PAAIPE Members' AI Exchange" - the same divergence the backend
   * lane reported, where the official name is the shorter one and the longer
   * one is a migration alias. Raised with the owner; the instruction said
   * "use this exact message", so it is used exactly.
   */
  announcementBar: 'PAAIPE AI Exchange \u2014 Every second Tuesday of the month at 8:00 PM PHT.',
  announcementLinkLabel: 'View events',
  announcementLinkHref: '/events',
  accessNote: 'Registration and private Zoom access are provided to eligible PAAIPE members.',
  agenda: [
    'Opening - brief welcome and introduction',
    'Guest presentation - focused 20-30-minute talk',
    'Live Q&A - member questions and practical discussion',
    'Raffle and close - short community raffle, takeaways, and closing remarks',
  ],
} as const;

/**
 * Copy shown to an applicant whose membership is still being verified.
 * Rendered only for `applicant-pending`, which the public build never supplies.
 */
export const APPLICANT_PENDING_NOTICE =
  'Verification in progress. This benefit becomes available after your membership is approved. Check your application status through the Members Portal.';

/** Disclaimers that must appear adjacent to specific content. */
export const DISCLAIMERS = {
  partnerBenefits:
    "Partner benefits are not guaranteed and may change or end without notice. Every offer is subject to a confirmed agreement, availability, member eligibility, geographic or account restrictions, redemption limits and the provider's own terms. Displayed examples must not imply a partnership until it is formally confirmed.",
  partnerBenefitsShort: 'Benefits are subject to availability, eligibility and partner terms.',
  educational:
    'PAAIPE resources are provided for general educational purposes. They should not be treated as legal, financial, medical, cybersecurity or other professional advice. Verify important information and seek qualified guidance when decisions carry material consequences.',
  partnershipApproval:
    "No partnership, endorsement or member benefit should be announced or visually represented until it has been formally approved. Product access, credits, tokens, trials and discounts remain subject to the provider's eligibility rules, limits, availability and terms.",
  speakerSelection:
    'Proposals are reviewed for relevance, clarity, community value, availability and alignment with PAAIPE principles. Submission does not guarantee selection.',
} as const;
