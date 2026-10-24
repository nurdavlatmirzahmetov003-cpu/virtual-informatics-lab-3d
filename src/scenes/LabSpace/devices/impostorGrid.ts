/**
 * Layout of the lab overview impostor atlas (0.37): tiles of `tile` px in
 * `cols` columns; each device is drawn from a three-quarter view (yaw, then
 * pitch towards the camera), the angle the hall overview sees it from.
 */
export const IMPOSTOR_GRID = { cols: 12, tile: 160, yaw: -0.5, pitch: 0.38 } as const;

/** Overview enlargement: at least ×2.2, and at least 28 cm tall or wide; never wider than the slot or taller than 55 cm. */
export function overviewScale(w: number, h: number, slot?: number) {
  if (slot === undefined) return 1;
  const grow = Math.max(2.2, 0.28 / Math.max(w, h));
  return Math.max(1, Math.min(grow, (slot * 0.95) / w, 0.55 / h));
}
