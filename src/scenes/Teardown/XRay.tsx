/**
 * X-ray shell: once part `after` has come out (e.g. a laptop's bottom
 * cover), whatever is inside this group fades to a faint glass so the parts
 * still installed underneath can be seen in their places.
 */
import { useContext, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group, Material, Mesh } from 'three';
import { ease, partProgress } from '@/lib/teardown/timeline';
import { RigContext } from './rig';

const FAINT = 0.14;

export function XRay({ after, children }: { after: number; children: ReactNode }) {
  const rig = useContext(RigContext)!;
  const group = useRef<Group>(null);
  const last = useRef(1);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const opacity = 1 - (1 - FAINT) * ease(partProgress(rig.shown, after, rig.count));
    if (Math.abs(opacity - last.current) < 0.002) return;
    last.current = opacity;
    g.traverse((o) => {
      const mats = (o as Mesh).material as Material | Material[] | undefined;
      if (!mats) return;
      for (const m of Array.isArray(mats) ? mats : [mats]) {
        const transparent = opacity < 0.999;
        // switching blending needs a new shader program
        if (m.transparent !== transparent) m.needsUpdate = true;
        m.transparent = transparent;
        m.opacity = opacity;
        m.depthWrite = opacity >= 0.999;
      }
    });
  });
  return <group ref={group}>{children}</group>;
}
