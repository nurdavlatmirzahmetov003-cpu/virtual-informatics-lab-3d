import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { assemblyRig } from '@/scenes/SetupStudio/assembly/assemblyRig';
import { DESK, DESK_TOP, MONITOR } from '../layout';
import { heroPresence } from './heroCycle';

const WALL = -0.92;

/**
 * LED strips of the RGB look: one under the desk's back edge, one on the
 * slats behind the monitor. Their colour runs round the hue wheel; they light
 * up with the setup and go dark when it leaves. Emissive only — no extra
 * light, so no shader recompiles when the look changes.
 */
export function RgbAccents({ on }: { on: boolean }) {
  const group = useRef<Group>(null);
  const mats = useRef<MeshBasicMaterial[]>([]);
  const color = useMemo(() => new Color(), []);
  const shown = useRef(0);

  useFrame(({ clock }, delta) => {
    const g = group.current;
    if (!g) return;
    const goal = on ? Math.min(1, assemblyRig.pieces.pcCase) * Math.max(0, 1 - heroPresence.away * 2) : 0;
    shown.current += (goal - shown.current) * (1 - Math.exp(-Math.min(delta, 0.1) * 6));
    g.visible = shown.current > 0.01;
    if (!g.visible) return;
    if (!mats.current.length) g.traverse((o) => (o as Mesh).isMesh && mats.current.push((o as Mesh).material as MeshBasicMaterial));
    const t = clock.elapsedTime;
    mats.current.forEach((m, i) => {
      color.setHSL((t * 0.06 + i * 0.18) % 1, 1, 0.55);
      m.color.copy(color).multiplyScalar(0.4 + 2.2 * shown.current);
    });
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, DESK_TOP - 0.045, -DESK.depth / 2 + 0.04]}>
        <boxGeometry args={[DESK.width - 0.12, 0.008, 0.008]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      <mesh position={[MONITOR.position[0], 1.14, WALL + 0.004]}>
        <boxGeometry args={[1.25, 0.012, 0.006]} />
        <meshBasicMaterial toneMapped={false} />
      </mesh>
      {[-0.66, 0.54].map((x) => (
        <mesh key={x} position={[MONITOR.position[0] + x, 0.98, WALL + 0.004]}>
          <boxGeometry args={[0.012, 0.32, 0.006]} />
          <meshBasicMaterial toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
