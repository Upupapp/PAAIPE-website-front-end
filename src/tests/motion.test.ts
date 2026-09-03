import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ALL_MOTION_TOKENS,
  COMPONENT_MOTION_TOKENS,
  MOTION_LIMITS,
  MOTION_TOKENS,
} from '../config/tokens';
import { stripComments } from '../lib/strip-comments';

const MOTION_CSS = readFileSync(new URL('../styles/motion.css', import.meta.url), 'utf8');

function declaredCustomProperties(css: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    if (name && value) found.set(name, value.trim());
  }
  return found;
}

const declared = declaredCustomProperties(MOTION_CSS);

/** Every component, page template and client script. */
function componentFiles(): string[] {
  const roots = [
    new URL('../components/', import.meta.url).pathname,
    new URL('../pages/', import.meta.url).pathname,
    // Scripts were originally exempt, and a raw `140` promptly appeared in one.
    new URL('../scripts/', import.meta.url).pathname,
  ];
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (extname(entry) === '.astro' || extname(entry) === '.ts') out.push(full);
    }
  };
  for (const root of roots) walk(root);
  return out;
}

const components = componentFiles();

const durationMs = (value: string): number => {
  const match = /^([\d.]+)ms$/.exec(value.trim());
  return match ? Number(match[1]) : Number.NaN;
};

describe('motion token parity', () => {
  it('finds the motion custom properties to compare', () => {
    expect(declared.size).toBeGreaterThan(20);
  });

  it.each(Object.entries(ALL_MOTION_TOKENS))('declares --%s with the same value', (name, value) => {
    expect(declared.get(name)?.replace(/\s+/g, ' ')).toBe(value.replace(/\s+/g, ' '));
  });

  it('declares no motion custom property that tokens.ts does not know about', () => {
    // Parity ran only TS -> CSS, so `--motion-spinner` and `--motion-off` lived
    // in the stylesheet with no TypeScript counterpart and nothing noticed.
    const known = new Set(Object.keys(ALL_MOTION_TOKENS));
    const strays = [...declared.keys()].filter(
      (name) => /^(motion|ease|move|scale)-/.test(name) && !known.has(name),
    );
    expect(strays).toEqual([]);
  });

  it('declares the exact shared scale the master command specifies', () => {
    expect(MOTION_TOKENS['motion-instant']).toBe('80ms');
    expect(MOTION_TOKENS['motion-fast']).toBe('140ms');
    expect(MOTION_TOKENS['motion-standard']).toBe('220ms');
    expect(MOTION_TOKENS['motion-slow']).toBe('320ms');
    expect(MOTION_TOKENS['motion-emphasis']).toBe('480ms');
    expect(MOTION_TOKENS['motion-ambient-once']).toBe('1200ms');
    expect(MOTION_TOKENS['move-1']).toBe('4px');
    expect(MOTION_TOKENS['move-4']).toBe('20px');
    expect(MOTION_TOKENS['scale-press']).toBe('0.98');
    expect(MOTION_TOKENS['scale-hover']).toBe('1.012');
  });
});

describe('no arbitrary timings in components', () => {
  it('scans a non-trivial number of component files', () => {
    expect(components.length).toBeGreaterThan(20);
  });

  it('uses no raw millisecond literal or bare timing number outside the token file', () => {
    // Comments are stripped first. A scan that reads comments flags the comment
    // documenting the cap - which is exactly what it did on the first run.
    const offenders: string[] = [];
    for (const file of components) {
      const source = stripComments(readFileSync(file, 'utf8'));
      for (const match of source.matchAll(/(?<![\w.-])(\d+)ms/g)) {
        offenders.push(`${file.slice(file.indexOf('src/'))}: ${match[0]}`);
      }
      // Scripts express durations as numbers, so catch a bare timing argument
      // to setTimeout / setInterval too.
      for (const match of source.matchAll(/set(?:Timeout|Interval)\([^)]*?,\s*(\d+)\s*\)/g)) {
        offenders.push(`${file.slice(file.indexOf('src/'))}: setTimeout(..., ${match[1]})`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('motion stays inside the stated ceilings', () => {
  it('keeps every functional transition below 320ms', () => {
    const functional = [
      'motion-instant',
      'motion-fast',
      'motion-standard',
      'motion-slow',
      'motion-drawer',
      'motion-chevron',
      'motion-menu',
      'motion-reveal',
    ] as const;
    for (const name of functional) {
      const ms = durationMs(ALL_MOTION_TOKENS[name]);
      expect(ms, name).toBeLessThanOrEqual(MOTION_LIMITS.functionalMaxMs);
    }
  });

  it('keeps the mobile drawer at or below the 280ms Tab 12 states', () => {
    expect(durationMs(COMPONENT_MOTION_TOKENS['motion-drawer'])).toBeLessThanOrEqual(280);
  });

  it('keeps hero emphasis at or below 480ms', () => {
    expect(durationMs(MOTION_TOKENS['motion-emphasis'])).toBeLessThanOrEqual(
      MOTION_LIMITS.heroEmphasisMaxMs,
    );
    expect(durationMs(COMPONENT_MOTION_TOKENS['motion-hero-media'])).toBeLessThanOrEqual(
      MOTION_LIMITS.heroEmphasisMaxMs,
    );
  });

  it('keeps the decorative reveal inside 900-1200ms', () => {
    const ms = durationMs(COMPONENT_MOTION_TOKENS['motion-decor-reveal']);
    expect(ms).toBeGreaterThanOrEqual(900);
    expect(ms).toBeLessThanOrEqual(MOTION_LIMITS.decorativeMaxMs);
  });

  it('settles all ambient motion well inside the five-second control threshold', () => {
    // Nothing loops, so no Pause/Stop/Hide control is required. The longest
    // single ambient run plus its largest stagger must clear the ceiling.
    const longest =
      durationMs(COMPONENT_MOTION_TOKENS['motion-decor-reveal']) + MOTION_LIMITS.maxStaggerDelayMs;
    expect(longest).toBeLessThan(MOTION_LIMITS.autoMotionNeedsControlMs);
  });

  it('keeps the route transition inside its 320ms ceiling', () => {
    // 120ms out overlapping 220ms in.
    const out = 120;
    const inbound = durationMs(MOTION_TOKENS['motion-standard']);
    expect(Math.max(out, inbound)).toBeLessThanOrEqual(MOTION_LIMITS.routeTransitionMaxMs);
  });

  it('reverts a copy confirmation inside the 1.5-2 second window', () => {
    const ms = durationMs(COMPONENT_MOTION_TOKENS['motion-copy-revert']);
    expect(ms).toBeGreaterThanOrEqual(1500);
    expect(ms).toBeLessThanOrEqual(2000);
  });

  it('caps the card stagger at five cards and 180ms', () => {
    expect(MOTION_LIMITS.maxStaggeredCards).toBe(5);
    expect((MOTION_LIMITS.maxStaggeredCards - 1) * MOTION_LIMITS.staggerStepMs).toBeLessThanOrEqual(
      MOTION_LIMITS.maxStaggerDelayMs,
    );
  });
});

describe('motion is additive, never load-bearing', () => {
  /** Remove `@keyframes name { ... }` bodies, matching braces. */
  function withoutKeyframes(css: string): string {
    let out = '';
    let i = 0;
    while (i < css.length) {
      const start = css.indexOf('@keyframes', i);
      if (start === -1) {
        out += css.slice(i);
        break;
      }
      out += css.slice(i, start);
      let depth = 0;
      let j = css.indexOf('{', start);
      for (; j < css.length; j += 1) {
        if (css[j] === '{') depth += 1;
        else if (css[j] === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      i = j + 1;
    }
    return out;
  }

  it('scopes every hiding rule to .motion-ready, so a script failure cannot hide content', () => {
    // The only rules that set opacity: 0 must sit behind the class script adds
    // AFTER it initialises. Without it, everything is simply visible.
    //
    // Keyframe bodies are excluded: an animation's `from { opacity: 0 }` is a
    // starting state, not a rule that hides anything on its own. Scanning them
    // flagged `enter-rise` on the first run.
    const rules = withoutKeyframes(MOTION_CSS);
    const hidingRules = rules.split('}').filter((block) => /opacity:\s*0\s*;/.test(block));
    expect(hidingRules.length).toBeGreaterThan(0);
    for (const rule of hidingRules) {
      const selector = (rule.split('{')[0] ?? '').trim();
      expect(selector, `unscoped hiding rule: ${selector}`).toMatch(/\.motion-ready/);
    }
  });

  it('animates only transform and opacity in the shared stylesheet', () => {
    // Animating layout properties causes reflow; the master command forbids it.
    const stripped = stripComments(MOTION_CSS);
    for (const property of ['width:', 'height:', 'top:', 'left:', 'margin', 'padding']) {
      const inKeyframes = new RegExp(`@keyframes[^}]*${property}`, 's');
      expect(inKeyframes.test(stripped), `keyframes animate ${property}`).toBe(false);
    }
  });

  it('never applies will-change permanently', () => {
    for (const file of [...components, new URL('../styles/motion.css', import.meta.url).pathname]) {
      expect(stripComments(readFileSync(file, 'utf8')), file).not.toMatch(/will-change\s*:/);
    }
  });

  it('zeroes both halves of the route transition under reduced motion', () => {
    const reduced = MOTION_CSS.slice(MOTION_CSS.indexOf('prefers-reduced-motion'));
    expect(reduced).toContain('::view-transition-old(main-content)');
    expect(reduced).toContain('::view-transition-new(main-content)');
    expect(reduced).toMatch(/animation:\s*none\s*!important/);
  });
});

describe('the official logo never animates', () => {
  it('applies no animation, transform or filter to the logo component', () => {
    const logo = stripComments(
      readFileSync(new URL('../components/LogoLockup.astro', import.meta.url), 'utf8'),
    );
    expect(logo).not.toMatch(/animation\s*:/);
    expect(logo).not.toMatch(/@keyframes/);
    expect(logo).not.toMatch(/filter\s*:/);
    expect(logo).not.toMatch(/mix-blend-mode\s*:/);
    // The only transform-adjacent property is the optical margin, which is
    // layout, not motion.
    expect(logo).not.toMatch(/transform\s*:\s*(rotate|scale|skew)/);
  });

  it('gives the logo no reveal or enter attribute', () => {
    const logo = readFileSync(new URL('../components/LogoLockup.astro', import.meta.url), 'utf8');
    expect(logo).not.toMatch(/data-reveal|data-enter/);
  });
});

describe('parallax', () => {
  it('is deliberately not implemented, so its constraints cannot be violated', () => {
    // Tab 11's parallax policy applies IF parallax exists. It does not: there
    // is no approved hero imagery (B-6), and "purpose before spectacle" gives
    // no reason to add scroll-linked movement to a text hero. Recorded here so
    // the acceptance check is answered honestly rather than vacuously.
    for (const file of components) {
      const source = stripComments(readFileSync(file, 'utf8'));
      expect(source, file).not.toMatch(/parallax/i);
      expect(source, file).not.toMatch(/scroll-linked|scrollY\s*\*/);
    }
  });
});
