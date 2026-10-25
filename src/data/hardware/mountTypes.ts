export type Vec3 = readonly [number, number, number];

/** Measured geometry of one part model in its installed pose (scripts/extract-mounts.mjs). */
export interface PartGeometry {
  kind: 'board' | 'cpu' | 'cooler' | 'ram' | 'gpu' | 'ssd' | 'psu';
  /** Bounding box size, metres. */
  size: Vec3;
  /** Named anchor points relative to the bounding-box centre (slot / socket markers, `base`). */
  anchors: Readonly<Record<string, Vec3>>;
}

/** Top surface of a desk model: height and its x / z bounds (model space = scene space, metres). */
export interface DeskTop {
  y: number;
  min: readonly [number, number];
  max: readonly [number, number];
}
