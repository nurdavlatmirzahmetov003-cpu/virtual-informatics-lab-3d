/**
 * Classroom API (V2-9): the teacher's classes, students, assignments,
 * grades, announcements and messages, and the student's side. Shapes
 * mirror server/classroom.ts; every write carries the session's CSRF token.
 */
import { call } from '@/services/auth/api';

export interface ClassSummary {
  id: string;
  name: string;
  joinCode: string;
  teacherId: string;
  teacherName: string;
  createdAt: number;
  students: number;
  assignments: number;
}

export interface Member {
  id: string;
  login: string;
  displayName: string;
  disabled: boolean;
  lastLoginAt: number | null;
  joinedAt: number;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  exerciseId: string | null;
  dueAt: number | null;
  points: number;
  createdAt: number;
}

export interface Cell {
  best: { id: string; percent: number; score: number; maxScore: number; seconds: number; errors: number; hints: number; at: number } | null;
  attempts: number;
  late: boolean;
  auto: number | null;
  grade: { score: number; comment: string; gradedAt: number } | null;
  answer: { body: string; at: number } | null;
  final: number | null;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  body: string;
  createdAt: number;
  author: string;
}

export interface ClassDetail {
  class: ClassSummary;
  students: Member[];
  assignments: Assignment[];
  /** Keyed `${assignmentId}:${studentId}`. */
  cells: Record<string, Cell>;
  announcements: Announcement[];
  /** Unread messages per student id. */
  unread: Record<string, number>;
}

export interface Credential {
  id: string;
  displayName: string;
  login: string;
  password: string;
}

export interface WorkAttempt {
  id: string;
  exerciseId: string;
  score: number;
  maxScore: number;
  percent: number;
  seconds: number;
  errors: number;
  hints: number;
  status: 'completed' | 'incomplete';
  at: number;
}

export interface Message {
  id: string;
  mine: boolean;
  body: string;
  createdAt: number;
  readAt: number | null;
}

export interface NewAssignment {
  title: string;
  description: string;
  exerciseId: string | null;
  dueAt: number | null;
  points: number;
}

export interface StudentHome {
  classes: Array<{ id: string; name: string; teacherName: string; unread: number }>;
  assignments: Array<Assignment & { cell: Cell }>;
  announcements: Announcement[];
}

const T = '/api/teacher';
const enc = encodeURIComponent;

export const teacherApi = {
  classes: () => call<{ classes: ClassSummary[] }>(`${T}/classes`),
  createClass: (name: string, csrf: string) => call<{ class: ClassSummary }>(`${T}/classes`, { method: 'POST', body: { name }, csrf }),
  detail: (id: string) => call<ClassDetail>(`${T}/classes/${enc(id)}`),
  updateClass: (id: string, patch: { name?: string; newCode?: boolean }, csrf: string) => call<{ class: ClassSummary }>(`${T}/classes/${enc(id)}`, { method: 'PATCH', body: patch, csrf }),
  deleteClass: (id: string, csrf: string) => call<{ ok: true }>(`${T}/classes/${enc(id)}`, { method: 'DELETE', csrf }),
  addStudents: (id: string, names: string[], csrf: string) => call<{ created: Credential[] }>(`${T}/classes/${enc(id)}/students`, { method: 'POST', body: { names }, csrf }),
  work: (id: string, sid: string) => call<{ student: { id: string; login: string; displayName: string; lastLoginAt: number | null }; attempts: WorkAttempt[] }>(`${T}/classes/${enc(id)}/students/${enc(sid)}`),
  removeStudent: (id: string, sid: string, csrf: string) => call<{ ok: true }>(`${T}/classes/${enc(id)}/students/${enc(sid)}`, { method: 'DELETE', csrf }),
  resetPassword: (id: string, sid: string, csrf: string) => call<{ credential: Credential }>(`${T}/classes/${enc(id)}/students/${enc(sid)}/reset`, { method: 'POST', csrf }),
  createAssignment: (id: string, input: NewAssignment, csrf: string) => call<{ assignment: Assignment }>(`${T}/classes/${enc(id)}/assignments`, { method: 'POST', body: input, csrf }),
  deleteAssignment: (aid: string, csrf: string) => call<{ ok: true }>(`${T}/assignments/${enc(aid)}`, { method: 'DELETE', csrf }),
  setGrade: (aid: string, sid: string, score: number, comment: string, csrf: string) => call<{ ok: true }>(`${T}/assignments/${enc(aid)}/grades/${enc(sid)}`, { method: 'PUT', body: { score, comment }, csrf }),
  clearGrade: (aid: string, sid: string, csrf: string) => call<{ ok: true }>(`${T}/assignments/${enc(aid)}/grades/${enc(sid)}`, { method: 'DELETE', csrf }),
  announce: (id: string, title: string, body: string, csrf: string) => call<{ id: string }>(`${T}/classes/${enc(id)}/announcements`, { method: 'POST', body: { title, body }, csrf }),
  deleteAnnouncement: (nid: string, csrf: string) => call<{ ok: true }>(`${T}/announcements/${enc(nid)}`, { method: 'DELETE', csrf }),
  messages: (id: string, sid: string) => call<{ messages: Message[] }>(`${T}/classes/${enc(id)}/messages/${enc(sid)}`),
  send: (id: string, sid: string, body: string, csrf: string) => call<{ messages: Message[] }>(`${T}/classes/${enc(id)}/messages/${enc(sid)}`, { method: 'POST', body: { body }, csrf }),
};

export const studentApi = {
  home: () => call<StudentHome>('/api/student/home'),
  join: (code: string, csrf: string) => call<{ class: { id: string; name: string } }>('/api/student/join', { method: 'POST', body: { code }, csrf }),
  answer: (aid: string, body: string, csrf: string) => call<{ ok: true }>(`/api/student/assignments/${enc(aid)}/answer`, { method: 'POST', body: { body }, csrf }),
  messages: (id: string) => call<{ messages: Message[] }>(`/api/student/classes/${enc(id)}/messages`),
  send: (id: string, body: string, csrf: string) => call<{ messages: Message[] }>(`/api/student/classes/${enc(id)}/messages`, { method: 'POST', body: { body }, csrf }),
};
