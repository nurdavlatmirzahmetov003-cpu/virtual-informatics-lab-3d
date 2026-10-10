/**
 * Minimal studio room, coloured by the theme's scene palette: polished
 * concrete floor, plaster wall with an oak acoustic slat panel behind the
 * desk, monitor bias light on the wall.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { ContactShadows, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Matrix4, Object3D, RepeatWrapping, SRGBColorSpace, type InstancedMesh, type Group } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useScenePalette } from '@/hooks/useTheme';
import { useSceneTextures } from '@/lib/three/modelAssets';
import { DESK, DESK_TOP, MONITOR } from '../layout';

const TEX = `${import.meta.env.BASE_URL}assets/textures/`;
const FLOOR = [`${TEX}floor_diff.jpg`, `${TEX}floor_rough.webp`];
/** Low preset (phones): 512 px copies. */
const FLOOR_LOW = FLOOR.map((u) => u.replace(/\.(\w+)$/, '_512.$1'));
const WALL_Z = -0.95;
const SLATS = { count: 44, width: 0.028, pitch: 0.046, height: 2.1, depth: 0.018, bottom: 0.18 };

export function Room({ orbit = false }: { orbit?: boolean }) {
  const preset = useQualityPreset();
  const palette = useScenePalette();
  const slats = useRef<InstancedMesh>(null);
  const wall = useRef<Group>(null);
  useFrame(({ camera }) => {
    // A studio cutaway opens the rear wall before the viewer reaches it.
    if (wall.current) wall.current.visible = !orbit || camera.position.z > WALL_Z + 0.25;
  });
  const [biasTarget] = useState(() => new Object3D());

  const floor = preset.maxTextureSize <= 512 ? FLOOR_LOW : FLOOR;
  const [map, roughnessMap] = useTexture(floor, (loaded) => {
    loaded[0].colorSpace = SRGBColorSpace;
    loaded.forEach((t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(10, 10);
      t.anisotropy = 8;
    });
  });

  useSceneTextures(floor, [map, roughnessMap], preset.maxTextureSize, preset.anisotropy);

  useLayoutEffect(() => {
    const mesh = slats.current;
    if (!mesh) return;
    const m = new Matrix4();
    const span = (SLATS.count - 1) * SLATS.pitch;
    for (let i = 0; i < SLATS.count; i++) {
      m.makeTranslation(-span / 2 + i * SLATS.pitch, SLATS.bottom + SLATS.height / 2, WALL_Z + 0.012 + SLATS.depth / 2);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  const panelWidth = SLATS.count * SLATS.pitch + 0.04;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial map={map} roughnessMap={roughnessMap} color={palette.floorTint} envMapIntensity={0.3} />
      </mesh>
      <group ref={wall}>
      <mesh position={[0, 1.6, WALL_Z]} receiveShadow>
        <planeGeometry args={[10, 3.2]} />
        <meshStandardMaterial color={palette.wall} roughness={0.92} />
      </mesh>
      {/* felt backing + oak slats */}
      <mesh position={[0, SLATS.bottom + SLATS.height / 2, WALL_Z + 0.006]} receiveShadow>
        <boxGeometry args={[panelWidth, SLATS.height + 0.02, 0.012]} />
        <meshStandardMaterial color={palette.wallPanel} roughness={1} />
      </mesh>
      <instancedMesh ref={slats} args={[undefined, undefined, SLATS.count]} castShadow receiveShadow>
        <boxGeometry args={[SLATS.width, SLATS.height, SLATS.depth]} />
        <meshStandardMaterial color={palette.slats} roughness={0.7} envMapIntensity={0.4} />
      </instancedMesh>

      {/* monitor bias light washing the wall */}
      <primitive object={biasTarget} position={[MONITOR.position[0], DESK_TOP + 0.45, WALL_Z]} />
      <spotLight
        position={[MONITOR.position[0], DESK_TOP + MONITOR.panelCenterY + 0.02, MONITOR.position[2] - 0.08]}
        target={biasTarget}
        angle={1.0}
        penumbra={1}
        intensity={2.5}
        distance={2}
        decay={2}
        color="#53cfff"
      />
      </group>
      {!preset.shadows && (
        <>
          <ContactShadows position={[0, 0.001, 0]} scale={[DESK.width + 0.6, 1.4]} far={0.8} blur={2.5} opacity={0.7} resolution={256} frames={1} />
          <ContactShadows position={[0, DESK_TOP + 0.0005, 0]} scale={[DESK.width, DESK.depth]} far={0.3} blur={1.8} opacity={0.6} resolution={512} frames={1} />
        </>
      )}
    </group>
  );
}
