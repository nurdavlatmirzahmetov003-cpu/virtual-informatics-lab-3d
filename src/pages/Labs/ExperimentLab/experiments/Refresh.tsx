import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/hooks/useT';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { fmt } from '@/labs/Experiments/quiz';
import { RATES, conclusion, exercise, frameMs, jumpPx, questions, shownPosition } from '@/labs/Experiments/refresh';
import { ExperimentFrame, Segmented, Slider, Stat } from '../parts';
import styles from '../ExperimentLab.module.css';

const TRACK = 1000; // track length in px of "screen space"
const SLOW = [1, 0.25, 0.1] as const;

/**
 * Three lanes, one per refresh rate, showing where the ball is DRAWN (it can
 * only move at frame boundaries). A computer monitor itself refreshes at a
 * fixed rate, so the comparison runs in slow motion to make the steps visible.
 * Only this component re-renders per animation frame.
 */
function Lanes({ speed, slow, reduced }: { speed: number; slow: number; reduced: boolean }) {
  const [time, setTime] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    if (reduced) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      setTime(((now - t0) / 1000) * slow);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [reduced, slow]);

  return (
    <div className={styles.lanes}>
      {RATES.map((hz) => {
        // reduced motion: a still "strobe" of the last 8 frames instead of motion
        const x = reduced ? 0.6 * TRACK : shownPosition(time, hz, speed, TRACK);
        const trail = Array.from({ length: 8 }, (_, k) => (x - k * jumpPx(speed, hz) + TRACK) % TRACK);
        return (
          <div key={hz} className={styles.lane}>
            <div className={styles.laneHead}>
              <b>{hz} Hz</b>
              <span>
                {fmt(frameMs(hz), 1)} ms · {fmt(jumpPx(speed, hz), 1)} px
              </span>
            </div>
            <div className={styles.laneTrack}>
              {trail.map((tx, k) => (
                <i key={k} style={{ left: `${(tx / TRACK) * 100}%`, opacity: k === 0 ? 1 : 0.32 - k * 0.035 }} data-head={k === 0} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Refresh() {
  const t = useT();
  const reduced = useReducedMotion();
  const [speed, setSpeed] = useState(1200);
  const [slow, setSlow] = useState<number>(0.1);
  const qs = useMemo(() => questions(), []);
  const ex = useMemo(() => exercise(), []);

  return (
    <ExperimentFrame id="refresh" conclusion={conclusion(speed)} questions={qs} exercise={ex}>
      <div className={styles.controls}>
        <Slider label={t('experiments.refresh.speed')} value={speed} min={300} max={2400} step={100} unit="px/s" onChange={setSpeed} />
        {!reduced && <Segmented label={t('experiments.refresh.slow')} value={slow} onChange={setSlow} options={SLOW.map((s) => ({ id: s, label: s === 1 ? '1×' : `${s}×` }))} />}
      </div>

      <Lanes speed={speed} slow={slow} reduced={reduced} />
      <p className={styles.caption}>{t(reduced ? 'experiments.refresh.reduced' : 'experiments.refresh.note')}</p>

      <div className={styles.stats}>
        {RATES.map((hz) => (
          <Stat key={hz} label={t('experiments.refresh.jumpAt', { hz })} value={fmt(jumpPx(speed, hz), 1)} unit="px" tone={hz === 60 ? 'warn' : hz === 240 ? 'ok' : 'accent'} />
        ))}
      </div>
    </ExperimentFrame>
  );
}
