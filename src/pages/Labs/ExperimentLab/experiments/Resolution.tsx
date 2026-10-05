import { useMemo, useState } from 'react';
import { useT } from '@/hooks/useT';
import { fmt } from '@/labs/Experiments/quiz';
import { PATCH_MM, RESOLUTIONS, conclusion, exercise, megapixels, pitchMm, pixelsInPatch, ppi, questions, rasterA, resolutionById, type ResolutionId } from '@/labs/Experiments/resolution';
import { ExperimentFrame, Segmented, Slider, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

/** The letter "A" drawn with the pixels a 5 × 5 mm patch of this panel has. */
function PixelPatch({ n, label, active }: { n: number; label: string; active?: boolean }) {
  const grid = useMemo(() => rasterA(n), [n]);
  return (
    <figure className={styles.patch} data-active={active}>
      <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" aria-hidden="true">
        {grid.map((row, y) => row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)))}
        {n <= 40 && (
          <g className={styles.patchGrid}>
            {Array.from({ length: n + 1 }, (_, i) => (
              <g key={i}>
                <line x1={i} x2={i} y1={0} y2={n} />
                <line y1={i} y2={i} x1={0} x2={n} />
              </g>
            ))}
          </g>
        )}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export default function Resolution() {
  const t = useT();
  const [id, setId] = useState<ResolutionId>('fhd');
  const [diagonal, setDiagonal] = useState(24);
  const res = resolutionById(id);
  const density = ppi(res.w, res.h, diagonal);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  return (
    <ExperimentFrame id="resolution" conclusion={conclusion(id, diagonal)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Segmented label={t('experiments.resolution.preset')} value={id} onChange={setId} options={RESOLUTIONS.map((r) => ({ id: r.id, label: t(`experiments.resolution.names.${r.id}`) }))} />
        <Slider label={t('experiments.resolution.diagonal')} value={diagonal} min={13} max={32} unit="″" onChange={setDiagonal} />
      </div>

      <div className={styles.stats}>
        <Stat label={t('experiments.resolution.pixels')} value={`${res.w} × ${res.h}`} />
        <Stat label={t('experiments.resolution.mp')} value={fmt(megapixels(res.w, res.h), 2)} unit="MP" />
        <Stat label="PPI" value={fmt(density, 0)} tone={density >= 140 ? 'ok' : density >= 100 ? 'accent' : 'warn'} />
        <Stat label={t('experiments.resolution.pitch')} value={fmt(pitchMm(density), 3)} unit="mm" />
      </div>

      <p className={styles.caption}>{t('experiments.resolution.patch', { mm: PATCH_MM, diagonal })}</p>
      <div className={styles.patches}>
        {RESOLUTIONS.map((r) => {
          const p = ppi(r.w, r.h, diagonal);
          return <PixelPatch key={r.id} n={pixelsInPatch(p)} active={r.id === id} label={`${t(`experiments.resolution.names.${r.id}`)} · ${fmt(p, 0)} PPI`} />;
        })}
      </div>
    </ExperimentFrame>
  );
}
