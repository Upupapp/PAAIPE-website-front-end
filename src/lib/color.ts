/**
 * WCAG 2.2 contrast maths.
 *
 * Used by the contrast gate, the token tests and the internal style page, so
 * every contrast figure quoted anywhere in this project comes from one
 * implementation rather than from a spreadsheet or a claim.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Accepts `#rgb`, `#rrggbb`. Throws on anything else rather than guessing. */
export function parseHex(hex: string): Rgb {
  const value = hex.trim().replace(/^#/, '');
  const expanded =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`Not a hex colour: ${hex}`);
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16),
  };
}

/** WCAG relative luminance. */
export function relativeLuminance(color: Rgb): number {
  const channel = (raw: number): number => {
    const c = raw / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/** Contrast ratio, 1..21. Order of the two arguments does not matter. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(parseHex(foreground));
  const b = relativeLuminance(parseHex(background));
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Rounded down to 2dp: never round a 4.4995 up into a passing 4.5. */
export function round2(ratio: number): number {
  return Math.floor(ratio * 100) / 100;
}

export type ContrastRequirement =
  /** Normal body text and controls: 4.5:1 */
  | 'text'
  /** Large text (>=24px, or >=18.66px bold): 3:1 */
  | 'large-text'
  /** Meaningful UI components, graphics, borders, focus indicators: 3:1 */
  | 'ui'
  /** Decorative only: no contrast requirement, and must carry no information. */
  | 'decorative';

export const REQUIRED_RATIO: Record<ContrastRequirement, number> = {
  text: 4.5,
  'large-text': 3,
  ui: 3,
  decorative: 0,
};

export function meets(
  foreground: string,
  background: string,
  requirement: ContrastRequirement,
): boolean {
  return round2(contrastRatio(foreground, background)) >= REQUIRED_RATIO[requirement];
}
