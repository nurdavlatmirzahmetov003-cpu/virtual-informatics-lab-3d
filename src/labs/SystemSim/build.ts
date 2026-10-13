/**
 * System simulation (V2-7): "what happens if a part is missing or wrong?".
 * A build is a handful of choices; the rules below turn it into what a
 * student would see — POST beeps, "No signal", "Boot device not found", boot
 * time, temperature, throttling, a shutdown under load. Pure logic, no UI.
 * Figures are typical of real parts (see each constant); this is an
 * educational simulation, not a hardware emulator.
 */
import { COOLER_SPEC } from '@/labs/Experiments/cpuTemp';

export const CPU_CHOICES = ['ryzen', 'intelF'] as const;
export const COOLER_CHOICES = ['none', 'stock', 'tower'] as const;
export const RAM_CHOICES = [0, 1, 2] as const;
export const STORAGE_CHOICES = ['none', 'hdd', 'sata', 'nvme'] as const;
export const GPU_CHOICES = ['none', 'rtx'] as const;
export const PSU_CHOICES = [300, 550, 750] as const;
export const MONITOR_CHOICES = ['gpu', 'board'] as const;

export interface Build {
  /** Ryzen 5 7600 has integrated graphics; Core i5-14400F ("F") has none. */
  cpu: (typeof CPU_CHOICES)[number];
  cooler: (typeof COOLER_CHOICES)[number];
  /** Memory modules fitted. */
  ram: (typeof RAM_CHOICES)[number];
  storage: (typeof STORAGE_CHOICES)[number];
  gpu: (typeof GPU_CHOICES)[number];
  /** PSU rating, W. */
  psu: (typeof PSU_CHOICES)[number];
  /** Where the monitor cable goes: the graphics card or the motherboard's video out. */
  monitor: (typeof MONITOR_CHOICES)[number];
}

export const BUILD_KEYS = ['cpu', 'cooler', 'ram', 'storage', 'gpu', 'psu', 'monitor'] as const satisfies readonly (keyof Build)[];

/** A sound, working computer to start from. */
export const GOOD_BUILD: Build = { cpu: 'ryzen', cooler: 'tower', ram: 2, storage: 'nvme', gpu: 'rtx', psu: 750, monitor: 'gpu' };

/** CPU power (W): idle and package limit under full load. Ryzen 5 7600 PPT 88 W; i5-14400F turbo 148 W. */
export const CPU_POWER: Record<Build['cpu'], { idle: number; ppt: number; igpu: boolean }> = {
  ryzen: { idle: 18, ppt: 88, igpu: true },
  intelF: { idle: 16, ppt: 148, igpu: false },
};
/** Graphics card (RTX 5070 class): idle and gaming power, W. */
export const GPU_POWER = { idle: 15, peak: 250 } as const;
/** Board, memory, drives, fans, W. */
export const REST_W = 50;

/**
 * °C/W from heatsink to air and warm-up time (s). "none": a bare chip heats
 * in seconds; "stock": a small boxed cooler (Intel Laminar class) — enough
 * for a 65 W chip, too weak for a 148 W one; "tower": as in the Experiments.
 */
export const COOLING: Record<Build['cooler'], { r: number; tau: number }> = {
  none: { r: 2.6, tau: 20 },
  stock: { r: 0.62, tau: 16 },
  tower: COOLER_SPEC.tower,
};
export const R_DIE = 0.1;
export const AMBIENT = 25;
/** The CPU slows down (throttles) here… */
export const T_THROTTLE = 95;
/** …and cuts the power (thermal trip) here. */
export const T_SHUTDOWN = 105;

/** Cold boot to the desktop, s (typical Windows 11): hard disk, SATA SSD, NVMe SSD. */
export const BOOT_SECONDS: Record<Exclude<Build['storage'], 'none'>, number> = { hdd: 45, sata: 16, nvme: 9 };

/** Number of parts that differ between two builds. */
export function changesBetween(a: Build, b: Build): number {
  return BUILD_KEYS.filter((k) => a[k] !== b[k]).length;
}
