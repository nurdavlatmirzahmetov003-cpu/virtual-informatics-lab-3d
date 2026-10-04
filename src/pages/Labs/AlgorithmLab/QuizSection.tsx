import { useState } from 'react';
import { CircleCheck, Lightbulb, RefreshCw, ShieldCheck } from 'lucide-react';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { QUIZZES, QUIZ_IDS, makeQuiz, optionLabel, type QuizId, type QuizVariant } from '@/labs/AlgorithmLab';
import { grade, startAttempt, takeHint, toAssessment, type Attempt, type GradeReport } from '@/services/grading';
import { useProgressStore } from '@/store/progressStore';
import styles from './AlgorithmLab.module.css';

const tk = (key: string) => key as TranslationKey;
const newSeed = () => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;

/** The array of the question, with the indices the question talks about marked. */
function QuestionArray({ variant }: { variant: QuizVariant }) {
  const marked = variant.quiz === 'nextSwap' ? [Number(variant.params.j), Number(variant.params.j1)] : [];
  const sortedFrom = variant.quiz === 'nextSwap' ? Number(variant.params.last) + 1 : Infinity;
  return (
    <ol className={styles.quizArray}>
      {variant.array.map((v, i) => (
        <li key={i} data-marked={marked.includes(i)} data-sorted={i >= sortedFrom}>
          <b>{v}</b>
          <small>{i}</small>
        </li>
      ))}
    </ol>
  );
}

interface QuizState {
  variant: QuizVariant;
  choice: string | null;
  attempt: Attempt;
  report: GradeReport | null;
}

function fresh(quiz: QuizId, seed = newSeed()): QuizState {
  return { variant: makeQuiz(quiz, seed), choice: null, attempt: startAttempt(QUIZZES[quiz].id), report: null };
}

function QuizCard({ quiz }: { quiz: QuizId }) {
  const t = useT();
  const exercise = QUIZZES[quiz];
  const [state, setState] = useState(() => fresh(quiz));
  const { variant, choice, attempt, report } = state;
  const hintsLeft = exercise.hints.length - attempt.hintsUsed;
  const solved = report?.status === 'completed';

  const check = () => {
    const r = grade(exercise, { variant, choice }, attempt);
    useProgressStore.getState().record(toAssessment(r.report));
    setState({ ...state, attempt: r.attempt, report: r.report });
  };

  return (
    <article className={styles.quizCard}>
      <p className={styles.question}>{t(tk(exercise.instructions.key), variant.params)}</p>
      <QuestionArray variant={variant} />
      <div className={styles.options} role="radiogroup" aria-label={t('algorithms.quiz.options')}>
        {variant.options.map((o) => {
          const picked = choice === o.id;
          const verdict = report && picked ? (o.id === variant.correct ? 'right' : 'wrong') : solved && o.id === variant.correct ? 'right' : undefined;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={picked}
              data-verdict={verdict}
              className={styles.option}
              disabled={solved}
              onClick={() => setState({ ...state, choice: o.id, report: report && !solved ? null : report })}
            >
              <span className={styles.radio} aria-hidden="true" />
              {optionLabel(quiz, o)}
            </button>
          );
        })}
      </div>

      {attempt.hintsUsed > 0 && (
        <ol className={styles.hints}>
          {exercise.hints.slice(0, attempt.hintsUsed).map((h) => (
            <li key={h.key}>
              <Lightbulb size={14} aria-hidden="true" />
              {t(tk(h.key))}
            </li>
          ))}
        </ol>
      )}

      <div className={styles.quizActions}>
        <button type="button" className={styles.primary} onClick={check} disabled={!choice || solved}>
          <ShieldCheck size={16} aria-hidden="true" /> {t('algorithms.quiz.check')}
        </button>
        <button type="button" className={styles.secondary} onClick={() => setState({ ...state, attempt: takeHint(attempt, exercise) })} disabled={hintsLeft === 0 || solved}>
          <Lightbulb size={15} aria-hidden="true" />
          {hintsLeft ? (
            <>
              {t('algorithms.quiz.hint')} <small>{t('algorithms.quiz.hintCost')}</small>
            </>
          ) : (
            t('algorithms.quiz.noHints')
          )}
        </button>
        <button type="button" className={styles.secondary} onClick={() => setState(fresh(quiz))}>
          <RefreshCw size={15} aria-hidden="true" /> {t('algorithms.quiz.next')}
        </button>
      </div>

      {report && (
        <>
          <div className={styles.explain} data-tone={solved ? 'ok' : 'fail'}>
            {solved ? <CircleCheck size={16} aria-hidden="true" /> : <Lightbulb size={16} aria-hidden="true" />}
            <div>
              <h3>{t('algorithms.quiz.explanation')}</h3>
              <p>{t(tk(`algorithms.quiz.${quiz}.why`), variant.params)}</p>
            </div>
          </div>
          <GradeReportCard key={report.submissions} report={report} />
        </>
      )}
    </article>
  );
}

export function QuizSection({ quiz, onQuiz }: { quiz: QuizId; onQuiz: (q: QuizId) => void }) {
  const t = useT();
  const best = useProgressStore((s) => s.best);
  return (
    <section className={styles.quiz} id="quiz" aria-labelledby="quiz-title">
      <header className={styles.quizHead}>
        <h2 id="quiz-title">{t('algorithms.quiz.title')}</h2>
        <p>{t('algorithms.quiz.intro')}</p>
      </header>
      <div className={styles.quizTabs} role="tablist">
        {QUIZ_IDS.map((q, i) => {
          const score = best.find((a) => a.exercise === QUIZZES[q].id)?.score;
          return (
            <button key={q} type="button" role="tab" aria-selected={q === quiz} onClick={() => onQuiz(q)}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <b>{t(tk(`algorithms.quiz.${q}.title`))}</b>
              {score !== undefined && (
                <small data-done={score >= 70}>
                  {score >= 70 && <CircleCheck size={12} aria-hidden="true" />} {t('algorithms.quiz.best', { score: Math.round(score / 10) })}
                </small>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">
        <QuizCard key={quiz} quiz={quiz} />
      </div>
    </section>
  );
}
