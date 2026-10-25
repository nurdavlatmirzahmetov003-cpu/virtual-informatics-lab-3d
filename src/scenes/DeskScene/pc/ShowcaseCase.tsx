/**
 * The V4 cases built from caseDesigns.ts (V4 §1.1): their model with real
 * glass and animated ARGB, the fans at every mount (three draw calls for all
 * of them: frames, light rings, rotors turned in the shader), slot covers for
 * the free expansion slots, and a soft interior glow (point lights from
 * Medium up; Low relies on the emissive rings alone).
 */
import { useCallback, useContext, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, Color, Matrix4, MeshStandardMaterial, Quaternion, Vector3, type Mesh, type Object3D, type PointLight } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ModelLoader } from '@/components/3d/ModelLoader';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useDisposable } from '@/hooks/useDisposable';
import { useModelFile } from '@/lib/three/modelAssets';
import { modelLevels } from '@/lib/three/modelUrls';
import type { HardwareItem } from '@/data/hardware/types';
import { DESIGN_BY_ID, SLOTS } from './caseDesigns';
import type { CaseMounts, FanMount } from './caseMounts';
import type { Installed, Vec3 } from './mounts';
import { pcRig } from './pcRig';
import { ShowcaseCables } from './ShowcaseCables';
import { applyShowcaseMaterials, bakeCopies, fanModelOf, glassMaterial, paletteAt, RgbFxContext, spinningMaterial, spinUniform } from './showcaseFx';

const MODELS = `${import.meta.env.BASE_URL}assets/models/`;
const FAN_AIR = new Vector3(0, 0, -1);
const smooth = (x: number) => x * x * (3 - 2 * x);

/** Advances the shared ARGB / rotor clock once per frame (mount once per scene with showcase hardware). */
export function ShowcaseClock() {
  const reduced = useReducedMotion();
  const fx = useContext(RgbFxContext);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // reduced motion: colours stay put and fans stand still
    if (!reduced) {
      fx.uniforms.uTime.value += dt;
      spinUniform.value -= dt * 9 * pcRig.fanSpeed;
    }
  });
  return null;
}

/** Fans of one model at `fans` (case-local), relative to `origin`: merged into three meshes. */
export function FanArray({ fans, origin = [0, 0, 0], model }: { fans: readonly FanMount[]; origin?: Vec3; model: string }) {
  const preset = useQualityPreset();
  const fx = useContext(RgbFxContext);
  const gltf = useModelFile(modelLevels(model, preset.lodBias).near);
  const meshes = useMemo(() => {
    if (!fans.length) return [];
    const placements = fans.map((f, i) => ({
      matrix: new Matrix4().compose(new Vector3(f.p[0] - origin[0], f.p[1] - origin[1], f.p[2] - origin[2]), new Quaternion().setFromUnitVectors(FAN_AIR, new Vector3(...f.n).normalize()), new Vector3().setScalar(f.size / 0.12)),
      phase: i * 0.71,
    }));
    const isRotor = (m: Mesh) => m.name === 'rotor' || (m.parent?.name === 'rotor' && m.name !== 'rotor_light');
    const rgb = (m: Mesh) => (Array.isArray(m.material) ? m.material[0] : m.material).name === 'RGB';
    const statics = bakeCopies(gltf.scene, placements, (m) => !isRotor(m) || rgb(m));
    const rotors = bakeCopies(gltf.scene, placements, (m) => isRotor(m) && !rgb(m), true);
    return [
      ...statics.map(({ material, geometry }) => ({ geometry, material: material.name === 'RGB' ? fx.material : material, shadow: material.name !== 'RGB' })),
      ...rotors.map(({ material, geometry }) => ({ geometry, material: spinningMaterial(material, fx), shadow: false })),
    ];
  }, [gltf, fans, origin, fx]);
  useDisposable(() => ({ dispose: () => meshes.forEach((m) => m.geometry.dispose()) }), [meshes]);
  return (
    <>
      {meshes.map((m, i) => (
        <mesh key={i} geometry={m.geometry} material={m.material} castShadow={m.shadow} receiveShadow frustumCulled={false} />
      ))}
    </>
  );
}


/** Covers for every expansion slot the graphics card does not use. */
function SlotCovers({ mounts, inst, color }: { mounts: CaseMounts; inst: Installed; color: string }) {
  const geometry = useMemo(() => {
    const c = mounts.board.corner;
    const z = mounts.main.min[2];
    const gpu = inst.gpu;
    const parts = [];
    for (let k = 0; k < mounts.slots.count; k++) {
      const y = c[1] - SLOTS.firstBelowCorner - k * SLOTS.pitch;
      if (gpu && y + 0.009 > gpu.p[1] - gpu.size[1] / 2 && y - 0.009 < gpu.p[1] + gpu.size[1] / 2) continue;
      const g = new BoxGeometry(SLOTS.x[1] - SLOTS.x[0], 0.0184, 0.003);
      g.translate(c[0] + (SLOTS.x[0] + SLOTS.x[1]) / 2, y, z - 0.002);
      parts.push(g);
    }
    return parts.length ? mergeGeometries(parts, false) : null;
  }, [mounts, inst.gpu]);
  const material = useDisposable(() => new MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 }), [color]);
  useDisposable(() => ({ dispose: () => geometry?.dispose() }), [geometry]);
  return geometry ? <mesh geometry={geometry} material={material} castShadow receiveShadow /> : null;
}

/** Soft coloured glow inside the case: one light on Medium, all of them from High up, none on Low. */
function CaseLights({ mounts }: { mounts: CaseMounts }) {
  const preset = useQualityPreset();
  const count = preset.level === 'low' ? 0 : preset.level === 'medium' ? 1 : mounts.lights?.length ?? 0;
  const lights = useRef<Array<PointLight | null>>([]);
  const colour = useMemo(() => new Color(), []);
  const fx = useContext(RgbFxContext);
  useFrame(() => {
    for (const [i, l] of lights.current.entries()) {
      if (!l) continue;
      l.color.copy(paletteAt(fx, fx.uniforms.uTime.value * 0.06 + i * 0.33, colour));
      l.intensity = 1.1 * fx.uniforms.uPower.value * pcRig.glow;
      l.visible = l.intensity > 0.003;
    }
  });
  return (
    <>
      {(mounts.lights ?? []).slice(0, count).map((p, i) => (
        <pointLight key={i} ref={(l) => void (lights.current[i] = l)} position={[...p]} distance={0.5} decay={2} intensity={0} />
      ))}
    </>
  );
}

/** A case from caseDesigns.ts: model, exhaust fans, slot covers, interior glow; the side glass slides off with pcRig.glassOpen. */
export function DesignedCase({ product, mounts, inst }: { product: HardwareItem; mounts: CaseMounts; inst: Installed }) {
  const design = DESIGN_BY_ID[mounts.id];
  const preset = useQualityPreset();
  const fx = useContext(RgbFxContext);
  const panes = useRef<Object3D[]>([]);
  const onLoaded = useCallback(
    (root: Object3D) => {
      applyShowcaseMaterials(root, fx, () => glassMaterial(design.colors.glassTint, preset.transmission));
      const list: Object3D[] = [];
      root.traverse((o) => {
        if (o.name === 'glass_side') list.push(o);
        if (o.name === 'glass_side') o.userData.home = o.position.clone();
      });
      panes.current = list;
    },
    [design, preset.transmission, fx],
  );
  useFrame(() => {
    // the side glass comes out 5 cm, then lifts away
    const g = pcRig.glassOpen;
    const out = smooth(Math.min(1, g / 0.35));
    const lift = smooth(Math.max(0, (g - 0.35) / 0.65));
    for (const p of panes.current) {
      const home = p.userData.home as Vector3;
      p.position.set(home.x - 0.05 * out, home.y + lift * 0.62, home.z);
      p.visible = g < 0.995;
    }
  });
  // exhaust fans belong to the case; the radiator takes the top ones when the build has an AIO
  const exhaust = useMemo(() => inst.fans.filter((f) => f.group === 'rear' || f.group === 'top'), [inst.fans]);
  return (
    <group>
      <ModelLoader key={product.id} url={`${MODELS}${product.modelPath}`} onLoaded={onLoaded} />
      <FanArray fans={exhaust} model={fanModelOf(design)} />
      <SlotCovers mounts={mounts} inst={inst} color={design.colors.trim} />
      <CaseLights mounts={mounts} />
      <ShowcaseCables inst={inst} />
    </group>
  );
}
