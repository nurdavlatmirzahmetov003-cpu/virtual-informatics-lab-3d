/**
 * Refresh rate: the screen shows a new picture every 1000 / Hz ms. A moving
 * object can only be drawn at those moments, so at a given speed it jumps
 * further between frames on a 60 Hz panel than on a 240 Hz one.
 */
import { fmt, key, makeQuizExercise, text, type Question } from './quiz';

export const RATES = [60, 144, 240] as const;
export type Rate = (typeof RATES)[number];

export const frameMs = (hz: number) => 1000 / hz;
/** Pixels the object moves between two frames. */
export const jumpPx = (speedPxPerS: number, hz: number) => speedPxPerS / hz;

/**
 * Where the object is drawn at time `t` (s): its true position snapped to the
 * last frame before `t`. Pure function — the UI also uses it for slow motion.
 */
export function shownPosition(t: number, hz: number, speed: number, width: number) {
  const frameT = Math.floor(t * hz) / hz;
  return (frameT * speed) % width;
}

export function conclusion(speed: number) {
  return {
    key: 'experiments.refresh.result.compare',
    params: { j60: fmt(jumpPx(speed, 60), 0), j144: fmt(jumpPx(speed, 144), 0), j240: fmt(jumpPx(speed, 240), 0), f60: fmt(frameMs(60), 1), f240: fmt(frameMs(240), 1) },
  };
}

export const questions = (): Question[] => [
  {
    id: 'q1',
    prompt: { key: 'experiments.refresh.q1.prompt' },
    options: [text('≈ 1.4 ms'), text(`≈ ${fmt(frameMs(144), 1)} ms`), text('≈ 16.7 ms'), text('144 ms')],
    correct: 1,
    why: { key: 'experiments.refresh.q1.why', params: { ms: fmt(frameMs(144), 1) } },
  },
  {
    id: 'q2',
    prompt: { key: 'experiments.refresh.q2.prompt' },
    options: [text('5 px'), text(`${fmt(jumpPx(1200, 60), 0)} px`), text('60 px'), text('1200 px')],
    correct: 1,
    why: { key: 'experiments.refresh.q2.why', params: { px: fmt(jumpPx(1200, 60), 0), px240: fmt(jumpPx(1200, 240), 0) } },
  },
  {
    id: 'q3',
    prompt: { key: 'experiments.refresh.q3.prompt' },
    options: [key('experiments.refresh.q3.o1'), key('experiments.refresh.q3.o2'), key('experiments.refresh.q3.o3')],
    correct: 0,
    why: { key: 'experiments.refresh.q3.why' },
  },
];

export const exercise = () => makeQuizExercise('refresh', questions());
