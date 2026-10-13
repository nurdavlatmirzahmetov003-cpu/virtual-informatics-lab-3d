import {
  AMBIENT, BOOT_SECONDS, COOLING, CPU_POWER, GPU_POWER, REST_W, R_DIE, T_SHUTDOWN, T_THROTTLE, type Build,
} from './build';

// ── power-on self test ────────────────────────────────────────────────────

/** What the screen shows after power-on. */
export type BootOutcome = 'desktop' | 'noRam' | 'noVideo' | 'wrongPort' | 'noBoot';
/** Beep codes (AMI-style): one short = POST OK; repeating long = no memory; one long, three short = no video. */
export type BeepCode = 'ok' | 'memory' | 'video';

export interface PostResult {
  outcome: BootOutcome;
  beep: BeepCode;
  /** Non-fatal POST messages, e.g. "CPU Fan Error!". */
  warnings: Array<'cpuFan'>;
  /** Seconds from power-on to the desktop (only for `desktop`). */
  bootSeconds: number;
  /** A picture reaches the monitor (BIOS text, errors, desktop). */
  picture: boolean;
}

/** Whether any video output exists and the monitor is on it. */
export function videoPath(b: Build): 'ok' | 'none' | 'wrongPort' {
  const igpu = CPU_POWER[b.cpu].igpu;
  if (b.gpu === 'rtx') return b.monitor === 'gpu' ? 'ok' : 'wrongPort'; // a fitted card switches the board's output off
  if (!igpu) return 'none'; // F-series CPU and no card: nothing can draw a picture
  return b.monitor === 'board' ? 'ok' : 'wrongPort'; // no card to plug into
}

export function post(b: Build): PostResult {
  const warnings: PostResult['warnings'] = b.cooler === 'none' ? ['cpuFan'] : [];
  if (b.ram === 0) return { outcome: 'noRam', beep: 'memory', warnings: [], bootSeconds: 0, picture: false };
  const video = videoPath(b);
  if (video === 'none') return { outcome: 'noVideo', beep: 'video', warnings, bootSeconds: 0, picture: false };
  if (video === 'wrongPort') return { outcome: 'wrongPort', beep: 'ok', warnings, bootSeconds: 0, picture: false };
  if (b.storage === 'none') return { outcome: 'noBoot', beep: 'ok', warnings, bootSeconds: 0, picture: true };
  // one module runs single-channel: slightly slower boot
  const bootSeconds = BOOT_SECONDS[b.storage] * (b.ram === 1 ? 1.08 : 1);
  return { outcome: 'desktop', beep: 'ok', warnings, bootSeconds, picture: true };
}

// ── load: power, heat, throttling, shutdown ───────────────────────────────

export const WORKLOADS = ['idle', 'office', 'game'] as const;
export type Workload = (typeof WORKLOADS)[number];
/** CPU load (0…1) and whether the graphics card runs flat out. */
const LOAD: Record<Workload, { cpu: number; gpu: number }> = { idle: { cpu: 0.03, gpu: 0 }, office: { cpu: 0.2, gpu: 0.05 }, game: { cpu: 0.7, gpu: 1 } };

/** Whole-system draw (W) for a workload when the CPU draws `cpuW`. */
export function systemWatts(b: Build, w: Workload, cpuW: number): number {
  const gpu = b.gpu === 'rtx' ? GPU_POWER.idle + LOAD[w].gpu * (GPU_POWER.peak - GPU_POWER.idle) : 0;
  return Math.round(REST_W + cpuW + gpu);
}

export interface Sample {
  t: number;
  tempC: number;
  cpuW: number;
  watts: number;
  throttling: boolean;
}

export type Shutdown = { t: number; reason: 'overheat' | 'psu' } | null;

export interface LoadRun {
  samples: Sample[];
  shutdown: Shutdown;
  /** Throttled at any point. */
  throttled: boolean;
  peakC: number;
  /** Share of CPU performance kept at the end (1 = full speed). */
  performance: number;
}

/**
 * Runs a workload for `seconds` (step `dt`). Each step the chip heads for
 * the temperature its power would hold (first-order, the cooler's time
 * constant). At 95 °C it throttles down to what the cooler can carry — but
 * never below a minimum power, so with no cooler it keeps heating and trips
 * at 105 °C. If the whole system draws more than the PSU rating, the PSU's
 * over-power protection switches everything off at once.
 */
export function runLoad(b: Build, w: Workload, seconds = 60, dt = 0.5, startC = AMBIENT + 10): LoadRun {
  const cpu = CPU_POWER[b.cpu];
  const cool = COOLING[b.cooler];
  const r = R_DIE + cool.r;
  const want = cpu.idle + LOAD[w].cpu * (cpu.ppt - cpu.idle);
  // even at its lowest clock a loaded CPU still draws about twice its idle power
  const floorW = LOAD[w].cpu > 0.1 ? cpu.idle * 2 : cpu.idle;
  let temp = startC;
  let throttled = false;
  let performance = 1;
  const samples: Sample[] = [];
  for (let t = 0; t <= seconds + 1e-9; t += dt) {
    const throttling = temp >= T_THROTTLE;
    let cpuW = want;
    if (throttling) {
      throttled = true;
      cpuW = Math.max(Math.min(want, (T_THROTTLE - AMBIENT) / r), Math.min(want, floorW));
    }
    performance = Math.cbrt(cpuW / want);
    const watts = systemWatts(b, w, cpuW);
    samples.push({ t: Math.round(t * 10) / 10, tempC: Math.round(temp * 10) / 10, cpuW: Math.round(cpuW), watts, throttling });
    if (watts > b.psu) return { samples, shutdown: { t: samples.at(-1)!.t, reason: 'psu' }, throttled, peakC: maxC(samples), performance };
    if (temp >= T_SHUTDOWN) return { samples, shutdown: { t: samples.at(-1)!.t, reason: 'overheat' }, throttled, peakC: maxC(samples), performance };
    const target = AMBIENT + cpuW * r;
    temp += (target - temp) * Math.min(1, dt / cool.tau);
  }
  return { samples, shutdown: null, throttled, peakC: maxC(samples), performance };
}

const maxC = (s: Sample[]) => Math.max(...s.map((x) => x.tempC));

/**
 * Frames per second in a modern game at 1080p: the graphics card ~120,
 * integrated graphics ~12 (unplayable); throttling costs CPU-bound frames.
 */
export function gameFps(b: Build, performance = 1): number {
  const base = b.gpu === 'rtx' ? 120 : CPU_POWER[b.cpu].igpu ? 12 : 0;
  return Math.round(base * Math.min(1, 0.4 + 0.6 * performance));
}

// ── the whole check ───────────────────────────────────────────────────────

export interface Diagnosis {
  post: PostResult;
  /** A one-minute game, run only when the PC reaches the desktop. */
  game: LoadRun | null;
  fps: number;
  /** Boots to the desktop and survives the game without switching off. */
  healthy: boolean;
}

export function check(b: Build): Diagnosis {
  const p = post(b);
  if (p.outcome !== 'desktop') return { post: p, game: null, fps: 0, healthy: false };
  const game = runLoad(b, 'game');
  const fps = game.shutdown ? 0 : gameFps(b, game.performance);
  return { post: p, game, fps, healthy: !game.shutdown };
}
