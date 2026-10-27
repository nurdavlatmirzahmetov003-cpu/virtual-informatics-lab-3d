/**
 * «Біздің роботтар» on the server (V4 §4.4): each student's robot save.
 *
 *   GET /api/robots/me          → { save, xp }
 *   PUT /api/robots/me { save } → { save, xp }   (409 overspent)
 *
 * The browser does the buying and training; the server keeps the save and
 * checks it with the same pure rules (services/robots/economy.ts) against
 * the XP of its own attempts, so a save never spends coins it did not earn.
 */
import type { Db } from './db';
import { HttpError, json, readJson } from './http';
import type { Role, UserRow } from './users';
import { createRouter, type RouteCtx } from './router';
import { loadProgress } from './progress';
import { computeXp } from '@/services/game/xp';
import { checkSave, emptySave, normalizeSave, type RobotSave } from '@/services/robots/economy';

export interface RobotsDeps {
  db: Db;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
}

export function loadRobotSave(db: Db, userId: string): RobotSave {
  const row = db.prepare('SELECT data FROM robot_saves WHERE user_id = ?').get(userId) as { data: string } | undefined;
  if (!row) return emptySave();
  try {
    return normalizeSave(JSON.parse(row.data));
  } catch {
    return emptySave();
  }
}

export function robotsRoutes({ db, now, requireUser, checkCsrf }: RobotsDeps) {
  const router = createRouter();
  const xpOf = (u: UserRow) => computeXp(loadProgress(db, u.id, u.created_at).attempts).total;

  router.on('GET', '/api/robots/me', (ctx) => {
    const u = requireUser(ctx);
    json(ctx.res, 200, { save: loadRobotSave(db, u.id), xp: xpOf(u) });
  });

  router.on('PUT', '/api/robots/me', async (ctx) => {
    const u = requireUser(ctx);
    checkCsrf(ctx);
    const b = await readJson<{ save?: unknown }>(ctx.req, 16 * 1024);
    const xp = xpOf(u);
    const checked = checkSave(b.save, xp);
    if (!checked.ok) throw new HttpError(409, 'overspent');
    const save = { ...checked.save, updatedAt: now() };
    db.prepare('INSERT INTO robot_saves (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(u.id, JSON.stringify(save), save.updatedAt);
    json(ctx.res, 200, { save, xp });
  });

  return router.route;
}
