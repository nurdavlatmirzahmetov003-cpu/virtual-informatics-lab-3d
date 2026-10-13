/** Append-only audit log of security-relevant actions (never passwords or tokens). */
import { randomUUID } from 'node:crypto';
import type { Db } from './db';

export function audit(db: Db, action: string, opts: { actor?: string | null; target?: string | null; ip?: string | null; detail?: string } = {}, now = Date.now()) {
  db.prepare('INSERT INTO audit_log (id, at, actor_id, action, target, ip, detail) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    randomUUID(),
    now,
    opts.actor ?? null,
    action,
    opts.target ?? null,
    opts.ip ?? null,
    (opts.detail ?? '').slice(0, 500),
  );
}
