import type { PartId } from './parts';

/**
 * Effective PC state for the current frame, resolved by <PcRigController>
 * from the scroll story, explore-mode toggles, a fixed studio pose, or an
 * external driver (the setup assembly timeline). Every PC component reads
 * this, so the modes never fight.
 */
export const pcRig = {
  explode: 0,
  glassOpen: 0,
  interior: 0,
  glow: 0,
  /** Per-part explode (0 installed … 1 out); `null` → every part follows `explode`. */
  parts: null as Partial<Record<PartId, number>> | null,
  /** Parts not drawn: not in the user's build, or not installed yet. */
  hidden: new Set<PartId>(),
  /** Cable visibility (0…1). */
  cables: 1,
  /** Multiplier on every fan's spin speed. */
  fanSpeed: 1,
  /** Multiplier on RGB brightness. */
  rgbPower: 1,
};
