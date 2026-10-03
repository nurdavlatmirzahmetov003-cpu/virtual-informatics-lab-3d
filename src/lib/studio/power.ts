import type { ResolvedBuild } from './build';

/** Motherboard, memory, drives, fans and USB devices, roughly (W). */
const PLATFORM_W = 60;
/** Margin over the peak so short load spikes never trip the PSU's protection. */
const HEADROOM = 1.15;

export interface PowerEstimate {
  /** Peak system draw (W): CPU max power + GPU board power + platform. */
  peakW: number;
  /** PSU the build needs (W): the higher of the GPU maker's system figure and peak × 1.15. */
  requiredW: number;
}

export function estimatePower(build: ResolvedBuild): PowerEstimate {
  const cpu = build.cpu?.compatibility.peakPowerW ?? 0;
  const gpu = build.gpu?.compatibility.peakPowerW ?? 0;
  const peakW = cpu + gpu + PLATFORM_W;
  const byHeadroom = Math.ceil((peakW * HEADROOM) / 50) * 50;
  return { peakW, requiredW: Math.max(byHeadroom, build.gpu?.compatibility.recommendedPsuW ?? 0) };
}
