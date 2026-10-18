import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { createUser } from '../server/users.ts';
import { acceptKey, decodeFrames, encodeFrame } from '../server/live/ws.ts';
import { QUIZ_BANK, buildQuiz, quizPoints, topicCounts } from '../src/labs/LiveGames/quiz.ts';
import { applyMove, faultOrder, newRacer, rankRacers, symptomsOf, PENALTY_S, raceSeconds } from '../src/labs/LiveGames/races.ts';
import { STEP_IDS, STEPS } from '../src/labs/AssemblyLab/index.ts';
import { PC_SCENARIO, endsOf } from '../src/labs/ConnectLab/index.ts';

// test-only credentials, generated per run — not real accounts
const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;
const ORIGIN = 'http://localhost:5173';

const masked = (text) => {
  const payload = Buffer.from(text);
  const mask = Buffer.from([1, 2, 3, 4]);
  const len = payload.length;
  const head = len < 126 ? Buffer.from([0x81, 0x80 | len]) : Buffer.from([0x81, 0x80 | 126, len >> 8, len & 255]);
  return Buffer.concat([head, mask, Buffer.from(payload.map((b, i) => b ^ mask[i & 3]))]);
};

test('websocket frames: RFC accept key, masked client frames, 16-bit lengths, partial input, no unmasked frames', () => {
  assert.equal(acceptKey('dGhlIHNhbXBsZSBub25jZQ=='), 's3pPLMBiTxaQ9kYGzzhZRbK+xOo=', 'the RFC 6455 example');
  const big = 'ж'.repeat(300);
  const both = Buffer.concat([masked('{"a":1}'), masked(big)]);
  const { frames, rest } = decodeFrames(both);
  assert.deepEqual(frames.map((f) => f.payload.toString()), ['{"a":1}', big]);
  assert.equal(rest.length, 0);
  const half = decodeFrames(both.subarray(0, both.length - 5));
  assert.equal(half.frames.length, 1, 'an incomplete frame waits for more bytes');
  assert.throws(() => decodeFrames(Buffer.from([0x81, 0x02, 0x68, 0x69])), /unmasked/);
  const out = encodeFrame(1, Buffer.from('x'.repeat(200)));
  assert.deepEqual([out[0], out[1], out.readUInt16BE(2)], [0x81, 126, 200]);
});

test('quiz bank: every device question, deterministic shuffles, the answer index points at the right option', () => {
  assert.ok(QUIZ_BANK.length >= 150, `${QUIZ_BANK.length} questions`);
  assert.equal(Object.values(topicCounts()).reduce((a, b) => a + b, 0), QUIZ_BANK.length);
  const a = buildQuiz(['network', 'mobile'], 12, 42);
  assert.deepEqual(a, buildQuiz(['network', 'mobile'], 12, 42));
  assert.equal(a.length, 12);
  assert.equal(new Set(a.map((q) => q.base)).size, 12, 'no repeats');
  assert.equal(new Set(a.slice(0, 9).map((q) => q.device)).size, 9, 'different devices first');
  for (const q of a) {
    const bank = QUIZ_BANK.find((b) => b.base === q.base);
    assert.equal(q.order[q.correct], bank.correct);
  }
  assert.equal(quizPoints(false, 9000, 10000), 0);
  assert.equal(quizPoints(true, 10000, 10000), 1000);
  assert.equal(quizPoints(true, 0, 10000), 500);
  assert.equal(quizPoints(true, 5000, 10000), 750);
});

test('races: the labs’ own rules decide; mistakes cost time; ranking', () => {
  // assembly: the right order installs everything; a wrong slot is a mistake
  let s = newRacer('assembly');
  s = applyMove('assembly', s, { t: 'place', step: 'cpu', at: 'mat' }, []).state;
  assert.equal(s.mistakes, 1);
  for (const step of STEP_IDS) s = applyMove('assembly', s, { t: 'place', step, at: STEPS[step].target }, []).state;
  assert.deepEqual([s.done, s.progress], [true, 1]);
  assert.equal(applyMove('assembly', s, { t: 'place', step: 'cpu', at: 'socket' }, []).ok, false, 'nothing after the finish');
  assert.equal(applyMove('assembly', newRacer('assembly'), { t: 'place', step: 'hack', at: 'socket' }, []).state.mistakes, 0, 'garbage is refused, not counted');

  // connect: monitor into the motherboard while a card is fitted → igpu mistake
  let c = newRacer('connect');
  const r = applyMove('connect', c, { t: 'plug', end: 'monitor', port: PC_SCENARIO.ports.find((p) => p.owner === 'motherboard' && p.kind === 'hdmi').id }, []);
  assert.equal(r.ok, false);
  assert.equal(r.message.key, 'connect.why.igpu');
  c = r.state;
  for (const end of endsOf(PC_SCENARIO)) {
    const port = PC_SCENARIO.ports.find((p) => p.kind === end.kind && (end.kind === 'hdmi' ? p.owner === 'gpu' : true) && !Object.values(c.plugs.plugged).includes(p.id));
    c = applyMove('connect', c, { t: 'plug', end: end.id, port: port.id }, []).state;
  }
  assert.deepEqual([c.done, c.mistakes], [true, 1]);

  // fault: the cause, not the symptom
  const faults = faultOrder(7);
  assert.equal(faults.length, 5);
  assert.deepEqual(faultOrder(7), faults, 'the same rounds for everyone');
  let f = newRacer('fault');
  f = applyMove('fault', f, { t: 'diagnose', cause: faults[0] === 'ram' ? 'gpu' : 'ram' }, faults).state;
  for (const cause of faults) f = applyMove('fault', f, { t: 'diagnose', cause }, faults).state;
  assert.deepEqual([f.done, f.mistakes, f.round], [true, 1, 5]);
  assert.equal(symptomsOf('ram').outcome, 'noRam');
  assert.equal(symptomsOf('cooler').shutdown, 'overheat');
  assert.equal(symptomsOf('psu').shutdown, 'psu');

  assert.equal(raceSeconds(1000, 61000, 2), 60 + 2 * PENALTY_S);
  const ranked = rankRacers([
    { id: 'slow', seconds: 90, progress: 1, mistakes: 0 },
    { id: 'dnf', seconds: null, progress: 0.9, mistakes: 0 },
    { id: 'fast', seconds: 70, progress: 1, mistakes: 3 },
    { id: 'dnf2', seconds: null, progress: 0.4, mistakes: 0 },
  ]);
  assert.deepEqual(ranked.map((x) => x.id), ['fast', 'slow', 'dnf', 'dnf2']);
});

// ── over the wire ──
async function boot() {
  let clock = Date.now();
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp({ db, config: { ...serverConfig({}), dbFile: ':memory:' }, now: () => clock });
  const server = createServer((req, res) => void app(req, res));
  server.on('upgrade', app.upgrade);
  await new Promise((r) => server.listen(0, r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
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
  /** A WebSocket client that keeps every message and can wait for one. */
  const wsAt = (path, as, origin = ORIGIN) =>
    new Promise((resolve) => {
      const sock = new WebSocket(`ws://127.0.0.1:${port}${path}`, { headers: { ...(as ? { cookie: as.cookie } : {}), origin } });
      const msgs = [];
      const waiters = [];
      const client = {
        msgs,
        last: (t = 'state') => [...msgs].reverse().find((m) => m.t === t),
        send: (m) => sock.send(JSON.stringify(m)),
        close: () => sock.close(),
        next: (pred, ms = 3000) =>
          new Promise((res, rej) => {
            const hit = msgs.find((m) => !m.__seen && pred(m));
            if (hit) return (hit.__seen = true), res(hit);
            const timer = setTimeout(() => rej(new Error('timeout waiting for a message')), ms);
            waiters.push({ pred, res: (m) => (clearTimeout(timer), res(m)) });
          }),
        closed: new Promise((res) => sock.addEventListener('close', (e) => res(e.code))),
      };
      sock.addEventListener('message', (e) => {
        const m = JSON.parse(e.data);
        msgs.push(m);
        const i = waiters.findIndex((w) => w.pred(m));
        if (i >= 0) {
          m.__seen = true;
          waiters.splice(i, 1)[0].res(m);
        }
      });
      sock.addEventListener('open', () => resolve(client));
      sock.addEventListener('error', () => resolve({ ...client, failed: true }));
    });
  const ws = (as, code, origin) => wsAt(`/api/live/ws?code=${code}`, as, origin);
  return { db, call, account, ws, wsAt, tick: (ms) => (clock += ms), close: () => new Promise((r) => server.close(r)) };
}

test('live quiz: join by code, the answer stays secret, server-timed points, reveal, reconnect, results saved', async () => {
  const s = await boot();
  const sockets = [];
  try {
    const t = await s.account('t.live', 'teacher', 'Мұғалім');
    const a = await s.account('aru', 'student', 'Ару');
    const b = await s.account('bek', 'student', 'Бек');
    assert.equal((await s.call('/api/live/rooms', { method: 'POST', body: { kind: 'quiz', title: 'Q', topics: [], count: 5 }, as: t })).body.error, 'badTopics');
    assert.equal((await s.call('/api/live/rooms', { method: 'POST', body: { kind: 'quiz', title: 'Q', topics: ['network'] }, as: a })).status, 403);
    const { id, code } = (await s.call('/api/live/rooms', { method: 'POST', body: { kind: 'quiz', title: 'Желі', topics: ['network'], count: 3, seconds: 20 }, as: t })).body;

    const anon = await s.ws(null, code);
    assert.ok(anon.failed, 'no session, no socket');
    const evil = await s.ws(a, code, 'https://evil.example');
    assert.ok(evil.failed, 'foreign origin refused');

    const host = await s.ws(t, code);
    const pa = await s.ws(a, code);
    const pb = await s.ws(b, code);
    sockets.push(host, pa, pb);
    let st = await host.next((m) => m.t === 'state' && m.room.players.length === 2);
    assert.equal(st.room.isHost, true);
    assert.deepEqual(st.room.players.map((p) => p.name).sort(), ['Ару', 'Бек']);
    pa.send({ t: 'start' });
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(host.last().room.status, 'lobby', 'a student cannot start');

    host.send({ t: 'start' });
    const q1 = await pa.next((m) => m.t === 'state' && m.room.quiz?.phase === 'question');
    assert.equal(q1.room.quiz.reveal, null);
    assert.ok(!JSON.stringify(q1).includes('"correct"'), 'the right answer is not sent before the reveal');
    const room = (await s.call('/api/live/rooms', { as: t })).body.rooms[0];
    assert.equal(room.status, 'running');

    s.tick(5000);
    pa.send({ t: 'answer', slot: 0 });
    await pa.next((m) => m.t === 'state' && m.room.quiz.myAnswer === 0);
    pa.send({ t: 'answer', slot: 1 });
    assert.equal((await pa.next((m) => m.t === 'error')).code, 'notNow', 'one answer per question');
    pb.send({ t: 'answer', slot: 2 });
    const rev = await pa.next((m) => m.t === 'state' && m.room.quiz.phase === 'reveal');
    const correct = rev.room.quiz.reveal.correct;
    assert.deepEqual(rev.room.quiz.reveal.counts, [1, 0, 1]);
    assert.equal(rev.room.quiz.reveal.myPoints, correct === 0 ? 875 : 0, '5 s of 20 used → 500 + 375');

    // reconnect: Bek drops and comes back to the same place
    pb.close();
    await pb.closed;
    const pb2 = await s.ws(b, code);
    sockets.push(pb2);
    const back = await pb2.next((m) => m.t === 'state');
    assert.equal(back.room.quiz.index, 0);
    assert.equal(back.room.quiz.myAnswer, 2, 'their answer is still there');

    // late joiners are refused once it runs
    const c = await s.account('late', 'student');
    const pc = await s.ws(c, code);
    assert.equal((await pc.next((m) => m.t === 'error')).code, 'started');

    for (let i = 1; i < 3; i++) {
      host.send({ t: 'next' });
      await host.next((m) => m.t === 'state' && m.room.quiz.index === i && m.room.quiz.phase === 'question');
      host.send({ t: 'reveal' });
      await host.next((m) => m.t === 'state' && m.room.quiz.index === i && m.room.quiz.phase === 'reveal');
    }
    host.send({ t: 'next' });
    const done = await host.next((m) => m.t === 'state' && m.room.status === 'finished');
    assert.equal(done.room.players[0].rank, 1);
    const past = (await s.call('/api/live/rooms', { as: t })).body.past;
    assert.equal(past.length, 1);
    const res = (await s.call(`/api/live/sessions/${past[0].id}`, { as: t })).body;
    assert.equal(res.results.length, 2);
    assert.equal(res.results[0].detail.of, 3);
    assert.equal((await s.call(`/api/live/sessions/${past[0].id}`, { as: a })).status, 403);
    assert.ok(id);
  } finally {
    for (const k of sockets) k.close?.();
    await s.close();
  }
});

test('live race: countdown, every move refereed on the server, finish by time + penalties', async () => {
  const s = await boot();
  const sockets = [];
  try {
    const t = await s.account('t.race', 'teacher');
    const a = await s.account('aru', 'student', 'Ару');
    const b = await s.account('bek', 'student', 'Бек');
    const { code } = (await s.call('/api/live/rooms', { method: 'POST', body: { kind: 'assembly', title: 'Жинау', minutes: 5 }, as: t })).body;
    const host = await s.ws(t, code);
    const pa = await s.ws(a, code);
    const pb = await s.ws(b, code);
    sockets.push(host, pa, pb);
    await host.next((m) => m.t === 'state' && m.room.players.length === 2);
    host.send({ t: 'start' });
    await pa.next((m) => m.t === 'state' && m.room.status === 'running');
    pa.send({ t: 'place', step: 'motherboard', at: 'mat' });
    assert.equal((await pa.next((m) => m.t === 'error')).code, 'notNow', 'not before the countdown ends');

    s.tick(3000);
    pa.send({ t: 'place', step: 'cpu', at: 'mat' });
    const fb = await pa.next((m) => m.t === 'feedback');
    assert.equal(fb.ok, false);
    for (const step of STEP_IDS) pa.send({ t: 'place', step, at: STEPS[step].target });
    s.tick(60_000);
    const mine = await pa.next((m) => m.t === 'state' && m.room.race.me?.done);
    assert.equal(mine.room.race.me.mistakes, 1);
    // Bek is half-way when the host ends it
    for (const step of STEP_IDS.slice(0, 4)) pb.send({ t: 'place', step, at: STEPS[step].target });
    await pb.next((m) => m.t === 'state' && m.room.race.me?.installed?.length === 4);
    host.send({ t: 'end' });
    const end = await host.next((m) => m.t === 'state' && m.room.status === 'finished');
    assert.deepEqual(end.room.players.map((p) => [p.name, p.rank, p.done]), [['Ару', 1, true], ['Бек', 2, false]]);
    assert.ok(end.room.players[0].score >= 10, 'time + 10 s penalty');
    const row = s.db.prepare('SELECT r.score, r.detail FROM live_results r JOIN users u ON u.id = r.user_id WHERE u.login = ?').get('bek');
    assert.equal(row.score, null, 'did not finish');
    assert.equal(JSON.parse(row.detail).progress, 4 / STEP_IDS.length);
  } finally {
    for (const k of sockets) k.close?.();
    await s.close();
  }
});

test('class events: the owning teacher sees presence and graded attempts live; other teachers and students see nothing', async () => {
  const s = await boot();
  const sockets = [];
  try {
    const t = await s.account('t.own', 'teacher');
    const other = await s.account('t.other', 'teacher');
    const admin = await s.account('root.admin', 'admin');
    const a = await s.account('aru.e', 'student', 'Ару');
    const b = await s.account('bek.e', 'student', 'Бек');
    const cls = (await s.call('/api/teacher/classes', { method: 'POST', body: { name: '9A' }, as: t })).body.class;
    s.db.prepare('INSERT INTO class_members (class_id, user_id, joined_at) VALUES (?, ?, ?)').run(cls.id, a.id, 0);

    const path = '/api/events/ws';
    assert.ok((await s.wsAt(path, null)).failed, 'no session, no socket');
    assert.ok((await s.wsAt(path, t, 'https://evil.example')).failed, 'foreign origin refused');

    const teacher = await s.wsAt(path, t);
    const stranger = await s.wsAt(path, other);
    const root = await s.wsAt(path, admin);
    sockets.push(teacher, stranger, root);
    assert.deepEqual((await teacher.next((m) => m.t === 'hello')).online, {});

    // Aru comes online: her teacher and the admin see it, the other teacher does not
    const sa = await s.wsAt(path, a);
    const sb = await s.wsAt(path, b);
    sockets.push(sa, sb);
    assert.equal((await sa.next((m) => m.t === 'hello')).role, 'student');
    const seen = await teacher.next((m) => m.t === 'presence');
    assert.deepEqual([seen.classIds, seen.studentId, seen.online], [[cls.id], a.id, true]);
    assert.equal((await root.next((m) => m.t === 'presence')).studentId, a.id);

    // a graded attempt arrives with the sync: name, task and score — nothing else
    const at = Date.now();
    const att = { id: 'ev-1', exerciseId: 'logic:and', score: 9, maxScore: 10, percent: 90, seconds: 40, errors: 0, hints: 0, status: 'completed', at };
    const snapshot = { attempts: [att], exercises: {}, achievements: {}, meta: { createdAt: 0 } };
    assert.equal((await s.call('/api/progress', { method: 'PUT', body: { snapshot }, as: a })).status, 200);
    const ev = await teacher.next((m) => m.t === 'attempt');
    assert.deepEqual([ev.name, ev.exerciseId, ev.percent, ev.completed, ev.classIds], ['Ару', 'logic:and', 90, true, [cls.id]]);
    assert.ok(!JSON.stringify(ev).includes('aru.e'), 'no login in events');
    // the same attempt synced again is not news
    await s.call('/api/progress', { method: 'PUT', body: { snapshot }, as: a });
    // Bek is in no class: his work reaches nobody
    await s.call('/api/progress', { method: 'PUT', body: { snapshot: { ...snapshot, attempts: [{ ...att, id: 'ev-2' }] } }, as: b });

    sa.close();
    const off = await teacher.next((m) => m.t === 'presence');
    assert.equal(off.online, false);
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(teacher.msgs.filter((m) => m.t === 'attempt').length, 1);
    assert.deepEqual(stranger.msgs.map((m) => m.t), ['hello'], 'another teacher sees nothing of this class');
    assert.deepEqual(sb.msgs.map((m) => m.t), ['hello'], 'students get no events');
  } finally {
    for (const k of sockets) k.close?.();
    await s.close();
  }
});
