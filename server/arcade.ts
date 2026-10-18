/**
 * The Games arena on the server (0.36): runs, the referee and the boards.
 *
 *   POST /api/arcade/start    { game, seed? }      → { runId, seed, serverNow }
 *   POST /api/arcade/finish   { runId, answers }   → { result, best, previousBest }
 *   GET  /api/arcade/me                            → { bests, boards }
 *   GET  /api/arcade/board?game=&scope=&id=&period= → class | school, week | all
 *
 * The browser plays; the server keeps the seed and the start time and
 * recomputes the score with the same pure rules (labs/Arcade). A seed sent
 * by the browser is a challenge from a friend: everyone gets the same rounds.
 * Students see boards only while the admin keeps leaderboards on.
 */
import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { HttpError, json, readJson } from './http';
import type { Role, UserRow } from './users';
import type { SiteSettings } from './settings';
import { createRouter, type RouteCtx } from './router';
import { boardMembers, boardsFor, visibleName } from './game';
import { weekKey, weekStart } from '@/services/progress/challenges';
import { ARCADE_GAMES, isArcadeGame, isSeed, newSeed, scoreRun, type ArcadeGame } from '@/labs/Arcade';

export interface ArcadeDeps {
  db: Db;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
  settings: () => Pick<SiteSettings, 'leaderboardsEnabled' | 'leaderboardAnonymous'>;
}

interface RunRow {
  id: string;
  user_id: string;
  game: string;
  seed: number;
  started_at: number;
  finished_at: number | null;
}

const DAY = 86_400_000;

/** Best finished score per user for a game, optionally since a time. */
function bests(db: Db, game: ArcadeGame, userIds: string[], since?: number): Map<string, number> {
  const out = new Map<string, number>();
  if (!userIds.length) return out;
  const marks = userIds.map(() => '?').join(',');
  const rows = db
    .prepare(`SELECT user_id, MAX(score) AS best FROM arcade_runs WHERE game = ? AND score IS NOT NULL AND user_id IN (${marks})${since ? ' AND finished_at >= ?' : ''} GROUP BY user_id`)
    .all(game, ...userIds, ...(since ? [since] : [])) as Array<{ user_id: string; best: number }>;
  for (const r of rows) out.set(r.user_id, r.best);
  return out;
}

export function arcadeRoutes({ db, now, requireUser, checkCsrf, settings }: ArcadeDeps) {
  const router = createRouter();
  const on = router.on;

  on('POST', '/api/arcade/start', async (ctx) => {
    const u = requireUser(ctx);
    checkCsrf(ctx);
    const b = await readJson<{ game?: unknown; seed?: unknown }>(ctx.req, 1024);
    if (!isArcadeGame(b.game)) throw new HttpError(400, 'badGame');
    const t = now();
    // one open run per game: a new start replaces the unfinished one; old leftovers go
    db.prepare('DELETE FROM arcade_runs WHERE user_id = ? AND score IS NULL AND (game = ? OR started_at < ?)').run(u.id, b.game, t - DAY);
    const seed = isSeed(b.seed) ? b.seed : newSeed();
    const id = randomUUID();
    db.prepare('INSERT INTO arcade_runs (id, user_id, game, seed, started_at) VALUES (?, ?, ?, ?, ?)').run(id, u.id, b.game, seed, t);
    json(ctx.res, 201, { runId: id, seed, serverNow: t });
  });

  on('POST', '/api/arcade/finish', async (ctx) => {
    const u = requireUser(ctx);
    checkCsrf(ctx);
    const b = await readJson<{ runId?: unknown; answers?: unknown }>(ctx.req, 16 * 1024);
    const run = db.prepare('SELECT * FROM arcade_runs WHERE id = ? AND user_id = ?').get(String(b.runId ?? ''), u.id) as RunRow | undefined;
    if (!run || run.finished_at || !isArcadeGame(run.game)) throw new HttpError(404, 'noRun');
    const t = now();
    const verdict = scoreRun(run.game, run.seed, b.answers, t - run.started_at);
    if (!verdict.ok) {
      db.prepare('DELETE FROM arcade_runs WHERE id = ?').run(run.id);
      throw new HttpError(400, verdict.reason);
    }
    const previousBest = bests(db, run.game, [u.id]).get(u.id) ?? null;
    const r = verdict.result;
    db.prepare('UPDATE arcade_runs SET finished_at = ?, score = ?, correct = ?, total = ?, mistakes = ? WHERE id = ?').run(t, r.score, r.correct, r.total, r.mistakes, run.id);
    json(ctx.res, 200, { result: r, previousBest, best: Math.max(previousBest ?? 0, r.score) });
  });

  on('GET', '/api/arcade/me', (ctx) => {
    const u = requireUser(ctx);
    const out: Partial<Record<ArcadeGame, number>> = {};
    for (const g of ARCADE_GAMES) {
      const best = bests(db, g, [u.id]).get(u.id);
      if (best !== undefined) out[g] = best;
    }
    json(ctx.res, 200, { bests: out, boards: boardsFor(db, u), enabled: settings().leaderboardsEnabled });
  });

  on('GET', '/api/arcade/board', (ctx) => {
    const u = requireUser(ctx);
    if (u.role === 'student' && !settings().leaderboardsEnabled) throw new HttpError(403, 'leaderboardsOff');
    const game = ctx.query.get('game');
    if (!isArcadeGame(game)) throw new HttpError(400, 'badGame');
    const period = ctx.query.get('period') === 'all' ? 'all' : 'week';
    const { scope, title, members } = boardMembers(db, u, { scope: ctx.query.get('scope'), id: ctx.query.get('id') });
    const since = period === 'week' ? weekStart(weekKey(now())) : undefined;
    const best = bests(
      db,
      game,
      members.map((m) => m.id),
      since,
    );
    const anonymous = settings().leaderboardAnonymous;
    const sorted = members.filter((m) => best.has(m.id)).sort((a, b) => best.get(b.id)! - best.get(a.id)!);
    const rows: Array<{ rank: number; name: string | null; score: number; me: boolean }> = [];
    sorted.forEach((m, i) => {
      const score = best.get(m.id)!;
      const rank = i > 0 && rows[i - 1].score === score ? rows[i - 1].rank : i + 1;
      rows.push({ rank, name: visibleName(u, m, anonymous), score, me: m.id === u.id });
    });
    json(ctx.res, 200, { game, scope, period, title, rows: rows.slice(0, 50), me: rows.find((r) => r.me) ?? null });
  });

  return router.route;
}
