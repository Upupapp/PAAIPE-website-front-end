import { parseHttpUrl } from './public-config';

/**
 * Public configuration for the Events Continuation.
 *
 * WHY THIS IS A SEPARATE GROUP FROM `PUBLIC_CONFIG_KEYS`, and it is not tidiness.
 *
 * Owner item B-4 is "all seven PUBLIC_* destinations", and its release-gate row
 * builds its own text from that array:
 *
 *     missing: `All seven PUBLIC_* destinations: ${PUBLIC_CONFIG_KEYS.join(', ')}`
 *
 * The word "seven" is hardcoded in a sentence that interpolates the list. Adding
 * these keys there would print "All seven" above a list of fourteen - and, worse,
 * would silently redefine what B-4 MEASURES, folding feature configuration into a
 * count of owner-supplied destinations. B-4 would then be unsatisfiable for a
 * reason that has nothing to do with B-4.
 *
 * These are feature configuration. They keep their own group and the same parser.
 */
export const PUBLIC_EVENT_CONFIG_KEYS = [
  'PUBLIC_EVENT_CATALOG_SOURCE',
  'PUBLIC_EVENT_REGISTRATION_ENDPOINT',
  'PUBLIC_EVENT_SUPPORT_URL',
  'PUBLIC_EVENT_PRIVACY_NOTICE_URL',
  'PUBLIC_EVENT_TERMS_URL',
  'PUBLIC_ANALYTICS_ENABLED',
  'PUBLIC_WEB_HAPTICS_ENABLED',
] as const;

export type PublicEventConfigKey = (typeof PUBLIC_EVENT_CONFIG_KEYS)[number];

export interface PublicEventConfig {
  /** An approved static or public read source. Never carries credentials. */
  catalogSource?: string;
  /** Same-origin or explicitly allow-listed HTTPS. Never a vendor secret. */
  registrationEndpoint?: string;
  /** Where a participant asks for help. Honest unavailable text when absent. */
  supportUrl?: string;
  /** Defaults to this site's own /privacy, which exists. */
  privacyNoticeUrl: string;
  /** Defaults to this site's own /terms, which exists. */
  termsUrl: string;
  /** Off unless explicitly enabled. This portal ships no analytics today. */
  analyticsEnabled: boolean;
  /** Off by default, per Tab 01 Step 4 and Tab 08. */
  webHapticsEnabled: boolean;
}

/**
 * A flag is ON only for the exact string "true".
 *
 * Not `Boolean(value)`, which makes the string "false" true - the single most
 * common way a kill switch turns out to have been on the whole time.
 */
function parseFlag(raw: string | undefined): boolean {
  return raw?.trim().toLowerCase() === 'true';
}

/**
 * The registration endpoint is held to a stricter rule than an ordinary link:
 * it receives a person's email address.
 *
 * Same-origin (a relative path) or absolute HTTPS. `http://` is refused by the
 * shared parser. A URL carrying credentials, or pointing at localhost, is
 * refused here - both are real ways a development value reaches production, and
 * either would send an address somewhere nobody intended.
 */
export function parseRegistrationEndpoint(raw: string | undefined): {
  value?: string;
  reason?: 'missing' | 'invalid-url' | 'insecure-url' | 'credentials-in-url' | 'local-host';
} {
  const trimmed = raw?.trim();
  if (!trimmed) return { reason: 'missing' };

  // A same-origin path is the safest form and needs no origin checks.
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return { value: trimmed };

  const parsed = parseHttpUrl(trimmed);
  if (!parsed.value) return { reason: parsed.reason };

  const url = new URL(parsed.value);
  if (url.username || url.password) return { reason: 'credentials-in-url' };
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(url.hostname)) {
    return { reason: 'local-host' };
  }
  return { value: parsed.value };
}

export function resolvePublicEventConfig(
  env: Record<string, string | undefined>,
): PublicEventConfig {
  const endpoint = parseRegistrationEndpoint(env.PUBLIC_EVENT_REGISTRATION_ENDPOINT);
  return {
    catalogSource: parseHttpUrl(env.PUBLIC_EVENT_CATALOG_SOURCE).value,
    registrationEndpoint: endpoint.value,
    supportUrl: parseHttpUrl(env.PUBLIC_EVENT_SUPPORT_URL).value,
    // These two fall back to pages this site already serves, so a reader is
    // never sent to an unavailable notice for want of an env var.
    privacyNoticeUrl: parseHttpUrl(env.PUBLIC_EVENT_PRIVACY_NOTICE_URL).value ?? '/privacy',
    termsUrl: parseHttpUrl(env.PUBLIC_EVENT_TERMS_URL).value ?? '/terms',
    analyticsEnabled: parseFlag(env.PUBLIC_ANALYTICS_ENABLED),
    webHapticsEnabled: parseFlag(env.PUBLIC_WEB_HAPTICS_ENABLED),
  };
}

/**
 * The single evaluated registration state, per Tab 01 Step 6.
 *
 * One value, derived once, so no component can invent a fourth answer. Nothing
 * downstream may infer success from anything other than `endpoint-available`
 * plus a confirmed gateway response.
 */
export type RegistrationFeatureState =
  'catalog-absent' | 'catalog-available-endpoint-absent' | 'endpoint-available';

export function registrationFeatureState(
  config: PublicEventConfig,
  approvedEventCount: number,
): RegistrationFeatureState {
  if (approvedEventCount === 0) return 'catalog-absent';
  if (!config.registrationEndpoint) return 'catalog-available-endpoint-absent';
  return 'endpoint-available';
}

/** The exact sentence Tab 01 Step 2 requires when no endpoint is configured. */
export const REGISTRATION_UNAVAILABLE_MESSAGE =
  'Online registration is being connected. Please check back soon. No registration has been recorded.';
