import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Binary, CircleCheck, Cpu, Globe, Grid3x3, HardDrive, MemoryStick, MonitorPlay, Palette, Thermometer, type LucideIcon } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { EXPERIMENT_IDS, isExperimentId, type ExperimentId } from '@/labs/Experiments';
import { useProgressStore } from '@/store/progressStore';
import styles from './ExperimentLab.module.css';

const tk = (key: string) => key as TranslationKey;

/** Every experiment is its own chunk: opening one loads only that one. */
const VIEWS: Record<ExperimentId, LazyExoticComponent<ComponentType>> = {
  cpuTemp: lazy(() => import('./experiments/CpuTemp')),
  memory: lazy(() => import('./experiments/Memory')),
  storage: lazy(() => import('./experiments/Storage')),
  latency: lazy(() => import('./experiments/Latency')),
  binaryData: lazy(() => import('./experiments/BinaryData')),
  cpuCycle: lazy(() => import('./experiments/CpuCycle')),
  rgb: lazy(() => import('./experiments/Rgb')),
  resolution: lazy(() => import('./experiments/Resolution')),
  refresh: lazy(() => import('./experiments/Refresh')),
};

const ICONS: Record<ExperimentId, LucideIcon> = {
  cpuTemp: Thermometer,
  memory: MemoryStick,
  storage: HardDrive,
  latency: Globe,
  binaryData: Binary,
  cpuCycle: Cpu,
  rgb: Palette,
  resolution: Grid3x3,
  refresh: MonitorPlay,
};

export default function ExperimentLabPage() {
  const t = useT();
  useDocumentTitle(t('labs.modules.experiments.title'));
  const [params, setParams] = useSearchParams();
  const raw = params.get('exp') ?? params.get('task');
  const id: ExperimentId = isExperimentId(raw) ? raw : 'cpuTemp';
  const exercises = useProgressStore((s) => s.exercises);
  const View = VIEWS[id];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>{t('experiments.ui.eyebrow')}</span>
        <h1>{t('labs.modules.experiments.title')}</h1>
        <p>{t('experiments.ui.intro')}</p>
      </header>

      <nav className={styles.tabs} aria-label={t('experiments.ui.choose')}>
        {EXPERIMENT_IDS.map((e) => {
          const Icon = ICONS[e];
          const p = exercises[`experiment:${e}`];
          const done = p?.completedAt !== undefined;
          return (
            <button key={e} type="button" className={styles.tab} aria-pressed={e === id} onClick={() => setParams({ exp: e }, { replace: true })}>
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
              <span>
                <b>{t(tk(`experiments.${e}.title`))}</b>
                <small>{t(tk(`experiments.${e}.short`))}</small>
              </span>
              {done && <CircleCheck size={14} className={styles.tabDone} aria-label={t('experiments.ui.done')} />}
            </button>
          );
        })}
      </nav>

      <div className={styles.view}>
        <header className={styles.viewHead}>
          <h2>{t(tk(`experiments.${id}.title`))}</h2>
        </header>
        <Suspense fallback={<p className={styles.loading}>{t('experiments.ui.loading')}</p>}>
          <View key={id} />
        </Suspense>
      </div>
    </div>
  );
}
