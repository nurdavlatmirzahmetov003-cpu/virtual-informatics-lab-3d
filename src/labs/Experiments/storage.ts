/**
 * Copying the same amount of data to different drives. Sequential speeds are
 * typical spec-sheet values; "many small files" uses 4 KiB random-write
 * throughput, where a hard disk's moving head costs it dearly.
 */
import { fmt, key, makeQuizExercise, text, type Question } from './quiz';

export const DRIVES = ['hdd', 'sata', 'nvme3', 'nvme4'] as const;
export type Drive = (typeof DRIVES)[number];

/** MB/s: sequential (one big file) and 4 KiB random (thousands of small files). */
export const DRIVE_SPEED: Record<Drive, { seq: number; small: number }> = {
  hdd: { seq: 160, small: 1.2 }, // 7200 rpm, 100–200 MB/s sequential
  sata: { seq: 530, small: 45 }, // SATA III limit ≈ 550 MB/s
  nvme3: { seq: 3500, small: 70 }, // PCIe 3.0 ×4
  nvme4: { seq: 7000, small: 90 }, // PCIe 4.0 ×4
};

export const FILE_SIZES_GB = [1, 5, 20, 50] as const;
export type Workload = 'big' | 'small';

/** Seconds to copy `sizeGB` (decimal GB = 1000 MB). */
export function copySeconds(drive: Drive, sizeGB: number, workload: Workload = 'big'): number {
  const speed = workload === 'big' ? DRIVE_SPEED[drive].seq : DRIVE_SPEED[drive].small;
  return (sizeGB * 1000) / speed;
}

export function formatDuration(seconds: number): { value: string; unit: 's' | 'min' | 'h' } {
  if (seconds < 90) return { value: fmt(seconds, seconds < 10 ? 1 : 0), unit: 's' };
  if (seconds < 5400) return { value: fmt(seconds / 60, 1), unit: 'min' };
  return { value: fmt(seconds / 3600, 1), unit: 'h' };
}

export function conclusion(sizeGB: number, workload: Workload) {
  const hdd = copySeconds('hdd', sizeGB, workload);
  const nvme = copySeconds('nvme4', sizeGB, workload);
  return { key: `experiments.storage.result.${workload}`, params: { times: fmt(hdd / nvme, 0), size: sizeGB } };
}

export const questions = (): Question[] => {
  const hdd10 = copySeconds('hdd', 10);
  const ratio = DRIVE_SPEED.nvme4.seq / DRIVE_SPEED.hdd.seq;
  return [
    {
      id: 'q1',
      prompt: { key: 'experiments.storage.q1.prompt', params: { speed: DRIVE_SPEED.hdd.seq } },
      options: [text('≈ 6 s'), text(`≈ ${fmt(hdd10 / 60, 0)} min`), text('≈ 30 min'), text('≈ 2 h')],
      correct: 1,
      why: { key: 'experiments.storage.q1.why', params: { seconds: fmt(hdd10, 0), speed: DRIVE_SPEED.hdd.seq } },
    },
    {
      id: 'q2',
      prompt: { key: 'experiments.storage.q2.prompt' },
      options: [text(`≈ ${fmt(ratio / 10, 0)}×`), text(`≈ ${fmt(ratio, 0)}×`), text(`≈ ${fmt(ratio * 10, 0)}×`)],
      correct: 1,
      why: { key: 'experiments.storage.q2.why', params: { nvme: DRIVE_SPEED.nvme4.seq, hdd: DRIVE_SPEED.hdd.seq, ratio: fmt(ratio, 0) } },
    },
    {
      id: 'q3',
      prompt: { key: 'experiments.storage.q3.prompt' },
      options: [key('experiments.storage.q3.o1'), key('experiments.storage.q3.o2'), key('experiments.storage.q3.o3')],
      correct: 0,
      why: { key: 'experiments.storage.q3.why', params: { seq: DRIVE_SPEED.hdd.seq, small: DRIVE_SPEED.hdd.small } },
    },
  ];
};

export const exercise = () => makeQuizExercise('storage', questions());
