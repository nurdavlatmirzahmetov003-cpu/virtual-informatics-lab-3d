/**
 * Admin panel routes (V2-10). Every route requires the admin role; every
 * state-changing one the CSRF token; every change is written to audit_log.
 *
 *   GET    /api/admin/users?q=&role=&status=&school=     search
 *   POST   /api/admin/users                              { login, displayName, role, password }
 *   PATCH  /api/admin/users/:id                          { displayName?, role?, disabled?, schoolId? }
 *   POST   /api/admin/users/:id/reset-link               → { token, expiresAt } (shown once)
 *   GET    /api/admin/schools · POST { name } · PATCH /:id { name } · DELETE /:id
 *   GET    /api/admin/classes · PATCH /:id { teacherId?, schoolId? }
 *   GET    /api/admin/audit?action=&q=&before=
 *   GET    /api/admin/security                           login activity, limiter blocks, IP blocks
 *   POST   /api/admin/security/clear                     { key } — lift a login-limiter block
 *   POST   /api/admin/ip-blocks { ip, reason, hours? } · DELETE /api/admin/ip-blocks/:ip
 *   GET    /api/admin/settings · PUT { …patch }
 *   GET    /api/admin/content · PUT { key, lang, value | null }
 *   GET    /api/admin/backups · POST (snapshot now) · POST /upload (raw .db)
 *   GET    /api/admin/backups/:name/download · POST /:name/restore · DELETE /:name
 *   GET    /api/admin/health · POST /api/admin/health/integrity
 */
import { createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Db } from './db';
import { migrate } from './db';
import type { ServerConfig } from './env';
import { HttpError, json, readJson, readRaw } from './http';
import { audit } from './audit';
import type { LoginLimiter } from './auth/rateLimit';
import { createUser, publicUser, type Role, type UserRow } from './users';
import * as A from './admin';
import * as B from './backup';
import { allOverrides, CONTENT_SECTIONS, setOverride } from './content';
import { setSettings, type SiteSettings } from './settings';
import { integrityCheck, systemHealth } from './health';
import { createRouter, type RouteCtx } from './router';

export interface AdminDeps {
  db: Db;
  config: ServerConfig;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
  limiter: LoginLimiter;
  settings: () => SiteSettings;
  aiStatus: () => { provider: string | null; model: string | null };
  startedAt: number;
  /** Called after IP blocks change or the database is restored (refresh caches). */
  refresh: () => void;
  /** Header that ends the caller's session cookie (after a restore). */
  clearCookie: string;
}

export function adminRoutes(d: AdminDeps) {
  const { db, config, now } = d;
  const router = createRouter();
  const on = router.on;
  const admin = (ctx: RouteCtx) => d.requireUser(ctx, 'admin');
  const write = (ctx: RouteCtx) => {
    const u = admin(ctx);
    d.checkCsrf(ctx);
    return u;
  };
  const log = (ctx: RouteCtx, actor: UserRow, action: string, target: string | null = null, detail = '') => audit(db, action, { actor: actor.id, target, ip: ctx.ip, detail }, now());

  // ── users ──
  on('GET', '/api/admin/users', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, A.searchUsers(db, ctx.query));
  });
  on('POST', '/api/admin/users', async (ctx) => {
    const u = write(ctx);
    const b = await readJson<{ login?: unknown; displayName?: unknown; role?: unknown; password?: unknown }>(ctx.req, 4096);
    const role = b.role === 'teacher' || b.role === 'student' || b.role === 'admin' ? b.role : null;
    if (!role) throw new HttpError(400, 'badRole');
    const user = await createUser(db, { login: String(b.login ?? ''), displayName: String(b.displayName ?? ''), role, password: String(b.password ?? '') }, now());
    log(ctx, u, 'user.create', user.id, role);
    json(ctx.res, 201, { user: publicUser(user) });
  });
  on('PATCH', '/api/admin/users/:id', async (ctx, p) => {
    const u = write(ctx);
    const changes = A.updateUser(db, u, p.id, await readJson(ctx.req, 4096));
    if (changes.length) log(ctx, u, 'user.update', p.id, changes.join(' '));
    json(ctx.res, 200, { changes });
  });
  on('POST', '/api/admin/users/:id/reset-link', (ctx, p) => {
    const u = write(ctx);
    const r = A.createResetToken(db, u, p.id, now());
    log(ctx, u, 'user.resetLink', p.id);
    json(ctx.res, 201, r);
  });

  // ── schools and classes ──
  on('GET', '/api/admin/schools', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, { schools: A.listSchools(db) });
  });
  on('POST', '/api/admin/schools', async (ctx) => {
    const u = write(ctx);
    const id = A.createSchool(db, (await readJson<{ name?: unknown }>(ctx.req, 4096)).name, now());
    log(ctx, u, 'school.create', id);
    json(ctx.res, 201, { id });
  });
  on('PATCH', '/api/admin/schools/:id', async (ctx, p) => {
    const u = write(ctx);
    A.renameSchool(db, p.id, (await readJson<{ name?: unknown }>(ctx.req, 4096)).name);
    log(ctx, u, 'school.rename', p.id);
    json(ctx.res, 200, { ok: true });
  });
  on('DELETE', '/api/admin/schools/:id', (ctx, p) => {
    const u = write(ctx);
    A.deleteSchool(db, p.id);
    log(ctx, u, 'school.delete', p.id);
    json(ctx.res, 200, { ok: true });
  });
  on('GET', '/api/admin/classes', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, { classes: A.allClasses(db) });
  });
  on('PATCH', '/api/admin/classes/:id', async (ctx, p) => {
    const u = write(ctx);
    const changes = A.updateClassAdmin(db, p.id, await readJson(ctx.req, 4096));
    if (changes.length) log(ctx, u, 'class.update', p.id, changes.join(' '));
    json(ctx.res, 200, { changes });
  });

  // ── audit and security ──
  on('GET', '/api/admin/audit', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, A.auditLog(db, ctx.query));
  });
  on('GET', '/api/admin/security', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, { yourIp: ctx.ip, activity: A.loginActivity(db, now()), limiter: d.limiter.blocked(now()), ipBlocks: A.listIpBlocks(db, now()) });
  });
  on('POST', '/api/admin/security/clear', async (ctx) => {
    const u = write(ctx);
    const key = String((await readJson<{ key?: unknown }>(ctx.req, 1024)).key ?? '');
    if (!d.limiter.clear(key)) throw new HttpError(404, 'notFound');
    log(ctx, u, 'security.unblockLogin', null, key);
    json(ctx.res, 200, { ok: true });
  });
  on('POST', '/api/admin/ip-blocks', async (ctx) => {
    const u = write(ctx);
    const ip = A.blockIp(db, u, ctx.ip, await readJson(ctx.req, 2048), now());
    d.refresh();
    log(ctx, u, 'security.blockIp', null, ip);
    json(ctx.res, 201, { ip });
  });
  on('DELETE', '/api/admin/ip-blocks/:ip', (ctx, p) => {
    const u = write(ctx);
    A.unblockIp(db, p.ip);
    d.refresh();
    log(ctx, u, 'security.unblockIp', null, p.ip);
    json(ctx.res, 200, { ok: true });
  });

  // ── settings and content ──
  on('GET', '/api/admin/settings', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, { settings: d.settings() });
  });
  on('PUT', '/api/admin/settings', async (ctx) => {
    const u = write(ctx);
    const keys = setSettings(db, await readJson(ctx.req, 8 * 1024), u.id, now());
    log(ctx, u, 'settings.update', null, keys.join(' '));
    json(ctx.res, 200, { settings: d.settings() });
  });
  on('GET', '/api/admin/content', (ctx) => {
    admin(ctx);
    const rows = db
      .prepare('SELECT o.key, o.lang, o.value, o.updated_at, u.login AS by_login FROM content_overrides o LEFT JOIN users u ON u.id = o.updated_by ORDER BY o.updated_at DESC')
      .all() as Array<{ key: string; lang: string; value: string; updated_at: number; by_login: string | null }>;
    json(ctx.res, 200, { sections: CONTENT_SECTIONS, overrides: rows.map((r) => ({ key: r.key, lang: r.lang, value: r.value, updatedAt: r.updated_at, by: r.by_login })) });
  });
  on('PUT', '/api/admin/content', async (ctx) => {
    const u = write(ctx);
    const b = await readJson<{ key?: unknown; lang?: unknown; value?: unknown }>(ctx.req, 32 * 1024);
    const result = setOverride(db, b, u.id, now());
    log(ctx, u, `content.${result}`, null, `${String(b.lang)}:${String(b.key)}`);
    json(ctx.res, 200, { result, overrides: allOverrides(db) });
  });

  // ── backups ──
  on('GET', '/api/admin/backups', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, { backups: B.listBackups(config.backupDir), restorable: config.dbFile !== ':memory:' });
  });
  on('POST', '/api/admin/backups', (ctx) => {
    const u = write(ctx);
    const b = B.createBackup(db, config.backupDir, 'manual', now());
    log(ctx, u, 'backup.create', null, b.name);
    json(ctx.res, 201, { backup: b });
  });
  on('POST', '/api/admin/backups/upload', async (ctx) => {
    const u = write(ctx);
    const b = B.saveUpload(config.backupDir, await readRaw(ctx.req, B.MAX_UPLOAD), now());
    log(ctx, u, 'backup.upload', null, b.name);
    json(ctx.res, 201, { backup: b });
  });
  on('GET', '/api/admin/backups/:name/download', async (ctx, p) => {
    admin(ctx);
    const file = join(config.backupDir, B.checkName(p.name));
    let size: number;
    try {
      size = statSync(file).size;
    } catch {
      throw new HttpError(404, 'notFound');
    }
    ctx.res.writeHead(200, {
      'content-type': 'application/vnd.sqlite3',
      'content-length': String(size),
      'content-disposition': `attachment; filename="${p.name}"`,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    await new Promise<void>((resolve, reject) => createReadStream(file).on('error', reject).on('end', resolve).pipe(ctx.res));
  });
  on('POST', '/api/admin/backups/:name/restore', async (ctx, p) => {
    const u = write(ctx);
    const safety = await B.restoreBackup(db, config.dbFile, config.backupDir, p.name, now());
    migrate(db);
    // the restored file has its own sessions: everyone signs in again
    db.prepare('DELETE FROM sessions').run();
    d.refresh();
    audit(db, 'backup.restore', { actor: u.id, ip: ctx.ip, detail: `${p.name} (before: ${safety.name})` }, now());
    json(ctx.res, 200, { ok: true, safety }, { 'set-cookie': d.clearCookie });
  });
  on('DELETE', '/api/admin/backups/:name', (ctx, p) => {
    const u = write(ctx);
    B.deleteBackup(config.backupDir, p.name);
    log(ctx, u, 'backup.delete', null, p.name);
    json(ctx.res, 200, { ok: true });
  });

  // ── health ──
  on('GET', '/api/admin/health', (ctx) => {
    admin(ctx);
    json(ctx.res, 200, systemHealth(db, config, { ai: d.aiStatus(), startedAt: d.startedAt }, now()));
  });
  on('POST', '/api/admin/health/integrity', (ctx) => {
    const u = write(ctx);
    const result = integrityCheck(db);
    log(ctx, u, 'health.integrity', null, result.join(' ').slice(0, 200));
    json(ctx.res, 200, { result });
  });

  return router.route;
}
