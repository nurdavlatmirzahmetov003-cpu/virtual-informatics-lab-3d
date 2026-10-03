/**
 * [PLACEHOLDER] ATX mid-tower shell: powder-coated steel panels, perforated
 * top vent and front mesh, rear I/O + slot covers, PSU shroud, rear exhaust
 * fan, interior LED strip, cable runs, and the removable tempered-glass side
 * panel (pulled out and lifted away by `pcRig.glassOpen`).
 */
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import type { Group, Material, MeshStandardMaterial, PointLight } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { ModelLoader } from '@/components/3d/ModelLoader';
import { extrudeFront, frameShape, roundedRectShape, tubeAlong } from '@/lib/three/geometry';
import { Fan, type FanGeometries } from '../models/Fan';
import { BOARD_FACE, D, FAN, GPU, H, MB, T, W } from './constants';
import { pcRig } from './pcRig';
import type { PcTextures } from './usePcTextures';

const powderCoat = { color: '#1a1c21', metalness: 0.45, roughness: 0.48 } as const;
const smooth = (x: number) => x * x * (3 - 2 * x);
const chassisFit = { axis: 1 as const, size: H, rotation: [0, Math.PI / 2, 0] as const };

export function Chassis({ tex, fan, rgb }: { tex: PcTextures; fan: FanGeometries; rgb: Material }) {
  const preset = useQualityPreset();
  const glass = useRef<Group>(null);
  const cables = useRef<Group>(null);
  const strip = useRef<MeshStandardMaterial>(null);
  const light = useRef<PointLight>(null);

  const geo = useDisposable(
    () => ({
      frontBezel: extrudeFront(frameShape(W, H, 0.01, 0.014, 0.006), 0.012, { bevel: 0.002 }),
      frit: extrudeFront(frameShape(D - 0.006, H - 0.006, 0.006, 0.016, 0.004), 0.0006, { bevel: 0 }),
      glassPane: extrudeFront(roundedRectShape(D - 0.006, H - 0.006, 0.006), 0.005, { bevel: 0.0012 }),
      cable24: tubeAlong(
        [
          [BOARD_FACE - 0.006, MB.y + 0.01, MB.z + MB.d / 2 - 0.004],
          [BOARD_FACE - 0.03, MB.y + 0.01, MB.z + MB.d / 2 + 0.02],
          [MB.x + 0.004, MB.y, MB.z + MB.d / 2 + 0.035],
        ],
        0.008,
      ),
      cableGpu: tubeAlong(
        [
          [BOARD_FACE - 0.123, GPU.y + 0.02, GPU.z0 + GPU.len * 0.68],
          [BOARD_FACE - 0.12, GPU.y + 0.07, GPU.z0 + GPU.len * 0.75],
          [BOARD_FACE - 0.06, -H / 2 + 0.12, 0.1],
          [BOARD_FACE - 0.02, -H / 2 + 0.096, 0.12],
        ],
        0.0045,
      ),
      cableCpu: tubeAlong(
        [
          [BOARD_FACE - 0.004, MB.y + MB.h / 2 - 0.012, MB.z - MB.d / 2 + 0.03],
          [BOARD_FACE - 0.02, H / 2 - 0.02, MB.z - MB.d / 2 + 0.04],
          [MB.x + 0.004, H / 2 - 0.016, MB.z - MB.d / 2 + 0.07],
        ],
        0.004,
      ),
    }),
    [],
  );

  useFrame(() => {
    // glass: pull out 5 cm, then lift away
    const g = pcRig.glassOpen;
    if (glass.current) {
      const out = smooth(Math.min(1, g / 0.35));
      const lift = smooth(Math.max(0, (g - 0.35) / 0.65));
      glass.current.position.set(-W / 2 - 0.0005 - 0.05 * out, lift * 0.62, 0);
      glass.current.visible = g < 0.995;
    }
    // cables would float when parts separate — tuck them away
    if (cables.current) cables.current.visible = pcRig.cables > 0.5 && pcRig.explode < 0.02;
    if (strip.current) strip.current.emissiveIntensity = 0.35 + 1.6 * pcRig.interior;
    if (light.current) {
      light.current.intensity = 0.08 * pcRig.glow + 0.14 * pcRig.interior;
      light.current.visible = light.current.intensity > 0.005;
    }
  });

  return (
    <group>
      {/* feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.03), -H / 2 - 0.007, sz * (D / 2 - 0.04)]}>
            <cylinderGeometry args={[0.014, 0.016, 0.014, 24]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          </mesh>
        )),
      )}

      {/* panels */}
      <ModelLoader url={`${import.meta.env.BASE_URL}assets/models/hardware/chassis.glb`} fit={chassisFit} scale={[-0.85, 1, -0.9]} fallback={<group>
      <RoundedBox args={[T, H, D]} radius={0.0018} position-x={W / 2 - T / 2} castShadow receiveShadow>
        <meshStandardMaterial {...powderCoat} />
      </RoundedBox>
      <RoundedBox args={[W, T, D]} radius={0.0018} position-y={H / 2 - T / 2} castShadow receiveShadow>
        <meshStandardMaterial {...powderCoat} />
      </RoundedBox>
      <mesh position={[0, H / 2 + 0.0004, -0.02]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W - 0.05, D - 0.14]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.6} metalness={0.4} alphaMap={tex.vent} alphaTest={0.5} />
      </mesh>
      <RoundedBox args={[W, T, D]} radius={0.0018} position-y={-H / 2 + T / 2} castShadow receiveShadow>
        <meshStandardMaterial {...powderCoat} />
      </RoundedBox>
      <RoundedBox args={[W, H, T]} radius={0.0018} position-z={-D / 2 + T / 2} castShadow receiveShadow>
        <meshStandardMaterial {...powderCoat} />
      </RoundedBox>

      {/* rear I/O shield + expansion slot covers */}
      <mesh position={[MB.x - 0.03, MB.y + MB.h / 2 - 0.07, -D / 2 - 0.0005]}>
        <boxGeometry args={[0.044, 0.155, 0.002]} />
        <meshStandardMaterial color="#5d6068" metalness={0.8} roughness={0.35} />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[MB.x - 0.06, GPU.y + 0.01 - i * 0.02, -D / 2 - 0.0006]}>
          <boxGeometry args={[0.1, 0.014, 0.0015]} />
          <meshStandardMaterial color={i < 3 ? '#2a2c31' : '#3a3c42'} metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* front bezel, mesh, top I/O */}
      <mesh geometry={geo.frontBezel} position-z={D / 2 - 0.004} castShadow>
        <meshStandardMaterial color="#141519" roughness={0.55} metalness={0.2} />
      </mesh>
      <mesh position-z={D / 2 + 0.002}>
        <planeGeometry args={[W - 0.026, H - 0.026]} />
        <meshStandardMaterial color="#0c0d10" metalness={0.5} roughness={0.5} alphaMap={tex.perforated} alphaTest={0.5} side={2} />
      </mesh>
      <group position={[0, H / 2 + 0.001, D / 2 - 0.035]}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.0045, 0.0058, 32]} />
          <meshStandardMaterial color="#000" emissive="#d9f6ff" emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
        {[0.025, 0.04].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.012, 0.002, 0.005]} />
            <meshStandardMaterial color="#050506" roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* PSU shroud (PSU itself is a separate part) */}
      <RoundedBox args={[W - T * 2, 0.094, D - T - 0.075]} radius={0.003} position={[0, -H / 2 + T + 0.047, -0.0375 + T / 2]} castShadow receiveShadow>
        <meshStandardMaterial {...powderCoat} />
      </RoundedBox>

      {/* rear exhaust fan */}
      </group>} />
      <Fan size={FAN} geometries={fan} rgb={rgb} position={[0, MB.y + 0.06, -D / 2 + 0.018]} speed={6} />

      <group ref={cables}>
        <mesh geometry={geo.cable24}>
          <meshStandardMaterial color="#0e0f12" roughness={0.75} />
        </mesh>
        <mesh geometry={geo.cableGpu}>
          <meshStandardMaterial color="#0e0f12" roughness={0.75} />
        </mesh>
        <mesh geometry={geo.cableCpu}>
          <meshStandardMaterial color="#0e0f12" roughness={0.75} />
        </mesh>
      </group>

      {/* interior LED strip + fill light */}
      <mesh position={[-W / 2 + 0.02, H / 2 - T - 0.002, 0]}>
        <boxGeometry args={[0.006, 0.002, D - 0.06]} />
        <meshStandardMaterial ref={strip} color="#000" emissive="#dff8ff" emissiveIntensity={0.35} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[-0.09, 0.14, 0.12]} color="#cdf3ff" intensity={0.03} distance={0.8} decay={2} />

      {/* tempered-glass side panel: smoked, with smudges, polished edges, frit border */}
      <group ref={glass} position-x={-W / 2 - 0.0005}>
        <group rotation-y={-Math.PI / 2}>
          <mesh geometry={geo.glassPane} position-z={-0.0025}>
            {preset.transmission ? (
              <meshPhysicalMaterial
                color="#d3dae2"
                transmission={1}
                thickness={0.006}
                roughness={0.035}
                roughnessMap={tex.smudge}
                ior={1.52}
                metalness={0}
                specularIntensity={1}
                attenuationColor="#93a6ba"
                attenuationDistance={0.6}
                envMapIntensity={1.25}
                clearcoat={0.6}
                clearcoatRoughness={0.04}
              />
            ) : (
              // reflective smoked glass without a refraction pass: env reflections,
              // clear-coat highlight and smudges keep it readable, never invisible
              <meshPhysicalMaterial
                color="#7d8b9b"
                transparent
                opacity={0.22}
                roughness={0.06}
                roughnessMap={tex.smudge}
                metalness={0.15}
                clearcoat={1}
                clearcoatRoughness={0.05}
                envMapIntensity={1.4}
                depthWrite={false}
              />
            )}
          </mesh>
          <mesh geometry={geo.frit} position-z={0.0026}>
            <meshStandardMaterial color="#050506" roughness={0.3} />
          </mesh>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sy) => (
              <mesh key={`${sx}${sy}`} position={[sx * (D / 2 - 0.02), sy * (H / 2 - 0.02), 0.0045]} rotation-x={Math.PI / 2}>
                <cylinderGeometry args={[0.0055, 0.0055, 0.006, 24]} />
                <meshStandardMaterial color="#15161a" metalness={0.8} roughness={0.35} />
              </mesh>
            )),
          )}
        </group>
      </group>
    </group>
  );
}
