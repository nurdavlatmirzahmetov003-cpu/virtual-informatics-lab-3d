import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { createUser } from '../server/users.ts';
import { TASKS } from '../src/services/progress/catalog.ts';
import { ACHIEVEMENT_IDS, evaluateAchievements, summarize } from '../src/services/progress/index.ts';
import { readFileSync } from 'node:fs';

const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;
const ORIGIN = 'http://localhost:5173';

async function boot() {
  let clock = Date.now();
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp({ db, config: { ...serverConfig({}), dbFile: ':memory:' }, now: () => clock });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, as, origin = ORIGIN } = {}) => {
    const headers = { 'content-type': 'application/json' };
    if (origin) headers.origin = origin;
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

/** A snapshot where every task is completed with the given percent. */
function finished(percent) {
  const at = Date.now() - 60_000;
  const attempts = TASKS.map((t, i) => ({ id: `a${i}`, exerciseId: t.id, score: (t.maxScore * percent) / 100, maxScore: t.maxScore, percent, seconds: 30, errors: 0, hints: 0, status: 'completed', at: at + i }));
  return { attempts, exercises: {}, achievements: {}, meta: { createdAt: at } };
}

test('feedback: guests rate the site; bots and floods are held back; other sites refused', async () => {
  const s = await boot();
  try {
    assert.deepEqual((await s.call('/api/feedback/summary')).body, { count: 0, average: null, stars: [0, 0, 0, 0, 0] });
    assert.equal((await s.call('/api/feedback', { method: 'POST', body: { rating: 6 } })).body.error, 'badRating');
    const r = await s.call('/api/feedback', { method: 'POST', body: { rating: 5, liked: 'Бит', improve: '', name: 'Ару', lang: 'kk' } });
    assert.equal(r.status, 201);
    assert.deepEqual(r.body.summary, { count: 1, average: 5, stars: [0, 0, 0, 0, 1] });
    // the hidden field: the bot hears "ok", nothing is kept
    await s.call('/api/feedback', { method: 'POST', body: { rating: 1, website: 'http://spam' } });
    await s.call('/api/feedback', { method: 'POST', body: { rating: 4 } });
    assert.deepEqual((await s.call('/api/feedback/summary')).body, { count: 2, average: 4.5, stars: [0, 0, 0, 1, 1] });
    assert.equal((await s.call('/api/feedback', { method: 'POST', body: { rating: 4 }, origin: 'https://evil.example' })).status, 403);
    for (let i = 0; i < 3; i++) await s.call('/api/feedback', { method: 'POST', body: { rating: 3 } });
    assert.equal((await s.call('/api/feedback', { method: 'POST', body: { rating: 3 } })).status, 429, 'five an hour per IP');
    s.tick(3_600_001);
    assert.equal((await s.call('/api/feedback', { method: 'POST', body: { rating: 3 } })).status, 201);
  } finally {
    await s.close();
  }
});

test('contact: guests write to the administrator; only the administrator reads and marks the inbox', async () => {
  const s = await boot();
  try {
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { name: '', topic: 'bug', body: 'Батырма жұмыс істемейді' } })).body.error, 'noName');
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { name: 'Бек', topic: 'spam', body: 'Сәлем, сұрақ бар' } })).body.error, 'badTopic');
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { name: 'Бек', topic: 'bug', body: 'hi' } })).body.error, 'tooShort');
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { name: 'Бек', contact: 'bek@example.kz', topic: 'bug', body: 'Батырма жұмыс істемейді' } })).status, 201);
    const student = await s.account('st.fb', 'student', 'Дана');
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { topic: 'idea', body: 'Тағы ойын қосыңыз' } })).body.error, 'noName', 'a guest must give a name');
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { topic: 'idea', body: 'Тағы ойын қосыңыз' }, as: { ...student, csrf: 'wrong' } })).status, 403, 'signed in: CSRF');
    assert.equal((await s.call('/api/contact', { method: 'POST', body: { topic: 'idea', body: 'Тағы ойын қосыңыз' }, as: student })).status, 201, 'the account name is used');

    assert.equal((await s.call('/api/admin/inbox', { as: student })).status, 403);
    const admin = await s.account('ad.fb', 'admin');
    const inbox = (await s.call('/api/admin/inbox', { as: admin })).body.messages;
    assert.deepEqual(inbox.map((m) => [m.name, m.status]).sort(), [
      ['Бек', 'new'],
      ['Дана', 'new'],
    ]);
    const bek = inbox.find((m) => m.name === 'Бек');
    assert.equal(bek.contact, 'bek@example.kz');
    assert.equal((await s.call(`/api/admin/inbox/${bek.id}`, { method: 'PATCH', body: { status: 'done' }, as: admin })).status, 200);
    assert.equal((await s.call(`/api/admin/inbox/${bek.id}`, { method: 'PATCH', body: { status: 'weird' }, as: admin })).body.error, 'badStatus');
    assert.equal((await s.call('/api/admin/inbox', { as: admin })).body.messages.find((m) => m.id === bek.id).status, 'done');

    await s.call('/api/feedback', { method: 'POST', body: { rating: 2, improve: 'реклама' } });
    const fb = (await s.call('/api/admin/feedback', { as: admin })).body;
    assert.equal(fb.items.length, 1);
    assert.equal((await s.call(`/api/admin/feedback/${fb.items[0].id}`, { method: 'DELETE', as: admin })).status, 200);
    assert.equal((await s.call('/api/admin/feedback', { as: admin })).body.summary.count, 0);
  } finally {
    await s.close();
  }
});

test('certificates: only for a finished course, commendation from 90 %, one code per kind, anyone can check it', async () => {
  const s = await boot();
  try {
    const a = await s.account('cert.a', 'student', 'Әлия Нұрланқызы');
    const b = await s.account('cert.b', 'student', 'Бауыржан');
    const teacher = await s.account('cert.t', 'teacher');
    assert.equal((await s.call('/api/certificates', { method: 'POST', as: a })).body.error, 'notYet');
    assert.equal((await s.call('/api/certificates', { method: 'POST', as: teacher })).status, 403);

    await s.call('/api/progress', { method: 'PUT', body: { snapshot: finished(95) }, as: a });
    const mine = (await s.call('/api/certificates/mine', { as: a })).body;
    assert.deepEqual(mine.progress, { kind: 'commendation', completed: TASKS.length, total: TASKS.length, average: 95 });
    const issued = (await s.call('/api/certificates', { method: 'POST', as: a })).body.certificate;
    assert.match(issued.code, /^BL-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    assert.equal(issued.kind, 'commendation');
    assert.equal(issued.name, 'Әлия Нұрланқызы');
    assert.equal((await s.call('/api/certificates', { method: 'POST', as: a })).body.certificate.code, issued.code, 'asking again gives the same certificate');

    await s.call('/api/progress', { method: 'PUT', body: { snapshot: finished(70) }, as: b });
    assert.equal((await s.call('/api/certificates', { method: 'POST', as: b })).body.certificate.kind, 'certificate');

    const check = await s.call(`/api/certificates/${issued.code.toLowerCase()}`, { origin: null });
    assert.equal(check.status, 200);
    assert.equal(check.body.certificate.name, 'Әлия Нұрланқызы');
    assert.equal((await s.call('/api/certificates/BL-NOPE-NOPE')).status, 404);
  } finally {
    await s.close();
  }
});

test('the commendation badge: every task done with an average of 90 % or more', () => {
  assert.ok(ACHIEVEMENT_IDS.includes('honors'));
  const byPercent = (p) => {
    const exercises = Object.fromEntries(
      TASKS.map((t) => [t.id, { best: { percent: p, score: p, maxScore: 100, status: 'completed', hints: 0, errors: 0, seconds: 30 }, attempts: 1, completedAt: 1, completedOnAttempt: 1, firstAt: 1, lastAt: 1 }]),
    );
    return evaluateAchievements(summarize({ exercises })).find((a) => a.id === 'honors').unlocked;
  };
  assert.equal(byPercent(95), true);
  assert.equal(byPercent(80), false);
  for (const lang of ['kk', 'ru', 'en']) {
    const d = JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8'));
    assert.ok(d.achievements.items.honors.name && d.certificate.kinds.commendation && d.feedback.stars['5'] && d.contact.topics.bug, lang);
  }
});
