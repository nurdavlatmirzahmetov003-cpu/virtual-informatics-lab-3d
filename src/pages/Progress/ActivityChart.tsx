import { useMemo, useState } from 'react';
import { useT } from '@/hooks/useT';
import { activityByDay, type AttemptRecord } from '@/services/progress';
import { formatDay } from './dates';
import styles from './Progress.module.css';

/**
 * Graded attempts per day, last 14 days. One series, one axis: column height
 * is the number of attempts; the tooltip adds how many were completed.
 * A visually hidden table carries the same numbers for screen readers.
 */
export function ActivityChart({ attempts }: { attempts: readonly AttemptRecord[] }) {
  const t = useT();
  const days = useMemo(() => activityByDay(attempts, 14), [attempts]);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.attempts));
  const total = days.reduce((n, d) => n + d.attempts, 0);

  return (
    <figure className={styles.chart}>
      <figcaption className={styles.panelHead}>
        <h2>{t('progress.activity.title')}</h2>
        <span>{total ? t('progress.activity.total', { n: total }) : t('progress.activity.subtitle')}</span>
      </figcaption>
      {total === 0 ? (
        <p className={styles.muted}>{t('progress.activity.empty')}</p>
      ) : (
        <div className={styles.plot} aria-hidden="true">
          <span className={styles.yMax}>{max}</span>
          <div className={styles.columns} onMouseLeave={() => setHover(null)}>
            {days.map((d, i) => (
              <div key={d.date} className={styles.col} data-active={hover === i} onMouseEnter={() => setHover(i)}>
                <span className={styles.bar} style={{ height: `${(d.attempts / max) * 100}%` }} data-zero={d.attempts === 0} />
                <span className={styles.day} data-odd={i % 2 === 1}>
                  {new Date(d.date).getDate()}
                </span>
                {hover === i && (
                  <span className={styles.tip} data-edge={i < 2 ? 'start' : i > 11 ? 'end' : undefined}>
                    {t('progress.activity.tooltip', { date: formatDay(d.date, false), n: d.attempts, done: d.completed })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <table className="visually-hidden">
        <caption>{t('progress.activity.table')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('progress.activity.date')}</th>
            <th scope="col">{t('progress.activity.attempts')}</th>
            <th scope="col">{t('progress.activity.completed')}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>{formatDay(d.date, false)}</td>
              <td>{d.attempts}</td>
              <td>{d.completed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
