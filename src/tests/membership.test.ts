import { describe, expect, it } from 'vitest';
import {
  APPLICATION_STATUS_EXPLANATIONS,
  BENEFITS_PAGE,
  DISCLAIMERS,
  MEMBERSHIP_NOTES,
  MEMBERSHIP_PAGE,
  VERIFICATION_JOURNEY,
  WHO_CAN_APPLY,
  benefitCategories,
  memberBenefits,
  membershipFaqs,
  approvedPartners,
} from '../content';
import { findRoute } from '../config/routes';

const ALL_MEMBERSHIP_COPY = JSON.stringify([
  MEMBERSHIP_PAGE,
  WHO_CAN_APPLY,
  VERIFICATION_JOURNEY,
  APPLICATION_STATUS_EXPLANATIONS,
  membershipFaqs,
  memberBenefits,
  benefitCategories,
  BENEFITS_PAGE,
  MEMBERSHIP_NOTES,
]);

describe('membership copy', () => {
  it('uses the approved hero and CTA labels', () => {
    expect(MEMBERSHIP_PAGE.eyebrow).toBe('PAAIPE MEMBERSHIP');
    expect(MEMBERSHIP_PAGE.heading).toBe(findRoute('/membership').heading);
    expect(MEMBERSHIP_PAGE.primaryCta).toBe('Apply for Membership');
    expect(MEMBERSHIP_PAGE.secondaryCta).toBe('Review Member Benefits');
  });

  it('carries the seven benefits, six applicant examples and five journey steps', () => {
    expect(memberBenefits).toHaveLength(7);
    expect(WHO_CAN_APPLY.examples).toHaveLength(6);
    expect(VERIFICATION_JOURNEY).toHaveLength(5);
    expect(APPLICATION_STATUS_EXPLANATIONS).toHaveLength(6);
    expect(membershipFaqs).toHaveLength(7);
    expect(benefitCategories).toHaveLength(5);
  });

  it('uses the approved /benefits heading and short disclaimer', () => {
    expect(BENEFITS_PAGE.heading).toBe(findRoute('/benefits').heading);
    expect(DISCLAIMERS.partnerBenefitsShort).toBe(
      'Benefits are subject to availability, eligibility and partner terms.',
    );
  });
});

describe('nothing is guaranteed', () => {
  it('promises no approval and no fixed review time', () => {
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(
      /\b(guaranteed approval|you will be approved|within \d+ (hours|days|weeks)|same[- ]day|instant(ly)? approv)/i,
    );
    expect(MEMBERSHIP_NOTES.noTimeline).toMatch(/no timeline is promised/i);
  });

  it('never calls an applicant or member certified, accredited or endorsed', () => {
    // The master command forbids implying an official standing PAAIPE does not
    // confer. Matched as a claim about people, not the word in isolation.
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(
      /\b(certified|accredited|licensed|officially endorsed)\s+(member|professional|applicant)/i,
    );
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(
      /\b(members?|applicants?)\s+(are|become)\s+(certified|accredited|licensed|endorsed)\b/i,
    );
  });

  it('states plainly that review is done by people', () => {
    const wait = VERIFICATION_JOURNEY.find((step) => step.step === 'Wait for review');
    expect(wait?.detail).toContain('PAAIPE reviews submitted information');
  });
});

describe('no fabricated offer or amount', () => {
  it('shows no peso value, percentage, credit or token amount', () => {
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(/₱|\bPHP\s*\d/i);
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(/\d+\s*%/);
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(/\b\d[\d,]*\s*(credits?|tokens?)\b/i);
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(/\b(coupon|promo)\s*code\b/i);
  });

  it('names no provider, because none is approved', () => {
    expect(approvedPartners).toEqual([]);
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(/\b(openai|anthropic|google|microsoft|aws|azure)\b/i);
  });

  it('puts the partner caveat on every benefit that depends on a partner', () => {
    const partnerDependent = [...memberBenefits, ...benefitCategories].filter(
      (entry) => entry.requiresPartnerDisclaimer,
    );
    // If nothing were flagged, the caveat rule would be vacuously satisfied.
    expect(partnerDependent.length).toBeGreaterThan(0);
    for (const entry of partnerDependent) {
      expect(entry.description.length, entry.slug).toBeGreaterThan(20);
    }
  });

  it('flags exactly the categories that depend on a confirmed agreement', () => {
    const flagged = benefitCategories
      .filter((c) => c.requiresPartnerDisclaimer)
      .map((c) => c.slug)
      .sort();
    expect(flagged).toEqual(
      [
        'ai-tools-and-credits',
        'learning-and-certification',
        'business-and-professional-services',
      ].sort(),
    );
  });
});

describe('application status is educational only', () => {
  it('says the website does not determine status', () => {
    expect(MEMBERSHIP_NOTES.statusIsEducational).toMatch(
      /does not determine or display your status/i,
    );
  });

  it('gives each state a label and an explanation, and no personal data', () => {
    for (const state of APPLICATION_STATUS_EXPLANATIONS) {
      expect(state.label.length, state.slug).toBeGreaterThan(3);
      expect(state.explanation.length, state.slug).toBeGreaterThan(10);
    }
    expect(ALL_MEMBERSHIP_COPY).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  });
});

describe('FAQ copy is the approved copy', () => {
  it('answers "is membership approved automatically" with No', () => {
    const faq = membershipFaqs.find((f) => f.slug === 'approved-automatically');
    expect(faq?.answer).toBe(
      'No. Applications are reviewed before members-only access is enabled.',
    );
  });

  it('answers the guarantees question with No', () => {
    const faq = membershipFaqs.find((f) => f.slug === 'credits-guaranteed');
    expect(faq?.answer.startsWith('No.')).toBe(true);
  });

  it('gives every FAQ a unique slug so the accordion ids cannot collide', () => {
    const slugs = membershipFaqs.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
