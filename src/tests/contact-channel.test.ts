/**
 * The general contact channel, and the line it must never cross.
 *
 * The owner supplied `paul@lguids.com.ph` as the main contact across the
 * platform (bus #0312). It is wired as the GENERAL channel and must never
 * become the privacy-rights or DPO channel.
 *
 * THAT IS A LEGAL LINE, NOT A PREFERENCE. NPC Circular 2022-04 s8 requires a
 * DPO's dedicated address to be "separate and distinct from the personal and
 * work e-mail of the personnel assigned as a DPO", and to be maintained so the
 * Commission can always reach the organisation - the interim-DPO clause exists
 * precisely because the mailbox must outlive the person. A personal address on
 * a third party's domain cannot carry that role.
 *
 * So the privacy notice keeps pointing a data subject at the NPC until a DPO
 * and a role mailbox exist. These assert the two never merge by accident, which
 * is the likely way it would happen: someone sees a contact address configured
 * and wires it into the privacy route because the gap is embarrassing.
 */
import { readFileSync, globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTACT_PAGE } from '../content';
import { resolveExternalAction } from '../lib/external-action';

const GENERAL = 'paul@lguids.com.ph';

describe('the general contact channel', () => {
  it('reports unavailable when nothing is configured, and says so honestly', () => {
    const resolved = resolveExternalAction('contact', {});
    expect(resolved.state).toBe('unavailable');
    // The union narrows: only the unavailable arm carries a message, which is
    // the type doing the work of stopping a caller reading one off a live action.
    if (resolved.state === 'unavailable') {
      expect(resolved.message).toBe('No contact channel is published yet');
    }
  });

  it('becomes available when an address is configured', () => {
    const resolved = resolveExternalAction('contact', { contactEmail: GENERAL });
    expect(resolved.state).toBe('available');
  });
});

describe('the general channel is NOT the privacy-rights channel', () => {
  it('keeps the privacy route pointing somewhere that does not need a DPO', () => {
    /*
     * The privacy route text must not name the general address. A reader
     * exercising a statutory right needs a channel that survives a change of
     * person; this one is a named individual on a domain PAAIPE does not own.
     */
    expect(CONTACT_PAGE.privacyRoute).not.toContain(GENERAL);
    expect(CONTACT_PAGE.privacyRoute.toLowerCase()).not.toContain('lguids');
  });

  it('does not name the general address anywhere in the legal copy', () => {
    const legal = globSync('src/content/legal*.ts');
    expect(legal.length, 'no legal content found; this test measures nothing').toBeGreaterThan(0);
    for (const file of legal) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} names the general contact as a rights channel`).not.toContain(GENERAL);
    }
  });

  it('proves the check can see the address when it is present', () => {
    // The paired positive: the same assertion against text that MUST match.
    expect('write to paul@lguids.com.ph').toContain(GENERAL);
  });
});
