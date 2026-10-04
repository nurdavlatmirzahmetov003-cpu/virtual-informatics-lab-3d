import { useCallback, useEffect, useState } from 'react';

export const SPEEDS = [0.5, 1, 1.5, 2, 3] as const;
const BASE_MS = 1100;

/**
 * Plays pre-computed steps: only an index moves, so "back" is as cheap as
 * "forward". The timer lives in an effect and stops at the last step.
 */
export function usePlayer(total: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // index into SPEEDS
  const last = Math.max(0, total - 1);
  const current = Math.min(index, last);
  const interval = BASE_MS / SPEEDS[speed];

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      if (current >= last) setPlaying(false);
      else setIndex(current + 1);
    }, interval);
    return () => window.clearTimeout(id);
  }, [playing, current, last, interval]);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      // pressing play at the end starts over
      if (!p && current >= last) setIndex(0);
      return !p;
    });
  }, [current, last]);

  return {
    index: current,
    playing,
    speed,
    interval,
    atStart: current === 0,
    atEnd: current >= last,
    toggle,
    setSpeed,
    forward: () => {
      setPlaying(false);
      setIndex(Math.min(last, current + 1));
    },
    back: () => {
      setPlaying(false);
      setIndex(Math.max(0, current - 1));
    },
    seek: (i: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(last, i)));
    },
    reset: () => {
      setPlaying(false);
      setIndex(0);
    },
  };
}

export type Player = ReturnType<typeof usePlayer>;
