import { useEffect, useMemo, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { BadgeMedal } from '@/components/achievements/BadgeMedal';
import { rarityRank } from '@/services/progress/rarity';
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
import { formatDateTime } from './dates';
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
      {/* 0.37: the learning path built from these results */}
      <nav className={styles.quickLinks} aria-label={t('path.title')}>
        <Link to="/path">
          {t('nav.path')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
        <Link to="/progress/report">
          {t('nav.report')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </nav>
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
        {/* V4 §9: the full screen is /achievements; here the earned medals, rarest first */}
        <Link to="/achievements" className={styles.medalStrip} aria-label={t('achievements.toast.open')}>
          {achievements
            .filter((a) => a.unlocked || unlockedAt[a.id] !== undefined)
            .sort((a, b) => rarityRank(b.id) - rarityRank(a.id))
            .slice(0, 8)
            .map((a) => (
              <BadgeMedal key={a.id} id={a.id} unlocked size={52} />
            ))}
          <span className={styles.stripMore}>
            {unlockedCount === 0 ? t('achievements.summary.recentEmpty') : t('achievements.toast.open')} <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
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
