/** Small HTTP helpers for the lab server (no framework). */
import type { IncomingMessage, ServerResponse } from 'node:http';

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly extra: Record<string, unknown>;

  constructor(status: number, code: string, extra: Record<string, unknown> = {}) {
    super(code);
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | string[]> = {}) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

/** The raw request body (uploads), at most `limit` bytes. */
export function readRaw(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, 'too-large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return (await readRaw(req, limit)).toString('utf8');
}

export async function readJson<T = Record<string, unknown>>(req: IncomingMessage, limit = 64 * 1024): Promise<T> {
  const text = await readBody(req, limit);
  try {
    const v = JSON.parse(text || '{}');
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('not an object');
    return v as T;
  } catch {
    throw new HttpError(400, 'bad-json');
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function cookie(name: string, value: string, opts: { maxAge: number; secure: boolean }) {
  return [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${opts.maxAge}`, ...(opts.secure ? ['Secure'] : [])].join('; ');
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/** The client's IP; X-Forwarded-For only from a trusted proxy (see ServerConfig.trustProxy). */
export function clientIp(req: IncomingMessage, trust: 'loopback' | 'none' | 'all' = 'none') {
  const direct = req.socket.remoteAddress ?? 'unknown';
  const header = req.headers['x-forwarded-for'];
  const forwarded = (Array.isArray(header) ? header[0] : header)?.split(',')[0]?.trim();
  const trusted = trust === 'all' || (trust === 'loopback' && LOOPBACK.has(direct));
  const ip = trusted && forwarded ? forwarded : direct;
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}
