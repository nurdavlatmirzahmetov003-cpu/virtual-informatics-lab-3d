import { useEffect, useMemo, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { fmt } from '@/labs/Experiments/quiz';
import { MAX_CHARS, SPEEDS, bitCount, conclusion, encode, exercise, questions, sendSeconds } from '@/labs/Experiments/binary';
import { ExperimentFrame, Segmented, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

/** On-screen bit rate (slow motion), independent of the simulated line speed. */
const VISUAL_BPS = 14;

function seconds(s: number) {
  if (s >= 1) return `${fmt(s, 2)} s`;
  if (s >= 0.001) return `${fmt(s * 1000, 2)} ms`;
  return `${fmt(s * 1_000_000, 2)} µs`;
}

export default function BinaryData() {
  const t = useT();
  const reduced = useReducedMotion();
  const [input, setInput] = useState('Hi');
  const [speed, setSpeed] = useState<number>(9600);
  const [sent, setSent] = useState<number | null>(null);
  const frame = useRef(0);
  const chars = useMemo(() => encode(input), [input]);
  const bits = chars.flatMap((c) => c.bits).join('');
  const total = bitCount(chars);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const send = () => {
    cancelAnimationFrame(frame.current);
    if (reduced || !total) return setSent(total);
    const t0 = performance.now();
    const tick = (now: number) => {
      const n = Math.min(total, Math.floor(((now - t0) / 1000) * VISUAL_BPS));
      setSent(n);
      if (n < total) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  // characters fully received so far (byte boundaries)
  let received = '';
  if (sent !== null) {
    let used = 0;
    for (const c of chars) {
      used += c.bytes.length * 8;
      if (used <= sent) received += c.char;
    }
  }
  const onWire = sent === null ? '' : bits.slice(Math.max(0, sent - 24), sent);

  return (
    <ExperimentFrame id="binaryData" conclusion={conclusion(input)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <label className={styles.textField}>
          <span>{t('experiments.binaryData.input')}</span>
          <input
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => {
              setInput(e.target.value);
              setSent(null);
            }}
            placeholder={t('experiments.binaryData.placeholder')}
            spellCheck={false}
          />
        </label>
        <Segmented label={t('experiments.binaryData.speed')} value={speed} onChange={setSpeed} options={SPEEDS.map((s) => ({ id: s, label: t(`experiments.binaryData.speeds.s${s}`) }))} />
        <button type="button" className={styles.primary} onClick={send} disabled={!total}>
          <Send size={15} aria-hidden="true" /> {t('experiments.binaryData.send')}
        </button>
      </div>

      <div className={styles.codeTable} role="table" aria-label={t('experiments.binaryData.table')}>
        <div role="row" className={styles.codeHead}>
          <span role="columnheader">{t('experiments.binaryData.char')}</span>
          <span role="columnheader">{t('experiments.binaryData.code')}</span>
          <span role="columnheader">{t('experiments.binaryData.bytes')}</span>
          <span role="columnheader">{t('experiments.binaryData.bits')}</span>
        </div>
        {chars.map((c, i) => (
          <div role="row" key={i} data-wide={!c.ascii}>
            <b role="cell">{c.char === ' ' ? '␠' : c.char}</b>
            <span role="cell">{c.codePoint}</span>
            <span role="cell">{c.bytes.length}</span>
            <code role="cell">{c.bits.join(' ')}</code>
          </div>
        ))}
      </div>

      <div className={styles.wire} aria-live="off">
        <span className={styles.wireEnd}>TX</span>
        <div className={styles.wireLine}>
          {onWire.split('').map((b, i) => (
            <i key={`${sent}-${i}`} data-bit={b}>
              {b}
            </i>
          ))}
        </div>
        <span className={styles.wireEnd}>RX</span>
      </div>
      <p className={styles.received}>
        {t('experiments.binaryData.received')}: <b>{received || '—'}</b>
        {sent !== null && sent < total && <small> · {sent}/{total}</small>}
      </p>

      <div className={styles.stats}>
        <Stat label={t('experiments.binaryData.total')} value={total} unit={t('experiments.binaryData.bitUnit')} />
        <Stat label={t('experiments.binaryData.byteTotal')} value={total / 8} unit="B" />
        <Stat label={t('experiments.binaryData.time')} value={seconds(sendSeconds(total, speed))} tone="accent" />
      </div>
      {!reduced && <p className={styles.caption}>{t('experiments.binaryData.slow', { bps: VISUAL_BPS })}</p>}
    </ExperimentFrame>
  );
}
