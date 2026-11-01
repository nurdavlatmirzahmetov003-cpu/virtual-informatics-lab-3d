/**
 * V4 §11: a socket ring's size on screen. Seen from afar, sockets a
 * centimetre apart project closer together than a 16 px ring, so each ring
 * takes at most 80 % of the distance to its nearest neighbour (6 to 16 px).
 */
const RING = { max: 16, min: 6, share: 0.8 };

/** A touch screen's extra hit area around a ring, at most (px). */
const REACH = 6;

/** Ring size (px) for each screen point. */
export function ringSizes(points: readonly (readonly [number, number])[]): number[] {
  return nearest(points).map((near) => Math.round(Math.max(RING.min, Math.min(RING.max, near * RING.share))));
}

/**
 * The touch hit area around each ring (px): up to 6, but never past half the
 * free gap to the nearest socket, so a tap between two lands on the nearer one.
 */
export function ringReach(points: readonly (readonly [number, number])[], sizes: readonly number[]): number[] {
  return nearest(points).map((near, i) => Math.max(0, Math.min(REACH, Math.floor((near - sizes[i]) / 2) - 1)));
}

function nearest(points: readonly (readonly [number, number])[]): number[] {
  return points.map(([x, y], i) => {
    let near = Infinity;
    points.forEach(([u, v], j) => {
      if (j !== i) near = Math.min(near, Math.hypot(u - x, v - y));
    });
    return near;
  });
}
