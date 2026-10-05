/**
 * Virtual experiments — registry only. Each experiment's model and quiz live
 * in their own module (cpuTemp.ts, memory.ts…) and are imported by that
 * experiment's lazily loaded UI, so opening one experiment loads only it.
 */
export const EXPERIMENT_IDS = ['cpuTemp', 'memory', 'storage', 'latency', 'binaryData', 'cpuCycle', 'rgb', 'resolution', 'refresh'] as const;
export type ExperimentId = (typeof EXPERIMENT_IDS)[number];
export const isExperimentId = (v: unknown): v is ExperimentId => EXPERIMENT_IDS.includes(v as ExperimentId);

