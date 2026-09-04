#!/usr/bin/env node
/**
 * Put `.env` into `process.env`, so one build command reads ONE environment.
 *
 * THE DISAGREEMENT THIS CLOSES
 * ----------------------------
 * `npm run build` is `astro build` followed by `write-seo-files.mjs`, and
 * `npm run verify:seo:production` adds `verify-seo.mjs` after it. Astro reads
 * `PUBLIC_*` through `import.meta.env`, which Vite populates from `.env`. The
 * two scripts read `process.env`, which does not. So the same command could
 * produce three different answers to "what is the origin":
 *
 *   - the PAGES carried a canonical and an absolute `og:image`;
 *   - `robots.txt` carried no `Sitemap:` line and no sitemap was written;
 *   - `verify-seo.mjs` then failed the build it had just made, reporting
 *     "has og:image, but no absolute image URL exists without PUBLIC_SITE_URL"
 *     on every page - a verifier disagreeing with its own artifact.
 *
 * It is invisible on Netlify, where the origin comes from
 * `netlify.toml [build.environment]` and is therefore in the real process env
 * for all three. That is what made it worth fixing rather than tolerating: a
 * disagreement that only appears OFF the deploy path is one nobody meets until
 * they are already debugging something else, and `docs/configuration.md` and
 * B-7's own `howToSupply` both tell a developer to use `.env`.
 *
 * `process.loadEnvFile` does not overwrite a variable that is already set,
 * which is the same precedence Vite applies, so an exported value still wins
 * everywhere. A missing `.env` is the normal case and not an error: the deploy
 * configures its own environment.
 */
export function loadDotenv(root) {
  try {
    process.loadEnvFile(new URL('.env', root));
    return true;
  } catch {
    return false;
  }
}
