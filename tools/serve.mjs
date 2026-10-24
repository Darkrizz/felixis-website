// Static server for dist/ with brotli/gzip, cache headers and a real 404 status.
// Usage: node tools/serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PORT = Number(process.argv[2] || process.env.PORT || 4411);
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};
const COMPRESS = new Set(['.html', '.js', '.css', '.svg', '.json', '.webmanifest', '.txt', '.xml']);

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0]);
  let file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) return null;
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) && !path.extname(file)) file = file + '.html';
  return fs.existsSync(file) ? file : null;
}

http
  .createServer((req, res) => {
    let file = resolve(req.url || '/');
    let status = 200;
    if (!file) {
      file = path.join(ROOT, '404.html');
      status = 404;
    }
    const ext = path.extname(file);
    let body = fs.readFileSync(file);
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': req.url?.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    };
    const ae = String(req.headers['accept-encoding'] || '');
    if (COMPRESS.has(ext)) {
      headers.Vary = 'Accept-Encoding';
      if (ae.includes('br')) {
        body = zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
        headers['Content-Encoding'] = 'br';
      } else if (ae.includes('gzip')) {
        body = zlib.gzipSync(body, { level: 9 });
        headers['Content-Encoding'] = 'gzip';
      }
    }
    headers['Content-Length'] = body.length;
    res.writeHead(status, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  })
  .listen(PORT, '127.0.0.1', () => console.log(`serving dist on http://127.0.0.1:${PORT}`));
