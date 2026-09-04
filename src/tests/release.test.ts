/**
 * The release gate's inputs.
 *
 * The owner ruling for Tab 16 asks for two properties specifically, and both
 * are asserted here rather than trusted:
 *
 *   - the blocker list comes from ONE source, checked in BOTH directions;
 *   - supplying an input flips its row with no edit to the gate.
 */
import { existsSync, statSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { OWNER_ITEMS } from '../config/pending';
import {
  APPROVED_ORIGIN,
  APPROVED_TYPEFACE,
  DETECTOR_IDS,
  OPERATIONS,
  RELEASE_INPUTS,
  clearsBy,
  evaluateInputs,
  type ApprovedOrigin,
  type ApprovedTypeface,
  type Operations,
  type ReleaseFacts,
} from '../config/release';

/*
 * The three owner constants are nulled EXPLICITLY rather than left to fall back
 * to the module.
 *
 * They were omitted while all three happened to be null, so "nothing supplied"
 * was a fact about `src/config/` rather than about this object. When
 * `APPROVED_ORIGIN` was filled in on 2026-09-04 the fixture silently started
 * supplying an origin, and every test naming it meant something else.
 */
const NOTHING_SUPPLIED: ReleaseFacts = {
  env: {},
  approvedMediaFiles: 0,
  policyStatuses: ['draft-for-review', 'draft-for-review'],
  approvedTypeface: null,
  operations: null,
  approvedOrigin: null,
};

/** The origin `netlify.toml` commits and the owner approved on 2026-09-04. */
const NETLIFY_ORIGIN = 'https://classy-quokka-2b788f.netlify.app';

const APPROVED: ApprovedOrigin = {
  origin: 'https://paaipe.example',
  approvedIn: 'a test, not a real approval',
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

  it('reads the DEPLOY configuration, not only the caller shell', () => {
    /*
     * The origin lives in `netlify.toml [build.environment]`, which is where the
     * deploy reads it. Evaluating against `process.env` alone reported B-7 as
     * UNMET on a developer machine while production had it set — the gate was
     * asking the wrong environment.
     *
     * The committed config being READ is asserted through B-7's reason, which
     * quotes back the value it found. Asserting it through `supplied` is what
     * the previous version of this test did, and that conflated "the gate can
     * see the deploy config" with "the origin is approved" — see the next test.
     */
    const results = evaluateInputs({
      ...NOTHING_SUPPLIED,
      configuredEnv: { PUBLIC_SITE_URL: NETLIFY_ORIGIN },
    });
    expect(results.find((result) => result.id === 'B-7')?.reason).toContain(
      'classy-quokka-2b788f.netlify.app',
    );
  });

  it('lets an explicitly exported value override the committed config', () => {
    // How you test an alternative origin without editing netlify.toml. The
    // override is proved by the REASON changing: a malformed export makes the
    // configured origin absent, so there is nothing to report as unapproved.
    const results = evaluateInputs({
      ...NOTHING_SUPPLIED,
      configuredEnv: { PUBLIC_SITE_URL: 'https://committed.example' },
      env: { PUBLIC_SITE_URL: 'not-a-url' },
    });
    const b7 = results.find((result) => result.id === 'B-7');
    expect(b7?.supplied).toBe(false);
    expect(b7?.reason, 'the exported junk must win over the committed value').toBeUndefined();
  });

  it('flips B-4 on environment alone, but NOT B-7 — approval is a separate input', () => {
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, env: CONFIGURED_ENV });
    const byId = Object.fromEntries(results.map((result) => [result.id, result.supplied]));
    expect(byId['B-4'], 'setting all seven destinations must flip B-4').toBe(true);
    expect(byId['B-7'], 'setting PUBLIC_SITE_URL alone must NOT flip B-7').toBe(false);
    // And only B-4: nothing else may flip on an env change.
    expect(results.filter((r) => r.supplied).map((r) => r.id)).toEqual(['B-4']);
  });

  it('flips B-7 only when the configured origin is the APPROVED one', () => {
    const results = evaluateInputs({
      ...NOTHING_SUPPLIED,
      env: CONFIGURED_ENV,
      approvedOrigin: APPROVED,
    });
    const byId = Object.fromEntries(results.map((result) => [result.id, result.supplied]));
    expect(byId['B-7']).toBe(true);
    expect(byId['B-4']).toBe(true);
  });

  it('does not flip B-4 when one destination is still missing', () => {
    const partial = { ...CONFIGURED_ENV };
    delete (partial as Partial<typeof CONFIGURED_ENV>).PUBLIC_CONTACT_EMAIL;
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, env: partial, approvedOrigin: APPROVED });
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

describe('B-7 distinguishes a CONFIGURED origin from an APPROVED one', () => {
  /*
   * The defect this suite exists for, measured at 4c9f6d0 before the fix:
   * B-7's detector asked "is `PUBLIC_SITE_URL` non-empty", and
   * `netlify.toml:46` commits `https://classy-quokka-2b788f.netlify.app` — an
   * auto-generated Netlify subdomain, put there so the deploy had somewhere to
   * point. The gate reported B-7 SUPPLIED and the outstanding count fell from
   * six to five.
   *
   * A presence check standing in for an approval check, and it fails in the
   * dangerous direction: B-7's own fallback says "a guessed origin would
   * de-index the real page". An absent canonical is honestly absent; a wrong
   * one is confidently wrong.
   *
   * The owner approved that same host on 2026-09-04, so the distinction is no
   * longer visible in the default state. It is asserted here by nulling the
   * approval explicitly — which is also the state the repository re-enters the
   * day a custom domain moves `PUBLIC_SITE_URL` and not the approval.
   */
  const withPlaceholder = (extra: Partial<ReleaseFacts> = {}) =>
    evaluateInputs({
      ...NOTHING_SUPPLIED,
      configuredEnv: { PUBLIC_SITE_URL: NETLIFY_ORIGIN },
      ...extra,
    }).find((result) => result.id === 'B-7');

  it('does NOT flip on a configured origin that nothing has approved', () => {
    expect(withPlaceholder()?.supplied).toBe(false);
  });

  it('says WHY, naming the value it found and what is missing', () => {
    const reason = withPlaceholder()?.reason ?? '';
    expect(reason).toContain(NETLIFY_ORIGIN);
    expect(reason).toContain('APPROVED');
    expect(reason).toContain('APPROVED_ORIGIN');
  });

  it('does NOT flip when an origin is approved but a DIFFERENT one is configured', () => {
    // The wrong-canonical case with both halves present. A move to a custom
    // domain that updates one side and not the other lands exactly here.
    const result = withPlaceholder({ approvedOrigin: APPROVED });
    expect(result?.supplied).toBe(false);
    expect(result?.reason).toContain('https://paaipe.example');
    expect(result?.reason).toContain('classy-quokka');
  });

  it('flips when the approved origin and the configured origin agree', () => {
    const result = evaluateInputs({
      ...NOTHING_SUPPLIED,
      configuredEnv: { PUBLIC_SITE_URL: 'https://paaipe.example/' },
      approvedOrigin: APPROVED,
    }).find((r) => r.id === 'B-7');
    expect(result?.supplied).toBe(true);
    expect(result?.reason, 'a supplied row must carry no leftover reason').toBeUndefined();
  });

  it('does NOT flip on an approval whose own origin is unparseable', () => {
    // `APPROVED_ORIGIN` is hand-edited. A typo there must not become a pass by
    // comparing two things neither of which is a URL.
    const result = withPlaceholder({
      approvedOrigin: { origin: 'paaipe.org', approvedIn: 'a typo' },
    });
    expect(result?.supplied).toBe(false);
    expect(result?.reason).toContain('not a parseable absolute URL');
  });

  it('reports B-7 unmet while another row is green — the two are independent', () => {
    /*
     * `evaluateInputs` maps over one list, so a per-row bug would show as every
     * row agreeing. Five of six detectors had been observed firing beside a
     * green row; B-7 never had, which is precisely the row that later turned
     * green when it should not have.
     */
    const results = evaluateInputs({
      ...NOTHING_SUPPLIED,
      configuredEnv: { PUBLIC_SITE_URL: NETLIFY_ORIGIN },
      approvedMediaFiles: 1,
      policyStatuses: ['approved', 'approved'],
    });
    const byId = Object.fromEntries(results.map((result) => [result.id, result.supplied]));
    expect(byId['B-6'], 'B-6 must be green here').toBe(true);
    expect(byId['B-9'], 'B-9 must be green here').toBe(true);
    expect(byId['B-7'], 'B-7 must be red beside them').toBe(false);
  });
});

describe('the config-supplied inputs, in BOTH directions', () => {
  it('records B-8 as null rather than as a placeholder', () => {
    // A placeholder value here would flip the gate green while nothing real
    // exists. Null is the only honest empty.
    expect(OPERATIONS).toBeNull();
  });

  it('records B-5 as a REAL typeface, not a plausible-looking one', () => {
    /*
     * B-5 was null until Public Sans was adopted. The assertion that mattered
     * while it was null - that no placeholder flips the gate green - matters
     * just as much now, in the other direction: a constant naming a font whose
     * file is not there would report B-5 supplied while every visitor silently
     * got the fallback stack.
     */
    expect(APPROVED_TYPEFACE).not.toBeNull();
    expect(APPROVED_TYPEFACE!.family.length).toBeGreaterThan(2);
    expect(APPROVED_TYPEFACE!.licence).toMatch(/OFL|Open Font License/i);
    expect(APPROVED_TYPEFACE!.files.length).toBeGreaterThan(0);
    for (const file of APPROVED_TYPEFACE!.files) {
      // The file is asserted to EXIST, not merely to be named.
      const onDisk = new URL(`../../public${file}`, import.meta.url).pathname;
      expect(existsSync(onDisk), `${file} is named but not present in public/`).toBe(true);
      expect(statSync(onDisk).size, `${file} is empty`).toBeGreaterThan(1000);
    }
  });

  it('records B-7 as an APPROVAL, with where the approval can be audited', () => {
    /*
     * The one constant that is filled in, and the only one whose value came
     * from the owner rather than from an absence. It is asserted here so that
     * changing the origin is a visible, deliberate edit to a named test rather
     * than a quiet change to a default that every emission reads.
     *
     * `approvedIn` is asserted too: an approval that cannot be traced back to a
     * record is the same trust-me the three-state resolution exists to refuse.
     */
    expect(APPROVED_ORIGIN?.origin).toBe(NETLIFY_ORIGIN);
    expect(APPROVED_ORIGIN?.approvedIn).toContain('pending.ts');
    expect(APPROVED_ORIGIN?.approvedIn).toContain('2026-09-04');
  });

  it('keeps the approval and the committed `netlify.toml` origin in agreement', () => {
    /*
     * THE TWO HALVES, CHECKED AGAINST EACH OTHER RATHER THAN EACH AGAINST A
     * LITERAL. B-7 needs `APPROVED_ORIGIN` and `PUBLIC_SITE_URL` to name the
     * same host, and the second lives in `netlify.toml [build.environment]` —
     * a file no TypeScript import reaches, so nothing had ever compared them.
     *
     * The build is SAFE when they disagree: every absolute URL suppresses. But
     * safe-and-silent is how a custom-domain move ships a site with no
     * canonical and nobody notices, so the disagreement is made loud here.
     */
    const toml = readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8');
    const section = toml.split(/^\[build\.environment\]$/m)[1]?.split(/^\[/m)[0] ?? '';
    const configured = /^\s*PUBLIC_SITE_URL\s*=\s*"([^"]*)"/m.exec(section)?.[1];

    expect(configured, 'netlify.toml commits no PUBLIC_SITE_URL').toBeDefined();
    expect(
      new URL(configured!).origin,
      'netlify.toml and APPROVED_ORIGIN name different hosts — the build will suppress every absolute URL',
    ).toBe(new URL(APPROVED_ORIGIN!.origin).origin);
  });

  /*
   * B-5's and B-8's detectors used to close over the module constants above,
   * which have been null since the file was written. Their true branches were
   * therefore UNREACHABLE: nothing had ever seen them succeed, and a detector
   * proven only by failing is indistinguishable from one that cannot succeed.
   * Routing them through `facts` is what makes the four tests below possible.
   */
  const TYPEFACE: ApprovedTypeface = {
    family: 'Test Sans',
    licence: 'a test, not a licence',
    files: ['fonts/test-sans.woff2'],
  };

  const OPS: Operations = {
    hostingOwner: 'someone',
    releaseMethod: 'atomic deploy',
    rollback: 'redeploy the previous',
    monitoring: 'an uptime check',
    incidentContact: 'a person',
  };

  it('flips B-5 when a typeface is supplied, and only B-5', () => {
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, approvedTypeface: TYPEFACE });
    expect(results.filter((r) => r.supplied).map((r) => r.id)).toEqual(['B-5']);
  });

  it('flips B-8 when every operational field is named, and only B-8', () => {
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, operations: OPS });
    expect(results.filter((r) => r.supplied).map((r) => r.id)).toEqual(['B-8']);
  });

  it('does NOT flip B-8 on an OPERATIONS with no enumerable fields', () => {
    /*
     * `[].every(...)` is `true`. Without the length check, an `OPERATIONS` cast
     * from `{}` — or parsed from JSON, or refactored to getters — would report
     * the hosting arrangements as SUPPLIED while naming nobody. B-9 has carried
     * this guard since it was written. B-8 did not, and because its true branch
     * had never executed, nothing would have caught it.
     */
    const results = evaluateInputs({ ...NOTHING_SUPPLIED, operations: {} as Operations });
    expect(results.find((r) => r.id === 'B-8')?.supplied).toBe(false);
  });

  it('does NOT flip B-8 when one field is blank or whitespace', () => {
    const results = evaluateInputs({
      ...NOTHING_SUPPLIED,
      operations: { ...OPS, incidentContact: '   ' },
    });
    expect(results.find((r) => r.id === 'B-8')?.supplied).toBe(false);
  });
});

describe('the report tells each row the truth about how it clears', () => {
  /*
   * The generated report appended ONE sentence to every unmet row — "the gate
   * re-reads the world on every run, so the row turns green with no change to
   * the gate itself". True for B-4, B-6 and B-9. False for B-5 and B-8, whose
   * detectors read a constant in `src/config/release.ts`, and it was printed
   * three lines from a row where it is literally true.
   */
  it('declares where every detector looks', () => {
    for (const input of RELEASE_INPUTS) {
      expect(['world', 'configuration', 'both'], `${input.id}`).toContain(input.readsFrom);
    }
  });

  it('claims "re-reads the world" for no input that reads a constant', () => {
    for (const input of RELEASE_INPUTS) {
      const sentence = clearsBy(input);
      if (input.readsFrom === 'world') {
        expect(sentence, `${input.id}`).toContain('re-reads the world');
      } else {
        expect(sentence, `${input.id} must not claim the row flips on its own`).not.toContain(
          'no change to the gate itself',
        );
      }
    }
  });

  it('sends B-5 and B-8 to the file they are actually edited in', () => {
    for (const id of ['B-5', 'B-8']) {
      const input = RELEASE_INPUTS.find((candidate) => candidate.id === id);
      expect(input?.readsFrom, `${id} reads a constant, not the world`).toBe('configuration');
      expect(input?.howToSupply).toContain('src/config/release.ts');
    }
  });
});
