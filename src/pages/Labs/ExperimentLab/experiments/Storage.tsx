import { useEffect, useMemo, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { DRIVES, DRIVE_SPEED, FILE_SIZES_GB, conclusion, copySeconds, exercise, formatDuration, questions, type Workload } from '@/labs/Experiments/storage';
import { ExperimentFrame, Segmented } from '../parts';
import styles from '../ExperimentLab.module.css';

/** The slowest drive takes this long on screen; the others finish in proportion. */
const SLOWEST_MS = 7000;

export default function Storage() {
  const t = useT();
  const reduced = useReducedMotion();
  const [size, setSize] = useState<number>(5);
  const [workload, setWorkload] = useState<Workload>('big');
  const [progress, setProgress] = useState<number[] | null>(null);
  const frame = useRef(0);
  const times = DRIVES.map((d) => copySeconds(d, size, workload));
  const slowest = Math.max(...times);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const start = () => {
    cancelAnimationFrame(frame.current);
    if (reduced) return setProgress(DRIVES.map(() => 1));
    const t0 = performance.now();
    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = times.map((s) => Math.min(1, elapsed / ((s / slowest) * SLOWEST_MS)));
      setProgress(p);
      if (p.some((x) => x < 1)) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const unit = (u: 's' | 'min' | 'h') => t(`experiments.storage.units.${u}`);

  return (
    <ExperimentFrame id="storage" conclusion={conclusion(size, workload)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Segmented
          label={t('experiments.storage.size')}
          value={size}
          onChange={(v) => {
            setSize(v);
            setProgress(null);
          }}
          options={FILE_SIZES_GB.map((s) => ({ id: s, label: `${s} GB` }))}
        />
        <Segmented
          label={t('experiments.storage.workload')}
          value={workload}
          onChange={(v) => {
            setWorkload(v);
            setProgress(null);
          }}
          options={(['big', 'small'] as const).map((w) => ({ id: w, label: t(`experiments.storage.workloads.${w}`) }))}
        />
        <button type="button" className={styles.primary} onClick={start}>
          <Play size={15} aria-hidden="true" /> {t('experiments.storage.start')}
        </button>
      </div>

      <ol className={styles.race}>
        {DRIVES.map((d, i) => {
          const p = progress?.[i] ?? 0;
          const time = formatDuration(times[i]);
          const speed = workload === 'big' ? DRIVE_SPEED[d].seq : DRIVE_SPEED[d].small;
          return (
            <li key={d} data-done={p >= 1}>
              <div className={styles.raceHead}>
                <b>{t(`experiments.storage.drives.${d}`)}</b>
                <span>{t('experiments.storage.speed', { speed })}</span>
              </div>
              <div className={styles.raceTrack}>
                <span style={{ width: `${p * 100}%` }} />
              </div>
              <strong>
                {time.value} {unit(time.unit)}
              </strong>
            </li>
          );
        })}
      </ol>
      {!reduced && <p className={styles.caption}>{t('experiments.storage.scaled')}</p>}
    </ExperimentFrame>
  );
}
