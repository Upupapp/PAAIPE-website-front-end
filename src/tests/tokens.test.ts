import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ALL_COLORS,
  CONTRAST_CONTRACT,
  FORBIDDEN_PAIRS,
  PALETTE,
  SCALE_TOKENS,
  STATUS_PALETTE,
} from '../config/tokens';
import { contrastRatio, meets, parseHex, REQUIRED_RATIO, round2 } from '../lib/color';

const CSS = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');

/** Every `--name: value;` declared in tokens.css. */
function declaredCustomProperties(css: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (name && value) found.set(name, value.trim());
  }
  return found;
}

const declared = declaredCustomProperties(CSS);

describe('token parity between tokens.ts and tokens.css', () => {
  it('finds a non-trivial number of custom properties to compare', () => {
    // Guards against the comparisons below passing because the regex matched
    // nothing - the classic way a parity check becomes a false pass.
    expect(declared.size).toBeGreaterThan(50);
  });

  it.each(Object.entries(ALL_COLORS))('declares --%s with the same value', (name, value) => {
    expect(declared.get(name)?.toLowerCase()).toBe(value.toLowerCase());
  });

  it.each(Object.entries(SCALE_TOKENS))('declares --%s with the same value', (name, value) => {
    const css = declared.get(name);
    expect(css, `--${name} missing from tokens.css`).toBeDefined();
    // Prettier may reflow multi-value declarations; compare on collapsed space.
    expect(css?.replace(/\s+/g, ' ')).toBe(value.replace(/\s+/g, ' '));
  });

  it('declares no colour custom property that tokens.ts does not know about', () => {
    const known = new Set(Object.keys(ALL_COLORS));
    const strays = [...declared.keys()].filter(
      (name) => name.startsWith('paaipe-') && !known.has(name),
    );
    expect(strays).toEqual([]);
  });

  it('keeps the raw palette to exactly the eleven values the master command specifies', () => {
    expect(Object.keys(PALETTE)).toHaveLength(11);
    for (const value of Object.values(PALETTE)) {
      expect(() => parseHex(value)).not.toThrow();
    }
  });
});

describe('contrast contract', () => {
  it.each(CONTRAST_CONTRACT.map((pair) => [pair.usage, pair] as const))(
    '%s meets its requirement',
    (_usage, pair) => {
      const ratio = round2(contrastRatio(ALL_COLORS[pair.foreground], ALL_COLORS[pair.background]));
      expect(ratio).toBeGreaterThanOrEqual(REQUIRED_RATIO[pair.requirement]);
    },
  );

  it.each(FORBIDDEN_PAIRS.map((pair) => [pair.usage, pair] as const))(
    'still measures %s as failing, so the ban is still justified',
    (_usage, pair) => {
      expect(
        meets(ALL_COLORS[pair.foreground], ALL_COLORS[pair.background], pair.requirement),
      ).toBe(false);
    },
  );

  it('covers every status colour in both directions', () => {
    for (const token of Object.keys(STATUS_PALETTE)) {
      if (token === 'paaipe-disabled-surface') continue;
      const asText = CONTRAST_CONTRACT.some((p) => p.foreground === token);
      const asSurface = CONTRAST_CONTRACT.some((p) => p.background === token);
      expect(asText, `${token} is never checked as text`).toBe(true);
      expect(asSurface, `${token} is never checked as a surface`).toBe(true);
    }
  });
});

describe('type scale', () => {
  it('never lets body text resolve below 16px', () => {
    // clamp(min, preferred, max): the minimum is what a narrow viewport gets.
    const match = /clamp\(([^,]+),/.exec(SCALE_TOKENS['text-body']);
    expect(match).not.toBeNull();
    const min = match![1]!.trim();
    expect(min).toBe('1rem');
  });

  it('uses clamp() for every fluid step and a fixed size for label and caption', () => {
    const fluid = [
      'text-display',
      'text-h1',
      'text-h2',
      'text-h3',
      'text-h4',
      'text-body-lg',
      'text-body',
    ] as const;
    for (const name of fluid) {
      expect(SCALE_TOKENS[name], name).toMatch(/^clamp\(/);
    }
    expect(SCALE_TOKENS['text-label']).toBe('0.9375rem');
    expect(SCALE_TOKENS['text-caption']).toBe('0.875rem');
  });
});

describe('spacing and radius scales', () => {
  it('builds every spacing step on the 4px base', () => {
    for (const [name, value] of Object.entries(SCALE_TOKENS)) {
      if (!name.startsWith('space-')) continue;
      const px = Number.parseInt(value, 10);
      expect(px % 4, `${name} = ${value} is not a multiple of 4px`).toBe(0);
    }
  });

  it('keeps card radii inside the 12-24px band', () => {
    for (const name of ['radius-md', 'radius-lg', 'radius-xl'] as const) {
      const px = Number.parseInt(SCALE_TOKENS[name], 10);
      expect(px).toBeGreaterThanOrEqual(12);
      expect(px).toBeLessThanOrEqual(24);
    }
  });
});
