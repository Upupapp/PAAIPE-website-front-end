/**
 * Normalise `Astro.url.pathname` to the form the route registry uses.
 *
 * WHY THIS EXISTS AS A SHARED FUNCTION
 * ------------------------------------
 * `build.format: 'file'` emits `about.html` and `index.html`, so during static
 * generation `Astro.url.pathname` is `/about.html` and `/index.html` — not
 * `/about` and `/`. Every comparison against the route registry silently
 * failed, and `aria-current="page"` disappeared from every page on the site:
 * no visual current-page indicator, and nothing for a screen reader to
 * announce.
 *
 * It was fixed in two components independently, and the two fixes did not
 * agree — the header handled `/index.html` and the navigation did not, so the
 * home page stayed broken after the "fix". Two copies of a normalisation rule
 * is one copy too many.
 */
export function currentPath(pathname: string): string {
  return (
    pathname
      // `/about.html` -> `/about`, `/index.html` -> `/index`
      .replace(/\.html$/, '')
      // `/index` -> `/`, and `/events/index` -> `/events/`
      .replace(/(^|\/)index$/, '$1')
      // trailing slashes, so `/about/` and `/about` compare equal
      .replace(/\/+$/, '') || '/'
  );
}
