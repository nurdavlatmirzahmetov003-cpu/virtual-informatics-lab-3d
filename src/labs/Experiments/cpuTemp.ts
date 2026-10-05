/**
 * CPU load → power → temperature. A lumped thermal model:
 *   P = idle + load × (PPT − idle)
 *   T_steady = ambient + P × (R_die + R_cooler)
 * with a first-order approach to T_steady (time constant grows with the
 * cooler's thermal mass). Above Tjmax the CPU throttles: power is cut to what
 * the cooler can remove, and clock speed falls with roughly ∛power.
 * Figures are typical of a 8-core desktop CPU (PPT ≈ 142 W, Tjmax 95 °C).
 */
import { fmt, key, makeQuizExercise, text, type Question } from './quiz';

export const COOLERS = ['stock', 'tower', 'liquid'] as const;
export type Cooler = (typeof COOLERS)[number];

export const CPU = { idleW: 18, pptW: 142, tjmax: 95, rDie: 0.1, boostGHz: 5.4, baseGHz: 3.8 } as const;
/** °C per watt from the heatsink to the room air, and how slowly it warms up (s). */
export const COOLER_SPEC: Record<Cooler, { r: number; tau: number }> = {
  stock: { r: 0.48, tau: 18 },
  tower: { r: 0.2, tau: 34 },
  liquid: { r: 0.14, tau: 55 },
};

export interface ThermalState {
  powerW: number;
  /** Temperature the chip settles at (after throttling, if any). */
  tempC: number;
  /** Temperature it would reach without throttling. */
  wouldBeC: number;
  throttling: boolean;
  clockGHz: number;
  /** Performance kept, 0…1. */
  performance: number;
}

export function thermal(load: number, cooler: Cooler, ambient = 25): ThermalState {
  const l = Math.min(100, Math.max(0, load)) / 100;
  const r = CPU.rDie + COOLER_SPEC[cooler].r;
  const powerW = CPU.idleW + l * (CPU.pptW - CPU.idleW);
  const wouldBeC = ambient + powerW * r;
  const throttling = wouldBeC > CPU.tjmax;
  const allowedW = throttling ? (CPU.tjmax - ambient) / r : powerW;
  const performance = throttling ? Math.cbrt(allowedW / powerW) : 1;
  const clock = l === 0 ? CPU.baseGHz : CPU.boostGHz;
  return { powerW: allowedW, tempC: Math.min(wouldBeC, CPU.tjmax), wouldBeC, throttling, clockGHz: clock * performance, performance };
}

/** Temperature over time after switching from idle to `load` (seconds → °C). */
export function warmUp(load: number, cooler: Cooler, seconds = 120, step = 2, ambient = 25): Array<{ t: number; c: number }> {
  const start = thermal(5, cooler, ambient).tempC;
  const end = thermal(load, cooler, ambient).tempC;
  const tau = COOLER_SPEC[cooler].tau;
  return Array.from({ length: seconds / step + 1 }, (_, i) => {
    const t = i * step;
    return { t, c: end + (start - end) * Math.exp(-t / tau) };
  });
}

export function conclusion(load: number, cooler: Cooler) {
  const s = thermal(load, cooler);
  const params = { temp: fmt(s.tempC, 0), power: fmt(s.powerW, 0), clock: fmt(s.clockGHz, 1), lost: fmt((1 - s.performance) * 100, 0) };
  if (s.throttling) return { key: 'experiments.cpuTemp.result.throttle', params };
  if (s.tempC > 80) return { key: 'experiments.cpuTemp.result.hot', params };
  return { key: 'experiments.cpuTemp.result.ok', params };
}

export const questions = (): Question[] => {
  const stock = thermal(100, 'stock');
  const half = thermal(50, 'tower');
  const full = thermal(100, 'tower');
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.cpuTemp.q1.prompt' },
      options: [key('experiments.cpuTemp.q1.o1'), key('experiments.cpuTemp.q1.o2'), key('experiments.cpuTemp.q1.o3'), key('experiments.cpuTemp.q1.o4')],
      correct: 1,
      why: { key: 'experiments.cpuTemp.q1.why', params: { would: fmt(stock.wouldBeC, 0), tjmax: CPU.tjmax, clock: fmt(stock.clockGHz, 1) } },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.cpuTemp.q2.prompt' },
      options: [text(`${fmt(half.powerW, 0)} → ${fmt(full.powerW, 0)} W`), text(`${fmt(half.powerW, 0)} → ${fmt(half.powerW, 0)} W`), text(`${fmt(full.powerW, 0)} → ${fmt(half.powerW, 0)} W`), text(`${fmt(half.powerW / 2, 0)} → ${fmt(half.powerW, 0)} W`)],
      correct: 0,
      why: { key: 'experiments.cpuTemp.q2.why', params: { half: fmt(half.powerW, 0), full: fmt(full.powerW, 0), t1: fmt(half.tempC, 0), t2: fmt(full.tempC, 0) } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.cpuTemp.q3.prompt' },
      options: [key('experiments.cpuTemp.q3.o1'), key('experiments.cpuTemp.q3.o2'), key('experiments.cpuTemp.q3.o3')],
      correct: 2,
      why: { key: 'experiments.cpuTemp.q3.why', params: { stock: COOLER_SPEC.stock.tau, liquid: COOLER_SPEC.liquid.tau } },
    },
  ];
};

export const exercise = () => makeQuizExercise('cpuTemp', questions());
