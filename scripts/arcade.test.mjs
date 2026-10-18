import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { createUser } from '../server/users.ts';
import { DEVICES } from '../src/data/devices/devices.ts';
import { STEP_IDS, STEPS } from '../src/labs/AssemblyLab/steps.ts';
import { parseIp, parseMask, maskFromPrefix, sameSubnet } from '../src/labs/NetworkLab/ipv4.ts';
import {
  ARCADE,
  ARCADE_GAMES,
  PORT_JOBS,
  PORT_JOB_IDS,
  binaryRight,
  binaryRounds,
  deviceQuiz,
  deviceRounds,
  lookAlike,
  orderCards,
  portRounds,
  replayOrder,
  scoreRun,
  subnetRounds,
} from '../src/labs/Arcade/index.ts';

const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;
const ORIGIN = 'http://localhost:5173';
const locale = (lang) => JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8'));
const lookup = (dict, key) => key.split('.').reduce((n, p) => (n && typeof n === 'object' ? n[p] : undefined), dict);

/** A valid install order: each step after the ones it needs. */
function validOrder() {
  const done = [];
  while (done.length < STEP_IDS.length) done.push(STEP_IDS.find((s) => !done.includes(s) && STEPS[s].requires.every((r) => done.includes(r))));
  return done;
}

test('rounds are the same for the same seed and differ for another', () => {
  for (const make of [deviceRounds, portRounds, binaryRounds, subnetRounds, orderCards]) {
    assert.deepEqual(make(7), make(7));
    assert.notDeepEqual(make(7), make(8));
  }
});

test('device rounds: ten different devices, four distinct options with the answer among them', () => {
  for (const seed of [1, 2, 3, 99, 12345]) {
    const rounds = deviceRounds(seed);
    assert.equal(rounds.length, ARCADE.device.rounds);
    assert.equal(new Set(rounds.map((r) => r.device)).size, rounds.length);
    for (const r of rounds) {
      assert.equal(new Set(r.options).size, 4);
      assert.ok(r.options.includes(r.device));
      for (const o of r.options) assert.ok(DEVICES.some((d) => d.id === o));
      for (const o of r.options) if (o !== r.device) assert.ok(!lookAlike(o, r.device), `${o} looks like ${r.device}`);
      assert.ok(!r.device.endsWith('_cable'), 'cables are not asked');
    }
  }
  const live = deviceQuiz(6, 5);
  assert.equal(live.length, 6);
  for (const q of live) assert.equal(q.pick[q.correct], q.device);
});

test('port rounds: one right port per job, texts and port names exist in every language', () => {
  for (const r of portRounds(4)) {
    assert.equal(new Set(r.options).size, 4);
    assert.ok(r.options.includes(PORT_JOBS[r.job]));
  }
  for (const lang of ['kk', 'ru', 'en']) {
    const d = locale(lang);
    for (const job of PORT_JOB_IDS) {
      assert.equal(typeof lookup(d, `arcade.ports.jobs.${job}`), 'string', `${lang} job ${job}`);
      assert.equal(typeof lookup(d, `deviceUi.portTypes.${PORT_JOBS[job]}`), 'string', `${lang} port ${PORT_JOBS[job]}`);
    }
    for (const g of ARCADE_GAMES) assert.equal(typeof lookup(d, `arcade.games.${g}.title`), 'string', `${lang} ${g}`);
    for (const s of STEP_IDS) assert.equal(typeof lookup(d, `pcLab.steps.${s}.name`), 'string', `${lang} step ${s}`);
  }
});

test('build-the-PC replay: a valid order wins, a part too early is a mistake', () => {
  const good = validOrder();
  assert.deepEqual(replayOrder(good), { installed: good, mistakes: 0, done: true });
  const r = replayOrder(['cpu', 'motherboard', 'motherboard', ...good]);
  assert.equal(r.mistakes, 3, 'cpu before the board, the board twice, then the board again in `good`');
  assert.equal(r.done, true);
  assert.equal(replayOrder(['hack']).mistakes, 1);
});

test('binary and subnet rules', () => {
  assert.ok(binaryRight({ dir: 'toBin', value: 11 }, '1011'));
  assert.ok(binaryRight({ dir: 'toBin', value: 11 }, '0 1011'));
  assert.ok(!binaryRight({ dir: 'toBin', value: 11 }, '11'));
  assert.ok(binaryRight({ dir: 'toDec', value: 11 }, '11'));
  assert.ok(!binaryRight({ dir: 'toDec', value: 11 }, ''));
  const rounds = subnetRounds(31);
  let same = 0;
  for (const r of rounds) {
    assert.equal(r.same, sameSubnet(parseIp(r.a), parseIp(r.b), parseMask(maskFromPrefix(r.prefix))));
    assert.notEqual(r.a, r.b);
    if (r.same) same++;
  }
  assert.ok(same > 10 && same < 50, `${same} of ${rounds.length} on the same network`);
});

test('referee: a perfect run scores the most, guessing and speed hacks do not pay', () => {
  const seed = 2024;
  const right = deviceRounds(seed).map((r) => r.device);
  const fast = scoreRun('device', seed, right, 30_000);
  assert.ok(fast.ok);
  assert.equal(fast.result.correct, 10);
  assert.ok(fast.result.score > 1000 && fast.result.score <= 1500);
  const slow = scoreRun('device', seed, right, 140_000);
  assert.ok(slow.ok && slow.result.score < fast.result.score);
  assert.deepEqual(scoreRun('device', seed, right, 1000), { ok: false, reason: 'tooFast' });
  assert.deepEqual(scoreRun('device', seed, right, ARCADE.device.seconds * 1000 + 60_000), { ok: false, reason: 'expired' });
  assert.deepEqual(scoreRun('device', seed, 'nope', 30_000), { ok: false, reason: 'badAnswers' });
  assert.deepEqual(scoreRun('ports', seed, new Array(11).fill('rj45'), 30_000), { ok: false, reason: 'badAnswers' });

  const order = scoreRun('order', seed, validOrder(), 20_000);
  assert.ok(order.ok && order.result.score === 1500 - 20 * 10);
  const sloppy = scoreRun('order', seed, ['cpu', 'cpu', ...validOrder()], 20_000);
  assert.equal(sloppy.result.score, order.result.score - 200);

  // subnet: always "yes" earns less than knowing the answers
  const sub = subnetRounds(seed).slice(0, 40);
  const know = scoreRun('subnet', seed, sub.map((r) => r.same), 59_000);
  const guess = scoreRun('subnet', seed, sub.map(() => true), 59_000);
  assert.ok(know.ok && guess.ok && know.result.score > guess.result.score * 2);
  const bin = binaryRounds(seed).slice(0, 30);
  const answers = bin.map((b) => (b.dir === 'toBin' ? b.value.toString(2) : String(b.value)));
  const binary = scoreRun('binary', seed, answers, 58_000);
  assert.equal(binary.result.correct, 30);
  assert.deepEqual(scoreRun('binary', seed, answers, 5_000), { ok: false, reason: 'tooFast' });
});

// ── over the wire ──
async function boot() {
  let clock = Date.now();
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp({ db, config: { ...serverConfig({}), dbFile: ':memory:' }, now: () => clock });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, as } = {}) => {
    const headers = { 'content-type': 'application/json', origin: ORIGIN };
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
  return { db, call, account, tick: (ms) => (clock += ms), close: () => new Promise((r) => server.close(r)) };
}

test('server: runs are refereed on the server clock; class board ranks best scores, hides names when asked', async () => {
  const s = await boot();
  try {
    const teacher = await s.account('t.arena', 'teacher', 'Мұғалім');
    const a = await s.account('aru.a', 'student', 'Ару');
    const b = await s.account('bek.a', 'student', 'Бек');
    s.db.prepare('INSERT INTO classes (id, teacher_id, name, join_code, created_at) VALUES (?, ?, ?, ?, ?)').run('c1', teacher.id, '7А', 'JOIN01', Date.now());
    for (const u of [a, b]) s.db.prepare('INSERT INTO class_members (class_id, user_id, joined_at) VALUES (?, ?, ?)').run('c1', u.id, Date.now());

    assert.equal((await s.call('/api/arcade/start', { method: 'POST', body: { game: 'device' } })).status, 401, 'guests play locally');
    assert.equal((await s.call('/api/arcade/start', { method: 'POST', body: { game: 'chess' }, as: a })).body.error, 'badGame');

    // Ару: perfect device run in 40 s on the server clock
    const runA = (await s.call('/api/arcade/start', { method: 'POST', body: { game: 'device' }, as: a })).body;
    s.tick(40_000);
    const answers = deviceRounds(runA.seed).map((r) => r.device);
    const fin = await s.call('/api/arcade/finish', { method: 'POST', body: { runId: runA.runId, answers }, as: a });
    assert.equal(fin.status, 200);
    assert.equal(fin.body.result.correct, 10);
    assert.equal(fin.body.previousBest, null);
    assert.equal((await s.call('/api/arcade/finish', { method: 'POST', body: { runId: runA.runId, answers }, as: a })).body.error, 'noRun', 'a run counts once');

    // Бек: a challenge with Ару's seed, half right; then a too-fast run is refused and leaves no trace
    const runB = (await s.call('/api/arcade/start', { method: 'POST', body: { game: 'device', seed: runA.seed }, as: b })).body;
    assert.equal(runB.seed, runA.seed, 'same seed, same rounds');
    s.tick(60_000);
    const half = answers.map((x, i) => (i % 2 ? x : null));
    assert.equal((await s.call('/api/arcade/finish', { method: 'POST', body: { runId: runB.runId, answers: half }, as: b })).body.result.correct, 5);
    const cheat = (await s.call('/api/arcade/start', { method: 'POST', body: { game: 'device' }, as: b })).body;
    s.tick(500);
    assert.equal((await s.call('/api/arcade/finish', { method: 'POST', body: { runId: cheat.runId, answers }, as: b })).body.error, 'tooFast');
    assert.equal((await s.call('/api/arcade/finish', { method: 'POST', body: { runId: runA.runId, answers }, as: b })).body.error, 'noRun', 'not your run');

    const board = (await s.call('/api/arcade/board?game=device&scope=class&id=c1&period=week', { as: b })).body;
    assert.deepEqual(
      board.rows.map((r) => [r.rank, r.name, r.me]),
      [
        [1, 'Ару', false],
        [2, 'Бек', true],
      ],
    );
    assert.equal(board.me.rank, 2);

    // Ару hides her name: classmates see "Player 1", the teacher still sees it
    s.db.prepare('UPDATE users SET leaderboard_anon = 1 WHERE id = ?').run(a.id);
    assert.equal((await s.call('/api/arcade/board?game=device&scope=class&id=c1', { as: b })).body.rows[0].name, null);
    assert.equal((await s.call('/api/arcade/board?game=device&scope=class&id=c1', { as: teacher })).body.rows[0].name, 'Ару');
    const outsider = await s.account('out.a', 'student');
    assert.equal((await s.call('/api/arcade/board?game=device&scope=class&id=c1', { as: outsider })).status, 404);

    const me = (await s.call('/api/arcade/me', { as: a })).body;
    assert.equal(me.bests.device, fin.body.result.score);
    assert.deepEqual(me.boards.classes.map((c) => c.name), ['7А']);
    // a big score from a month ago counts all-time, not this week
    s.db.prepare('INSERT INTO arcade_runs (id, user_id, game, seed, started_at, finished_at, score, correct, total, mistakes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run('old', b.id, 'device', 1, Date.now() - 30 * 86_400_000, Date.now() - 30 * 86_400_000, 1499, 10, 10, 0);
    assert.equal((await s.call('/api/arcade/board?game=device&scope=class&id=c1&period=week', { as: b })).body.rows[0].me, false);
    assert.equal((await s.call('/api/arcade/board?game=device&scope=class&id=c1&period=all', { as: b })).body.rows[0].me, true);
  } finally {
    await s.close();
  }
});

test('live room «What device is this?»: four options, answers up to slot 3, stored as a quiz', async () => {
  const s = await boot();
  try {
    const t = await s.account('t.dev', 'teacher');
    const r = await s.call('/api/live/rooms', { method: 'POST', body: { kind: 'device', title: 'Құрылғылар', count: 4, seconds: 15 }, as: t });
    assert.equal(r.status, 201);
    assert.equal((await s.call('/api/live/rooms', { method: 'POST', body: { kind: 'device', title: 'x', count: 2 }, as: t })).body.error, 'badCount');
  } finally {
    await s.close();
  }
});
