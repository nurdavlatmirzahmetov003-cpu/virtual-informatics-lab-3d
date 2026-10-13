import type { CSSProperties, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import { isLabId, type ProgressSummary } from '@/services/progress';
import { useProgressSummary } from '@/store/progressStore';
import { ModulePreview } from './ModulePreview';
import { LAB_MODULES, type LabModule, type ModuleId } from './modules';
import styles from './LabsPage.module.css';

/** Tasks counted on a card: a lab's own, or all of them for the summary modules. */
function countsOf(id: ModuleId, summary: ProgressSummary) {
  if (isLabId(id)) {
    const lab = summary.labs.find((l) => l.lab === id)!;
    return { done: lab.completed, total: lab.total };
  }
  if (id === 'assignments' || id === 'results') return { done: summary.totals.completed, total: summary.totals.tasks };
  if (id === 'connect' || id === 'sim') {
    const tasks = summary.tasks.filter((t) => t.info.type === id);
    return { done: tasks.filter((t) => t.status === 'completed').length, total: tasks.length };
  }
  return { done: 0, total: 0 };
}

/** Pointer position → card tilt (CSS custom properties, no re-render). */
function tilt(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
  el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
  el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
}

function resetTilt(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty('--rx', '0deg');
  e.currentTarget.style.setProperty('--ry', '0deg');
}

function ModuleCard({ module, index, done, total }: { module: LabModule; index: number; done: number; total: number }) {
  const t = useT();
  const { id, icon: Icon, status, to, tone } = module;
  const soon = status === 'soon';
  const body = (
    <>
      <div className={styles.visual}>
        <ModulePreview id={id} />
      </div>
      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
          <span className={styles.status} data-status={status}>
            {soon && <Clock3 size={12} aria-hidden="true" />}
            {t(`labs.status.${status}`)}
          </span>
        </div>
        <h2 className={styles.name}>
          <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
          {t(`labs.modules.${id}.title`)}
        </h2>
        <p className={styles.desc}>{t(`labs.modules.${id}.desc`)}</p>
        {status === 'beta' && <p className={styles.note}>{t('labs.betaNote')}</p>}
        {soon && <p className={styles.note}>{t('labs.soonNote')}</p>}
        <div className={styles.foot}>
          <span className={styles.tag}>{t(`labs.modules.${id}.tag`)}</span>
          {total > 0 && !soon && (
            <span className={styles.progress} title={t('labs.tasksDone', { done, total })}>
              <span className={styles.bar}>
                <span style={{ width: `${(done / total) * 100}%` }} />
              </span>
              {done}/{total}
            </span>
          )}
          <span className={styles.cta} aria-hidden={!soon}>
            {soon ? t('labs.soonCta') : t('labs.open')}
            {!soon && <ArrowUpRight size={15} aria-hidden="true" />}
          </span>
        </div>
      </div>
    </>
  );

  const style = { '--tone': tone } as CSSProperties;
  // a module that is not built yet is a card, not a link to an empty page
  if (soon) {
    return (
      <li className={styles.card} data-id={id} data-status={status} style={style}>
        <article aria-disabled="true" className={styles.inner}>
          {body}
        </article>
      </li>
    );
  }
  return (
    <li className={styles.card} data-id={id} data-status={status} style={style}>
      <Link to={to} className={styles.inner} onPointerMove={tilt} onPointerLeave={resetTilt} aria-label={`${t(`labs.modules.${id}.title`)} — ${t(`labs.status.${status}`)}`}>
        {body}
      </Link>
    </li>
  );
}

export default function LabsPage() {
  const t = useT();
  useDocumentTitle(t('labs.title'));
  const summary = useProgressSummary();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('labs.eyebrow')}</span>
        <h1>{t('labs.title')}</h1>
        <p>{t('labs.subtitle')}</p>
      </header>
      <ol className={styles.grid}>
        {LAB_MODULES.map((m, i) => {
          const { done, total } = countsOf(m.id, summary);
          return <ModuleCard key={m.id} module={m} index={i} done={done} total={total} />;
        })}
      </ol>
    </div>
  );
}
