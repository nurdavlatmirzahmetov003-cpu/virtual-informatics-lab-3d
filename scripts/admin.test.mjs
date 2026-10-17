import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDb, migrate } from '../server/db.ts';
import { createApp } from '../server/app.ts';
import { serverConfig } from '../server/env.ts';
import { LoginLimiter } from '../server/auth/rateLimit.ts';
import { createUser } from '../server/users.ts';
import { clientIp } from '../server/http.ts';

// test-only credentials, generated per run — not real accounts
const pw = (tag) => `T3st-${tag}-${Math.random().toString(36).slice(2, 10)}`;
const ORIGIN = 'http://localhost:5173';

async function boot({ file = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'vil-admin-'));
  const dbFile = file ? join(dir, 'lab.db') : ':memory:';
  const db = openDb(dbFile);
  migrate(db);
  const config = { ...serverConfig({}), dbFile, backupDir: join(dir, 'backups') };
  const limiter = new LoginLimiter(3, 10);
  const app = createApp({ db, config, limiter, resetLimiter: new LoginLimiter(4, 4), aiStatus: () => ({ provider: null, model: null }), extra: [async (req, res) => (req.url.startsWith('/api/ai/') ? (res.writeHead(200, { 'content-type': 'application/json' }), res.end('{"ai":true}'), true) : false)] });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (path, { method = 'GET', body, raw, as, ip } = {}) => {
    const headers = { origin: ORIGIN };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (as) {
      headers.cookie = as.cookie;
      headers['x-csrf-token'] = as.csrf;
    }
    if (ip) headers['x-forwarded-for'] = ip;
    const res = await fetch(base + path, { method, headers, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
    const type = res.headers.get('content-type') ?? '';
    return { status: res.status, headers: res.headers, body: type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()) };
  };
  const signIn = async (login, password, ip) => {
    const r = await call('/api/auth/login', { method: 'POST', body: { login, password }, ip });
    return { status: r.status, cookie: r.headers.get('set-cookie')?.split(';')[0], setCookie: r.headers.get('set-cookie'), csrf: r.body.csrfToken, user: r.body.user };
  };
  const account = async (login, role) => {
    const p = pw(login);
    const user = await createUser(db, { login, displayName: login, role, password: p });
    return { ...(await signIn(login, p)), password: p, id: user.id };
  };
  return { db, dir, call, signIn, account, limiter, close: () => new Promise((r) => server.close(r)).then(() => (db.close(), rmSync(dir, { recursive: true, force: true }))) };
}

test('client IP: X-Forwarded-For only from a trusted proxy', () => {
  const req = (remote, xff) => ({ socket: { remoteAddress: remote }, headers: xff ? { 'x-forwarded-for': xff } : {} });
  assert.equal(clientIp(req('127.0.0.1', '10.0.0.7, 10.0.0.1'), 'loopback'), '10.0.0.7');
  assert.equal(clientIp(req('::ffff:127.0.0.1', '10.0.0.7'), 'loopback'), '10.0.0.7');
  assert.equal(clientIp(req('203.0.113.5', '10.0.0.7'), 'loopback'), '203.0.113.5', 'a stranger cannot spoof its address');
  assert.equal(clientIp(req('127.0.0.1', '10.0.0.7'), 'none'), '127.0.0.1');
  assert.equal(clientIp(req('::ffff:192.168.1.4'), 'loopback'), '192.168.1.4');
});

test('users: search, role and block with guards (self, last admin), sessions end', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    const t = await s.account('tima.teacher', 'teacher');
    const st = await s.account('aru.student', 'student');
    assert.equal((await s.call('/api/admin/users', { as: t })).status, 403);
    let r = (await s.call('/api/admin/users?q=ARU', { as: admin })).body;
    assert.deepEqual(r.users.map((u) => u.login), ['aru.student']);
    assert.equal(r.total, 3);
    assert.deepEqual((await s.call('/api/admin/users?role=teacher', { as: admin })).body.users.map((u) => u.login), ['tima.teacher']);

    assert.equal((await s.call(`/api/admin/users/${admin.id}`, { method: 'PATCH', body: { disabled: true }, as: admin })).body.error, 'self');
    assert.equal((await s.call(`/api/admin/users/${admin.id}`, { method: 'PATCH', body: { role: 'teacher' }, as: admin })).body.error, 'self');
    // block the student: their session ends and they cannot sign in
    r = (await s.call(`/api/admin/users/${st.id}`, { method: 'PATCH', body: { disabled: true }, as: admin })).body;
    assert.deepEqual(r.changes, ['blocked']);
    assert.equal((await s.call('/api/auth/me', { as: st })).body.user, null);
    assert.equal((await s.signIn('aru.student', st.password)).status, 401);
    assert.deepEqual((await s.call('/api/admin/users?status=blocked', { as: admin })).body.users.map((u) => u.login), ['aru.student']);
    await s.call(`/api/admin/users/${st.id}`, { method: 'PATCH', body: { disabled: false }, as: admin });
    assert.equal((await s.signIn('aru.student', st.password)).status, 200);

    // promote the teacher to admin, then the first admin may step down — but the last one may not
    await s.call(`/api/admin/users/${t.id}`, { method: 'PATCH', body: { role: 'admin' }, as: admin });
    const t2 = await s.signIn('tima.teacher', t.password);
    assert.equal((await s.call(`/api/admin/users/${admin.id}`, { method: 'PATCH', body: { role: 'teacher' }, as: t2 })).status, 200);
    const admin2 = await s.signIn('root.admin', admin.password);
    assert.equal((await s.call(`/api/admin/users/${t.id}`, { method: 'PATCH', body: { disabled: true }, as: admin2 })).status, 403, 'no longer an admin');
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get().n, 1);
    assert.equal((await s.call(`/api/admin/users/${t.id}`, { method: 'PATCH', body: { displayName: '  ' }, as: t2 })).body.error, 'badName');
    assert.ok(s.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'user.update'").get().n >= 3);
  } finally {
    await s.close();
  }
});

test('reset links: one-time, expire, strong password, rate-limited, end sessions', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    const st = await s.account('bek.student', 'student');
    const { token, expiresAt } = (await s.call(`/api/admin/users/${st.id}/reset-link`, { method: 'POST', as: admin })).body;
    assert.ok(token.length >= 40 && expiresAt > Date.now());
    assert.ok(!JSON.stringify(s.db.prepare('SELECT * FROM password_resets').all()).includes(token), 'only the hash is stored');
    assert.equal((await s.call(`/api/auth/reset?token=${token}`)).body.login, 'bek.student');
    assert.equal((await s.call('/api/auth/reset', { method: 'POST', body: { token, password: 'short' } })).body.error, 'password.tooShort');
    const fresh = pw('new');
    assert.equal((await s.call('/api/auth/reset', { method: 'POST', body: { token, password: fresh } })).status, 200);
    assert.equal((await s.call('/api/auth/me', { as: st })).body.user, null, 'old sessions ended');
    assert.equal((await s.signIn('bek.student', fresh)).status, 200);
    assert.equal((await s.call('/api/auth/reset', { method: 'POST', body: { token, password: pw('again') } })).body.error, 'badToken', 'one time only');
    // a new link replaces the old one; an expired one does not work
    const a = (await s.call(`/api/admin/users/${st.id}/reset-link`, { method: 'POST', as: admin })).body.token;
    const b = (await s.call(`/api/admin/users/${st.id}/reset-link`, { method: 'POST', as: admin })).body.token;
    assert.equal((await s.call(`/api/auth/reset?token=${a}`)).status, 404);
    s.db.prepare('UPDATE password_resets SET expires_at = 1').run();
    assert.equal((await s.call(`/api/auth/reset?token=${b}`)).status, 404);
    // wrong tokens are rate-limited
    for (let i = 0; i < 2; i++) await s.call('/api/auth/reset?token=xxxxxxxxxxxxxxxxxxxxxxxxxxxx');
    assert.equal((await s.call(`/api/auth/reset?token=${b}`)).status, 429);
  } finally {
    await s.close();
  }
});

test('schools and classes: create, assign, move a class to another teacher', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    const t1 = await s.account('t.one', 'teacher');
    const t2 = await s.account('t.two', 'teacher');
    const st = await s.account('s.one', 'student');
    const school = (await s.call('/api/admin/schools', { method: 'POST', body: { name: '№12 мектеп-лицей' }, as: admin })).body.id;
    assert.equal((await s.call('/api/admin/schools', { method: 'POST', body: { name: ' ' }, as: admin })).body.error, 'badName');
    await s.call(`/api/admin/users/${t1.id}`, { method: 'PATCH', body: { schoolId: school }, as: admin });
    assert.equal((await s.call(`/api/admin/users/${t1.id}`, { method: 'PATCH', body: { schoolId: 'nope' }, as: admin })).body.error, 'badSchool');
    assert.deepEqual((await s.call(`/api/admin/users?school=${school}`, { as: admin })).body.users.map((u) => u.login), ['t.one']);
    const cls = (await s.call('/api/teacher/classes', { method: 'POST', body: { name: '9Б' }, as: t1 })).body.class;
    let classes = (await s.call('/api/admin/classes', { as: admin })).body.classes;
    assert.equal(classes[0].teacherName, 't.one');
    assert.equal(classes[0].schoolId, school, 'a class starts in its teacher’s school');
    assert.equal((await s.call(`/api/admin/classes/${cls.id}`, { method: 'PATCH', body: { teacherId: st.id }, as: admin })).body.error, 'badTeacher');
    await s.call(`/api/admin/classes/${cls.id}`, { method: 'PATCH', body: { teacherId: t2.id, schoolId: null }, as: admin });
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}`, { as: t1 })).status, 404, 'the old teacher lost it');
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}`, { as: t2 })).status, 200);
    let schools = (await s.call('/api/admin/schools', { as: admin })).body.schools;
    assert.deepEqual([schools[0].users, schools[0].classes], [1, 0]);
    await s.call(`/api/admin/schools/${school}`, { method: 'PATCH', body: { name: 'Лицей №12' }, as: admin });
    await s.call(`/api/admin/schools/${school}`, { method: 'DELETE', as: admin });
    schools = (await s.call('/api/admin/schools', { as: admin })).body.schools;
    assert.equal(schools.length, 0);
    classes = (await s.call('/api/admin/classes', { as: admin })).body.classes;
    assert.equal(classes.length, 1, 'classes stay');
  } finally {
    await s.close();
  }
});

test('settings: validated, public banner, join / registration / AI switches, session length', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    const t = await s.account('t.one', 'teacher');
    const st = await s.account('s.one', 'student');
    assert.equal((await s.call('/api/admin/settings', { method: 'PUT', body: { sessionHours: 0 }, as: admin })).body.error, 'badSetting');
    assert.equal((await s.call('/api/admin/settings', { method: 'PUT', body: { hacker: true }, as: admin })).body.error, 'badSetting');
    const r = await s.call('/api/admin/settings', {
      method: 'PUT',
      body: { banner: { kk: 'Ертең 10:00-де техникалық жұмыс', ru: '', en: '', tone: 'warning' }, allowJoinByCode: false, allowTeacherRegistration: false, aiEnabled: false, sessionHours: 2 },
      as: admin,
    });
    assert.equal(r.body.settings.sessionHours, 2);
    const pub = (await s.call('/api/public')).body;
    assert.equal(pub.settings.banner.kk, 'Ертең 10:00-де техникалық жұмыс');
    assert.equal(pub.settings.allowJoinByCode, false);
    assert.equal(pub.settings.sessionHours, undefined, 'only public settings');
    const cls = (await s.call('/api/teacher/classes', { method: 'POST', body: { name: 'X' }, as: t })).body.class;
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/students`, { method: 'POST', body: { names: ['A B'] }, as: t })).body.error, 'registrationDisabled');
    assert.equal((await s.call(`/api/teacher/classes/${cls.id}/students`, { method: 'POST', body: { names: ['A B'] }, as: admin })).status, 201, 'the admin still can');
    assert.equal((await s.call('/api/student/join', { method: 'POST', body: { code: cls.joinCode }, as: st })).body.error, 'joinDisabled');
    assert.equal((await s.call('/api/ai/recommend', { method: 'POST', body: {} })).body.error, 'ai-disabled');
    const again = await s.signIn('t.one', t.password);
    assert.match(again.setCookie, /Max-Age=7200/, '2-hour sessions');
    await s.call('/api/admin/settings', { method: 'PUT', body: { aiEnabled: true }, as: admin });
    assert.deepEqual((await s.call('/api/ai/recommend', { method: 'POST', body: {} })).body, { ai: true });
  } finally {
    await s.close();
  }
});

test('content: only learning texts, placeholders kept, reset to default, public overrides', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    const kk = JSON.parse(readFileSync(new URL('../src/locales/kk.json', import.meta.url), 'utf8'));
    const deviceKey = `devices.router.name`;
    assert.equal(typeof kk.devices.router.name, 'string');
    const put = (body) => s.call('/api/admin/content', { method: 'PUT', body, as: admin });
    assert.equal((await put({ key: 'auth.title', lang: 'kk', value: 'x' })).body.error, 'badKey', 'the interface is not editable');
    assert.equal((await put({ key: 'devices.nothing.here', lang: 'kk', value: 'x' })).body.error, 'badKey');
    assert.equal((await put({ key: deviceKey, lang: 'de', value: 'x' })).body.error, 'badLang');
    assert.equal((await put({ key: 'tasks.overview', lang: 'ru', value: 'Готово: {done}' })).body.error, 'placeholders', '{total} is missing');
    assert.equal((await put({ key: deviceKey, lang: 'kk', value: 'Маршрутизатор (роутер)' })).body.result, 'set');
    assert.equal((await put({ key: 'tasks.overview', lang: 'en', value: 'Finished {done} of {total}' })).body.result, 'set');
    let pub = (await s.call('/api/public')).body;
    assert.equal(pub.content.kk[deviceKey], 'Маршрутизатор (роутер)');
    assert.equal(pub.content.en['tasks.overview'], 'Finished {done} of {total}');
    assert.equal((await put({ key: deviceKey, lang: 'kk', value: null })).body.result, 'reset');
    assert.equal((await put({ key: 'tasks.overview', lang: 'en', value: JSON.parse(readFileSync(new URL('../src/locales/en.json', import.meta.url), 'utf8')).tasks.overview })).body.result, 'reset', 'the default text removes the override');
    pub = (await s.call('/api/public')).body;
    assert.deepEqual(pub.content, { kk: {}, ru: {}, en: {} });
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action LIKE 'content.%'").get().n, 4);
  } finally {
    await s.close();
  }
});

test('security: login activity, limiter blocks lifted, IP blocks (never own / local), audit search', async () => {
  const s = await boot();
  try {
    const admin = await s.account('root.admin', 'admin');
    await s.account('kid', 'student');
    for (let i = 0; i < 3; i++) await s.signIn('kid', 'Wrong-pass-123', '10.0.0.9');
    assert.equal((await s.signIn('kid', 'Wrong-pass-123', '10.0.0.9')).status, 429);
    let sec = (await s.call('/api/admin/security', { as: admin })).body;
    assert.equal(sec.activity.failsByIp[0].ip, '10.0.0.9');
    assert.equal(sec.activity.last24h['login.fail'], 3);
    const blocked = sec.limiter.find((b) => b.ip === '10.0.0.9' && b.login === 'kid');
    assert.ok(blocked && blocked.retryAfter > 0);
    await s.call('/api/admin/security/clear', { method: 'POST', body: { key: blocked.key }, as: admin });
    assert.equal((await s.signIn('kid', 'Wrong-pass-123', '10.0.0.9')).status, 401, 'can try again');

    assert.equal((await s.call('/api/admin/ip-blocks', { method: 'POST', body: { ip: '127.0.0.1' }, as: admin })).body.error, 'ownIp');
    assert.equal((await s.call('/api/admin/ip-blocks', { method: 'POST', body: { ip: 'not an ip!' }, as: admin })).body.error, 'badIp');
    await s.call('/api/admin/ip-blocks', { method: 'POST', body: { ip: '10.0.0.9', reason: 'brute force', hours: 24 }, as: admin });
    assert.equal((await s.call('/api/health', { ip: '10.0.0.9' })).body.error, 'ipBlocked');
    assert.equal((await s.call('/api/health', { ip: '10.0.0.8' })).status, 200);
    sec = (await s.call('/api/admin/security', { as: admin })).body;
    assert.deepEqual(sec.ipBlocks.map((b) => [b.ip, b.reason]), [['10.0.0.9', 'brute force']]);
    await s.call('/api/admin/ip-blocks/10.0.0.9', { method: 'DELETE', as: admin });
    assert.equal((await s.call('/api/health', { ip: '10.0.0.9' })).status, 200);

    const audit = (await s.call('/api/admin/audit?action=security.', { as: admin })).body;
    assert.deepEqual(audit.entries.map((e) => e.action).sort(), ['security.blockIp', 'security.unblockIp', 'security.unblockLogin']);
    assert.equal(audit.entries[0].actor, 'root.admin');
    assert.ok((await s.call('/api/admin/audit?q=10.0.0.9', { as: admin })).body.entries.length >= 3);
  } finally {
    await s.close();
  }
});

test('backups: snapshot, download, restore (sessions end), upload check, safe names; health', async () => {
  const s = await boot({ file: true });
  try {
    const admin = await s.account('root.admin', 'admin');
    await s.call('/api/admin/schools', { method: 'POST', body: { name: 'Before' }, as: admin });
    const made = (await s.call('/api/admin/backups', { method: 'POST', as: admin })).body.backup;
    assert.match(made.name, /^lab-\d{8}-\d{6}-manual\.db$/);
    const file = await s.call(`/api/admin/backups/${made.name}/download`, { as: admin });
    assert.equal(file.headers.get('content-disposition'), `attachment; filename="${made.name}"`);
    assert.equal(file.body.subarray(0, 15).toString('latin1'), 'SQLite format 3');
    assert.equal((await s.call(`/api/admin/backups/..%2Flab.db/download`, { as: admin })).body.error, 'badName');

    await s.call('/api/admin/schools', { method: 'POST', body: { name: 'After' }, as: admin });
    const restored = await s.call(`/api/admin/backups/${made.name}/restore`, { method: 'POST', as: admin });
    assert.equal(restored.status, 200);
    assert.match(restored.body.safety.name, /before-restore/);
    assert.match(restored.headers.get('set-cookie'), /Max-Age=0/);
    assert.equal((await s.call('/api/auth/me', { as: admin })).body.user, null, 'everyone signs in again');
    const again = await s.signIn('root.admin', admin.password);
    assert.deepEqual((await s.call('/api/admin/schools', { as: again })).body.schools.map((x) => x.name), ['Before']);
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'backup.restore'").get().n, 1);

    assert.equal((await s.call('/api/admin/backups/upload', { method: 'POST', raw: Buffer.from('not a database at all'.repeat(40)), as: again })).body.error, 'badBackup');
    const up = await s.call('/api/admin/backups/upload', { method: 'POST', raw: file.body, as: again });
    assert.equal(up.status, 201);
    const list = (await s.call('/api/admin/backups', { as: again })).body.backups.map((b) => b.name);
    assert.equal(list.length, 3);
    await s.call(`/api/admin/backups/${up.body.backup.name}`, { method: 'DELETE', as: again });
    assert.equal((await s.call('/api/admin/backups', { as: again })).body.backups.length, 2);

    const h = (await s.call('/api/admin/health', { as: again })).body;
    assert.deepEqual(h.database.migrations, ['001_init', '002_classroom', '003_admin', '004_game']);
    assert.equal(h.backups.count, 2);
    assert.ok(h.database.size > 0 && h.server.node.startsWith('v'));
    assert.ok(h.warnings.includes('cookieNotSecure') && !h.warnings.includes('noRecentBackup'));
    assert.deepEqual((await s.call('/api/admin/health/integrity', { method: 'POST', as: again })).body.result, ['ok']);
  } finally {
    await s.close();
  }
});
