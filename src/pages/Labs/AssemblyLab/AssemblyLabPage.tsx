import { lazy, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, Lightbulb, MousePointer2, Power, RotateCcw, TriangleAlert, Volume2, VolumeX } from 'lucide-react';
import { SceneCanvas } from '@/components/3d/SceneCanvas';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { STEPS, STEP_IDS, nextStep, progressOf, type StepId } from '@/labs/AssemblyLab';
import { formatDuration } from '@/services/grading';
import { useAssemblyLabStore, type LabMessage } from '@/store/assemblyLabStore';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { useSettingsStore } from '@/store/settingsStore';
import styles from './AssemblyLab.module.css';

const AssemblyLabScene = lazy(() => import('@/scenes/AssemblyLab/AssemblyLabScene'));
const tk = (key: string) => key as TranslationKey;

/** Step ids inside a message become readable names ("cpu,ram" → "Процессор, Жедел жад"). */
function useMessageText() {
  const t = useT();
  return (m: LabMessage) => {
    const params: Record<string, string> = { ...m.params };
    if (params.missing) params.missing = params.missing.split(',').map((id) => t(tk(`pcLab.steps.${id}.part`))).join(', ');
    if (params.where) params.where = t(tk(`pcLab.steps.${params.where}.slot`));
    return t(tk(m.key), params);
  };
}

function Clock({ startedAt, frozen }: { startedAt: number; frozen: number | null }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (frozen !== null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [frozen]);
  return <>{formatDuration(frozen ?? Math.floor((now - startedAt) / 1000))}</>;
}

export default function AssemblyLabPage() {
  const t = useT();
  useDocumentTitle(t('labs.modules.assembly.title'));
  const messageText = useMessageText();
  const { assembly, attempt, report, message, hinted, hint, reset } = useAssemblyLabStore();
  const sound = useSettingsStore((s) => s.soundEnabled);
  const setSound = useSettingsStore((s) => s.setSoundEnabled);
  const installed = assembly.installed;
  const suggested = nextStep(installed);
  const done = installed.length;
  const errors = assembly.orderErrors + assembly.slotErrors;

  // a fresh attempt each time the lab is opened; the clock starts once the 3D bench is on screen
  const ready = useSceneStatus((s) => s.ready);
  useEffect(() => {
    useAssemblyLabStore.getState().reset();
  }, []);
  useEffect(() => {
    if (ready) useAssemblyLabStore.getState().startClock();
  }, [ready]);

  return (
    <div className={styles.stage}>
      <div className={styles.scene}>
        <SceneCanvas initialCamera="HOME_WIDE" label={t('labs.modules.assembly.title')}>
          <AssemblyLabScene />
        </SceneCanvas>
      </div>

      <header className={styles.head}>
        <Link to="/labs" className={styles.back}>
          <ArrowLeft size={14} aria-hidden="true" /> {t('pcLab.ui.back')}
        </Link>
        <span className={styles.eyebrow}>{t('pcLab.ui.eyebrow')}</span>
        <h1>{t('labs.modules.assembly.title')}</h1>
        <p>{t('pcLab.ui.intro')}</p>
        <div className={styles.meter} aria-label={t('pcLab.ui.progress', { done, total: STEP_IDS.length })}>
          <div className={styles.bar}>
            <span style={{ width: `${progressOf(installed) * 100}%` }} />
          </div>
          <b>
            {Math.round(progressOf(installed) * 100)}% · {t('pcLab.ui.progress', { done, total: STEP_IDS.length })}
          </b>
        </div>
        <dl className={styles.stats}>
          <div>
            <dt>
              <Clock3 size={12} aria-hidden="true" /> {t('pcLab.ui.time')}
            </dt>
            <dd>
              <Clock startedAt={attempt.startedAt} frozen={report ? report.seconds : null} />
            </dd>
          </div>
          <div>
            <dt>
              <TriangleAlert size={12} aria-hidden="true" /> {t('pcLab.ui.errors')}
            </dt>
            <dd>{errors}</dd>
          </div>
          <div>
            <dt>
              <Lightbulb size={12} aria-hidden="true" /> {t('pcLab.ui.hints')}
            </dt>
            <dd>{attempt.hintsUsed}</dd>
          </div>
        </dl>
        <button type="button" className={styles.sound} onClick={() => setSound(!sound)} aria-pressed={sound}>
          {sound ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
          {t(sound ? 'pcLab.ui.soundOn' : 'pcLab.ui.soundOff')}
        </button>
      </header>

      <aside className={styles.panel} aria-label={t('pcLab.ui.steps')}>
        <p className={styles.message} data-tone={message.tone} role="status" aria-live="polite">
          {message.tone === 'ok' ? <Check size={16} aria-hidden="true" /> : message.tone === 'warn' ? <TriangleAlert size={16} aria-hidden="true" /> : message.tone === 'hint' ? <Lightbulb size={16} aria-hidden="true" /> : <MousePointer2 size={16} aria-hidden="true" />}
          <span>{messageText(message)}</span>
        </p>

        {report ? (
          <section className={styles.result}>
            <p className={styles.booted}>
              <Power size={16} aria-hidden="true" /> {t('pcLab.ui.booted')}
            </p>
            <GradeReportCard report={report} />
          </section>
        ) : (
          <div className={styles.actions}>
            <button type="button" className={styles.hintButton} onClick={hint} disabled={!suggested}>
              <Lightbulb size={15} aria-hidden="true" /> {t('pcLab.ui.hint')} <small>{t('pcLab.ui.hintCost')}</small>
            </button>
          </div>
        )}

        <h2>{t('pcLab.ui.steps')}</h2>
        <ol className={styles.steps}>
          {STEP_IDS.map((s: StepId, i) => {
            const isDone = installed.includes(s);
            const state = isDone ? 'done' : hinted === s ? 'hinted' : 'todo';
            return (
              <li key={s} data-state={state}>
                <span className={styles.num}>{isDone ? <Check size={13} aria-hidden="true" /> : i + 1}</span>
                <span className={styles.stepText}>
                  <b>{t(tk(`pcLab.steps.${s}.name`))}</b>
                  <small>
                    {t(STEPS[s].zone === 'bench' ? 'pcLab.ui.zoneBench' : 'pcLab.ui.zoneCase')}
                    {isDone && ` · ${t('pcLab.ui.done')}`}
                  </small>
                </span>
              </li>
            );
          })}
        </ol>

        <button type="button" className={styles.restart} onClick={reset}>
          <RotateCcw size={14} aria-hidden="true" /> {t('pcLab.ui.restart')}
        </button>
        <p className={styles.note}>{t('pcLab.ui.modelNote')}</p>
      </aside>

      <p className={styles.controls}>
        <MousePointer2 size={14} aria-hidden="true" /> {t('pcLab.ui.controls')}
      </p>
    </div>
  );
}
