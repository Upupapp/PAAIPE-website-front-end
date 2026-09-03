/**
 * Frontend security posture, Tab 14.
 *
 * These are source scans, which is not proof about the shipped output - the
 * built-bundle scan is `npm run verify:leak` and the network scan is in
 * `tests/e2e/seo.spec.ts`. What a source scan CAN prove is that a dangerous
 * construct is not written anywhere, which is the cheapest place to stop it.
 *
 * Every scan reads source with comments stripped. A scan that reads comments
 * flags the comment documenting the prohibition - measured three separate
 * times in this project before the stripper existed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '../lib/strip-comments';

const SRC = new URL('../', import.meta.url).pathname;
const SCANNED = new Set(['.ts', '.astro', '.js', '.mjs']);

function collect(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collect(full);
    return SCANNED.has(extname(entry)) ? [full] : [];
  });
}

const files = collect(SRC).filter((file) => !file.includes('/tests/'));

/** Exact namespace URIs that are identifiers, never fetched. Nothing else. */
const XML_NAMESPACES = new Set([
  'http://www.w3.org/2000/svg',
  'http://www.sitemaps.org/schemas/sitemap/0.9',
]);
const read = (file: string) => stripComments(readFileSync(file, 'utf8'));
const name = (file: string) => relative(SRC, file);

describe('security posture', () => {
  it('scans a non-empty set of files', () => {
    // A scan of nothing passes every assertion below.
    expect(files.length).toBeGreaterThan(60);
  });

  it('injects raw HTML in exactly one place, and only for JSON-LD', () => {
    /*
     * `set:html` bypasses Astro's escaping. There is one legitimate use: a
     * `<script type="application/ld+json">` body, which must not be
     * HTML-escaped or it stops being valid JSON. That one site escapes the
     * closing-tag sequence itself (see serializeJsonLd).
     *
     * Any other occurrence is an injection point, and the whole reason to
     * assert on the COUNT is that a second one would otherwise arrive without
     * anybody deciding it should.
     */
    const users = files.filter((file) => read(file).includes('set:html'));
    expect(users.map(name)).toEqual(['components/BaseLayout.astro']);

    const source = read(users[0]!);
    expect(source).toContain('serializeJsonLd');
    expect(source).toContain('application/ld+json');
  });

  it('never assigns HTML through the DOM either', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const source = read(file);
      for (const pattern of [
        /\binnerHTML\s*=/,
        /\bouterHTML\s*=/,
        /\binsertAdjacentHTML\s*\(/,
        /\bdocument\.write\s*\(/,
        /\beval\s*\(/,
        /\bnew\s+Function\s*\(/,
      ]) {
        if (pattern.test(source)) offenders.push(`${name(file)}: ${pattern}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('opens every external link with noopener and noreferrer, together', () => {
    /*
     * `target="_blank"` without `rel="noopener"` hands the opened page a live
     * `window.opener` reference to this one.
     *
     * This is asserted at SOURCE level on purpose. No destination is configured
     * yet (owner item B-4), so a production build contains no external link at
     * all - a browser test would pass by finding nothing to check. The
     * component's contract is what can be verified today, so that is what is
     * verified, and the fact that it is currently unexercised is stated rather
     * than papered over.
     */
    const button = read(join(SRC, 'components/ui/Button.astro'));
    expect(button).toContain("rel={external ? 'noopener noreferrer' : undefined}");
    expect(button).toContain("target={external ? '_blank' : undefined}");

    // No other file may open a new window on its own terms.
    const others = files.filter(
      (file) => name(file) !== 'components/ui/Button.astro' && /target=["']_blank/.test(read(file)),
    );
    expect(others.map(name)).toEqual([]);
    const opens = files.filter((file) => /window\.open\s*\(/.test(read(file)));
    expect(opens.map(name)).toEqual([]);
  });

  it('references no insecure http:// origin, so nothing can become mixed content', () => {
    const offenders: string[] = [];
    for (const file of files) {
      /*
       * XML NAMESPACES are exempt, and only these exact ones.
       *
       * A namespace URI is an identifier, not a URL a browser fetches, so it
       * cannot become mixed content - and the sitemap one is mandated
       * verbatim by the sitemaps protocol, `http://` and all. The exemption is
       * a list of exact strings rather than a `startsWith` on the host,
       * because a host prefix would also exempt a real `http://www.w3.org/...`
       * script or image reference.
       */
      const found = [...read(file).matchAll(/http:\/\/[^\s"'`)]+/g)]
        .map((match) => match[0])
        .filter((url) => !XML_NAMESPACES.has(url));
      if (found.length > 0) offenders.push(`${name(file)}: ${found.join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('rejects an http:// destination at configuration time, not at render time', () => {
    // The complement of the scan above: a value supplied by ENVIRONMENT cannot
    // be caught by scanning source, so the config parser has to refuse it.
    // parseHttpUrl returns `insecure-url`, which resolvePublicConfig records as
    // an issue and leaves the destination ABSENT - so the handoff renders its
    // honest unavailable state rather than an http:// link.
    expect(files.some((file) => name(file) === 'config/public-config.ts')).toBe(true);
    const config = read(join(SRC, 'config/public-config.ts'));
    expect(config).toContain("if (parsed.protocol === 'http:') return { reason: 'insecure-url' };");
  });
});
