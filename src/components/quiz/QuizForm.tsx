import { useId, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import styles from './ChoiceQuiz.module.css';
import { grade, startAttempt, type Exercise, type GradeReport, type QuizWork } from '@/services/grading';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useProgressStore } from '@/store/progressStore';

/** One question as locale keys: its prompt, the option texts, the right one and why. */
export interface QuizFormQuestion {
  prompt: string;
  options: readonly string[];
  correct: number;
  explain: string;
}

const key = (k: string) => k as TranslationKey;

/**
 * Multiple-choice test graded with services/grading and saved to progress
 * (the Anatomy, lab device and teardown tests). Answers go to the exercise
 * as `q1…qN` → option index. Mount with a `key` per exercise to reset it.
 */
export function QuizForm({ questions, exercise }: { questions: readonly QuizFormQuestion[]; exercise: Exercise<QuizWork> }) {
  const t = useT();
  const uid = useId();
  const [picked, setPicked] = useState<Array<number | null>>(() => questions.map(() => null));
  const [checked, setChecked] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [attempt, setAttempt] = useState(() => startAttempt(exercise.id));
  const [report, setReport] = useState<GradeReport | null>(null);
  const score = picked.filter((p, i) => p === questions[i].correct).length;

  const check = () => {
    if (picked.some((p) => p === null)) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setChecked(true);
    if (checked) return;
    const answers = Object.fromEntries(picked.map((p, i) => [`q${i + 1}`, p]));
    const r = grade(exercise, { answers }, attempt);
    setAttempt(r.attempt);
    setReport(r.report);
    useProgressStore.getState().record(r.report);
  };
  // a retry continues the same attempt, so earlier mistakes still count
  const retry = () => {
    setPicked(questions.map(() => null));
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
      {questions.map((q, qi) => {
        const ok = picked[qi] === q.correct;
        return (
          <fieldset key={qi} className={styles.question} disabled={checked}>
            <legend>
              <span className={styles.number}>{t('anatomy.quiz.legend', { n: qi + 1 })}</span>
              {t(key(q.prompt))}
            </legend>
            {q.options.map((opt, oi) => {
              const state = checked ? (oi === q.correct ? 'right' : oi === picked[qi] ? 'wrong' : undefined) : undefined;
              return (
                <label key={oi} className={styles.option} data-state={state}>
                  <input
                    type="radio"
                    name={`${uid}-${qi}`}
                    value={oi}
                    checked={picked[qi] === oi}
                    onChange={() => setPicked((prev) => prev.map((p, i) => (i === qi ? oi : p)))}
                  />
                  <span>{t(key(opt))}</span>
                </label>
              );
            })}
            {checked && (
              <p className={styles.feedback} data-ok={ok}>
                {ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
                <span>
                  <strong>{ok ? t('anatomy.quiz.correct') : t('anatomy.quiz.wrong', { answer: t(key(q.options[q.correct])) })}</strong> {t(key(q.explain))}
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
            <p className={styles.score}>{score === questions.length ? t('anatomy.quiz.perfect') : t('anatomy.quiz.score', { score, total: questions.length })}</p>
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
