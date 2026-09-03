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
    format: 'directory',
  },
});
