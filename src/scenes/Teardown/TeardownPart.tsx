/**
 * One part of a teardown: sits at its installed pose and, as the timeline
 * passes its step, travels along its path (out of its slot, over, down onto
 * the bench) while turning to its resting pose. A numbered label rides with
 * it once it is out; its name shows while it is the current (moving or
 * selected) part, or on hover.
 *
 * A part made of pieces that land apart (a 3D printer's four motors) keeps
 * its group still and moves each piece with <SubMotion>, which follows the
 * same progress; one of them carries the label (`motion.label` null).
 *
 * While a part is current and out, a dashed "its place" marker stays where
 * it was installed, so students see where it sits inside the device.
 */
import { useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { ease, partProgress, pathPoint, type Vec3 } from '@/lib/teardown/timeline';
import { useT } from '@/hooks/useT';
import { PartContext, publish, RigContext, type PartCtx } from './rig';
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
  /** Label anchor in the part's own frame; null: a <SubMotion labelled> carries it. */
  label: Vec3 | null;
}

export function TeardownPart({ id, index, name, motion, children }: { id: string; index: number; name: string; motion: PartMotion; children?: ReactNode }) {
  const rig = useContext(RigContext)!;
  const group = useRef<Group>(null);
  const tag = useRef<HTMLButtonElement>(null);
  const home = useRef<HTMLSpanElement>(null);
  const t = useT();
  const p = useRef(0);
  const rot = motion.rot ?? [0, 0, 0];
  const turn = motion.turn ?? [0, 0, 0];

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const own = rig.parts?.[id];
    const e = ease(own ? own.shown : partProgress(rig.shown, index, rig.count));
    p.current = e;
    const [dx, dy, dz] = pathPoint(motion.path, e);
    g.position.set(motion.at[0] + dx, motion.at[1] + dy, motion.at[2] + dz);
    g.rotation.set(rot[0] + turn[0] * e, rot[1] + turn[1] * e, rot[2] + turn[2] * e);
    const el = tag.current;
    if (el) {
      // every part out keeps its number; the name shows for the current one (or on hover)
      const current = rig.game ? e > 0.98 : rig.selected ? rig.selected === id : rig.snapshot.active === index;
      el.dataset.show = String(e > 0.02 || current);
      el.dataset.active = String(current);
    }
    // where the current part sat before it came out
    if (home.current) home.current.dataset.show = String(!rig.game && e > 0.35 && (rig.selected ? rig.selected === id : rig.snapshot.active === index));
  });

  const label = useCallback(
    (at: Vec3) => (
      <Html position={[...at]} center zIndexRange={[20, 0]} className={styles.anchor}>
        <button
          ref={tag}
          type="button"
          className={styles.tag}
          data-show="false"
          aria-label={rig.game ? name : `${index + 1}. ${name}`}
          onClick={() => {
            rig.selected = id;
            publish(rig);
          }}
        >
          {!rig.game && <span className={styles.num}>{index + 1}</span>}
          <span className={styles.name}>{name}</span>
        </button>
      </Html>
    ),
    [id, index, name, rig],
  );
  const ctx = useMemo<PartCtx>(() => ({ progress: () => p.current, label }), [label]);

  return (
    <PartContext.Provider value={ctx}>
      <group ref={group}>
        {children}
        {motion.label && label(motion.label)}
      </group>
      {/* parts whose pieces move on their own (motion.label null) have no single place */}
      {motion.label && (
        <Html position={[...motion.at]} center zIndexRange={[19, 0]} className={styles.anchor}>
          <span ref={home} className={styles.home} data-show="false" title={t('teardown.ui.home')}>
            <span>{index + 1}</span>
            <small>{t('teardown.ui.home')}</small>
          </span>
        </Html>
      )}
    </PartContext.Provider>
  );
}

/** A piece of a part with its own way out: `at` in the part's frame, path / turn like PartMotion. */
export function SubMotion({ at, path, turn, label, children }: { at: Vec3; path: readonly Vec3[]; turn?: Vec3; label?: Vec3; children: ReactNode }) {
  const part = useContext(PartContext)!;
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const e = part.progress();
    const [dx, dy, dz] = pathPoint(path, e);
    g.position.set(at[0] + dx, at[1] + dy, at[2] + dz);
    if (turn) g.rotation.set(turn[0] * e, turn[1] * e, turn[2] * e);
  });
  return (
    <group ref={group}>
      {children}
      {label && part.label(label)}
    </group>
  );
}
