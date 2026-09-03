import { describe, expect, it } from 'vitest';
import { EXTERNAL_ACTIONS, resolveExternalAction } from '../lib/external-action';
import { resolvePublicConfig } from '../config/public-config';
import type { ExternalActionId } from '../content/types';

const ALL_IDS = Object.keys(EXTERNAL_ACTIONS) as ExternalActionId[];

const FULLY_CONFIGURED = resolvePublicConfig({
  PUBLIC_MEMBERSHIP_APPLICATION_URL: 'https://apply.example.org/',
  PUBLIC_MEMBER_PORTAL_URL: 'https://portal.example.org/',
  PUBLIC_APPLICATION_STATUS_URL: 'https://portal.example.org/status',
  PUBLIC_SPEAKER_INTEREST_URL: 'https://forms.example.org/speaker',
  PUBLIC_PARTNERSHIP_INTEREST_URL: 'https://forms.example.org/partner',
  PUBLIC_CONTACT_EMAIL: 'hello@example.org',
}).config;

describe('external action resolver', () => {
  it('covers all six handoffs the master command names', () => {
    expect(ALL_IDS.sort()).toEqual(
      [
        'application-status',
        'contact',
        'member-portal',
        'membership-application',
        'partnership-interest',
        'speaker-interest',
      ].sort(),
    );
  });

  it.each(ALL_IDS)('%s resolves to an unavailable state when nothing is configured', (id) => {
    const result = resolveExternalAction(id, {});
    expect(result.state).toBe('unavailable');
    if (result.state === 'unavailable') {
      expect(result.message.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(ALL_IDS)('%s resolves to a real destination when configured', (id) => {
    const result = resolveExternalAction(id, FULLY_CONFIGURED);
    expect(result.state).toBe('available');
  });

  it('renders contact as a mailto:, not a browsing-context link', () => {
    const result = resolveExternalAction('contact', FULLY_CONFIGURED);
    expect(result).toEqual({ state: 'available', href: 'mailto:hello@example.org', kind: 'email' });
  });

  it('never produces a dead or unsafe href in either state', () => {
    for (const id of ALL_IDS) {
      for (const config of [{}, FULLY_CONFIGURED]) {
        const result = resolveExternalAction(id, config);
        if (result.state === 'available') {
          expect(result.href).not.toBe('#');
          expect(result.href).not.toMatch(/^javascript:/i);
          expect(result.href.trim().length).toBeGreaterThan(0);
        } else {
          // The unavailable state carries copy, and no href at all.
          expect('href' in result).toBe(false);
        }
      }
    }
  });

  it('drops a malformed destination rather than shipping it as a link', () => {
    const { config } = resolvePublicConfig({
      PUBLIC_MEMBERSHIP_APPLICATION_URL: '#',
      PUBLIC_CONTACT_EMAIL: 'not-an-email',
    });
    expect(resolveExternalAction('membership-application', config).state).toBe('unavailable');
    expect(resolveExternalAction('contact', config).state).toBe('unavailable');
  });

  it('gives every action its own unavailable copy', () => {
    const messages = ALL_IDS.map((id) => {
      const result = resolveExternalAction(id, {});
      return result.state === 'unavailable' ? result.message : '';
    });
    expect(new Set(messages).size).toBe(messages.length);
  });
});
