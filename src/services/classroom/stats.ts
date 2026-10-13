/**
 * Pure classroom helpers (V2-9): status of one cell, per-assignment and
 * per-student statistics, CSV / JSON export. No React, no fetch — tested in
 * scripts/classroom.test.mjs.
 */
import type { Assignment, Cell, ClassDetail, Member } from './api';

export type CellStatus = 'graded' | 'done' | 'late' | 'answered' | 'overdue' | 'todo';

export const cellKey = (assignmentId: string, studentId: string) => `${assignmentId}:${studentId}`;

export function cellStatus(cell: Cell | undefined, a: Pick<Assignment, 'dueAt'>, now: number): CellStatus {
  if (cell?.grade) return 'graded';
  if (cell?.best) return cell.late ? 'late' : 'done';
  if (cell?.answer) return 'answered';
  if (a.dueAt != null && now > a.dueAt) return 'overdue';
  return 'todo';
}

/** Has something to look at: a lab result, an answer or a grade. */
const worked = (c: Cell | undefined) => !!c && (c.best != null || c.answer != null || c.grade != null);

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round1 = (x: number | null) => (x == null ? null : Math.round(x * 10) / 10);

export interface AssignmentStat {
  id: string;
  /** Students with any work. */
  done: number;
  late: number;
  total: number;
  /** Mean final score of the students with one, in points. */
  average: number | null;
  /** The same as a percentage of the assignment's points. */
  averagePercent: number | null;
  /** Mean errors and hints over the counted lab attempts. */
  errors: number | null;
  hints: number | null;
}

export function assignmentStats(d: Pick<ClassDetail, 'assignments' | 'students' | 'cells'>): AssignmentStat[] {
  return d.assignments.map((a) => {
    const cells = d.students.map((s) => d.cells[cellKey(a.id, s.id)]);
    const finals = cells.map((c) => c?.final).filter((x): x is number => x != null);
    const bests = cells.map((c) => c?.best).filter((b): b is NonNullable<Cell['best']> => b != null);
    const average = mean(finals);
    return {
      id: a.id,
      done: cells.filter(worked).length,
      late: cells.filter((c) => c?.late).length,
      total: d.students.length,
      average: round1(average),
      averagePercent: average == null ? null : Math.round((average / a.points) * 100),
      errors: round1(mean(bests.map((b) => b.errors))),
      hints: round1(mean(bests.map((b) => b.hints))),
    };
  });
}

export interface StudentTotal {
  id: string;
  /** Sum of final scores (missing work counts 0). */
  points: number;
  /** Sum of the assignments' points. */
  max: number;
  percent: number | null;
  done: number;
}

export function studentTotals(d: Pick<ClassDetail, 'assignments' | 'students' | 'cells'>): StudentTotal[] {
  const max = d.assignments.reduce((n, a) => n + a.points, 0);
  return d.students.map((s) => {
    const cells = d.assignments.map((a) => d.cells[cellKey(a.id, s.id)]);
    const points = cells.reduce((n, c) => n + (c?.final ?? 0), 0);
    return { id: s.id, points, max, percent: max ? Math.round((points / max) * 100) : null, done: cells.filter(worked).length };
  });
}

/** Whole-class numbers for the stats header. */
export function classSummary(d: Pick<ClassDetail, 'assignments' | 'students' | 'cells'>) {
  const cellsTotal = d.assignments.length * d.students.length;
  const done = d.assignments.reduce((n, a) => n + d.students.filter((s) => worked(d.cells[cellKey(a.id, s.id)])).length, 0);
  const percents = studentTotals(d)
    .map((t) => t.percent)
    .filter((x): x is number => x != null);
  return {
    students: d.students.length,
    assignments: d.assignments.length,
    completion: cellsTotal ? Math.round((done / cellsTotal) * 100) : null,
    averagePercent: percents.length ? Math.round(mean(percents)!) : null,
  };
}

/** Quotes a CSV field; a leading = + - @ is neutralised so spreadsheets never run it as a formula. */
export function csvField(value: string | number | null | undefined): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export interface CsvLabels {
  student: string;
  login: string;
  total: string;
  percent: string;
}

/** One row per student: final score per assignment, total and percent. UTF-8 with BOM for Excel. */
export function toCsv(d: Pick<ClassDetail, 'assignments' | 'students' | 'cells'>, labels: CsvLabels): string {
  const totals = new Map(studentTotals(d).map((t) => [t.id, t]));
  const head = [labels.student, labels.login, ...d.assignments.map((a) => `${a.title} (${a.points})`), labels.total, labels.percent];
  const rows = d.students.map((s: Member) => {
    const t = totals.get(s.id)!;
    return [s.displayName, s.login, ...d.assignments.map((a) => d.cells[cellKey(a.id, s.id)]?.final ?? ''), `${t.points}/${t.max}`, t.percent ?? ''];
  });
  return '﻿' + [head, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n') + '\r\n';
}

/** Full export: the class, assignments, each student's cells and totals. */
export function toJson(d: ClassDetail, exportedAt: number) {
  const totals = new Map(studentTotals(d).map((t) => [t.id, t]));
  return {
    format: 'vil3d-class/1',
    exportedAt: new Date(exportedAt).toISOString(),
    class: { name: d.class.name, joinCode: d.class.joinCode },
    assignments: d.assignments.map(({ id, title, description, exerciseId, dueAt, points }) => ({ id, title, description, exerciseId, dueAt: dueAt && new Date(dueAt).toISOString(), points })),
    students: d.students.map((s) => ({
      login: s.login,
      name: s.displayName,
      total: totals.get(s.id),
      work: Object.fromEntries(d.assignments.map((a) => [a.id, d.cells[cellKey(a.id, s.id)] ?? null])),
    })),
  };
}
