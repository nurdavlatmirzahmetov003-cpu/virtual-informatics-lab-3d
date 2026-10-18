/**
 * The hall: polished concrete floor, three walls (the +Z side is open, a
 * cut-away), a gradient light band running round the walls, slim pendant
 * light bars above the zones and acoustic panels behind the workstation.
 * Everything is procedural and shared (instancing), so the room costs a few
 * draw calls and no downloads beyond the floor maps the home page uses.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { BoxGeometry, CanvasTexture, Matrix4, PlaneGeometry, RepeatWrapping, SRGBColorSpace, type InstancedMesh } from 'three';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useScenePalette, useTheme } from '@/hooks/useTheme';
import { useDisposable } from '@/hooks/useDisposable';
import { useSceneTextures } from '@/lib/three/modelAssets';
import { LAB_HALL, LAB_ZONES } from '@/data/lab/zones';
import { mergePieces, type Piece } from './classroom/mergeParts';

const TEX = `${import.meta.env.BASE_URL}assets/textures/`;
/** Only the roughness map: the floor colour is flat (no download of the diffuse map). */
const FLOOR = [`${TEX}floor_rough.webp`];
const FLOOR_LOW = FLOOR.map((u) => u.replace(/\.(\w+)$/, '_512.$1'));

const { minX, maxX, minZ, maxZ, height: H } = LAB_HALL;
const WIDTH = maxX - minX;
const DEPTH = maxZ - minZ;
const BAND_Y = 3.25;
const SLATS = { count: 60, width: 0.034, pitch: 0.058, height: 2.6, depth: 0.022 };
const MID_Z = (minZ + maxZ) / 2;
const LEFT = [0, Math.PI / 2, 0] as const;
const RIGHT = [0, -Math.PI / 2, 0] as const;

/**
 * The three walls, their skirting and top trim, and the light band — each
 * set merged into one mesh (3 draw calls instead of 12; V2-12 perf).
 */
function shellGeometry() {
  const walls: Piece[] = [
    { geo: new PlaneGeometry(WIDTH, H), at: [0, H / 2, minZ] },
    { geo: new PlaneGeometry(DEPTH, H), at: [minX, H / 2, MID_Z], rot: LEFT },
    { geo: new PlaneGeometry(DEPTH, H), at: [maxX, H / 2, MID_Z], rot: RIGHT },
  ];
  const trim: Piece[] = [0.06, H - 0.05].flatMap((y) => {
    const t = y < 1 ? 0.12 : 0.1;
    return [
      { geo: new BoxGeometry(WIDTH, t, 0.02), at: [0, y, minZ + 0.01] as const },
      { geo: new BoxGeometry(0.02, t, DEPTH), at: [minX + 0.01, y, MID_Z] as const },
      { geo: new BoxGeometry(0.02, t, DEPTH), at: [maxX - 0.01, y, MID_Z] as const },
    ];
  });
  const band: Piece[] = [
    { geo: new PlaneGeometry(WIDTH, 0.06), at: [0, BAND_Y, minZ + 0.02] },
    { geo: new PlaneGeometry(DEPTH, 0.06), at: [minX + 0.02, BAND_Y, MID_Z], rot: LEFT },
    { geo: new PlaneGeometry(DEPTH, 0.06), at: [maxX - 0.02, BAND_Y, MID_Z], rot: RIGHT },
  ];
  return { walls: mergePieces(walls), trim: mergePieces(trim), band: mergePieces(band) };
}

/** Sky → periwinkle → orchid → coral, the site's accent gradient, as a light strip texture. */
function bandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, '#3fd2f6');
    g.addColorStop(0.35, '#6f8cff');
    g.addColorStop(0.7, '#b77cff');
    g.addColorStop(1, '#ff8a7a');
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
  const shell = useDisposable(shellGeometry, []);

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
  const wallColor = light ? '#e4ebf8' : '#333d66';
  const floorTint = light ? '#a9b4ca' : '#848ca3';
  const trim = light ? '#cdd5e4' : '#1f2747';

  return (
    <group>
      {/* floor: the hall plus an apron in front of the open side */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (minZ + maxZ) / 2 + 3]} receiveShadow>
        <planeGeometry args={[WIDTH + 8, DEPTH + 12]} />
        {/* polished resin floor: flat colour, the concrete roughness map only breaks up reflections */}
        <meshStandardMaterial roughnessMap={roughnessMap} roughness={0.85} color={floorTint} metalness={0.05} envMapIntensity={0.55} />
      </mesh>

      {/* walls, skirting and top trim, the gradient light band round the walls */}
      <mesh geometry={shell.walls} receiveShadow>
        <meshStandardMaterial color={wallColor} roughness={0.92} />
      </mesh>
      <mesh geometry={shell.trim}>
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      <mesh geometry={shell.band}>
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
