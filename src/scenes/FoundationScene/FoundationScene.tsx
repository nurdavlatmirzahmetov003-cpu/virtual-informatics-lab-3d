/**
 * [PLACEHOLDER] Phase 1 foundation scene.
 *
 * Exists only to exercise the rendering pipeline end to end — texture
 * loading + loader progress, PBR materials (metal, clearcoat, transmission),
 * shadows, environment reflections, bloom and the quality presets — until
 * the realistic DeskScene replaces it in Phase 2. It is not hardware and must
 * not be presented as such.
 */
import { ContactShadows, RoundedBox, useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { CameraRig } from '@/components/3d/CameraRig';
import { useQualityPreset } from '@/hooks/useQualityPreset';

const TEX = `${import.meta.env.BASE_URL}assets/textures/`;
const PLINTH_H = 0.75;

function tile(textures: Texture[], x: number, y: number) {
  for (const t of textures) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(x, y);
    t.anisotropy = 8;
  }
}

function Floor() {
  const preset = useQualityPreset();
  const [map, roughnessMap] = useTexture([`${TEX}floor_diff.jpg`, `${TEX}floor_rough.jpg`], (loaded) => {
    loaded[0].colorSpace = SRGBColorSpace;
    tile(loaded, 16, 16);
  });

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[30, 64]} />
        <meshStandardMaterial map={map} roughnessMap={roughnessMap} color="#4a4f5c" envMapIntensity={0.35} />
      </mesh>
      <ContactShadows
        position={[0, 0.002, 0]}
        scale={5}
        far={1.2}
        blur={2.4}
        opacity={0.75}
        resolution={preset.contactShadowResolution}
        frames={1}
      />
    </>
  );
}

function Plinth() {
  const [map, normalMap, roughnessMap] = useTexture(
    [`${TEX}wood_diff.jpg`, `${TEX}wood_nor.jpg`, `${TEX}wood_rough.jpg`],
    (loaded) => {
      loaded[0].colorSpace = SRGBColorSpace;
      tile(loaded, 1.4, 0.7);
    },
  );

  return (
    <group>
      {/* dark painted-steel base */}
      <RoundedBox args={[1.6, PLINTH_H - 0.04, 0.8]} radius={0.012} smoothness={4} position-y={(PLINTH_H - 0.04) / 2} castShadow receiveShadow>
        <meshStandardMaterial color="#15171d" metalness={0.6} roughness={0.42} />
      </RoundedBox>
      {/* oiled wood top */}
      <RoundedBox args={[1.7, 0.04, 0.86]} radius={0.008} smoothness={4} position-y={PLINTH_H - 0.02} castShadow receiveShadow>
        <meshStandardMaterial map={map} normalMap={normalMap} roughnessMap={roughnessMap} envMapIntensity={0.6} />
      </RoundedBox>
      {/* cyan accent strip: verifies emissive + bloom */}
      <mesh position={[0, PLINTH_H - 0.05, 0.405]}>
        <boxGeometry args={[1.5, 0.006, 0.004]} />
        <meshStandardMaterial color="#000000" emissive="#38d6f5" emissiveIntensity={4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Material calibration samples: brushed metal, clear-coated plastic, glass. */
function MaterialSamples() {
  const preset = useQualityPreset();
  const r = 0.13;
  const y = PLINTH_H + r;
  return (
    <group>
      <mesh position={[-0.42, y, 0]} castShadow>
        <sphereGeometry args={[r, 64, 48]} />
        <meshStandardMaterial color="#b9bec8" metalness={1} roughness={0.28} />
      </mesh>
      <mesh position={[0, y, 0]} castShadow>
        <sphereGeometry args={[r, 64, 48]} />
        <meshPhysicalMaterial color="#0d0f14" roughness={0.45} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <mesh position={[0.42, y, 0]} castShadow>
        <sphereGeometry args={[r, 64, 48]} />
        {preset.level === 'low' ? (
          <meshPhysicalMaterial color="#cfe8f2" roughness={0.05} transparent opacity={0.35} />
        ) : (
          <meshPhysicalMaterial color="#e6f6ff" roughness={0.04} transmission={1} thickness={0.25} ior={1.5} />
        )}
      </mesh>
    </group>
  );
}

export default function FoundationScene() {
  return (
    <>
      <EnvironmentLighting />
      <CameraRig state="HOME_WIDE" autoRotate />
      <Floor />
      <Plinth />
      <MaterialSamples />
    </>
  );
}
