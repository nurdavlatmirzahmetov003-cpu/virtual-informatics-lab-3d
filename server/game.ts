/**
 * Gamification on the server (V2-11a): leaderboards per class, per school
 * and per week, and class-vs-class contests. XP is recomputed from the
 * stored attempts with the browser's own rules (services/game/xp) — the
 * server never trusts a total or an achievement sent by a client.
 *
 * Privacy: a student sees classmates' names unless the site runs in
 * anonymous mode or that classmate chose to hide; then "Participant N".
 * Teachers and admins always see names (they know their students).
 */
import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { HttpError } from './http';
import type { UserRow } from './users';
import { computeXp, levelOf } from '@/services/game/xp';
import { weekKey, weekStart } from '@/services/progress/challenges';
import type { AttemptRecord } from '@/services/progress/types';

const placeholders = (n: number) => Array.from({ length: n }, () => '?').join(', ');

// ── XP per user, with a small cache (the history only grows) ───────────────
const cache = new Map<string, number>();
const CACHE_MAX = 5000;

function attemptsOf(db: Db, userIds: string[]): Map<string, AttemptRecord[]> {
  const out = new Map<string, AttemptRecord[]>(userIds.map((id) => [id, []]));
  if (!userIds.length) return out;
  const rows = db
    .prepare(`SELECT user_id, id, exercise_id, score, max_score, percent, seconds, errors, hints, status, at FROM attempts WHERE user_id IN (${placeholders(userIds.length)})`)
    .all(...userIds) as Array<{ user_id: string; id: string; exercise_id: string; score: number; max_score: number; percent: number; seconds: number; errors: number; hints: number; status: 'completed' | 'incomplete'; at: number }>;
  for (const r of rows) {
    out.get(r.user_id)!.push({ id: r.id, exerciseId: r.exercise_id, score: r.score, maxScore: r.max_score, percent: r.percent, seconds: r.seconds, errors: r.errors, hints: r.hints, status: r.status, at: r.at });
  }
  return out;
}

function xpOf(userId: string, list: AttemptRecord[], until = Infinity): number {
  const relevant = until === Infinity ? list : list.filter((a) => a.at <= until);
  const key = `${userId}|${relevant.length}|${relevant.reduce((m, a) => Math.max(m, a.at), 0)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const total = computeXp(relevant).total;
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
  cache.set(key, total);
  return total;
}

/** XP of each user: all-time, and gained in [from, to]. */
export function xpTable(db: Db, userIds: string[], window?: { from: number; to: number }) {
  const all = attemptsOf(db, userIds);
  return new Map(
    userIds.map((id) => {
      const list = all.get(id)!;
      const total = xpOf(id, list);
      const gained = window ? xpOf(id, list, window.to) - xpOf(id, list, window.from - 1) : total;
      return [id, { total, gained, active: window ? list.some((a) => a.at >= window.from && a.at <= window.to) : list.length > 0 }];
    }),
  );
}

// ── leaderboards ───────────────────────────────────────────────────────────

export type Scope = 'class' | 'school';
export type Period = 'week' | 'all';

interface Member {
  id: string;
  display_name: string;
  leaderboard_anon: number;
}

function classAccess(db: Db, viewer: UserRow, classId: string) {
  const cls = db.prepare('SELECT id, name, teacher_id FROM classes WHERE id = ?').get(classId) as { id: string; name: string; teacher_id: string } | undefined;
  if (!cls) throw new HttpError(404, 'notFound');
  const allowed =
    viewer.role === 'admin' ||
    (viewer.role === 'teacher' && cls.teacher_id === viewer.id) ||
    (viewer.role === 'student' && !!db.prepare('SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?').get(classId, viewer.id));
  if (!allowed) throw new HttpError(404, 'notFound');
  return cls;
}

/** The boards this user may open: each of their classes, and their school. */
export function boardsFor(db: Db, viewer: UserRow) {
  const classes = (
    viewer.role === 'student'
      ? db.prepare('SELECT c.id, c.name FROM classes c JOIN class_members m ON m.class_id = c.id WHERE m.user_id = ? ORDER BY c.name').all(viewer.id)
      : viewer.role === 'teacher'
        ? db.prepare('SELECT id, name FROM classes WHERE teacher_id = ? ORDER BY name').all(viewer.id)
        : db.prepare('SELECT id, name FROM classes ORDER BY name').all()
  ) as Array<{ id: string; name: string }>;
  const school = viewer.school_id ? (db.prepare('SELECT id, name FROM schools WHERE id = ?').get(viewer.school_id) as { id: string; name: string } | undefined) : undefined;
  return { classes, school: school ?? null };
}

export interface BoardRow {
  rank: number;
  /** null: hidden (anonymous). */
  name: string | null;
  xp: number;
  level: number;
  me: boolean;
}

export function leaderboard(db: Db, viewer: UserRow, input: { scope: string | null; id: string | null; period: string | null }, opts: { anonymous: boolean; now: number }) {
  const scope: Scope = input.scope === 'school' ? 'school' : 'class';
  const period: Period = input.period === 'all' ? 'all' : 'week';
  let title: string;
  let members: Member[];
  if (scope === 'class') {
    const cls = classAccess(db, viewer, input.id ?? '');
    title = cls.name;
    members = db
      .prepare("SELECT u.id, u.display_name, u.leaderboard_anon FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? AND u.role = 'student' AND u.disabled = 0")
      .all(cls.id) as unknown as Member[];
  } else {
    if (!viewer.school_id) throw new HttpError(404, 'noSchool');
    const school = db.prepare('SELECT name FROM schools WHERE id = ?').get(viewer.school_id) as { name: string } | undefined;
    if (!school) throw new HttpError(404, 'noSchool');
    title = school.name;
    members = db.prepare("SELECT id, display_name, leaderboard_anon FROM users WHERE school_id = ? AND role = 'student' AND disabled = 0").all(viewer.school_id) as unknown as Member[];
  }
  const week = weekKey(opts.now);
  const window = period === 'week' ? { from: weekStart(week), to: opts.now } : undefined;
  const xp = xpTable(db, members.map((m) => m.id), window);
  const sorted = members
    .map((m) => ({ m, x: xp.get(m.id)! }))
    .sort((a, b) => b.x.gained - a.x.gained || b.x.total - a.x.total);
  const seesNames = viewer.role !== 'student';
  const rows: BoardRow[] = [];
  sorted.forEach(({ m, x }, i) => {
    const rank = i > 0 && sorted[i - 1].x.gained === x.gained ? rows[i - 1].rank : i + 1;
    const me = m.id === viewer.id;
    const hidden = !seesNames && !me && (opts.anonymous || !!m.leaderboard_anon);
    rows.push({ rank, name: hidden ? null : m.display_name, xp: x.gained, level: levelOf(x.total).level, me });
  });
  return { scope, period, title, weekStart: weekStart(week), rows, anonymous: opts.anonymous };
}

// ── contests ───────────────────────────────────────────────────────────────

interface ContestRow {
  id: string;
  title: string;
  created_by: string;
  starts_at: number;
  ends_at: number;
  created_at: number;
}

const MAX_DAYS = 90;

/** Classes a teacher may put in a contest: their own and those of their school. */
export function contestableClasses(db: Db, viewer: UserRow) {
  const rows = (
    viewer.role === 'admin'
      ? db.prepare('SELECT c.id, c.name, u.display_name AS teacher FROM classes c JOIN users u ON u.id = c.teacher_id ORDER BY c.name').all()
      : db
          .prepare('SELECT c.id, c.name, u.display_name AS teacher FROM classes c JOIN users u ON u.id = c.teacher_id WHERE c.teacher_id = ? OR (c.school_id IS NOT NULL AND c.school_id = ?) ORDER BY c.name')
          .all(viewer.id, viewer.school_id ?? '__none__')
  ) as Array<{ id: string; name: string; teacher: string }>;
  return rows;
}

export function createContest(db: Db, viewer: UserRow, input: Record<string, unknown>, now = Date.now()) {
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title || title.length > 80) throw new HttpError(400, 'badTitle');
  const ids = Array.isArray(input.classIds) ? [...new Set(input.classIds.map(String))] : [];
  if (ids.length < 2 || ids.length > 12) throw new HttpError(400, 'badClasses');
  const allowed = new Set(contestableClasses(db, viewer).map((c) => c.id));
  if (ids.some((id) => !allowed.has(id))) throw new HttpError(400, 'badClasses');
  const startsAt = Number(input.startsAt);
  const endsAt = Number(input.endsAt);
  if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt) || endsAt <= startsAt || endsAt - startsAt > MAX_DAYS * 86_400_000 || endsAt < now) throw new HttpError(400, 'badDates');
  const id = randomUUID();
  db.prepare('INSERT INTO contests (id, title, created_by, starts_at, ends_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, title, viewer.id, startsAt, endsAt, now);
  for (const c of ids) db.prepare('INSERT INTO contest_classes (contest_id, class_id) VALUES (?, ?)').run(id, c);
  return id;
}

function contestRow(db: Db, id: string) {
  const c = db.prepare('SELECT * FROM contests WHERE id = ?').get(id) as ContestRow | undefined;
  if (!c) throw new HttpError(404, 'notFound');
  return c;
}

function canSee(db: Db, viewer: UserRow, c: ContestRow) {
  if (viewer.role === 'admin' || c.created_by === viewer.id) return true;
  const sql =
    viewer.role === 'student'
      ? 'SELECT 1 FROM contest_classes cc JOIN class_members m ON m.class_id = cc.class_id WHERE cc.contest_id = ? AND m.user_id = ?'
      : 'SELECT 1 FROM contest_classes cc JOIN classes c ON c.id = cc.class_id WHERE cc.contest_id = ? AND c.teacher_id = ?';
  return !!db.prepare(sql).get(c.id, viewer.id);
}

const statusOf = (c: ContestRow, now: number) => (now < c.starts_at ? 'upcoming' : now > c.ends_at ? 'finished' : 'live');

/** Each class: mean XP gained per student in the contest window (fair to small classes), and how many took part. */
export function standings(db: Db, viewer: UserRow, id: string, now = Date.now()) {
  const c = contestRow(db, id);
  if (!canSee(db, viewer, c)) throw new HttpError(404, 'notFound');
  const classes = db
    .prepare('SELECT cl.id, cl.name, u.display_name AS teacher FROM contest_classes cc JOIN classes cl ON cl.id = cc.class_id JOIN users u ON u.id = cl.teacher_id WHERE cc.contest_id = ?')
    .all(c.id) as Array<{ id: string; name: string; teacher: string }>;
  const mine = new Set(
    viewer.role === 'student' ? (db.prepare('SELECT class_id FROM class_members WHERE user_id = ?').all(viewer.id) as Array<{ class_id: string }>).map((r) => r.class_id) : [],
  );
  const window = { from: c.starts_at, to: Math.min(now, c.ends_at) };
  const rows = classes.map((cl) => {
    const ids = (db.prepare("SELECT m.user_id FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? AND u.role = 'student' AND u.disabled = 0").all(cl.id) as Array<{ user_id: string }>).map((r) => r.user_id);
    const xp = now < c.starts_at ? new Map() : xpTable(db, ids, window);
    const gains = ids.map((u) => xp.get(u)?.gained ?? 0);
    const total = gains.reduce((a, b) => a + b, 0);
    return {
      classId: cl.id,
      name: cl.name,
      teacher: cl.teacher,
      students: ids.length,
      active: gains.filter((g) => g > 0).length,
      total,
      average: ids.length ? Math.round(total / ids.length) : 0,
      mine: mine.has(cl.id),
    };
  });
  rows.sort((a, b) => b.average - a.average || b.active - a.active);
  return {
    contest: { id: c.id, title: c.title, startsAt: c.starts_at, endsAt: c.ends_at, status: statusOf(c, now), canDelete: viewer.role === 'admin' || c.created_by === viewer.id },
    rows: rows.reduce<Array<(typeof rows)[number] & { rank: number }>>((out, r, i) => [...out, { ...r, rank: i > 0 && rows[i - 1].average === r.average ? out[i - 1].rank : i + 1 }], []),
  };
}

export function listContests(db: Db, viewer: UserRow, now = Date.now()) {
  const all = db.prepare('SELECT * FROM contests ORDER BY ends_at DESC LIMIT 100').all() as unknown as ContestRow[];
  return all
    .filter((c) => canSee(db, viewer, c))
    .map((c) => {
      const s = standings(db, viewer, c.id, now);
      return { ...s.contest, leader: s.rows[0]?.name ?? null, classes: s.rows.length, myRank: s.rows.find((r) => r.mine)?.rank ?? null };
    });
}

export function deleteContest(db: Db, viewer: UserRow, id: string) {
  const c = contestRow(db, id);
  if (viewer.role !== 'admin' && c.created_by !== viewer.id) throw new HttpError(404, 'notFound');
  db.prepare('DELETE FROM contests WHERE id = ?').run(id);
}
