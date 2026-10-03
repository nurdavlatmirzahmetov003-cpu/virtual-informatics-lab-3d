import { useId, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ_OPTIONS, type AnatomyItem, type QuizOption } from '@/data/hardware/anatomy';
import { useT } from '@/hooks/useT';
import { itemKey } from './anatomyText';
import styles from './AnatomyQuiz.module.css';

/** Three-question check for one device. Mount with `key={item.id}` to reset per device. */
export function AnatomyQuiz({ item }: { item: AnatomyItem }) {
  const t = useT();
  const uid = useId();
  const [picked, setPicked] = useState<Array<QuizOption | null>>([null, null, null]);
  const [checked, setChecked] = useState(false);
  const [nudge, setNudge] = useState(false);
  const score = picked.filter((p, i) => p === item.answers[i]).length;

  const check = () => {
    if (picked.some((p) => p === null)) {
      setNudge(true);
      return;
    }
    setNudge(false);
    setChecked(true);
  };
  const retry = () => {
    setPicked([null, null, null]);
    setChecked(false);
  };

  return (
    <form
      className={styles.quiz}
      onSubmit={(e) => {
        e.preventDefault();
        check();
      }}
    >
      {item.answers.map((answer, qi) => {
        const q = `quiz.q${qi + 1}`;
        const ok = picked[qi] === answer;
        return (
          <fieldset key={q} className={styles.question} disabled={checked}>
            <legend>
              <span className={styles.number}>{t('anatomy.quiz.legend', { n: qi + 1 })}</span>
              {t(itemKey(item.id, `${q}.question`))}
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
                  <span>{t(itemKey(item.id, `${q}.${opt}`))}</span>
                </label>
              );
            })}
            {checked && (
              <p className={styles.feedback} data-ok={ok}>
                {ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <XCircle size={16} aria-hidden="true" />}
                <span>
                  <strong>
                    {ok ? t('anatomy.quiz.correct') : t('anatomy.quiz.wrong', { answer: t(itemKey(item.id, `${q}.${answer}`)) })}
                  </strong>{' '}
                  {t(itemKey(item.id, `${q}.explain`))}
                </span>
              </p>
            )}
          </fieldset>
        );
      })}

      <div className={styles.actions} aria-live="polite">
        {checked ? (
          <>
            <p className={styles.score}>
              {score === item.answers.length ? t('anatomy.quiz.perfect') : t('anatomy.quiz.score', { score, total: item.answers.length })}
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
