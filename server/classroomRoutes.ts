/**
 * Classroom REST routes (V2-9). Every route checks the role first; every
 * state-changing one the CSRF token; ownership checks are in classroom.ts.
 *
 * Teacher (teacher | admin):
 *   GET    /api/teacher/classes                         → { classes }
 *   POST   /api/teacher/classes                         { name } → { class }
 *   GET    /api/teacher/classes/:id                     → class detail (students, assignments, cells, announcements, unread)
 *   PATCH  /api/teacher/classes/:id                     { name?, newCode? }
 *   DELETE /api/teacher/classes/:id
 *   POST   /api/teacher/classes/:id/students            { names[] } → { created: credentials (shown once) }
 *   GET    /api/teacher/classes/:id/students/:sid       → { student, attempts }
 *   DELETE /api/teacher/classes/:id/students/:sid       (leaves the class, the account stays)
 *   POST   /api/teacher/classes/:id/students/:sid/reset → { credential }
 *   POST   /api/teacher/classes/:id/assignments         { title, description, exerciseId, dueAt, points }
 *   DELETE /api/teacher/assignments/:aid
 *   PUT    /api/teacher/assignments/:aid/grades/:sid    { score, comment }
 *   DELETE /api/teacher/assignments/:aid/grades/:sid    (back to the automatic score)
 *   POST   /api/teacher/classes/:id/announcements       { title, body }
 *   DELETE /api/teacher/announcements/:nid
 *   GET    /api/teacher/classes/:id/messages/:sid       → { messages }
 *   POST   /api/teacher/classes/:id/messages/:sid       { body }
 *
 * Student:
 *   GET    /api/student/home                            → { classes, assignments (with own cell), announcements }
 *   POST   /api/student/join                            { code } → { class }
 *   POST   /api/student/assignments/:aid/answer         { body }
 *   GET    /api/student/classes/:id/messages            → { messages }
 *   POST   /api/student/classes/:id/messages            { body }
 */
import type { Db } from './db';
import { HttpError, json, readJson } from './http';
import { audit } from './audit';
import type { LoginLimiter } from './auth/rateLimit';
import type { Role, UserRow } from './users';
import * as C from './classroom';
import { createRouter, type RouteCtx } from './router';
import type { SiteSettings } from './settings';

export interface ClassroomDeps {
  db: Db;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
  /** Wrong join codes count like failed logins (per student and IP). */
  joinLimiter: LoginLimiter;
  /** Site settings (V2-10): joining by code and teacher registration can be switched off. */
  settings: () => Pick<SiteSettings, 'allowJoinByCode' | 'allowTeacherRegistration'>;
}

export function classroomRoutes({ db, now, requireUser, checkCsrf, joinLimiter, settings }: ClassroomDeps) {
  const router = createRouter();
  const on = router.on;
  const teacher = (ctx: RouteCtx) => requireUser(ctx, 'teacher', 'admin');
  /** Teacher + CSRF for writes. */
  const teacherWrite = (ctx: RouteCtx) => {
    const u = teacher(ctx);
    checkCsrf(ctx);
    return u;
  };
  const studentWrite = (ctx: RouteCtx) => {
    const u = requireUser(ctx, 'student');
    checkCsrf(ctx);
    return u;
  };
  const log = (ctx: RouteCtx, actor: UserRow, action: string, target: string, detail = '') => audit(db, action, { actor: actor.id, target, ip: ctx.ip, detail }, now());
  /** Messaging is between the class's own teacher and a student. */
  const classTeacher = (cls: C.ClassRow, u: UserRow) => {
    if (cls.teacher_id !== u.id) throw new HttpError(403, 'forbidden');
  };

  // ── teacher ──
  on('GET', '/api/teacher/classes', (ctx) => json(ctx.res, 200, { classes: C.listClasses(db, teacher(ctx)) }));
  on('POST', '/api/teacher/classes', async (ctx) => {
    const u = teacherWrite(ctx);
    const b = await readJson<{ name?: unknown }>(ctx.req, 4096);
    const cls = C.createClass(db, u, b.name, now());
    log(ctx, u, 'class.create', cls.id);
    json(ctx.res, 201, { class: C.publicClass(db, cls) });
  });
  on('GET', '/api/teacher/classes/:id', (ctx, p) => {
    const u = teacher(ctx);
    json(ctx.res, 200, C.classDetail(db, C.ownClass(db, u, p.id), u.id));
  });
  on('PATCH', '/api/teacher/classes/:id', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const cls = C.ownClass(db, u, p.id);
    const b = await readJson<{ name?: unknown; newCode?: unknown }>(ctx.req, 4096);
    const next = C.updateClass(db, cls, b);
    if (b.newCode === true) log(ctx, u, 'class.newCode', cls.id);
    json(ctx.res, 200, { class: C.publicClass(db, next) });
  });
  on('DELETE', '/api/teacher/classes/:id', (ctx, p) => {
    const u = teacherWrite(ctx);
    const cls = C.ownClass(db, u, p.id);
    C.deleteClass(db, cls);
    log(ctx, u, 'class.delete', cls.id, cls.name);
    json(ctx.res, 200, { ok: true });
  });

  on('POST', '/api/teacher/classes/:id/students', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const cls = C.ownClass(db, u, p.id);
    if (u.role !== 'admin' && !settings().allowTeacherRegistration) throw new HttpError(403, 'registrationDisabled');
    const b = await readJson<{ names?: unknown }>(ctx.req, 64 * 1024);
    const created = await C.addStudents(db, cls, b.names, now());
    log(ctx, u, 'student.createMany', cls.id, `${created.length}`);
    json(ctx.res, 201, { created });
  });
  on('GET', '/api/teacher/classes/:id/students/:sid', (ctx, p) => {
    const u = teacher(ctx);
    json(ctx.res, 200, C.studentWork(db, C.ownClass(db, u, p.id), p.sid));
  });
  on('DELETE', '/api/teacher/classes/:id/students/:sid', (ctx, p) => {
    const u = teacherWrite(ctx);
    const cls = C.ownClass(db, u, p.id);
    C.removeMember(db, cls, p.sid);
    log(ctx, u, 'class.removeStudent', p.sid, cls.id);
    json(ctx.res, 200, { ok: true });
  });
  on('POST', '/api/teacher/classes/:id/students/:sid/reset', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const credential = await C.resetStudentPassword(db, C.ownClass(db, u, p.id), p.sid);
    log(ctx, u, 'student.resetPassword', p.sid);
    json(ctx.res, 200, { credential });
  });

  on('POST', '/api/teacher/classes/:id/assignments', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const cls = C.ownClass(db, u, p.id);
    const a = C.createAssignment(db, cls, u, await readJson(ctx.req, 16 * 1024), now());
    json(ctx.res, 201, { assignment: C.publicAssignment(a) });
  });
  on('DELETE', '/api/teacher/assignments/:aid', (ctx, p) => {
    const u = teacherWrite(ctx);
    const { assignment } = C.ownAssignment(db, u, p.aid);
    C.deleteAssignment(db, assignment);
    log(ctx, u, 'assignment.delete', assignment.id, assignment.title);
    json(ctx.res, 200, { ok: true });
  });
  on('PUT', '/api/teacher/assignments/:aid/grades/:sid', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const { assignment, cls } = C.ownAssignment(db, u, p.aid);
    C.setGrade(db, u, assignment, cls, p.sid, await readJson(ctx.req, 8 * 1024), now());
    log(ctx, u, 'grade.set', p.sid, assignment.id);
    json(ctx.res, 200, { ok: true });
  });
  on('DELETE', '/api/teacher/assignments/:aid/grades/:sid', (ctx, p) => {
    const u = teacherWrite(ctx);
    const { assignment, cls } = C.ownAssignment(db, u, p.aid);
    C.clearGrade(db, assignment, cls, p.sid);
    log(ctx, u, 'grade.clear', p.sid, assignment.id);
    json(ctx.res, 200, { ok: true });
  });

  on('POST', '/api/teacher/classes/:id/announcements', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const id = C.postAnnouncement(db, C.ownClass(db, u, p.id), u, await readJson(ctx.req, 16 * 1024), now());
    json(ctx.res, 201, { id });
  });
  on('DELETE', '/api/teacher/announcements/:nid', (ctx, p) => {
    C.deleteAnnouncement(db, teacherWrite(ctx), p.nid);
    json(ctx.res, 200, { ok: true });
  });

  on('GET', '/api/teacher/classes/:id/messages/:sid', (ctx, p) => {
    const u = teacher(ctx);
    const cls = C.ownClass(db, u, p.id);
    classTeacher(cls, u);
    C.checkStudentInClass(db, cls, p.sid);
    json(ctx.res, 200, { messages: C.thread(db, cls.id, u.id, p.sid, now()) });
  });
  on('POST', '/api/teacher/classes/:id/messages/:sid', async (ctx, p) => {
    const u = teacherWrite(ctx);
    const cls = C.ownClass(db, u, p.id);
    classTeacher(cls, u);
    C.checkStudentInClass(db, cls, p.sid);
    const b = await readJson<{ body?: unknown }>(ctx.req, 16 * 1024);
    C.sendMessage(db, cls.id, u.id, p.sid, b.body, now());
    json(ctx.res, 201, { messages: C.thread(db, cls.id, u.id, p.sid, now()) });
  });

  // ── student ──
  on('GET', '/api/student/home', (ctx) => json(ctx.res, 200, C.studentHome(db, requireUser(ctx, 'student'))));
  on('POST', '/api/student/join', async (ctx) => {
    const u = studentWrite(ctx);
    if (!settings().allowJoinByCode) throw new HttpError(403, 'joinDisabled');
    const wait = joinLimiter.retryAfter(ctx.ip, u.id, now());
    if (wait > 0) throw new HttpError(429, 'rateLimited', { retryAfter: wait });
    const b = await readJson<{ code?: unknown }>(ctx.req, 1024);
    const cls = C.joinByCode(db, u, b.code, now());
    if (!cls) {
      joinLimiter.fail(ctx.ip, u.id, now());
      throw new HttpError(404, 'badCode');
    }
    log(ctx, u, 'class.join', cls.id);
    json(ctx.res, 200, { class: { id: cls.id, name: cls.name } });
  });
  on('POST', '/api/student/assignments/:aid/answer', async (ctx, p) => {
    const u = studentWrite(ctx);
    const b = await readJson<{ body?: unknown }>(ctx.req, 16 * 1024);
    C.submitAnswer(db, u, p.aid, b.body, now());
    json(ctx.res, 200, { ok: true });
  });
  on('GET', '/api/student/classes/:id/messages', (ctx, p) => {
    const u = requireUser(ctx, 'student');
    const cls = C.studentClass(db, u, p.id);
    json(ctx.res, 200, { messages: C.thread(db, cls.id, u.id, cls.teacher_id, now()) });
  });
  on('POST', '/api/student/classes/:id/messages', async (ctx, p) => {
    const u = studentWrite(ctx);
    const cls = C.studentClass(db, u, p.id);
    const b = await readJson<{ body?: unknown }>(ctx.req, 16 * 1024);
    C.sendMessage(db, cls.id, u.id, cls.teacher_id, b.body, now());
    json(ctx.res, 201, { messages: C.thread(db, cls.id, u.id, cls.teacher_id, now()) });
  });

  /** True when a classroom route answered. */
  return router.route;
}
