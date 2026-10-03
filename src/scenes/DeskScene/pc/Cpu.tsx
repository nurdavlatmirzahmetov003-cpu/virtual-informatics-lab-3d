/**
 * [PLACEHOLDER] Desktop CPU: green substrate with SMD caps, nickel-plated
 * integrated heat spreader (IHS) with side notches, laser-etched marking.
 * Board frame (local Z = out of the board).
 */
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront, roundedRectShape, scatteredCylinders } from '@/lib/three/geometry';
import { Shape } from 'three';
import type { PcTextures } from './usePcTextures';

function ihsShape() {
  // 34 × 30 mm heat spreader with retention notches on two sides
  const w = 0.034;
  const h = 0.03;
  const n = 0.0035;
  const s = new Shape();
  s.moveTo(-w / 2, -h / 2);
  s.lineTo(w / 2, -h / 2);
  s.lineTo(w / 2, -n);
  s.lineTo(w / 2 - n, -n * 0.6);
  s.lineTo(w / 2 - n, n * 0.6);
  s.lineTo(w / 2, n);
  s.lineTo(w / 2, h / 2);
  s.lineTo(-w / 2, h / 2);
  s.lineTo(-w / 2, n);
  s.lineTo(-w / 2 + n, n * 0.6);
  s.lineTo(-w / 2 + n, -n * 0.6);
  s.lineTo(-w / 2, -n);
  s.closePath();
  return s;
}

export function Cpu({ tex }: { tex: PcTextures }) {
  const geo = useDisposable(
    () => ({
      substrate: extrudeFront(roundedRectShape(0.0375, 0.045, 0.0015), 0.0012, { bevel: 0.0002 }),
      ihs: extrudeFront(ihsShape(), 0.0036, { bevel: 0.0006 }),
      smd: scatteredCylinders(
        Array.from({ length: 10 }, (_, i): [number, number] => [-0.014 + (i % 5) * 0.007, i < 5 ? -0.0195 : 0.0195]),
        0.0006,
        0.0006,
        0.0012,
      ),
    }),
    [],
  );

  return (
    <group rotation-y={-Math.PI / 2} position-x={0}>
      <mesh geometry={geo.substrate} castShadow>
        <meshStandardMaterial map={tex.pcbGreen} roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh geometry={geo.smd}>
        <meshStandardMaterial color="#8a7f6a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh geometry={geo.ihs} position-z={0.0012} castShadow>
        <meshStandardMaterial color="#c4c8ce" metalness={1} roughness={0.26} roughnessMap={tex.brushed} />
      </mesh>
      {/* laser marking */}
      <mesh position-z={0.0049}>
        <planeGeometry args={[0.022, 0.022]} />
        <meshStandardMaterial map={tex.cpuLabel} metalness={1} roughness={0.35} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}
