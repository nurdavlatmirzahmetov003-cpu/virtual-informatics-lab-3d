/** Small procedural props of the assembly bench: mat, tray pads, a cable bundle. */
import { useMemo } from 'react';
import { CanvasTexture, CatmullRomCurve3, RepeatWrapping, SRGBColorSpace, TubeGeometry, Vector3 } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { DESK_TOP } from '@/scenes/DeskScene/layout';
import { MAT } from './layout';

function matTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1a2129';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(120, 190, 210, 0.16)';
  g.lineWidth = 1;
  for (let i = 0; i <= 256; i += 16) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 256);
    g.moveTo(0, i);
    g.lineTo(256, i);
    g.stroke();
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(2.4, 2);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Anti-static mat with a grid print and a grounding snap. */
export function AntiStaticMat() {
  const tex = useDisposable(() => matTexture(), []);
  const [w, d] = MAT.size;
  return (
    <group position={[MAT.center.x, DESK_TOP, MAT.center.z]}>
      <mesh position-y={0.0015} receiveShadow>
        <boxGeometry args={[w, 0.003, d]} />
        <meshStandardMaterial map={tex} roughness={0.92} metalness={0} />
      </mesh>
      <mesh position={[w / 2 - 0.02, 0.0035, -d / 2 + 0.02]}>
        <cylinderGeometry args={[0.006, 0.006, 0.003, 20]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Glowing pad a part waits on; brighter when it is the hinted part. */
export function TrayPad({ x, z, radius, active }: { x: number; z: number; radius: number; active: boolean }) {
  return (
    <group position={[x, DESK_TOP + 0.0012, z]} rotation-x={-Math.PI / 2}>
      <mesh receiveShadow>
        <circleGeometry args={[radius, 48]} />
        <meshStandardMaterial color="#12171f" roughness={0.6} metalness={0.2} />
      </mesh>
      <mesh position-z={0.0004}>
        <ringGeometry args={[radius * 0.94, radius, 64]} />
        <meshBasicMaterial color={active ? '#7cf4da' : '#38d6f5'} transparent opacity={active ? 0.9 : 0.35} toneMapped={false} />
      </mesh>
    </group>
  );
}

const SLEEVES = [
  { color: '#16181d', radius: 0.0075, turns: 2.2, r: 0.05, y: 0 },
  { color: '#1d2027', radius: 0.0055, turns: 1.8, r: 0.036, y: 0.016 },
  { color: '#262a33', radius: 0.004, turns: 2.6, r: 0.026, y: 0.03 },
];

/** Coiled PSU cables (24-pin, 8-pin, SATA) with their connectors. */
export function CableBundle() {
  const tubes = useDisposable(
    () =>
      Object.fromEntries(
        SLEEVES.map((s, i) => {
          const points = Array.from({ length: 64 }, (_, k) => {
            const a = (k / 63) * Math.PI * 2 * s.turns;
            return new Vector3(Math.cos(a) * s.r, s.y + (k / 63) * 0.012, Math.sin(a) * s.r);
          });
          return [String(i), new TubeGeometry(new CatmullRomCurve3(points), 160, s.radius, 10, false)];
        }),
      ),
    [],
  );
  const connectors = useMemo(
    () => [
      { size: [0.052, 0.016, 0.012] as const, at: [0.05, 0.012, 0.01] as const },
      { size: [0.022, 0.014, 0.01] as const, at: [-0.036, 0.026, 0.004] as const },
      { size: [0.02, 0.006, 0.01] as const, at: [0.0, 0.04, -0.026] as const },
    ],
    [],
  );
  return (
    <group position-y={-0.02}>
      {SLEEVES.map((s, i) => (
        <mesh key={i} geometry={tubes[String(i)]} castShadow>
          <meshStandardMaterial color={s.color} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}
      {connectors.map((c, i) => (
        <mesh key={i} position={c.at} castShadow>
          <boxGeometry args={c.size} />
          <meshStandardMaterial color="#0c0d10" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
