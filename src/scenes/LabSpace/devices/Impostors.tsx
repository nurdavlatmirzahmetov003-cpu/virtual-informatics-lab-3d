/**
 * Overview impostors (0.37): from the hall overview every device shows as a
 * picture of itself — a tile of the atlas made by scripts/make-impostors.mjs
 * from the real models — standing upright on its spot and turning about the
 * vertical axis to face the camera. One instanced mesh (one draw call) per
 * table, on every quality preset, and no model file loads until a zone opens.
 */
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { InstancedBufferAttribute, Matrix4, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Color, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useTheme } from '@/hooks/useTheme';
import sheet from '@/data/lab/impostors.json';
import { overviewScale } from './impostorGrid';

const ATLAS = `${import.meta.env.BASE_URL}assets/textures/lab-impostors.webp`;
type Tile = { col: number; row: number; w: number; h: number; base: number };
const TILES = sheet.items as Record<string, Tile>;

export interface ImpostorItem {
  id: string;
  /** Base of the device in the parent's space (m). */
  at: readonly [number, number, number];
  /**
   * Width of the device's slot on the table (m). Given: the picture grows
   * (seen from across the hall a 3 cm card is a few pixels) up to the slot,
   * so neighbours never overlap. Omitted: true size.
   */
  slot?: number;
}

const vertexShader = /* glsl */ `
  attribute vec4 aRect;
  attribute vec3 aSize;
  varying vec2 vUv;
  void main() {
    vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCam = cameraPosition - c;
    toCam.y = 0.0;
    toCam = normalize(toCam + vec3(1e-5, 0.0, 0.0));
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
    vec3 p = c + right * (position.x * aSize.x) + vec3(0.0, (position.y + 0.5 - aSize.z) * aSize.y, 0.0);
    vUv = aRect.xy + uv * aRect.zw;
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 tint;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(map, vUv);
    if (c.a < 0.5) discard;
    gl_FragColor = vec4(c.rgb * tint, 1.0);
    #include <colorspace_fragment>
  }
`;

/** The devices of one table (or one spot) as impostors: a single draw call. */
export function Impostors({ items }: { items: readonly ImpostorItem[] }) {
  const map = useTexture(ATLAS, (t) => {
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
  });
  const dark = useTheme() === 'dark';
  const shown = useMemo(() => items.filter((it) => TILES[it.id]), [items]);
  const mesh = useRef<InstancedMesh>(null);
  const res = useDisposable(() => {
    const geometry = new PlaneGeometry(1, 1);
    const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms: { map: { value: null }, tint: { value: new Color(1, 1, 1) } } });
    return { geometry, material };
  }, []);
  res.material.uniforms.map.value = map;
  // the pictures were lit for a bright room: a little dimmer in the night lab
  (res.material.uniforms.tint.value as Color).setScalar(dark ? 0.82 : 1);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const rect = new Float32Array(shown.length * 4);
    const size = new Float32Array(shown.length * 3);
    const mat = new Matrix4();
    shown.forEach((it, i) => {
      const t = TILES[it.id];
      rect.set([t.col / sheet.cols, 1 - (t.row + 1) / sheet.rows, 1 / sheet.cols, 1 / sheet.rows], i * 4);
      const k = overviewScale(t.w, t.h, it.slot);
      size.set([t.w * k, t.h * k, t.base], i * 3);
      m.setMatrixAt(i, mat.makeTranslation(it.at[0], it.at[1], it.at[2]));
    });
    res.geometry.setAttribute('aRect', new InstancedBufferAttribute(rect, 4));
    res.geometry.setAttribute('aSize', new InstancedBufferAttribute(size, 3));
    m.count = shown.length;
    m.instanceMatrix.needsUpdate = true;
  }, [shown, res.geometry]);

  if (!shown.length) return null;
  return (
    <instancedMesh
      ref={mesh}
      args={[res.geometry, res.material, shown.length]}
      frustumCulled={false}
      // pictures do not take clicks: the zone platform and the device pads do
      raycast={() => undefined}
    />
  );
}

const AT_BASE = [0, 0, 0] as const;

/** One device's impostor on its own spot (a pad, a pedestal). */
export function Spot({ id }: { id: string }) {
  const items = useMemo(() => [{ id, at: AT_BASE }], [id]);
  return (
    <Suspense fallback={null}>
      <Impostors items={items} />
    </Suspense>
  );
}
