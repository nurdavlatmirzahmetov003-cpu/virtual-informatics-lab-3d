/**
 * Sessions: a random 32-byte token in an httpOnly cookie; the database keeps
 * only its SHA-256, plus a per-session CSRF token the page must echo in the
 * `x-csrf-token` header of every state-changing request.
 */
import { createHash, randomBytes } from 'node:crypto';
import type { Db } from '../db';

export const SESSION_COOKIE = 'vil_session';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export interface SessionRow {
  token_hash: string;
  user_id: string;
  csrf: string;
  expires_at: number;
}

export function createSession(db: Db, userId: string, hours: number, userAgent = '', now = Date.now()) {
  const token = randomBytes(32).toString('base64url');
  const csrf = randomBytes(24).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, csrf, created_at, expires_at, last_seen_at, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    sha256(token),
    userId,
    csrf,
    now,
    now + hours * 3600_000,
    now,
    userAgent.slice(0, 200),
  );
  return { token, csrf, maxAge: hours * 3600 };
}

export function findSession(db: Db, token: string | undefined, now = Date.now()): SessionRow | null {
  if (!token) return null;
  const row = db.prepare('SELECT token_hash, user_id, csrf, expires_at FROM sessions WHERE token_hash = ?').get(sha256(token)) as SessionRow | undefined;
  if (!row) return null;
  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash);
    return null;
  }
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').run(now, row.token_hash);
  return row;
}

export function destroySession(db: Db, token: string | undefined) {
  if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
}

export function purgeExpired(db: Db, now = Date.now()) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
}
