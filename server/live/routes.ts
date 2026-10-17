/**
 * Live game routes (V2-11b).
 *
 *   GET    /api/live/topics          teacher | admin → questions per quiz topic
 *   POST   /api/live/rooms           teacher | admin (csrf) { kind, title, classId?, topics?, count?, seconds?, minutes? } → { id, code }
 *   GET    /api/live/rooms           teacher | admin → rooms in play and past games
 *   DELETE /api/live/rooms/:id       its host | admin (csrf)
 *   GET    /api/live/sessions/:id    its host | admin → saved results
 *   WS     /api/live/ws?code=XXXXXX  signed-in host or student (session cookie, allowed Origin)
 */
import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import type { Db } from '../db';
import { json, readJson } from '../http';
import { audit } from '../audit';
import type { Role, UserRow } from '../users';
import { createRouter, type RouteCtx } from '../router';
import { topicCounts } from '@/labs/LiveGames/quiz';
import { LiveHub, pastSessions, sessionResults } from './hub';
import { acceptUpgrade } from './ws';

export interface LiveDeps {
  db: Db;
  now: () => number;
  hub: LiveHub;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
}

export function liveRoutes({ db, now, hub, requireUser, checkCsrf }: LiveDeps) {
  const router = createRouter();
  const on = router.on;
  const staff = (ctx: RouteCtx) => requireUser(ctx, 'teacher', 'admin');

  on('GET', '/api/live/topics', (ctx) => {
    staff(ctx);
    json(ctx.res, 200, { topics: topicCounts() });
  });
  on('POST', '/api/live/rooms', async (ctx) => {
    const u = staff(ctx);
    checkCsrf(ctx);
    const room = hub.create(u, await readJson(ctx.req, 8 * 1024));
    audit(db, 'live.create', { actor: u.id, target: room.id, ip: ctx.ip, detail: room.kind }, now());
    json(ctx.res, 201, { id: room.id, code: room.code });
  });
  on('GET', '/api/live/rooms', (ctx) => {
    const u = staff(ctx);
    json(ctx.res, 200, { rooms: hub.roomsOf(u), past: pastSessions(db, u) });
  });
  on('DELETE', '/api/live/rooms/:id', (ctx, p) => {
    const u = staff(ctx);
    checkCsrf(ctx);
    hub.close(u, p.id);
    json(ctx.res, 200, { ok: true });
  });
  on('GET', '/api/live/sessions/:id', (ctx, p) => json(ctx.res, 200, sessionResults(db, staff(ctx), p.id)));

  return router.route;
}

/**
 * Upgrades /api/live/ws for a signed-in user from an allowed origin; refuses
 * everything else with a plain HTTP status before any WebSocket exists.
 */
export function liveUpgrade(opts: { hub: LiveHub; userOf: (req: IncomingMessage) => UserRow | null; originOk: (req: IncomingMessage) => boolean; blocked: (req: IncomingMessage) => boolean }) {
  return (req: IncomingMessage, socket: Duplex) => {
    const url = new URL(req.url ?? '/', 'http://local');
    const refuse = (status: string) => socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
    if (url.pathname !== '/api/live/ws') return refuse('404 Not Found');
    if (opts.blocked(req)) return refuse('403 Forbidden');
    if (!opts.originOk(req)) return refuse('403 Forbidden');
    const user = opts.userOf(req);
    if (!user) return refuse('401 Unauthorized');
    const conn = acceptUpgrade(req, socket);
    if (conn) opts.hub.connect(user, url.searchParams.get('code') ?? '', conn);
  };
}
