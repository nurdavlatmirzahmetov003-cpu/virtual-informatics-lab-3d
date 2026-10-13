/**
 * Admin data (V2-10): users (search, role, block, school, reset links),
 * schools, every class, the audit log, login attempts and IP blocks.
 * Guards: an admin cannot demote or block themselves, and the last active
 * admin always stays. Blocking a user or giving a reset link never shows
 * or stores a password — the link carries a one-time token, stored hashed.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Db } from './db';
import { HttpError } from './http';
import { hashPassword, passwordProblem } from './auth/password';
import { ROLES, userById, type Role, type UserRow } from './users';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

// ── users ──────────────────────────────────────────────────────────────────

const ROLE_ORDER: Record<Role, number> = { admin: 0, teacher: 1, student: 2 };
/** Kazakh alphabet order (Ә after А), which SQLite's byte order breaks. */
const NAME_ORDER = new Intl.Collator(['kk', 'ru', 'en'], { sensitivity: 'base' });

export function searchUsers(db: Db, q: URLSearchParams) {
  const where: string[] = [];
  const args: Array<string | number> = [];
  const text = (q.get('q') ?? '').trim().toLowerCase().slice(0, 60);
  if (text) {
    where.push('(lower(u.login) LIKE ? OR lower(u.display_name) LIKE ?)');
    args.push(`%${text}%`, `%${text}%`);
  }
  const role = q.get('role');
  if (role && (ROLES as readonly string[]).includes(role)) {
    where.push('u.role = ?');
    args.push(role);
  }
  const status = q.get('status');
  if (status === 'blocked') where.push('u.disabled = 1');
  if (status === 'active') where.push('u.disabled = 0');
  const school = q.get('school');
  if (school === 'none') where.push('u.school_id IS NULL');
  else if (school) {
    where.push('u.school_id = ?');
    args.push(school);
  }
  const rows = db
    .prepare(
      `SELECT u.*, s.name AS school_name,
         (SELECT COUNT(*) FROM class_members m WHERE m.user_id = u.id) AS member_of,
         (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = u.id) AS teaches
       FROM users u LEFT JOIN schools s ON s.id = u.school_id
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       LIMIT 300`,
    )
    .all(...args) as unknown as Array<UserRow & { school_name: string | null; member_of: number; teaches: number }>;
  rows.sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || NAME_ORDER.compare(a.display_name, b.display_name));
  const total = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  return {
    total,
    users: rows.map((u) => ({
      id: u.id,
      login: u.login,
      displayName: u.display_name,
      role: u.role,
      disabled: !!u.disabled,
      schoolId: u.school_id,
      schoolName: u.school_name,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
      classes: u.role === 'student' ? u.member_of : u.teaches,
    })),
  };
}

const activeAdmins = (db: Db) => (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND disabled = 0").get() as { n: number }).n;

/** Changes name, role, block state or school; returns what changed (for the audit log). */
export function updateUser(db: Db, actor: UserRow, id: string, patch: { displayName?: unknown; role?: unknown; disabled?: unknown; schoolId?: unknown }): string[] {
  const u = userById(db, id);
  if (!u) throw new HttpError(404, 'notFound');
  const changes: string[] = [];
  let role: Role = u.role;
  let disabled = !!u.disabled;
  if (patch.role !== undefined) {
    if (!(ROLES as readonly unknown[]).includes(patch.role)) throw new HttpError(400, 'badRole');
    role = patch.role as Role;
  }
  if (patch.disabled !== undefined) {
    if (typeof patch.disabled !== 'boolean') throw new HttpError(400, 'badRequest');
    disabled = patch.disabled;
  }
  if (u.id === actor.id && (role !== u.role || disabled)) throw new HttpError(400, 'self');
  const wasActiveAdmin = u.role === 'admin' && !u.disabled;
  if (wasActiveAdmin && (role !== 'admin' || disabled) && activeAdmins(db) <= 1) throw new HttpError(400, 'lastAdmin');

  if (patch.displayName !== undefined) {
    const name = typeof patch.displayName === 'string' ? patch.displayName.trim().slice(0, 80) : '';
    if (!name) throw new HttpError(400, 'badName');
    if (name !== u.display_name) {
      db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(name, u.id);
      changes.push('name');
    }
  }
  if (role !== u.role) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, u.id);
    changes.push(`role:${u.role}->${role}`);
  }
  if (disabled !== !!u.disabled) {
    db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(disabled ? 1 : 0, u.id);
    changes.push(disabled ? 'blocked' : 'unblocked');
  }
  if (patch.schoolId !== undefined) {
    const school = patch.schoolId === null || patch.schoolId === '' ? null : String(patch.schoolId);
    if (school && !db.prepare('SELECT 1 FROM schools WHERE id = ?').get(school)) throw new HttpError(400, 'badSchool');
    if (school !== u.school_id) {
      db.prepare('UPDATE users SET school_id = ? WHERE id = ?').run(school, u.id);
      changes.push('school');
    }
  }
  // a blocked user or a new role starts from a fresh sign-in
  if (changes.some((c) => c === 'blocked' || c.startsWith('role:'))) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
  return changes;
}

export const RESET_HOURS = 24;

/** A one-time password reset link token (shown once; only its hash is kept). Older unused links stop working. */
export function createResetToken(db: Db, actor: UserRow, id: string, now = Date.now()) {
  const u = userById(db, id);
  if (!u) throw new HttpError(404, 'notFound');
  const token = randomBytes(32).toString('base64url');
  db.prepare('DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL').run(u.id);
  db.prepare('INSERT INTO password_resets (token_hash, user_id, created_by, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, ?, NULL)').run(sha256(token), u.id, actor.id, now, now + RESET_HOURS * 3600_000);
  return { token, expiresAt: now + RESET_HOURS * 3600_000, login: u.login };
}

function resetRow(db: Db, token: unknown, now: number) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null;
  const row = db.prepare('SELECT * FROM password_resets WHERE token_hash = ?').get(sha256(token)) as { user_id: string; expires_at: number; used_at: number | null } | undefined;
  if (!row || row.used_at != null || row.expires_at < now) return null;
  const u = userById(db, row.user_id);
  return u && !u.disabled ? { row, user: u } : null;
}

/** Who the link is for (to greet them), or null. */
export function checkResetToken(db: Db, token: unknown, now = Date.now()) {
  const r = resetRow(db, token, now);
  return r && { login: r.user.login, displayName: r.user.display_name };
}

/** Sets the new password, burns the token and ends every session of the user. */
export async function redeemResetToken(db: Db, token: unknown, password: unknown, now = Date.now()): Promise<UserRow> {
  const r = resetRow(db, token, now);
  if (!r) throw new HttpError(400, 'badToken');
  const pw = typeof password === 'string' ? password : '';
  const problem = passwordProblem(pw);
  if (problem) throw new HttpError(400, `password.${problem}`);
  const hash = await hashPassword(pw);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, r.user.id);
  db.prepare('UPDATE password_resets SET used_at = ? WHERE token_hash = ?').run(now, sha256(token as string));
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(r.user.id);
  return r.user;
}

// ── schools and classes ────────────────────────────────────────────────────

export function listSchools(db: Db) {
  return (
    db
      .prepare(
        `SELECT s.id, s.name, s.created_at,
           (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id) AS users,
           (SELECT COUNT(*) FROM classes c WHERE c.school_id = s.id) AS classes
         FROM schools s ORDER BY s.name`,
      )
      .all() as Array<{ id: string; name: string; created_at: number; users: number; classes: number }>
  ).map((s) => ({ id: s.id, name: s.name, createdAt: s.created_at, users: s.users, classes: s.classes }));
}

const schoolName = (v: unknown) => {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s || s.length > 120) throw new HttpError(400, 'badName');
  return s;
};

export function createSchool(db: Db, name: unknown, now = Date.now()) {
  const id = randomUUID();
  db.prepare('INSERT INTO schools (id, name, created_at) VALUES (?, ?, ?)').run(id, schoolName(name), now);
  return id;
}

export function renameSchool(db: Db, id: string, name: unknown) {
  if (!db.prepare('UPDATE schools SET name = ? WHERE id = ?').run(schoolName(name), id).changes) throw new HttpError(404, 'notFound');
}

/** Users and classes of the school stay, without a school. */
export function deleteSchool(db: Db, id: string) {
  if (!db.prepare('DELETE FROM schools WHERE id = ?').run(id).changes) throw new HttpError(404, 'notFound');
}

export function allClasses(db: Db) {
  return (
    db
      .prepare(
        `SELECT c.id, c.name, c.join_code, c.created_at, c.school_id, s.name AS school_name, c.teacher_id, u.display_name AS teacher_name,
           (SELECT COUNT(*) FROM class_members m WHERE m.class_id = c.id) AS students,
           (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id) AS assignments
         FROM classes c JOIN users u ON u.id = c.teacher_id LEFT JOIN schools s ON s.id = c.school_id
         ORDER BY s.name, c.name`,
      )
      .all() as Array<Record<string, string | number | null>>
  ).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    joinCode: c.join_code as string,
    createdAt: c.created_at as number,
    schoolId: c.school_id as string | null,
    schoolName: c.school_name as string | null,
    teacherId: c.teacher_id as string,
    teacherName: c.teacher_name as string,
    students: c.students as number,
    assignments: c.assignments as number,
  }));
}

/** Moves a class to another teacher and/or school. */
export function updateClassAdmin(db: Db, id: string, patch: { teacherId?: unknown; schoolId?: unknown }): string[] {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(id) as { teacher_id: string; school_id: string | null } | undefined;
  if (!cls) throw new HttpError(404, 'notFound');
  const changes: string[] = [];
  if (patch.teacherId !== undefined && patch.teacherId !== cls.teacher_id) {
    const t = userById(db, String(patch.teacherId));
    if (!t || (t.role !== 'teacher' && t.role !== 'admin')) throw new HttpError(400, 'badTeacher');
    db.prepare('UPDATE classes SET teacher_id = ? WHERE id = ?').run(t.id, id);
    changes.push('teacher');
  }
  if (patch.schoolId !== undefined) {
    const school = patch.schoolId === null || patch.schoolId === '' ? null : String(patch.schoolId);
    if (school && !db.prepare('SELECT 1 FROM schools WHERE id = ?').get(school)) throw new HttpError(400, 'badSchool');
    if (school !== cls.school_id) {
      db.prepare('UPDATE classes SET school_id = ? WHERE id = ?').run(school, id);
      changes.push('school');
    }
  }
  return changes;
}

// ── audit and security ─────────────────────────────────────────────────────

export function auditLog(db: Db, q: URLSearchParams) {
  const where: string[] = [];
  const args: Array<string | number> = [];
  const action = (q.get('action') ?? '').trim();
  if (action) {
    where.push('a.action LIKE ?');
    args.push(`${action.replace(/[%_]/g, '')}%`);
  }
  const text = (q.get('q') ?? '').trim().toLowerCase().slice(0, 60);
  if (text) {
    where.push('(lower(COALESCE(u.login, \'\')) LIKE ? OR lower(COALESCE(a.target, \'\')) LIKE ? OR COALESCE(a.ip, \'\') LIKE ? OR lower(a.detail) LIKE ?)');
    args.push(`%${text}%`, `%${text}%`, `%${text}%`, `%${text}%`);
  }
  const before = Number(q.get('before'));
  if (Number.isFinite(before) && before > 0) {
    where.push('a.at < ?');
    args.push(before);
  }
  const limit = 100;
  const rows = db
    .prepare(
      `SELECT a.*, u.login AS actor_login, t.login AS target_login FROM audit_log a
       LEFT JOIN users u ON u.id = a.actor_id LEFT JOIN users t ON t.id = a.target
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.at DESC LIMIT ${limit + 1}`,
    )
    .all(...args) as Array<{ id: string; at: number; action: string; actor_login: string | null; target: string | null; target_login: string | null; ip: string | null; detail: string }>;
  return {
    more: rows.length > limit,
    entries: rows.slice(0, limit).map((r) => ({ id: r.id, at: r.at, action: r.action, actor: r.actor_login, target: r.target_login ?? r.target, ip: r.ip, detail: r.detail })),
  };
}

export function listIpBlocks(db: Db, now = Date.now()) {
  db.prepare('DELETE FROM ip_blocks WHERE expires_at IS NOT NULL AND expires_at < ?').run(now);
  return (db.prepare('SELECT b.*, u.login AS by_login FROM ip_blocks b LEFT JOIN users u ON u.id = b.created_by ORDER BY b.created_at DESC').all() as Array<{ ip: string; reason: string; by_login: string | null; created_at: number; expires_at: number | null }>).map(
    (b) => ({ ip: b.ip, reason: b.reason, by: b.by_login, createdAt: b.created_at, expiresAt: b.expires_at }),
  );
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost']);
export const isLoopback = (ip: string) => LOOPBACK.has(ip);

/** Blocks an IP (all requests answer 403). Never the admin's own address or this computer. */
export function blockIp(db: Db, actor: UserRow, actorIp: string, input: { ip?: unknown; reason?: unknown; hours?: unknown }, now = Date.now()) {
  const ip = typeof input.ip === 'string' ? input.ip.trim().toLowerCase() : '';
  if (!/^[0-9a-f.:]{3,45}$/.test(ip)) throw new HttpError(400, 'badIp');
  if (ip === actorIp || isLoopback(ip)) throw new HttpError(400, 'ownIp');
  const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 200) : '';
  const hours = input.hours == null || input.hours === '' ? null : Number(input.hours);
  if (hours !== null && !(Number.isFinite(hours) && hours > 0 && hours <= 24 * 365)) throw new HttpError(400, 'badHours');
  db.prepare(
    'INSERT INTO ip_blocks (ip, reason, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (ip) DO UPDATE SET reason = excluded.reason, created_by = excluded.created_by, created_at = excluded.created_at, expires_at = excluded.expires_at',
  ).run(ip, reason, actor.id, now, hours === null ? null : now + hours * 3600_000);
  return ip;
}

export function unblockIp(db: Db, ip: string) {
  if (!db.prepare('DELETE FROM ip_blocks WHERE ip = ?').run(ip).changes) throw new HttpError(404, 'notFound');
}

/** Login activity of the last 24 hours, from the audit log. */
export function loginActivity(db: Db, now = Date.now()) {
  const since = now - 24 * 3600_000;
  const byIp = db
    .prepare(
      `SELECT ip, COUNT(*) AS fails, MAX(at) AS last, COUNT(DISTINCT target) AS logins FROM audit_log
       WHERE action IN ('login.fail', 'login.blocked') AND at >= ? GROUP BY ip ORDER BY fails DESC LIMIT 50`,
    )
    .all(since) as Array<{ ip: string | null; fails: number; last: number; logins: number }>;
  const recent = db
    .prepare(
      `SELECT a.at, a.action, a.ip, COALESCE(u.login, a.target) AS login FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
       WHERE a.action IN ('login.ok', 'login.fail', 'login.blocked', 'password.reset') ORDER BY a.at DESC LIMIT 50`,
    )
    .all() as Array<{ at: number; action: string; ip: string | null; login: string | null }>;
  const counts = db
    .prepare("SELECT action, COUNT(*) AS n FROM audit_log WHERE action IN ('login.ok', 'login.fail', 'login.blocked') AND at >= ? GROUP BY action")
    .all(since) as Array<{ action: string; n: number }>;
  return {
    last24h: Object.fromEntries(counts.map((c) => [c.action, c.n])),
    failsByIp: byIp.map((r) => ({ ip: r.ip ?? '', fails: r.fails, last: r.last, logins: r.logins })),
    recent,
  };
}

