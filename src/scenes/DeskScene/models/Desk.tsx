/**
 * Procedural desk: a thin 22 mm top (oiled oak from Poly Haven, or a solid
 * finish) on a powder-coated steel frame with a set-back apron, and a cable
 * tray with a power strip under the back (V4 §2.3).
 */
import { useTexture } from '@react-three/drei';
import { RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useSceneTextures } from '@/lib/three/modelAssets';
import { roundedSlab, roundedRectShape, extrudeFlat } from '@/lib/three/geometry';
import { BACKDROP_ORDER, DESK, DESK_TOP } from '../layout';

/** Top finishes for Setup Studio; wood keeps the albedo map, solid finishes keep only grain relief. */
export type DeskSurface = 'darkWood' | 'lightWood' | 'black' | 'white';
const SURFACE: Record<DeskSurface, { color: string; useMap: boolean; roughness: number }> = {
  lightWood: { color: '#d9c3a5', useMap: true, roughness: 0.85 },
  darkWood: { color: '#6e4c33', useMap: true, roughness: 0.78 },
  black: { color: '#1a1b1e', useMap: false, roughness: 0.62 },
  white: { color: '#e6e6e2', useMap: false, roughness: 0.55 },
};

const TEX = `${import.meta.env.BASE_URL}assets/textures/`;
/** Cable tray under the back of the top (V4 §2.3). */
const TRAY = { width: 1.0, depth: 0.13 };

const WOOD = [`${TEX}wood_diff.jpg`, `${TEX}wood_nor.webp`, `${TEX}wood_rough.jpg`];
/** Low preset (phones): 512 px copies — the GPU would shrink the 2K ones anyway. */
const WOOD_LOW = WOOD.map((u) => u.replace(/\.(\w+)$/, '_512.$1'));

function prepare(textures: Texture[], repeat: [number, number]) {
  textures.forEach((t) => {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(...repeat);
    t.anisotropy = 8;
  });
}

export function Desk({ surface = 'lightWood' }: { surface?: DeskSurface }) {
  const finish = SURFACE[surface];
  const preset = useQualityPreset();
  const wood = preset.maxTextureSize <= 512 ? WOOD_LOW : WOOD;
  const [map, normalMap, roughnessMap] = useTexture(
    wood,
    (loaded) => {
      loaded[0].colorSpace = SRGBColorSpace;
      prepare(loaded, [1.6, 0.75]);
    },
  );

  useSceneTextures(wood, [map, normalMap, roughnessMap], preset.maxTextureSize, preset.anisotropy);

  const geo = useDisposable(
    () => ({
      top: roundedSlab(DESK.width, DESK.thickness, DESK.depth, 0.02, 0.004),
      // rectangular steel tube profile (40 × 40 mm, rounded corners)
      post: extrudeFlat(roundedRectShape(0.04, 0.04, 0.005), DESK_TOP - DESK.thickness, { bevel: 0.0015 }),
      rail: roundedSlab(0.04, 0.03, DESK.depth - 0.08, 0.004, 0.0015),
      beam: roundedSlab(DESK.width - 0.2, 0.05, 0.02, 0.004, 0.0015),
      // apron round the top, 5 cm in from the edge, so the 22 mm top seems to float
      apronLong: roundedSlab(DESK.width - 0.1, 0.035, 0.02, 0.004, 0.0015),
      // cable tray under the back: a shallow open channel
      trayBottom: roundedSlab(TRAY.width, 0.004, TRAY.depth, 0.004, 0.001),
      trayLip: roundedSlab(TRAY.width, 0.05, 0.004, 0.002, 0.001),
      strip: roundedSlab(0.3, 0.038, 0.055, 0.008, 0.002),
    }),
    [],
  );

  const legX = DESK.width / 2 - 0.08;
  const postZ = DESK.depth / 2 - 0.06;
  const legHeight = DESK_TOP - DESK.thickness;

  return (
    <group>
      <mesh geometry={geo.top} position-y={DESK_TOP - DESK.thickness} castShadow receiveShadow renderOrder={BACKDROP_ORDER}>
        <meshStandardMaterial
          key={finish.useMap ? 'wood' : 'solid'}
          map={finish.useMap ? map : null}
          normalMap={normalMap}
          normalScale={[0.6, 0.6]}
          roughnessMap={roughnessMap}
          roughness={finish.roughness}
          color={finish.color}
          envMapIntensity={0.7}
        />
      </mesh>
      {[-legX, legX].map((x) => (
        <group key={x} position-x={x}>
          {[-postZ, postZ].map((z) => (
            <mesh key={z} geometry={geo.post} position={[0, 0, z]} castShadow receiveShadow>
              <meshStandardMaterial color="#141519" metalness={0.55} roughness={0.38} />
            </mesh>
          ))}
          {/* foot rail and top rail */}
          <mesh geometry={geo.rail} position={[0, 0, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#141519" metalness={0.55} roughness={0.38} />
          </mesh>
          <mesh geometry={geo.rail} position={[0, legHeight - 0.03, 0]} castShadow>
            <meshStandardMaterial color="#141519" metalness={0.55} roughness={0.38} />
          </mesh>
          {/* levelling feet */}
          {[-postZ, postZ].map((z) => (
            <mesh key={`f${z}`} position={[0, -0.002, z]}>
              <cylinderGeometry args={[0.018, 0.02, 0.008, 20]} />
              <meshStandardMaterial color="#0b0b0d" roughness={0.9} />
            </mesh>
          ))}
        </group>
      ))}
      {/* apron front and back, set in from the edge */}
      {[-1, 1].map((s) => (
        <mesh key={`apron${s}`} geometry={geo.apronLong} position={[0, legHeight - 0.035, s * (DESK.depth / 2 - 0.05)]} castShadow>
          <meshStandardMaterial color="#141519" metalness={0.55} roughness={0.38} />
        </mesh>
      ))}
      {/* cable tray with a power strip, under the back of the top */}
      <group position={[0.05, legHeight - 0.13, -DESK.depth / 2 + 0.1]}>
        <mesh geometry={geo.trayBottom} castShadow>
          <meshStandardMaterial color="#1b1d22" metalness={0.5} roughness={0.5} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={geo.trayLip} position={[0, 0.025, (s * TRAY.depth) / 2]} castShadow>
            <meshStandardMaterial color="#1b1d22" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        <mesh geometry={geo.strip} position={[0.2, 0.004, 0]}>
          <meshStandardMaterial color="#e9eaee" roughness={0.45} />
        </mesh>
      </group>
      {/* rear stretcher beam */}
      <mesh geometry={geo.beam} position={[0, legHeight - 0.12, -postZ]} castShadow>
        <meshStandardMaterial color="#141519" metalness={0.55} roughness={0.38} />
      </mesh>
    </group>
  );
}
