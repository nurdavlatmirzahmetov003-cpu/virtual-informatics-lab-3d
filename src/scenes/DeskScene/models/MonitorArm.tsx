/**
 * Desk-clamp monitor arm (V4 §2.3): a clamp on the desk's back edge, a pole,
 * a two-part arm with an elbow, and the VESA plate that holds the panel from
 * behind. Built at the monitor's layout position (MONITOR); one material, so
 * its pieces merge into a single draw call.
 */
import { useLayoutEffect, useRef } from 'react';
import { Quaternion, Vector3, type Group } from 'three';
import { mergeStatic } from '@/lib/three/mergeStatic';
import { DESK, MONITOR } from '../layout';

const METAL = { color: '#2b2e35', roughness: 0.35, metalness: 0.7 } as const;
/** Where the panel's back is held (above the desk, relative to MONITOR.position). */
const ARM_MOUNT = { y: MONITOR.panelCenterY, z: -0.11 } as const;

/** A rod between two points (local space of the arm). */
function Rod({ from, to, r }: { from: readonly [number, number, number]; to: readonly [number, number, number]; r: number }) {
  const a = new Vector3(...from);
  const b = new Vector3(...to);
  const dir = b.clone().sub(a);
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <mesh position={a.clone().add(b).multiplyScalar(0.5)} quaternion={q} castShadow>
      <cylinderGeometry args={[r, r, dir.length(), 16]} />
      <meshStandardMaterial {...METAL} />
    </mesh>
  );
}

export function MonitorArm() {
  const root = useRef<Group>(null);
  useLayoutEffect(() => (root.current ? mergeStatic(root.current) : undefined), []);
  // arm space: origin at the monitor's layout position on the desk top
  const backEdge = -DESK.depth / 2 - MONITOR.position[2];
  // the pole stands just beyond the panel's left edge, so the arm is seen reaching in behind it
  const pole = [-0.36, 0, backEdge + 0.035] as const;
  const top = [pole[0], 0.44, pole[2]] as const;
  const elbow = [-0.2, 0.4, pole[2] + 0.05] as const;
  const mount = [0, ARM_MOUNT.y, ARM_MOUNT.z] as const;
  return (
    <group ref={root}>
      {/* clamp: a plate on the top, a jaw under the edge */}
      <mesh position={[pole[0], 0.006, pole[2]]} castShadow>
        <boxGeometry args={[0.07, 0.012, 0.09]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[pole[0], -DESK.thickness - 0.03, backEdge - 0.012]} castShadow>
        <boxGeometry args={[0.06, 0.07, 0.024]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <Rod from={[pole[0], 0, pole[2]]} to={top} r={0.016} />
      <Rod from={top} to={elbow} r={0.013} />
      <Rod from={elbow} to={[mount[0], mount[1], mount[2] - 0.04]} r={0.012} />
      {[top, elbow].map((p) => (
        <mesh key={p.join()} position={[...p]}>
          <sphereGeometry args={[0.02, 16, 12]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
      ))}
      {/* VESA hub and plate behind the panel */}
      <mesh position={[mount[0], mount[1], mount[2] - 0.02]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.022, 0.022, 0.04, 16]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
      <mesh position={[mount[0], mount[1], mount[2] + 0.002]}>
        <boxGeometry args={[0.1, 0.1, 0.006]} />
        <meshStandardMaterial {...METAL} />
      </mesh>
    </group>
  );
}
