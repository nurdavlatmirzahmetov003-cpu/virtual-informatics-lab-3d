/**
 * `/progress/report` — the weekly report for parents (0.37): one week of
 * the student's work in plain words, with the week's numbers, the labs,
 * what was finished, what to help with and the next step. Prints on one
 * A4 page («Print / save as PDF»); the arrows move between weeks.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { formatDuration } from '@/services/grading';
import { taskById } from '@/services/progress';
import { nextStep } from '@/services/progress/learningPath';
import { currentWeek, weeklyReport } from '@/services/progress/weeklyReport';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatLongDate } from './dates';
import styles from './Report.module.css';

const k = (s: string) => s as TranslationKey;

export default function ReportPage() {
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const attempts = useProgressStore((s) => s.attempts);
  const exercises = useProgressStore((s) => s.exercises);
  const achievements = useProgressStore((s) => s.achievements);
  const [now] = useState(() => Date.now());
  const [week, setWeek] = useState(() => currentWeek(now));
  const r = useMemo(() => weeklyReport({ attempts, exercises, achievements }, week), [attempts, exercises, achievements, week]);
  const next = nextStep({ attempts, exercises } as Parameters<typeof nextStep>[0]);
  const taskName = (id: string) => {
    const info = taskById(id);
    return info ? `${t(k(`labs.modules.${info.lab}.title`))} · ${t(k(info.title))}` : id;
  };
  const range = `${formatLongDate(r.from, language)} — ${formatLongDate(r.to - 1, language)}`;
  const isCurrent = week === currentWeek(now);

  return (
    <PageLayout eyebrow={t('report.eyebrow')} title={t('report.title')} subtitle={t('report.subtitle')}>
      <div className={styles.tools}>
        <button type="button" onClick={() => setWeek(week - 1)} aria-label={t('report.prev')}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <b aria-live="polite">{range}</b>
        <button type="button" onClick={() => setWeek(week + 1)} disabled={isCurrent} aria-label={t('report.next')}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button type="button" className={styles.print} onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> {t('report.print')}
        </button>
      </div>

      <article className={styles.sheet}>
        <header className={styles.sheetHead}>
          <h2>{t('report.sheetTitle', { name: user?.displayName ?? t('report.student') })}</h2>
          <p>{range}</p>
        </header>

        {r.attempts === 0 ? (
          <p className={styles.empty}>{t('report.empty')}</p>
        ) : (
          <>
            <dl className={styles.numbers}>
              <div>
                <dt>{t('report.days')}</dt>
                <dd>{r.activeDays} / 7</dd>
              </div>
              <div>
                <dt>{t('report.attempts')}</dt>
                <dd>{r.attempts}</dd>
              </div>
              <div>
                <dt>{t('report.average')}</dt>
                <dd>{r.average}%</dd>
              </div>
              <div>
                <dt>{t('report.time')}</dt>
                <dd>{formatDuration(r.seconds)}</dd>
              </div>
            </dl>

            <section>
              <h3>{t('report.labs')}</h3>
              <ul className={styles.list}>
                {r.labs.map((l) => (
                  <li key={l.lab}>
                    {t(k(`labs.modules.${l.lab}.title`))} — {t('report.attemptsN', { n: l.attempts })}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3>{t('report.completed', { n: r.completed.length })}</h3>
              {r.completed.length ? (
                <ul className={styles.list}>
                  {r.completed.map((id) => (
                    <li key={id}>{taskName(id)}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{t('report.noneCompleted')}</p>
              )}
            </section>

            {r.achievements.length > 0 && (
              <section>
                <h3>{t('report.achievements')}</h3>
                <ul className={styles.list}>
                  {r.achievements.map((id) => (
                    <li key={id}>{t(k(`achievements.items.${id}.name`))}</li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3>{t('report.help')}</h3>
              {r.struggling.length ? (
                <ul className={styles.list}>
                  {r.struggling.map((id) => (
                    <li key={id}>{taskName(id)}</li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>{t('report.noStruggles')}</p>
              )}
            </section>
          </>
        )}

        {next && (
          <section>
            <h3>{t('report.nextStep')}</h3>
            <p>{taskName(next.id)}</p>
          </section>
        )}
        <p className={styles.note}>{t('report.note')}</p>
      </article>

      <p className={styles.back}>
        <Link to="/progress">{t('report.back')}</Link>
      </p>
    </PageLayout>
  );
}
