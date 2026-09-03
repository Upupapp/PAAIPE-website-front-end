import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

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

function read(file: string): string {
  return readFileSync(file, 'utf8');
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

  it('stores nothing in browser storage', () => {
    // Tab 03 forbids local storage as a way to mimic access or success.
    const offenders = sourceFiles.filter((file) =>
      /\b(localStorage|sessionStorage|document\.cookie)\b/.test(read(file)),
    );
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
