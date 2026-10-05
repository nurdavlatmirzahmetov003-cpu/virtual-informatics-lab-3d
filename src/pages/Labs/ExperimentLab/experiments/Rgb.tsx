import { useMemo, useState } from 'react';
import { useT } from '@/hooks/useT';
import { conclusion, exercise, luminance, questions, toHex } from '@/labs/Experiments/rgb';
import { ExperimentFrame, Slider, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

const PRESETS = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 0],
  [0, 255, 255],
  [255, 0, 255],
  [255, 255, 255],
  [255, 165, 0],
] as const;

export default function Rgb() {
  const t = useT();
  const [r, setR] = useState(56);
  const [g, setG] = useState(214);
  const [b, setB] = useState(245);
  const hex = toHex(r, g, b);
  const light = luminance(r, g, b) > 0.35;
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  return (
    <ExperimentFrame id="rgb" conclusion={conclusion(r, g, b)} questions={qs} exercise={ex}>
      <div className={styles.rgbGrid}>
        <div className={styles.controls} data-column>
          <Slider label={t('experiments.rgb.channels.r')} value={r} min={0} max={255} onChange={setR} />
          <Slider label={t('experiments.rgb.channels.g')} value={g} min={0} max={255} onChange={setG} />
          <Slider label={t('experiments.rgb.channels.b')} value={b} min={0} max={255} onChange={setB} />
          <div className={styles.presets} role="group" aria-label={t('experiments.rgb.presets')}>
            {PRESETS.map((p) => (
              <button
                key={p.join()}
                type="button"
                style={{ background: `rgb(${p.join(',')})` }}
                aria-label={toHex(p[0], p[1], p[2])}
                title={toHex(p[0], p[1], p[2])}
                onClick={() => {
                  setR(p[0]);
                  setG(p[1]);
                  setB(p[2]);
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.swatch} style={{ background: hex, color: light ? '#0a0d14' : '#f2f5fa' }}>
          <b>{hex}</b>
          <span>
            rgb({r}, {g}, {b})
          </span>
        </div>

        <div className={styles.pixelZoom} aria-label={t('experiments.rgb.pixel')}>
          <h3>{t('experiments.rgb.pixel')}</h3>
          <div className={styles.subpixels}>
            {[
              ['#ff2b2b', r],
              ['#2bff5a', g],
              ['#2b6bff', b],
            ].map(([c, v]) => (
              <span key={c as string} style={{ background: c as string, opacity: 0.08 + ((v as number) / 255) * 0.92 }}>
                <b>{v}</b>
              </span>
            ))}
          </div>
        </div>

        <svg className={styles.venn} viewBox="0 0 200 180" aria-label={t('experiments.rgb.mixing')} role="img">
          <g style={{ mixBlendMode: 'screen' }}>
            <circle cx={75} cy={70} r={52} fill={`rgb(${r},0,0)`} style={{ mixBlendMode: 'screen' }} />
            <circle cx={125} cy={70} r={52} fill={`rgb(0,${g},0)`} style={{ mixBlendMode: 'screen' }} />
            <circle cx={100} cy={114} r={52} fill={`rgb(0,0,${b})`} style={{ mixBlendMode: 'screen' }} />
          </g>
        </svg>
      </div>
      <div className={styles.stats}>
        <Stat label="HEX" value={hex} tone="accent" />
        <Stat label={t('experiments.rgb.bits')} value="3 × 8 = 24" unit="bit" />
      </div>
    </ExperimentFrame>
  );
}
