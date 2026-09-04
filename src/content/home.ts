/**
 * Approved home-page copy.
 *
 * Every string is quoted verbatim from Tab 05 of the Frontend Master Command.
 * Nothing here is paraphrased, summarised or invented, and no number,
 * testimonial, speaker, partner or offer appears anywhere.
 *
 * NOTE ON HYPHENS: several approved strings contain a bare `-` where an em
 * dash reads as intended ("the AI future-not simply watch it happen",
 * "community-helping people"). They are reproduced EXACTLY as supplied rather
 * than silently "corrected" - the slogan proves the source preserves
 * typographic characters where it means them. Flagged as B-13 for copy review.
 */
import { AUDIENCES } from './organization';

export const HOME_HERO = {
  eyebrow: 'A COMMUNITY FOR FILIPINO AI BUILDERS',
  heading: 'Building the Philippines’ AI-Powered Future—Together.',
  body: 'PAAIPE brings together AI professionals, entrepreneurs, educators, business leaders and responsible innovators who believe the Philippines should help shape the AI future-not simply watch it happen.',
  supportingLine: 'Learn continuously. Connect meaningfully. Build responsibly.',
  primaryCta: 'Join PAAIPE',
  secondaryCta: 'Explore Our Mission',
} as const;

export const HOME_AUDIENCE_STRIP = {
  intro:
    'For professionals, founders, builders, educators, researchers and business leaders working with-or preparing for-artificial intelligence.',
  audiences: AUDIENCES,
} as const;

export const HOME_WHY = {
  eyebrow: 'WHY WE EXIST',
  heading: 'AI is moving fast. Filipinos should move forward together.',
  body: 'Artificial intelligence is transforming how people work, build businesses, solve problems and serve communities. PAAIPE creates a trusted space where Filipino professionals and entrepreneurs can understand that change, develop practical skills and contribute to it responsibly.',
  cards: [
    {
      title: 'A stronger professional community',
      body: 'Meet people across industries who are learning, building, adopting and leading with AI.',
    },
    {
      title: 'Practical, useful learning',
      body: 'Move beyond the hype through clear explainers, expert sessions, workshops and resources designed for real work.',
    },
    {
      title: 'Responsible progress',
      body: 'Encourage AI adoption that respects people, strengthens trust and creates meaningful value for organizations and society.',
    },
  ],
} as const;

export const HOME_MISSION = {
  heading: 'Our mission',
  copy: 'To connect and equip Filipino AI professionals and entrepreneurs so they can learn continuously, collaborate responsibly and create meaningful value for organizations, communities and the country.',
} as const;

export const HOME_PROGRAMS = {
  heading: 'More ways to learn, connect and contribute',
  cta: 'View All Programs',
  /** The four programmes Tab 05 names for the home preview, by slug. */
  featured: [
    'ai-explained',
    'members-ai-exchange',
    'skills-labs-and-workshops',
    'community-conversations',
  ],
} as const;

export const HOME_EVENT = {
  eyebrow: 'MONTHLY MEMBER EVENT',
  heading: 'PAAIPE AI Exchange',
  supportingHeadline: 'One focused hour. One expert-led topic. One stronger community.',
  description:
    'Every month, PAAIPE invites a guest speaker to share a topic drawn from their expertise and relevant to Filipino professionals, entrepreneurs and organizations.',
  chips: ['Every second Tuesday', '8:00 PM PHT', 'Private Zoom event', 'One hour maximum'],
  /**
   * Tab 05's short-form agenda. Tab 07 supplies a longer form for the events
   * page; both are approved, so both are held rather than one being reworded
   * to match the other.
   */
  agenda: [
    'Welcome and opening',
    '20-30-minute guest presentation',
    'Interactive Q&A',
    'Raffle and closing',
  ],
  primaryCta: 'Explore Events',
  secondaryCta: 'Propose a Session',
  accessNote: 'Registration and private Zoom access are provided to eligible PAAIPE members.',
} as const;

export const HOME_BENEFITS = {
  heading: 'Membership designed to create practical advantage',
  body: 'PAAIPE membership helps people stay informed, build useful relationships and access opportunities that support continuous learning and responsible AI adoption.',
  /** Tab 05's own six-item preview list, distinct from Tab 09's seven cards. */
  items: [
    'Members-only events',
    'Workshops and practical learning',
    'Curated resources and eligible replays',
    'Verified professional community',
    'Mentorship and collaboration opportunities',
    'Eligible partner opportunities',
  ],
} as const;

/**
 * Announced upcoming topics - NOT resources.
 *
 * These are approved announcements of intent, so they are `approved` content
 * and appear in a production build. They deliberately have no slug and no href:
 * nothing is published, so nothing may be linked, downloaded or read now. The
 * "Coming soon" status is part of the record, not decoration.
 */
export const HOME_INSIGHTS = {
  heading: 'Understand AI. Apply it with purpose.',
  items: [
    { title: "What AI Is-and What It Isn't", topic: 'AI Foundations', status: 'Coming soon' },
    {
      title: 'Five Questions to Ask Before Automating a Workflow',
      topic: 'Practical Adoption',
      status: 'Coming soon',
    },
    {
      title: 'A Human-Centered Checklist for Using Generative AI',
      topic: 'Responsible AI',
      status: 'Coming soon',
    },
  ],
} as const;

export const HOME_UPDATES = {
  heading: 'Keep up with the Philippine AI community',
  body: 'Receive announcements about public content, PAAIPE programs, event updates and opportunities to participate.',
  fieldLabel: 'Email address',
  buttonLabel: 'Get PAAIPE Updates',
  consent:
    'By subscribing, you agree to receive PAAIPE updates. You can unsubscribe at any time. See our Privacy Notice.',
  /** Shown because no approved endpoint exists. Never a false success state. */
  unavailableReason:
    'Frontend preview - not connected. No approved subscription endpoint exists yet, so this field cannot submit and nothing you type is sent or stored.',
} as const;

/** Section 10 of the required flow. Heading and body are Tab 10 copy. */
export const HOME_PARTNERSHIP = {
  heading: 'Help expand access to meaningful AI opportunity in the Philippines.',
  body: 'PAAIPE welcomes conversations with organizations that want to support practical learning, responsible adoption and professional collaboration within the Filipino AI community.',
  cta: 'Start a Partnership Conversation',
} as const;

export const HOME_FINAL_CTA = {
  heading:
    "The Philippines' AI future needs people who are ready to learn, contribute and build together.",
  body: 'Whether you are developing AI, applying it in your organization or beginning your professional AI journey, there is a place for meaningful participation.',
  primaryCta: 'Join PAAIPE',
  secondaryCta: 'Contact Us',
} as const;

export const HOME_SOCIAL = {
  openGraphTitle: 'Building the Philippines’ AI-Powered Future—Together.',
  openGraphDescription:
    'Discover PAAIPE-a professional community helping Filipino talent and organizations learn, connect and move forward with AI responsibly.',
} as const;
