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
  /*
   * NOT "being finalized". That is a claim about timing PAAIPE has not made,
   * the same unkeepable promise removed from the events copy and from the six
   * external-action messages. It states the fact instead.
   */
  unavailableNote:
    'PAAIPE has not published a contact address or form, so there is nothing on this page that could send a message. This is the page it will appear on when there is one.',
  /*
   * The one route that WORKS today, and it is not a courtesy.
   *
   * The privacy notice tells a reader they hold rights under the Data Privacy
   * Act. A site that describes a statutory right and offers no way to exercise
   * it is worse than one that says nothing, and the honest answer is that the
   * regulator can be approached directly - which is true, requires nothing from
   * PAAIPE, and is a real remedy rather than a signpost back to this page.
   */
  privacyRoute:
    'For a privacy request or complaint you do not have to wait for PAAIPE. The National Privacy Commission accepts complaints directly, at privacy.gov.ph or 5th Floor Delegation Building, PICC Complex, Roxas Boulevard, Pasay City.',
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
  /** One line saying what the section is for. Not the legal text itself. */
  summary: string;
  /**
   * The actual text, one string per paragraph.
   *
   * These sections used to carry a heading, a summary and a list of holes. That
   * was the right shape while nothing could be written: a page that obviously
   * has holes in it cannot be mistaken for finished legal text. But most of the
   * holes were not facts PAAIPE holds - they were text nobody had written, and
   * leaving them unwritten kept the item blocked on the owner for work that was
   * never theirs.
   *
   * What remains in `placeholders` is only what PAAIPE alone can supply.
   */
  body: readonly string[];
  /** Values only PAAIPE can supply. Rendered visibly unresolved. */
  placeholders: string[];
}

export const PRIVACY_DRAFT: readonly LegalSection[] = [
  {
    heading: 'About this notice',
    summary: 'Who is responsible for your information, and what this notice covers.',
    body: [
      'PAAIPE - the Philippine Association of AI Professionals and Entrepreneurs - is the personal information controller for the information described here.',
      'This notice explains what this website collects, why, on what legal basis, how long it is kept, and what you can ask us to do about it. It is written to meet Section 16 of the Data Privacy Act of 2012 (Republic Act No. 10173) and Section 34 of its Implementing Rules and Regulations.',
      'It covers this public website only. Events, membership and any service PAAIPE operates elsewhere are covered by their own notices.',
    ],
    placeholders: [],
  },
  {
    heading: 'What this website collects',
    summary: 'What a person sends to PAAIPE directly by using this site.',
    body: [
      'Nothing that you type. This website has no form, no account, no sign-in and no submission of any kind. There is nowhere on it to send us your name, your email address or anything else.',
      'There is no analytics service, no advertising pixel and no third-party tracker on any page.',
      'One value is stored in your own browser: a record that you closed the announcement bar, written only at the moment you click to close it. It stays on your device, it is readable only by your browser, and it never reaches PAAIPE or anyone else. Clearing your browser storage removes it.',
    ],
    placeholders: [],
  },
  {
    heading: 'What our hosting provider records',
    summary: 'What is logged in the ordinary course of serving a web page.',
    body: [
      'Serving a web page necessarily creates a request log. This site is hosted by Netlify, which records ordinary server log data - including your IP address, the time of the request, the page requested, and information about your browser and device.',
      'An IP address can identify a person, so this is processing of personal data and PAAIPE is accountable for it. It happens whether or not you ever contact us.',
      'The legal basis is PAAIPE\u2019s legitimate interests under Section 12(f) of the Act: operating the website and keeping it secure. We do not ask for your consent to it, because consent is not the applicable basis and asking for consent we do not need would be misleading. You may object to this processing - see Your rights below.',
      'Netlify\u2019s public privacy statement does not state a retention period for this data; it is governed by the data processing agreement between Netlify and its customer, so the period is confirmed from that agreement rather than guessed at here.',
    ],
    placeholders: ['HOSTING LOG RETENTION PERIOD, CONFIRMED FROM NETLIFY\u2019S DPA'],
  },
  {
    heading: 'Cookies',
    summary: 'Why there is no cookie banner.',
    body: [
      'PAAIPE sets no cookies on this website. No analytics cookie, no advertising cookie, no third-party cookie.',
      'The announcement-bar preference described above is stored in your browser\u2019s local storage, which is not a cookie: it is never attached to a request and never sent to a server.',
      'There is no consent banner because there is nothing to consent to. A banner asking permission for processing that is not happening would be a misleading design, not a protection.',
    ],
    placeholders: [],
  },
  {
    heading: 'Who else sees your information',
    summary: 'Third parties that process information on PAAIPE\u2019s behalf.',
    body: [
      'Only the hosting provider named above, and only the request logs described there.',
      'PAAIPE has contracted no other processor for this website. No mailing list, no analytics service, no customer-relationship system and no advertising network receives anything from these pages, because nothing on these pages collects anything to send.',
      'If that changes, this notice is updated before the change goes live, not after. PAAIPE remains accountable for your information wherever it is processed, including outside the Philippines, and uses contractual means to require a comparable level of protection, as Section 21 of the Act requires.',
    ],
    placeholders: [],
  },
  {
    heading: 'How long it is kept',
    summary: 'Retention, and what happens at the end of the period.',
    body: [
      'PAAIPE holds no database of website visitors. There is nothing for us to keep, because nothing is collected.',
      'The hosting request logs are held by the hosting provider under its own retention schedule, stated above.',
    ],
    placeholders: [],
  },
  {
    heading: 'Your rights',
    summary: 'The rights the Data Privacy Act gives you, and how to use them.',
    body: [
      'Under the Data Privacy Act you have the right to be informed; to access your personal information; to object to processing; to have it corrected; to have it erased or blocked; to data portability; to be indemnified for damages; and to complain to the National Privacy Commission.',
      'To exercise any of these, contact PAAIPE\u2019s Data Protection Officer using the details below. You do not need to give a reason, and exercising a right costs nothing.',
      'You may also complain directly to the National Privacy Commission, 5th Floor Delegation Building, PICC Complex, Roxas Boulevard, Pasay City, or through privacy.gov.ph.',
      'PAAIPE has not yet designated a Data Protection Officer. NPC Advisory 2017-01 requires a controller to publish the officer\u2019s contact details in its privacy notice, so this notice is not complete until that designation is made, and it is published here as a draft for that reason. PAAIPE has also not published a contact address, so at present there is no channel on this website through which to send a privacy request - and saying otherwise would be worse than saying nothing. Your right to complain to the National Privacy Commission is unaffected and can be used directly, without going through PAAIPE first.',
      'One practical note, so the rights above are not overstated: because this website collects nothing from you, there is in most cases nothing for PAAIPE to retrieve, correct or erase. The rights are real and they apply; the honest position is that the material they would apply to does not currently exist.',
    ],
    placeholders: [
      'DATA PROTECTION OFFICER - DESIGNATION, POSTAL ADDRESS, TELEPHONE AND ROLE-BASED EMAIL',
    ],
  },
  {
    heading: 'Children',
    summary: 'Who this website is for.',
    body: [
      'This website is intended for professionals, entrepreneurs, educators, students and others with an interest in artificial intelligence. It is not directed at children, and it collects nothing from anyone, including children.',
    ],
    placeholders: [],
  },
  {
    heading: 'Links to other services',
    summary: 'Destinations operated by other organisations.',
    body: [
      'Some pages link to services PAAIPE does not operate. Following such a link takes you to an organisation with its own privacy notice and its own responsibilities, and this notice stops applying at that point.',
      'PAAIPE does not pass your information to those services. A link is a link: nothing about you travels with it beyond what your own browser sends any website you visit.',
    ],
    placeholders: [],
  },
  {
    heading: 'When registration and subscriptions are switched on',
    summary:
      'Forward-looking. These features are not enabled, and this section describes what will change on the day they are.',
    body: [
      'Read this as a statement of intent, not of current practice. Nothing described in this section is happening today, and no control on this website can start it.',
      'When event registration is enabled, it will collect your email address; a record of whether you ticked the box asking for updates, and only if you ticked it; and the version of this notice you were shown, which is the evidence of what you were told at the time. Nothing else. The basis is Section 12(b) of the Act - steps taken at your own request - so that PAAIPE can register you, confirm it, and send you the details and any changes for the event you asked about.',
      'Marketing will be separate from registration: never bundled with it, never pre-ticked, and withdrawable at any time without affecting a registration you have already made.',
      'When you unsubscribe, PAAIPE will delete your address and keep only a one-way cryptographic fingerprint of it, for the single purpose of never contacting you again. Your address cannot be read back from that fingerprint. Keeping it is how an unsubscribe survives a future list import that would otherwise add you back with nobody able to tell.',
      'One practical limit on deletion, stated because it is true rather than because anyone would notice: a message already on its way to you may take a short time to clear after you ask to be removed. Anything queued is cleared by a scheduled job; nothing new is sent.',
      'This notice will be updated with the processors, the retention periods and the security measures that actually apply before any of it is switched on.',
    ],
    placeholders: [],
  },
  {
    heading: 'Changes to this notice',
    summary: 'How updates are made and shown.',
    body: [
      'This notice is published on this page and carries the date it took effect. When it changes materially, the new version is published here before the change it describes takes effect.',
      'Because PAAIPE holds no contact details for website visitors, there is no mailing list to notify. This page is the notification.',
    ],
    placeholders: ['EFFECTIVE DATE, ON ADOPTION BY PAAIPE'],
  },
];

export const TERMS_DRAFT: readonly LegalSection[] = [
  {
    heading: 'Purpose of this website',
    summary: 'What the public site is for, and what it is not.',
    body: [
      'This website is published by PAAIPE, the Philippine Association of AI Professionals and Entrepreneurs, as a public information service about the association, its programs and its events.',
      'Using it means accepting these terms. If you do not accept them, please do not use the site.',
      'The site is informational. It is not a marketplace, it sells nothing, and it processes no transaction. Nothing on it is an offer capable of acceptance.',
    ],
    placeholders: ['PAAIPE\u2019S REGISTERED NAME AND POSTAL ADDRESS AS RECORDED WITH THE SEC'],
  },
  {
    heading: 'Not professional advice',
    summary: 'The limit of what the information here can be relied on for.',
    body: [
      'Everything published here is general information about artificial intelligence and its adoption. It is not legal, financial, medical, engineering or other professional advice, and it is not a substitute for advice from a qualified professional who knows your circumstances.',
      'This matters more than the usual boilerplate, because the subject is one where a confident general statement can be badly wrong in a particular case. Decisions about deploying AI in your organisation - especially where they touch personal data, employment, safety or regulated activity - should be taken with advice specific to your situation.',
      'PAAIPE does not warrant that any material here is complete, current or fit for a particular purpose, and you rely on it at your own discretion.',
    ],
    placeholders: [],
  },
  {
    heading: 'Membership and applications',
    summary: 'That applying is not joining, and acceptance is at PAAIPE\u2019s discretion.',
    body: [
      'Membership is governed by PAAIPE\u2019s own membership terms, not by these terms of use, and information about membership on this site is descriptive rather than contractual.',
      'Submitting an application is not joining. Applications are reviewed by people, and PAAIPE may decline an application, or end a membership, in accordance with its constitution and by-laws.',
      'Where this site describes fees, benefits or eligibility, those descriptions may change. The membership terms in force when you apply are the ones that govern.',
    ],
    placeholders: [],
  },
  {
    heading: 'Events',
    summary: 'What is expected of participants, and what may be recorded.',
    body: [
      'Attending a PAAIPE event means agreeing to take part respectfully and lawfully. PAAIPE may decline or end anyone\u2019s participation in a session where conduct makes it unreasonable for others to continue.',
      'Some sessions are recorded. Where a session is recorded this is stated on the event page before you join, and the recording captures the speaker and anyone who turns their camera or microphone on. A recording is published only where the speaker has agreed and PAAIPE holds the rights to publish it, and it is removed on request from anyone identifiable in it.',
      'Where a session includes a prize draw, the mechanics, the entry period and the eligibility criteria are published with that event.',
    ],
    placeholders: [],
  },
  {
    heading: 'Partner benefits',
    summary: 'That partner offers are the provider\u2019s, not PAAIPE\u2019s.',
    body: [
      'Where PAAIPE describes a discount, tool, program or offer provided by another organisation, that offer is made by that organisation on its own terms and is subject to change or withdrawal by it.',
      'PAAIPE does not guarantee any partner offer, is not a party to any agreement you make with a partner, and is not responsible for a partner\u2019s performance.',
    ],
    placeholders: [],
  },
  {
    heading: 'Acceptable use',
    summary: 'What you may and may not do with this website.',
    body: [
      'You may read, quote and share what is published here, and link to it freely.',
      'You must not attempt to gain unauthorised access to this site, any account, or any system connected to it; interfere with its operation; or place a load on it that a reasonable visitor would not. Unauthorised access to a computer system is an offence under the Cybercrime Prevention Act of 2012 (Republic Act No. 10175).',
      'You must not use this site to break the law, to misrepresent yourself as PAAIPE or as speaking for it, or to collect information about other people.',
      'Automated retrieval for ordinary purposes such as search indexing is fine. Retrieval at a rate or scale that degrades the service for others is not.',
    ],
    placeholders: [],
  },
  {
    heading: 'Intellectual property',
    summary: 'Who owns what, and how PAAIPE\u2019s name and logo may be used.',
    body: [
      'Text, images, layout and code published here are owned by PAAIPE or used with permission, and are protected by the Intellectual Property Code of the Philippines (Republic Act No. 8293). Copyright subsists without registration.',
      'You may quote a reasonable extract with attribution to PAAIPE and a link to the source page - that is fair use for purposes such as commentary, teaching, research and news reporting under Section 185 of the Code. Reproducing a whole page or a substantial part of the site, or republishing material as your own, is not.',
      'The PAAIPE name and logo are the association\u2019s marks. You may use them to refer to PAAIPE accurately - in reporting, in describing a partnership that exists, or in citing this site. You may not use them in a way that suggests PAAIPE endorses you, your product or your organisation without written permission, and you may not alter the logo.',
    ],
    placeholders: [],
  },
  {
    heading: 'Anything you send us',
    summary: 'What happens to a proposal, question or other material you submit.',
    body: [
      'If you send PAAIPE a topic proposal, a speaker offer, feedback or other material, you keep ownership of it.',
      'You give PAAIPE permission to read it, to circulate it internally, and to act on it for the purpose you sent it for. PAAIPE will not publish material you send without asking you first.',
      'Please do not send confidential information, and do not send anything you do not have the right to share.',
    ],
    placeholders: [],
  },
  {
    heading: 'Links to other services',
    summary: 'That linked destinations are operated by others.',
    body: [
      'This site links to services PAAIPE does not operate. Those services have their own terms and their own privacy notices, and PAAIPE has no control over their content or availability.',
      'A link is not an endorsement, and PAAIPE is not responsible for what you find at the other end of one.',
    ],
    placeholders: [],
  },
  {
    heading: 'Availability and changes',
    summary: 'That the site is provided as it is, and may change.',
    body: [
      'This website is provided as it is and as it is available. PAAIPE does not promise that it will be uninterrupted or error-free, and may change, suspend or withdraw any part of it at any time.',
      'These terms may change. The version published on this page is the one in force, and it carries the date it took effect.',
    ],
    placeholders: ['EFFECTIVE DATE, ON ADOPTION BY PAAIPE'],
  },
  {
    heading: 'Liability',
    summary: 'The limit of PAAIPE\u2019s responsibility, and the limit of that limit.',
    body: [
      'To the fullest extent Philippine law permits, PAAIPE is not liable for loss or damage arising from your use of this website or from reliance on information published here.',
      'Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited, including liability for fraud, and nothing here removes any right you have under the Consumer Act of the Philippines (Republic Act No. 7394) or the Data Privacy Act of 2012 (Republic Act No. 10173).',
    ],
    placeholders: [],
  },
  {
    heading: 'Electronic communications',
    summary: 'That electronic records here have legal effect.',
    body: [
      'Communications and records in electronic form have legal effect under the Electronic Commerce Act of 2000 (Republic Act No. 8792). Publishing these terms on this page is effective notice of them.',
    ],
    placeholders: [],
  },
  {
    heading: 'Governing law',
    summary: 'Which law applies and where a dispute is heard.',
    body: [
      'These terms are governed by the laws of the Republic of the Philippines.',
      'Any dispute arising from them is submitted to the exclusive jurisdiction of the proper courts of the city named below, without prejudice to any right you have to bring a complaint before the National Privacy Commission or another regulator.',
    ],
    placeholders: ['VENUE - THE CITY OF PAAIPE\u2019S PRINCIPAL OFFICE'],
  },
  {
    heading: 'Contact',
    summary: 'Where to send a question about these terms.',
    body: [
      'PAAIPE has not yet published a contact address, so this website currently offers no way to send a question about these terms. When one is published it will appear on the contact page. Privacy questions and requests will go to the Data Protection Officer named in the privacy notice, and until one is designated the National Privacy Commission can be approached directly.',
    ],
    placeholders: [],
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
