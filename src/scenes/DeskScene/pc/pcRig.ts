import type { PartId } from './parts';
import type { EntryPath } from './mounts';
import { CASE_ORIGIN } from './constants';

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
  /** Installed centre of every part in the build on screen (case-local, from mounts.ts); written by <PCCase>. */
  at: {} as Partial<Record<PartId, readonly [number, number, number]>>,
  /** AM5 socket lever: 0 down (locked) … 1 up (open). */
  socketLever: 0,
  /** Thermal paste on the CPU: 0 none … 1 applied. */
  paste: 0,
  /** Assembly approach of each part (mounts.ts entryPaths: from just outside the case, straight in); written by <PCCase>. */
  entry: {} as Partial<Record<PartId, EntryPath>>,
  /** Exploded-layout offsets that replace a part's screen slot in this build (an AIO lifts out as one piece). */
  explodeAs: {} as Partial<Record<PartId, readonly [number, number, number]>>,
  /** World position of the case origin on screen. */
  origin: CASE_ORIGIN as readonly [number, number, number],
};
