import { useId, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ_OPTIONS, type QuizOption } from '@/data/hardware/anatomy';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import styles from './ChoiceQuiz.module.css';
import { grade, startAttempt, type Exercise, type GradeReport, type QuizWork } from '@/services/grading';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useProgressStore } from '@/store/progressStore';

/**
 * Three-question multiple-choice test (a / b / c), graded with
 * services/grading and saved to progress. `keyBase` is the locale path of
 * q1–q3 (`…quiz`). Mount with a `key` per device to reset it.
 */
export function ChoiceQuiz({ answers, keyBase, exercise }: { answers: readonly QuizOption[]; keyBase: string; exercise: Exercise<QuizWork> }) {
  const t = useT();
  const k = (path: string) => `${keyBase}.${path}` as TranslationKey;
  const uid = useId();
  const [picked, setPicked] = useState<Array<QuizOption | null>>([null, null, null]);
  const [checked, setChecked] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [attempt, setAttempt] = useState(() => startAttempt(exercise.id));
  const [report, setReport] = useState<GradeReport | null>(null);
  const score = picked.filter((p, i) => p === answers[i]).length;

  const check = () => {
    if (picked.some((p) => p === null)) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setChecked(true);
    if (checked) return;
    const answers = Object.fromEntries(picked.map((p, i) => [`q${i + 1}`, p === null ? null : QUIZ_OPTIONS.indexOf(p)]));
    const r = grade(exercise, { answers }, attempt);
    setAttempt(r.attempt);
    setReport(r.report);
    useProgressStore.getState().record(r.report);
  };
  // a retry continues the same attempt, so earlier mistakes still count
  const retry = () => {
    setPicked([null, null, null]);
    setChecked(false);
    setReport(null);
  };

  return (
    <form
      className={styles.quiz}
      onSubmit={(e) => {
        e.preventDefault();
        check();
      }}
    >
      {answers.map((answer, qi) => {
        const q = `q${qi + 1}`;
        const ok = picked[qi] === answer;
        return (
          <fieldset key={q} className={styles.question} disabled={checked}>
            <legend>
              <span className={styles.number}>{t('anatomy.quiz.legend', { n: qi + 1 })}</span>
              {t(k(`${q}.question`))}
            </legend>
            {QUIZ_OPTIONS.map((opt) => {
              const state = checked ? (opt === answer ? 'right' : opt === picked[qi] ? 'wrong' : undefined) : undefined;
              return (
                <label key={opt} className={styles.option} data-state={state}>
                  <input
                    type="radio"
                    name={`${uid}-${qi}`}
                    value={opt}
                    checked={picked[qi] === opt}
                    onChange={() => setPicked((prev) => prev.map((p, i) => (i === qi ? opt : p)))}
                  />
                  <span>{t(k(`${q}.${opt}`))}</span>
                </label>
              );
            })}
            {checked && (
              <p className={styles.feedback} data-ok={ok}>
                {ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
                <span>
                  <strong>
                    {ok ? t('anatomy.quiz.correct') : t('anatomy.quiz.wrong', { answer: t(k(`${q}.${answer}`)) })}
                  </strong>{' '}
                  {t(k(`${q}.explain`))}
                </span>
              </p>
            )}
          </fieldset>
        );
      })}

      {report && <GradeReportCard report={report} compact />}

      <div className={styles.actions} aria-live="polite">
        {checked ? (
          <>
            <p className={styles.score}>
              {score === answers.length ? t('anatomy.quiz.perfect') : t('anatomy.quiz.score', { score, total: answers.length })}
            </p>
            <button type="button" className={styles.secondary} onClick={retry}>
              <RotateCcw size={15} aria-hidden="true" />
              {t('anatomy.quiz.retry')}
            </button>
          </>
        ) : (
          <>
            {nudge && <p className={styles.nudge}>{t('anatomy.quiz.unanswered')}</p>}
            <button type="submit" className={styles.primary}>
              {t('anatomy.quiz.check')}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
