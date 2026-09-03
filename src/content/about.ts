/**
 * Approved About and Programs page copy, quoted verbatim from Tab 06.
 *
 * TWO DISCREPANCIES WITH TAB 03, both carried rather than reconciled:
 *
 *  - Tab 03 gives five single-word VALUES (Responsible, Inclusive, Practical,
 *    Collaborative, Future-focused). Tab 06 gives five NAMED values with
 *    descriptions, and only "Practical" overlaps. They are different lists, so
 *    both are held: `VALUES` for short summaries, `VALUE_PRINCIPLES` here for
 *    the About page Tab 06 specifies. See B-14.
 *  - Tab 03 gives five audience CATEGORIES; Tab 06 gives seven, more granular,
 *    "who PAAIPE is for" entries. Again both are held. See B-15.
 *
 * Neither is a paraphrase of the other, so choosing one would have deleted
 * approved copy.
 */

export const ABOUT_HERO = {
  eyebrow: 'ABOUT PAAIPE',
  heading: 'A stronger Philippine AI future starts with a stronger community.',
  body: 'PAAIPE brings people together around a shared belief: Filipino professionals and entrepreneurs should have the knowledge, relationships and opportunities to participate meaningfully in the AI-powered economy.',
} as const;

export const ABOUT_WHO_WE_ARE = {
  heading: 'A professional community built for the AI era',
  paragraphs: [
    'The Philippine Association of AI Professionals and Entrepreneurs is a community for people who build, apply, study, teach and lead with artificial intelligence. We create spaces for useful learning, professional connection and responsible collaboration across industries and disciplines.',
    'PAAIPE welcomes different levels of AI experience. What matters is a genuine commitment to learning, contributing and using technology in ways that create meaningful value for people and organizations.',
  ],
} as const;

export const MISSION_AND_VISION = {
  mission:
    'To connect and equip Filipino AI professionals and entrepreneurs so they can learn continuously, collaborate responsibly and create meaningful value for organizations, communities and the country.',
  vision:
    'A future in which Filipino talent and enterprises can confidently shape, adopt and benefit from artificial intelligence-responsibly and inclusively.',
} as const;

/** Tab 06's named values. Distinct from Tab 03's single-word list - see B-14. */
export const VALUE_PRINCIPLES = [
  {
    name: 'Bayanihan in technology',
    description:
      'Progress becomes more meaningful when knowledge, experience and opportunity are shared.',
  },
  {
    name: 'People-centered innovation',
    description:
      'AI should strengthen human capability, improve decisions and help solve real problems.',
  },
  {
    name: 'Practical value',
    description:
      'We prioritize useful understanding, relevant skills and outcomes that matter beyond the hype.',
  },
  {
    name: 'Responsible trust',
    description:
      'We encourage transparency, verification, safety, fairness and accountable human judgment.',
  },
  {
    name: 'Continuous learning',
    description:
      'AI will keep changing. Our community must remain curious, adaptable and open to new perspectives.',
  },
] as const;

export const WHAT_PAAIPE_DOES = [
  {
    name: 'Connect',
    description:
      'Bring together professionals, entrepreneurs, educators, leaders, and organizations across the Philippine AI ecosystem.',
  },
  {
    name: 'Equip',
    description:
      'Make AI knowledge more understandable, useful, and relevant through programs, events, and resources.',
  },
  {
    name: 'Convene',
    description:
      'Create trusted spaces for experts and community members to exchange ideas, experiences, and questions.',
  },
  {
    name: 'Encourage',
    description:
      'Support responsible AI adoption that creates opportunity while recognizing risk, accountability, and human impact.',
  },
] as const;

/** Tab 06's seven "who PAAIPE is for" entries. See B-15. */
export const WHO_PAAIPE_IS_FOR = [
  'AI, data, and technology professionals',
  'Founders, entrepreneurs, and business owners',
  'Professionals applying AI in their work or organizations',
  'Educators, trainers, and researchers',
  'Product, operations, marketing, and innovation leaders',
  'Responsible-technology advocates',
  'Filipinos preparing to contribute meaningfully to the AI economy',
] as const;

/**
 * Progress statement.
 *
 * Tab 06 is explicit: "Do not turn this statement into a numerical impact chart
 * until verified data exists." It is therefore held as PROSE, split into the
 * clauses the source uses, and rendered as a plain list with no counter, chart,
 * figure or unit anywhere. A test asserts no digit appears in it.
 */
export const PROGRESS_STATEMENT = {
  heading: 'We measure progress through what the community can do together.',
  outcomes: [
    'Better-informed professionals.',
    'More capable organizations.',
    'Stronger connections between people and ideas.',
    'Practical examples of responsible AI in action.',
    'More opportunities for Filipino talent to learn, contribute and lead.',
  ],
} as const;

export const PROGRAMS_HERO = {
  eyebrow: 'PAAIPE PROGRAMS',
  heading: 'From understanding AI to creating real-world value',
  body: 'PAAIPE programs help Filipino professionals and entrepreneurs learn at different levels, connect across disciplines and translate AI knowledge into responsible action.',
} as const;

export const SPEAKER_INVITATION = {
  heading: 'Have something useful to teach the Filipino AI community?',
  body: 'PAAIPE welcomes proposals from practitioners, founders, educators, researchers and leaders with relevant knowledge or experience. Guest speakers may propose a topic that reflects their expertise and offers practical value to the audience.',
  primaryCta: 'Propose a Session',
  secondaryCta: 'Contact the Programs Team',
} as const;
