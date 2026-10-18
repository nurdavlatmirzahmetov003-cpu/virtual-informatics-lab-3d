/**
 * Feedback, contact and certificates (0.36).
 *
 *   POST  /api/feedback                 anyone   { rating 1–5, liked?, improve?, name?, page?, lang? }
 *   GET   /api/feedback/summary         anyone   → { count, average, stars[5] }
 *   POST  /api/contact                  anyone   { name, contact?, topic, body }  → the administrator's inbox
 *   GET   /api/admin/feedback           admin    → { summary, items }
 *   DELETE /api/admin/feedback/:id      admin    (spam)
 *   GET   /api/admin/inbox              admin    → { messages }
 *   PATCH /api/admin/inbox/:id          admin    { status: new | read | done }
 *   POST  /api/certificates             student  → issues the certificate the progress on the server earns
 *   GET   /api/certificates/mine        signed in → { certificates, progress }
 *   GET   /api/certificates/:code       anyone   → public check of a printed certificate
 *
 * Guests may rate the site and write to the administrator (the Origin
 * check of app.ts still applies to them); a hidden "website" field catches
 * bots, and each IP gets a few messages an hour. Messages to a teacher go
 * through the classroom threads that already exist (V2-9).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import type { Db } from './db';
import { HttpError, json, readJson } from './http';
import { audit } from './audit';
import type { Role, UserRow } from './users';
import { createRouter, type RouteCtx } from './router';
import { loadProgress } from './progress';
import { summarize } from '@/services/progress/summary';

export interface FeedbackDeps {
  db: Db;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
  /** The signed-in user, or null for a guest. */
  userOf: (ctx: RouteCtx) => UserRow | null;
}

export const CONTACT_TOPICS = ['question', 'bug', 'idea', 'account', 'other'] as const;
const LANGS = ['kk', 'ru', 'en'];
/** Average (percent) that turns a certificate into a commendation. */
export const COMMENDATION_AVERAGE = 90;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+$/g, '').trim().slice(0, max) : '');

/** Fixed-window limiter per IP and action (in memory, like the login limiter). */
function limiter(max: number, windowMs: number, now: () => number) {
  const hits = new Map<string, number[]>();
  return (key: string) => {
    const t = now();
    const recent = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
    if (recent.length >= max) throw new HttpError(429, 'rateLimited', { retryAfter: Math.ceil((windowMs - (t - recent[0])) / 1000) });
    recent.push(t);
    hits.set(key, recent);
    if (hits.size > 5000) hits.clear();
  };
}

export function feedbackSummary(db: Db) {
  const rows = db.prepare('SELECT rating, COUNT(*) AS n FROM feedback GROUP BY rating').all() as Array<{ rating: number; n: number }>;
  const stars = [1, 2, 3, 4, 5].map((r) => rows.find((x) => x.rating === r)?.n ?? 0);
  const count = stars.reduce((a, b) => a + b, 0);
  const average = count ? Math.round((stars.reduce((sum, n, i) => sum + n * (i + 1), 0) / count) * 10) / 10 : null;
  return { count, average, stars };
}

/** What the server's own progress records earn: nothing, a certificate or a commendation. */
export function eligibility(db: Db, user: UserRow) {
  const s = summarize(loadProgress(db, user.id, user.created_at));
  const { completed, tasks } = s.totals;
  const average = Math.round(s.totals.average ?? 0);
  const kind = completed >= tasks && tasks > 0 ? (average >= COMMENDATION_AVERAGE ? 'commendation' : 'certificate') : null;
  return { kind, completed, total: tasks, average } as const;
}

/** BL-XXXX-XXXX: no look-alike letters (0/O, 1/I), hard to guess. */
function certificateCode() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = randomBytes(8);
  const s = [...b].map((x) => abc[x % abc.length]).join('');
  return `BL-${s.slice(0, 4)}-${s.slice(4)}`;
}

interface CertRow {
  code: string;
  kind: string;
  name: string;
  average: number;
  completed: number;
  total: number;
  issued_at: number;
}
const certJson = (c: CertRow) => ({ code: c.code, kind: c.kind, name: c.name, average: c.average, completed: c.completed, total: c.total, issuedAt: c.issued_at });

export function feedbackRoutes({ db, now, requireUser, checkCsrf, userOf }: FeedbackDeps) {
  const router = createRouter();
  const on = router.on;
  const feedbackLimit = limiter(5, 3_600_000, now);
  const contactLimit = limiter(5, 3_600_000, now);

  on('POST', '/api/feedback', async (ctx) => {
    const u = userOf(ctx);
    if (u) checkCsrf(ctx);
    const b = await readJson<Record<string, unknown>>(ctx.req, 8 * 1024);
    if (text(b.website, 100)) return json(ctx.res, 201, { ok: true }); // a bot filled the hidden field: pretend, keep nothing
    const rating = Number(b.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'badRating');
    feedbackLimit(`f:${ctx.ip}`);
    db.prepare('INSERT INTO feedback (id, user_id, name, rating, liked, improve, page, lang, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      randomUUID(),
      u?.id ?? null,
      u ? u.display_name : text(b.name, 80),
      rating,
      text(b.liked, 1000),
      text(b.improve, 1000),
      text(b.page, 120),
      LANGS.includes(String(b.lang)) ? String(b.lang) : 'kk',
      now(),
    );
    json(ctx.res, 201, { ok: true, summary: feedbackSummary(db) });
  });

  on('GET', '/api/feedback/summary', (ctx) => json(ctx.res, 200, feedbackSummary(db)));

  on('POST', '/api/contact', async (ctx) => {
    const u = userOf(ctx);
    if (u) checkCsrf(ctx);
    const b = await readJson<Record<string, unknown>>(ctx.req, 16 * 1024);
    if (text(b.website, 100)) return json(ctx.res, 201, { ok: true });
    const name = u ? u.display_name : text(b.name, 80);
    const body = text(b.body, 3000);
    const topic = CONTACT_TOPICS.find((x) => x === b.topic);
    if (!name) throw new HttpError(400, 'noName');
    if (!topic) throw new HttpError(400, 'badTopic');
    if (body.length < 5) throw new HttpError(400, 'tooShort');
    contactLimit(`c:${ctx.ip}`);
    const id = randomUUID();
    db.prepare('INSERT INTO contact_messages (id, user_id, name, contact, topic, body, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, u?.id ?? null, name, text(b.contact, 120), topic, body, now());
    json(ctx.res, 201, { ok: true });
  });

  // ── administrator ──
  on('GET', '/api/admin/feedback', (ctx) => {
    requireUser(ctx, 'admin');
    const items = db.prepare('SELECT f.id, f.name, f.rating, f.liked, f.improve, f.page, f.lang, f.created_at, u.login FROM feedback f LEFT JOIN users u ON u.id = f.user_id ORDER BY f.created_at DESC LIMIT 200').all() as Array<Record<string, unknown>>;
    json(ctx.res, 200, { summary: feedbackSummary(db), items: items.map((i) => ({ ...i, createdAt: i.created_at })) });
  });
  on('DELETE', '/api/admin/feedback/:id', (ctx, p) => {
    const a = requireUser(ctx, 'admin');
    checkCsrf(ctx);
    db.prepare('DELETE FROM feedback WHERE id = ?').run(p.id);
    audit(db, 'feedback.delete', { actor: a.id, target: p.id, ip: ctx.ip }, now());
    json(ctx.res, 200, { ok: true });
  });
  on('GET', '/api/admin/inbox', (ctx) => {
    requireUser(ctx, 'admin');
    const rows = db.prepare('SELECT m.id, m.name, m.contact, m.topic, m.body, m.status, m.created_at, u.login, u.role FROM contact_messages m LEFT JOIN users u ON u.id = m.user_id ORDER BY (m.status = \'new\') DESC, m.created_at DESC LIMIT 300').all() as Array<Record<string, unknown>>;
    json(ctx.res, 200, { messages: rows.map((r) => ({ ...r, createdAt: r.created_at })) });
  });
  on('PATCH', '/api/admin/inbox/:id', async (ctx, p) => {
    requireUser(ctx, 'admin');
    checkCsrf(ctx);
    const b = await readJson<{ status?: unknown }>(ctx.req, 1024);
    if (b.status !== 'new' && b.status !== 'read' && b.status !== 'done') throw new HttpError(400, 'badStatus');
    const r = db.prepare('UPDATE contact_messages SET status = ? WHERE id = ?').run(b.status, p.id);
    if (!r.changes) throw new HttpError(404, 'notFound');
    json(ctx.res, 200, { ok: true });
  });

  // ── certificates ──
  on('POST', '/api/certificates', (ctx) => {
    const u = requireUser(ctx, 'student');
    checkCsrf(ctx);
    const e = eligibility(db, u);
    if (!e.kind) throw new HttpError(409, 'notYet', { completed: e.completed, total: e.total });
    let row = db.prepare('SELECT * FROM certificates WHERE user_id = ? AND kind = ?').get(u.id, e.kind) as CertRow | undefined;
    if (!row) {
      let code = certificateCode();
      while (db.prepare('SELECT 1 FROM certificates WHERE code = ?').get(code)) code = certificateCode();
      db.prepare('INSERT INTO certificates (code, user_id, kind, name, average, completed, total, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(code, u.id, e.kind, u.display_name, e.average, e.completed, e.total, now());
      audit(db, 'certificate.issue', { actor: u.id, target: code, detail: e.kind, ip: ctx.ip }, now());
      row = db.prepare('SELECT * FROM certificates WHERE code = ?').get(code) as unknown as CertRow;
    }
    json(ctx.res, 201, { certificate: certJson(row) });
  });
  on('GET', '/api/certificates/mine', (ctx) => {
    const u = requireUser(ctx);
    const rows = db.prepare('SELECT * FROM certificates WHERE user_id = ? ORDER BY issued_at').all(u.id) as unknown as CertRow[];
    json(ctx.res, 200, { certificates: rows.map(certJson), progress: u.role === 'student' ? eligibility(db, u) : null });
  });
  on('GET', '/api/certificates/:code', (ctx, p) => {
    const row = db.prepare('SELECT * FROM certificates WHERE code = ?').get(p.code.toUpperCase().slice(0, 20)) as CertRow | undefined;
    if (!row) throw new HttpError(404, 'notFound');
    json(ctx.res, 200, { certificate: certJson(row) });
  });

  return router.route;
}
