import { describe, expect, it } from 'vitest';
import {
  malformedIssues,
  parseEmail,
  parseHttpUrl,
  PUBLIC_CONFIG_KEYS,
  resolvePublicConfig,
} from '../config/public-config';

describe('parseHttpUrl', () => {
  it('accepts an absolute https URL', () => {
    expect(parseHttpUrl('https://members.example.org/apply')).toEqual({
      value: 'https://members.example.org/apply',
    });
  });

  it('treats an empty or whitespace value as missing', () => {
    expect(parseHttpUrl(undefined).reason).toBe('missing');
    expect(parseHttpUrl('').reason).toBe('missing');
    expect(parseHttpUrl('   ').reason).toBe('missing');
  });

  // The master command forbids `#`, `javascript:` and empty hrefs as stand-ins
  // for a real destination, so they must never survive validation.
  it.each(['#', 'javascript:void(0)', '/apply', 'mailto:someone@example.org', 'not a url'])(
    'rejects %s as an invalid destination',
    (raw) => {
      expect(parseHttpUrl(raw).value).toBeUndefined();
    },
  );

  it('rejects plain http as insecure rather than silently accepting it', () => {
    expect(parseHttpUrl('http://members.example.org').reason).toBe('insecure-url');
  });
});

describe('parseEmail', () => {
  it('accepts a plain address', () => {
    expect(parseEmail('hello@example.org').value).toBe('hello@example.org');
  });

  it.each(['hello', 'hello@example', 'a@b@c.org', 'hello @example.org'])('rejects %s', (raw) => {
    expect(parseEmail(raw).value).toBeUndefined();
  });

  it('treats absence as missing, not invalid', () => {
    expect(parseEmail(undefined).reason).toBe('missing');
  });
});

describe('resolvePublicConfig', () => {
  it('reports every key as missing for an empty environment and returns no values', () => {
    const { config, issues } = resolvePublicConfig({});
    expect(config).toEqual({});
    expect(issues.map((i) => i.key).sort()).toEqual([...PUBLIC_CONFIG_KEYS].sort());
    expect(issues.every((i) => i.reason === 'missing')).toBe(true);
  });

  it('resolves a fully configured environment', () => {
    const { config, issues } = resolvePublicConfig({
      PUBLIC_SITE_URL: 'https://paaipe.example.org',
      PUBLIC_MEMBERSHIP_APPLICATION_URL: 'https://apply.example.org',
      PUBLIC_MEMBER_PORTAL_URL: 'https://portal.example.org',
      PUBLIC_APPLICATION_STATUS_URL: 'https://portal.example.org/status',
      PUBLIC_SPEAKER_INTEREST_URL: 'https://forms.example.org/speaker',
      PUBLIC_PARTNERSHIP_INTEREST_URL: 'https://forms.example.org/partner',
      PUBLIC_CONTACT_EMAIL: 'hello@example.org',
    });
    expect(issues).toEqual([]);
    expect(config.membershipApplicationUrl).toBe('https://apply.example.org/');
    expect(config.contactEmail).toBe('hello@example.org');
  });

  it('drops a malformed value instead of passing it through as a dead link', () => {
    const { config, issues } = resolvePublicConfig({
      PUBLIC_MEMBERSHIP_APPLICATION_URL: '#',
      PUBLIC_CONTACT_EMAIL: 'nope',
    });
    expect(config.membershipApplicationUrl).toBeUndefined();
    expect(config.contactEmail).toBeUndefined();
    expect(
      malformedIssues(issues)
        .map((i) => i.reason)
        .sort(),
    ).toEqual(['invalid-email', 'invalid-url']);
  });

  it('separates "not configured yet" from "configured wrongly"', () => {
    const { issues } = resolvePublicConfig({ PUBLIC_SITE_URL: 'http://insecure.example.org' });
    expect(malformedIssues(issues)).toEqual([{ key: 'PUBLIC_SITE_URL', reason: 'insecure-url' }]);
  });
});
