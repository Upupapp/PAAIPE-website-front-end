/**
 * Path normalisation — the function that decides which nav link is current.
 *
 * Its absence cost `aria-current="page"` on every page of the site, and its
 * first fix was applied twice in two components that then disagreed, leaving
 * the home page broken after the "fix". Both failures are pinned here.
 */
import { describe, expect, it } from 'vitest';
import { currentPath } from '../lib/current-path';

describe('currentPath', () => {
  it('strips the .html the `file` build format adds', () => {
    // The regression: `/about.html` never equalled `/about`, so no comparison
    // against the route registry ever matched.
    expect(currentPath('/about.html')).toBe('/about');
    expect(currentPath('/responsible-ai.html')).toBe('/responsible-ai');
  });

  it('resolves the home page, in every form it arrives in', () => {
    // The second failure: the header handled `/index.html` and the navigation
    // did not, so the home page stayed unmarked after the first fix.
    for (const input of ['/', '/index', '/index.html', '//']) {
      expect(currentPath(input), input).toBe('/');
    }
  });

  it('treats a trailing slash as the same route', () => {
    expect(currentPath('/about/')).toBe('/about');
    expect(currentPath('/about')).toBe('/about');
  });

  it('resolves a nested index to its directory', () => {
    expect(currentPath('/events/index.html')).toBe('/events');
  });

  it('leaves a real nested route alone', () => {
    expect(currentPath('/events/paaipe-ai-exchange')).toBe('/events/paaipe-ai-exchange');
    expect(currentPath('/events/paaipe-ai-exchange.html')).toBe('/events/paaipe-ai-exchange');
  });

  it('does not mistake a route that merely ends in "index"', () => {
    // `/search-index` is not an index page.
    expect(currentPath('/search-index')).toBe('/search-index');
  });

  it('never returns an empty string', () => {
    for (const input of ['', '/', '/index.html', '///']) {
      expect(currentPath(input), input).not.toBe('');
    }
  });
});
