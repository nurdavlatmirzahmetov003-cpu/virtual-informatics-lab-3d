/**
 * Effective PC state for the current frame, resolved by <PcRigController>
 * from either the scroll story (storyRig) or explore-mode toggles.
 * Every PC component reads this, so the two modes never fight.
 */
export const pcRig = {
  explode: 0,
  glassOpen: 0,
  interior: 0,
  glow: 0,
};
