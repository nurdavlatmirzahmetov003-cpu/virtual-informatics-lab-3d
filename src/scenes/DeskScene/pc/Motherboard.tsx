/**
 * [PLACEHOLDER] ATX motherboard: textured PCB, finned VRM heatsinks, IO
 * cover, LGA socket frame with lever, 4 DIMM slots with latches, PCIe x16
 * (reinforced) + x1 slots, M.2 socket, chipset heatsink, capacitors,
 * 24-pin / 8-pin power headers, SATA ports.
 *
 * Built in a board frame: local X = case Z, local Y = case Y, local Z = out
 * of the board toward the glass (group rotated −90° about Y).
 */
import { RoundedBox } from '@react-three/drei';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront, finnedHeatsink, frameShape, scatteredCylinders } from '@/lib/three/geometry';
import { CPU, GPU, MB, RAM, SSD } from './constants';
import type { PcTextures } from './usePcTextures';

// board-frame coordinates (u = along case Z, v = along case Y)
const cpu = { u: CPU.z - MB.z, v: CPU.y - MB.y };
const ram = { u: RAM.z - MB.z, v: RAM.y - MB.y };
const pcieV = GPU.y + GPU.pcbY - MB.y; // lines up with the card's PCB
const ssd = { u: SSD.z - MB.z, v: SSD.y - MB.y };

const heatsinkMat = { color: '#2f3238', metalness: 0.85, roughness: 0.32 } as const;
const plasticBlack = { color: '#0b0c0e', roughness: 0.6 } as const;

export function Motherboard({ tex }: { tex: PcTextures }) {
  const geo = useDisposable(
    () => ({
      vrmTop: finnedHeatsink(0.1, 0.024, 0.026, 14),
      vrmSide: finnedHeatsink(0.024, 0.1, 0.026, 4),
      chipset: finnedHeatsink(0.056, 0.05, 0.008, 9, 0.002),
      socketFrame: extrudeFront(frameShape(0.058, 0.062, 0.004, 0.009, 0.002), 0.003, { bevel: 0.0008 }),
      caps: scatteredCylinders(
        [
          [cpu.u - 0.045, cpu.v + 0.035],
          [cpu.u - 0.045, cpu.v + 0.02],
          [cpu.u - 0.045, cpu.v + 0.005],
          [cpu.u - 0.045, cpu.v - 0.01],
          [cpu.u - 0.03, cpu.v + 0.045],
          [cpu.u - 0.015, cpu.v + 0.045],
          [cpu.u + 0.0, cpu.v + 0.045],
          [cpu.u + 0.015, cpu.v + 0.045],
          [0.06, -0.06],
          [0.07, -0.06],
          [-0.09, -0.12],
          [-0.08, -0.12],
        ],
        0.003,
        0.008,
      ),
    }),
    [],
  );

  return (
    <group rotation-y={-Math.PI / 2}>
      {/* PCB */}
      <mesh position-z={-0.0008} receiveShadow castShadow>
        <boxGeometry args={[MB.d, MB.h, 0.0016]} />
        <meshStandardMaterial map={tex.pcb} roughness={0.55} metalness={0.2} />
      </mesh>

      {/* VRM heatsinks + IO cover */}
      <mesh geometry={geo.vrmTop} position={[cpu.u - 0.012, cpu.v + 0.072, 0]} castShadow>
        <meshStandardMaterial {...heatsinkMat} roughnessMap={tex.brushed} />
      </mesh>
      <mesh geometry={geo.vrmSide} position={[cpu.u - 0.075, cpu.v + 0.005, 0]} castShadow>
        <meshStandardMaterial {...heatsinkMat} roughnessMap={tex.brushed} />
      </mesh>
      <RoundedBox args={[0.036, 0.075, 0.034]} radius={0.004} position={[-MB.d / 2 + 0.02, cpu.v + 0.055, 0.017]} castShadow>
        <meshStandardMaterial color="#1b1d22" metalness={0.5} roughness={0.42} />
      </RoundedBox>

      {/* CPU socket retention frame + lever */}
      <mesh geometry={geo.socketFrame} position={[cpu.u, cpu.v, 0]}>
        <meshStandardMaterial color="#a8adb5" metalness={0.95} roughness={0.3} />
      </mesh>
      <mesh position={[cpu.u + 0.033, cpu.v, 0.002]}>
        <cylinderGeometry args={[0.0009, 0.0009, 0.06, 8]} />
        <meshStandardMaterial color="#a8adb5" metalness={0.95} roughness={0.3} />
      </mesh>
      <mesh geometry={geo.caps} castShadow>
        <meshStandardMaterial color="#26282d" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* DIMM slots with latches */}
      {Array.from({ length: RAM.count }, (_, i) => (
        <group key={i} position={[ram.u + i * RAM.pitch, ram.v, 0]}>
          <mesh position-z={0.004}>
            <boxGeometry args={[0.0058, 0.135, 0.008]} />
            <meshStandardMaterial {...plasticBlack} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[0, s * 0.071, 0.006]}>
              <boxGeometry args={[0.0062, 0.006, 0.012]} />
              <meshStandardMaterial color="#2a2d33" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* PCIe x16 (steel-reinforced) + two x1 */}
      <group position={[cpu.u - 0.012, pcieV, 0]}>
        <mesh position-z={0.0055}>
          <boxGeometry args={[0.089, 0.0075, 0.011]} />
          <meshStandardMaterial color="#9ea3ab" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
      {[-0.088, -0.118].map((v) => (
        <mesh key={v} position={[cpu.u - 0.045, v, 0.0045]}>
          <boxGeometry args={[0.025, 0.007, 0.009]} />
          <meshStandardMaterial {...plasticBlack} />
        </mesh>
      ))}

      {/* M.2 socket + standoff */}
      <mesh position={[ssd.u - 0.042, ssd.v, 0.002]}>
        <boxGeometry args={[0.005, 0.022, 0.004]} />
        <meshStandardMaterial {...plasticBlack} />
      </mesh>
      <mesh position={[ssd.u + 0.04, ssd.v, 0.0015]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.0022, 0.0022, 0.003, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.3} />
      </mesh>

      {/* chipset heatsink with grooves */}
      <mesh geometry={geo.chipset} position={[0.078, -0.105, 0]}>
        <meshStandardMaterial color="#3a3d44" metalness={0.85} roughness={0.3} roughnessMap={tex.brushed} />
      </mesh>

      {/* power headers + SATA */}
      <mesh position={[MB.d / 2 - 0.006, 0.01, 0.008]}>
        <boxGeometry args={[0.009, 0.052, 0.016]} />
        <meshStandardMaterial {...plasticBlack} />
      </mesh>
      <mesh position={[-MB.d / 2 + 0.03, MB.h / 2 - 0.01, 0.006]}>
        <boxGeometry args={[0.018, 0.009, 0.012]} />
        <meshStandardMaterial {...plasticBlack} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[MB.d / 2 - 0.007, -0.075 - i * 0.011, 0.004]}>
          <boxGeometry args={[0.01, 0.008, 0.008]} />
          <meshStandardMaterial {...plasticBlack} />
        </mesh>
      ))}
    </group>
  );
}
