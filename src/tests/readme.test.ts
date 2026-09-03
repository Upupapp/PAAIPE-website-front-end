import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TABS } from '../config/tabs';

const README = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');

/** Parse the "| 01 | scope | status |" rows out of the status table. */
function parseStatusTable(markdown: string): Map<string, string> {
  const rows = new Map<string, string>();
  for (const [, id, , status] of markdown.matchAll(
    /^\|\s*(\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm,
  )) {
    if (id && status) rows.set(id, status.trim());
  }
  return rows;
}

const rows = parseStatusTable(README);

describe('README implementation status', () => {
  it('parses all sixteen rows', () => {
    // Without this the comparisons below pass on an empty map - the exact way
    // this table drifted three tabs out of date unnoticed.
    expect(rows.size).toBe(16);
  });

  it.each(TABS.map((tab) => [tab.id, tab] as const))(
    'tab %s reports the same status as src/config/tabs.ts',
    (id, tab) => {
      const status = rows.get(id);
      expect(status, `tab ${id} missing from the README table`).toBeDefined();
      expect(status === '**Complete**', `tab ${id} status disagrees with tabs.ts`).toBe(
        tab.complete,
      );
    },
  );
});
