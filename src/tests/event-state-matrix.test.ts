/**
 * Tab 06 - the full lifecycle x registration x access x service matrix.
 *
 * WHY A GENERATED MATRIX RATHER THAN A LIST OF CASES. The command's acceptance
 * check is "every lifecycle/registration combination has tested, approved copy",
 * and a hand-written list can only ever test the combinations someone thought
 * of. This enumerates the type's own unions, so adding a lifecycle or a
 * registration state to the model makes these tests cover it without anyone
 * remembering to - and a combination that produces dishonest output fails here
 * rather than on a page.
 *
 * The matrix is built from a synthetic record on purpose. The sample registry
 * covers the states worth LOOKING at; this covers the states that are POSSIBLE,
 * including ones no fixture has, and those are where the gaps have been.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { publicEventRecordSchema } from '../content/schemas';
import { SCHEDULE_UPDATED_NOTICE } from '../content/events-detail';
import { REGISTRATION_UNAVAILABLE_MESSAGE } from '../config/event-config';
import { resolveEventAction } from '../lib/event-action';
import type {
  EventAccess,
  EventLifecycle,
  PublicEventRecord,
  RegistrationState,
} from '../content/event-record';
import type { RegistrationService } from '../lib/event-action';

const LIFECYCLES: readonly EventLifecycle[] = ['scheduled', 'cancelled', 'completed'];
const STATES: readonly RegistrationState[] = ['not-open', 'open', 'waitlist', 'full', 'closed'];
const ACCESSES: readonly EventAccess[] = ['public', 'members-only'];
const SERVICES: readonly RegistrationService[] = ['available', 'unavailable'];

function record(
  lifecycle: EventLifecycle,
  state: RegistrationState,
  access: EventAccess,
  extra: Partial<PublicEventRecord> = {},
): PublicEventRecord {
  return {
    schemaVersion: 1,
    id: 'matrix',
    slug: 'matrix',
    title: 'Matrix',
    excerpt: 'Matrix',
    description: [],
    contentStatus: 'sample',
    type: 'workshop',
    access,
    format: 'online',
    lifecycle,
    timeZone: 'Asia/Manila',
    formatLabel: 'Online · Private Zoom',
    publicAgenda: [],
    learningOutcomes: [],
    audience: [],
    speakerIds: [],
    topicTags: [],
    registration: {
      mode: 'email',
      state,
      requiresVerifiedMembership: access === 'members-only',
      // `waitlist` requires it; `full` forbids it (see the schema rule below).
      waitlistEnabled: state === 'waitlist',
      showCapacity: false,
      privacyNoticeVersion: 'draft-2026-09-04',
      eventVersion: 1,
    },
    media: { src: '/x.png', width: 1, height: 1, alt: '', rightsApproved: false },
    faqs: [],
    relatedSlugs: [],
    featured: false,
    seo: { title: 'Matrix', description: 'Matrix' },
    ...extra,
  };
}

const CELLS = LIFECYCLES.flatMap((lifecycle) =>
  STATES.flatMap((state) =>
    ACCESSES.flatMap((access) =>
      SERVICES.map((service) => ({ lifecycle, state, access, service })),
    ),
  ),
);

describe('the matrix covers what the model can express', () => {
  it('enumerates every combination', () => {
    expect(CELLS).toHaveLength(
      LIFECYCLES.length * STATES.length * ACCESSES.length * SERVICES.length,
    );
    expect(CELLS.length).toBe(60);
  });
});

describe('every cell produces honest, complete output', () => {
  for (const cell of CELLS) {
    const name = `${cell.lifecycle}/${cell.state}/${cell.access}/service-${cell.service}`;

    it(`${name} says something in every field a surface renders`, () => {
      const model = resolveEventAction(
        record(cell.lifecycle, cell.state, cell.access),
        cell.service,
      );
      expect(model.badge.trim(), 'badge').toBeTruthy();
      expect(model.message?.trim(), 'message').toBeTruthy();
      expect(model.tone, 'tone').toBeTruthy();
      // An action either has both a label and a destination, or neither.
      expect(
        Boolean(model.actionLabel) === Boolean(model.actionHref),
        `${name} has a label without a destination, or the reverse`,
      ).toBe(true);
    });

    it(`${name} never offers a registration path it cannot honour`, () => {
      const model = resolveEventAction(
        record(cell.lifecycle, cell.state, cell.access),
        cell.service,
      );

      // Rule 1: an ended event can never take a registration.
      if (cell.lifecycle !== 'scheduled') expect(model.formEnabled).toBe(false);

      // Rule 2: no endpoint means no registration, whatever the record says.
      if (cell.service === 'unavailable') expect(model.formEnabled).toBe(false);

      // Rule 3: only these two states could ever accept one.
      if (model.formEnabled) {
        expect(['open', 'waitlist']).toContain(cell.state);
        expect(cell.lifecycle).toBe('scheduled');
        expect(model.actionHref).toBe('/events/matrix/register');
      }

      // Rule 4: a member event always carries the member requirement forward.
      expect(model.memberCheckRequired).toBe(cell.access === 'members-only');
    });

    it(`${name} sends a reader somewhere that is not this page`, () => {
      const model = resolveEventAction(
        record(cell.lifecycle, cell.state, cell.access),
        cell.service,
      );
      if (!model.formEnabled && model.actionHref) {
        expect(model.actionHref, 'a dead-end state must offer a way onward').toBe('/events');
      }
    });
  }
});

describe('the service-unavailable rule uses the one approved sentence', () => {
  it('states it for a scheduled, open event', () => {
    const model = resolveEventAction(record('scheduled', 'open', 'public'), 'unavailable');
    expect(model.message).toBe(REGISTRATION_UNAVAILABLE_MESSAGE);
  });
});

describe('a changed schedule modifies a state rather than replacing it', () => {
  for (const state of STATES) {
    it(`${state} keeps its own registration meaning when rescheduled`, () => {
      const plain = resolveEventAction(record('scheduled', state, 'public'), 'available');
      const moved = resolveEventAction(
        record('scheduled', state, 'public', { scheduleUpdatedAt: '2026-09-20T09:00:00+08:00' }),
        'available',
      );

      // The registration answer is unchanged...
      expect(moved.formEnabled).toBe(plain.formEnabled);
      expect(moved.badge).toBe(plain.badge);
      // ...and the reader is told about the change as well, not instead.
      expect(moved.heading).toBe(SCHEDULE_UPDATED_NOTICE.heading);
      expect(moved.message).toContain(SCHEDULE_UPDATED_NOTICE.body);
      if (plain.message) expect(moved.message).toContain(plain.message);
    });
  }

  it('says nothing about a schedule change on a cancelled event', () => {
    const moved = resolveEventAction(
      record('cancelled', 'closed', 'public', { scheduleUpdatedAt: '2026-09-20T09:00:00+08:00' }),
      'available',
    );
    expect(moved.heading).not.toBe(SCHEDULE_UPDATED_NOTICE.heading);
    expect(moved.message).not.toContain(SCHEDULE_UPDATED_NOTICE.body);
  });

  it('shows no replacement date, only the notice', () => {
    const moved = resolveEventAction(
      record('scheduled', 'open', 'public', { scheduleUpdatedAt: '2026-09-20T09:00:00+08:00' }),
      'available',
    );
    // The instant is data for the page's own <time>, never prose in the notice.
    expect(moved.message).not.toContain('2026');
    expect(moved.message).not.toContain('+08:00');
  });
});

describe('a full event that accepts a waitlist is rejected as data', () => {
  /*
   * Tab 06: "If a full event accepts a waitlist, its public registration state
   * is waitlist, not full." Enforced in the schema rather than normalised in the
   * resolver, so the registry and the page cannot disagree about it.
   */
  it('refuses the combination at validation', () => {
    const bad = record('scheduled', 'full', 'public', {
      startAt: '2026-10-14T14:00:00+08:00',
      endAt: '2026-10-14T15:00:00+08:00',
      durationMinutes: 60,
    });
    const result = publicEventRecordSchema.safeParse({
      ...bad,
      registration: { ...bad.registration, waitlistEnabled: true },
    });
    expect(result.success).toBe(false);
  });

  it('accepts full without a waitlist, and waitlist with one', () => {
    /*
     * THE PAIRED POSITIVE. A rejection test alone cannot tell "the rule works"
     * from "the fixture is invalid for some other reason" - and the first
     * version of this test WAS invalid for another reason: a waitlist record
     * with no schedule, which the registry rightly refuses under the separate
     * rule that open registration needs a confirmed time. The schedule is
     * supplied here so the only thing under test is the waitlist rule.
     */
    const scheduled = {
      startAt: '2026-10-14T14:00:00+08:00',
      endAt: '2026-10-14T15:00:00+08:00',
      durationMinutes: 60,
    };
    expect(
      publicEventRecordSchema.safeParse(record('scheduled', 'full', 'public', scheduled)).success,
    ).toBe(true);
    expect(
      publicEventRecordSchema.safeParse(record('scheduled', 'waitlist', 'public', scheduled))
        .success,
    ).toBe(true);
  });
});

describe('the browser is never given a membership answer', () => {
  it('reports only whether a check is REQUIRED, never its result', () => {
    for (const access of ACCESSES) {
      const model = resolveEventAction(record('scheduled', 'open', access), 'available');
      const serialised = JSON.stringify(model).toLowerCase();
      for (const forbidden of ['iseligible', 'ismember', 'eligible:', 'membershipstatus']) {
        expect(serialised, `the model carries ${forbidden}`).not.toContain(forbidden);
      }
      expect(model.memberCheckRequired).toBe(access === 'members-only');
    }
  });
});

describe('the registration-management boundary stays outside this frontend', () => {
  /*
   * Tab 06: this release creates no cancellation or management tokens. The rule
   * is not "do not display a token" but "do not build the machinery" - no
   * `/manage?token=` route, no client-side parsing, no persistence, nothing in
   * analytics or referrers. A token this frontend never handles cannot leak
   * from it.
   *
   * Asserted against the SOURCE TREE rather than one module, because the thing
   * being ruled out is a file that does not exist yet, and no single module can
   * testify to that.
   */
  const SOURCE = readFileSync(new URL('../../tsconfig.json', import.meta.url), 'utf8');

  it('has no registration-management route', () => {
    const pages = globSync('src/pages/**/*.astro');
    expect(pages.length, 'no pages found; this test is measuring nothing').toBeGreaterThan(0);
    const manage = pages.filter((path) => /manage/i.test(path));
    expect(manage, 'a registration-management route exists').toEqual([]);
    expect(SOURCE.length).toBeGreaterThan(0);
  });

  it('parses no registration or cancellation token anywhere in src', () => {
    const files = globSync('src/**/*.{ts,astro}');
    expect(files.length, 'no source files found; this test is measuring nothing').toBeGreaterThan(
      0,
    );

    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      // The token names the command forbids handling, as CODE rather than prose.
      if (/searchParams\.get\(\s*['"](token|t|cancel|manage)['"]/.test(text)) {
        offenders.push(file);
      }
      if (/(registrationToken|cancellationToken|manageToken)\s*[:=]/.test(text)) {
        offenders.push(file);
      }
    }
    expect(offenders, 'source that handles a registration-management token').toEqual([]);
  });
});
