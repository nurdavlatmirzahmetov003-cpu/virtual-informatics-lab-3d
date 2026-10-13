import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { LoginLimiter } from '../server/auth/rateLimit.ts';
import { passwordProblem } from '../server/auth/password.ts';
import { createUser } from '../server/users.ts';
import { generatePassword, joinCode, loginFromName, uniqueLogin, JOIN_CODE_LENGTH } from '../server/names.ts';
import { computeCells } from '../server/classroom.ts';
import { encodeQr, formatBits, qrPath } from '../src/lib/qr/qr.ts';
import { assignmentStats, cellStatus, classSummary, csvField, studentTotals, toCsv, toJson } from '../src/services/classroom/stats.ts';

// test-only credentials, generated per run — not real accounts
const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;
const ORIGIN = 'http://localhost:5173';

async function boot() {
  const db = openDb(':memory:');
  migrate(db);
  const config = { ...serverConfig({}), dbFile: ':memory:' };
  const app = createApp({ db, config, joinLimiter: new LoginLimiter(3, 10) });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, as } = {}) => {
    const headers = { 'content-type': 'application/json', origin: ORIGIN };
    if (as) {
      headers.cookie = as.cookie;
      headers['x-csrf-token'] = as.csrf;
    }
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json() };
  };
  const signIn = async (login, password) => {
    const res = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login, password }) });
    const body = await res.json();
    assert.equal(res.status, 200, `sign in ${login}`);
    return { cookie: res.headers.get('set-cookie').split(';')[0], csrf: body.csrfToken, user: body.user };
  };
  const account = async (login, role) => {
    const p = pw(login);
    await createUser(db, { login, displayName: login, role, password: p });
    return signIn(login, p);
  };
  return { db, call, signIn, account, close: () => new Promise((r) => server.close(r)) };
}

const attempt = (exerciseId, percent, at, extra = {}) => ({
  id: `a-${exerciseId}-${at}`,
  exerciseId,
  score: percent / 10,
  maxScore: 10,
  percent,
  seconds: 60,
  errors: 2,
  hints: 1,
  status: percent >= 60 ? 'completed' : 'incomplete',
  at,
  ...extra,
});

test('names: Kazakh/Russian logins, unique suffixes, generated passwords and join codes', () => {
  assert.equal(loginFromName('Әлия Сейітқызы'), 'aliya.seyitqyzy');
  assert.equal(loginFromName('  Нұрлан   Жұмабаев  '), 'nurlan.zhumabaev');
  assert.equal(loginFromName('Щукина Юлия Сергеевна'), 'schukina.yuliya', 'two parts at most');
  assert.equal(loginFromName("D'Artagnan"), 'd.artagnan');
  assert.equal(loginFromName('???'), '');
  const taken = new Set(['aliya.seyitqyzy', 'aliya.seyitqyzy2']);
  assert.equal(uniqueLogin('aliya.seyitqyzy', (l) => taken.has(l)), 'aliya.seyitqyzy3');
  assert.match(uniqueLogin('', () => false), /^student/);
  for (let i = 0; i < 200; i++) {
    const p = generatePassword();
    assert.match(p, /^([bdfgkmnprstvz][aeiou]){2}-([bdfgkmnprstvz][aeiou]){2}-([bdfgkmnprstvz][aeiou]){2}-\d\d$/);
    assert.equal(passwordProblem(p), null, 'meets the password rules');
    const c = joinCode();
    assert.equal(c.length, JOIN_CODE_LENGTH);
    assert.match(c, /^[A-HJKMNP-Z2-9]+$/, 'no 0/O/1/I/L');
  }
});

test('classroom texts: kk, ru and en have the same keys, none empty, placeholders kept', async () => {
  const { readFileSync } = await import('node:fs');
  const flat = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [[pre + k, v]] : flat(v, `${pre}${k}.`)));
  const load = (lang) => new Map(flat(JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8')).classroom));
  const [kk, ru, en] = ['kk', 'ru', 'en'].map(load);
  assert.ok(kk.size > 150, `kk has ${kk.size} texts`);
  for (const other of [ru, en]) {
    assert.deepEqual([...other.keys()].sort(), [...kk.keys()].sort());
    for (const [k, v] of other) {
      assert.ok(v.trim(), `${k} is empty`);
      const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join();
      assert.equal(vars(v), vars(kk.get(k)), `${k}: same {placeholders}`);
    }
  }
});

test('QR: sizes, finder patterns, format bits, SVG path', () => {
  const m = encodeQr('http://localhost:5173/join?code=ABC234');
  assert.equal(m.length, 29, 'version 3: 29×29');
  assert.ok(m.every((row) => row.length === 29));
  // finder pattern corners: dark outer ring, light ring, dark 3×3 core
  for (const [x, y] of [[0, 0], [22, 0], [0, 22]]) {
    assert.ok(m[y][x] && m[y + 6][x + 6] && m[y + 3][x + 3], 'dark ring + core');
    assert.ok(!m[y + 1][x + 1] && !m[y + 5][x + 5], 'light ring');
  }
  for (let i = 8; i < 21; i++) assert.equal(m[6][i], i % 2 === 0, 'timing row');
  assert.ok(m[29 - 8][8], 'the dark module');
  // format bits for level M are the published table values
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map(formatBits), [0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0]);
  assert.equal(encodeQr('x'.repeat(150)).length, 4 * 8 + 17, 'version 8 for 150 bytes');
  assert.throws(() => encodeQr('x'.repeat(400)), /too long/);
  const path = qrPath(encodeQr('HELLO'));
  assert.match(path, /^M\d+ \d+h1v1h-1z/);
});

test('cells: on-time best attempt, late flag, teacher grade overrides the automatic score', () => {
  const a = { id: 'A', exercise_id: 'logic:and', due_at: 1000, points: 20 };
  const free = { id: 'F', exercise_id: null, due_at: null, points: 5 };
  const attempts = [
    { user_id: 's1', id: 'x1', exercise_id: 'logic:and', percent: 50, score: 5, max_score: 10, seconds: 30, errors: 3, hints: 2, at: 900 },
    { user_id: 's1', id: 'x2', exercise_id: 'logic:and', percent: 100, score: 10, max_score: 10, seconds: 20, errors: 0, hints: 0, at: 1500 },
    { user_id: 's2', id: 'y1', exercise_id: 'logic:and', percent: 80, score: 8, max_score: 10, seconds: 40, errors: 1, hints: 0, at: 1200 },
  ];
  const subs = [{ id: 'sub', assignment_id: 'F', student_id: 's2', body: 'my answer', submitted_at: 5, score: 4, comment: 'good', graded_at: 6 }];
  const cells = computeCells([a, free], ['s1', 's2', 's3'], attempts, subs);
  assert.equal(cells['A:s1'].best.id, 'x1', 'the on-time attempt counts before a better late one');
  assert.equal(cells['A:s1'].late, false);
  assert.equal(cells['A:s1'].auto, 10, '50% of 20 points');
  assert.equal(cells['A:s1'].attempts, 2);
  assert.equal(cells['A:s2'].late, true, 'only a late attempt');
  assert.equal(cells['A:s2'].final, 16);
  assert.equal(cells['A:s3'].final, null);
  assert.equal(cells['F:s2'].answer.body, 'my answer');
  assert.equal(cells['F:s2'].final, 4, 'grade wins');
  assert.equal(cells['F:s2'].grade.comment, 'good');
  assert.equal(cellStatus(cells['A:s3'], { dueAt: 1000 }, 2000), 'overdue');
  assert.equal(cellStatus(cells['A:s3'], { dueAt: 1000 }, 500), 'todo');
  assert.equal(cellStatus(cells['A:s2'], { dueAt: 1000 }, 2000), 'late');
  assert.equal(cellStatus(cells['F:s2'], { dueAt: null }, 2000), 'graded');
});

test('stats and export: averages, totals, CSV escaping and formula guard, JSON', () => {
  const d = {
    class: { name: '7A', joinCode: 'ABC234' },
    students: [
      { id: 's1', login: 'aliya', displayName: 'Әлия, "А"' },
      { id: 's2', login: 'bolat', displayName: '=HYPERLINK("x")' },
    ],
    assignments: [
      { id: 'A', title: 'Logic', points: 10, dueAt: null, exerciseId: 'logic:and', description: '' },
      { id: 'B', title: 'Net', points: 20, dueAt: 1, exerciseId: null, description: '' },
    ],
    cells: {
      'A:s1': { best: { errors: 2, hints: 1 }, late: false, final: 8, answer: null, grade: null },
      'A:s2': { best: { errors: 0, hints: 0 }, late: true, final: 6, answer: null, grade: null },
      'B:s1': { best: null, late: false, final: 20, answer: { body: 'x', at: 1 }, grade: { score: 20, comment: '' } },
    },
  };
  const st = assignmentStats(d);
  assert.deepEqual(st[0], { id: 'A', done: 2, late: 1, total: 2, average: 7, averagePercent: 70, errors: 1, hints: 0.5 });
  assert.deepEqual(st[1], { id: 'B', done: 1, late: 0, total: 2, average: 20, averagePercent: 100, errors: null, hints: null });
  assert.deepEqual(studentTotals(d).map((t) => [t.points, t.max, t.percent, t.done]), [[28, 30, 93, 2], [6, 30, 20, 1]]);
  assert.deepEqual(classSummary(d), { students: 2, assignments: 2, completion: 75, averagePercent: 57 });
  assert.equal(csvField('a,b'), '"a,b"');
  assert.equal(csvField('=1+1'), "'=1+1");
  assert.equal(csvField('-5'), "'-5");
  const csv = toCsv(d, { student: 'Оқушы', login: 'Логин', total: 'Барлығы', percent: '%' });
  assert.ok(csv.startsWith('﻿Оқушы,Логин,Logic (10),Net (20),Барлығы,%\r\n'));
  assert.ok(csv.includes('"Әлия, ""А""",aliya,8,20,28/30,93'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")",bolat,6,,6/30,20`), 'formula neutralised and quoted');
  const j = toJson(d, 0);
  assert.equal(j.format, 'vil3d-class/1');
  assert.equal(j.students[0].work.A.final, 8);
  assert.equal(j.students[1].work.B, null);
});

test('teacher: classes, students from a list (credentials work), join codes, isolation', async () => {
  const s = await boot();
  try {
    const t1 = await s.account('teacher.one', 'teacher');
    const t2 = await s.account('teacher.two', 'teacher');
    const loner = await s.account('loner', 'student');
    assert.equal((await s.call('/api/teacher/classes', { method: 'POST', body: { name: ' ' }, as: t1 })).body.error, 'badName');
    const made = await s.call('/api/teacher/classes', { method: 'POST', body: { name: '7 «А»' }, as: t1 });
    assert.equal(made.status, 201);
    const cls = made.body.class;
    assert.equal(cls.joinCode.length, 6);
    const add = await s.call(`/api/teacher/classes/${cls.id}/students`, { method: 'POST', body: { names: ['Әлия Сейітқызы', 'Әлия Сейітқызы', '  ', 'Нұрлан Жұмабаев'] }, as: t1 });
    assert.equal(add.status, 201);
    assert.deepEqual(add.body.created.map((c) => c.login), ['aliya.seyitqyzy', 'aliya.seyitqyzy2', 'nurlan.zhumabaev']);
    const [aliya] = add.body.created;
    const signedIn = await s.signIn(aliya.login, aliya.password);
    assert.equal(signedIn.user.role, 'student', 'the generated password signs in');
    const stored = s.db.prepare('SELECT password_hash FROM users WHERE login = ?').get(aliya.login).password_hash;
    assert.ok(!stored.includes(aliya.password), 'only a hash is stored');
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/students`, { method: 'POST', body: { names: Array(61).fill('X Y') }, as: t1 })).body.error, 'badNames');

    // another teacher and students see nothing of it
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}`, { as: t2 })).status, 404);
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}`, { as: signedIn })).status, 403);
    assert.deepEqual((await s.call('/api/teacher/classes', { as: t2 })).body.classes, []);
    assert.equal((await s.call('/api/student/home', { as: t1 })).status, 403);

    // join by code: wrong codes are rate-limited, the right one works (twice is fine)
    for (let i = 0; i < 3; i++) assert.equal((await s.call('/api/student/join', { method: 'POST', body: { code: 'ZZZZZZ' }, as: loner })).body.error, 'badCode');
    assert.equal((await s.call('/api/student/join', { method: 'POST', body: { code: cls.joinCode }, as: loner })).status, 429);
    const other = await s.account('other.kid', 'student');
    assert.equal((await s.call('/api/student/join', { method: 'POST', body: { code: cls.joinCode.toLowerCase() }, as: other })).status, 200);
    assert.equal((await s.call('/api/student/join', { method: 'POST', body: { code: cls.joinCode }, as: other })).status, 200);
    const detail = (await s.call(`/api/teacher/classes/${cls.id}`, { as: t1 })).body;
    assert.equal(detail.students.length, 4);
    const names = detail.students.map((x) => x.displayName).filter((n) => /^[А-ЯӘҒҚҢӨҰҮҺІ]/.test(n));
    assert.deepEqual(names, ['Әлия Сейітқызы', 'Әлия Сейітқызы', 'Нұрлан Жұмабаев'], 'Kazakh alphabet order (code points would put Н before Ә)');

    // new code invalidates the old one; reset password ends sessions; removing keeps the account
    const fresh = (await s.call(`/api/teacher/classes/${cls.id}`, { method: 'PATCH', body: { newCode: true }, as: t1 })).body.class;
    assert.notEqual(fresh.joinCode, cls.joinCode);
    const reset = (await s.call(`/api/teacher/classes/${cls.id}/students/${aliya.id}/reset`, { method: 'POST', as: t1 })).body.credential;
    assert.notEqual(reset.password, aliya.password);
    assert.equal((await s.call('/api/auth/me', { as: signedIn })).body.user, null, 'old session ended');
    await s.signIn(aliya.login, reset.password);
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/students/${other.user.id}`, { method: 'DELETE', as: t1 })).status, 200);
    assert.ok(s.db.prepare('SELECT 1 FROM users WHERE id = ?').get(other.user.id));
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/students/${loner.user.id}/reset`, { method: 'POST', as: t1 })).status, 404, 'not in the class');
    // writes need the CSRF token
    assert.equal((await s.call('/api/teacher/classes', { method: 'POST', body: { name: 'x' }, as: { cookie: t1.cookie, csrf: 'nope' } })).body.error, 'csrf');
  } finally {
    await s.close();
  }
});

test('assignments, automatic scores from synced attempts, grades, answers, announcements, messages', async () => {
  const s = await boot();
  try {
    const t = await s.account('teacher.g', 'teacher');
    const cls = (await s.call('/api/teacher/classes', { method: 'POST', body: { name: '8B' }, as: t })).body.class;
    const [cred] = (await s.call(`/api/teacher/classes/${cls.id}/students`, { method: 'POST', body: { names: ['Бота Ахмет'] }, as: t })).body.created;
    const stu = await s.signIn(cred.login, cred.password);
    const now = Date.now();

    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/assignments`, { method: 'POST', body: { title: 'X', exerciseId: 'nope:task', points: 10 }, as: t })).body.error, 'badExercise');
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/assignments`, { method: 'POST', body: { title: 'X', points: 0 }, as: t })).body.error, 'badPoints');
    const lab = (await s.call(`/api/teacher/classes/${cls.id}/assignments`, { method: 'POST', body: { title: 'AND gate', exerciseId: 'logic:and', dueAt: now + 86400000, points: 20 }, as: t })).body.assignment;
    const essay = (await s.call(`/api/teacher/classes/${cls.id}/assignments`, { method: 'POST', body: { title: 'Why RAM?', description: 'Explain', points: 5 }, as: t })).body.assignment;

    // the student does the lab task: progress sync carries the attempts
    const snapshot = { attempts: [attempt('logic:and', 70, now - 5000), attempt('logic:and', 90, now - 1000)], exercises: {}, achievements: {}, meta: { createdAt: now } };
    assert.equal((await s.call('/api/progress', { method: 'PUT', body: { snapshot }, as: stu })).status, 200);
    assert.equal((await s.call(`/api/student/assignments/${essay.id}/answer`, { method: 'POST', body: { body: 'RAM keeps running programs.' }, as: stu })).status, 200);

    let d = (await s.call(`/api/teacher/classes/${cls.id}`, { as: t })).body;
    const key = `${lab.id}:${stu.user.id}`;
    assert.equal(d.cells[key].auto, 18, '90% of 20');
    assert.equal(d.cells[key].attempts, 2);
    assert.equal(d.cells[`${essay.id}:${stu.user.id}`].answer.body, 'RAM keeps running programs.');
    assert.equal(d.cells[`${essay.id}:${stu.user.id}`].final, null, 'not graded yet');

    assert.equal((await s.call(`/api/teacher/assignments/${lab.id}/grades/${stu.user.id}`, { method: 'PUT', body: { score: 21, comment: '' }, as: t })).body.error, 'badScore');
    await s.call(`/api/teacher/assignments/${lab.id}/grades/${stu.user.id}`, { method: 'PUT', body: { score: 20, comment: 'Excellent' }, as: t });
    await s.call(`/api/teacher/assignments/${essay.id}/grades/${stu.user.id}`, { method: 'PUT', body: { score: 4, comment: 'Add an example' }, as: t });
    d = (await s.call(`/api/teacher/classes/${cls.id}`, { as: t })).body;
    assert.equal(d.cells[key].final, 20);
    assert.equal(d.cells[key].auto, 18, 'the automatic score is still shown');

    const work = (await s.call(`/api/teacher/classes/${cls.id}/students/${stu.user.id}`, { as: t })).body;
    assert.equal(work.attempts.length, 2);
    assert.deepEqual(Object.keys(work.attempts[0]).sort(), ['at', 'errors', 'exerciseId', 'hints', 'id', 'maxScore', 'percent', 'score', 'seconds', 'status']);

    await s.call(`/api/teacher/classes/${cls.id}/announcements`, { method: 'POST', body: { title: 'Test on Friday', body: 'Logic gates.' }, as: t });
    await s.call(`/api/teacher/classes/${cls.id}/messages/${stu.user.id}`, { method: 'POST', body: { body: 'Well done!' }, as: t });

    const home = (await s.call('/api/student/home', { as: stu })).body;
    assert.equal(home.classes[0].name, '8B');
    assert.equal(home.classes[0].unread, 1);
    assert.equal(home.announcements[0].title, 'Test on Friday');
    const mine = home.assignments.find((a) => a.id === lab.id);
    assert.equal(mine.cell.final, 20);
    assert.equal(mine.cell.grade.comment, 'Excellent');

    const read = (await s.call(`/api/student/classes/${cls.id}/messages`, { as: stu })).body.messages;
    assert.deepEqual(read.map((m) => [m.mine, m.body]), [[false, 'Well done!']]);
    const replied = (await s.call(`/api/student/classes/${cls.id}/messages`, { method: 'POST', body: { body: 'Thank you' }, as: stu })).body.messages;
    assert.equal(replied.length, 2);
    assert.equal((await s.call('/api/student/home', { as: stu })).body.classes[0].unread, 0, 'reading marks as read');
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}`, { as: t })).body.unread[stu.user.id], 1);
    assert.equal((await s.call(`/api/student/classes/${cls.id}/messages`, { method: 'POST', body: { body: 'x'.repeat(2001) }, as: stu })).body.error, 'badBody');

    // clearing a grade returns to the automatic score; deleting cascades
    await s.call(`/api/teacher/assignments/${lab.id}/grades/${stu.user.id}`, { method: 'DELETE', as: t });
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}`, { as: t })).body.cells[key].final, 18);
    await s.call(`/api/teacher/classes/${cls.id}`, { method: 'DELETE', as: t });
    assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM assignments').get().n, 0);
    assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM messages').get().n, 0);
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'grade.set'").get().n, 2, 'grades are audited');
  } finally {
    await s.close();
  }
});
