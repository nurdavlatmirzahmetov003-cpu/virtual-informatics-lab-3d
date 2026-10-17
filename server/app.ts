/**
 * The lab server's request handler: authentication, roles, progress sync,
 * next to the AI assistant routes. Kept free of `listen()` so tests drive it
 * on an ephemeral port with an in-memory db.
 *
 *   GET  /api/health
 *   GET  /api/public                  → { settings (banner…), content overrides }
 *   GET  /api/auth/me                 → { user | null, csrfToken? }
 *   POST /api/auth/login              { login, password } → { user, csrfToken } + cookie
 *   POST /api/auth/logout             (csrf)
 *   GET  /api/auth/reset?token=       → { login, displayName } for a valid reset link
 *   POST /api/auth/reset              { token, password }
 *   GET  /api/progress                student → snapshot
 *   PUT  /api/progress                student (csrf) { snapshot } → merged snapshot
 *   …the classroom routes in classroomRoutes.ts (V2-9), the admin panel in
 *   adminRoutes.ts (V2-10) and leaderboards / contests in gameRoutes.ts (V2-11a).
 *
 * Every state-changing request needs the session's CSRF token in
 * `x-csrf-token` and, when the browser sends one, an allowed Origin.
 * Requests from a blocked IP get 403 before anything else.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Db } from './db';
import type { ServerConfig } from './env';
import { HttpError, clientIp, cookie, json, parseCookies, readJson } from './http';
import { audit } from './audit';
import { dummyHash, verifyPassword } from './auth/password';
import { LoginLimiter } from './auth/rateLimit';
import { SESSION_COOKIE, createSession, destroySession, findSession, type SessionRow } from './auth/sessions';
import { normalizeLogin, publicUser, userById, userByLogin, type Role, type UserRow } from './users';
import { loadProgress, saveProgress } from './progress';
import { classroomRoutes } from './classroomRoutes';
import { adminRoutes } from './adminRoutes';
import { gameRoutes } from './gameRoutes';
import { checkResetToken, listIpBlocks, redeemResetToken } from './admin';
import { getSettings, publicSettings } from './settings';
import { allOverrides, contentVersion } from './content';

export interface AppOptions {
  db: Db;
  config: ServerConfig;
  limiter?: LoginLimiter;
  /** Wrong class join codes (per student + IP). */
  joinLimiter?: LoginLimiter;
  /** Password-reset link checks (per IP). */
  resetLimiter?: LoginLimiter;
  /** Other route handlers (the AI assistant); return true when they answered. */
  extra?: Array<(req: IncomingMessage, res: ServerResponse) => Promise<boolean>>;
  aiStatus?: () => { provider: string | null; model: string | null };
  now?: () => number;
}

interface Ctx {
  req: IncomingMessage;
  res: ServerResponse;
  ip: string;
  query: URLSearchParams;
  session: SessionRow | null;
  user: UserRow | null;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function createApp({
  db,
  config,
  limiter = new LoginLimiter(),
  joinLimiter = new LoginLimiter(10, 30),
  resetLimiter = new LoginLimiter(10, 30),
  extra = [],
  aiStatus = () => ({ provider: null, model: null }),
  now = Date.now,
}: AppOptions) {
  const clearCookie = cookie(SESSION_COOKIE, '', { maxAge: 0, secure: config.cookieSecure });
  const startedAt = now();
  const settings = () => getSettings(db, { sessionHours: config.sessionHours });

  // blocked IPs, cached: checked on every request, reloaded when they change
  let blockedIps = new Map<string, number | null>();
  const refresh = () => {
    blockedIps = new Map(listIpBlocks(db, now()).map((b) => [b.ip, b.expiresAt]));
  };
  refresh();
  const isBlocked = (ip: string) => {
    if (!blockedIps.has(ip)) return false;
    const until = blockedIps.get(ip);
    return until == null || until > now();
  };

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

  const deps = {
    db,
    now,
    requireUser: (ctx: object, ...roles: Role[]) => requireUser(ctx as Ctx, ...roles),
    checkCsrf: (ctx: object) => checkCsrf(ctx as Ctx),
  };
  const classroom = classroomRoutes({ ...deps, joinLimiter, settings });
  const game = gameRoutes({ ...deps, settings });
  const adminPanel = adminRoutes({ ...deps, config, limiter, settings, aiStatus, startedAt, refresh, clearCookie });

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
    const s = createSession(db, user.id, settings().sessionHours, String(ctx.req.headers['user-agent'] ?? ''), now());
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now(), user.id);
    audit(db, 'login.ok', { actor: user.id, ip: ctx.ip }, now());
    json(ctx.res, 200, { user: publicUser(user), csrfToken: s.csrf }, { 'set-cookie': cookie(SESSION_COOKIE, s.token, { maxAge: s.maxAge, secure: config.cookieSecure }) });
  }

  /** Reset links are guessable only by brute force: count wrong tokens like failed logins. */
  function resetGuard(ctx: Ctx) {
    const wait = resetLimiter.retryAfter(ctx.ip, 'reset', now());
    if (wait > 0) throw new HttpError(429, 'rateLimited', { retryAfter: wait });
  }

  async function route(ctx: Ctx, method: string, path: string) {
    if (path === '/api/health' && method === 'GET') return json(ctx.res, 200, { ok: true, version: 1 });
    if (path === '/api/public' && method === 'GET') {
      return json(ctx.res, 200, { settings: publicSettings(settings()), content: allOverrides(db), contentVersion: contentVersion(db) });
    }

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
    if (path === '/api/auth/reset' && method === 'GET') {
      resetGuard(ctx);
      const who = checkResetToken(db, ctx.query.get('token'), now());
      if (!who) {
        resetLimiter.fail(ctx.ip, 'reset', now());
        throw new HttpError(404, 'badToken');
      }
      return json(ctx.res, 200, who);
    }
    if (path === '/api/auth/reset' && method === 'POST') {
      resetGuard(ctx);
      const b = await readJson<{ token?: unknown; password?: unknown }>(ctx.req, 4096);
      try {
        const user = await redeemResetToken(db, b.token, b.password, now());
        audit(db, 'password.reset', { actor: user.id, ip: ctx.ip }, now());
        return json(ctx.res, 200, { ok: true, login: user.login });
      } catch (e) {
        if (e instanceof HttpError && e.code === 'badToken') resetLimiter.fail(ctx.ip, 'reset', now());
        throw e;
      }
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

    if (await classroom(ctx, method, path)) return;
    if (await game(ctx, method, path)) return;
    if (await adminPanel(ctx, method, path)) return;

    throw new HttpError(404, 'not-found');
  }

  return async function handle(req: IncomingMessage, res: ServerResponse) {
    try {
      const ip = clientIp(req, config.trustProxy);
      if (isBlocked(ip)) throw new HttpError(403, 'ipBlocked');
      const url = new URL(req.url ?? '/', 'http://local');
      // the admin can switch the LLM routes off; the browser then answers locally
      if (url.pathname.startsWith('/api/ai/') && !settings().aiEnabled) throw new HttpError(503, 'ai-disabled');
      for (const h of extra) if (await h(req, res)) return;
      const method = req.method ?? 'GET';
      if (!url.pathname.startsWith('/api/')) throw new HttpError(404, 'not-found');
      if (MUTATING.has(method)) checkOrigin(req);
      const session = findSession(db, parseCookies(req.headers.cookie)[SESSION_COOKIE], now());
      const found = session ? userById(db, session.user_id) : undefined;
      const user = found && !found.disabled ? found : null;
      await route({ req, res, ip, query: url.searchParams, session: user ? session : null, user }, method, url.pathname);
    } catch (e) {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      if (e instanceof HttpError) return json(res, e.status, { error: e.code, ...e.extra });
      console.error('[server]', (e as Error).message);
      return json(res, 500, { error: 'server' });
    }
  };
}
