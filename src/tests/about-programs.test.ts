import { describe, expect, it } from 'vitest';
import {
  ABOUT_HERO,
  ABOUT_WHO_WE_ARE,
  MISSION_AND_VISION,
  PROGRAMS_HERO,
  PROGRESS_STATEMENT,
  SPEAKER_INVITATION,
  VALUES,
  VALUE_PRINCIPLES,
  WHAT_PAAIPE_DOES,
  WHO_PAAIPE_IS_FOR,
  allPrograms,
  AUDIENCES,
  HOME_MISSION,
} from '../content';
import { findRoute } from '../config/routes';

describe('About page copy', () => {
  it('uses the approved hero, matching the route registry heading', () => {
    expect(ABOUT_HERO.eyebrow).toBe('ABOUT PAAIPE');
    expect(ABOUT_HERO.heading).toBe(findRoute('/about').heading);
  });

  it('carries both "who we are" paragraphs', () => {
    expect(ABOUT_WHO_WE_ARE.paragraphs).toHaveLength(2);
    expect(ABOUT_WHO_WE_ARE.paragraphs[0]).toContain(
      'Philippine Association of AI Professionals and Entrepreneurs',
    );
  });

  it('states the same mission as the home page, from one source', () => {
    // The mission appears on both pages by design. It must be the SAME string,
    // or two "approved" missions exist and one of them is wrong.
    expect(MISSION_AND_VISION.mission).toBe(HOME_MISSION.copy);
  });

  it('carries a vision distinct from the mission', () => {
    expect(MISSION_AND_VISION.vision).toContain('A future in which Filipino talent');
    expect(MISSION_AND_VISION.vision).not.toBe(MISSION_AND_VISION.mission);
  });
});

describe('values and audiences: two approved lists, both kept', () => {
  it('keeps Tab 06 named values alongside Tab 03 short values', () => {
    expect(VALUE_PRINCIPLES).toHaveLength(5);
    expect(VALUES).toHaveLength(5);
    // They are genuinely different lists; only "Practical" overlaps at all.
    const named = VALUE_PRINCIPLES.map((v) => v.name);
    expect(named).toContain('Bayanihan in technology');
    expect(named).not.toEqual([...VALUES]);
  });

  it('gives every named value a description', () => {
    for (const value of VALUE_PRINCIPLES) {
      expect(value.description.trim().length, value.name).toBeGreaterThan(20);
    }
  });

  it('keeps Tab 06 seven audiences alongside Tab 03 five categories', () => {
    expect(WHO_PAAIPE_IS_FOR).toHaveLength(7);
    expect(AUDIENCES).toHaveLength(5);
  });

  it('lists the four things PAAIPE does', () => {
    expect(WHAT_PAAIPE_DOES.map((item) => item.name)).toEqual([
      'Connect',
      'Equip',
      'Convene',
      'Encourage',
    ]);
  });
});

describe('progress statement stays prose', () => {
  it('contains no digit anywhere', () => {
    // Tab 06: "Do not turn this statement into a numerical impact chart until
    // verified data exists." No count, percentage, unit or year may appear.
    const text = [PROGRESS_STATEMENT.heading, ...PROGRESS_STATEMENT.outcomes].join(' ');
    expect(text).not.toMatch(/\d/);
  });

  it('makes no comparative or measurable claim about the past', () => {
    const text = [PROGRESS_STATEMENT.heading, ...PROGRESS_STATEMENT.outcomes].join(' ');
    expect(text).not.toMatch(/\b(grew|increased|doubled|since \d|so far|to date)\b/i);
  });
});

describe('programme registry drives both pages', () => {
  it('carries seven programmes, all approved', () => {
    expect(allPrograms).toHaveLength(7);
    for (const program of allPrograms) {
      expect(program.contentStatus, program.slug).toBe('approved');
    }
  });

  it('gives every programme a visibility that maps to a Public/Members Only badge', () => {
    for (const program of allPrograms) {
      expect(['public', 'members-only'], program.slug).toContain(program.visibility);
    }
  });

  it('marks the members-only programmes as members-only', () => {
    const memberOnly = allPrograms
      .filter((p) => p.visibility === 'members-only')
      .map((p) => p.slug)
      .sort();
    expect(memberOnly).toEqual(
      ['community-conversations', 'member-resource-library', 'paaipe-ai-exchange'].sort(),
    );
  });

  it('gives every programme a unique anchor slug for its detail section', () => {
    const slugs = allPrograms.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('speaker invitation', () => {
  it('uses the approved heading and both CTA labels', () => {
    expect(SPEAKER_INVITATION.heading).toBe(
      'Have something useful to teach the Filipino AI community?',
    );
    expect(SPEAKER_INVITATION.primaryCta).toBe('Propose a Session');
    expect(SPEAKER_INVITATION.secondaryCta).toBe('Contact the Programs Team');
  });
});

describe('About and Programs stay distinct', () => {
  /**
   * Collect the actual string leaves.
   *
   * An earlier version stringified the objects and split the JSON on sentence
   * boundaries. That silently did nothing: JSON puts no space after the period
   * that ends a field, so the last sentence of every field merged with the next
   * field's punctuation and could never match anything. The check passed while
   * testing nothing - a duplicated passage slipped straight through it and only
   * the browser test caught it.
   */
  function strings(value: unknown): string[] {
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value.flatMap(strings);
    if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
    return [];
  }

  const aboutStrings = strings([
    ABOUT_HERO,
    ABOUT_WHO_WE_ARE,
    VALUE_PRINCIPLES,
    WHAT_PAAIPE_DOES,
    WHO_PAAIPE_IS_FOR,
    PROGRESS_STATEMENT,
  ]);
  const programsText = strings([PROGRAMS_HERO, SPEAKER_INVITATION, allPrograms]).join(' \n ');
  const aboutText = aboutStrings.join(' \n ');

  it('shares no long passage between the two pages', () => {
    // "No duplicated long sections": any sentence over 80 characters appearing
    // in both would be one page repeating the other.
    const sentences = aboutStrings
      .flatMap((text) => text.split(/(?<=\.)\s+/))
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 80);
    expect(sentences.length).toBeGreaterThan(3);
    expect(sentences.filter((sentence) => programsText.includes(sentence))).toEqual([]);
  });

  it('makes no unsupported founding, leadership or accreditation claim', () => {
    const all = aboutText + programsText;
    expect(all).not.toMatch(
      /\b(founded in|established in|since \d{4}|president|chairman|board of)\b/i,
    );
    expect(all).not.toMatch(
      /\b(accredited|licensed|officially recognized|government[- ]approved)\b/i,
    );
  });
});
