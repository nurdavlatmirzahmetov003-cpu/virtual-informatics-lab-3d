/**
 * What the robot teacher says (2026-10): a check of the student's progress
 * from the same records as "My results" — overall and per lab, the next
 * task to do, the devices of the zone in view whose test is still open, and
 * the teardowns left. Pure: the panel only renders it.
 */
import { DEVICES, type Device } from '@/data/devices/devices';
import type { LabZoneId } from '@/data/lab/zones';
import { TEARDOWN_TASKS, recommendNext, statusOf, summarize, type ExerciseProgress, type LabSummary, type RecommendReason, type TaskState } from '@/services/progress';

export type TeacherMood = 'start' | 'going' | 'great' | 'done';

export interface TeacherCheck {
  mood: TeacherMood;
  /** Tasks completed / all tasks, and the share in percent. */
  completed: number;
  total: number;
  percent: number;
  labs: LabSummary[];
  next: { task: TaskState; reason: RecommendReason } | null;
  /** Devices of the zone in view whose test is not passed yet (up to 4). */
  zoneTodo: string[];
  /** Teardowns whose "what does this part do?" task is not passed yet. */
  teardownsTodo: (typeof TEARDOWN_TASKS)[number][];
}

/** The graded test a lab device opens (its own, or its Computer Anatomy item's). */
export const deviceExerciseId = (d: Device): string | null => (d.anatomy ? `anatomy:${d.anatomy}` : d.answers ? `device:${d.id}` : null);

export function teacherCheck(exercises: Readonly<Record<string, ExerciseProgress>>, focus: LabZoneId | null): TeacherCheck {
  const summary = summarize({ exercises });
  const { completed, tasks: total, percent } = summary.totals;
  const done = (id: string | null) => !!id && statusOf(exercises[id]) === 'completed';
  const zoneTodo = focus
    ? DEVICES.filter((d) => d.zone === focus && deviceExerciseId(d) && !done(deviceExerciseId(d)))
        .map((d) => d.id)
        .slice(0, 4)
    : [];
  const teardownsTodo = TEARDOWN_TASKS.filter((id) => !done(`teardown:${id}`));
  const mood: TeacherMood = completed === 0 ? 'start' : completed === total ? 'done' : percent >= 60 ? 'great' : 'going';
  return { mood, completed, total, percent, labs: summary.labs, next: recommendNext(summary), zoneTodo, teardownsTodo };
}
