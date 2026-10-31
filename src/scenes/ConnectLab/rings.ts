/**
 * V4 §11: a socket ring's size on screen. Seen from afar, sockets a
 * centimetre apart project closer together than a 16 px ring, so each ring
 * takes at most 80 % of the distance to its nearest neighbour (6 to 16 px).
 */
const RING = { max: 16, min: 6, share: 0.8 };

/** Ring size (px) for each screen point. */
export function ringSizes(points: readonly (readonly [number, number])[]): number[] {
  return points.map(([x, y], i) => {
    let near = Infinity;
    points.forEach(([u, v], j) => {
      if (j !== i) near = Math.min(near, Math.hypot(u - x, v - y));
    });
    return Math.round(Math.max(RING.min, Math.min(RING.max, near * RING.share)));
  });
}
