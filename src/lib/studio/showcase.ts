import { BITLAB_AERO } from '@/data/hardware/house';
import { resolveBuild, type ResolvedBuild } from './build';
import { recommendBuild } from './recommend';

let cached: ResolvedBuild | null = null;

/**
 * The PC shown where the student has not chosen one (home exploded view,
 * PC Assembly Lab): the gaming recommendation for 1.2 M ₸ in black, so both
 * pages show the same catalog components with their own models (V2-2b).
 */
export function showcaseBuild(): ResolvedBuild {
  // the parts of the gaming recommendation in BitLab's own white case (0.37)
  return (cached ??= { ...resolveBuild(recommendBuild('gaming', 1_200_000, 'black')), case: BITLAB_AERO });
}
