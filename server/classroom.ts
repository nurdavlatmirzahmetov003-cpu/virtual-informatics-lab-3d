/**
 * Classroom data (V2-9): classes and members, assignments with automatic
 * scores from lab attempts, teacher grades, announcements and messages.
 *
 * Access rules live here, next to the queries: a teacher sees only their own
 * classes (an admin sees every class), a student only the classes they are a
 * member of. Anything else answers 404, so ids cannot be probed.
 */
import { randomUUID } from 'node:crypto';
import type { Db } from './db';
import { HttpError } from './http';
import { hashPassword } from './auth/password';
import { insertUser, userById, userByLogin, type UserRow } from './users';
import { generatePassword, joinCode, loginFromName, normalizeJoinCode, uniqueLogin } from './names';
import { taskById } from '@/services/progress/catalog';

export interface ClassRow {
  id: string;
  school_id: string | null;
  teacher_id: string;
  name: string;
  join_code: string;
  created_at: number;
}

export interface AssignmentRow {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string;
  exercise_id: string | null;
  due_at: number | null;
  points: number;
  created_at: number;
}

interface AttemptRow {
  user_id: string;
  id: string;
  exercise_id: string;
  score: number;
  max_score: number;
  percent: number;
  seconds: number;
  errors: number;
  hints: number;
  status: 'completed' | 'incomplete';
  at: number;
}

interface SubmissionRow {
  id: string;
  assignment_id: string;
  student_id: string;
  body: string;
  submitted_at: number;
  score: number | null;
  comment: string | null;
  graded_at: number | null;
}

export const LIMITS = { className: 60, title: 120, description: 2000, body: 4000, message: 2000, comment: 1000, studentsPerCall: 60, points: 100 } as const;

const notFound = () => new HttpError(404, 'notFound');

function text(value: unknown, max: number, code: string, { required = true } = {}): string {
  const s = typeof value === 'string' ? value.trim() : '';
  if ((required && !s) || s.length > max) throw new HttpError(400, code);
  return s;
}

function placeholders(n: number) {
  return Array.from({ length: n }, () => '?').join(', ');
}

// ── classes ────────────────────────────────────────────────────────────────

/** The class if `user` teaches it (or is an admin); 404 otherwise. */
export function ownClass(db: Db, user: UserRow, classId: string): ClassRow {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as ClassRow | undefined;
  if (!cls || (user.role !== 'admin' && cls.teacher_id !== user.id)) throw notFound();
  return cls;
}

export const isMember = (db: Db, classId: string, userId: string) => !!db.prepare('SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?').get(classId, userId);

export function publicClass(db: Db, cls: ClassRow) {
  const count = (sql: string) => (db.prepare(sql).get(cls.id) as { n: number }).n;
  return {
    id: cls.id,
    name: cls.name,
    joinCode: cls.join_code,
    teacherId: cls.teacher_id,
    teacherName: userById(db, cls.teacher_id)?.display_name ?? '',
    createdAt: cls.created_at,
    students: count('SELECT COUNT(*) AS n FROM class_members WHERE class_id = ?'),
    assignments: count('SELECT COUNT(*) AS n FROM assignments WHERE class_id = ?'),
  };
}

export function listClasses(db: Db, user: UserRow) {
  const rows = (
    user.role === 'admin'
      ? db.prepare('SELECT * FROM classes ORDER BY created_at DESC').all()
      : db.prepare('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC').all(user.id)
  ) as unknown as ClassRow[];
  return rows.map((c) => publicClass(db, c));
}

function freshJoinCode(db: Db) {
  for (let i = 0; i < 50; i++) {
    const code = joinCode();
    if (!db.prepare('SELECT 1 FROM classes WHERE join_code = ?').get(code)) return code;
  }
  throw new HttpError(500, 'server');
}

export function createClass(db: Db, teacher: UserRow, name: unknown, now = Date.now()): ClassRow {
  const row: ClassRow = {
    id: randomUUID(),
    school_id: teacher.school_id,
    teacher_id: teacher.id,
    name: text(name, LIMITS.className, 'badName'),
    join_code: freshJoinCode(db),
    created_at: now,
  };
  db.prepare('INSERT INTO classes (id, school_id, teacher_id, name, join_code, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(row.id, row.school_id, row.teacher_id, row.name, row.join_code, row.created_at);
  return row;
}

export function updateClass(db: Db, cls: ClassRow, patch: { name?: unknown; newCode?: unknown }): ClassRow {
  const name = patch.name === undefined ? cls.name : text(patch.name, LIMITS.className, 'badName');
  const code = patch.newCode === true ? freshJoinCode(db) : cls.join_code;
  db.prepare('UPDATE classes SET name = ?, join_code = ? WHERE id = ?').run(name, code, cls.id);
  return { ...cls, name, join_code: code };
}

export const deleteClass = (db: Db, cls: ClassRow) => db.prepare('DELETE FROM classes WHERE id = ?').run(cls.id);

// ── members ────────────────────────────────────────────────────────────────

/** Kazakh alphabet order (А Ә Б … Ү Ұ …), not code points: SQLite would put Ә after Я. */
const NAME_ORDER = new Intl.Collator(['kk', 'ru', 'en'], { sensitivity: 'base' });

export function members(db: Db, classId: string) {
  const rows = db
    .prepare(
      `SELECT u.id, u.login, u.display_name, u.disabled, u.last_login_at, m.joined_at
       FROM class_members m JOIN users u ON u.id = m.user_id
       WHERE m.class_id = ?`,
    )
    .all(classId) as Array<{ id: string; login: string; display_name: string; disabled: number; last_login_at: number | null; joined_at: number }>;
  rows.sort((a, b) => NAME_ORDER.compare(a.display_name, b.display_name));
  return rows.map((r) => ({ id: r.id, login: r.login, displayName: r.display_name, disabled: !!r.disabled, lastLoginAt: r.last_login_at, joinedAt: r.joined_at }));
}

export interface NewCredential {
  id: string;
  displayName: string;
  login: string;
  /** Shown once to the teacher, for the printable sheet; only its hash is stored. */
  password: string;
}

/** Creates a student account per name and adds it to the class. */
export async function addStudents(db: Db, cls: ClassRow, names: unknown, now = Date.now()): Promise<NewCredential[]> {
  if (!Array.isArray(names)) throw new HttpError(400, 'badNames');
  const clean = names
    .map((n) => (typeof n === 'string' ? n.trim().replace(/\s+/g, ' ') : ''))
    .filter(Boolean);
  if (!clean.length || clean.length > LIMITS.studentsPerCall || clean.some((n) => n.length > 80)) throw new HttpError(400, 'badNames');
  const reserved = new Set<string>();
  const drafts = clean.map((displayName) => {
    const login = uniqueLogin(loginFromName(displayName), (l) => reserved.has(l) || !!userByLogin(db, l));
    reserved.add(login);
    return { displayName, login, password: generatePassword() };
  });
  // scrypt runs on the libuv pool: hash in parallel, then write in one transaction
  const hashes = await Promise.all(drafts.map((d) => hashPassword(d.password)));
  const created: NewCredential[] = [];
  db.exec('BEGIN');
  try {
    drafts.forEach((d, i) => {
      if (userByLogin(db, d.login)) throw new HttpError(409, 'loginTaken');
      const row: UserRow = { id: randomUUID(), login: d.login, display_name: d.displayName, role: 'student', password_hash: hashes[i], school_id: cls.school_id, disabled: 0, created_at: now, last_login_at: null };
      insertUser(db, row);
      db.prepare('INSERT INTO class_members (class_id, user_id, joined_at) VALUES (?, ?, ?)').run(cls.id, row.id, now);
      created.push({ id: row.id, ...d });
    });
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return created;
}

function memberStudent(db: Db, cls: ClassRow, studentId: string): UserRow {
  const u = userById(db, studentId);
  if (!u || u.role !== 'student' || !isMember(db, cls.id, u.id)) throw notFound();
  return u;
}

/** A new generated password for a student of the class; their sessions end. */
export async function resetStudentPassword(db: Db, cls: ClassRow, studentId: string): Promise<NewCredential> {
  const u = memberStudent(db, cls, studentId);
  const password = generatePassword();
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), u.id);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(u.id);
  return { id: u.id, displayName: u.display_name, login: u.login, password };
}

/** Takes the student out of the class; the account and its progress stay. */
export function removeMember(db: Db, cls: ClassRow, studentId: string) {
  memberStudent(db, cls, studentId);
  db.prepare('DELETE FROM class_members WHERE class_id = ? AND user_id = ?').run(cls.id, studentId);
}

/** Student joins with a code; joining twice is harmless. Null when no class has the code. */
export function joinByCode(db: Db, student: UserRow, code: unknown, now = Date.now()): ClassRow | null {
  const c = normalizeJoinCode(typeof code === 'string' ? code : '');
  if (!c) return null;
  const cls = db.prepare('SELECT * FROM classes WHERE join_code = ?').get(c) as ClassRow | undefined;
  if (!cls) return null;
  if (!isMember(db, cls.id, student.id)) db.prepare('INSERT INTO class_members (class_id, user_id, joined_at) VALUES (?, ?, ?)').run(cls.id, student.id, now);
  return cls;
}

// ── assignments and scores ─────────────────────────────────────────────────

export function createAssignment(db: Db, cls: ClassRow, teacher: UserRow, input: Record<string, unknown>, now = Date.now()): AssignmentRow {
  const exercise = input.exerciseId == null || input.exerciseId === '' ? null : String(input.exerciseId);
  if (exercise && !taskById(exercise)) throw new HttpError(400, 'badExercise');
  const due = input.dueAt == null || input.dueAt === '' ? null : Number(input.dueAt);
  if (due !== null && !(Number.isFinite(due) && due > 0)) throw new HttpError(400, 'badDue');
  const points = Number(input.points ?? 10);
  if (!Number.isInteger(points) || points < 1 || points > LIMITS.points) throw new HttpError(400, 'badPoints');
  const row: AssignmentRow = {
    id: randomUUID(),
    class_id: cls.id,
    teacher_id: teacher.id,
    title: text(input.title, LIMITS.title, 'badTitle'),
    description: text(input.description, LIMITS.description, 'badDescription', { required: false }),
    exercise_id: exercise,
    due_at: due,
    points,
    created_at: now,
  };
  db.prepare('INSERT INTO assignments (id, class_id, teacher_id, title, description, exercise_id, due_at, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    row.id,
    row.class_id,
    row.teacher_id,
    row.title,
    row.description,
    row.exercise_id,
    row.due_at,
    row.points,
    row.created_at,
  );
  return row;
}

export const publicAssignment = (a: AssignmentRow) => ({
  id: a.id,
  classId: a.class_id,
  title: a.title,
  description: a.description,
  exerciseId: a.exercise_id,
  dueAt: a.due_at,
  points: a.points,
  createdAt: a.created_at,
});

export const classAssignments = (db: Db, classId: string) =>
  db.prepare('SELECT * FROM assignments WHERE class_id = ? ORDER BY COALESCE(due_at, created_at), created_at').all(classId) as unknown as AssignmentRow[];

/** The assignment and its class, if `user` teaches that class. */
export function ownAssignment(db: Db, user: UserRow, assignmentId: string) {
  const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId) as AssignmentRow | undefined;
  if (!a) throw notFound();
  return { assignment: a, cls: ownClass(db, user, a.class_id) };
}

export const deleteAssignment = (db: Db, a: AssignmentRow) => db.prepare('DELETE FROM assignments WHERE id = ?').run(a.id);

export interface Cell {
  /** Best attempt counted for the assignment (on time if there is one). */
  best: { id: string; percent: number; score: number; maxScore: number; seconds: number; errors: number; hints: number; at: number } | null;
  attempts: number;
  /** The counted attempt came after the deadline. */
  late: boolean;
  /** Score from the lab, scaled to the assignment's points. */
  auto: number | null;
  /** The teacher's grade, when given; it overrides `auto`. */
  grade: { score: number; comment: string; gradedAt: number } | null;
  /** The student's own written answer, if any. */
  answer: { body: string; at: number } | null;
  /** grade ?? auto */
  final: number | null;
}

/**
 * One cell per (assignment, student). Pure: rows in, cells out — the same
 * rule for the teacher's board and the student's own list.
 */
export function computeCells(assignments: AssignmentRow[], studentIds: string[], attempts: AttemptRow[], subs: SubmissionRow[]) {
  const cells: Record<string, Cell> = {};
  const byKey = new Map<string, AttemptRow[]>();
  for (const at of attempts) {
    const k = `${at.exercise_id}|${at.user_id}`;
    const list = byKey.get(k);
    if (list) list.push(at);
    else byKey.set(k, [at]);
  }
  const subByKey = new Map(subs.map((s) => [`${s.assignment_id}:${s.student_id}`, s]));
  const pickBest = (list: AttemptRow[]) => list.reduce<AttemptRow | null>((b, x) => (!b || x.percent > b.percent || (x.percent === b.percent && x.at < b.at) ? x : b), null);
  for (const a of assignments) {
    for (const sid of studentIds) {
      const list = a.exercise_id ? (byKey.get(`${a.exercise_id}|${sid}`) ?? []) : [];
      const onTime = a.due_at == null ? list : list.filter((x) => x.at <= a.due_at!);
      const best = pickBest(onTime) ?? pickBest(list);
      const late = !!best && a.due_at != null && best.at > a.due_at;
      const sub = subByKey.get(`${a.id}:${sid}`);
      const grade = sub && sub.score != null ? { score: sub.score, comment: sub.comment ?? '', gradedAt: sub.graded_at ?? 0 } : null;
      const auto = best ? Math.round((best.percent * a.points) / 100) : null;
      cells[`${a.id}:${sid}`] = {
        best: best && { id: best.id, percent: best.percent, score: best.score, maxScore: best.max_score, seconds: best.seconds, errors: best.errors, hints: best.hints, at: best.at },
        attempts: list.length,
        late,
        auto,
        grade,
        answer: sub && sub.body ? { body: sub.body, at: sub.submitted_at } : null,
        final: grade?.score ?? auto,
      };
    }
  }
  return cells;
}

function attemptsFor(db: Db, userIds: string[], exerciseIds: string[]): AttemptRow[] {
  if (!userIds.length || !exerciseIds.length) return [];
  return db
    .prepare(`SELECT * FROM attempts WHERE user_id IN (${placeholders(userIds.length)}) AND exercise_id IN (${placeholders(exerciseIds.length)})`)
    .all(...userIds, ...exerciseIds) as unknown as AttemptRow[];
}

function submissionsFor(db: Db, assignmentIds: string[], studentIds: string[]): SubmissionRow[] {
  if (!assignmentIds.length || !studentIds.length) return [];
  return db
    .prepare(
      `SELECT s.id, s.assignment_id, s.student_id, s.body, s.submitted_at, g.score, g.comment, g.graded_at
       FROM submissions s LEFT JOIN grades g ON g.submission_id = s.id
       WHERE s.assignment_id IN (${placeholders(assignmentIds.length)}) AND s.student_id IN (${placeholders(studentIds.length)})`,
    )
    .all(...assignmentIds, ...studentIds) as unknown as SubmissionRow[];
}

const exerciseIdsOf = (list: AssignmentRow[]) => [...new Set(list.map((a) => a.exercise_id).filter((x): x is string => !!x))];

/** Everything the teacher's class page shows. */
export function classDetail(db: Db, cls: ClassRow, teacherId: string) {
  const students = members(db, cls.id);
  const assignments = classAssignments(db, cls.id);
  const ids = students.map((s) => s.id);
  const cells = computeCells(assignments, ids, attemptsFor(db, ids, exerciseIdsOf(assignments)), submissionsFor(db, assignments.map((a) => a.id), ids));
  const unread = Object.fromEntries(
    (db.prepare('SELECT from_id, COUNT(*) AS n FROM messages WHERE class_id = ? AND to_id = ? AND read_at IS NULL GROUP BY from_id').all(cls.id, teacherId) as Array<{ from_id: string; n: number }>).map((r) => [r.from_id, r.n]),
  );
  return {
    class: publicClass(db, cls),
    students,
    assignments: assignments.map(publicAssignment),
    cells,
    announcements: announcements(db, [cls.id]),
    unread,
  };
}

/** All of a student's attempts (newest first) for the teacher's "work" view. */
export function studentWork(db: Db, cls: ClassRow, studentId: string) {
  const u = memberStudent(db, cls, studentId);
  const attempts = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY at DESC LIMIT 300').all(u.id) as unknown as AttemptRow[];
  return {
    student: { id: u.id, login: u.login, displayName: u.display_name, lastLoginAt: u.last_login_at },
    attempts: attempts.map((a) => ({ id: a.id, exerciseId: a.exercise_id, score: a.score, maxScore: a.max_score, percent: a.percent, seconds: a.seconds, errors: a.errors, hints: a.hints, status: a.status, at: a.at })),
  };
}

function ensureSubmission(db: Db, a: AssignmentRow, studentId: string, now: number): string {
  const found = db.prepare('SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?').get(a.id, studentId) as { id: string } | undefined;
  if (found) return found.id;
  const id = randomUUID();
  db.prepare("INSERT INTO submissions (id, assignment_id, student_id, attempt_id, body, submitted_at) VALUES (?, ?, ?, NULL, '', ?)").run(id, a.id, studentId, now);
  return id;
}

/** The teacher's score (0…points) and comment; replaces the automatic score. */
export function setGrade(db: Db, teacher: UserRow, a: AssignmentRow, cls: ClassRow, studentId: string, input: { score?: unknown; comment?: unknown }, now = Date.now()) {
  memberStudent(db, cls, studentId);
  const score = Number(input.score);
  if (!Number.isInteger(score) || score < 0 || score > a.points) throw new HttpError(400, 'badScore');
  const comment = text(input.comment ?? '', LIMITS.comment, 'badComment', { required: false });
  const subId = ensureSubmission(db, a, studentId, now);
  const best = computeCells([a], [studentId], attemptsFor(db, [studentId], exerciseIdsOf([a])), [])[`${a.id}:${studentId}`].best;
  db.prepare('UPDATE submissions SET attempt_id = ? WHERE id = ?').run(best?.id ?? null, subId);
  db.prepare(
    `INSERT INTO grades (id, submission_id, teacher_id, score, max_score, comment, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (submission_id) DO UPDATE SET teacher_id = excluded.teacher_id, score = excluded.score, max_score = excluded.max_score, comment = excluded.comment, graded_at = excluded.graded_at`,
  ).run(randomUUID(), subId, teacher.id, score, a.points, comment, now);
}

/** Back to the automatic score. */
export function clearGrade(db: Db, a: AssignmentRow, cls: ClassRow, studentId: string) {
  memberStudent(db, cls, studentId);
  db.prepare('DELETE FROM grades WHERE submission_id IN (SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?)').run(a.id, studentId);
}

// ── announcements and messages ─────────────────────────────────────────────

export function announcements(db: Db, classIds: string[], limit = 50) {
  if (!classIds.length) return [];
  const rows = db
    .prepare(
      `SELECT a.id, a.class_id, a.title, a.body, a.created_at, u.display_name AS author
       FROM announcements a JOIN users u ON u.id = a.author_id
       WHERE a.class_id IN (${placeholders(classIds.length)}) ORDER BY a.created_at DESC LIMIT ${Math.floor(limit)}`,
    )
    .all(...classIds) as Array<{ id: string; class_id: string; title: string; body: string; created_at: number; author: string }>;
  return rows.map((r) => ({ id: r.id, classId: r.class_id, title: r.title, body: r.body, createdAt: r.created_at, author: r.author }));
}

export function postAnnouncement(db: Db, cls: ClassRow, author: UserRow, input: { title?: unknown; body?: unknown }, now = Date.now()) {
  const id = randomUUID();
  db.prepare('INSERT INTO announcements (id, class_id, author_id, title, body, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    cls.id,
    author.id,
    text(input.title, LIMITS.title, 'badTitle'),
    text(input.body, LIMITS.body, 'badBody'),
    now,
  );
  return id;
}

export function deleteAnnouncement(db: Db, user: UserRow, id: string) {
  const row = db.prepare('SELECT class_id FROM announcements WHERE id = ?').get(id) as { class_id: string } | undefined;
  if (!row) throw notFound();
  ownClass(db, user, row.class_id);
  db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
}

/** The thread between a class's teacher and one student; reading marks the reader's incoming as read. */
export function thread(db: Db, classId: string, readerId: string, otherId: string, now = Date.now()) {
  db.prepare('UPDATE messages SET read_at = ? WHERE class_id = ? AND to_id = ? AND from_id = ? AND read_at IS NULL').run(now, classId, readerId, otherId);
  const rows = db
    .prepare(
      `SELECT id, from_id, body, created_at, read_at FROM messages
       WHERE class_id = ? AND ((from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?))
       ORDER BY created_at DESC LIMIT 200`,
    )
    .all(classId, readerId, otherId, otherId, readerId) as Array<{ id: string; from_id: string; body: string; created_at: number; read_at: number | null }>;
  return rows.reverse().map((r) => ({ id: r.id, mine: r.from_id === readerId, body: r.body, createdAt: r.created_at, readAt: r.read_at }));
}

export function sendMessage(db: Db, classId: string, fromId: string, toId: string, body: unknown, now = Date.now()) {
  db.prepare('INSERT INTO messages (id, from_id, to_id, class_id, body, created_at, read_at) VALUES (?, ?, ?, ?, ?, ?, NULL)').run(randomUUID(), fromId, toId, classId, text(body, LIMITS.message, 'badBody'), now);
}

/** Teacher side: the student must be in the class. */
export const checkStudentInClass = (db: Db, cls: ClassRow, studentId: string) => memberStudent(db, cls, studentId);

// ── the student's side ─────────────────────────────────────────────────────

export function studentClass(db: Db, student: UserRow, classId: string): ClassRow {
  const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(classId) as ClassRow | undefined;
  if (!cls || !isMember(db, cls.id, student.id)) throw notFound();
  return cls;
}

export function studentHome(db: Db, student: UserRow) {
  const classes = db
    .prepare('SELECT c.* FROM classes c JOIN class_members m ON m.class_id = c.id WHERE m.user_id = ? ORDER BY m.joined_at')
    .all(student.id) as unknown as ClassRow[];
  const classIds = classes.map((c) => c.id);
  const assignments = classIds.length
    ? (db.prepare(`SELECT * FROM assignments WHERE class_id IN (${placeholders(classIds.length)}) ORDER BY COALESCE(due_at, created_at)`).all(...classIds) as unknown as AssignmentRow[])
    : [];
  const cells = computeCells(assignments, [student.id], attemptsFor(db, [student.id], exerciseIdsOf(assignments)), submissionsFor(db, assignments.map((a) => a.id), [student.id]));
  const unread = Object.fromEntries(
    (db.prepare('SELECT class_id, COUNT(*) AS n FROM messages WHERE to_id = ? AND read_at IS NULL GROUP BY class_id').all(student.id) as Array<{ class_id: string; n: number }>).map((r) => [r.class_id, r.n]),
  );
  return {
    classes: classes.map((c) => ({ id: c.id, name: c.name, teacherName: userById(db, c.teacher_id)?.display_name ?? '', unread: unread[c.id] ?? 0 })),
    assignments: assignments.map((a) => ({ ...publicAssignment(a), cell: cells[`${a.id}:${student.id}`] })),
    announcements: announcements(db, classIds),
  };
}

/** The student's written answer to an assignment (any assignment; replaces the previous one). */
export function submitAnswer(db: Db, student: UserRow, assignmentId: string, body: unknown, now = Date.now()) {
  const a = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId) as AssignmentRow | undefined;
  if (!a || !isMember(db, a.class_id, student.id)) throw notFound();
  const answer = text(body, LIMITS.body, 'badBody');
  const subId = ensureSubmission(db, a, student.id, now);
  db.prepare('UPDATE submissions SET body = ?, submitted_at = ? WHERE id = ?').run(answer, now, subId);
}
