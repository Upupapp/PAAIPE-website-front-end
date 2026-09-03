import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALL_PENDING, DELIBERATE_OMISSIONS, FRONTEND_ITEMS, OWNER_ITEMS } from '../config/pending';

const PENDING = readFileSync(new URL('../../docs/PENDING.md', import.meta.url), 'utf8');

describe('pending register', () => {
  it('lists every item in the generated document', () => {
    // The register sat frozen for seven tabs because hand-edits silently
    // missed a reflowed table. This is the guard against that recurring.
    for (const item of ALL_PENDING) {
      expect(PENDING, `${item.id} missing from docs/PENDING.md`).toContain(item.id);
    }
  });

  it('records the same state for every item', () => {
    for (const item of ALL_PENDING) {
      const row = PENDING.split('\n').find(
        (line) => line.includes(`| ${item.id} |`) || line.includes(`| ~~${item.id}~~ |`),
      );
      expect(row, `${item.id} has no row`).toBeDefined();
      expect(row, `${item.id} state disagrees`).toContain(`**${item.state}**`);
    }
  });

  it('uses unique ids', () => {
    const ids = ALL_PENDING.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every item a real reason, never a placeholder', () => {
    for (const item of ALL_PENDING) {
      expect(item.reason.trim().length, item.id).toBeGreaterThan(25);
      expect(item.reason, item.id).not.toMatch(/^(tbd|todo|n\/a)$/i);
    }
  });

  it('names what would unblock every BLOCKED item', () => {
    for (const item of ALL_PENDING.filter((i) => i.state === 'BLOCKED')) {
      expect(item.reason.length, `${item.id} does not say what unblocks it`).toBeGreaterThan(40);
    }
  });

  it('carries both halves of the register and the omissions list', () => {
    expect(FRONTEND_ITEMS.length).toBeGreaterThan(15);
    expect(OWNER_ITEMS.length).toBeGreaterThan(10);
    expect(DELIBERATE_OMISSIONS.length).toBeGreaterThan(10);
    for (const omission of DELIBERATE_OMISSIONS) {
      expect(PENDING).toContain(omission.slice(0, 40));
    }
  });
});
