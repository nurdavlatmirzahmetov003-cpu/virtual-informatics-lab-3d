/**
 * Gamification routes (V2-11a). Any signed-in user; writes need CSRF.
 *
 *   GET    /api/game/me                          → { anon, boards }
 *   PATCH  /api/game/me                          { anon }  (hide my name from other students)
 *   GET    /api/game/board?scope=&id=&period=    class | school, week | all
 *   GET    /api/game/contests                    → contests the user takes part in / runs
 *   GET    /api/game/contests/:id                → class standings
 *   GET    /api/game/contest-classes             teacher | admin → classes they may enter
 *   POST   /api/game/contests                    teacher | admin { title, classIds, startsAt, endsAt }
 *   DELETE /api/game/contests/:id                its creator | admin
 *
 * Students reach leaderboards only while the admin keeps them on.
 */
import type { Db } from './db';
import { HttpError, json, readJson } from './http';
import { audit } from './audit';
import type { Role, UserRow } from './users';
import type { SiteSettings } from './settings';
import * as G from './game';
import { createRouter, type RouteCtx } from './router';

export interface GameDeps {
  db: Db;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
  settings: () => Pick<SiteSettings, 'leaderboardsEnabled' | 'leaderboardAnonymous'>;
}

export function gameRoutes({ db, now, requireUser, checkCsrf, settings }: GameDeps) {
  const router = createRouter();
  const on = router.on;
  /** Students only while leaderboards are on; staff always (to set things up). */
  const viewer = (ctx: RouteCtx) => {
    const u = requireUser(ctx);
    if (u.role === 'student' && !settings().leaderboardsEnabled) throw new HttpError(403, 'leaderboardsOff');
    return u;
  };

  on('GET', '/api/game/me', (ctx) => {
    const u = requireUser(ctx);
    json(ctx.res, 200, { anon: !!u.leaderboard_anon, forcedAnon: settings().leaderboardAnonymous, enabled: settings().leaderboardsEnabled, boards: G.boardsFor(db, u) });
  });
  on('PATCH', '/api/game/me', async (ctx) => {
    const u = requireUser(ctx);
    checkCsrf(ctx);
    const b = await readJson<{ anon?: unknown }>(ctx.req, 1024);
    if (typeof b.anon !== 'boolean') throw new HttpError(400, 'badRequest');
    db.prepare('UPDATE users SET leaderboard_anon = ? WHERE id = ?').run(b.anon ? 1 : 0, u.id);
    json(ctx.res, 200, { anon: b.anon });
  });
  on('GET', '/api/game/board', (ctx) => {
    const u = viewer(ctx);
    json(ctx.res, 200, G.leaderboard(db, u, { scope: ctx.query.get('scope'), id: ctx.query.get('id'), period: ctx.query.get('period') }, { anonymous: settings().leaderboardAnonymous, now: now() }));
  });

  on('GET', '/api/game/contests', (ctx) => json(ctx.res, 200, { contests: G.listContests(db, viewer(ctx), now()) }));
  on('GET', '/api/game/contests/:id', (ctx, p) => json(ctx.res, 200, G.standings(db, viewer(ctx), p.id, now())));
  on('GET', '/api/game/contest-classes', (ctx) => json(ctx.res, 200, { classes: G.contestableClasses(db, requireUser(ctx, 'teacher', 'admin')) }));
  on('POST', '/api/game/contests', async (ctx) => {
    const u = requireUser(ctx, 'teacher', 'admin');
    checkCsrf(ctx);
    const id = G.createContest(db, u, await readJson(ctx.req, 8 * 1024), now());
    audit(db, 'contest.create', { actor: u.id, target: id, ip: ctx.ip }, now());
    json(ctx.res, 201, { id });
  });
  on('DELETE', '/api/game/contests/:id', (ctx, p) => {
    const u = requireUser(ctx, 'teacher', 'admin');
    checkCsrf(ctx);
    G.deleteContest(db, u, p.id);
    audit(db, 'contest.delete', { actor: u.id, target: p.id, ip: ctx.ip }, now());
    json(ctx.res, 200, { ok: true });
  });

  return router.route;
}
