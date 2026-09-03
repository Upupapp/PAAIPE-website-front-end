import { malformedIssues, resolvePublicConfig } from './public-config';

/**
 * Astro inlines PUBLIC_* variables at build time. Reading them through this
 * single module keeps validation centralised and keeps `import.meta.env` out of
 * page components.
 */
const result = resolvePublicConfig(
  import.meta.env as unknown as Record<string, string | undefined>,
);

const malformed = malformedIssues(result.issues);
if (malformed.length > 0) {
  // A missing URL is expected and handled. A malformed one is a configuration
  // mistake that would ship as a dead link, so it is surfaced loudly at build
  // time without failing the build (Tab 01: missing optional URLs must not crash).
  console.warn(
    `[paaipe:config] ${malformed.length} malformed public configuration value(s) ignored:\n` +
      malformed.map((i) => `  - ${i.key}: ${i.reason}`).join('\n'),
  );
}

export const publicConfig = result.config;
export const publicConfigIssues = result.issues;
export { ACRONYM, ORGANIZATION_NAME, SLOGAN } from './site';
