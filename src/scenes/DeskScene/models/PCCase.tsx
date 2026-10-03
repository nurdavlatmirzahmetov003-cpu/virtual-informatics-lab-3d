/**
 * [PLACEHOLDER] Procedural ATX mid-tower: powder-coated steel chassis,
 * tempered-glass side panel with ceramic frit border, perforated front mesh,
 * 3 front + 1 rear ARGB fans, and a visible interior (motherboard, tower
 * cooler, RAM, GPU, PSU shroud, cables). Interior parts are named groups so
 * the next phase can drive the exploded view. Replace with optimised GLBs.
 */
import { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Matrix4, MeshStandardMaterial, type InstancedMesh, type PointLight } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import {
  extrudeFront,
  fanBladesGeometry,
  fanFrameShape,
  frameShape,
  roundedRectShape,
  tubeAlong,
} from '@/lib/three/geometry';
import { brushedMetalTexture, perforatedTexture } from '@/lib/three/proceduralTextures';
import { PC } from '../layout';
import { storyRig } from '../storyRig';
import { Fan } from './Fan';

const [W, H, D] = PC.size;
const T = 0.004; // sheet thickness
const FAN = 0.12;

// motherboard placement (board plane faces −X, toward the glass)
const MB = { x: W / 2 - T - 0.012, y: H / 2 - 0.03 - 0.305 / 2, z: -D / 2 + 0.024 + 0.244 / 2, h: 0.305, d: 0.244 };
const BOARD_FACE = MB.x - 0.0008;
const CPU = { y: MB.y + 0.07, z: MB.z - 0.015 };
const GPU = { y: MB.y - 0.045, len: 0.3, height: 0.125, thick: 0.05 };

const powderCoat = { color: '#1a1c21', metalness: 0.45, roughness: 0.48 } as const;

export function PCCase() {
  const preset = useQualityPreset();
  const fins = useRef<InstancedMesh>(null);
  const light = useRef<PointLight>(null);

  const res = useDisposable(
    () => ({
      fanFrame: extrudeFront(fanFrameShape(FAN, FAN * 0.47), 0.025, { bevel: 0.0015 }),
      fanBlades: fanBladesGeometry(FAN * 0.45),
      frontBezel: extrudeFront(frameShape(W, H, 0.01, 0.014, 0.006), 0.012, { bevel: 0.002 }),
      frit: extrudeFront(frameShape(D - 0.006, H - 0.006, 0.006, 0.016, 0.004), 0.0006, { bevel: 0 }),
      glassFront: extrudeFront(roundedRectShape(D - 0.006, H - 0.006, 0.006), 0.004, { bevel: 0.0008 }),
      perforated: perforatedTexture([7, 14]),
      vent: perforatedTexture([5, 9]),
      brushed: brushedMetalTexture([1, 1]),
      cable24: tubeAlong(
        [
          [BOARD_FACE - 0.006, MB.y + 0.01, MB.z + MB.d / 2 - 0.004],
          [BOARD_FACE - 0.03, MB.y + 0.01, MB.z + MB.d / 2 + 0.02],
          [MB.x + 0.004, MB.y + 0.0, MB.z + MB.d / 2 + 0.035],
        ],
        0.008,
      ),
      cableGpu: tubeAlong(
        [
          [BOARD_FACE - 0.07, GPU.y + GPU.thick / 2 + 0.004, -0.02],
          [BOARD_FACE - 0.07, GPU.y + 0.05, 0.04],
          [BOARD_FACE - 0.05, -H / 2 + 0.11, 0.08],
          [BOARD_FACE - 0.02, -H / 2 + 0.096, 0.1],
        ],
        0.0045,
      ),
      cableCpu: tubeAlong(
        [
          [BOARD_FACE - 0.004, MB.y + MB.h / 2 - 0.012, MB.z - MB.d / 2 + 0.02],
          [BOARD_FACE - 0.02, H / 2 - 0.02, MB.z - MB.d / 2 + 0.03],
          [MB.x + 0.004, H / 2 - 0.016, MB.z - MB.d / 2 + 0.06],
        ],
        0.004,
      ),
      rgb: new MeshStandardMaterial({ color: '#000000', emissive: '#4fdcff', emissiveIntensity: 1, roughness: 0.4 }),
      ramLight: new MeshStandardMaterial({ color: '#000000', emissive: '#d8f6ff', emissiveIntensity: 1, roughness: 0.3 }),
    }),
    [],
  );

  // tower-cooler fin stack (one instanced draw)
  const FIN_COUNT = 46;
  useLayoutEffect(() => {
    const mesh = fins.current;
    if (!mesh) return;
    const m = new Matrix4();
    for (let i = 0; i < FIN_COUNT; i++) {
      m.makeTranslation(BOARD_FACE - 0.045 - i * 0.0023, CPU.y, CPU.z);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  useFrame(() => {
    const glow = storyRig.pcGlow;
    res.rgb.emissiveIntensity = 0.7 + glow * 1.6;
    res.ramLight.emissiveIntensity = 0.6 + glow * 1.2;
    if (light.current) light.current.intensity = 0.04 + glow * 0.22;
  });

  const fanGeo = { frame: res.fanFrame, blades: res.fanBlades };
  const cy = PC.feet + H / 2;

  return (
    <group position={[...PC.position]}>
      {/* feet */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (W / 2 - 0.03), PC.feet / 2, sz * (D / 2 - 0.04)]}>
            <cylinderGeometry args={[0.014, 0.016, PC.feet, 24]} />
            <meshStandardMaterial color="#0c0c0e" roughness={0.85} />
          </mesh>
        )),
      )}

      <group position-y={cy}>
        {/* ---------- chassis ---------- */}
        <RoundedBox args={[T, H, D]} radius={0.0018} position-x={W / 2 - T / 2} castShadow receiveShadow>
          <meshStandardMaterial {...powderCoat} />
        </RoundedBox>
        <RoundedBox args={[W, T, D]} radius={0.0018} position-y={H / 2 - T / 2} castShadow receiveShadow>
          <meshStandardMaterial {...powderCoat} />
        </RoundedBox>
        {/* top vent (perforated) */}
        <mesh position={[0, H / 2 + 0.0004, -0.02]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[W - 0.05, D - 0.14]} />
          <meshStandardMaterial color="#0e0f12" roughness={0.6} metalness={0.4} alphaMap={res.vent} alphaTest={0.5} />
        </mesh>
        <RoundedBox args={[W, T, D]} radius={0.0018} position-y={-H / 2 + T / 2} castShadow receiveShadow>
          <meshStandardMaterial {...powderCoat} />
        </RoundedBox>
        <RoundedBox args={[W, H, T]} radius={0.0018} position-z={-D / 2 + T / 2} castShadow receiveShadow>
          <meshStandardMaterial {...powderCoat} />
        </RoundedBox>
        {/* rear: IO shield + expansion slot covers */}
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

        {/* front: bezel + perforated mesh + I/O */}
        <mesh geometry={res.frontBezel} position-z={D / 2 - 0.004} castShadow>
          <meshStandardMaterial color="#141519" roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh position-z={D / 2 + 0.002}>
          <planeGeometry args={[W - 0.026, H - 0.026]} />
          <meshStandardMaterial
            color="#0c0d10"
            metalness={0.5}
            roughness={0.5}
            alphaMap={res.perforated}
            alphaTest={0.5}
            side={2}
          />
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

        {/* fans */}
        {[0.13, 0.005, -0.12].map((y) => (
          <Fan key={y} size={FAN} geometries={fanGeo} rgb={res.rgb} position={[-0.005, y, D / 2 - 0.03]} speed={6.5} />
        ))}
        <Fan size={FAN} geometries={fanGeo} rgb={res.rgb} position={[0, MB.y + 0.06, -D / 2 + 0.018]} speed={6} />

        {/* ---------- interior ---------- */}
        <group name="motherboard">
          {/* standoffs implied; PCB */}
          <mesh position={[MB.x, MB.y, MB.z]} receiveShadow>
            <boxGeometry args={[0.0016, MB.h, MB.d]} />
            <meshStandardMaterial color="#14171b" roughness={0.55} metalness={0.25} />
          </mesh>
          {/* VRM heatsinks */}
          <RoundedBox args={[0.02, 0.03, 0.1]} radius={0.003} position={[BOARD_FACE - 0.01, CPU.y + 0.075, CPU.z]} castShadow>
            <meshStandardMaterial color="#2f3238" metalness={0.8} roughness={0.35} roughnessMap={res.brushed} />
          </RoundedBox>
          <RoundedBox args={[0.022, 0.12, 0.034]} radius={0.003} position={[BOARD_FACE - 0.011, CPU.y + 0.01, MB.z - MB.d / 2 + 0.03]} castShadow>
            <meshStandardMaterial color="#2f3238" metalness={0.8} roughness={0.35} roughnessMap={res.brushed} />
          </RoundedBox>
          {/* chipset + M.2 heatsinks */}
          <RoundedBox args={[0.01, 0.06, 0.062]} radius={0.003} position={[BOARD_FACE - 0.005, MB.y - 0.1, MB.z + 0.06]}>
            <meshStandardMaterial color="#3a3d44" metalness={0.85} roughness={0.3} roughnessMap={res.brushed} />
          </RoundedBox>
          <RoundedBox args={[0.006, 0.024, 0.085]} radius={0.002} position={[BOARD_FACE - 0.003, MB.y - 0.07, MB.z - 0.005]}>
            <meshStandardMaterial color="#3a3d44" metalness={0.85} roughness={0.3} roughnessMap={res.brushed} />
          </RoundedBox>
          {/* PCIe slots */}
          {[GPU.y, MB.y - 0.1, MB.y - 0.125].map((y) => (
            <mesh key={y} position={[BOARD_FACE - 0.004, y + (y === GPU.y ? 0.03 : 0), MB.z - 0.03]}>
              <boxGeometry args={[0.008, 0.007, 0.089]} />
              <meshStandardMaterial color="#0b0c0e" roughness={0.6} />
            </mesh>
          ))}
          {/* 24-pin header */}
          <mesh position={[BOARD_FACE - 0.008, MB.y + 0.01, MB.z + MB.d / 2 - 0.006]}>
            <boxGeometry args={[0.016, 0.052, 0.009]} />
            <meshStandardMaterial color="#0b0c0e" roughness={0.7} />
          </mesh>
        </group>

        <group name="ram">
          {[0, 1, 2, 3].map((i) => (
            <mesh key={`slot${i}`} position={[BOARD_FACE - 0.004, CPU.y - 0.005, CPU.z + 0.075 + i * 0.0085]}>
              <boxGeometry args={[0.008, 0.135, 0.0055]} />
              <meshStandardMaterial color="#0b0c0e" roughness={0.6} />
            </mesh>
          ))}
          {[1, 3].map((i) => (
            <group key={i} position={[BOARD_FACE - 0.024, CPU.y - 0.005, CPU.z + 0.075 + i * 0.0085]}>
              <RoundedBox args={[0.04, 0.133, 0.0068]} radius={0.0012} castShadow>
                <meshStandardMaterial color="#26292f" metalness={0.75} roughness={0.32} roughnessMap={res.brushed} />
              </RoundedBox>
              <mesh position-x={-0.021} material={res.ramLight}>
                <boxGeometry args={[0.004, 0.128, 0.006]} />
              </mesh>
            </group>
          ))}
        </group>

        <group name="cooler">
          {/* cold plate + heat pipes */}
          <mesh position={[BOARD_FACE - 0.012, CPU.y, CPU.z]}>
            <boxGeometry args={[0.018, 0.045, 0.045]} />
            <meshStandardMaterial color="#9ea3ab" metalness={0.95} roughness={0.25} />
          </mesh>
          {[-0.015, -0.005, 0.005, 0.015].map((dz) => (
            <mesh key={dz} position={[BOARD_FACE - 0.095, CPU.y + 0.05, CPU.z + dz]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.003, 0.003, 0.15, 12]} />
              <meshStandardMaterial color="#b87333" metalness={1} roughness={0.28} />
            </mesh>
          ))}
          <instancedMesh ref={fins} args={[undefined, undefined, FIN_COUNT]} castShadow>
            <boxGeometry args={[0.0004, 0.125, 0.052]} />
            <meshStandardMaterial color="#c3c7ce" metalness={0.9} roughness={0.3} />
          </instancedMesh>
          {/* top cover */}
          <RoundedBox
            args={[0.004, 0.128, 0.056]}
            radius={0.0015}
            position={[BOARD_FACE - 0.045 - FIN_COUNT * 0.0023, CPU.y, CPU.z]}
            castShadow
          >
            <meshStandardMaterial color="#1b1d22" metalness={0.8} roughness={0.3} roughnessMap={res.brushed} />
          </RoundedBox>
          <Fan
            size={FAN}
            geometries={fanGeo}
            position={[BOARD_FACE - 0.098, CPU.y, CPU.z + 0.04]}
            speed={5}
          />
        </group>

        <group name="gpu">
          {/* shroud */}
          <RoundedBox
            args={[GPU.height, GPU.thick, GPU.len]}
            radius={0.006}
            smoothness={4}
            position={[BOARD_FACE - GPU.height / 2 - 0.004, GPU.y, -D / 2 + 0.012 + GPU.len / 2]}
            castShadow
          >
            <meshStandardMaterial color="#202227" metalness={0.6} roughness={0.38} />
          </RoundedBox>
          {/* backplate */}
          <mesh position={[BOARD_FACE - GPU.height / 2 - 0.004, GPU.y + GPU.thick / 2 + 0.0012, -D / 2 + 0.012 + GPU.len / 2]}>
            <boxGeometry args={[GPU.height - 0.004, 0.002, GPU.len - 0.006]} />
            <meshStandardMaterial color="#3a3d43" metalness={0.85} roughness={0.3} roughnessMap={res.brushed} />
          </mesh>
          {/* glass-facing edge: light bar */}
          <mesh position={[BOARD_FACE - GPU.height - 0.0045, GPU.y + 0.008, -D / 2 + 0.012 + GPU.len * 0.55]} material={res.rgb}>
            <boxGeometry args={[0.001, 0.004, GPU.len * 0.6]} />
          </mesh>
          {/* underside fans */}
          {[-1, 0, 1].map((i) => (
            <Fan
              key={i}
              size={FAN}
              geometries={fanGeo}
              scale={0.75}
              position={[BOARD_FACE - GPU.height / 2 - 0.004, GPU.y - GPU.thick / 2 - 0.004, -D / 2 + 0.012 + GPU.len / 2 + i * 0.095]}
              rotation-x={Math.PI / 2}
              speed={5.5}
            />
          ))}
          {/* PCIe bracket */}
          <mesh position={[BOARD_FACE - 0.06, GPU.y, -D / 2 + 0.008]}>
            <boxGeometry args={[0.11, 0.04, 0.0015]} />
            <meshStandardMaterial color="#8d9198" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>

        <group name="psu-shroud">
          <RoundedBox
            args={[W - T * 2, 0.09, D - T - 0.075]}
            radius={0.003}
            position={[0, -H / 2 + T + 0.045, -0.0375 + T / 2]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial {...powderCoat} />
          </RoundedBox>
        </group>

        <group name="cables">
          <mesh geometry={res.cable24}>
            <meshStandardMaterial color="#0e0f12" roughness={0.75} />
          </mesh>
          <mesh geometry={res.cableGpu}>
            <meshStandardMaterial color="#0e0f12" roughness={0.75} />
          </mesh>
          <mesh geometry={res.cableCpu}>
            <meshStandardMaterial color="#0e0f12" roughness={0.75} />
          </mesh>
        </group>

        {/* interior light strip + fill light */}
        <mesh position={[-W / 2 + 0.02, H / 2 - T - 0.002, 0]}>
          <boxGeometry args={[0.006, 0.002, D - 0.06]} />
          <meshStandardMaterial color="#000" emissive="#dff8ff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <pointLight ref={light} position={[-0.02, 0.08, 0.02]} color="#bfefff" intensity={0.05} distance={0.6} decay={2} />

        {/* ---------- tempered glass side panel ---------- */}
        <group position-x={-W / 2 - 0.0005} rotation-y={-Math.PI / 2}>
          <mesh geometry={res.glassFront} position-z={-0.002}>
            {preset.transmission ? (
              <meshPhysicalMaterial
                color="#aeb8c4"
                transmission={1}
                thickness={0.004}
                roughness={0.03}
                ior={1.5}
                metalness={0}
                envMapIntensity={1.1}
                specularIntensity={1}
              />
            ) : (
              <meshPhysicalMaterial
                color="#8fa0b3"
                transparent
                opacity={0.16}
                roughness={0.05}
                metalness={0.1}
                envMapIntensity={1.2}
                depthWrite={false}
              />
            )}
          </mesh>
          {/* black ceramic frit border */}
          <mesh geometry={res.frit} position-z={0.0021}>
            <meshStandardMaterial color="#050506" roughness={0.3} />
          </mesh>
          {/* thumbscrews */}
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sy) => (
              <mesh
                key={`${sx}${sy}`}
                position={[sx * (D / 2 - 0.02), sy * (H / 2 - 0.02), 0.004]}
                rotation-x={Math.PI / 2}
              >
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
