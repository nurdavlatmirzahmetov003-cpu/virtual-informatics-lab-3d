/**
 * Shared, mutable 3D state of the Connection Lab scene (read every frame,
 * no React re-renders): where each socket is and which way a plug leaves it,
 * and where the plug in hand is.
 */
import { Vector3 } from 'three';

export interface Anchor {
  /** Socket position (world, m). */
  pos: Vector3;
  /** Unit vector pointing out of the socket (the way a plug comes out). */
  out: Vector3;
}

export const anchors = new Map<string, Anchor>();

/** The plug in hand follows the pointer here. */
export const carry = { pos: new Vector3(), set: false };

export function setAnchor(id: string, pos: Vector3, out: Vector3) {
  const a = anchors.get(id);
  if (a) {
    a.pos.copy(pos);
    a.out.copy(out);
  } else anchors.set(id, { pos: pos.clone(), out: out.clone().normalize() });
}

export function clearAnchors() {
  anchors.clear();
  carry.set = false;
}
