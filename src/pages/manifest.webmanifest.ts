/**
 * The web app manifest.
 *
 * This is an information website, not an installable app: `display` stays
 * `browser` so no attempt is made to present it as one. The manifest exists for
 * the icon and colour metadata that Android and Chrome read from it.
 *
 * `start_url` is relative on purpose. It is the one place a relative URL is
 * correct - the spec resolves it against the manifest's own location - so this
 * file does not depend on PUBLIC_SITE_URL (owner item B-7).
 */
import type { APIRoute } from 'astro';
import { ACRONYM, ORGANIZATION_NAME } from '../config/site';

export const prerender = true;

const MANIFEST = {
  name: ORGANIZATION_NAME,
  short_name: ACRONYM,
  start_url: '/',
  scope: '/',
  display: 'browser',
  background_color: '#FFFFFF',
  theme_color: '#0A1F44',
  lang: 'en-PH',
  icons: [
    { src: '/brand/renditions/paaipe-square-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/brand/renditions/paaipe-square-512.png', sizes: '512x512', type: 'image/png' },
  ],
} as const;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(MANIFEST, null, 2), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  });
