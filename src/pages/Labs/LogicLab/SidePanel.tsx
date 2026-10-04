import { CircleCheck, Lightbulb, ListChecks, RotateCcw, ShieldCheck, Sigma, Target, TriangleAlert } from 'lucide-react';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import type { CircuitIssue, LogicTask } from '@/labs/LogicLab';
import type { Attempt, GradeReport } from '@/services/grading';
import type { LogicLabActions } from './useLogicLab';
import styles from './LogicLab.module.css';

const tk = (key: string) => key as TranslationKey;
const MAX_SHOWN = 6;

export function Warnings({ issues, formula }: { issues: CircuitIssue[]; formula: string | null }) {
  const t = useT();
  return (
    <>
      <section className={styles.formula} aria-live="polite">
        <Sigma size={16} aria-hidden="true" />
        <div>
          <h3>{t('logic.ui.expression')}</h3>
          <p>{formula ? <code>Y = {formula}</code> : t('logic.ui.expressionNone')}</p>
        </div>
      </section>
      <section className={styles.warnings} aria-live="polite">
        <h3>{t('logic.ui.warnings')}</h3>
        {issues.length === 0 ? (
          <p className={styles.ok}>
            <CircleCheck size={15} aria-hidden="true" /> {t('logic.ui.noWarnings')}
          </p>
        ) : (
          <ul>
            {issues.slice(0, MAX_SHOWN).map((i, k) => (
              <li key={k} data-code={i.code}>
                <TriangleAlert size={14} aria-hidden="true" />
                {t(tk(`logic.feedback.issue.${i.code}`), i.params)}
              </li>
            ))}
            {issues.length > MAX_SHOWN && <li data-code="more">{t('logic.ui.moreWarnings', { count: issues.length - MAX_SHOWN })}</li>}
          </ul>
        )}
      </section>
    </>
  );
}

export function TaskPanel({ task, attempt, report, actions }: { task: LogicTask; attempt: Attempt; report: GradeReport | null; actions: LogicLabActions }) {
  const t = useT();
  const hintsLeft = task.hints.length - attempt.hintsUsed;
  return (
    <section className={styles.task}>
      <span className={styles.taskTag}>{t('logic.ui.task')}</span>
      <h2>{t(tk(`logic.tasks.${task.task}.title`))}</h2>
      <p>{t(tk(task.instructions.key))}</p>
      <div className={styles.goal}>
        <Target size={16} aria-hidden="true" />
        <div>
          <h3>{t('logic.ui.goal')}</h3>
          <p>{t(tk(task.expectedResult.key))}</p>
        </div>
      </div>
      <details className={styles.checks}>
        <summary>
          <ListChecks size={15} aria-hidden="true" /> {t('logic.ui.checks')}
        </summary>
        <ul>
          {task.gradingRules.map((r) => (
            <li key={r.id}>
              <span>{t(tk(r.label.key), r.label.params)}</span>
              <b>{t('logic.ui.points', { n: r.points })}</b>
            </li>
          ))}
        </ul>
        <p>{t('grading.scoring')}</p>
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
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={actions.check}>
          <ShieldCheck size={16} aria-hidden="true" /> {t('logic.ui.check')}
        </button>
        <button type="button" className={styles.secondary} onClick={actions.hint} disabled={hintsLeft === 0}>
          <Lightbulb size={15} aria-hidden="true" />
          {hintsLeft ? (
            <>
              {t('logic.ui.hint')} <small>{t('logic.ui.hintCost')}</small>
            </>
          ) : (
            t('logic.ui.noHints')
          )}
        </button>
        <button type="button" className={styles.secondary} onClick={actions.restart}>
          <RotateCcw size={15} aria-hidden="true" /> {t('logic.ui.restart')}
        </button>
      </div>
      {report && <GradeReportCard key={report.submissions} report={report} />}
    </section>
  );
}
