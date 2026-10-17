import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { createUser } from '../server/users.ts';
import { DAY_MS, dailyStatus, dailyTasks, dayKey, dayStart, streak, weekKey, weekStart, weeklyGoals, weeklyStatus, DAILY_PASS } from '../src/services/progress/challenges.ts';
import { computeXp, levelOf, levelThreshold, rankOf, XP } from '../src/services/game/xp.ts';
import { TASKS } from '../src/services/progress/catalog.ts';

// test-only credentials, generated per run — not real accounts
const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;
let seq = 0;
const att = (exerciseId, percent, at, extra = {}) => ({
  id: `t${++seq}`,
  exerciseId,
  score: Math.round(percent / 10),
  maxScore: 10,
  percent,
  seconds: 90,
  errors: percent === 100 ? 0 : 1,
  hints: 0,
  status: percent >= 60 ? 'completed' : 'incomplete',
  at,
  ...extra,
});

// 2026-10-14 is a Wednesday
const WED = Date.UTC(2026, 9, 14, 6, 0); // 11:00 in Almaty

test('time: Kazakhstan days (UTC+5) and Monday-first weeks', () => {
  const lateUtc = Date.UTC(2026, 9, 13, 19, 30); // 00:30 on the 14th in Almaty
  assert.equal(dayKey(lateUtc), dayKey(WED), 'after midnight in Almaty it is already the next day');
  assert.equal(dayKey(Date.UTC(2026, 9, 13, 18, 59)), dayKey(WED) - 1);
  assert.equal(dayStart(dayKey(WED)), Date.UTC(2026, 9, 13, 19, 0));
  const monday = weekStart(weekKey(WED));
  assert.equal(monday, Date.UTC(2026, 9, 11, 19, 0), 'Monday 00:00 Almaty');
  assert.equal(weekKey(monday), weekKey(WED));
  assert.equal(weekKey(monday - 1), weekKey(WED) - 1);
});

test('daily challenge: same for everyone, three labs, done from the day’s attempts', () => {
  const day = dayKey(WED);
  const a = dailyTasks(day);
  assert.deepEqual(a.map((t) => t.id), dailyTasks(day).map((t) => t.id), 'deterministic');
  assert.equal(new Set(a.map((t) => t.lab)).size, 3, 'three different labs');
  const days = Array.from({ length: 30 }, (_, i) => dailyTasks(day + i).map((t) => t.id).join());
  assert.ok(new Set(days).size > 25, 'it changes from day to day');
  const [x, y, z] = a;
  let s = dailyStatus([att(x.id, 100, WED), att(y.id, DAILY_PASS - 1, WED)], day);
  assert.deepEqual(s.items.map((i) => i.done), [true, false, false]);
  s = dailyStatus([att(x.id, 100, WED), att(y.id, 90, WED), att(z.id, 85, WED), att(z.id, 100, WED - DAY_MS)], day);
  assert.equal(s.complete, true);
  assert.equal(dailyStatus([att(x.id, 100, WED - DAY_MS)], day).done, 0, 'yesterday does not count today');
});

test('weekly goals, streaks', () => {
  const week = weekKey(WED);
  const goals = weeklyGoals(week);
  assert.equal(new Set(goals).size, 3);
  assert.deepEqual(goals, weeklyGoals(week));
  const many = TASKS.slice(0, 9).map((t, i) => att(t.id, 100, WED + i * 1000, { hints: 0 }));
  const w = weeklyStatus(many, week);
  for (const g of w.goals) if (g.id !== 'daily' && g.id !== 'labs') assert.ok(g.done, `${g.id} done with 9 perfect tasks`);
  const today = dayKey(WED);
  const run = [0, 1, 2, 4].map((d) => att('logic:and', 100, WED - d * DAY_MS));
  assert.deepEqual(streak(run, today), { current: 3, longest: 3, today: true });
  assert.equal(streak(run, today + 1).current, 3, 'still alive until the end of tomorrow');
  assert.equal(streak(run, today + 2).current, 0);
  assert.equal(streak([att('logic:and', 40, WED)], today).current, 0, 'incomplete tries do not keep a streak');
});

test('XP: best result once, clean bonus, badges, challenges; levels and ranks', () => {
  const lab = 'logic:and';
  const first = computeXp([att(lab, 60, 1000)]);
  assert.equal(first.tasks, 30);
  const improved = computeXp([att(lab, 60, 1000), att(lab, 100, 2000), att(lab, 100, 3000)]);
  assert.equal(improved.tasks, 50, 'improving counts once, repeating adds nothing');
  assert.equal(improved.clean, XP.clean, '100 % without mistakes or hints');
  assert.equal(computeXp([att(lab, 100, 1000, { hints: 1 })]).clean, 0);
  assert.equal(computeXp([att('legacy:network', 100, 1000)]).tasks, 0, 'only real catalogue tasks');
  // firstStep (+ any badge the history earns) is worth 100 each
  assert.ok(first.badges >= XP.badge);
  assert.equal(computeXp([att(lab, 60, 1000), att(lab, 100, 5000)], 1000).tasks, 30, '`until` sees only earlier attempts');
  const day = dayKey(WED);
  const daily = dailyTasks(day).map((t) => att(t.id, 100, WED));
  assert.equal(computeXp(daily).daily, 3 * XP.dailyItem + XP.dailyAll);

  assert.equal(levelThreshold(1), 0);
  assert.equal(levelThreshold(2), 75);
  assert.equal(levelThreshold(5), 750);
  assert.deepEqual(levelOf(0), { level: 1, into: 0, span: 75, progress: 0, rank: 'novice' });
  assert.equal(levelOf(74).level, 1);
  assert.equal(levelOf(75).level, 2);
  assert.equal(levelOf(800).level, 5);
  assert.equal(rankOf(5), 'technician');
  assert.equal(rankOf(20), 'architect');
});

// ── server ──
async function boot() {
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp({ db, config: { ...serverConfig({}), dbFile: ':memory:' }, now: () => WED + 3_600_000 });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, as } = {}) => {
    const headers = { 'content-type': 'application/json', origin: 'http://localhost:5173' };
    if (as) Object.assign(headers, { cookie: as.cookie, 'x-csrf-token': as.csrf });
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };
  const account = async (login, role, name = login) => {
    const p = pw(login);
    const u = await createUser(db, { login, displayName: name, role, password: p });
    const res = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login, password: p }) });
    const body = await res.json();
    return { id: u.id, cookie: res.headers.get('set-cookie').split(';')[0], csrf: body.csrfToken };
  };
  const sync = (as, attempts) => call('/api/progress', { method: 'PUT', body: { snapshot: { attempts, exercises: {}, achievements: {}, meta: { createdAt: 0 } } }, as });
  return { db, call, account, sync, close: () => new Promise((r) => server.close(r)) };
}

test('leaderboards: class and school, week and all-time, privacy, staff see names, switch-off', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    const t = await s.account('t.one', 'teacher');
    const cls = (await s.call('/api/teacher/classes', { method: 'POST', body: { name: '9A' }, as: t })).body.class;
    const kids = {};
    for (const [login, name] of [['aru', 'Ару'], ['bek', 'Бек'], ['dina', 'Дина']]) {
      kids[login] = await s.account(login, 'student', name);
      s.db.prepare('INSERT INTO class_members (class_id, user_id, joined_at) VALUES (?, ?, ?)').run(cls.id, kids[login].id, 0);
    }
    const lastWeek = WED - 7 * DAY_MS;
    await s.sync(kids.aru, [att('logic:and', 100, WED), att('logic:notOr', 100, WED)]);
    await s.sync(kids.bek, [att('logic:and', 100, lastWeek), att('logic:notOr', 100, lastWeek), att('logic:xorBasic', 100, lastWeek), att('network:connect3', 60, WED)]);
    // a forged achievement in the sync must not raise XP: the server derives badges itself
    await s.call('/api/progress', { method: 'PUT', body: { snapshot: { attempts: [], exercises: {}, achievements: { graduate: 1, lab100: 1 }, meta: { createdAt: 0 } } }, as: kids.dina });

    let b = (await s.call(`/api/game/board?scope=class&id=${cls.id}&period=week`, { as: kids.aru })).body;
    assert.equal(b.title, '9A');
    assert.deepEqual(b.rows.map((r) => [r.name, r.me]), [['Ару', true], ['Бек', false], ['Дина', false]]);
    assert.ok(b.rows[0].xp > b.rows[1].xp, 'this week Aru did more');
    assert.equal(b.rows[2].xp, 0, 'forged achievements count nothing');
    b = (await s.call(`/api/game/board?scope=class&id=${cls.id}&period=all`, { as: kids.aru })).body;
    assert.equal(b.rows[0].name, 'Бек', 'all-time Bek leads');

    // privacy: a student may hide; the site can force it; staff always see names
    await s.call('/api/game/me', { method: 'PATCH', body: { anon: true }, as: kids.bek });
    b = (await s.call(`/api/game/board?scope=class&id=${cls.id}&period=all`, { as: kids.aru })).body;
    assert.equal(b.rows.find((r) => !r.me && r.rank === 1).name, null);
    assert.equal((await s.call(`/api/game/board?scope=class&id=${cls.id}&period=all`, { as: kids.bek })).body.rows[0].name, 'Бек', 'you always see yourself');
    assert.equal((await s.call(`/api/game/board?scope=class&id=${cls.id}&period=all`, { as: t })).body.rows[0].name, 'Бек', 'the teacher sees names');
    await s.call('/api/admin/settings', { method: 'PUT', body: { leaderboardAnonymous: true }, as: admin });
    b = (await s.call(`/api/game/board?scope=class&id=${cls.id}&period=all`, { as: kids.dina })).body;
    assert.deepEqual(b.rows.filter((r) => !r.me).map((r) => r.name), [null, null]);

    // isolation and the school board
    const stranger = await s.account('stranger', 'student');
    assert.equal((await s.call(`/api/game/board?scope=class&id=${cls.id}`, { as: stranger })).status, 404);
    assert.equal((await s.call('/api/game/board?scope=school', { as: kids.aru })).body.error, 'noSchool');
    const school = (await s.call('/api/admin/schools', { method: 'POST', body: { name: 'Лицей' }, as: admin })).body.id;
    for (const k of Object.values(kids)) await s.call(`/api/admin/users/${k.id}`, { method: 'PATCH', body: { schoolId: school }, as: admin });
    const sb = (await s.call('/api/game/board?scope=school&period=all', { as: kids.dina })).body;
    assert.equal(sb.title, 'Лицей');
    assert.equal(sb.rows.length, 3);
    assert.deepEqual((await s.call('/api/game/me', { as: kids.aru })).body.boards.school, { id: school, name: 'Лицей' });

    await s.call('/api/admin/settings', { method: 'PUT', body: { leaderboardsEnabled: false }, as: admin });
    assert.equal((await s.call(`/api/game/board?scope=class&id=${cls.id}`, { as: kids.aru })).body.error, 'leaderboardsOff');
    assert.equal((await s.call(`/api/game/board?scope=class&id=${cls.id}`, { as: t })).status, 200, 'staff keep access');
    assert.equal((await s.call('/api/public')).body.settings.leaderboardsEnabled, false);
  } finally {
    await s.close();
  }
});

test('contests: class vs class by mean XP gained in the window; who may create, see and delete', async () => {
  const s = await boot();
  try {
    const t1 = await s.account('t.one', 'teacher');
    const t2 = await s.account('t.two', 'teacher');
    const mk = async (as, name) => (await s.call('/api/teacher/classes', { method: 'POST', body: { name }, as })).body.class;
    const a = await mk(t1, '7A');
    const b = await mk(t1, '7B');
    const other = await mk(t2, '8C');
    const add = async (cls, login) => {
      const k = await s.account(login, 'student');
      s.db.prepare('INSERT INTO class_members (class_id, user_id, joined_at) VALUES (?, ?, ?)').run(cls.id, k.id, 0);
      return k;
    };
    const a1 = await add(a, 'kid.a1');
    await add(a, 'kid.a2');
    const b1 = await add(b, 'kid.b1');
    const start = WED - DAY_MS;
    const end = WED + 5 * DAY_MS;
    const body = { title: '7-сыныптар апталығы', classIds: [a.id, b.id], startsAt: start, endsAt: end };
    assert.equal((await s.call('/api/game/contests', { method: 'POST', body: { ...body, classIds: [a.id] }, as: t1 })).body.error, 'badClasses');
    assert.equal((await s.call('/api/game/contests', { method: 'POST', body: { ...body, classIds: [a.id, other.id] }, as: t1 })).body.error, 'badClasses', 'not another school’s or teacher’s class');
    assert.equal((await s.call('/api/game/contests', { method: 'POST', body: { ...body, endsAt: start }, as: t1 })).body.error, 'badDates');
    assert.equal((await s.call('/api/game/contests', { method: 'POST', body, as: a1 })).status, 403);
    const id = (await s.call('/api/game/contests', { method: 'POST', body, as: t1 })).body.id;

    // before the window: does not count; inside: counts. 7A: one active of two; 7B: one of one
    await s.sync(a1, [att('logic:and', 100, start - DAY_MS), att('logic:notOr', 100, WED)]);
    await s.sync(b1, [att('logic:xorBasic', 100, WED)]);
    const st = (await s.call(`/api/game/contests/${id}`, { as: a1 })).body;
    assert.equal(st.contest.status, 'live');
    assert.equal(st.rows[0].name, '7B', 'per-student average favours no class size');
    const rowA = st.rows.find((r) => r.name === '7A');
    assert.equal(rowA.students, 2);
    assert.equal(rowA.active, 1);
    assert.equal(rowA.mine, true);
    assert.equal(st.contest.canDelete, false);
    assert.equal((await s.call(`/api/game/contests/${id}`, { as: t2 })).status, 404, 'not in it');
    const list = (await s.call('/api/game/contests', { as: a1 })).body.contests;
    assert.deepEqual([list.length, list[0].myRank], [1, 2]);
    assert.equal((await s.call(`/api/game/contests/${id}`, { method: 'DELETE', as: t2 })).status, 404);
    assert.equal((await s.call(`/api/game/contests/${id}`, { method: 'DELETE', as: t1 })).status, 200);
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'contest.%'").get().n, 2);
  } finally {
    await s.close();
  }
});
