import { describe, expect, it } from 'vitest';
import {
  allEvents,
  allResources,
  allPrograms,
  approvedPartners,
  approvedSpeakers,
  benefitCategories,
  memberBenefits,
  membershipFaqs,
  policies,
  primaryNav,
  socialLinks,
  configuredSocialLinks,
  ORGANIZATION,
  AUDIENCES,
  VALUES,
  SIGNATURE_EVENT,
  APPLICANT_PENDING_NOTICE,
  DISCLAIMERS,
} from '../content';
import { publicEventSchema, publicResourceSchema, policySchema } from '../content/schemas';
import { ACRONYM, ORGANIZATION_NAME, SLOGAN } from '../config/site';

/** Every registry that must be non-empty for the site to have content at all. */
const POPULATED = {
  events: allEvents,
  resources: allResources,
  programs: allPrograms,
  memberBenefits,
  benefitCategories,
  membershipFaqs,
  policies,
  primaryNav,
  socialLinks,
};

describe('registry validation ran and found real records', () => {
  it.each(Object.entries(POPULATED))('%s is populated', (_name, records) => {
    // Without this, every assertion below would pass vacuously on an empty array.
    expect(records.length).toBeGreaterThan(0);
  });

  it('gives every record a unique slug within its registry', () => {
    for (const [name, records] of Object.entries(POPULATED)) {
      const slugs = records
        .map((record) => (record as { slug?: string }).slug)
        .filter((slug): slug is string => typeof slug === 'string');
      if (slugs.length === 0) continue;
      expect(new Set(slugs).size, `${name} has duplicate slugs`).toBe(slugs.length);
    }
  });
});

describe('approved identity copy', () => {
  it('uses the exact organisation name, acronym and slogan', () => {
    expect(ORGANIZATION.name).toBe(ORGANIZATION_NAME);
    expect(ORGANIZATION.acronym).toBe(ACRONYM);
    expect(ORGANIZATION.slogan).toBe(SLOGAN);
  });

  it('carries the five approved audiences and the five approved values', () => {
    expect(AUDIENCES).toHaveLength(5);
    expect(VALUES).toEqual([
      'Responsible',
      'Inclusive',
      'Practical',
      'Collaborative',
      'Future-focused',
    ]);
  });

  it('states the signature event schedule exactly as approved', () => {
    expect(SIGNATURE_EVENT.recurrence).toBe('Every second Tuesday');
    expect(SIGNATURE_EVENT.time).toBe('8:00 PM PHT');
    expect(SIGNATURE_EVENT.duration).toBe('One hour maximum');
    expect(SIGNATURE_EVENT.timeZone).toBe('Asia/Manila');
    expect(SIGNATURE_EVENT.agenda).toHaveLength(4);
  });

  it('keeps the applicant-pending notice available for component tests only', () => {
    expect(APPLICANT_PENDING_NOTICE).toContain('Verification in progress.');
    expect(APPLICANT_PENDING_NOTICE).toContain('Members Portal');
  });

  it('holds the partner caveat wording centrally so it cannot drift per page', () => {
    expect(DISCLAIMERS.partnerBenefits).toContain('not guaranteed');
    expect(DISCLAIMERS.partnerBenefitsShort).toBe(
      'Benefits are subject to availability, eligibility and partner terms.',
    );
  });
});

describe('nothing unapproved claims to be real', () => {
  it('has no approved speaker and no approved partner', () => {
    // Both must stay empty until PAAIPE approves a named person or organisation
    // with usage rights. A name here is a claim about a real party.
    expect(approvedSpeakers).toEqual([]);
    expect(approvedPartners).toEqual([]);
  });

  it('never attaches a speaker to non-approved content', () => {
    for (const event of allEvents) {
      if (event.contentStatus !== 'approved') expect(event.approvedSpeaker).toBeUndefined();
    }
  });

  it('never gives non-approved content a publication date', () => {
    for (const resource of allResources) {
      if (resource.contentStatus !== 'approved') expect(resource.publishedAt).toBeUndefined();
    }
  });

  it('never gives a sample event an invented date', () => {
    for (const event of allEvents) {
      if (event.contentStatus === 'sample') expect(event.date).toBeUndefined();
    }
  });

  it('renders no social link that PAAIPE has not supplied', () => {
    expect(configuredSocialLinks).toEqual([]);
    expect(socialLinks.every((link) => link.href === undefined)).toBe(true);
  });
});

describe('members-only content exposes only a synopsis', () => {
  it('gives no members-only resource any public body copy', () => {
    for (const resource of allResources) {
      if (resource.visibility === 'members-only') {
        expect(resource.publicBody, `${resource.slug} leaks protected body copy`).toBeUndefined();
      }
    }
  });

  it('never advertises open public registration on a members-only event', () => {
    for (const event of allEvents) {
      if (event.visibility === 'members-only') {
        expect(event.registrationState).not.toBe('registration-open');
      }
    }
  });

  it('has at least one members-only resource, so the rule is actually exercised', () => {
    expect(allResources.some((r) => r.visibility === 'members-only')).toBe(true);
  });
});

describe('schema invariants reject bad records', () => {
  const validEvent = allEvents[0]!;

  it('rejects "Limited Capacity" without configured capacity data', () => {
    const result = publicEventSchema.safeParse({
      ...validEvent,
      visibility: 'public',
      registrationState: 'limited-capacity',
    });
    expect(result.success).toBe(false);
  });

  it('accepts "Limited Capacity" once capacity is configured', () => {
    const result = publicEventSchema.safeParse({
      ...validEvent,
      visibility: 'public',
      registrationState: 'limited-capacity',
      capacityConfigured: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown key instead of silently dropping it', () => {
    // A non-strict object would strip `titel` and the record would validate
    // with a missing title - a typo would look like missing content.
    const result = publicEventSchema.safeParse({ ...validEvent, titel: 'typo' });
    expect(result.success).toBe(false);
  });

  it('rejects a members-only resource that carries public body copy', () => {
    const memberResource = allResources.find((r) => r.visibility === 'members-only')!;
    const result = publicResourceSchema.safeParse({
      ...memberResource,
      publicBody: [{ type: 'paragraph', text: 'protected content' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-ISO date', () => {
    const result = publicEventSchema.safeParse({ ...validEvent, date: '12 March 2027' });
    expect(result.success).toBe(false);
  });

  it('rejects a draft policy with no review banner', () => {
    const result = policySchema.safeParse({
      slug: 'privacy',
      title: 'Privacy Notice',
      status: 'draft-for-review',
    });
    expect(result.success).toBe(false);
  });
});

describe('legal pages', () => {
  it('keeps privacy and terms in draft with a visible banner', () => {
    for (const slug of ['privacy', 'terms']) {
      const policy = policies.find((p) => p.slug === slug)!;
      expect(policy.status).toBe('draft-for-review');
      expect(policy.reviewBanner).toContain('DRAFT FOR REVIEW');
    }
  });
});

describe('navigation', () => {
  it('links only to site-relative public routes', () => {
    const flat = primaryNav.flatMap((item) => [item, ...(item.children ?? [])]);
    for (const item of flat) {
      expect(item.href.startsWith('/')).toBe(true);
      expect(['/dashboard', '/community', '/profile', '/login']).not.toContain(item.href);
    }
  });

  it('keeps every grouped child reachable as its own link', () => {
    for (const item of primaryNav) {
      for (const child of item.children ?? []) {
        expect(child.href.trim().length).toBeGreaterThan(1);
      }
    }
  });
});

describe('primary navigation has no duplicate destination', () => {
  it('lists every href exactly once across parents and children', () => {
    // Two links to the same URL both claim aria-current="page", which is
    // ambiguous to announce. Caught here rather than in a browser test.
    const hrefs = primaryNav.flatMap((item) => [
      item.href,
      ...(item.children ?? []).map((child) => child.href),
    ]);
    const duplicates = hrefs.filter((href, index) => hrefs.indexOf(href) !== index);
    expect(duplicates).toEqual([]);
  });
});
