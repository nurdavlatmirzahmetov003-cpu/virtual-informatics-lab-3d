import { Lightbulb, ListChecks, RotateCcw, ShieldCheck, Target } from 'lucide-react';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import type { NetworkTask } from '@/labs/NetworkLab';
import type { Attempt, GradeReport } from '@/services/grading';
import type { NetworkLabActions } from './useNetworkLab';
import styles from './NetworkLab.module.css';

const tk = (key: string) => key as TranslationKey;

export function TaskPanel({ task, attempt, report, actions }: { task: NetworkTask; attempt: Attempt; report: GradeReport | null; actions: NetworkLabActions }) {
  const t = useT();
  const hintsLeft = task.hints.length - attempt.hintsUsed;
  return (
    <div className={styles.task}>
      <p className={styles.taskText}>{t(tk(task.instructions.key))}</p>

      <div className={styles.goal}>
        <Target size={16} aria-hidden="true" />
        <div>
          <h3>{t('network.task.goal')}</h3>
          <p>{t(tk(task.expectedResult.key))}</p>
        </div>
      </div>

      <details className={styles.checks}>
        <summary>
          <ListChecks size={15} aria-hidden="true" /> {t('network.task.checks')}
        </summary>
        <ul>
          {task.gradingRules.map((r) => (
            <li key={r.id}>
              <span>{t(tk(r.label.key))}</span>
              <b>{t('network.task.points', { n: r.points })}</b>
            </li>
          ))}
        </ul>
        <p className={styles.muted}>{t('grading.scoring')}</p>
      </details>

      {attempt.hintsUsed > 0 && (
        <ol className={styles.hints}>
          {task.hints.slice(0, attempt.hintsUsed).map((h) => (
            <li key={h.key}>
              <Lightbulb size={14} aria-hidden="true" />
              {t(tk(h.key))}
            </li>
          ))}
        </ol>
      )}

      <div className={styles.taskActions}>
        <button type="button" className={styles.primaryButton} onClick={actions.check}>
          <ShieldCheck size={16} aria-hidden="true" /> {t('network.task.check')}
        </button>
        <button type="button" className={styles.ghostButton} onClick={actions.hint} disabled={hintsLeft === 0}>
          <Lightbulb size={15} aria-hidden="true" />
          {hintsLeft ? (
            <>
              {t('network.task.hint')} <small>{t('network.task.hintCost')}</small>
            </>
          ) : (
            t('network.task.noHints')
          )}
        </button>
        <button type="button" className={styles.ghostButton} onClick={actions.restart}>
          <RotateCcw size={15} aria-hidden="true" /> {t('network.task.restart')}
        </button>
      </div>

      {report && <GradeReportCard key={report.submissions} report={report} />}
    </div>
  );
}
