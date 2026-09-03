/**
 * Responsible AI, Contact, Accessibility and the two draft legal pages.
 *
 * The legal pages are STRUCTURE ONLY. Every value PAAIPE has not supplied is a
 * visibly bracketed placeholder rather than plausible-looking boilerplate,
 * because boilerplate that reads as finished is the thing most likely to be
 * published by accident. No vendor is named that this site does not use.
 */

export const RESPONSIBLE_AI = {
  intro:
    'PAAIPE encourages AI adoption that keeps human judgment, transparency and real-world impact visible throughout the process.',
  principles: [
    {
      name: 'Human accountability',
      description: 'People and organizations remain responsible for consequential decisions.',
    },
    {
      name: 'Transparency',
      description:
        'Communicate when AI is used and explain limits in a way the audience can understand.',
    },
    {
      name: 'Privacy and security',
      description: 'Use appropriate data, access controls, and safeguards.',
    },
    {
      name: 'Fairness and inclusion',
      description: 'Look for uneven impacts and involve affected perspectives.',
    },
    {
      name: 'Practical verification',
      description: 'Check important outputs against trusted evidence and qualified judgment.',
    },
    {
      name: 'Continuous learning',
      description: 'Monitor real outcomes and adapt as systems, risks, and expectations change.',
    },
  ],
  /** Stated so the page cannot be read as a compliance claim. */
  scopeNote:
    'These are principles PAAIPE encourages, not a certification, an audit, a legal compliance statement or a guarantee of safety. PAAIPE does not assess or certify anyone against them.',
} as const;

export const CONTACT_PAGE = {
  body: 'Contact PAAIPE about membership, programs, speaking opportunities, partnerships, media or other organization matters.',
  pathways: [
    'General inquiry',
    'Membership and verification',
    'Speaker or program proposal',
    'Partnership opportunity',
    'Event question',
    'Media inquiry',
    'Website support',
    'Privacy request',
  ],
  /**
   * Shown because no approved address or form exists. The master command offers
   * three honest implementations; with nothing configured, the third applies.
   * There is deliberately no form on the page - not even a disabled one - so no
   * submission or success state is reachable at all.
   */
  unavailableNote:
    'No contact address or form has been approved yet, so there is nothing here that could send a message. When a destination is configured, this becomes a real contact action.',
  noInventedDetails:
    'PAAIPE has not published a postal address, telephone number or response-time commitment, so none appears here.',
} as const;

export const ACCESSIBILITY_PAGE = {
  statement:
    'PAAIPE aims to make its digital information understandable and usable by as many people as reasonably possible. We work toward clear navigation, readable contrast, keyboard access, meaningful labels, responsive layouts and reduced-motion support.',
  feedback:
    'If you encounter an accessibility barrier, contact PAAIPE through the website and include the page, device and issue you experienced. Feedback will help the team evaluate and improve the experience.',
  /** An accurate goal statement, never a conformance claim. */
  conformanceNote:
    'This is a statement of intent, not a claim of conformance. No independent accessibility audit has been carried out, so PAAIPE claims no certification and no formal WCAG conformance level.',
  measuresTaken: [
    'Every colour combination in use is measured against WCAG AA and checked on each build.',
    'Every page is scanned with axe-core in two browser engines.',
    'The site works with JavaScript disabled, and every navigation link is a real link.',
    'Reduced-motion preferences remove non-essential animation.',
    'Layouts are checked for horizontal overflow at 360, 390, 768, 1024 and 1440 pixels.',
  ],
} as const;

/** A section of a draft legal page: a heading and what it will need to say. */
export interface LegalSection {
  heading: string;
  summary: string;
  /** Values PAAIPE must supply. Rendered visibly unresolved. */
  placeholders: string[];
}

export const PRIVACY_DRAFT: readonly LegalSection[] = [
  {
    heading: 'Information you provide',
    summary:
      'What a person sends to PAAIPE directly. Today the public website collects nothing: there is no form, no account and no submission of any kind.',
    placeholders: ['FIELDS COLLECTED BY THE APPLICATION SERVICE', 'LAWFUL BASIS'],
  },
  {
    heading: 'Basic website and device data',
    summary:
      'What the hosting provider records in the ordinary course of serving a page, such as request logs.',
    placeholders: ['HOSTING PROVIDER', 'LOG FIELDS RETAINED', 'LOG RETENTION PERIOD'],
  },
  {
    heading: 'Purposes',
    summary: 'Why each category of information is used.',
    placeholders: ['PURPOSES PER CATEGORY'],
  },
  {
    heading: 'Service providers',
    summary:
      'Third parties that process information on PAAIPE’s behalf. None is named here because this website currently uses none.',
    placeholders: ['APPROVED PROCESSORS', 'PROCESSING LOCATIONS'],
  },
  {
    heading: 'Retention',
    summary: 'How long each category is kept, and what happens at the end of that period.',
    placeholders: ['RETENTION PERIOD PER CATEGORY'],
  },
  {
    heading: 'Security',
    summary: 'The safeguards applied to information PAAIPE holds.',
    placeholders: ['SECURITY MEASURES'],
  },
  {
    heading: 'Your choices',
    summary: 'How a person accesses, corrects, exports or deletes their information.',
    placeholders: ['REQUEST CHANNEL', 'RESPONSE PROCESS'],
  },
  {
    heading: 'Cookies and analytics',
    summary:
      'This website sets no analytics or advertising cookie and loads no tracker. The only value stored in a browser is a local preference recording that a visitor closed the announcement bar, written only when they click to close it.',
    placeholders: ['ANY FUTURE ANALYTICS SERVICE'],
  },
  {
    heading: 'External services',
    summary:
      'Destinations a visitor may be handed off to, such as an application service or the Members Portal. Each has its own privacy notice.',
    placeholders: ['EXTERNAL DESTINATIONS AND THEIR NOTICES'],
  },
  {
    heading: 'Updates to this notice',
    summary: 'How changes are published and how a person is told about them.',
    placeholders: ['CHANGE NOTIFICATION METHOD'],
  },
  {
    heading: 'Contact',
    summary: 'Where to send a privacy question or request.',
    placeholders: ['APPROVED PRIVACY CONTACT'],
  },
];

export const TERMS_DRAFT: readonly LegalSection[] = [
  {
    heading: 'Purpose of this website',
    summary: 'What the public site is for, and what it is not.',
    placeholders: ['ORGANIZATION LEGAL NAME', 'REGISTERED ADDRESS'],
  },
  {
    heading: 'Membership and applications',
    summary:
      'That applying is not joining, that review is human, and that acceptance is at PAAIPE’s discretion.',
    placeholders: ['APPLICATION TERMS', 'GROUNDS FOR DECLINING'],
  },
  {
    heading: 'Events',
    summary: 'Conduct expected at sessions, and what may be recorded.',
    placeholders: ['EVENT CONDUCT RULES', 'RECORDING AND CONSENT TERMS'],
  },
  {
    heading: 'External benefits',
    summary:
      'That partner offers are governed by the provider’s own terms and are not guaranteed by PAAIPE.',
    placeholders: ['BENEFIT TERMS'],
  },
  {
    heading: 'Acceptable use',
    summary: 'What a visitor may and may not do with this website.',
    placeholders: ['ACCEPTABLE USE RULES'],
  },
  {
    heading: 'Intellectual property',
    summary: 'Ownership of PAAIPE content, and permitted use of the name and logo.',
    placeholders: ['IP TERMS', 'LOGO USAGE TERMS'],
  },
  {
    heading: 'Submissions',
    summary: 'What happens to a topic proposal or other material sent to PAAIPE.',
    placeholders: ['SUBMISSION LICENCE TERMS'],
  },
  {
    heading: 'Third-party services',
    summary: 'That linked destinations are operated by others under their own terms.',
    placeholders: ['LINKED SERVICES'],
  },
  {
    heading: 'Educational information',
    summary: 'That resources are general educational material and not professional advice.',
    placeholders: [],
  },
  {
    heading: 'Availability',
    summary: 'That the site is provided as-is and may change or be unavailable.',
    placeholders: ['AVAILABILITY TERMS'],
  },
  {
    heading: 'Contact',
    summary: 'Where to send a question about these terms.',
    placeholders: ['APPROVED LEGAL CONTACT'],
  },
];

/**
 * Why no cookie consent banner is shown.
 *
 * Tab 10: "Implement a cookie interface only if non-essential storage or
 * scripts actually exist. Necessary-only sites should not show a performative
 * consent banner." This site loads no analytics, no advertising pixel and no
 * third-party script, and the single stored value is a functional preference
 * written only when a visitor clicks to dismiss the announcement bar. A consent
 * banner here would ask permission for something that is not happening.
 */
export const COOKIE_POSITION = {
  bannerShown: false,
  reason:
    'This website loads no analytics, advertising or third-party script, and stores nothing except a local record that a visitor closed the announcement bar, written only when they click to close it. There is nothing to consent to, and a banner asking anyway would be performative.',
} as const;
