/**
 * The eleven steps of building a PC, in the recommended order. Rules are
 * dependencies, not a fixed sequence: anything physically possible is
 * allowed (e.g. the PSU may go in first), anything impossible is explained
 * (a cooler with no CPU under it, a graphics card with no board to plug into).
 */

export const STEP_IDS = ['motherboard', 'cpu', 'cooler', 'ram', 'nvme', 'mountBoard', 'psu', 'gpu', 'storage', 'fans', 'cables'] as const;
export type StepId = (typeof STEP_IDS)[number];

/** Where a part is put. One target per step; dropping on another step's target is a "wrong slot". */
export const TARGET_IDS = ['mat', 'socket', 'cpuTop', 'dimm', 'm2', 'standoffs', 'psuBay', 'pcie', 'driveBay', 'fanMounts', 'headers'] as const;
export type TargetId = (typeof TARGET_IDS)[number];

export type Zone = 'bench' | 'case';

export interface StepDef {
  id: StepId;
  target: TargetId;
  /** Steps 1–5 happen on the anti-static mat; the rest inside the case. */
  zone: Zone;
  requires: readonly StepId[];
}

export const STEPS: Record<StepId, StepDef> = {
  motherboard: { id: 'motherboard', target: 'mat', zone: 'bench', requires: [] },
  cpu: { id: 'cpu', target: 'socket', zone: 'bench', requires: ['motherboard'] },
  cooler: { id: 'cooler', target: 'cpuTop', zone: 'bench', requires: ['cpu'] },
  ram: { id: 'ram', target: 'dimm', zone: 'bench', requires: ['motherboard'] },
  nvme: { id: 'nvme', target: 'm2', zone: 'bench', requires: ['motherboard'] },
  mountBoard: { id: 'mountBoard', target: 'standoffs', zone: 'case', requires: ['motherboard'] },
  psu: { id: 'psu', target: 'psuBay', zone: 'case', requires: [] },
  gpu: { id: 'gpu', target: 'pcie', zone: 'case', requires: ['mountBoard'] },
  storage: { id: 'storage', target: 'driveBay', zone: 'case', requires: [] },
  fans: { id: 'fans', target: 'fanMounts', zone: 'case', requires: [] },
  cables: { id: 'cables', target: 'headers', zone: 'case', requires: ['cpu', 'cooler', 'ram', 'nvme', 'mountBoard', 'psu', 'gpu', 'storage', 'fans'] },
};

export const STEP_BY_TARGET = Object.fromEntries(STEP_IDS.map((id) => [STEPS[id].target, id])) as Record<TargetId, StepId>;

/** Prerequisites still missing for a step (empty = it can be installed now). */
export const missingFor = (step: StepId, installed: readonly StepId[]) => STEPS[step].requires.filter((r) => !installed.includes(r));

export const canInstall = (step: StepId, installed: readonly StepId[]) => !installed.includes(step) && missingFor(step, installed).length === 0;

/** The step the hint points at: the first not-yet-done step of the recommended order that is possible now. */
export function nextStep(installed: readonly StepId[]): StepId | null {
  return STEP_IDS.find((s) => canInstall(s, installed)) ?? null;
}

/** Share of the eleven steps done (0…1). */
export const progressOf = (installed: readonly StepId[]) => STEP_IDS.filter((s) => installed.includes(s)).length / STEP_IDS.length;
