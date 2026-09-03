import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '../lib/strip-comments';

/**
 * Scope guard. These are cheap source scans that would catch the most damaging
 * Tab 01 regressions: a secret, a protected destination, or a fake workflow
 * appearing in frontend source. Tab 15 scans the BUILT bundle as well - a source
 * scan alone is not proof, so this file deliberately claims only what it checks.
 */

const SRC = new URL('../', import.meta.url).pathname;
const SCANNED_EXTENSIONS = new Set(['.ts', '.astro', '.css', '.js', '.mjs']);

function collectFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collectFiles(full);
    return SCANNED_EXTENSIONS.has(extname(entry)) ? [full] : [];
  });
}

/** Source files, excluding this test file and its sibling tests. */
const sourceFiles = collectFiles(SRC).filter((file) => !file.includes('/tests/'));

/**
 * Source with comments removed.
 *
 * A scan that reads comments flags the comment that DOCUMENTS the prohibition:
 * "no meeting ID or passcode exists here" trips a scan for `meeting id`. String
 * literals are preserved, so a genuinely leaked URL is still caught.
 */
function read(file: string): string {
  return stripComments(readFileSync(file, 'utf8'));
}

describe('frontend-only scope boundary', () => {
  it('scans a non-empty set of source files', () => {
    // Guards against the scans below passing because they looked at nothing.
    expect(sourceFiles.length).toBeGreaterThan(10);
  });

  it('contains no Zoom meeting link, meeting id or passcode', () => {
    const offenders = sourceFiles.filter((file) =>
      /zoom\.us|\bmeeting[_-]?id\b|\bpasscode\b/i.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  it('contains no credential-shaped assignment', () => {
    const pattern =
      /\b(api[_-]?key|secret|token|password|private[_-]?key|bearer)\b\s*[:=]\s*['"][^'"]{8,}/i;
    const offenders = sourceFiles.filter((file) => pattern.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('reads no non-public environment variable', () => {
    // Every configuration read must go through a PUBLIC_ prefixed name.
    const offenders = sourceFiles.filter((file) => {
      const matches = read(file).matchAll(/import\.meta\.env\.([A-Z0-9_]+)/g);
      return [...matches].some(([, name]) => name && !name.startsWith('PUBLIC_'));
    });
    expect(offenders).toEqual([]);
  });

  it('uses no dead or unsafe href stand-in', () => {
    const offenders = sourceFiles.filter((file) =>
      /href\s*=\s*["'](#|javascript:|)["']/i.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  /**
   * Browser storage is not banned outright - Tab 04 explicitly permits storing
   * a banner's dismissal preference - but it is confined to ONE module, and
   * that module may only ever write a flag.
   *
   * An allow-list fails by forgetting, so this is deliberately narrow: exactly
   * one path, asserted to still exist, plus assertions on what that file may
   * contain. A renamed or copied storage call lands outside the list and fails.
   */
  const STORAGE_ALLOW_LIST = ['src/lib/dismissal.ts'];

  it('confines browser storage to the single permitted module', () => {
    const offenders = sourceFiles
      .filter((file) => /\b(localStorage|sessionStorage|document\.cookie)\b/.test(read(file)))
      .map((file) => file.slice(file.indexOf('src/')))
      .filter((file) => !STORAGE_ALLOW_LIST.includes(file));
    expect(offenders).toEqual([]);
  });

  it('keeps the storage allow-list live rather than pointing at nothing', () => {
    // A stale entry would silently permit a file that no longer exists while
    // reading as though the exception were still reviewed.
    for (const allowed of STORAGE_ALLOW_LIST) {
      const match = sourceFiles.find((file) => file.endsWith(allowed));
      expect(match, `${allowed} is allow-listed but does not exist`).toBeDefined();
      expect(/\blocalStorage\b/.test(read(match!))).toBe(true);
    }
  });

  it('lets the permitted module write only a fixed flag', () => {
    const file = sourceFiles.find((f) => f.endsWith('src/lib/dismissal.ts'))!;
    const source = read(file);
    const writes = [...source.matchAll(/setItem\(([^)]*)\)/g)].map(([, args]) => args!.trim());
    expect(writes.length).toBeGreaterThan(0);
    for (const args of writes) {
      // Key is the fixed PREFIX plus a key from a closed union; value is '1'.
      expect(args, `unexpected setItem(${args})`).toMatch(/^PREFIX \+ key,\s*'1'$/);
    }
  });

  it('stores no identity, status or session value anywhere', () => {
    const forbidden =
      /\b(setItem|cookie)\b[^\n]*\b(viewer|applicant|member|status|token|session|email|auth)\b/i;
    const offenders = sourceFiles.filter((file) => forbidden.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('never derives viewer state from the URL, a cookie or storage', () => {
    // ViewerState exists for component tests. `applicant-pending` must never be
    // activatable by a visitor - that would be simulating private access.
    const offenders = sourceFiles.filter((file) => {
      const source = read(file);
      if (!source.includes('applicant-pending')) return false;
      return /URLSearchParams|location\.search|searchParams|document\.cookie|localStorage/.test(
        source,
      );
    });
    expect(offenders).toEqual([]);
  });

  it('holds no Zoom join URL shape anywhere in source', () => {
    const offenders = sourceFiles.filter((file) => /zoom\.us\/[js]\//i.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('declares no authentication, member or payment surface', () => {
    const offenders = sourceFiles.filter((file) =>
      /\b(signIn|signOut|logIn|logOut|authenticate|memberSession|checkout|redeem)\s*\(/.test(
        read(file),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
