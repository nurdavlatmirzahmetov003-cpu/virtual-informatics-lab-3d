/**
 * The built site (`dist/`) served by the lab server itself (V2-12), so one
 * process behind one HTTPS proxy is the whole deployment.
 *
 *   - Only GET / HEAD outside /api; nothing above the root (no `..`, no
 *     encoded tricks, no null bytes), no dotfiles.
 *   - Vite's hashed bundles are cached for a year; models, textures and
 *     other public files revalidate (ETag); index.html never caches.
 *   - Unknown paths without a file extension get index.html (the SPA routes);
 *     a missing file with an extension is a plain 404.
 *   - Every response carries the security headers (securityHeaders).
 */
import { createReadStream, statSync, type Stats } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.ktx2': 'image/ktx2',
  '.hdr': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
};

/** Vite's content-hashed output: `assets/name-AbCd1234.js`. */
const HASHED = /^\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2?|svg|png|jpe?g|webp|wasm)$/;

export interface SecurityOptions {
  /** Behind HTTPS: HSTS and upgrade-insecure-requests. */
  secure: boolean;
  /** Allowed origins (https://lab.example.kz) — their wss:// twins may open sockets. */
  origins: string[];
}

/**
 * Headers for every response. The CSP fits this app: scripts only from this
 * origin plus WebAssembly (Draco / Basis / meshopt decoders) and blob
 * workers (the texture transcoder); inline style attributes (React), images
 * and fonts from here or data/blob URLs; requests and sockets only to this
 * origin; no frames, no plugins, never framed by another site.
 */
export function securityHeaders({ secure, origins }: SecurityOptions): Record<string, string> {
  const sockets = origins.filter((o) => o.startsWith('https://')).map((o) => `wss://${o.slice(8)}`);
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'wasm-unsafe-eval'",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' blob: data:${sockets.length ? ` ${sockets.join(' ')}` : ''}`,
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(secure ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  return {
    'content-security-policy': csp,
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
    // the microphone is for Bit's voice input, on this site only
    'permissions-policy': 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()',
    'cross-origin-opener-policy': 'same-origin',
    ...(secure ? { 'strict-transport-security': 'max-age=31536000; includeSubDomains' } : {}),
  };
}

/** A request handler for the `extra` list of createApp: true when it answered. */
export function staticSite(root: string, security: SecurityOptions) {
  const base = resolve(root);
  const headers = securityHeaders(security);
  const index = resolve(base, 'index.html');

  const fileAt = (pathname: string): { file: string; stat: Stats } | null => {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    if (decoded.includes('\0') || decoded.split(/[\\/]/).some((part) => part.startsWith('.'))) return null;
    const file = resolve(base, `.${decoded}`);
    if (file !== base && !file.startsWith(base + sep)) return null;
    try {
      const stat = statSync(file);
      return stat.isFile() ? { file, stat } : null;
    } catch {
      return null;
    }
  };

  return async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const method = req.method ?? 'GET';
    const { pathname } = new URL(req.url ?? '/', 'http://local');
    if (pathname.startsWith('/api/') || pathname === '/api') return false;
    if (method !== 'GET' && method !== 'HEAD') {
      res.writeHead(405, { ...headers, allow: 'GET, HEAD', 'content-type': 'text/plain; charset=utf-8' });
      res.end('Method Not Allowed');
      return true;
    }
    let found = pathname === '/' ? null : fileAt(pathname);
    // hidden names (/.env, /.git/…) are never a page either: a plain 404
    const hidden = (() => {
      try {
        return decodeURIComponent(pathname).split(/[\\/]/).some((part) => part.startsWith('.'));
      } catch {
        return true;
      }
    })();
    const spa = !found && !hidden && !extname(pathname);
    if (spa || pathname === '/') found = fileAt('/index.html');
    if (!found) {
      res.writeHead(404, { ...headers, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      res.end('Not Found');
      return true;
    }
    const { file, stat } = found;
    const etag = `W/"${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}"`;
    const cache = file === index ? 'no-cache' : HASHED.test(pathname) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600, must-revalidate';
    const common = { ...headers, etag, 'last-modified': stat.mtime.toUTCString(), 'cache-control': cache };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, common);
      res.end();
      return true;
    }
    res.writeHead(200, { ...common, 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'content-length': String(stat.size) });
    if (method === 'HEAD') {
      res.end();
      return true;
    }
    await new Promise<void>((done) => {
      const stream = createReadStream(file);
      stream.on('error', () => {
        res.destroy();
        done();
      });
      stream.on('end', done);
      stream.pipe(res);
    });
    return true;
  };
}
