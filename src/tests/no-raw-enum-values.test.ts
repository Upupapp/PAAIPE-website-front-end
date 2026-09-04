/**
 * No closed-union machine value may reach the screen as visible text.
 *
 * `format` and `timeZone` were rendered straight into the event card and the
 * event detail page, so a visitor read "Format: online" in lowercase and
 * "Time zone: Asia/Manila" — an IANA identifier — next to properly written
 * fields like "To be announced". The values were correct; they were just never
 * meant to be read by a person.
 *
 * The codebase already had the right pattern in `REGISTRATION_STATE_LABELS`.
 * The defect was that nothing enforced it, so two of three unions got a label
 * map and one did not. This is that enforcement.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENT_FORMAT_LABELS, REGISTRATION_STATE_LABELS, TIME_ZONE_LABELS } from '../content';

const SRC = new URL('../', import.meta.url).pathname;

function collect(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collect(full);
    return ['.astro'].includes(extname(entry)) ? [full] : [];
  });
}

const templates = collect(SRC).filter((file) => !file.includes('/tests/'));

describe('label maps cover every union that reaches the screen', () => {
  it('labels all three event formats', () => {
    expect(Object.keys(EVENT_FORMAT_LABELS).sort()).toEqual(['hybrid', 'in-person', 'online']);
    for (const label of Object.values(EVENT_FORMAT_LABELS)) {
      // A label that is just the raw value re-typed is not a label.
      expect(label).toMatch(/^[A-Z]/);
      expect(label).not.toContain('-');
    }
  });

  it('labels the time zone as something a reader understands', () => {
    expect(TIME_ZONE_LABELS['Asia/Manila']).toBe('Philippine Time (PHT)');
    // It must not still be the IANA identifier.
    expect(TIME_ZONE_LABELS['Asia/Manila']).not.toContain('/');
  });

  it('labels all seven registration states', () => {
    expect(Object.keys(REGISTRATION_STATE_LABELS)).toHaveLength(7);
    for (const label of Object.values(REGISTRATION_STATE_LABELS)) {
      expect(label).toMatch(/^[A-Z]/);
      expect(label).not.toContain('-');
    }
  });
});

describe('no template renders a raw union value', () => {
  /**
   * Scanned at SOURCE level, on the expression rather than the output.
   *
   * A built-HTML scan would only catch a value that a fixture happens to use
   * today: every event in the registry is `online`, so `in-person` and `hybrid`
   * would go unrendered and unchecked, and the scan would pass by never
   * meeting them. The expression is the thing that is either right or wrong.
   */
  const RAW_EXPRESSIONS = [
    { expression: 'view.category', field: 'format', label: 'EVENT_FORMAT_LABELS' },
    { expression: 'view.timeZone', field: 'timeZone', label: 'TIME_ZONE_LABELS' },
    { expression: 'event.format', field: 'format', label: 'EVENT_FORMAT_LABELS' },
    {
      expression: 'event.registrationState',
      field: 'registrationState',
      label: 'REGISTRATION_STATE_LABELS',
    },
  ];

  it('scans a non-empty set of templates', () => {
    expect(templates.length).toBeGreaterThan(20);
  });

  for (const { expression, field, label } of RAW_EXPRESSIONS) {
    it(`never prints {${expression}} directly`, () => {
      const offenders: string[] = [];
      for (const file of templates) {
        const source = readFileSync(file, 'utf8');
        // `{expr}` as the whole child of an element is the shape that prints it.
        // `data-topic={event.format}` is fine: an attribute is not read by a person.
        const printed = new RegExp(`>\\s*\\{${expression.replace('.', '\\.')}\\}\\s*<`);
        if (printed.test(source)) {
          offenders.push(`${file.replace(SRC, 'src/')} prints ${field} raw — use ${label}`);
        }
      }
      expect(offenders).toEqual([]);
    });
  }
});
