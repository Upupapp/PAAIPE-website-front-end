// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Static output: the public information portal is prerendered HTML with no
  // server runtime. Tab 14 adds `site` (from PUBLIC_SITE_URL), the sitemap
  // integration and canonical URLs.
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    /*
     * `file`, not `directory`.
     *
     * `directory` emits `about/index.html`, and a static host then canonicalises
     * `/about` to `/about/` with a 301. Every internal link on this site uses
     * the no-slash form - the route registry, the canonicals, the sitemap and
     * every breadcrumb - so MEASURED on the live deploy, every single internal
     * navigation paid a 301 round trip before reaching a page.
     *
     * `file` emits `about.html`, which the host serves at `/about` with a 200.
     * The linked URL and the served URL are now the same string.
     */
    format: 'file',
  },
});
