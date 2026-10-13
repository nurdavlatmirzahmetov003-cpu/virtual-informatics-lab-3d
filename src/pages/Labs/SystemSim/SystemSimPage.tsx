/**
 * Cause & Effect Lab (V2-7): build a PC, power it on and watch what a
 * missing or wrong part does; in the task, find and fix a broken PC.
 */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Flame, Info, Lightbulb, Play, Power, RotateCcw, Shuffle, Volume2, VolumeX } from 'lucide-react';
import { GradeReportCard } from '@/components/grading/GradeReportCard';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import {
  BUILD_KEYS, COOLER_CHOICES, CPU_CHOICES, FAULTS, FAULT_IDS, FIX_EXERCISE, GOOD_BUILD, GPU_CHOICES, MONITOR_CHOICES, PSU_CHOICES,
  RAM_CHOICES, STORAGE_CHOICES, WORKLOADS, changesBetween, nextFault, type Build, type FaultId,
} from '@/labs/SystemSim';
import { grade, startAttempt, type GradeReport } from '@/services/grading';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';
import { Instruments } from './Instruments';
import { Monitor } from './Monitor';
import { useSimRunner } from './useSimRunner';
import styles from './SystemSim.module.css';

const key = (k: string) => k as TranslationKey;
const CHOICES: Record<(typeof BUILD_KEYS)[number], readonly (string | number)[]> = {
  cpu: CPU_CHOICES, cooler: COOLER_CHOICES, ram: RAM_CHOICES, storage: STORAGE_CHOICES, gpu: GPU_CHOICES, psu: PSU_CHOICES, monitor: MONITOR_CHOICES,
};
type Mode = 'sandbox' | 'fix';

function BuildPanel({ build, onChange, base }: { build: Build; onChange: (b: Build) => void; base: Build }) {
  const t = useT();
  return (
    <section className={styles.buildPanel} aria-labelledby="sim-build">
      <h2 id="sim-build" className={styles.blockTitle}>
        {t('sim.build')}
      </h2>
      {BUILD_KEYS.map((k) => (
        <div key={k} className={styles.part} data-changed={build[k] !== base[k]}>
          <span className={styles.partLabel}>{t(key(`sim.parts.${k}.label`))}</span>
          <div className={styles.seg} role="radiogroup" aria-label={t(key(`sim.parts.${k}.label`))}>
            {CHOICES[k].map((v) => (
              <button key={String(v)} type="button" role="radio" aria-checked={build[k] === v} onClick={() => onChange({ ...build, [k]: v } as Build)}>
                {t(key(`sim.parts.${k}.${v}`))}
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function FixPanel({ fault, build, onNext, onReset }: { fault: FaultId; build: Build; onNext: () => void; onReset: () => void }) {
  const t = useT();
  const [cause, setCause] = useState<FaultId | null>(null);
  const [hinted, setHinted] = useState(false);
  const [attempt, setAttempt] = useState(() => startAttempt(FIX_EXERCISE.id));
  const [report, setReport] = useState<GradeReport | null>(null);
  const changed = changesBetween(FAULTS[fault], build);
  const check = () => {
    const r = grade(FIX_EXERCISE, { fault, diagnosis: cause, build }, attempt);
    setAttempt(r.attempt);
    setReport(r.report);
    useProgressStore.getState().record(r.report);
  };
  return (
    <section className={styles.fix} aria-labelledby="sim-fix">
      <div className={styles.fixHead}>
        <h2 id="sim-fix">{t('sim.task.title')}</h2>
        <span className={styles.chip}>{t('sim.task.fault', { n: FAULT_IDS.indexOf(fault) + 1, total: FAULT_IDS.length })}</span>
      </div>
      <p>{t('sim.task.instructions')}</p>
      <fieldset className={styles.causes}>
        <legend>{t('sim.task.cause')}</legend>
        {FAULT_IDS.map((f) => (
          <label key={f} data-on={cause === f}>
            <input type="radio" name="sim-cause" checked={cause === f} onChange={() => setCause(f)} />
            {t(key(`sim.causes.${f}`))}
          </label>
        ))}
      </fieldset>
      {hinted && (
        <p className={styles.hint}>
          <Lightbulb size={15} aria-hidden="true" /> {t('sim.task.hint')}
        </p>
      )}
      <p className={styles.changed}>{t('sim.task.changed', { n: changed })}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={hinted}
          onClick={() => {
            setHinted(true);
            setAttempt((a) => ({ ...a, hintsUsed: a.hintsUsed + 1 }));
          }}
        >
          <Lightbulb size={15} aria-hidden="true" /> {t('connect.ui.hint')}
        </button>
        <button type="button" className={styles.secondary} onClick={onReset}>
          <RotateCcw size={15} aria-hidden="true" /> {t('sim.task.reset')}
        </button>
        <button type="button" className={styles.secondary} onClick={onNext}>
          <Shuffle size={15} aria-hidden="true" /> {t('sim.task.newFault')}
        </button>
        <button type="button" className={styles.primary} onClick={check}>
          {t('sim.task.check')}
        </button>
      </div>
      {report && <GradeReportCard report={report} />}
    </section>
  );
}

export default function SystemSimPage() {
  const t = useT();
  useDocumentTitle(t('sim.title'));
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get('mode') === 'fix' ? 'fix' : 'sandbox';
  const [fault, setFault] = useState<FaultId>('ram');
  const base = mode === 'fix' ? FAULTS[fault] : GOOD_BUILD;
  // the student's changes belong to the current mode / fault; switching either starts from its own build
  const buildKey = mode === 'fix' ? `fix:${fault}` : 'sandbox';
  const [edits, setEdits] = useState<{ key: string; build: Build } | null>(null);
  const build = edits?.key === buildKey ? edits.build : base;
  const { view, powerOn, powerOff, startLoad, setWorkload } = useSimRunner(build);
  // changing a part means switching off first, as in real life
  const setBuild = (b: Build) => {
    powerOff();
    setEdits({ key: buildKey, build: b });
  };
  const sound = useSettingsStore((s) => s.soundEnabled);
  const setSound = useSettingsStore((s) => s.setSoundEnabled);

  const running = view.phase !== 'off';
  const canLoad = view.phase === 'desktop' || (view.phase === 'load' && !!view.run && view.shown >= view.run.samples.length);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Link to="/labs" className={styles.back}>
          <ArrowLeft size={15} aria-hidden="true" /> {t('connect.ui.back')}
        </Link>
        <div className={styles.titleRow}>
          <div>
            <span className={styles.eyebrow}>{t('sim.eyebrow')}</span>
            <h1>{t('sim.title')}</h1>
          </div>
          <div className={styles.modes} role="tablist">
            {(['sandbox', 'fix'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  powerOff();
                  setParams(m === 'fix' ? { mode: 'fix' } : {});
                }}
              >
                {t(`sim.modes.${m}`)}
              </button>
            ))}
          </div>
        </div>
        <p className={styles.lead}>{t('sim.lead')}</p>
        <p className={styles.disclaimer}>
          <Info size={15} aria-hidden="true" /> {t('sim.disclaimer')}
        </p>
      </header>

      <div className={styles.grid}>
        <div className={styles.left}>
          <BuildPanel build={build} onChange={setBuild} base={base} />
          {mode === 'fix' && (
            <FixPanel
              key={fault}
              fault={fault}
              build={build}
              onNext={() => {
                powerOff();
                setFault((f) => nextFault(f));
              }}
              onReset={() => setBuild(FAULTS[fault])}
            />
          )}
        </div>

        <div className={styles.center}>
          {mode === 'fix' && (
            <p className={styles.taskBanner}>
              <span className={styles.chip}>{t('sim.task.fault', { n: FAULT_IDS.indexOf(fault) + 1, total: FAULT_IDS.length })}</span>
              {t('sim.task.short')}
            </p>
          )}
          <Monitor build={build} view={view} />
          <div className={styles.controls}>
            <button type="button" className={styles.powerBtn} data-on={running} onClick={running ? powerOff : powerOn}>
              <Power size={18} aria-hidden="true" /> {running ? t('sim.controls.off') : t('sim.controls.power')}
            </button>
            <div className={styles.seg} role="radiogroup" aria-label={t('sim.controls.workload')}>
              {WORKLOADS.map((w) => (
                <button key={w} type="button" role="radio" aria-checked={view.workload === w} onClick={() => setWorkload(w)}>
                  {t(`sim.workloads.${w}`)}
                </button>
              ))}
            </div>
            <button type="button" className={styles.primary} disabled={!canLoad} onClick={startLoad}>
              {view.workload === 'game' ? <Flame size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />} {t('sim.controls.run')}
            </button>
            <button type="button" className={styles.icon} aria-pressed={sound} onClick={() => setSound(!sound)} title={t('sim.controls.sound')} aria-label={t('sim.controls.sound')}>
              {sound ? <Volume2 size={17} aria-hidden="true" /> : <VolumeX size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className={styles.right}>
          <Instruments build={build} view={view} />
        </div>
      </div>
    </div>
  );
}
