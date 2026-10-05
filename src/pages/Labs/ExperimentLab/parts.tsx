import { useId, type ReactNode } from 'react';
import { Info, Lightbulb, Target } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import type { ExperimentId } from '@/labs/Experiments';
import type { Question, QuizWork } from '@/labs/Experiments/quiz';
import type { Exercise } from '@/services/grading';
import { Quiz } from './Quiz';
import styles from './ExperimentLab.module.css';

const tk = (key: string) => key as TranslationKey;

export function Slider({ label, value, min, max, step = 1, unit, onChange, format }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const id = useId();
  const shown = format ? format(value) : String(value);
  return (
    <div className={styles.slider}>
      <label htmlFor={id}>
        <span>{label}</span>
        <b>
          {shown}
          {unit && <small> {unit}</small>}
        </b>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${((value - min) / (max - min)) * 100}%` }}
        aria-valuetext={`${shown}${unit ? ` ${unit}` : ''}`}
      />
    </div>
  );
}

export function Segmented<T extends string | number>({ label, options, value, onChange }: {
  label: string;
  options: ReadonlyArray<{ id: T; label: ReactNode }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      <span>{label}</span>
      <div>
        {options.map((o) => (
          <button key={String(o.id)} type="button" role="radio" aria-checked={o.id === value} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Stat({ label, value, unit, tone }: { label: string; value: ReactNode; unit?: string; tone?: 'ok' | 'warn' | 'bad' | 'accent' }) {
  return (
    <div className={styles.stat} data-tone={tone}>
      <span>{label}</span>
      <b>
        {value}
        {unit && <small> {unit}</small>}
      </b>
    </div>
  );
}

/** Small SVG line chart (x: 0…xMax, y: 0…yMax) with an optional dashed limit. */
export function LineChart({ points, xMax, yMin = 0, yMax, limit, limitLabel, xLabel, yLabel }: {
  points: Array<{ x: number; y: number }>;
  xMax: number;
  yMin?: number;
  yMax: number;
  limit?: number;
  limitLabel?: string;
  xLabel: string;
  yLabel: string;
}) {
  const W = 900;
  const H = 230;
  const px = (x: number) => 40 + (x / xMax) * (W - 56);
  const py = (y: number) => H - 28 - ((y - yMin) / (yMax - yMin)) * (H - 48);
  const d = points.map((p, i) => `${i ? 'L' : 'M'} ${px(p.x).toFixed(1)} ${py(p.y).toFixed(1)}`).join(' ');
  const ticks = [yMin, (yMin + yMax) / 2, yMax];
  return (
    <svg className={styles.chart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={yLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={40} x2={W - 16} y1={py(t)} y2={py(t)} className={styles.gridLine} />
          <text x={34} y={py(t) + 4} textAnchor="end" className={styles.axis}>
            {Math.round(t)}
          </text>
        </g>
      ))}
      {limit !== undefined && (
        <g>
          <line x1={40} x2={W - 16} y1={py(limit)} y2={py(limit)} className={styles.limit} />
          <text x={W - 18} y={py(limit) - 6} textAnchor="end" className={styles.limitText}>
            {limitLabel}
          </text>
        </g>
      )}
      <path d={`${d} L ${px(points.at(-1)!.x)} ${H - 28} L ${px(0)} ${H - 28} Z`} className={styles.area} />
      <path d={d} className={styles.line} />
      <text x={W - 16} y={H - 8} textAnchor="end" className={styles.axis}>
        {xLabel}
      </text>
      <text x={40} y={12} className={styles.axis}>
        {yLabel}
      </text>
    </svg>
  );
}

/**
 * The common layout of an experiment: what we study → the interactive part
 * → what we observed and why → mini quiz.
 */
export function ExperimentFrame({ id, children, conclusion, questions, exercise }: {
  id: ExperimentId;
  children: ReactNode;
  conclusion: { key: string; params?: Record<string, string | number> };
  questions: Question[];
  exercise: Exercise<QuizWork>;
}) {
  const t = useT();
  return (
    <article className={styles.frame}>
      <section className={styles.intro}>
        <Target size={18} aria-hidden="true" />
        <div>
          <h2>{t('experiments.ui.what')}</h2>
          <p>{t(tk(`experiments.${id}.intro`))}</p>
        </div>
      </section>

      <section className={styles.lab}>{children}</section>

      <section className={styles.conclusion} aria-live="polite">
        <Lightbulb size={18} aria-hidden="true" />
        <div>
          <h2>{t('experiments.ui.observed')}</h2>
          <p>{t(tk(conclusion.key), conclusion.params)}</p>
        </div>
      </section>
      <p className={styles.simNote}>
        <Info size={14} aria-hidden="true" /> {t('experiments.ui.simNote')}
      </p>

      <Quiz experiment={id} questions={questions} exercise={exercise} />
    </article>
  );
}
