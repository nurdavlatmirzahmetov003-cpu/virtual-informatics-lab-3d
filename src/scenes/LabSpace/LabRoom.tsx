/**
 * The hall: polished concrete floor, three walls (the +Z side is open, a
 * cut-away), a gradient light band running round the walls, slim pendant
 * light bars above the zones and acoustic panels behind the workstation.
 * Everything is procedural and shared (instancing), so the room costs a few
 * draw calls and no downloads beyond the floor maps the home page uses.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { CanvasTexture, Matrix4, RepeatWrapping, SRGBColorSpace, type InstancedMesh } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useScenePalette, useTheme } from '@/hooks/useTheme';
import { useDisposable } from '@/hooks/useDisposable';
import { useSceneTextures } from '@/lib/three/modelAssets';
import { LAB_HALL, LAB_ZONES } from '@/data/lab/zones';

const TEX = `${import.meta.env.BASE_URL}assets/textures/`;
/** Only the roughness map: the floor colour is flat (no download of the diffuse map). */
const FLOOR = [`${TEX}floor_rough.webp`];
const FLOOR_LOW = FLOOR.map((u) => u.replace(/\.(\w+)$/, '_512.$1'));

const { minX, maxX, minZ, maxZ, height: H } = LAB_HALL;
const WIDTH = maxX - minX;
const DEPTH = maxZ - minZ;
const BAND_Y = 3.25;
const SLATS = { count: 60, width: 0.034, pitch: 0.058, height: 2.6, depth: 0.022 };

/** Cyan → violet → magenta, the site's accent gradient, as a light strip texture. */
function bandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, '#38d6f5');
    g.addColorStop(0.5, '#8b5cf6');
    g.addColorStop(1, '#e879f9');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 2);
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export function LabRoom() {
  const preset = useQualityPreset();
  const palette = useScenePalette();
  const theme = useTheme();
  const light = theme === 'light';
  const floor = preset.maxTextureSize <= 512 ? FLOOR_LOW : FLOOR;
  const [roughnessMap] = useTexture(floor, (loaded) => {
    loaded.forEach((t) => {
      t.wrapS = t.wrapT = RepeatWrapping;
      t.repeat.set(16, 16);
    });
  });
  useSceneTextures(floor, [roughnessMap], preset.maxTextureSize, preset.anisotropy);
  const band = useDisposable(() => bandTexture(), []);

  const slats = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = slats.current;
    if (!mesh) return;
    const m = new Matrix4();
    const span = (SLATS.count - 1) * SLATS.pitch;
    for (let i = 0; i < SLATS.count; i++) {
      m.makeTranslation(-span / 2 + i * SLATS.pitch, 0.25 + SLATS.height / 2, minZ + 0.03 + SLATS.depth / 2);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, []);

  // pendant light bars: one above every zone, instanced
  const bars = useRef<InstancedMesh>(null);
  const barMatrices = useMemo(
    () =>
      LAB_ZONES.map((z) => {
        const yaw = Math.atan2(z.facing[0], z.facing[1]);
        return new Matrix4().makeRotationY(yaw).setPosition(z.center[0], H - 0.5, z.center[1]);
      }),
    [],
  );
  useLayoutEffect(() => {
    const mesh = bars.current;
    if (!mesh) return;
    barMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [barMatrices]);

  // the lab hall is brighter than the home studio: a gallery-like interior in both themes
  const wallColor = light ? '#e8ecf3' : '#2a3350';
  const floorTint = light ? '#aab3c1' : '#7a8294';
  const trim = light ? '#c6cedc' : '#161c2e';

  return (
    <group>
      {/* floor: the hall plus an apron in front of the open side */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (minZ + maxZ) / 2 + 3]} receiveShadow>
        <planeGeometry args={[WIDTH + 8, DEPTH + 12]} />
        {/* polished resin floor: flat colour, the concrete roughness map only breaks up reflections */}
        <meshStandardMaterial roughnessMap={roughnessMap} roughness={0.85} color={floorTint} metalness={0.05} envMapIntensity={0.55} />
      </mesh>

      {/* walls */}
      <mesh position={[0, H / 2, minZ]} receiveShadow>
        <planeGeometry args={[WIDTH, H]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh position={[minX, H / 2, (minZ + maxZ) / 2]} rotation-y={Math.PI / 2} receiveShadow>
        <planeGeometry args={[DEPTH, H]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh position={[maxX, H / 2, (minZ + maxZ) / 2]} rotation-y={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[DEPTH, H]} />
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>

      {/* skirting and top trim */}
      {[0.06, H - 0.05].map((y) => (
        <group key={y}>
          <mesh position={[0, y, minZ + 0.01]}>
            <boxGeometry args={[WIDTH, y < 1 ? 0.12 : 0.1, 0.02]} />
            <meshStandardMaterial color={trim} roughness={0.6} />
          </mesh>
          <mesh position={[minX + 0.01, y, (minZ + maxZ) / 2]}>
            <boxGeometry args={[0.02, y < 1 ? 0.12 : 0.1, DEPTH]} />
            <meshStandardMaterial color={trim} roughness={0.6} />
          </mesh>
          <mesh position={[maxX - 0.01, y, (minZ + maxZ) / 2]}>
            <boxGeometry args={[0.02, y < 1 ? 0.12 : 0.1, DEPTH]} />
            <meshStandardMaterial color={trim} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* gradient light band round the walls */}
      <mesh position={[0, BAND_Y, minZ + 0.02]}>
        <planeGeometry args={[WIDTH, 0.06]} />
        <meshBasicMaterial map={band} toneMapped={false} />
      </mesh>
      <mesh position={[minX + 0.02, BAND_Y, (minZ + maxZ) / 2]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[DEPTH, 0.06]} />
        <meshBasicMaterial map={band} toneMapped={false} />
      </mesh>
      <mesh position={[maxX - 0.02, BAND_Y, (minZ + maxZ) / 2]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[DEPTH, 0.06]} />
        <meshBasicMaterial map={band} toneMapped={false} />
      </mesh>

      {/* oak acoustic slats behind the workstation */}
      <mesh position={[0, 0.25 + SLATS.height / 2, minZ + 0.012]} receiveShadow>
        <boxGeometry args={[SLATS.count * SLATS.pitch + 0.06, SLATS.height + 0.04, 0.012]} />
        <meshStandardMaterial color={palette.wallPanel} roughness={1} />
      </mesh>
      <instancedMesh ref={slats} args={[undefined, undefined, SLATS.count]} castShadow receiveShadow>
        <boxGeometry args={[SLATS.width, SLATS.height, SLATS.depth]} />
        <meshStandardMaterial color={palette.slats} roughness={0.7} envMapIntensity={0.4} />
      </instancedMesh>

      {/* pendant light bars */}
      <instancedMesh ref={bars} args={[undefined, undefined, barMatrices.length]}>
        <boxGeometry args={[2.4, 0.03, 0.12]} />
        <meshStandardMaterial color="#0d0f14" emissive={light ? '#ffffff' : '#e8f6ff'} emissiveIntensity={light ? 1.2 : 1.8} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
