import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Dices, Gauge, Info, Pause, Play, RotateCcw } from 'lucide-react';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import {
  ALGORITHMS, MAX_FACTORIAL_N, parseArray, randomArray, rng, runAlgorithm, type AlgorithmId, type AlgorithmInput,
} from '@/labs/AlgorithmLab';
import { ArrayView } from './ArrayView';
import { StackView } from './StackView';
import { SPEEDS, usePlayer } from './usePlayer';
import styles from './AlgorithmLab.module.css';

const tk = (key: string) => key as TranslationKey;

const DEFAULTS: Record<AlgorithmId, AlgorithmInput> = {
  linear: { values: [8, 3, 6, 1, 9, 2, 5], target: 9 },
  binary: { values: [3, 8, 12, 17, 21, 25, 30, 34, 41], target: 30 },
  bubble: { values: [8, 3, 6, 1, 9, 2, 5] },
  selection: { values: [8, 3, 6, 1, 9, 2, 5] },
  insertion: { values: [8, 3, 6, 1, 9, 2, 5] },
  recursion: { values: [], n: 4 },
};

const LEGEND: Record<AlgorithmId, string[]> = {
  linear: ['compare', 'found'],
  binary: ['compare', 'found', 'outside'],
  bubble: ['compare', 'swap', 'sorted'],
  selection: ['compare', 'min', 'swap', 'sorted'],
  insertion: ['key', 'compare', 'swap', 'sorted'],
  recursion: [],
};

const isTyping = (el: EventTarget | null) => el instanceof HTMLElement && (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName) || el.isContentEditable);

function InputBar({ id, input, onApply }: { id: AlgorithmId; input: AlgorithmInput; onApply: (i: AlgorithmInput) => void }) {
  const t = useT();
  const kind = ALGORITHMS[id].kind;
  const [text, setText] = useState(input.values.join(', '));
  const [target, setTarget] = useState(String(input.target ?? ''));
  const [n, setN] = useState(String(input.n ?? 4));
  const [error, setError] = useState(false);

  const apply = () => {
    if (kind === 'recursion') {
      const k = Number(n);
      if (!Number.isInteger(k) || k < 1 || k > MAX_FACTORIAL_N) return setError(true);
      setError(false);
      return onApply({ values: [], n: k });
    }
    const values = parseArray(text);
    const tg = Number(target);
    if (!values || (kind === 'search' && (!target.trim() || !Number.isInteger(tg) || Math.abs(tg) > 99))) return setError(true);
    setError(false);
    onApply({ values, target: kind === 'search' ? tg : undefined });
  };

  const random = () => {
    const next = rng(Date.now());
    if (kind === 'recursion') {
      const k = 2 + Math.floor(next() * (MAX_FACTORIAL_N - 1));
      setN(String(k));
      return onApply({ values: [], n: k });
    }
    let values = randomArray(next, id === 'binary' ? 10 : 8, 1, 60);
    if (id === 'binary') values = values.sort((a, b) => a - b);
    const tg = values[Math.floor(next() * values.length)];
    setText(values.join(', '));
    setTarget(String(tg));
    setError(false);
    onApply({ values, target: kind === 'search' ? tg : undefined });
  };

  return (
    <form
      className={styles.inputBar}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      {kind === 'recursion' ? (
        <label className={styles.field}>
          <span>{t('algorithms.ui.n')}</span>
          <input type="number" min={1} max={MAX_FACTORIAL_N} value={n} onChange={(e) => setN(e.target.value)} aria-invalid={error} />
        </label>
      ) : (
        <label className={`${styles.field} ${styles.grow}`}>
          <span>{t('algorithms.ui.array')}</span>
          <input value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-invalid={error} />
        </label>
      )}
      {kind === 'search' && (
        <label className={styles.field}>
          <span>{t('algorithms.ui.target')}</span>
          <input type="number" min={-99} max={99} value={target} onChange={(e) => setTarget(e.target.value)} aria-invalid={error} className={styles.short} />
        </label>
      )}
      <button type="submit" className={styles.secondary}>
        {t('algorithms.ui.apply')}
      </button>
      <button type="button" className={styles.secondary} onClick={random}>
        <Dices size={15} aria-hidden="true" /> {t('algorithms.ui.random')}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {t('algorithms.ui.invalidArray')}
        </p>
      )}
    </form>
  );
}

function resultText(t: ReturnType<typeof useT>, id: AlgorithmId, result: number | number[], input: AlgorithmInput) {
  const kind = ALGORITHMS[id].kind;
  if (kind === 'search') return result === -1 ? t('algorithms.ui.resultMissing') : t('algorithms.ui.resultFound', { index: result as number });
  if (kind === 'sort') return t('algorithms.ui.resultSorted');
  return t('algorithms.ui.resultFactorial', { n: input.n ?? 0, result: result as number });
}

export function Visualizer({ id }: { id: AlgorithmId }) {
  const t = useT();
  const spec = ALGORITHMS[id];
  const [input, setInput] = useState<AlgorithmInput>(DEFAULTS[id]);
  const run = useMemo(() => runAlgorithm(id, input), [id, input]);
  const player = usePlayer(run.steps.length);
  const step = run.steps[player.index];
  const moveMs = Math.round(Math.min(480, Math.max(140, player.interval * 0.6)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === ' ') {
        e.preventDefault();
        player.toggle();
      } else if (e.key === 'ArrowRight') player.forward();
      else if (e.key === 'ArrowLeft') player.back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player]);

  const apply = (next: AlgorithmInput) => {
    setInput(next);
    player.reset();
  };

  return (
    <div className={styles.visualizer}>
      <section className={styles.stage}>
        <InputBar key={id} id={id} input={input} onApply={apply} />

        <div className={styles.canvas}>
          {spec.kind === 'recursion' ? <StackView step={step} /> : <ArrayView step={step} moveMs={moveMs} />}
        </div>

        <div className={styles.legendRow}>
          <ul className={styles.legend}>
            {LEGEND[id].map((k) => (
              <li key={k} data-tone={k}>
                <i aria-hidden="true" />
                {t(tk(`algorithms.legend.${k}`))}
              </li>
            ))}
          </ul>
          {step.done && <span className={styles.resultBadge}>{resultText(t, id, run.result, input)}</span>}
        </div>

        <div className={styles.explain} aria-live="polite">
          <Info size={16} aria-hidden="true" />
          <div>
            <h3>{t('algorithms.ui.explain')}</h3>
            <p>{t(tk(step.note.key), step.note.params)}</p>
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.transport}>
            <button type="button" onClick={player.reset} disabled={player.atStart && !player.playing} aria-label={t('algorithms.ui.reset')} title={t('algorithms.ui.reset')}>
              <RotateCcw size={17} aria-hidden="true" />
            </button>
            <button type="button" onClick={player.back} disabled={player.atStart} aria-label={t('algorithms.ui.back')} title={t('algorithms.ui.back')}>
              <ChevronLeft size={19} aria-hidden="true" />
            </button>
            <button type="button" className={styles.playButton} onClick={player.toggle} aria-label={t(player.playing ? 'algorithms.ui.pause' : 'algorithms.ui.play')}>
              {player.playing ? <Pause size={19} aria-hidden="true" /> : <Play size={19} aria-hidden="true" />}
              <span>{t(player.playing ? 'algorithms.ui.pause' : 'algorithms.ui.play')}</span>
            </button>
            <button type="button" onClick={player.forward} disabled={player.atEnd} aria-label={t('algorithms.ui.forward')} title={t('algorithms.ui.forward')}>
              <ChevronRight size={19} aria-hidden="true" />
            </button>
          </div>
          <label className={styles.speed}>
            <Gauge size={15} aria-hidden="true" />
            <span>{t('algorithms.ui.speed')}</span>
            <input type="range" min={0} max={SPEEDS.length - 1} step={1} value={player.speed} onChange={(e) => player.setSpeed(Number(e.target.value))} aria-valuetext={`${SPEEDS[player.speed]}×`} />
            <b>{SPEEDS[player.speed]}×</b>
          </label>
        </div>

        <div className={styles.timeline}>
          <input
            type="range"
            min={0}
            max={run.steps.length - 1}
            value={player.index}
            onChange={(e) => player.seek(Number(e.target.value))}
            aria-label={t('algorithms.ui.timeline')}
            aria-valuetext={t('algorithms.ui.step', { current: player.index + 1, total: run.steps.length })}
          />
          <span>{t('algorithms.ui.step', { current: player.index + 1, total: run.steps.length })}</span>
        </div>
        <p className={styles.keys}>{t('algorithms.ui.keys')}</p>
      </section>

      <aside className={styles.side}>
        <section className={styles.panel}>
          <header className={styles.panelHead}>
            <h3>{t('algorithms.ui.code')}</h3>
            <span title={t('algorithms.ui.complexity')}>{spec.complexity}</span>
          </header>
          <ol className={styles.code}>
            {Array.from({ length: spec.lines }, (_, i) => (
              <li key={i} data-active={step.line === i}>
                <span>{i + 1}</span>
                <code>{t(tk(`algorithms.code.${id}.l${i}`))}</code>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.panel}>
          <h3>{t('algorithms.ui.vars')}</h3>
          {step.vars.length === 0 ? (
            <p className={styles.muted}>{t('algorithms.ui.noVars')}</p>
          ) : (
            <dl className={styles.vars}>
              {step.vars.map((v) => {
                const changed = step.changed.includes(v.name);
                return (
                  <div key={changed ? `${v.name}-${player.index}` : v.name} data-changed={changed}>
                    <dt>{v.name}</dt>
                    <dd>{String(v.value)}</dd>
                  </div>
                );
              })}
            </dl>
          )}
        </section>

        <section className={styles.panel}>
          <dl className={styles.stats}>
            {spec.stats.map((k) => (
              <div key={k}>
                <dt>{t(tk(`algorithms.stats.${k}`))}</dt>
                <dd>{step.stats[k] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </section>
      </aside>
    </div>
  );
}
