/**
 * Progress as a JSON file — for showing a teacher or moving to another
 * browser. The file carries the full snapshot plus a readable per-task
 * summary; import accepts only this format and validates every record.
 */
import { readEnvelope } from './migrate';
import { summarize } from './summary';
import { PROGRESS_VERSION, type ProgressSnapshot } from './types';

export const EXPORT_APP = 'virtual-informatics-lab-3d';
export const EXPORT_KIND = 'progress';
/** Generous for 1000 attempts; anything larger is not ours. */
export const MAX_IMPORT_BYTES = 2_000_000;

export interface ProgressExport {
  app: typeof EXPORT_APP;
  kind: typeof EXPORT_KIND;
  version: number;
  exportedAt: string;
  /** Human-readable overview for a teacher; ignored on import. */
  summary: {
    completedTasks: number;
    totalTasks: number;
    percent: number;
    averageScore: number | null;
    points: number;
    maxPoints: number;
    achievements: string[];
    tasks: { id: string; lab: string; status: string; best: string | null; attempts: number }[];
  };
  data: ProgressSnapshot;
}

export function buildExport(s: ProgressSnapshot, now = Date.now()): ProgressExport {
  const sum = summarize(s);
  return {
    app: EXPORT_APP,
    kind: EXPORT_KIND,
    version: PROGRESS_VERSION,
    exportedAt: new Date(now).toISOString(),
    summary: {
      completedTasks: sum.totals.completed,
      totalTasks: sum.totals.tasks,
      percent: sum.totals.percent,
      averageScore: sum.totals.average,
      points: sum.totals.points,
      maxPoints: sum.totals.maxPoints,
      achievements: Object.keys(s.achievements),
      tasks: sum.tasks.map((t) => ({
        id: t.info.id,
        lab: t.info.lab,
        status: t.status,
        best: t.progress ? `${t.progress.best.score}/${t.progress.best.maxScore}` : null,
        attempts: t.progress?.attempts ?? 0,
      })),
    },
    data: s,
  };
}

export function exportFileName(now = Date.now()) {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `vil3d-progress-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export type ImportError = 'tooLarge' | 'notJson' | 'wrongFile' | 'empty';
export type ImportResult = { ok: true; snapshot: ProgressSnapshot } | { ok: false; error: ImportError };

/** Parses an exported file. Older export versions go through the same migrations as storage. */
export function parseImport(text: string, now = Date.now()): ImportResult {
  if (text.length > MAX_IMPORT_BYTES) return { ok: false, error: 'tooLarge' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'notJson' };
  }
  const f = raw as Partial<ProgressExport> | null;
  if (!f || f.app !== EXPORT_APP || f.kind !== EXPORT_KIND || typeof f.version !== 'number' || !f.data) return { ok: false, error: 'wrongFile' };
  const { snapshot } = readEnvelope({ version: f.version, state: f.data }, now);
  if (!snapshot.attempts.length && !Object.keys(snapshot.exercises).length) return { ok: false, error: 'empty' };
  return { ok: true, snapshot };
}
