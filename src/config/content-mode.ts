/**
 * Which content a build is allowed to publish.
 *
 *  - `production` (the default): ONLY `approved` records. Sample and draft
 *    fixtures are stripped entirely - not hidden with CSS, not rendered behind
 *    a flag. They are absent from the built HTML.
 *  - `review`: approved + sample, and draft only if the slug appears in
 *    DRAFT_ALLOW_LIST. Every non-approved record renders a visible status label.
 *
 * The default is the safe one on purpose: a build with no configuration must
 * not accidentally publish fixtures. Set PUBLIC_CONTENT_MODE=review explicitly.
 */
export type ContentMode = 'production' | 'review';

export function parseContentMode(raw: string | undefined): ContentMode {
  return raw?.trim() === 'review' ? 'review' : 'production';
}

/**
 * Draft slugs explicitly cleared for a review build. The master command
 * requires an explicit allow-list rather than "all drafts in review mode",
 * so an unfinished record cannot ride along with the rest.
 */
export const DRAFT_ALLOW_LIST: readonly string[] = [];

/**
 * `import.meta.env` is a Vite/Astro construct. Under plain Node - which is how
 * `scripts/write-seo-files.mjs` reaches this module through tsx - it is
 * `undefined`, and reading a property off it throws at import time. The `??`
 * falls back to `process.env`, so the same value drives the build and the
 * post-build SEO files rather than the two disagreeing.
 */
const ENV: Record<string, string | undefined> =
  (import.meta.env as unknown as Record<string, string | undefined> | undefined) ??
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ??
  {};

export const CONTENT_MODE: ContentMode = parseContentMode(ENV.PUBLIC_CONTENT_MODE);
