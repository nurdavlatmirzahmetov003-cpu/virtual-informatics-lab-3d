/**
 * Narrow (portrait) viewports see less horizontally at the same vertical FOV,
 * so pull the camera back along its view direction to keep the shot framed.
 */
export function framingScale(aspect: number) {
  const REFERENCE_ASPECT = 1.4;
  if (aspect >= REFERENCE_ASPECT) return 1;
  return Math.min(2.2, (REFERENCE_ASPECT / aspect) ** 0.8);
}
