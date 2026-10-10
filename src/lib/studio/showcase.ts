import { resolveBuild, type ResolvedBuild } from './build';
import { recommendBuild } from './recommend';

let cached: ResolvedBuild | null = null;

/**
 * The PC shown where the student has not chosen one (home exploded view,
 * PC Assembly Lab): the gaming recommendation for 1.2 M ₸ in black, so both
 * pages show the same catalog components with their own models (V2-2b).
 */
export function showcaseBuild(): ResolvedBuild {
  return (cached ??= resolveBuild(recommendBuild('gaming', 1_200_000, 'black')));
}
