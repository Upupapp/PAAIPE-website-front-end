/**
 * The public content model.
 *
 * Everything a page renders comes from a typed registry validated against these
 * shapes. Page components never repeat copy.
 *
 * Two ideas carry most of the safety here:
 *
 *  - `Visibility` says who the content is FOR. `members-only` records still
 *    appear publicly, but only ever as a synopsis - see `MemberSynopsis`.
 *  - `ContentStatus` says whether it may be PUBLISHED. `approved` ships;
 *    `sample` and `draft` are review-build fixtures and are stripped from a
 *    production build. The two are independent: a members-only record can be
 *    approved, and a public record can be a sample.
 */

export type Visibility = 'public' | 'members-only';

export type ContentStatus = 'approved' | 'draft' | 'sample';

/**
 * Which viewer the UI is rendering for. The production public build ALWAYS
 * supplies 'public'. `applicant-pending` exists for component tests only and is
 * never derived from a query parameter, cookie, storage or a fake sign-in.
 */
export type ViewerState = 'public' | 'applicant-pending';

/**
 * An image, or an honest admission that there isn't one.
 *
 * No approved photography or illustration has been supplied (B-6), and
 * inventing imagery for a professional association is not acceptable. Encoding
 * the absence in the TYPE means a fixture cannot quietly reference a file that
 * does not exist, and every consumer is forced to handle the placeholder case.
 */
export type PublicImage =
  | {
      kind: 'placeholder';
      /** Drives the neutral token-coloured fill. Carries no meaning. */
      tone: 'navy' | 'surface' | 'cyan';
    }
  | {
      kind: 'file';
      src: string;
      /** Empty string is a deliberate decorative choice, never an oversight. */
      alt: string;
      width: number;
      height: number;
    };

/** A block of public body copy. Deliberately small - no raw HTML is accepted. */
export type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; items: string[] };

/**
 * A speaker who may be shown by name. Only records that PAAIPE has approved,
 * with usage rights for any portrait, may exist in this registry.
 */
export interface ApprovedSpeaker {
  slug: string;
  name: string;
  /** Role and organisation, as approved. */
  title: string;
  /** Present only when portrait usage rights are confirmed. */
  portrait?: PublicImage;
  approvedOn: string;
}

/** An organisation whose logo and name PAAIPE has approved for display. */
export interface ApprovedPartner {
  slug: string;
  name: string;
  category: PartnerCategory;
  logo?: PublicImage;
  approvedOn: string;
}

export type PartnerCategory =
  | 'ai-and-technology'
  | 'education-and-training'
  | 'enterprise-and-startup'
  | 'professional-association'
  | 'academic-and-research'
  | 'public-interest';

export type EventFormat = 'online' | 'in-person' | 'hybrid';

export type EventStatus = 'upcoming' | 'completed' | 'postponed';

/** The only registration states the master command approves. */
export type EventRegistrationState =
  | 'registration-open'
  | 'members-only'
  | 'limited-capacity'
  | 'registration-closed'
  | 'event-completed'
  | 'recording-available-to-eligible-members'
  | 'announcement-coming-soon';

export interface PublicEvent {
  slug: string;
  title: string;
  excerpt: string;
  visibility: Visibility;
  contentStatus: ContentStatus;
  /** ISO date. Absent means no date is approved - never a placeholder date. */
  date?: string;
  timeZone: 'Asia/Manila';
  format: EventFormat;
  duration?: string;
  publicAgenda: string[];
  approvedSpeaker?: ApprovedSpeaker;
  status: EventStatus;
  registrationState: EventRegistrationState;
  /**
   * Present only when real capacity data is configured. The master command
   * allows the "Limited Capacity" label only in that case.
   */
  capacityConfigured?: boolean;
  image: PublicImage;
}

export type ResourceFormat = 'guide' | 'insight' | 'replay' | 'template' | 'checklist';

export type ResourceTopic =
  | 'AI Foundations'
  | 'Practical Adoption'
  | 'Responsible AI'
  | 'Business & Entrepreneurship'
  | 'Tools & Workflows'
  | 'Philippine AI Community'
  | 'Event Recaps';

export interface PublicResource {
  slug: string;
  title: string;
  excerpt: string;
  visibility: Visibility;
  contentStatus: ContentStatus;
  format: ResourceFormat;
  topics: ResourceTopic[];
  /**
   * Public body copy. A `members-only` resource must NOT carry one - the public
   * route may show only a synopsis. Enforced by schema, not by convention.
   */
  publicBody?: ContentBlock[];
  cover: PublicImage;
  publishedAt?: string;
  updatedAt?: string;
}

/** Everything a members-only record is allowed to expose publicly. */
export interface MemberSynopsis {
  cover: PublicImage;
  title: string;
  summary: string;
  topics: string[];
  format: string;
  valueProposition: string;
}

export interface Program {
  slug: string;
  name: string;
  category: string;
  summary: string;
  visibility: Visibility;
  contentStatus: ContentStatus;
  badge: string;
}

export interface BenefitCategory {
  slug: string;
  name: string;
  description: string;
  /** True when the master command requires the partner caveat beside it. */
  requiresPartnerDisclaimer: boolean;
}

export interface Faq {
  slug: string;
  question: string;
  answer: string;
}

export interface Policy {
  slug: string;
  title: string;
  /** Legal text is draft until PAAIPE approves it. */
  status: 'draft-for-review' | 'approved';
  reviewBanner?: string;
}

export interface NavItem {
  label: string;
  href: string;
  /** Grouped children for a dropdown. All remain keyboard reachable. */
  children?: NavItem[];
}

export interface SocialLink {
  label: string;
  /** Absent until PAAIPE supplies the account. Never guessed. */
  href?: string;
}

/** The six external handoffs the master command names. */
export type ExternalActionId =
  | 'membership-application'
  | 'member-portal'
  | 'application-status'
  | 'speaker-interest'
  | 'partnership-interest'
  | 'contact';
