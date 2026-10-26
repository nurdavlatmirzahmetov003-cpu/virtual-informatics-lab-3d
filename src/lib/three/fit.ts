import { Box3, Group, Vector3, type Object3D } from 'three';

/** Preserve proportions, orient the source, then fit to real-world metres. */
export interface ModelFit {
  axis: 0 | 1 | 2;
  /** Size along `axis` in metres; omitted = keep the model's own scale (real-size product models). */
  size?: number;
  rotation?: readonly [number, number, number];
  align?: 'floor' | 'center';
  offset?: readonly [number, number, number];
  /** Put a side of the bounding box on the origin instead of centring that axis (e.g. a card's back on the board). */
  pin?: Partial<Record<'x' | 'y' | 'z', 'min' | 'max'>>;
}

/**
 * Wraps `levels` (the detailed model first) in an oriented, fitted group.
 * The fit is measured on the first level, so every level lines up.
 * `front` turns a model whose front is not +Z (lib/three/modelFront.ts); it
 * keeps standing where it stood: same floor, same centre on the ground.
 */
export function fitModel(levels: Object3D[], fit: ModelFit | undefined, name: string, front: readonly [number, number, number] | null = null) {
  const inner = new Group();
  if (front) {
    const before = new Box3().setFromObject(levels[0]);
    const turned = new Group();
    levels.forEach((l) => turned.add(l));
    turned.rotation.set(...front);
    turned.updateMatrixWorld(true);
    const after = new Box3().setFromObject(levels[0]);
    const was = before.getCenter(new Vector3());
    const now = after.getCenter(new Vector3());
    turned.position.set(was.x - now.x, before.min.y - after.min.y, was.z - now.z);
    inner.add(turned);
  } else {
    levels.forEach((l) => inner.add(l));
  }
  if (fit?.rotation) inner.rotation.set(...fit.rotation);
  const oriented = new Group();
  oriented.name = name;
  oriented.add(inner);
  oriented.updateMatrixWorld(true);
  if (fit) {
    const box = new Box3().setFromObject(levels[0]);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const scale = fit.size ? fit.size / Math.max(size.getComponent(fit.axis), 0.000001) : 1;
    oriented.scale.setScalar(scale);
    const at = (k: 'x' | 'y' | 'z', centre: number) => (fit.pin?.[k] === 'max' ? box.max[k] : fit.pin?.[k] === 'min' ? box.min[k] : centre);
    oriented.position.set(-at('x', center.x) * scale, -at('y', fit.align === 'floor' ? box.min.y : center.y) * scale, -at('z', center.z) * scale);
    if (fit.offset) oriented.position.add(new Vector3(...fit.offset));
  }
  oriented.updateMatrixWorld(true);
  return oriented;
}
