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

  it('covers every section the master command lists', () => {
    expect(PRIVACY_DRAFT).toHaveLength(11);
    expect(TERMS_DRAFT).toHaveLength(11);
  });

  it('leaves unresolved values as bracketed placeholders, not boilerplate', () => {
    const privacyPlaceholders = PRIVACY_DRAFT.flatMap((s) => s.placeholders);
    const termsPlaceholders = TERMS_DRAFT.flatMap((s) => s.placeholders);
    expect(privacyPlaceholders.length).toBeGreaterThan(10);
    expect(termsPlaceholders.length).toBeGreaterThan(10);
    for (const placeholder of [...privacyPlaceholders, ...termsPlaceholders]) {
      // Upper-case tokens, so a reader cannot mistake one for prose.
      expect(placeholder, placeholder).toBe(placeholder.toUpperCase());
    }
  });

  it('names no vendor this site does not use', () => {
    const text = JSON.stringify([PRIVACY_DRAFT, TERMS_DRAFT]);
    expect(text).not.toMatch(
      /\b(google analytics|hotjar|mixpanel|segment|facebook pixel|cloudflare|mailchimp|hubspot)\b/i,
    );
  });

  it('does not claim the terms are final or approved', () => {
    const text = JSON.stringify([PRIVACY_DRAFT, TERMS_DRAFT]);
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
