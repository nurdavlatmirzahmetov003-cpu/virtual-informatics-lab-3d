import { Layers } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { Step } from '@/labs/AlgorithmLab';
import styles from './AlgorithmLab.module.css';

/** The recursion call stack: newest frame on top, waiting frames below it. */
export function StackView({ step }: { step: Step }) {
  const t = useT();
  const frames = step.stack;
  return (
    <div className={styles.stackView} aria-label={t('algorithms.ui.stack')}>
      <h3>
        <Layers size={15} aria-hidden="true" /> {t('algorithms.ui.stack')}
      </h3>
      {frames.length === 0 ? (
        <p className={styles.stackEmpty}>{step.done ? `${t('algorithms.ui.stackEmpty')} · ${t('algorithms.ui.done')}` : t('algorithms.ui.stackEmpty')}</p>
      ) : (
        <ol className={styles.frames}>
          {[...frames].reverse().map((f, i) => (
            <li key={f.id} className={styles.frame} data-status={f.status} style={{ ['--depth' as string]: frames.length - 1 - i }}>
              <code>fact({f.n})</code>
              <span>{t(`algorithms.frame.${f.status}`, { result: f.result ?? '' })}</span>
              {i === 0 && <small>{t('algorithms.ui.stackTop')}</small>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
