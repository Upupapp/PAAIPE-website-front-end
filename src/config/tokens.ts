/**
 * The PAAIPE design token contract.
 *
 * This file is the single source of truth. `src/styles/tokens.css` declares the
 * same values as CSS custom properties, and `src/tests/tokens.test.ts` asserts
 * the two agree in BOTH directions - a value cannot drift in either file, and a
 * token cannot be added to one without the other.
 *
 * `CONTRAST_CONTRACT` is the machine-checked answer to Tab 02's "verify every
 * final foreground/background combination for WCAG AA contrast". It is checked
 * by `npm run verify:contrast` and by the unit tests.
 */
import type { ContrastRequirement } from '../lib/color';

/* ------------------------------------------------------------------ */
/* Raw palette - exactly the eleven values specified in Tab 02.        */
/* Do not add a brand colour here without PAAIPE approval.             */
/* ------------------------------------------------------------------ */

export const PALETTE = {
  'paaipe-ink': '#051126',
  'paaipe-navy': '#082C6C',
  'paaipe-navy-deep': '#030D1F',
  'paaipe-blue': '#0878F9',
  'paaipe-cyan': '#00BCEB',
  'paaipe-gold': '#F7B500',
  'paaipe-surface': '#F7FAFE',
  'paaipe-white': '#FFFFFF',
  'paaipe-muted': '#5A6780',
  'paaipe-border': '#D8E3F2',
  'paaipe-focus': '#0878F9',
} as const;

/**
 * Functional status colours. NOT brand identity - the master command supplies
 * no status palette, and form validation and alerts cannot be built without
 * one. Each is chosen to clear 4.5:1 on both light surfaces AND to carry white
 * text at 4.5:1, so it works as text and as a filled surface.
 *
 * DERIVED - awaiting PAAIPE approval (docs/frontend-audit.md, B-10).
 */
export const STATUS_PALETTE = {
  'paaipe-error': '#B3261E',
  'paaipe-success': '#0F6E4F',
  'paaipe-warning': '#8A5A00',
  /** Disabled control surface. Pairs with paaipe-muted at 5.07:1. */
  'paaipe-disabled-surface': '#EEF2F8',
} as const;

export const ALL_COLORS = { ...PALETTE, ...STATUS_PALETTE } as const;

export type ColorToken = keyof typeof ALL_COLORS;

/* ------------------------------------------------------------------ */
/* The contrast contract                                               */
/* ------------------------------------------------------------------ */

export interface ContrastPair {
  /** Where this combination is actually used. */
  usage: string;
  foreground: ColorToken;
  background: ColorToken;
  requirement: ContrastRequirement;
}

export const CONTRAST_CONTRACT: readonly ContrastPair[] = [
  // Body and heading text on light surfaces
  {
    usage: 'body text on page',
    foreground: 'paaipe-ink',
    background: 'paaipe-surface',
    requirement: 'text',
  },
  {
    usage: 'body text on card',
    foreground: 'paaipe-ink',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'heading on page',
    foreground: 'paaipe-navy',
    background: 'paaipe-surface',
    requirement: 'text',
  },
  {
    usage: 'heading on card',
    foreground: 'paaipe-navy',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'secondary text on page',
    foreground: 'paaipe-muted',
    background: 'paaipe-surface',
    requirement: 'text',
  },
  {
    usage: 'secondary text on card',
    foreground: 'paaipe-muted',
    background: 'paaipe-white',
    requirement: 'text',
  },

  // Text on dark surfaces
  {
    usage: 'body text on navy',
    foreground: 'paaipe-white',
    background: 'paaipe-navy',
    requirement: 'text',
  },
  {
    usage: 'body text on deep navy',
    foreground: 'paaipe-white',
    background: 'paaipe-navy-deep',
    requirement: 'text',
  },
  {
    usage: 'eyebrow on navy',
    foreground: 'paaipe-cyan',
    background: 'paaipe-navy',
    requirement: 'text',
  },
  {
    usage: 'highlight on navy',
    foreground: 'paaipe-gold',
    background: 'paaipe-navy',
    requirement: 'text',
  },
  {
    usage: 'accent text on deep navy',
    foreground: 'paaipe-blue',
    background: 'paaipe-navy-deep',
    requirement: 'text',
  },

  // Primary action. Blue is NOT the fill: white on #0878F9 is 4.14:1, below AA.
  {
    usage: 'primary button label',
    foreground: 'paaipe-white',
    background: 'paaipe-navy',
    requirement: 'text',
  },
  {
    usage: 'primary button label, hover',
    foreground: 'paaipe-white',
    background: 'paaipe-navy-deep',
    requirement: 'text',
  },
  {
    usage: 'primary button label, pressed',
    foreground: 'paaipe-white',
    background: 'paaipe-ink',
    requirement: 'text',
  },
  {
    usage: 'primary button on dark, label',
    foreground: 'paaipe-navy',
    background: 'paaipe-white',
    requirement: 'text',
  },

  // Secondary and link
  {
    usage: 'secondary button label',
    foreground: 'paaipe-navy',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'secondary button border',
    foreground: 'paaipe-navy',
    background: 'paaipe-white',
    requirement: 'ui',
  },
  {
    usage: 'inline link',
    foreground: 'paaipe-navy',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'inline link on page',
    foreground: 'paaipe-navy',
    background: 'paaipe-surface',
    requirement: 'text',
  },

  // Focus ring must reach 3:1 against every surface it can appear on
  {
    usage: 'focus ring on white',
    foreground: 'paaipe-focus',
    background: 'paaipe-white',
    requirement: 'ui',
  },
  {
    usage: 'focus ring on page',
    foreground: 'paaipe-focus',
    background: 'paaipe-surface',
    requirement: 'ui',
  },
  {
    usage: 'focus ring on navy',
    foreground: 'paaipe-focus',
    background: 'paaipe-navy',
    requirement: 'ui',
  },
  {
    usage: 'focus ring on deep navy',
    foreground: 'paaipe-focus',
    background: 'paaipe-navy-deep',
    requirement: 'ui',
  },

  // Control boundaries. paaipe-border is 1.29:1 on white and is decorative
  // only; a form control boundary must be paaipe-muted.
  {
    usage: 'form control border',
    foreground: 'paaipe-muted',
    background: 'paaipe-white',
    requirement: 'ui',
  },
  {
    usage: 'form control border on page',
    foreground: 'paaipe-muted',
    background: 'paaipe-surface',
    requirement: 'ui',
  },

  // Status
  {
    usage: 'error text',
    foreground: 'paaipe-error',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'error text on page',
    foreground: 'paaipe-error',
    background: 'paaipe-surface',
    requirement: 'text',
  },
  {
    usage: 'error surface label',
    foreground: 'paaipe-white',
    background: 'paaipe-error',
    requirement: 'text',
  },
  {
    usage: 'success text',
    foreground: 'paaipe-success',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'success surface label',
    foreground: 'paaipe-white',
    background: 'paaipe-success',
    requirement: 'text',
  },
  {
    usage: 'warning text',
    foreground: 'paaipe-warning',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'warning surface label',
    foreground: 'paaipe-white',
    background: 'paaipe-warning',
    requirement: 'text',
  },
  {
    usage: 'disabled control label',
    foreground: 'paaipe-muted',
    background: 'paaipe-disabled-surface',
    requirement: 'text',
  },

  // The explanatory text beside an unavailable external action. It appears on
  // BOTH light and dark surfaces. The dark case was MISSING from this contract
  // until an axe scan of the home page caught muted grey at 2.32:1 on navy -
  // the contract is only as complete as the list someone thought to write.
  {
    usage: 'unavailable action reason on card',
    foreground: 'paaipe-muted',
    background: 'paaipe-white',
    requirement: 'text',
  },
  {
    usage: 'unavailable action reason on page',
    foreground: 'paaipe-muted',
    background: 'paaipe-surface',
    requirement: 'text',
  },
  {
    usage: 'unavailable action reason on navy',
    foreground: 'paaipe-white',
    background: 'paaipe-navy',
    requirement: 'text',
  },
  {
    usage: 'unavailable action reason on deep navy',
    foreground: 'paaipe-white',
    background: 'paaipe-navy-deep',
    requirement: 'text',
  },
] as const;

/**
 * Combinations that are FORBIDDEN, with the measured reason. Asserted by test,
 * so if a future palette change happens to make one legal the test fails and
 * the prohibition is re-examined rather than quietly outliving its reason.
 */
export const FORBIDDEN_PAIRS: readonly (ContrastPair & { reason: string })[] = [
  {
    usage: 'white label on an electric-blue action',
    foreground: 'paaipe-white',
    background: 'paaipe-blue',
    requirement: 'text',
    reason: '4.14:1 - below AA. The primary action fill is paaipe-navy instead.',
  },
  {
    usage: 'electric blue as body text on white',
    foreground: 'paaipe-blue',
    background: 'paaipe-white',
    requirement: 'text',
    reason: '4.14:1 - below AA. Blue is a focus, accent and on-dark colour only.',
  },
  {
    usage: 'cyan as small body text on white',
    foreground: 'paaipe-cyan',
    background: 'paaipe-white',
    requirement: 'text',
    reason: '2.23:1 - accent colour, as the master command states.',
  },
  {
    usage: 'gold as small body text on white',
    foreground: 'paaipe-gold',
    background: 'paaipe-white',
    requirement: 'text',
    reason: '1.81:1 - accent colour, as the master command states.',
  },
  {
    usage: 'muted secondary text on a navy surface',
    foreground: 'paaipe-muted',
    background: 'paaipe-navy',
    requirement: 'text',
    reason:
      '2.32:1 - secondary text must switch to white on a dark surface, not stay muted grey. Found by an axe scan, not by this list.',
  },
  {
    usage: 'paaipe-border as a form control boundary',
    foreground: 'paaipe-border',
    background: 'paaipe-white',
    requirement: 'ui',
    reason: '1.29:1 - decorative dividers only. Control boundaries use paaipe-muted.',
  },
] as const;

/* ------------------------------------------------------------------ */
/* Scale tokens                                                        */
/* ------------------------------------------------------------------ */

/** 4px base spacing system. */
export const SPACING = {
  'space-1': '4px',
  'space-2': '8px',
  'space-3': '12px',
  'space-4': '16px',
  'space-5': '20px',
  'space-6': '24px',
  'space-8': '32px',
  'space-10': '40px',
  'space-12': '48px',
  'space-16': '64px',
  'space-20': '80px',
  'space-24': '96px',
} as const;

/** Card radii stay inside the 12-24px band the master command specifies. */
export const RADIUS = {
  'radius-xs': '4px',
  'radius-sm': '8px',
  'radius-md': '12px',
  'radius-lg': '16px',
  'radius-xl': '24px',
  'radius-pill': '999px',
} as const;

export const ELEVATION = {
  'shadow-sm': '0 1px 2px rgba(5, 17, 38, 0.06), 0 1px 3px rgba(5, 17, 38, 0.04)',
  'shadow-md': '0 2px 6px rgba(5, 17, 38, 0.07), 0 6px 16px rgba(5, 17, 38, 0.06)',
  'shadow-lg': '0 8px 24px rgba(5, 17, 38, 0.09), 0 16px 40px rgba(5, 17, 38, 0.07)',
} as const;

/**
 * Type scale. Every step uses clamp() so it is fluid without a media query.
 * `text-body` must never resolve below 16px - asserted by test.
 */
export const TYPE_SCALE = {
  'text-display': 'clamp(2.5rem, 1.6rem + 4.5vw, 4.5rem)',
  'text-h1': 'clamp(2rem, 1.4rem + 3vw, 3.25rem)',
  'text-h2': 'clamp(1.625rem, 1.25rem + 1.9vw, 2.5rem)',
  'text-h3': 'clamp(1.375rem, 1.15rem + 1.1vw, 1.875rem)',
  'text-h4': 'clamp(1.175rem, 1.075rem + 0.5vw, 1.4rem)',
  'text-body-lg': 'clamp(1.075rem, 1.025rem + 0.25vw, 1.2rem)',
  'text-body': 'clamp(1rem, 0.985rem + 0.08vw, 1.0625rem)',
  'text-label': '0.9375rem',
  'text-caption': '0.875rem',
} as const;

export const LINE_HEIGHT = {
  'leading-tight': '1.12',
  'leading-snug': '1.25',
  'leading-normal': '1.6',
  'leading-relaxed': '1.7',
} as const;

/** Roughly 55-75 characters for long-form copy. */
export const LAYOUT = {
  'width-content': '72rem',
  'width-prose': '68ch',
  'width-narrow': '46rem',
} as const;

/**
 * Motion tokens, exactly as specified in Tab 11.
 *
 * Components must reference these, never a literal duration. A test asserts no
 * component stylesheet contains a raw `ms` value outside this file - "no
 * arbitrary timings in components" is only a rule if something checks.
 */
export const MOTION_TOKENS = {
  'motion-none': '0ms',
  'motion-instant': '80ms',
  'motion-fast': '140ms',
  'motion-standard': '220ms',
  'motion-slow': '320ms',
  'motion-emphasis': '480ms',
  'motion-ambient-once': '1200ms',
  'ease-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  'ease-enter': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'ease-exit': 'cubic-bezier(0.4, 0, 1, 1)',
  'move-1': '4px',
  'move-2': '8px',
  'move-3': '12px',
  'move-4': '20px',
  'scale-press': '0.98',
  'scale-hover': '1.012',
} as const;

/**
 * Durations the master command names for specific components but which are not
 * in the shared scale. Held as named tokens rather than literals so they are
 * still greppable and still not arbitrary.
 */
export const COMPONENT_MOTION_TOKENS = {
  /** Tab 12: mobile drawer, 280ms maximum. */
  'motion-drawer': '280ms',
  /** Tab 11: accordion chevron 180ms. */
  'motion-chevron': '180ms',
  /** Tab 11: desktop menu 160ms. */
  'motion-menu': '160ms',
  /** Tab 11: scroll reveal default 280ms; images 360ms. */
  'motion-reveal': '280ms',
  'motion-reveal-image': '360ms',
  /** Tab 11: card-group stagger step, five cards maximum. */
  'motion-stagger': '40ms',
  /** Tab 11: hero image emphasis, 420ms. */
  'motion-hero-media': '420ms',
  /** Tab 11: decorative map/network reveal, 900-1200ms, once. */
  'motion-decor-reveal': '1100ms',
  /** A loading spinner is ambient, not a transition, so it sits outside the scale. */
  'motion-spinner': '700ms',
  /** The reduced-motion escape hatch: near-zero, but still fires transitionend. */
  'motion-off': '0.01ms',
  /** Debounce for the scroll-end sweep. Not a transition - a settle window. */
  'motion-scroll-settle': '150ms',
  /** Copy confirmation reverts after this. Tab 12 states 1.5-2 seconds. */
  'motion-copy-revert': '1800ms',
} as const;

export const ALL_MOTION_TOKENS = { ...MOTION_TOKENS, ...COMPONENT_MOTION_TOKENS } as const;

/** Ceilings the master command states, asserted by test. */
export const MOTION_LIMITS = {
  /** Functional transitions stay below this. */
  functionalMaxMs: 320,
  /** A one-time hero emphasis may reach this. */
  heroEmphasisMaxMs: 480,
  /** The decorative reveal may run once for this long, then settle. */
  decorativeMaxMs: 1200,
  /** Any auto-motion longer than this needs a pause control. */
  autoMotionNeedsControlMs: 5000,
  /** Route transition ceiling. */
  routeTransitionMaxMs: 320,
  /** Scroll-reveal card stagger. */
  staggerStepMs: 40,
  maxStaggeredCards: 5,
  maxStaggerDelayMs: 180,
} as const;

export const SCALE_TOKENS = {
  ...SPACING,
  ...RADIUS,
  ...ELEVATION,
  ...TYPE_SCALE,
  ...LINE_HEIGHT,
  ...LAYOUT,
} as const;
