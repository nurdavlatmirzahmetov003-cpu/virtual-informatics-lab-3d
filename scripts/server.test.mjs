import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { hashPassword, passwordProblem, verifyPassword } from '../server/auth/password.ts';
import { LoginLimiter } from '../server/auth/rateLimit.ts';
import { createAdmin } from '../server/cli.ts';
import { createUser } from '../server/users.ts';

// test-only credentials, generated per run — not real accounts
const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;

async function boot() {
  const db = openDb(':memory:');
  migrate(db);
  const config = { ...serverConfig({}), dbFile: ':memory:' };
  const app = createApp({ db, config, limiter: new LoginLimiter(3, 10) });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, cookie, csrf, origin } = {}) => {
    const headers = { 'content-type': 'application/json' };
    if (cookie) headers.cookie = cookie;
    if (csrf) headers['x-csrf-token'] = csrf;
    if (origin) headers.origin = origin;
    const res = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    return { status: res.status, body: await res.json(), setCookie: res.headers.get('set-cookie') };
  };
  const signIn = async (login, password) => {
    const r = await call('/api/auth/login', { method: 'POST', body: { login, password } });
    return { ...r, cookie: r.setCookie?.split(';')[0], csrf: r.body.csrfToken };
  };
  return { db, call, signIn, close: () => new Promise((r) => server.close(r)) };
}

test('migrations: every table, applied once, recorded', () => {
  const db = openDb(':memory:');
  const first = migrate(db);
  assert.deepEqual(first, ['001_init', '002_classroom', '003_admin']);
  assert.deepEqual(migrate(db), [], 'a second run applies nothing');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((r) => r.name);
  for (const t of ['users', 'schools', 'classes', 'class_members', 'assignments', 'submissions', 'attempts', 'grades', 'announcements', 'messages', 'achievements', 'xp_events', 'sessions', 'audit_log', 'schema_migrations']) {
    assert.ok(tables.includes(t), `table ${t}`);
  }
  assert.throws(() => db.prepare("INSERT INTO users (id, login, display_name, role, password_hash, created_at) VALUES ('x', 'a', 'A', 'hacker', 'h', 1)").run(), /CHECK/, 'roles are checked');
});

test('passwords: scrypt hashes, never the password; strength rules', async () => {
  const p = pw('hash');
  const h = await hashPassword(p);
  assert.match(h, /^scrypt\$16384\$8\$1\$/);
  assert.ok(!h.includes(p));
  assert.ok(await verifyPassword(p, h));
  assert.equal(await verifyPassword(p + 'x', h), false);
  assert.notEqual(await hashPassword(p), h, 'a fresh salt each time');
  assert.equal(passwordProblem('short1'), 'tooShort');
  assert.equal(passwordProblem('onlylettersherexx'), 'tooSimple');
  assert.equal(passwordProblem('letters-and-123'), null);
});

test('login: httpOnly session cookie, /me, wrong password, logout needs CSRF', async () => {
  const s = await boot();
  const p = pw('stu');
  await createUser(s.db, { login: 'Aigerim', displayName: 'Айгерім', role: 'student', password: p });
  assert.equal((await s.call('/api/auth/me')).body.user, null, 'guest');
  const bad = await s.call('/api/auth/login', { method: 'POST', body: { login: 'aigerim', password: 'wrong-pass-1' } });
  assert.equal(bad.status, 401);
  assert.equal(bad.body.error, 'invalidCredentials');
  assert.equal((await s.call('/api/auth/login', { method: 'POST', body: { login: 'nobody', password: p } })).body.error, 'invalidCredentials', 'unknown login: same answer');
  const ok = await s.signIn('AIGERIM', p);
  assert.equal(ok.status, 200);
  assert.match(ok.setCookie, /HttpOnly/);
  assert.match(ok.setCookie, /SameSite=Lax/);
  assert.equal(ok.body.user.role, 'student');
  assert.equal(ok.body.user.password_hash, undefined, 'no hash leaves the server');
  const me = await s.call('/api/auth/me', { cookie: ok.cookie });
  assert.equal(me.body.user.login, 'aigerim');
  assert.equal((await s.call('/api/auth/logout', { method: 'POST', cookie: ok.cookie })).status, 403, 'no CSRF token');
  assert.equal((await s.call('/api/auth/logout', { method: 'POST', cookie: ok.cookie, csrf: ok.csrf })).status, 200);
  assert.equal((await s.call('/api/auth/me', { cookie: ok.cookie })).body.user, null, 'session gone');
  const log = s.db.prepare('SELECT action FROM audit_log ORDER BY at').all().map((r) => r.action);
  assert.ok(log.includes('login.fail') && log.includes('login.ok') && log.includes('logout'));
  const sess = s.db.prepare('SELECT token_hash FROM sessions').all();
  assert.equal(sess.length, 0);
  await s.close();
});

test('rate limit: repeated failures are blocked with Retry-After seconds', async () => {
  const s = await boot();
  const p = pw('rl');
  await createUser(s.db, { login: 'bolat', displayName: 'Болат', role: 'student', password: p });
  for (let i = 0; i < 3; i++) assert.equal((await s.call('/api/auth/login', { method: 'POST', body: { login: 'bolat', password: 'nope-nope-1' } })).status, 401);
  const blocked = await s.call('/api/auth/login', { method: 'POST', body: { login: 'bolat', password: p } });
  assert.equal(blocked.status, 429, 'even the right password waits');
  assert.ok(blocked.body.retryAfter > 0);
  await s.close();
});

test('CSRF and origin: foreign origins and missing tokens are refused', async () => {
  const s = await boot();
  const p = pw('csrf');
  await createUser(s.db, { login: 'dana', displayName: 'Дана', role: 'student', password: p });
  assert.equal((await s.call('/api/auth/login', { method: 'POST', body: { login: 'dana', password: p }, origin: 'https://evil.example' })).status, 403);
  const ok = await s.signIn('dana', p);
  assert.equal((await s.call('/api/progress', { method: 'PUT', cookie: ok.cookie, body: { snapshot: {} } })).status, 403);
  assert.equal((await s.call('/api/progress', { method: 'PUT', cookie: ok.cookie, csrf: 'forged', body: { snapshot: {} } })).status, 403);
  await s.close();
});

test('roles: every endpoint checks who is asking', async () => {
  const s = await boot();
  const [ps, pt, pa] = [pw('s'), pw('t'), pw('a')];
  await createUser(s.db, { login: 'stu', displayName: 'S', role: 'student', password: ps });
  await createUser(s.db, { login: 'tea', displayName: 'T', role: 'teacher', password: pt });
  await createAdmin(s.db, { login: 'adm', displayName: 'A', password: pa });
  const [stu, tea, adm] = [await s.signIn('stu', ps), await s.signIn('tea', pt), await s.signIn('adm', pa)];
  assert.equal((await s.call('/api/admin/users')).status, 401, 'anonymous');
  assert.equal((await s.call('/api/admin/users', { cookie: stu.cookie })).status, 403, 'student');
  assert.equal((await s.call('/api/admin/users', { cookie: tea.cookie })).status, 403, 'teacher');
  const list = await s.call('/api/admin/users', { cookie: adm.cookie });
  assert.equal(list.status, 200);
  assert.equal(list.body.users.length, 3);
  assert.equal((await s.call('/api/progress', { cookie: tea.cookie })).status, 403, 'progress is a student thing');
  assert.equal((await s.call('/api/teacher/classes', { cookie: stu.cookie })).status, 403);
  assert.equal((await s.call('/api/teacher/classes', { cookie: tea.cookie })).status, 200);
  // admin creates a teacher; weak passwords and duplicate logins are refused
  const np = pw('new');
  const created = await s.call('/api/admin/users', { method: 'POST', cookie: adm.cookie, csrf: adm.csrf, body: { login: 'new.teacher', displayName: 'Жаңа', role: 'teacher', password: np } });
  assert.equal(created.status, 201);
  assert.equal((await s.call('/api/admin/users', { method: 'POST', cookie: adm.cookie, csrf: adm.csrf, body: { login: 'weak', displayName: 'W', role: 'student', password: 'short' } })).body.error, 'password.tooShort');
  assert.equal((await s.call('/api/admin/users', { method: 'POST', cookie: adm.cookie, csrf: adm.csrf, body: { login: 'new.teacher', displayName: 'D', role: 'student', password: np } })).status, 409);
  assert.equal((await s.call('/api/admin/users', { method: 'POST', cookie: stu.cookie, csrf: stu.csrf, body: { login: 'x', role: 'admin' } })).status, 403, 'students cannot create users');
  // a disabled account cannot sign in, and its open session stops working
  s.db.prepare("UPDATE users SET disabled = 1 WHERE login = 'stu'").run();
  assert.equal((await s.call('/api/auth/me', { cookie: stu.cookie })).body.user, null);
  assert.equal((await s.call('/api/auth/login', { method: 'POST', body: { login: 'stu', password: ps } })).status, 401);
  await s.close();
});

test('progress: the server merges the browser snapshot; ids dedupe; earliest unlock wins', async () => {
  const s = await boot();
  const p = pw('prog');
  await createUser(s.db, { login: 'erlan', displayName: 'Ерлан', role: 'student', password: p });
  const me = await s.signIn('erlan', p);
  const attempt = (id, exerciseId, percent, at) => ({ id, exerciseId, score: percent / 10, maxScore: 10, percent, seconds: 30, errors: 0, hints: 0, status: percent === 100 ? 'completed' : 'incomplete', at });
  const snap = { attempts: [attempt('a1', 'connect:pc', 60, 1000), attempt('a2', 'connect:pc', 100, 2000)], exercises: {}, achievements: { firstStep: 2000 }, meta: { createdAt: 1 } };
  const put = await s.call('/api/progress', { method: 'PUT', cookie: me.cookie, csrf: me.csrf, body: { snapshot: snap } });
  assert.equal(put.status, 200);
  assert.equal(put.body.snapshot.attempts.length, 2);
  assert.equal(put.body.snapshot.exercises['connect:pc'].best.percent, 100);
  // the same attempts again plus one new and an earlier unlock time
  const again = { ...snap, attempts: [...snap.attempts, attempt('a3', 'sim:fix', 100, 3000)], achievements: { firstStep: 1500 } };
  const put2 = await s.call('/api/progress', { method: 'PUT', cookie: me.cookie, csrf: me.csrf, body: { snapshot: again } });
  assert.equal(put2.body.snapshot.attempts.length, 3, 'a1 and a2 are not duplicated');
  assert.equal(put2.body.snapshot.achievements.firstStep, 1500);
  // junk is ignored, not stored
  await s.call('/api/progress', { method: 'PUT', cookie: me.cookie, csrf: me.csrf, body: { snapshot: { attempts: [{ id: 'x', exerciseId: 5 }, 'nope'], achievements: { 'bad id!': 1 } } } });
  const got = await s.call('/api/progress', { cookie: me.cookie });
  assert.equal(got.body.snapshot.attempts.length, 3);
  assert.deepEqual(Object.keys(got.body.snapshot.achievements), ['firstStep']);
  await s.close();
});

test('first admin: created only through the CLI core with a typed password', async () => {
  const db = openDb(':memory:');
  migrate(db);
  await assert.rejects(createAdmin(db, { login: 'root', displayName: 'R', password: 'weak' }), /password\.tooShort/);
  const u = await createAdmin(db, { login: 'root', displayName: 'Root', password: pw('root') });
  assert.equal(u.role, 'admin');
  assert.equal(db.prepare("SELECT action FROM audit_log WHERE action = 'admin.create.cli'").all().length, 1);
});

test('account progress: merges local and server copies, pushes what was done offline, retries failed pushes', async () => {
  const { createAccountProgressRepository, accountKey } = await import('../src/services/progress/accountRepository.ts');
  const { memoryStore } = await import('../src/services/progress/repository.ts');
  const { applyAttempt, emptySnapshot } = await import('../src/services/progress/records.ts');
  const att = (id, at) => ({ id, exerciseId: 'sim:fix', score: 10, maxScore: 10, percent: 100, seconds: 9, errors: 0, hints: 0, status: 'completed', at });
  let serverSnap = applyAttempt(emptySnapshot(1), att('s1', 100));
  const puts = [];
  let online = true;
  const server = {
    get: async () => ({ snapshot: serverSnap }),
    put: async (s) => {
      if (!online) throw new Error('offline');
      puts.push(s);
      serverSnap = s;
    },
  };
  const store = memoryStore();
  // done offline earlier on this computer, under this user's own key
  store.setItem(accountKey('u1'), JSON.stringify({ version: 3, state: applyAttempt(emptySnapshot(1), att('l1', 200)) }));
  const repo = createAccountProgressRepository('u1', server, store, 5);
  const loaded = await repo.load();
  assert.deepEqual(loaded.attempts.map((a) => a.id).sort(), ['l1', 's1']);
  await repo.flush();
  assert.equal(puts.length, 1, 'the offline attempt goes up');
  online = false;
  repo.save(applyAttempt(loaded, att('n1', 300)));
  await repo.flush();
  assert.equal(puts.length, 1, 'offline: nothing sent');
  online = true;
  await repo.flush();
  assert.equal(puts.length, 2, 'retried once back online');
  assert.ok(puts[1].attempts.some((a) => a.id === 'n1'));
  assert.ok(store.getItem(accountKey('u1')).includes('n1'), 'kept locally all along');
});

test('auth texts exist in kk, ru and en; .env.example holds no secrets', async () => {
  const { readFileSync } = await import('node:fs');
  const get = (o, k) => k.split('.').reduce((x, p) => x?.[p], o);
  for (const lang of ['kk', 'ru', 'en']) {
    const d = JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8'));
    for (const k of ['title', 'login', 'password', 'signIn', 'signOut', 'offline', 'errors.invalidCredentials', 'errors.rateLimited', 'errors.offline', 'roles.admin', 'roles.teacher', 'roles.student', 'forbidden.title', 'admin.title', 'admin.errors.password_tooShort', 'admin.errors.loginTaken']) {
      assert.equal(typeof get(d.auth, k), 'string', `${lang}: auth.${k}`);
    }
  }
  const example = readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
  for (const line of example.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]*(KEY|SECRET|PASSWORD|TOKEN)[A-Z_]*)=(.*)$/);
    if (m) assert.equal(m[3].trim(), '', `${m[1]} must be empty in .env.example`);
  }
});
