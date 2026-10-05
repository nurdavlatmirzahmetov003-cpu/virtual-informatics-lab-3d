import { useState } from 'react';
import { CircleCheck, CircleX, RotateCcw, ShieldCheck } from 'lucide-react';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import type { OptionLabel, Question, QuizWork } from '@/labs/Experiments/quiz';
import { grade, startAttempt, toAssessment, type Exercise, type GradeReport } from '@/services/grading';
import { useProgressStore } from '@/store/progressStore';
import styles from './ExperimentLab.module.css';

const tk = (key: string) => key as TranslationKey;

function useOptionText() {
  const t = useT();
  return (o: OptionLabel) => ('text' in o ? o.text : t(tk(o.key), o.params));
}

/** 2–3 multiple-choice questions, graded by the shared grading service. */
export function Quiz({ experiment, questions, exercise }: { experiment: string; questions: Question[]; exercise: Exercise<QuizWork> }) {
  const t = useT();
  const optionText = useOptionText();
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [attempt, setAttempt] = useState(() => startAttempt(exercise.id));
  const [report, setReport] = useState<GradeReport | null>(null);
  const done = report?.status === 'completed';
  const all = questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== null);

  const check = () => {
    const r = grade(exercise, { answers }, attempt);
    useProgressStore.getState().record(toAssessment(r.report));
    setAttempt(r.attempt);
    setReport(r.report);
  };

  return (
    <section className={styles.quiz} aria-labelledby={`quiz-${experiment}`}>
      <h2 id={`quiz-${experiment}`}>{t('experiments.ui.quiz')}</h2>
      <ol className={styles.questions}>
        {questions.map((q, n) => {
          const chosen = answers[q.id];
          const checked = report !== null && chosen !== undefined && chosen !== null;
          const right = checked && chosen === q.correct;
          return (
            <li key={q.id} data-result={checked ? (right ? 'right' : 'wrong') : undefined}>
              <p className={styles.prompt}>
                <span>{n + 1}</span>
                {t(tk(q.prompt.key), q.prompt.params)}
              </p>
              <div className={styles.options} role="radiogroup" aria-label={t(tk(q.prompt.key), q.prompt.params)}>
                {q.options.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={chosen === i}
                    disabled={done}
                    data-verdict={report && chosen === i ? (i === q.correct ? 'right' : 'wrong') : done && i === q.correct ? 'right' : undefined}
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [q.id]: i }));
                      if (report && !done) setReport(null);
                    }}
                  >
                    <i aria-hidden="true" />
                    {optionText(o)}
                  </button>
                ))}
              </div>
              {checked && (
                <p className={styles.why} data-right={right}>
                  {right ? <CircleCheck size={15} aria-hidden="true" /> : <CircleX size={15} aria-hidden="true" />}
                  {t(tk(q.why.key), q.why.params)}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      <div className={styles.quizActions}>
        <button type="button" className={styles.primary} onClick={check} disabled={!all || done}>
          <ShieldCheck size={16} aria-hidden="true" /> {t('experiments.ui.check')}
        </button>
        {done && (
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setAnswers({});
              setReport(null);
              setAttempt(startAttempt(exercise.id));
            }}
          >
            <RotateCcw size={15} aria-hidden="true" /> {t('experiments.ui.again')}
          </button>
        )}
      </div>
      {report && <GradeReportCard key={report.submissions} report={report} />}
    </section>
  );
}
