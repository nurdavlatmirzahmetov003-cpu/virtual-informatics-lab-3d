/**
 * [PLACEHOLDER] Procedural devices of the network and power zones that have
 * no suitable licensed model (access point, dock, card reader, cable coils),
 * and the rack's light far-view shell. Real size; base at y = 0, front +Z.
 */
import { RoundedBox } from '@react-three/drei';
import { useDisposable } from '@/hooks/useDisposable';
import { cableGeometry, type CableKind } from './cables';
import { labelTexture } from '@/lib/three/proceduralTextures';

const dark = { color: '#1a1d23', metalness: 0.35, roughness: 0.45 } as const;
const white = { color: '#e6e8ec', metalness: 0.05, roughness: 0.4 } as const;

/** The rack as seen from afar (hall overview): its shell and the face of its units, two draw calls. */
export function RackShell() {
  const face = useDisposable(() => labelTexture(['24 × RJ-45', 'SFP+  ·  PoE'], { w: 256, h: 96, bg: '#14171d', accent: '#22d3ee' }), []);
  return (
    <group>
      <mesh position-y={0.8} castShadow>
        <boxGeometry args={[0.62, 1.6, 0.6]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0, 1.0, 0.301]}>
        <planeGeometry args={[0.54, 0.75]} />
        <meshStandardMaterial map={face} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** A port opening on a gadget's front: x offset, width, height (m) and the colour of its insert. */
type PortHole = readonly [x: number, w: number, h: number, insert?: string];

/** Common port openings (width, height in m) for the gadget fronts. */
const USB_A = [0.0125, 0.0045] as const;
const USB_C = [0.009, 0.0032] as const;

/** Small accessory box (dock, hub, card reader): size in metres, colour, port openings on the front. */
export function Gadget({ size, color = '#2a2e36', glow, ports = [] }: { size: readonly [number, number, number]; color?: string; glow?: string; ports?: readonly PortHole[] }) {
  const [w, h, d] = size;
  return (
    <group>
      <RoundedBox args={[...size]} radius={Math.min(0.01, h / 2.2)} position-y={h / 2} castShadow>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.38} />
      </RoundedBox>
      {ports.map(([x, pw, ph, insert = '#0b0d11'], i) => (
        <mesh key={i} position={[x, h / 2, d / 2 + 0.0006]}>
          <planeGeometry args={[pw, ph]} />
          <meshStandardMaterial color={insert} roughness={0.6} />
        </mesh>
      ))}
      {glow && (
        <mesh position={[w / 2 - 0.012, h / 2 + 0.002, d / 2 + 0.0006]}>
          <circleGeometry args={[0.002, 12]} />
          <meshStandardMaterial color="#000" emissive={glow} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Port layouts of the power-zone gadgets (front faces). */
const DOCK_PORTS: readonly PortHole[] = [
  [-0.075, ...USB_C], [-0.058, ...USB_C], [-0.036, ...USB_A, '#2563eb'], [-0.017, ...USB_A, '#2563eb'],
  [0.006, 0.015, 0.006], [0.028, 0.013, 0.0055], [0.05, 0.014, 0.011], [0.072, 0.0055, 0.0055],
];
const READER_PORTS: readonly PortHole[] = [
  [-0.008, 0.026, 0.0024],
  [0.017, 0.012, 0.0016],
];

export const DockingStation = () => <Gadget size={[0.2, 0.03, 0.08]} glow="#38d6f5" ports={DOCK_PORTS} />;
export const CardReader = () => <Gadget size={[0.06, 0.012, 0.04]} color="#1a1d23" glow="#38d6f5" ports={READER_PORTS} />;


/**
 * A cable hanging on its hook: a bundled hank with both plugs (0.37,
 * devices/cables.ts — the connector shapes of the real cable, no more rings).
 */
export function CableCoil({ kind }: { kind: CableKind }) {
  const geo = useDisposable(() => cableGeometry(kind), [kind]);
  return (
    <group>
      <mesh position={[0, 0, 0.04]}>
        <cylinderGeometry args={[0.006, 0.006, 0.06, 8]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, 0, 0.06]}>
        <mesh geometry={geo.colored} castShadow>
          <meshStandardMaterial vertexColors roughness={0.5} metalness={0.05} />
        </mesh>
        <mesh geometry={geo.metal}>
          <meshStandardMaterial color="#c8ccd4" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/** Ceiling access point: a white disc with its status ring (shown leaning on a stand). */
export function AccessPoint() {
  return (
    <group>
      <mesh position-y={0.016} castShadow>
        <cylinderGeometry args={[0.1, 0.095, 0.032, 48]} />
        <meshStandardMaterial {...white} />
      </mesh>
      <mesh position-y={0.0325} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.022, 0.028, 40]} />
        <meshStandardMaterial color="#000" emissive="#38bdf8" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh position-y={0.0322} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.085, 48]} />
        <meshStandardMaterial color="#f4f5f7" roughness={0.3} />
      </mesh>
    </group>
  );
}

