import { describe, expect, it } from 'vitest';
import {
  ACCESSIBILITY_PAGE,
  COLLABORATION_AREAS,
  CONTACT_PAGE,
  COOKIE_POSITION,
  DISCLAIMERS,
  PARTNERSHIP_PROCESS,
  PARTNERS_PAGE,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_CAVEAT,
  PRIVACY_DRAFT,
  RESPONSIBLE_AI,
  TERMS_DRAFT,
  approvedPartners,
  policies,
} from '../content';
import { findRoute } from '../config/routes';

describe('partners page', () => {
  it('uses the approved heading and CTA', () => {
    expect(PARTNERS_PAGE.heading).toBe(findRoute('/partners').heading);
    expect(PARTNERS_PAGE.cta).toBe('Start a Partnership Conversation');
  });

  it('lists six organisation categories, seven collaboration areas and five process steps', () => {
    expect(PARTNER_CATEGORIES).toHaveLength(6);
    expect(COLLABORATION_AREAS).toHaveLength(7);
    expect(PARTNERSHIP_PROCESS).toHaveLength(5);
  });

  it('states that a category is not a partnership', () => {
    expect(PARTNER_CATEGORY_CAVEAT).toBe(
      'Listing a category does not indicate an existing partnership.',
    );
  });

  it('names no organisation, because none is approved', () => {
    expect(approvedPartners).toEqual([]);
    const text = JSON.stringify([PARTNERS_PAGE, PARTNER_CATEGORIES, COLLABORATION_AREAS]);
    expect(text).not.toMatch(/\b(inc\.|corp\.|ltd\.|llc|openai|google|microsoft|aws)\b/i);
  });

  it('requires approval before anything is announced', () => {
    expect(DISCLAIMERS.partnershipApproval).toContain('should be announced');
    expect(DISCLAIMERS.partnershipApproval).toContain('formally approved');
  });
});

describe('responsible AI page claims nothing it cannot support', () => {
  it('carries the six principles', () => {
    expect(RESPONSIBLE_AI.principles).toHaveLength(6);
    expect(RESPONSIBLE_AI.principles.map((p) => p.name)).toContain('Human accountability');
  });

  it('makes no compliance, certification, audit or safety guarantee', () => {
    const text = JSON.stringify(RESPONSIBLE_AI);
    // Match the CLAIM, not the word: the scope note legitimately uses
    // "certification" and "audit" to say there is none.
    expect(text).not.toMatch(/\bwe are (certified|compliant|audited)\b/i);
    expect(text).not.toMatch(/\b(fully|legally) compliant\b/i);
    expect(text).not.toMatch(/\b(guarantees?|ensures?) (safety|compliance|accuracy)\b/i);
    expect(text).not.toMatch(/\bISO ?\d|\bSOC ?2\b|\bGDPR[- ]compliant\b/i);
  });

  it('says outright that it is not a certification', () => {
    expect(RESPONSIBLE_AI.scopeNote).toMatch(/not a certification/i);
    expect(RESPONSIBLE_AI.scopeNote).toMatch(/does not assess or certify/i);
  });
});

describe('contact page invents nothing', () => {
  it('lists the eight approved inquiry pathways', () => {
    expect(CONTACT_PAGE.pathways).toHaveLength(8);
    expect(CONTACT_PAGE.pathways).toContain('Privacy request');
  });

  it('carries no address, phone number, email or response-time commitment', () => {
    const text = JSON.stringify(CONTACT_PAGE);
    expect(text).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
    expect(text).not.toMatch(/\+?\d[\d\s()-]{7,}/);
    expect(text).not.toMatch(/\bwithin \d+ (hours?|days?|business days?)\b/i);
    expect(text).not.toMatch(/\b(we (will )?(reply|respond)) (within|in)\b/i);
  });

  it('explains why there is nothing to send a message with', () => {
    expect(CONTACT_PAGE.unavailableNote).toMatch(/nothing here that could send a message/i);
  });
});

describe('legal pages are visibly draft', () => {
  it('keeps both policies in draft with the exact approved banner', () => {
    const privacy = policies.find((p) => p.slug === 'privacy')!;
    const terms = policies.find((p) => p.slug === 'terms')!;
    expect(privacy.reviewBanner).toBe(
      'DRAFT FOR REVIEW - This page requires approved organization details and legal/privacy review before production release.',
    );
    expect(terms.reviewBanner).toBe(
      'DRAFT FOR REVIEW - This structure requires legal review before production release.',
    );
  });

  it('covers every subject the master command lists', () => {
    /*
     * BY SUBJECT, not by section count or by heading wording.
     *
     * This asserted `toHaveLength(11)` on each document. That pinned a
     * structure rather than a property: it would have passed eleven empty
     * sections, and it failed the moment the notice gained a section it needed
     * - liability, governing law and "not professional advice" among them.
     * A legal document is judged on what it addresses, not on how many
     * headings it took to address it.
     */
    const privacy = JSON.stringify(PRIVACY_DRAFT).toLowerCase();
    const terms = JSON.stringify(TERMS_DRAFT).toLowerCase();

    const privacySubjects: [string, RegExp][] = [
      ['who controls the data', /personal information controller/],
      ['what is collected', /no form|collects nothing|nothing that you type/],
      ['server logs', /request log|ip address/],
      ['lawful basis', /section 12\(f\)|legitimate interest/],
      ['cookies', /cookie/],
      ['processors', /hosting provider|processor/],
      ['retention', /retention|how long/],
      ['data subject rights', /right to be informed|right to access|your rights/],
      ['the regulator', /national privacy commission/],
      ['the DPO', /data protection officer/],
      ['children', /child|children/],
      ['external links', /links? to other services|another organisation/],
      ['changes', /changes to this notice|took effect/],
    ];
    const termsSubjects: [string, RegExp][] = [
      ['acceptance', /accepting these terms|do not use the site/],
      ['not professional advice', /not legal, financial/],
      ['membership', /membership/],
      ['events', /event/],
      ['partner offers', /partner/],
      ['acceptable use', /unauthorised access/],
      ['intellectual property', /intellectual property code|republic act no. 8293/],
      ['submissions', /you keep ownership/],
      ['third-party links', /links to other services/],
      ['availability', /as it is and as it is available/],
      ['liability', /not liable/],
      ['electronic records', /republic act no. 8792/],
      ['governing law', /laws of the republic of the philippines/],
      ['contact', /contact page/],
    ];

    for (const [subject, pattern] of privacySubjects) {
      expect(pattern.test(privacy), `privacy notice does not address: ${subject}`).toBe(true);
    }
    for (const [subject, pattern] of termsSubjects) {
      expect(pattern.test(terms), `terms of use do not address: ${subject}`).toBe(true);
    }
  });

  it('leaves no section without text', () => {
    /*
     * What replaced "there must be more than ten holes".
     *
     * A heading with a one-line summary and no body is the shape this document
     * had while nothing was written, and it is indistinguishable from a section
     * someone forgot to finish.
     */
    for (const section of [...PRIVACY_DRAFT, ...TERMS_DRAFT]) {
      expect(section.body.length, `${section.heading} has no body`).toBeGreaterThan(0);
      for (const paragraph of section.body) {
        expect(paragraph.length, `${section.heading} has a stub paragraph`).toBeGreaterThan(40);
      }
    }
  });

  it('leaves unresolved values as bracketed placeholders, not boilerplate', () => {
    /*
     * The count assertion is gone deliberately. It required MORE THAN TEN
     * unresolved values in each document - which made "the text is written" a
     * test failure, and would have kept the pages unfinished to keep the suite
     * green. What matters was never the number; it is that whatever remains
     * unresolved is impossible to mistake for finished prose.
     */
    const placeholders = [...PRIVACY_DRAFT, ...TERMS_DRAFT].flatMap((s) => s.placeholders);
    for (const placeholder of placeholders) {
      // Upper-case tokens, so a reader cannot mistake one for prose.
      const letters = placeholder.replace(/[^A-Za-z]/g, '');
      expect(letters, placeholder).toBe(letters.toUpperCase());
      expect(placeholder.length, placeholder).toBeGreaterThan(8);
    }
  });

  it('names no vendor this site does not use', () => {
    const text = JSON.stringify([PRIVACY_DRAFT, TERMS_DRAFT]);
    expect(text).not.toMatch(
      /\b(google analytics|hotjar|mixpanel|segment|facebook pixel|cloudflare|mailchimp|hubspot)\b/i,
    );
  });

  it('does not claim the terms are final or approved', () => {
    /*
     * Scanned over the TEXT ONLY, not over the placeholders.
     *
     * A placeholder reading "EFFECTIVE DATE, ON ADOPTION BY PAAIPE" is the
     * document saying it has no effective date yet - the opposite of claiming
     * one. Scanning the whole object flagged that placeholder and would have
     * forced the document to stop naming the very thing it is waiting for:
     * a gate objecting to the explanation of the rule rather than to a breach
     * of it.
     */
    const text = [...PRIVACY_DRAFT, ...TERMS_DRAFT]
      .flatMap((section) => [section.heading, section.summary, ...section.body])
      .join(' ');
    expect(text).not.toMatch(/\b(these terms are|this notice is) (final|effective|in force)\b/i);
    expect(text).not.toMatch(/\blast updated\b|\beffective date\b/i);
  });
});

describe('accessibility page states a goal, not conformance', () => {
  it('carries the approved statement and feedback copy', () => {
    expect(ACCESSIBILITY_PAGE.statement).toContain('as many people as reasonably possible');
    expect(ACCESSIBILITY_PAGE.feedback).toContain('include the page, device and issue');
  });

  it('claims no certification or conformance level', () => {
    const text = JSON.stringify(ACCESSIBILITY_PAGE);
    expect(text).not.toMatch(/\b(WCAG\s*2\.\d\s*(A{1,3}|AA)\s*(compliant|conformant))\b/i);
    expect(text).not.toMatch(/\b(fully accessible|certified accessible|VPAT)\b/i);
    expect(ACCESSIBILITY_PAGE.conformanceNote).toMatch(/not a claim of conformance/i);
  });

  it('lists only measures that a gate in this repository actually performs', () => {
    expect(ACCESSIBILITY_PAGE.measuresTaken.length).toBeGreaterThanOrEqual(5);
    const text = ACCESSIBILITY_PAGE.measuresTaken.join(' ');
    expect(text).toMatch(/axe-core/);
    expect(text).toMatch(/JavaScript disabled/);
    expect(text).toMatch(/360, 390, 768, 1024 and 1440/);
  });
});

describe('cookie position', () => {
  it('shows no consent banner, and records why', () => {
    // Tab 10: a necessary-only site must not show a performative banner.
    expect(COOKIE_POSITION.bannerShown).toBe(false);
    expect(COOKIE_POSITION.reason).toMatch(/no analytics/i);
    expect(COOKIE_POSITION.reason).toMatch(/nothing to consent to/i);
  });
});
