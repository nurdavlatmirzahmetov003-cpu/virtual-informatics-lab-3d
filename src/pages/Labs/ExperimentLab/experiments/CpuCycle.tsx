import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { formatInstruction, runCycle, exercise, questions, type Unit } from '@/labs/Experiments/cpuCycle';
import { ExperimentFrame, Segmented, Slider } from '../parts';
import styles from '../ExperimentLab.module.css';

const tk = (key: string) => key as TranslationKey;
const STAGES = ['fetch', 'decode', 'execute'] as const;

export default function CpuCycle() {
  const t = useT();
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const [op, setOp] = useState<'ADD' | 'SUB'>('ADD');
  const steps = useMemo(() => runCycle(a, b, op), [a, b, op]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const i = Math.min(index, steps.length - 1);
  const s = steps[i];
  const last = steps.length - 1;
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => (i >= last ? setPlaying(false) : setIndex(i + 1)), 1300);
    return () => window.clearTimeout(id);
  }, [playing, i, last]);

  const reset = (fn: () => void) => {
    fn();
    setIndex(0);
    setPlaying(false);
  };
  const lit = (u: Unit) => s.active.includes(u);
  const result = steps.at(-1)!.acc;

  return (
    <ExperimentFrame id="cpuCycle" conclusion={{ key: 'experiments.cpuCycle.result', params: { a, b, op: op === 'ADD' ? '+' : '−', result, steps: steps.length } }} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Slider label="a" value={a} min={0} max={20} onChange={(v) => reset(() => setA(v))} />
        <Slider label="b" value={b} min={0} max={20} onChange={(v) => reset(() => setB(v))} />
        <Segmented label={t('experiments.cpuCycle.op')} value={op} onChange={(v) => reset(() => setOp(v))} options={[{ id: 'ADD', label: 'ADD (+)' }, { id: 'SUB', label: 'SUB (−)' }]} />
      </div>

      <ol className={styles.stages}>
        {STAGES.map((st) => (
          <li key={st} data-active={s.stage === st}>
            {t(`experiments.cpuCycle.stages.${st}`)}
          </li>
        ))}
      </ol>

      <div className={styles.machine}>
        <div className={styles.cpuBox}>
          <h3>CPU</h3>
          <div className={styles.regs}>
            <div data-lit={lit('pc')}>
              <span>PC</span>
              <b>{s.pc}</b>
            </div>
            <div data-lit={lit('ir')}>
              <span>IR</span>
              <b>{s.ir ? formatInstruction(s.ir) : '—'}</b>
            </div>
            <div data-lit={lit('acc')}>
              <span>ACC</span>
              <b>{s.acc}</b>
            </div>
            <div data-lit={lit('alu')}>
              <span>ALU</span>
              <b>{lit('alu') ? (op === 'ADD' ? '+' : '−') : '·'}</b>
            </div>
            <div data-lit={lit('cu')}>
              <span>CU</span>
              <b>{t(tk(`experiments.cpuCycle.stages.${s.stage}`))}</b>
            </div>
          </div>
        </div>
        <div className={styles.bus} data-active={Boolean(s.bus)}>
          <span>{s.bus ?? ''}</span>
        </div>
        <div className={styles.memBox}>
          <h3>{t('experiments.cpuCycle.memory')}</h3>
          <ol>
            {s.memory.map((m, addr) => (
              <li key={addr} data-cell={s.cell === addr} data-pc={s.stage !== 'halt' && addr === s.pc}>
                <span>{addr}</span>
                <b>{typeof m === 'number' ? m : formatInstruction(m)}</b>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <p className={styles.stepNote} aria-live="polite">
        {t(tk(s.note.key), s.note.params)}
      </p>

      <div className={styles.transport}>
        <button type="button" onClick={() => reset(() => undefined)} aria-label={t('experiments.ui.reset')} title={t('experiments.ui.reset')}>
          <RotateCcw size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => { setPlaying(false); setIndex(Math.max(0, i - 1)); }} disabled={i === 0} aria-label={t('experiments.ui.back')}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" className={styles.primary} onClick={() => { if (i >= last) setIndex(0); setPlaying((p) => !p); }}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />} {t(playing ? 'experiments.ui.pause' : 'experiments.ui.play')}
        </button>
        <button type="button" onClick={() => { setPlaying(false); setIndex(Math.min(last, i + 1)); }} disabled={i >= last} aria-label={t('experiments.ui.forward')}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <span>{t('experiments.ui.step', { current: i + 1, total: steps.length })}</span>
      </div>
    </ExperimentFrame>
  );
}
