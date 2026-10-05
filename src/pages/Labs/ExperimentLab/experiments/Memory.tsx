import { useMemo, useState } from 'react';
import { useT } from '@/hooks/useT';
import { fmt } from '@/labs/Experiments/quiz';
import { OS_GB, PROGRAMS, PROGRAM_GB, RAM_SIZES, conclusion, exercise, memory, questions, type Program } from '@/labs/Experiments/memory';
import { ExperimentFrame, Segmented, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

const HUE: Record<Program, number> = { browser: 205, code: 230, office: 255, discord: 280, photoshop: 320, obs: 10, game: 35, blender: 140 };

export default function Memory() {
  const t = useT();
  const [capacity, setCapacity] = useState<number>(16);
  const [open, setOpen] = useState<Program[]>(['browser', 'code']);
  const m = memory(capacity, open);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);
  // the bar shows RAM, plus room for what spills into swap
  const scale = Math.max(capacity, m.usedGB) * 1.05;
  const pct = (gb: number) => `${(gb / scale) * 100}%`;
  const blocks = [{ id: 'os', gb: OS_GB, hue: 0 }, ...open.map((p) => ({ id: p, gb: PROGRAM_GB[p], hue: HUE[p] }))];

  return (
    <ExperimentFrame id="memory" conclusion={conclusion(capacity, open)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Segmented label={t('experiments.memory.capacity')} value={capacity} onChange={setCapacity} options={RAM_SIZES.map((c) => ({ id: c, label: `${c} GB` }))} />
      </div>

      <div className={styles.apps} role="group" aria-label={t('experiments.memory.programs')}>
        {PROGRAMS.map((p) => {
          const on = open.includes(p);
          return (
            <button key={p} type="button" aria-pressed={on} style={{ ['--hue' as string]: HUE[p] }} onClick={() => setOpen((o) => (on ? o.filter((x) => x !== p) : [...o, p]))}>
              <b>{t(`experiments.memory.apps.${p}`)}</b>
              <small>{fmt(PROGRAM_GB[p])} GB</small>
            </button>
          );
        })}
      </div>

      <div className={styles.memBar} aria-label={t('experiments.memory.used')}>
        <div className={styles.memRam} style={{ width: pct(capacity) }}>
          <span>RAM · {capacity} GB</span>
        </div>
        <div className={styles.memBlocks}>
          {blocks.map((b, i) => {
            const start = blocks.slice(0, i).reduce((s, x) => s + x.gb, 0);
            return (
              <div
                key={b.id}
                className={styles.memBlock}
                data-os={b.id === 'os'}
                style={{ left: pct(start), width: pct(b.gb), ['--hue' as string]: b.hue }}
                title={`${b.id === 'os' ? t('experiments.memory.os') : t(`experiments.memory.apps.${b.id as Program}`)} · ${fmt(b.gb)} GB`}
              />
            );
          })}
        </div>
        {m.swapGB > 0 && (
          <div className={styles.memSwap} style={{ left: pct(capacity), width: pct(m.swapGB) }}>
            <span>{t('experiments.memory.swapZone')}</span>
          </div>
        )}
      </div>

      <div className={styles.stats}>
        <Stat label={t('experiments.memory.used')} value={fmt(m.usedGB)} unit={`/ ${capacity} GB`} tone={m.level === 'ok' ? 'ok' : m.level === 'high' ? 'warn' : 'bad'} />
        <Stat label={t('experiments.memory.free')} value={fmt(m.freeGB)} unit="GB" />
        <Stat label={t('experiments.memory.swap')} value={fmt(m.swapGB)} unit="GB" tone={m.swapGB > 0 ? 'bad' : 'ok'} />
        <Stat label={t('experiments.memory.state')} value={t(`experiments.memory.level.${m.level}`)} tone={m.level === 'ok' ? 'ok' : m.level === 'high' ? 'warn' : 'bad'} />
      </div>
    </ExperimentFrame>
  );
}
