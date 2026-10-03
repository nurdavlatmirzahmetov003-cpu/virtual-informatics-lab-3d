/**
 * [PLACEHOLDER] Procedural stand-ins for devices that have no licensed GLB
 * yet (microphone, webcam, printer, HDD, network card). Real dimensions,
 * PBR materials; each is built with its base at y = 0. Listed in TODO.md.
 */
import { RoundedBox } from '@react-three/drei';
import { useDisposable } from '@/hooks/useDisposable';
import { brushedMetalTexture, labelTexture, pcbTexture, perforatedTexture } from '@/lib/three/proceduralTextures';

const matteBlack = { color: '#16181c', metalness: 0.1, roughness: 0.55 } as const;
const darkMetal = { color: '#2a2d33', metalness: 0.85, roughness: 0.32 } as const;
const gold = { color: '#d9a441', metalness: 1, roughness: 0.28 } as const;

/** USB desk microphone on a weighted base (≈ 23 cm). */
export function Microphone() {
  const grille = useDisposable(() => perforatedTexture([5, 3]), []);
  return (
    <group>
      <mesh position-y={0.006} castShadow receiveShadow>
        <cylinderGeometry args={[0.055, 0.058, 0.012, 48]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>
      <mesh position-y={0.05} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.08, 20]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>
      {/* yoke */}
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.006, 0.06, 0.016]} radius={0.002} position={[s * 0.035, 0.12, 0]} castShadow>
          <meshStandardMaterial {...darkMetal} />
        </RoundedBox>
      ))}
      <mesh position-y={0.135} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.09, 40]} />
        <meshStandardMaterial {...matteBlack} />
      </mesh>
      {/* steel mesh head with an inner foam windscreen */}
      <mesh position-y={0.2} castShadow>
        <cylinderGeometry args={[0.031, 0.031, 0.04, 40, 1, true]} />
        <meshStandardMaterial color="#b9bec6" metalness={0.9} roughness={0.35} alphaMap={grille} alphaTest={0.5} side={2} />
      </mesh>
      <mesh position-y={0.2}>
        <cylinderGeometry args={[0.027, 0.027, 0.04, 32]} />
        <meshStandardMaterial color="#0b0c0e" roughness={0.95} />
      </mesh>
      <mesh position-y={0.22} castShadow>
        <sphereGeometry args={[0.031, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#b9bec6" metalness={0.9} roughness={0.35} alphaMap={grille} alphaTest={0.5} side={2} />
      </mesh>
      {/* mute LED + gain knob */}
      <mesh position={[0, 0.16, 0.0302]}>
        <circleGeometry args={[0.003, 16]} />
        <meshStandardMaterial color="#000" emissive="#38d6f5" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 0.12, 0.029]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.008, 0.008, 0.008, 24]} />
        <meshStandardMaterial {...darkMetal} />
      </mesh>
    </group>
  );
}

/** 1080p clip-on webcam resting on the monitor's top edge. */
export function Webcam() {
  return (
    <group>
      {/* clip: top plate + rear flap */}
      <RoundedBox args={[0.045, 0.004, 0.05]} radius={0.0015} position={[0, 0.002, -0.018]} castShadow>
        <meshStandardMaterial {...matteBlack} />
      </RoundedBox>
      <RoundedBox args={[0.04, 0.04, 0.004]} radius={0.0015} position={[0, -0.016, -0.043]} castShadow>
        <meshStandardMaterial {...matteBlack} />
      </RoundedBox>
      <RoundedBox args={[0.095, 0.03, 0.028]} radius={0.012} smoothness={6} position={[0, 0.02, 0.004]} castShadow>
        <meshStandardMaterial color="#1b1d22" metalness={0.2} roughness={0.38} />
      </RoundedBox>
      {/* lens: chrome ring, coated glass, privacy LED */}
      <mesh position={[0, 0.02, 0.0185]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.0105, 0.0105, 0.002, 32]} />
        <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.02, 0.0197]}>
        <circleGeometry args={[0.0082, 32]} />
        <meshPhysicalMaterial color="#05070c" metalness={0.2} roughness={0.05} clearcoat={1} iridescence={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.03, 0.02, 0.0182]}>
          <circleGeometry args={[0.0022, 16]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0.017, 0.028, 0.0182]}>
        <circleGeometry args={[0.0012, 12]} />
        <meshStandardMaterial color="#000" emissive="#3ddc97" emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}

/** Inkjet multifunction printer (≈ 40 × 34 × 20 cm). */
export function Printer() {
  const panel = useDisposable(() => labelTexture(['READY', 'A4 · Wi-Fi · USB'], { w: 256, h: 96 }), []);
  return (
    <group>
      <RoundedBox args={[0.4, 0.14, 0.32]} radius={0.012} smoothness={4} position-y={0.07} castShadow receiveShadow>
        <meshStandardMaterial color="#e3e5e8" metalness={0} roughness={0.42} />
      </RoundedBox>
      {/* scanner lid */}
      <RoundedBox args={[0.395, 0.022, 0.3]} radius={0.008} position={[0, 0.151, -0.008]} castShadow>
        <meshStandardMaterial color="#f1f2f4" metalness={0} roughness={0.35} />
      </RoundedBox>
      {/* rear paper feed with a sheet */}
      <group position={[0, 0.16, -0.15]} rotation-x={-0.45}>
        <RoundedBox args={[0.23, 0.004, 0.12]} radius={0.0015} position-z={-0.06} castShadow>
          <meshStandardMaterial color="#cfd2d6" roughness={0.5} />
        </RoundedBox>
        <mesh position={[0, 0.0035, -0.065]} castShadow>
          <boxGeometry args={[0.21, 0.001, 0.13]} />
          <meshStandardMaterial color="#fbfbf8" roughness={0.9} />
        </mesh>
      </group>
      {/* front output slot + tray */}
      <mesh position={[0, 0.06, 0.1605]}>
        <boxGeometry args={[0.27, 0.014, 0.002]} />
        <meshStandardMaterial color="#1b1d21" roughness={0.6} />
      </mesh>
      <RoundedBox args={[0.25, 0.004, 0.11]} radius={0.0015} position={[0, 0.046, 0.21]} castShadow receiveShadow>
        <meshStandardMaterial color="#cfd2d6" roughness={0.5} />
      </RoundedBox>
      {/* control panel */}
      <mesh position={[0.13, 0.1405, 0.155]} rotation-x={-0.35}>
        <planeGeometry args={[0.09, 0.034]} />
        <meshStandardMaterial map={panel} emissiveMap={panel} emissive="#ffffff" emissiveIntensity={0.35} roughness={0.2} />
      </mesh>
      <mesh position={[-0.15, 0.1405, 0.158]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.006, 24]} />
        <meshStandardMaterial color="#000" emissive="#3ddc97" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

/** 3.5-inch hard disk lying cover-up (147 × 101.6 × 26.1 mm). */
export function Hdd() {
  const tex = useDisposable(
    () => ({
      brushed: brushedMetalTexture([2, 1]),
      label: labelTexture(['HDD 2 TB', '3.5" · SATA 6 Gb/s · 7200 RPM', 'Virtual Informatics Lab'], { w: 512, h: 384 }),
    }),
    [],
  );
  return (
    <group>
      <RoundedBox args={[0.1016, 0.022, 0.147]} radius={0.003} position-y={0.011} castShadow receiveShadow>
        <meshStandardMaterial color="#3b3f45" metalness={0.75} roughness={0.45} />
      </RoundedBox>
      <RoundedBox args={[0.098, 0.004, 0.143]} radius={0.0015} position-y={0.0241} castShadow>
        <meshStandardMaterial color="#c3c7cd" metalness={0.95} roughness={0.32} map={tex.brushed} />
      </RoundedBox>
      <mesh position={[0, 0.0262, 0.012]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.08, 0.06]} />
        <meshStandardMaterial map={tex.label} roughness={0.5} />
      </mesh>
      {[
        [-0.044, -0.066],
        [0.044, -0.066],
        [-0.044, 0.066],
        [0.044, 0.066],
        [0, -0.04],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.0263, z]}>
          <cylinderGeometry args={[0.0022, 0.0022, 0.0008, 16]} />
          <meshStandardMaterial {...darkMetal} />
        </mesh>
      ))}
      {/* SATA data + power connectors on the rear edge */}
      <mesh position={[0.018, 0.008, -0.0745]}>
        <boxGeometry args={[0.016, 0.004, 0.003]} />
        <meshStandardMaterial {...matteBlack} />
      </mesh>
      <mesh position={[-0.012, 0.008, -0.0745]}>
        <boxGeometry args={[0.024, 0.004, 0.003]} />
        <meshStandardMaterial {...matteBlack} />
      </mesh>
    </group>
  );
}

/** PCIe x1 gigabit network card lying component-side up, with its bracket. */
export function NetworkCard() {
  const tex = useDisposable(() => ({ pcb: pcbTexture('#1d3a2a', 256, 160, 11), brushed: brushedMetalTexture([1, 3]) }), []);
  return (
    <group>
      <mesh position-y={0.0008} castShadow receiveShadow>
        <boxGeometry args={[0.12, 0.0016, 0.068]} />
        <meshStandardMaterial map={tex.pcb} metalness={0.2} roughness={0.55} />
      </mesh>
      {/* PCIe x1 edge fingers */}
      <mesh position={[0.005, 0.0009, 0.037]}>
        <boxGeometry args={[0.025, 0.0017, 0.007]} />
        <meshStandardMaterial {...gold} />
      </mesh>
      {/* bracket stands up along the short edge */}
      <mesh position={[-0.061, 0.009, -0.01]} castShadow>
        <boxGeometry args={[0.001, 0.018, 0.12]} />
        <meshStandardMaterial color="#c8ccd2" metalness={0.95} roughness={0.3} map={tex.brushed} />
      </mesh>
      {/* RJ-45 jack */}
      <group position={[-0.051, 0.0016, -0.01]}>
        <mesh position-y={0.0068} castShadow>
          <boxGeometry args={[0.02, 0.0136, 0.016]} />
          <meshStandardMaterial color="#b8bdc4" metalness={0.9} roughness={0.35} />
        </mesh>
        <mesh position={[-0.0101, 0.0068, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[0.012, 0.009]} />
          <meshStandardMaterial color="#050505" roughness={0.9} />
        </mesh>
      </group>
      {/* controller chip under a small heatsink */}
      <mesh position={[0.02, 0.0024, -0.005]} castShadow>
        <boxGeometry args={[0.014, 0.0016, 0.014]} />
        <meshStandardMaterial {...matteBlack} />
      </mesh>
      <mesh position={[0.02, 0.0052, -0.005]} castShadow>
        <boxGeometry args={[0.018, 0.004, 0.018]} />
        <meshStandardMaterial color="#5a6270" metalness={0.8} roughness={0.4} />
      </mesh>
      {[0.004, 0.009].map((z) => (
        <mesh key={z} position={[-0.036, 0.002, z]}>
          <boxGeometry args={[0.003, 0.0012, 0.002]} />
          <meshStandardMaterial color="#000" emissive={z > 0.005 ? '#ffb547' : '#3ddc97'} emissiveIntensity={1.8} />
        </mesh>
      ))}
    </group>
  );
}
