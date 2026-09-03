/**
 * Central validation for the public (build-time inlined) configuration.
 *
 * Frontend-only rules this file enforces:
 *  - Every value is PUBLIC. Never read a secret here.
 *  - Every URL is OPTIONAL. A missing destination must degrade to an honest
 *    "unavailable" state, never crash the site and never become `#` or a
 *    fake success. Tab 03 builds the ExternalAction resolver on top of this.
 *  - A value that is present but malformed is treated as ABSENT and reported,
 *    so a typo cannot silently ship as a dead link.
 */

export const PUBLIC_CONFIG_KEYS = [
  'PUBLIC_SITE_URL',
  'PUBLIC_MEMBERSHIP_APPLICATION_URL',
  'PUBLIC_MEMBER_PORTAL_URL',
  'PUBLIC_APPLICATION_STATUS_URL',
  'PUBLIC_SPEAKER_INTEREST_URL',
  'PUBLIC_PARTNERSHIP_INTEREST_URL',
  'PUBLIC_CONTACT_EMAIL',
] as const;

export type PublicConfigKey = (typeof PUBLIC_CONFIG_KEYS)[number];

export interface PublicConfig {
  siteUrl?: string;
  membershipApplicationUrl?: string;
  memberPortalUrl?: string;
  applicationStatusUrl?: string;
  speakerInterestUrl?: string;
  partnershipInterestUrl?: string;
  contactEmail?: string;
}

export interface PublicConfigIssue {
  key: PublicConfigKey;
  reason: 'missing' | 'invalid-url' | 'insecure-url' | 'invalid-email';
}

export interface PublicConfigResult {
  config: PublicConfig;
  issues: PublicConfigIssue[];
}

/** Accepts only absolute http(s) URLs. Rejects `#`, `javascript:`, mailto: and relative paths. */
export function parseHttpUrl(raw: string | undefined): {
  value?: string;
  reason?: 'missing' | 'invalid-url' | 'insecure-url';
} {
  const trimmed = raw?.trim();
  if (!trimmed) return { reason: 'missing' };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { reason: 'invalid-url' };
  }

  if (parsed.protocol === 'http:') return { reason: 'insecure-url' };
  if (parsed.protocol !== 'https:') return { reason: 'invalid-url' };

  return { value: parsed.toString() };
}

/** Deliberately conservative: one @, a dot in the domain, no whitespace. */
export function parseEmail(raw: string | undefined): {
  value?: string;
  reason?: 'missing' | 'invalid-email';
} {
  const trimmed = raw?.trim();
  if (!trimmed) return { reason: 'missing' };
  if (!/^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(trimmed)) return { reason: 'invalid-email' };
  return { value: trimmed };
}

export function resolvePublicConfig(env: Record<string, string | undefined>): PublicConfigResult {
  const issues: PublicConfigIssue[] = [];
  const config: PublicConfig = {};

  const urlFields: Array<[PublicConfigKey, keyof PublicConfig]> = [
    ['PUBLIC_SITE_URL', 'siteUrl'],
    ['PUBLIC_MEMBERSHIP_APPLICATION_URL', 'membershipApplicationUrl'],
    ['PUBLIC_MEMBER_PORTAL_URL', 'memberPortalUrl'],
    ['PUBLIC_APPLICATION_STATUS_URL', 'applicationStatusUrl'],
    ['PUBLIC_SPEAKER_INTEREST_URL', 'speakerInterestUrl'],
    ['PUBLIC_PARTNERSHIP_INTEREST_URL', 'partnershipInterestUrl'],
  ];

  for (const [key, field] of urlFields) {
    const { value, reason } = parseHttpUrl(env[key]);
    if (value) config[field] = value;
    else if (reason) issues.push({ key, reason });
  }

  const email = parseEmail(env.PUBLIC_CONTACT_EMAIL);
  if (email.value) config.contactEmail = email.value;
  else if (email.reason) issues.push({ key: 'PUBLIC_CONTACT_EMAIL', reason: email.reason });

  return { config, issues };
}

/** Issues that are NOT simply "not configured yet" — these indicate a mistake. */
export function malformedIssues(issues: PublicConfigIssue[]): PublicConfigIssue[] {
  return issues.filter((issue) => issue.reason !== 'missing');
}
