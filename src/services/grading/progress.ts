import { assess, type Assessment } from '@/lib/labs/assessment';
import type { GradeReport } from './types';

/**
 * Bridges a report to the persisted progress format (score 0..100).
 * Penalties are already in `report.percent`, so none are re-applied here.
 */
export function toAssessment(report: GradeReport): Assessment {
  const a = assess(report.exerciseId, report.percent / 100, report.seconds);
  return { ...a, errors: report.errors, hints: report.hints };
}
