import { describe, expect, it } from 'vitest';
import {
  HOME_AUDIENCE_STRIP,
  HOME_BENEFITS,
  HOME_EVENT,
  HOME_FINAL_CTA,
  HOME_HERO,
  HOME_INSIGHTS,
  HOME_MISSION,
  HOME_PARTNERSHIP,
  HOME_PROGRAMS,
  HOME_UPDATES,
  HOME_WHY,
  HOME_SOCIAL,
  allPrograms,
} from '../content';
import { SLOGAN } from '../config/site';
import { findRoute } from '../config/routes';

describe('home hero', () => {
  it('uses the exact slogan as its H1', () => {
    expect(HOME_HERO.heading).toBe(SLOGAN);
  });

  it('carries the approved eyebrow, supporting line and both CTA labels', () => {
    expect(HOME_HERO.eyebrow).toBe('A COMMUNITY FOR FILIPINO AI BUILDERS');
    expect(HOME_HERO.supportingLine).toBe(
      'Learn continuously. Connect meaningfully. Build responsibly.',
    );
    expect(HOME_HERO.primaryCta).toBe('Join PAAIPE');
    expect(HOME_HERO.secondaryCta).toBe('Explore Our Mission');
  });
});

describe('required narrative flow', () => {
  it('supplies copy for all eleven sections', () => {
    const sections = [
      HOME_HERO,
      HOME_AUDIENCE_STRIP,
      HOME_WHY,
      HOME_MISSION,
      HOME_PROGRAMS,
      HOME_EVENT,
      HOME_BENEFITS,
      HOME_INSIGHTS,
      HOME_UPDATES,
      HOME_PARTNERSHIP,
      HOME_FINAL_CTA,
    ];
    expect(sections).toHaveLength(11);
    for (const [index, section] of sections.entries()) {
      expect(Object.keys(section).length, `section ${index + 1} is empty`).toBeGreaterThan(0);
    }
  });
});

describe('home content matches the approved source', () => {
  it('shows exactly the five approved audiences', () => {
    expect(HOME_AUDIENCE_STRIP.audiences).toHaveLength(5);
  });

  it('shows three "Why PAAIPE" cards', () => {
    expect(HOME_WHY.cards).toHaveLength(3);
    expect(HOME_WHY.cards.map((c) => c.title)).toEqual([
      'A stronger professional community',
      'Practical, useful learning',
      'Responsible progress',
    ]);
  });

  it('names four featured programmes, and every one resolves in the registry', () => {
    expect(HOME_PROGRAMS.featured).toHaveLength(4);
    for (const slug of HOME_PROGRAMS.featured) {
      const program = allPrograms.find((p) => p.slug === slug);
      expect(program, `${slug} is featured on the home page but not in the registry`).toBeDefined();
      // A featured programme must be publishable, or the home page would show
      // a gap in production while looking complete in review.
      expect(program!.contentStatus).toBe('approved');
    }
  });

  it('states the event schedule exactly, and never a meeting URL', () => {
    expect(HOME_EVENT.chips).toEqual([
      'Every second Tuesday',
      '8:00 PM PHT',
      'Private Zoom event',
      'One hour maximum',
    ]);
    expect(HOME_EVENT.agenda).toHaveLength(4);
    expect(JSON.stringify(HOME_EVENT)).not.toMatch(/zoom\.us|http/i);
  });

  it('lists six membership benefits', () => {
    expect(HOME_BENEFITS.items).toHaveLength(6);
  });
});

describe('insights preview promises nothing that does not exist', () => {
  it('shows three items, each marked Coming soon', () => {
    expect(HOME_INSIGHTS.items).toHaveLength(3);
    for (const item of HOME_INSIGHTS.items) {
      expect(item.status).toBe('Coming soon');
    }
  });

  it('gives no item a slug, href or date, so nothing can be linked or dated', () => {
    for (const item of HOME_INSIGHTS.items) {
      expect(Object.keys(item).sort()).toEqual(['status', 'title', 'topic']);
    }
  });
});

describe('updates signup cannot pretend', () => {
  it('explains why it cannot submit', () => {
    expect(HOME_UPDATES.unavailableReason).toContain('not connected');
    expect(HOME_UPDATES.unavailableReason).toMatch(/cannot submit/i);
  });

  it('states the approved consent line', () => {
    expect(HOME_UPDATES.consent).toBe(
      'By subscribing, you agree to receive PAAIPE updates. You can unsubscribe at any time. See our Privacy Notice.',
    );
  });
});

describe('home metadata', () => {
  it('carries the approved description and Open Graph copy', () => {
    const route = findRoute('/');
    expect(route.description).toContain('Join a Filipino community advancing practical');
    expect(route.openGraph?.title).toBe(HOME_SOCIAL.openGraphTitle);
    expect(route.openGraph?.description).toBe(HOME_SOCIAL.openGraphDescription);
  });

  it('uses the exact slogan as the Open Graph title', () => {
    expect(HOME_SOCIAL.openGraphTitle).toBe(SLOGAN);
  });
});

describe('no fabricated claims', () => {
  const everything = JSON.stringify([
    HOME_HERO,
    HOME_AUDIENCE_STRIP,
    HOME_WHY,
    HOME_MISSION,
    HOME_PROGRAMS,
    HOME_EVENT,
    HOME_BENEFITS,
    HOME_INSIGHTS,
    HOME_UPDATES,
    HOME_PARTNERSHIP,
    HOME_FINAL_CTA,
  ]);

  it('contains no member count, percentage or peso figure', () => {
    // "20-30-minute", "8:00 PM" and "second Tuesday" are schedule facts, not
    // impact claims, so the patterns below target claim shapes specifically.
    expect(everything).not.toMatch(/\d[\d,]*\s*(members|professionals|organizations|companies)\b/i);
    expect(everything).not.toMatch(/\d+\s*%/);
    expect(everything).not.toMatch(/₱|PHP\s*\d/);
  });

  it('contains no testimonial, endorsement or superlative claim', () => {
    expect(everything).not.toMatch(/\b(testimonial|endorsed by|trusted by \d|award|certified)\b/i);
    // Match the CLAIM shape, not the word. Approved copy legitimately says
    // "leading with AI" - a verb - and a bare /leading/ flags it. A superlative
    // claim is "the leading community", so the article is what makes it one.
    // `#1` is deliberately outside the \b group: a word boundary cannot fire
    // between a space and `#`, so /\b#1\b/ never matches anything.
    expect(everything).not.toMatch(
      /\b(the\s+(largest|leading|biggest|foremost)|number one|fastest[- ]growing)\b|#1\b/i,
    );
  });

  it('names no speaker, partner or company', () => {
    expect(everything).not.toMatch(/\b(inc\.|corp\.|ltd\.|llc)\b/i);
  });
});
