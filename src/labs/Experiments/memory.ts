/**
 * RAM usage. Each program reserves a typical working set; what does not fit
 * into RAM is moved to the page/swap file on the SSD, which is about a
 * thousand times slower per access than RAM (≈ 100 ns vs ≈ 100 µs).
 */
import { fmt, key, makeQuizExercise, text, type Question } from './quiz';

export const RAM_SIZES = [8, 16, 32] as const;
/** The operating system and background services. */
export const OS_GB = 3;

export const PROGRAMS = ['browser', 'code', 'office', 'discord', 'photoshop', 'obs', 'game', 'blender'] as const;
export type Program = (typeof PROGRAMS)[number];

/** Typical resident memory (GB) — e.g. a browser with ~15 tabs, a modern AAA game. */
export const PROGRAM_GB: Record<Program, number> = {
  browser: 2.5,
  code: 0.9,
  office: 0.5,
  discord: 0.6,
  photoshop: 3.5,
  obs: 1.2,
  game: 9,
  blender: 6,
};

export type MemoryLevel = 'ok' | 'high' | 'swap' | 'critical';

export interface MemoryState {
  usedGB: number;
  inRamGB: number;
  swapGB: number;
  freeGB: number;
  percent: number;
  level: MemoryLevel;
}

export function memory(capacityGB: number, open: readonly Program[]): MemoryState {
  const usedGB = OS_GB + open.reduce((s, p) => s + PROGRAM_GB[p], 0);
  const inRamGB = Math.min(usedGB, capacityGB);
  const swapGB = Math.max(0, usedGB - capacityGB);
  const percent = (usedGB / capacityGB) * 100;
  const level: MemoryLevel = swapGB > capacityGB * 0.5 ? 'critical' : swapGB > 0 ? 'swap' : percent > 80 ? 'high' : 'ok';
  return { usedGB, inRamGB, swapGB, freeGB: Math.max(0, capacityGB - usedGB), percent, level };
}

/** RAM ≈ 100 ns per random access, NVMe ≈ 100 µs: about 1000× slower per access. */
export const ACCESS = { ramNs: 100, ssdNs: 100_000 } as const;

export function conclusion(capacityGB: number, open: readonly Program[]) {
  const m = memory(capacityGB, open);
  const params = { used: fmt(m.usedGB), cap: capacityGB, swap: fmt(m.swapGB), free: fmt(m.freeGB) };
  return { key: `experiments.memory.result.${m.level}`, params };
}

export const questions = (): Question[] => {
  const set: Program[] = ['game', 'browser', 'obs', 'discord'];
  const at16 = memory(16, set);
  const at32 = memory(32, set);
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.memory.q1.prompt', params: { used: fmt(at16.usedGB) } },
      options: [key('experiments.memory.q1.o1'), key('experiments.memory.q1.o2'), key('experiments.memory.q1.o3')],
      correct: at16.swapGB > 0 ? 0 : 1,
      why: { key: 'experiments.memory.q1.why', params: { used: fmt(at16.usedGB), swap: fmt(at16.swapGB) } },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.memory.q2.prompt' },
      options: [key('experiments.memory.q2.o1'), key('experiments.memory.q2.o2'), key('experiments.memory.q2.o3'), key('experiments.memory.q2.o4')],
      correct: 2,
      why: { key: 'experiments.memory.q2.why', params: { times: ACCESS.ssdNs / ACCESS.ramNs } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.memory.q3.prompt', params: { used: fmt(at32.usedGB) } },
      options: [text('0 GB'), text(`${fmt(at16.swapGB)} GB`), text(`${fmt(at32.usedGB)} GB`), text('16 GB')],
      correct: 0,
      why: { key: 'experiments.memory.q3.why', params: { used: fmt(at32.usedGB), free: fmt(at32.freeGB) } },
    },
  ];
};

export const exercise = () => makeQuizExercise('memory', questions());
