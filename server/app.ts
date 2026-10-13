/**
 * The lab server's request handler (V2-8): authentication, roles, progress
 * sync and the admin user list, next to the AI assistant routes. Kept free
 * of `listen()` so tests drive it on an ephemeral port with an in-memory db.
 *
 *   GET  /api/health
 *   GET  /api/auth/me                 → { user | null, csrfToken? }
 *   POST /api/auth/login              { login, password } → { user, csrfToken } + cookie
 *   POST /api/auth/logout             (csrf)
 *   GET  /api/progress                student → snapshot
 *   PUT  /api/progress                student (csrf) { snapshot } → merged snapshot
 *   GET  /api/admin/users             admin
 *   POST /api/admin/users             admin (csrf) { login, displayName, role, password }
 *   …and the classroom routes (classes, assignments, grades, messages) in
 *   classroomRoutes.ts.
 *
 * Every state-changing request needs the session's CSRF token in
 * `x-csrf-token` and, when the browser sends one, an allowed Origin.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Db } from './db';
import type { ServerConfig } from './env';
import { HttpError, clientIp, cookie, json, parseCookies, readJson } from './http';
import { audit } from './audit';
import { dummyHash, verifyPassword } from './auth/password';
import { LoginLimiter } from './auth/rateLimit';
import { SESSION_COOKIE, createSession, destroySession, findSession, type SessionRow } from './auth/sessions';
import { createUser, listUsers, normalizeLogin, publicUser, userById, userByLogin, type Role, type UserRow } from './users';
import { loadProgress, saveProgress } from './progress';
import { classroomRoutes } from './classroomRoutes';

export interface AppOptions {
  db: Db;
  config: ServerConfig;
  limiter?: LoginLimiter;
  /** Wrong class join codes (per student + IP). */
  joinLimiter?: LoginLimiter;
  /** Other route handlers (the AI assistant); return true when they answered. */
  extra?: Array<(req: IncomingMessage, res: ServerResponse) => Promise<boolean>>;
  now?: () => number;
}

interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  ip: string;
  session: SessionRow | null;
  user: UserRow | null;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createApp({ db, config, limiter = new LoginLimiter(), joinLimiter = new LoginLimiter(10, 30), extra = [], now = Date.now }: AppOptions) {
  const clearCookie = cookie(SESSION_COOKIE, '', { maxAge: 0, secure: config.cookieSecure });

  function requireUser(ctx: Ctx, ...roles: Role[]): UserRow {
    if (!ctx.user) throw new HttpError(401, 'unauthenticated');
    if (roles.length && !roles.includes(ctx.user.role)) throw new HttpError(403, 'forbidden');
    return ctx.user;
  }

  function checkCsrf(ctx: Ctx) {
    const sent = ctx.req.headers['x-csrf-token'];
    if (!ctx.session || typeof sent !== 'string' || sent !== ctx.session.csrf) throw new HttpError(403, 'csrf');
  }

  function checkOrigin(req: IncomingMessage) {
    const origin = req.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) throw new HttpError(403, 'origin');
  }

  const classroom = classroomRoutes({
    db,
    now,
    requireUser: (ctx, ...roles) => requireUser(ctx as Ctx, ...roles),
    checkCsrf: (ctx) => checkCsrf(ctx as Ctx),
    joinLimiter,
  });

  async function login(ctx: Ctx) {
    const body = await readJson<{ login?: unknown; password?: unknown }>(ctx.req, 4096);
    const login = typeof body.login === 'string' ? normalizeLogin(body.login).slice(0, 64) : '';
    const password = typeof body.password === 'string' ? body.password.slice(0, 256) : '';
    if (!login || !password) throw new HttpError(400, 'missing');
    const wait = limiter.retryAfter(ctx.ip, login, now());
    if (wait > 0) {
      audit(db, 'login.blocked', { target: login, ip: ctx.ip }, now());
      throw new HttpError(429, 'rateLimited', { retryAfter: wait });
    }
    const user = userByLogin(db, login);
    // verify against a dummy hash for unknown logins: same timing either way
    const ok = await verifyPassword(password, user?.password_hash ?? (await dummyHash()));
    if (!user || !ok || user.disabled) {
      limiter.fail(ctx.ip, login, now());
      audit(db, 'login.fail', { target: login, ip: ctx.ip, detail: user?.disabled ? 'disabled' : '' }, now());
      throw new HttpError(401, 'invalidCredentials');
    }
    limiter.succeed(ctx.ip, login);
    const s = createSession(db, user.id, config.sessionHours, String(ctx.req.headers['user-agent'] ?? ''), now());
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), user.id);
    audit(db, 'login.ok', { actor: user.id, ip: ctx.ip }, now());
    json(ctx.res, 200, { user: publicUser(user), csrfToken: s.csrf }, { 'set-cookie': cookie(SESSION_COOKIE, s.token, { maxAge: s.maxAge, secure: config.cookieSecure }) });
  }

  async function route(ctx: Ctx, method: string, path: string) {
    if (path === '/api/health' && method === 'GET') return json(ctx.res, 200, { ok: true, version: 1 });

    if (path === '/api/auth/me' && method === 'GET') {
      return json(ctx.res, 200, ctx.user ? { user: publicUser(ctx.user), csrfToken: ctx.session!.csrf } : { user: null });
    }
    if (path === '/api/auth/login' && method === 'POST') return login(ctx);
    if (path === '/api/auth/logout' && method === 'POST') {
      requireUser(ctx);
      checkCsrf(ctx);
      destroySession(db, parseCookies(ctx.req.headers.cookie)[SESSION_COOKIE]);
      audit(db, 'logout', { actor: ctx.user!.id, ip: ctx.ip }, now());
      return json(ctx.res, 200, { ok: true }, { 'set-cookie': clearCookie });
    }

    if (path === '/api/progress') {
      const user = requireUser(ctx, 'student');
      if (method === 'GET') return json(ctx.res, 200, { snapshot: loadProgress(db, user.id, user.created_at) });
      if (method === 'PUT') {
        checkCsrf(ctx);
        const body = await readJson<{ snapshot?: unknown }>(ctx.req, 1024 * 1024);
        return json(ctx.res, 200, { snapshot: saveProgress(db, user.id, user.created_at, body.snapshot) });
      }
    }

    if (path === '/api/admin/users') {
      const admin = requireUser(ctx, 'admin');
      if (method === 'GET') return json(ctx.res, 200, { users: listUsers(db) });
      if (method === 'POST') {
        checkCsrf(ctx);
        const b = await readJson<{ login?: unknown; displayName?: unknown; role?: unknown; password?: unknown }>(ctx.req, 4096);
        const role = b.role === 'teacher' || b.role === 'student' || b.role === 'admin' ? b.role : null;
        if (!role) throw new HttpError(400, 'badRole');
        const user = await createUser(db, { login: String(b.login ?? ''), displayName: String(b.displayName ?? ''), role, password: String(b.password ?? '') }, now());
        audit(db, 'user.create', { actor: admin.id, target: user.id, ip: ctx.ip, detail: role }, now());
        return json(ctx.res, 201, { user: publicUser(user) });
      }
    }

    if (await classroom(ctx, method, path)) return;

    throw new HttpError(404, 'not-found');
  }

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    try {
      for (const h of extra) if (await h(req, res)) return;
      const url = new URL(req.url ?? '/', 'http://local');
      const method = req.method ?? 'GET';
      if (!url.pathname.startsWith('/api/')) throw new HttpError(404, 'not-found');
      if (MUTATING.has(method)) checkOrigin(req);
      const session = findSession(db, parseCookies(req.headers.cookie)[SESSION_COOKIE], now());
      const found = session ? userById(db, session.user_id) : undefined;
      const user = found && !found.disabled ? found : null;
      await route({ req, res, ip: clientIp(req), session: user ? session : null, user }, method, url.pathname);
    } catch (e) {
      if (e instanceof HttpError) return json(res, e.status, { error: e.code, ...e.extra });
      console.error('[server]', (e as Error).message);
      return json(res, 500, { error: 'server' });
    }
  };
}
