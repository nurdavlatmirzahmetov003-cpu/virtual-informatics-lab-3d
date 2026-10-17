import { useEffect, useMemo, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Lock } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { ACHIEVEMENT_ICONS } from '@/components/achievements/achievementIcons';
import { GamePanel } from '@/components/game/GamePanel';
import { STATUS_ICON } from '@/components/progress/statusIcons';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { formatDuration } from '@/services/grading';
import { evaluateAchievements, labOf, taskById, type AttemptRecord } from '@/services/progress';
import { useProgressStore, useProgressSummary } from '@/store/progressStore';
import { LAB_MODULES } from '@/pages/Labs/modules';
import { ActivityChart } from './ActivityChart';
import { DataPanel } from './DataPanel';
import { formatDateTime, formatDay } from './dates';
import styles from './Progress.module.css';

const tk = (key: string) => key as TranslationKey;
const tone = (lab: string) => LAB_MODULES.find((m) => m.id === lab)?.tone ?? 'var(--accent)';

function Stat({ label, value, unit, hint }: { label: string; value: string | number; unit?: string; hint: string }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>
        {value}
        {unit && <small>{unit}</small>}
      </strong>
      <p>{hint}</p>
    </div>
  );
}

/** "Network lab · Router and LAN", with fallbacks for retired and prototype ids. */
function useAttemptTitle() {
  const t = useT();
  return (a: AttemptRecord) => {
    const info = taskById(a.exerciseId);
    const lab = labOf(a.exerciseId);
    const labName = lab ? t(`labs.modules.${lab}.title`) : '';
    if (info) return { lab: labName, task: t(tk(info.title)) };
    if (a.exerciseId.startsWith('legacy:')) return { lab: labName, task: t('progress.recent.legacy') };
    return { lab: labName, task: t('progress.recent.retired') };
  };
}

export default function ProgressPage() {
  const t = useT();
  const summary = useProgressSummary();
  const attempts = useProgressStore((s) => s.attempts);
  const unlockedAt = useProgressStore((s) => s.achievements);
  const achievements = useMemo(() => evaluateAchievements(summary, attempts), [summary, attempts]);
  const titleOf = useAttemptTitle();
  const { hash } = useLocation();
  const { totals } = summary;
  const unlockedCount = achievements.filter((a) => a.unlocked || unlockedAt[a.id] !== undefined).length;

  // the toast links to #achievements
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash]);

  return (
    <PageLayout eyebrow={t('progress.eyebrow')} title={t('progress.title')} subtitle={t('progress.subtitle')}>
      <GamePanel />
      <div className={styles.stats}>
        <Stat label={t('progress.stats.labs')} value={totals.labsCompleted} unit={`/${summary.labs.length}`} hint={t('progress.stats.labsHint', { done: totals.labsCompleted, total: summary.labs.length })} />
        <Stat
          label={t('progress.stats.average')}
          value={totals.average === null ? t('progress.stats.none') : totals.average}
          unit={totals.average === null ? undefined : '%'}
          hint={t('progress.stats.averageHint')}
        />
        <Stat label={t('progress.stats.points')} value={totals.points} unit={`/${totals.maxPoints}`} hint={t('progress.stats.pointsHint', { max: totals.maxPoints })} />
        <Stat label={t('progress.stats.percent')} value={totals.percent} unit="%" hint={t('progress.stats.percentHint', { done: totals.completed, total: totals.tasks })} />
      </div>

      <div className={styles.twoCol}>
        <section className={styles.panel} aria-labelledby="labs-title">
          <div className={styles.panelHead}>
            <h2 id="labs-title">{t('progress.labs.title')}</h2>
          </div>
          <ul className={styles.labs}>
            {summary.labs.map((l) => (
              <li key={l.lab} style={{ '--tone': tone(l.lab) } as CSSProperties}>
                <Link to={`/assignments?lab=${l.lab}`} className={styles.labRow}>
                  <span className={styles.labName}>{t(`labs.modules.${l.lab}.title`)}</span>
                  <span className={styles.labNums}>
                    {t('progress.labs.row', { done: l.completed, total: l.total })}
                    <small>{l.average === null ? t('progress.labs.noScore') : t('progress.labs.avg', { avg: l.average })}</small>
                  </span>
                  <span
                    className={styles.track}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={l.total}
                    aria-valuenow={l.completed}
                    aria-label={t(`labs.modules.${l.lab}.title`)}
                  >
                    <i style={{ width: `${(l.completed / l.total) * 100}%` }} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.panel}>
          <ActivityChart attempts={attempts} />
        </section>
      </div>

      <section className={styles.section} id="achievements" aria-labelledby="ach-title">
        <div className={styles.sectionHead}>
          <h2 id="ach-title">{t('progress.achievements.title')}</h2>
          <span>{t('progress.achievements.count', { n: unlockedCount, total: achievements.length })}</span>
        </div>
        <ul className={styles.achievements}>
          {achievements.map((a) => {
            const Icon = ACHIEVEMENT_ICONS[a.id];
            const at = unlockedAt[a.id];
            const unlocked = at !== undefined || a.unlocked;
            return (
              <li key={a.id} className={styles.achievement} data-unlocked={unlocked}>
                <span className={styles.achIcon} aria-hidden="true">
                  <Icon size={20} strokeWidth={1.6} />
                  {!unlocked && (
                    <span className={styles.lock}>
                      <Lock size={10} />
                    </span>
                  )}
                </span>
                <div>
                  <b>{t(tk(`achievements.items.${a.id}.name`))}</b>
                  <p>{t(tk(`achievements.items.${a.id}.condition`), { target: a.target })}</p>
                  {unlocked ? (
                    <small className={styles.achDate}>{at !== undefined ? t('progress.achievements.unlockedAt', { date: formatDay(at) }) : null}</small>
                  ) : (
                    <span className={styles.achProgress}>
                      <span className={styles.track} aria-hidden="true">
                        <i style={{ width: `${(a.current / a.target) * 100}%` }} />
                      </span>
                      <small>
                        <span className="visually-hidden">{t('progress.achievements.locked')}: </span>
                        {t('progress.achievements.progress', { current: a.current, target: a.target })}
                      </small>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="recent-title">
        <div className={styles.sectionHead}>
          <h2 id="recent-title">{t('progress.recent.title')}</h2>
          <Link to="/assignments" className={styles.sectionLink}>
            {t('progress.recent.tasks')} <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {attempts.length === 0 ? (
          <p className={styles.muted}>{t('progress.recent.empty')}</p>
        ) : (
          <ol className={styles.history}>
            {[...attempts]
              .reverse()
              .slice(0, 12)
              .map((a) => {
                const title = titleOf(a);
                const status = a.status === 'completed' ? 'completed' : 'inProgress';
                const Icon = STATUS_ICON[status];
                const info = taskById(a.exerciseId);
                const body = (
                  <>
                    <Icon size={16} className={styles.histIcon} data-status={status} aria-hidden="true" />
                    <div className={styles.histMain}>
                      <small>{title.lab}</small>
                      <b>{title.task}</b>
                      <span>
                        {formatDateTime(a.at)} · {t('progress.recent.meta', { time: formatDuration(a.seconds), errors: a.errors, hints: a.hints })}
                      </span>
                    </div>
                    <div className={styles.histScore} data-status={status}>
                      <strong>
                        {a.score}
                        <small>/{a.maxScore}</small>
                      </strong>
                      <span>{t(status === 'completed' ? 'tasks.status.completed' : 'grading.incomplete')}</span>
                    </div>
                  </>
                );
                return <li key={a.id}>{info ? <Link to={info.path} className={styles.histRow}>{body}</Link> : <div className={styles.histRow}>{body}</div>}</li>;
              })}
          </ol>
        )}
      </section>

      <DataPanel />
    </PageLayout>
  );
}
