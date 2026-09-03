import type { Faq } from './types';

/** The approved membership FAQ copy from Tab 09, quoted verbatim. */
export const MEMBERSHIP_FAQS: readonly Faq[] = [
  {
    slug: 'approved-automatically',
    question: 'Is membership approved automatically?',
    answer: 'No. Applications are reviewed before members-only access is enabled.',
  },
  {
    slug: 'verification-time',
    question: 'How long does verification take?',
    answer:
      'Review time may vary depending on the information submitted and current review volume. You will receive an email when your status changes or if more information is required.',
  },
  {
    slug: 'need-to-be-engineer',
    question: 'Do I need to be an AI engineer?',
    answer:
      'No. PAAIPE also welcomes entrepreneurs, educators, decision-makers and professionals who apply, manage or responsibly explore AI in their work.',
  },
  {
    slug: 'events-included',
    question: 'What events are included?',
    answer:
      "Members may access the monthly PAAIPE Members' AI Exchange and other eligible workshops, conversations and activities announced by the organization.",
  },
  {
    slug: 'credits-guaranteed',
    question: 'Are AI credits, tokens and discounts guaranteed?',
    answer:
      'No. These benefits depend on confirmed partner agreements, availability, eligibility and provider terms. Offers may differ and may change over time.',
  },
  {
    slug: 'propose-a-topic',
    question: 'Can I propose a topic or volunteer as a speaker?',
    answer:
      'Yes. Relevant proposals are welcome and reviewed according to community value, fit and scheduling availability.',
  },
  {
    slug: 'access-while-pending',
    question: 'What can I access while my application is pending?',
    answer:
      "You can continue exploring PAAIPE's public pages, programs, event information and published insights. Members-only content remains locked until verification is complete.",
  },
];
