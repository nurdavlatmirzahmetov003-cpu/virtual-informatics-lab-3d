/**
 * One part of a teardown: sits at its installed pose and, as the timeline
 * passes its step, travels along its path (out of its slot, over, down onto
 * the bench) while turning to its resting pose. A numbered label rides with
 * it once it is out; its name shows while it is the current (moving or
 * selected) part, or on hover.
 */
import { useContext, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { ease, partProgress, pathPoint, type Vec3 } from '@/lib/teardown/timeline';
import { publish, RigContext } from './rig';
import styles from './TeardownLabel.module.css';

export interface PartMotion {
  /** Installed position (parent space, m). */
  at: Vec3;
  /** Installed rotation (rad). */
  rot?: Vec3;
  /** Waypoints as offsets from `at`; the last one is the resting place. */
  path: readonly Vec3[];
  /** Extra rotation reached at rest (rad), applied gradually. */
  turn?: Vec3;
  /** Label anchor in the part's own frame. */
  label: Vec3;
}

export function TeardownPart({ id, index, name, motion, children }: { id: string; index: number; name: string; motion: PartMotion; children?: ReactNode }) {
  const rig = useContext(RigContext)!;
  const group = useRef<Group>(null);
  const tag = useRef<HTMLButtonElement>(null);
  const rot = motion.rot ?? [0, 0, 0];
  const turn = motion.turn ?? [0, 0, 0];

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = ease(partProgress(rig.shown, index, rig.count));
    const [dx, dy, dz] = pathPoint(motion.path, p);
    g.position.set(motion.at[0] + dx, motion.at[1] + dy, motion.at[2] + dz);
    g.rotation.set(rot[0] + turn[0] * p, rot[1] + turn[1] * p, rot[2] + turn[2] * p);
    const el = tag.current;
    if (el) {
      // every part out keeps its number; the name shows for the current one (or on hover)
      const current = rig.selected ? rig.selected === id : rig.snapshot.active === index;
      el.dataset.show = String(p > 0.02 || current);
      el.dataset.active = String(current);
    }
  });

  return (
    <group ref={group}>
      {children}
      <Html position={[...motion.label]} center zIndexRange={[20, 0]} className={styles.anchor}>
        <button
          ref={tag}
          type="button"
          className={styles.tag}
          aria-label={`${index + 1}. ${name}`}
          data-show="false"
          onClick={() => {
            rig.selected = id;
            publish(rig);
          }}
        >
          <span className={styles.num}>{index + 1}</span>
          <span className={styles.name}>{name}</span>
        </button>
      </Html>
    </group>
  );
}
