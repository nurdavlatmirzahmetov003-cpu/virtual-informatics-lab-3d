/**
 * [PLACEHOLDER] 4 × DDR5 DIMM kit: PCB with gold edge contacts, sculpted
 * aluminium heat spreaders on both sides, frosted RGB diffuser on top.
 * Board frame (local X = case Z, local Z = out of the board).
 */
import { Shape, type Material } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { permuteToYZX } from '@/lib/three/geometry';
import { ExtrudeGeometry } from 'three';
import { RAM } from './constants';
import type { PcTextures } from './usePcTextures';

const L = 0.133; // module length (along case Y)
const HEIGHT = 0.034; // spreader height above the slot

/** Heat-spreader side profile: stepped "fin" crest, drawn in (length, height). */
function spreaderShape() {
  const s = new Shape();
  s.moveTo(-L / 2, 0.004);
  s.lineTo(L / 2, 0.004);
  s.lineTo(L / 2, HEIGHT - 0.006);
  s.lineTo(L / 2 - 0.012, HEIGHT);
  s.lineTo(0.02, HEIGHT);
  s.lineTo(0.012, HEIGHT - 0.004);
  s.lineTo(-0.012, HEIGHT - 0.004);
  s.lineTo(-0.02, HEIGHT);
  s.lineTo(-L / 2 + 0.012, HEIGHT);
  s.lineTo(-L / 2, HEIGHT - 0.006);
  s.closePath();
  return s;
}

export function RamKit({ tex, light }: { tex: PcTextures; light: Material }) {
  const geo = useDisposable(() => {
    const spreader = new ExtrudeGeometry(spreaderShape(), {
      depth: 0.0022,
      bevelEnabled: true,
      bevelThickness: 0.0004,
      bevelSize: 0.0004,
      bevelSegments: 2,
    });
    return { spreader: permuteToYZX(spreader) };
  }, []);

  return (
    <group rotation-y={-Math.PI / 2}>
      {Array.from({ length: RAM.count }, (_, i) => (
        <group key={i} position-x={i * RAM.pitch}>
          {/* PCB + gold fingers */}
          <mesh position={[0, 0, 0.016]}>
            <boxGeometry args={[0.0012, L - 0.002, 0.03]} />
            <meshStandardMaterial map={tex.pcbGreen} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.0025]}>
            <boxGeometry args={[0.0013, L - 0.006, 0.003]} />
            <meshStandardMaterial color="#d4a843" metalness={1} roughness={0.25} />
          </mesh>
          {/* spreaders (both faces) */}
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={geo.spreader} position-x={s > 0 ? 0.0008 : -0.0038} castShadow>
              <meshStandardMaterial color="#2a2d33" metalness={0.8} roughness={0.32} roughnessMap={tex.brushed} />
            </mesh>
          ))}
          {/* RGB diffuser */}
          <mesh position={[0, 0, HEIGHT + 0.0025]} material={light}>
            <boxGeometry args={[0.0042, L * 0.62, 0.005]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
