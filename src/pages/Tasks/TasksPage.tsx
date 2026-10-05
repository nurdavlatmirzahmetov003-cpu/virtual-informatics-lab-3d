import { useMemo, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { LAB_IDS, isLabId, recommendNext, type LabId, type TaskState, type TaskStatus } from '@/services/progress';
import { useProgressSummary } from '@/store/progressStore';
import { LAB_MODULES } from '@/pages/Labs/modules';
import { STATUS_ICON } from '@/components/progress/statusIcons';
import styles from './Tasks.module.css';

const tk = (key: string) => key as TranslationKey;
const STATUSES: readonly TaskStatus[] = ['notStarted', 'inProgress', 'completed'];
const isStatus = (v: unknown): v is TaskStatus => STATUSES.includes(v as TaskStatus);

const labModule = (lab: LabId) => LAB_MODULES.find((m) => m.id === lab)!;

function StatusBadge({ status }: { status: TaskStatus }) {
  const t = useT();
  const Icon = STATUS_ICON[status];
  return (
    <span className={styles.status} data-status={status}>
      <Icon size={13} aria-hidden="true" />
      {t(`tasks.status.${status}`)}
    </span>
  );
}

function TaskRow({ task }: { task: TaskState }) {
  const t = useT();
  const { info, status, progress } = task;
  return (
    <li>
      <Link to={info.path} className={styles.row} data-status={status}>
        <div className={styles.rowMain}>
          <b>{t(tk(info.title))}</b>
          <p>{t(tk(info.summary))}</p>
        </div>
        <div className={styles.rowMeta}>
          <StatusBadge status={status} />
          <span className={styles.score}>
            {progress ? t('tasks.best', { score: progress.best.score, max: progress.best.maxScore }) : t('tasks.maxScore', { max: info.maxScore })}
          </span>
          {progress && <span className={styles.attempts}>{t('tasks.attempts', { n: progress.attempts })}</span>}
        </div>
        <ArrowRight size={16} className={styles.go} aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function TasksPage() {
  const t = useT();
  const summary = useProgressSummary();
  const [params, setParams] = useSearchParams();
  const status = isStatus(params.get('status')) ? (params.get('status') as TaskStatus) : null;
  const lab = isLabId(params.get('lab')) ? (params.get('lab') as LabId) : null;
  const next = useMemo(() => recommendNext(summary), [summary]);

  const setFilter = (key: 'status' | 'lab', value: string | null) => {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  const counts = Object.fromEntries(STATUSES.map((s) => [s, summary.tasks.filter((x) => x.status === s && (!lab || x.info.lab === lab)).length])) as Record<TaskStatus, number>;
  const groups = LAB_IDS.filter((l) => !lab || l === lab)
    .map((l) => ({ lab: l, summary: summary.labs.find((s) => s.lab === l)!, tasks: summary.tasks.filter((x) => x.info.lab === l && (!status || x.status === status)) }))
    .filter((g) => g.tasks.length > 0);
  const { totals } = summary;

  return (
    <PageLayout eyebrow={t('tasks.eyebrow')} title={t('labs.modules.assignments.title')} subtitle={t('tasks.intro')}>
      <div className={styles.top}>
        <section className={styles.next} aria-labelledby="next-title">
          <span className={styles.eyebrow} id="next-title">
            {t('tasks.next.eyebrow')}
          </span>
          {next ? (
            <div className={styles.nextBody} style={{ '--tone': labModule(next.task.info.lab).tone } as CSSProperties}>
              <span className={styles.nextLab}>{t(`labs.modules.${next.task.info.lab}.title`)}</span>
              <h2>{t(tk(next.task.info.title))}</h2>
              <p>{t(tk(next.task.info.summary))}</p>
              <p className={styles.reason}>{t(`tasks.next.reason.${next.reason}`)}</p>
              <Link to={next.task.info.path} className={styles.cta}>
                {t(next.reason === 'continue' ? 'tasks.next.continue' : 'tasks.next.start')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className={styles.nextBody}>
              <p>{t('tasks.next.allDone')}</p>
              <Link to="/progress" className={styles.cta}>
                {t('tasks.next.results')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>

        <section className={styles.overview} aria-label={t('tasks.overview', { done: totals.completed, total: totals.tasks })}>
          <strong>
            {totals.completed}
            <small>/{totals.tasks}</small>
          </strong>
          <span>{t('tasks.overview', { done: totals.completed, total: totals.tasks })}</span>
          <div className={styles.meter} aria-hidden="true">
            <i style={{ width: `${(totals.completed / totals.tasks) * 100}%` }} data-status="completed" />
            <i style={{ width: `${(totals.inProgress / totals.tasks) * 100}%` }} data-status="inProgress" />
          </div>
          <ul className={styles.legend}>
            {STATUSES.map((s) => (
              <li key={s} data-status={s}>
                {t(`tasks.status.${s}`)} <b>{summary.tasks.filter((x) => x.status === s).length}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className={styles.filters} role="group" aria-label={t('tasks.filter.label')}>
        <div className={styles.chips} role="group" aria-label={t('tasks.filter.status')}>
          <button type="button" aria-pressed={!status} onClick={() => setFilter('status', null)}>
            {t('tasks.filter.all')}
          </button>
          {STATUSES.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} data-status={s} onClick={() => setFilter('status', status === s ? null : s)}>
              {t(`tasks.status.${s}`)} <span>{counts[s]}</span>
            </button>
          ))}
        </div>
        <div className={styles.chips} role="group" aria-label={t('tasks.filter.lab')}>
          <button type="button" aria-pressed={!lab} onClick={() => setFilter('lab', null)}>
            {t('tasks.filter.allLabs')}
          </button>
          {LAB_IDS.map((l) => (
            <button key={l} type="button" aria-pressed={lab === l} onClick={() => setFilter('lab', lab === l ? null : l)} style={{ '--tone': labModule(l).tone } as CSSProperties}>
              {t(`labs.modules.${l}.title`)}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 && <p className={styles.empty}>{t('tasks.empty')}</p>}
      {groups.map((g) => {
        const m = labModule(g.lab);
        const Icon = m.icon;
        return (
          <section key={g.lab} className={styles.group} style={{ '--tone': m.tone } as CSSProperties} aria-labelledby={`lab-${g.lab}`}>
            <header className={styles.groupHead}>
              <span className={styles.groupIcon}>
                <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              </span>
              <h2 id={`lab-${g.lab}`}>{t(`labs.modules.${g.lab}.title`)}</h2>
              <span className={styles.groupCount}>{t('tasks.labProgress', { done: g.summary.completed, total: g.summary.total })}</span>
              <span className={styles.groupBar} aria-hidden="true">
                <i style={{ width: `${(g.summary.completed / g.summary.total) * 100}%` }} />
              </span>
            </header>
            <ol className={styles.rows}>
              {g.tasks.map((task) => (
                <TaskRow key={task.info.id} task={task} />
              ))}
            </ol>
          </section>
        );
      })}
    </PageLayout>
  );
}
