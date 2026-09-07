/**
 * Tab 07 privacy and security scans: an email address may exist only in
 * transient request memory.
 *
 * These scan the SOURCE for the mechanisms that could persist it, and the BUILD
 * for the value itself. Both halves are needed: a source scan cannot see a
 * value inlined at build time, and a build scan cannot see a `localStorage`
 * call on a path that has no data to write yet.
 */
import { readFileSync, globSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALLOWED_ANALYTICS_PROPERTIES } from '../config/event-analytics';

const REGISTRATION_SOURCE = globSync('src/lib/registration/**/*.ts');

describe('the registration module persists nothing', () => {
  it('has source to scan', () => {
    expect(REGISTRATION_SOURCE.length, 'no registration source found').toBeGreaterThan(0);
  });

  it.each([
    ['localStorage', /localStorage/],
    ['sessionStorage', /sessionStorage/],
    ['IndexedDB', /indexedDB/i],
    ['document.cookie', /document\.cookie/],
    ['a service worker', /serviceWorker|navigator\.serviceWorker/],
    ['a cache API', /caches\.open|CacheStorage/],
    ['console output', /console\.(log|info|warn|error|debug)/],
  ])('never touches %s', (_label, pattern) => {
    const offenders = REGISTRATION_SOURCE.filter((file) =>
      pattern.test(readFileSync(file, 'utf8')),
    );
    expect(offenders, `registration source uses ${_label}`).toEqual([]);
  });

  it('proves the scan can see a match when one exists', () => {
    // The paired positive: an absence over an unreadable set looks identical.
    expect(/localStorage/.test('localStorage.setItem("x", email)')).toBe(true);
  });

  it('never builds a URL or form action from the request', () => {
    /*
     * The email must never reach a query string, a hash, or a form action. The
     * gateway posts a JSON body to a configured endpoint and constructs no URL
     * from the request at all, which is stronger than sanitising one.
     */
    for (const file of REGISTRATION_SOURCE) {
      const text = readFileSync(file, 'utf8');
      expect(text, `${file} builds a query string`).not.toMatch(
        /URLSearchParams|searchParams\.set/,
      );
      expect(text, `${file} interpolates into a URL`).not.toMatch(/\?\$\{|&\$\{/);
    }
  });
});

describe('no registration field can reach telemetry', () => {
  it('keeps every forbidden name off the allowlist', () => {
    const allowed = new Set<string>(ALLOWED_ANALYTICS_PROPERTIES);
    for (const forbidden of [
      'email',
      'email_domain',
      'request_body',
      'membership_result',
      'request_id',
      'token',
      'zoom_url',
      'server_message',
    ]) {
      expect(allowed.has(forbidden), `${forbidden} is on the allowlist`).toBe(false);
    }
  });

  it('permits only bucketed timing, never a raw duration', () => {
    const allowed = ALLOWED_ANALYTICS_PROPERTIES as readonly string[];
    expect(allowed).toContain('request_duration_bucket');
    expect(allowed).not.toContain('request_duration');
    expect(allowed).not.toContain('response_time_ms');
  });
});

/*
 * THE BUILD SCAN THAT WAS HERE HAS MOVED, and the reason is worth recording.
 *
 * It asserted that no participant address reaches `dist/`. Two things were
 * wrong with it living in vitest. First, `npm run test` runs at step 4 of the
 * check chain and the build happens later, so in a CLEAN checkout there is no
 * `dist/` to scan - it passed for me only because my working tree had a stale
 * one, and failed the moment it ran in a detached worktree. Second, it
 * DUPLICATED the `participant-email` category of
 * `scripts/write-integrity-scan.mjs`, which already scans the build after it
 * exists, at step 15.
 *
 * Two guards for one property, with the weaker one breaking the chain, is worse
 * than one guard. The build-output assertions belong with the other build-output
 * assertions; what stays here is what can be checked from source alone.
 */
