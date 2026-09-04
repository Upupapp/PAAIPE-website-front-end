/**
 * One name for the monthly series.
 *
 * OWNER RULING, 2026-09-04: it is **"PAAIPE AI Exchange"**.
 *
 * The site previously carried both — "PAAIPE Members' AI Exchange" as the
 * series title and "PAAIPE AI Exchange" in the announcement the owner supplied
 * verbatim. Two names for one monthly forum is not a typo: it splits the thing
 * in a reader's mind, and it would have split the recurrence, the registrations
 * and the history if a server had ever modelled it. The backend lane reached
 * the same answer independently and treats the longer form as a migration alias
 * for the same series.
 *
 * This refuses the old form so it cannot return one string at a time.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '../lib/strip-comments';
import { SIGNATURE_EVENT } from '../content';

const SRC = new URL('../', import.meta.url).pathname;
const SCANNED = new Set(['.ts', '.astro']);

function collect(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collect(full);
    return SCANNED.has(extname(entry)) ? [full] : [];
  });
}

const files = collect(SRC).filter((file) => !file.includes('/tests/'));

/** Every way the superseded name has been spelled, straight and curly. */
const SUPERSEDED = [
  "PAAIPE Members' AI Exchange",
  'PAAIPE Members’ AI Exchange',
  "Members' AI Exchange",
  'Members’ AI Exchange',
];

describe('the series has one name', () => {
  it('is the name the owner ruled', () => {
    expect(SIGNATURE_EVENT.title).toBe('PAAIPE AI Exchange');
  });

  it('is the same name the announcement uses', () => {
    // The conflict that started this: the announcement and the title disagreed.
    expect(SIGNATURE_EVENT.announcementBar).toContain(SIGNATURE_EVENT.title);
  });

  it('scans a non-empty set of files', () => {
    expect(files.length).toBeGreaterThan(60);
  });

  it('has no superseded spelling left in any shipped string', () => {
    /*
     * Comments are stripped first. The file that records this ruling QUOTES the
     * old name to explain what changed, and a scan that read comments would
     * flag the explanation of the prohibition — a trap this project has hit
     * four times. String literals survive the strip, so a real occurrence in
     * shipped copy is still caught.
     */
    const offenders: string[] = [];
    for (const file of files) {
      const source = stripComments(readFileSync(file, 'utf8'));
      for (const name of SUPERSEDED) {
        if (source.includes(name)) {
          offenders.push(`${relative(SRC, file)} still says ${JSON.stringify(name)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
