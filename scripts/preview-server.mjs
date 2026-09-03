#!/usr/bin/env node
/**
 * Foreground static preview server for the built `dist/` output.
 *
 * Why this exists instead of `astro preview`: Astro 7's preview command
 * auto-daemonizes when stdout is not a TTY. The launcher then exits 0 while the
 * real server keeps running in the background, which Playwright reads as
 * "Process from config.webServer exited early". This server stays in the
 * foreground so the test runner can own its lifecycle.
 *
 * It also returns a REAL 404 status for an unknown path (serving 404.html as
 * the body), so the "no protected route is served" and "no soft 404" checks
 * test what they claim to.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const PORT = Number(process.env.PREVIEW_PORT ?? 4321);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

async function resolveFile(pathname) {
  // normalize() collapses `..`, and the prefix check rejects anything that
  // still escapes dist/ - a static preview must not serve the repository.
  const target = normalize(join(DIST, decodeURIComponent(pathname)));
  if (!target.startsWith(DIST)) return null;

  const candidates = extname(target) ? [target] : [join(target, 'index.html'), `${target}.html`];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const server = createServer((req, res) => {
  const pathname = new URL(req.url ?? '/', `http://localhost:${PORT}`).pathname;

  resolveFile(pathname)
    .then(async (file) => {
      if (file) {
        res.writeHead(200, {
          'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
        });
        createReadStream(file).pipe(res);
        return;
      }

      const notFound = join(DIST, '404.html');
      const body = await stat(notFound).then(
        () => createReadStream(notFound),
        () => null,
      );
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      if (body) body.pipe(res);
      else res.end('404');
    })
    .catch((error) => {
      console.error(error);
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('500');
    });
});

server.listen(PORT, () => {
  console.log(`Preview server (foreground) on http://localhost:${PORT} serving dist/`);
});
