import { Link } from 'react-router-dom';
import { CircleCheck, CircleX, Clock3, Lightbulb, TriangleAlert } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { formatDuration, type Feedback, type GradeReport } from '@/services/grading';
import styles from './GradeReportCard.module.css';

const tk = (key: string) => key as TranslationKey;

function FeedbackText({ item }: { item: Feedback }) {
  const t = useT();
  return (
    <>
      {t(tk(item.key), item.params)}
      {item.detail && <span className={styles.detail}>{t(tk(item.detail.key), item.detail.params)}</span>}
    </>
  );
}

/**
 * Result of an automatically graded exercise — score, time, errors, hints,
 * status and, per rule, why it failed. Shared by every lab.
 */
export function GradeReportCard({ report }: { report: GradeReport }) {
  const t = useT();
  const done = report.status === 'completed';
  return (
    <section className={styles.card} data-status={report.status} aria-label={t('grading.result')} aria-live="polite">
      <header className={styles.head}>
        <div className={styles.score}>
          <span>{t('grading.score')}</span>
          <strong>
            {report.score}
            <small>/{report.maxScore}</small>
          </strong>
        </div>
        <span className={styles.status}>
          {done ? <CircleCheck size={15} aria-hidden="true" /> : <TriangleAlert size={15} aria-hidden="true" />}
          {t(done ? 'grading.completed' : 'grading.incomplete')}
        </span>
      </header>

      <dl className={styles.stats}>
        <div>
          <dt>
            <Clock3 size={13} aria-hidden="true" /> {t('grading.time')}
          </dt>
          <dd>{formatDuration(report.seconds)}</dd>
        </div>
        <div>
          <dt>
            <CircleX size={13} aria-hidden="true" /> {t('grading.errors')}
          </dt>
          <dd>{report.errors}</dd>
        </div>
        <div>
          <dt>
            <Lightbulb size={13} aria-hidden="true" /> {t('grading.hints')}
          </dt>
          <dd>{report.hints}</dd>
        </div>
      </dl>

      {/* a lab may count the task as done even with a few mistakes on the way */}
      <p className={styles.summary}>{t(done ? (report.outcomes.every((o) => o.passed) ? 'grading.success' : 'grading.successWithNotes') : 'grading.tryAgain')}</p>
      {report.penalty > 0 && <p className={styles.penalty}>{t('grading.penalty', { n: report.penalty })}</p>}

      <ol className={styles.rules}>
        {report.outcomes.map((o) => (
          <li key={o.id} data-passed={o.passed}>
            <div className={styles.rule}>
              {o.passed ? <CircleCheck size={16} aria-hidden="true" /> : <CircleX size={16} aria-hidden="true" />}
              <span>{t(tk(o.label.key), o.label.params)}</span>
              <b>{t('grading.rulePoints', { earned: o.earned, points: o.points })}</b>
            </div>
            {!o.passed && o.feedback.length > 0 && (
              <ul className={styles.feedback} aria-label={t('grading.why')}>
                {o.feedback.map((f, i) => (
                  <li key={i}>
                    <FeedbackText item={f} />
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      <p className={styles.saved}>
        {t('grading.saved')} <Link to="/progress">{t('grading.openResults')} →</Link>
      </p>
    </section>
  );
}
