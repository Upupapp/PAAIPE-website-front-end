/**
 * The release gate's inputs.
 *
 * The owner ruling for Tab 16 asks for two properties specifically, and both
 * are asserted here rather than trusted:
 *
 *   - the blocker list comes from ONE source, checked in BOTH directions;
 *   - supplying an input flips its row with no edit to the gate.
 */
import { describe, expect, it } from 'vitest';
import { OWNER_ITEMS } from '../config/pending';
import {
  APPROVED_TYPEFACE,
  DETECTOR_IDS,
  OPERATIONS,
  RELEASE_INPUTS,
  evaluateInputs,
  type ReleaseFacts,
} from '../config/release';

const NOTHING_SUPPLIED: ReleaseFacts = {
  env: {},
  approvedMediaFiles: 0,
  policyStatuses: ['draft-for-review', 'draft-for-review'],
};

const CONFIGURED_ENV = {
  PUBLIC_SITE_URL: 'https://paaipe.example',
  PUBLIC_MEMBERSHIP_APPLICATION_URL: 'https://apply.example',
  PUBLIC_MEMBER_PORTAL_URL: 'https://portal.example',
  PUBLIC_APPLICATION_STATUS_URL: 'https://status.example',
  PUBLIC_SPEAKER_INTEREST_URL: 'https://speak.example',
  PUBLIC_PARTNERSHIP_INTEREST_URL: 'https://partner.example',
  PUBLIC_CONTACT_EMAIL: 'hello@paaipe.example',
};

describe('one source of truth for what blocks a release', () => {
  it('takes its blockers from the pending register, not from a second list', () => {
    const blockedInRegister = OWNER_ITEMS.filter((item) => item.state === 'BLOCKED').map(
      (item) => item.id,
    );
    expect(RELEASE_INPUTS.map((input) => input.id).sort()).toEqual([...blockedInRegister].sort());
  });

  it('matches the detector table in BOTH directions', () => {
    /*
     * A missing id and an extra id are different bugs. An allow-list fails by
     * FORGETTING - silently - so the equality is asserted both ways round
     * rather than as a single subset check.
     */
    const inputIds = new Set(RELEASE_INPUTS.map((input) => input.id));
    const detectorIds = new Set(DETECTOR_IDS);

    const withoutDetector = [...inputIds].filter((id) => !detectorIds.has(id));
    const withoutBlocker = [...detectorIds].filter((id) => !inputIds.has(id));

    expect(
      withoutDetector,
      'blocked in the register with no detector - the gate can never flip',
    ).toEqual([]);
    expect(withoutBlocker, 'a detector for something no longer blocked - stale').toEqual([]);
  });

  it('is the six the owner ruling names', () => {
    expect(RELEASE_INPUTS.map((input) => input.id).sort()).toEqual([
      'B-4',
      'B-5',
      'B-6',
      'B-7',
      'B-8',
      'B-9',
    ]);
  });

  it('says who supplies each one, and never answers "the frontend lane"', () => {
    for (const input of RELEASE_INPUTS) {
      expect(input.suppliedBy, `${input.id} has no supplier`).toBeTruthy();
      expect(input.suppliedBy.toLowerCase()).not.toContain('frontend');
      expect(input.missing.length, `${input.id} does not say what is missing`).toBeGreaterThan(20);
      expect(
        input.fallback.length,
        `${input.id} does not say what happens meanwhile`,
      ).toBeGreaterThan(40);
      expect(input.howToSupply.length, `${input.id} does not say how to supply it`).toBeGreaterThan(
        20,
      );
    }
  });
});

describe('the gate flips itself when an input arrives', () => {
  it('reports every input unsupplied in the current state', () => {
    const results = evaluateInputs(NOTHING_SUPPLIED);
    expect(results.filter((result) => result.supplied).map((r) => r.id)).toEqual([]);
  });

  it('flips B-4 and B-7 on environment alone, with no code change', () => {
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, env: CONFIGURED_ENV });
    const byId = Object.fromEntries(results.map((result) => [result.id, result.supplied]));
    expect(byId['B-7'], 'setting PUBLIC_SITE_URL must flip B-7').toBe(true);
    expect(byId['B-4'], 'setting all seven destinations must flip B-4').toBe(true);
    // And only those two: nothing else may flip on an env change.
    expect(
      results
        .filter((r) => r.supplied)
        .map((r) => r.id)
        .sort(),
    ).toEqual(['B-4', 'B-7']);
  });

  it('does not flip B-4 when one destination is still missing', () => {
    const partial = { ...CONFIGURED_ENV };
    delete (partial as Partial<typeof CONFIGURED_ENV>).PUBLIC_CONTACT_EMAIL;
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, env: partial });
    expect(results.find((result) => result.id === 'B-4')?.supplied).toBe(false);
    // B-7 still flips: the two are independent inputs, not one aggregate.
    expect(results.find((result) => result.id === 'B-7')?.supplied).toBe(true);
  });

  it('does not flip B-4 on a malformed or insecure destination', () => {
    // A typo must not read as "supplied". The parser treats an http:// URL as
    // absent AND reports it, so a plaintext destination cannot ship.
    const results = evaluateInputs({
      ...NOTHING_SUPPLIED,
      env: { ...CONFIGURED_ENV, PUBLIC_MEMBER_PORTAL_URL: 'http://portal.example' },
    });
    expect(results.find((result) => result.id === 'B-4')?.supplied).toBe(false);
  });

  it('flips B-6 on an IMAGE appearing in public/media', () => {
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, approvedMediaFiles: 1 });
    expect(results.find((result) => result.id === 'B-6')?.supplied).toBe(true);
  });

  it('counts images, not files - the README about the absence is not the presence', () => {
    /*
     * `public/media/` contains a README explaining that it is empty. The first
     * version of the gate counted every directory entry and reported B-6 as
     * SUPPLIED: it read the note about the absence as evidence of the presence,
     * and turned a blocker green in the report the owner reads.
     *
     * The counting lives in the gate runner, so what is asserted here is the
     * contract the field carries - `approvedMediaFiles` means IMAGES - and that
     * zero of them keeps the blocker unmet no matter what else is in the folder.
     */
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, approvedMediaFiles: 0 });
    expect(results.find((result) => result.id === 'B-6')?.supplied).toBe(false);
  });

  it('flips B-9 only when EVERY policy is approved', () => {
    const partly = evaluateInputs({
      ...NOTHING_SUPPLIED,
      policyStatuses: ['approved', 'draft-for-review'],
    });
    expect(partly.find((result) => result.id === 'B-9')?.supplied).toBe(false);

    const all = evaluateInputs({ ...NOTHING_SUPPLIED, policyStatuses: ['approved', 'approved'] });
    expect(all.find((result) => result.id === 'B-9')?.supplied).toBe(true);
  });

  it('does not flip B-9 on an EMPTY policy list', () => {
    // `[].every(...)` is true. Without the length check, deleting every policy
    // would report the legal text as approved - a vacuous pass in the most
    // damaging place available.
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, policyStatuses: [] });
    expect(results.find((result) => result.id === 'B-9')?.supplied).toBe(false);
  });
});

describe('the two config-supplied inputs', () => {
  it('records B-5 and B-8 as unsupplied, as null rather than as a placeholder', () => {
    // A placeholder value here would flip the gate green while nothing real
    // exists. Null is the only honest empty.
    expect(APPROVED_TYPEFACE).toBeNull();
    expect(OPERATIONS).toBeNull();
  });
});
