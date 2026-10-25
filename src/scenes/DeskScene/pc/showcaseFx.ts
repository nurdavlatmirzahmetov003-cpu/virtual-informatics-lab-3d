/**
 * Runtime looks of the V4 showcase hardware (V4 §1.1): the animated ARGB
 * shader every `RGB` material is swapped for, the tempered glass every `Glass`
 * material is swapped for, and spinning rotors without per-frame matrix
 * uploads (the blades turn in the vertex shader). Shared uniforms: one write
 * per frame drives every fan, ring and light bar on screen.
 */
import { createContext } from 'react';
import { BufferAttribute, BufferGeometry, Color, DoubleSide, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial, Vector3, type Material, type Mesh, type Object3D } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Pink → blue → violet, like the reference build's soft lighting. */
export const RGB_PALETTE = ['#ff5fd2', '#4f86ff', '#9b5cff'] as const;

function makeUniforms() {
  return {
    uTime: { value: 0 },
    /** 0 off … 1 full (power-on, RGB step of the assembly). */
    uPower: { value: 1 },
    /** 0: the palette flows; 1: one solid colour (the Setup Studio RGB choice). */
    uSolid: { value: 0 },
    uColor: { value: new Color('#38d6f5') },
    uA: { value: new Color(RGB_PALETTE[0]) },
    uB: { value: new Color(RGB_PALETTE[1]) },
    uC: { value: new Color(RGB_PALETTE[2]) },
    uBoost: { value: 2.2 },
  };
}

/** Angle of every rotor (radians); advanced once per frame by <ShowcaseClock>. */
export const spinUniform = { value: 0 };

/**
 * The ARGB state of one system unit on screen: its uniforms and the unlit
 * emissive material every `RGB` surface of it uses. Each <PCCase> owns one
 * (the home page shows two PCs, a Setup Studio look may switch its RGB off).
 * u (0…1 around a ring / along a bar) picks the colour, which flows with time.
 */
export function createRgbFx() {
  const uniforms = makeUniforms();
  const material = new ShaderMaterial({
    name: 'RGB',
    uniforms,
    toneMapped: false,
    side: DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uPower, uSolid, uBoost;
      uniform vec3 uColor, uA, uB, uC;
      varying vec2 vUv;
      varying vec3 vWorld;
      vec3 palette(float t) {
        t = fract(t) * 3.0;
        return t < 1.0 ? mix(uA, uB, t) : t < 2.0 ? mix(uB, uC, t - 1.0) : mix(uC, uA, t - 2.0);
      }
      void main() {
        float t = vUv.x + uTime * 0.06 + (vWorld.y * 1.6 + vWorld.z * 0.9);
        vec3 c = mix(palette(t), uColor, uSolid);
        gl_FragColor = vec4(c * uBoost * uPower + c * 0.06, 1.0);
      }`,
  });
  material.userData.shared = true;
  return { uniforms, material };
}
export type RgbFx = ReturnType<typeof createRgbFx>;

/** The RGB state of the system unit being drawn (provided by <PCCase>; a default for parts drawn on their own). */
export const RgbFxContext = createContext<RgbFx>(createRgbFx());

/** One colour of the case lights in the frame (for point lights): palette position `t`. */
export function paletteAt(fx: RgbFx, t: number, out = new Color()) {
  const u = fx.uniforms;
  if (u.uSolid.value > 0.5) return out.copy(u.uColor.value);
  const x = (((t % 1) + 1) % 1) * 3;
  const [a, b, c] = [u.uA.value, u.uB.value, u.uC.value];
  return x < 1 ? out.copy(a).lerp(b, x) : x < 2 ? out.copy(b).lerp(c, x - 1) : out.copy(c).lerp(a, x - 2);
}

/** Tempered glass: real transmission where the preset allows it, otherwise a reflective smoked pane. */
export function glassMaterial(tint: string, transmission: boolean): Material {
  const m = transmission
    ? // clear float glass: a faint reflection of the room and a slight green-grey at the edges, nothing milky
      new MeshPhysicalMaterial({ color: tint, transmission: 1, thickness: 0.004, roughness: 0, ior: 1.52, metalness: 0, specularIntensity: 0.55, attenuationColor: '#e3ece8', attenuationDistance: 1.6, envMapIntensity: 0.55 })
    : new MeshPhysicalMaterial({ color: '#dfe6ee', transparent: true, opacity: 0.09, roughness: 0.04, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.04, envMapIntensity: 0.7, depthWrite: false });
  m.name = 'Glass';
  return m;
}

/** Swaps the `RGB` and `Glass` materials of a loaded model; returns its rotor nodes. */
export function applyShowcaseMaterials(root: Object3D, fx: RgbFx, glass: (old: Material) => Material) {
  const rotors: Object3D[] = [];
  root.traverse((o) => {
    if (/^rotor(_\d+)?$/.test(o.name)) rotors.push(o);
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const swap = (m: Material) => (m.name === 'RGB' ? fx.material : m.name === 'Glass' ? glass(m) : m);
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    if (mesh.material instanceof ShaderMaterial) mesh.castShadow = false;
    if ((mesh.material as Material).name === 'Glass') {
      mesh.castShadow = false;
      mesh.renderOrder = 2;
    }
  });
  return rotors;
}

/** A geometry with plain float attributes (meshopt / quantised files store normalised integers). */
function floatCopy(src: BufferGeometry): BufferGeometry {
  const g = new BufferGeometry();
  for (const name of ['position', 'normal', 'uv'] as const) {
    const a = src.getAttribute(name);
    if (!a) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
    g.setAttribute(name, new BufferAttribute(out, a.itemSize));
  }
  if (!g.getAttribute('uv')) g.setAttribute('uv', new BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
  if (src.index) g.setIndex(Array.from(src.index.array));
  return g;
}

export interface Placed {
  matrix: Matrix4;
  /** Spinning parts only: the axis through the pivot, in the placed frame, and a phase. */
  phase?: number;
}

/**
 * Bakes every mesh of `source` whose name passes `pick` into one geometry
 * per material name, once per placement. `spin`: also writes the pivot / axis
 * attributes the rotor shader turns the blades with (the node's own origin
 * and its local Z).
 */
export function bakeCopies(source: Object3D, placements: readonly Placed[], pick: (mesh: Mesh) => boolean, spin = false) {
  source.updateMatrixWorld(true);
  const rootInv = new Matrix4().copy(source.matrixWorld).invert();
  const byMaterial = new Map<string, { material: Material; parts: BufferGeometry[] }>();
  const meshes: Mesh[] = [];
  source.traverse((o) => {
    const m = o as Mesh;
    if (m.isMesh && pick(m)) meshes.push(m);
  });
  const local = new Matrix4();
  const pivot = new Vector3();
  const axis = new Vector3();
  for (const mesh of meshes) {
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as Material;
    // the rotor node (the mesh or its parent) defines pivot and axis
    const rotorNode = /^rotor/.test(mesh.name) ? mesh : mesh.parent && /^rotor/.test(mesh.parent.name) ? mesh.parent : mesh;
    for (const pl of placements) {
      local.multiplyMatrices(rootInv, mesh.matrixWorld).premultiply(pl.matrix);
      const g = floatCopy(mesh.geometry).applyMatrix4(local);
      if (spin) {
        const nodeM = new Matrix4().multiplyMatrices(rootInv, rotorNode.matrixWorld).premultiply(pl.matrix);
        pivot.setFromMatrixPosition(nodeM);
        axis.set(0, 0, 1).transformDirection(nodeM);
        const n = g.getAttribute('position').count;
        const pv = new Float32Array(n * 3);
        const ax = new Float32Array(n * 3);
        const ph = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          pv.set([pivot.x, pivot.y, pivot.z], i * 3);
          ax.set([axis.x, axis.y, axis.z], i * 3);
          ph[i] = pl.phase ?? 0;
        }
        g.setAttribute('aPivot', new BufferAttribute(pv, 3));
        g.setAttribute('aAxis', new BufferAttribute(ax, 3));
        g.setAttribute('aPhase', new BufferAttribute(ph, 1));
      }
      const key = material.name || material.uuid;
      if (!byMaterial.has(key)) byMaterial.set(key, { material, parts: [] });
      byMaterial.get(key)!.parts.push(g);
    }
  }
  return [...byMaterial.values()].map(({ material, parts }) => ({ material, geometry: mergeGeometries(parts, false)! }));
}

/** Copy of `material` whose vertices turn about their aPivot / aAxis by the shared spin angle. */
export function spinningMaterial(material: Material, fx: RgbFx): Material {
  const m = material.clone() as MeshStandardMaterial;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSpin = spinUniform;
    Object.assign(shader.uniforms, fx.uniforms);
    // translucent blades catch the ring light: a faint tint of the flowing palette
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime, uPower, uSolid;
        uniform vec3 uColor, uA, uB, uC;
        varying vec3 vSpinWorld;
        vec3 bladePalette(float t) { t = fract(t) * 3.0; return t < 1.0 ? mix(uA, uB, t) : t < 2.0 ? mix(uB, uC, t - 1.0) : mix(uC, uA, t - 2.0); }`,
      )
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        totalEmissiveRadiance += mix(bladePalette(uTime * 0.06 + vSpinWorld.y * 1.6 + vSpinWorld.z * 0.9), uColor, uSolid) * 0.22 * uPower;`);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 aPivot;
        attribute vec3 aAxis;
        attribute float aPhase;
        uniform float uSpin;
        varying vec3 vSpinWorld;
        vec3 spinAbout(vec3 v, vec3 k, float a) { return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1.0 - cos(a)); }`,
      )
      .replace('#include <beginnormal_vertex>', `vec3 objectNormal = spinAbout(vec3(normal), aAxis, uSpin + aPhase);`)
      .replace('#include <begin_vertex>', `vec3 transformed = aPivot + spinAbout(position - aPivot, aAxis, uSpin + aPhase);
        vSpinWorld = (modelMatrix * vec4(aPivot, 1.0)).xyz;`);
  };
  m.customProgramCacheKey = () => 'spinning-rotor';
  // the uniforms are this unit's: each compiled program binds its own objects
  m.userData.fx = fx;
  return m;
}

/** Fan model of a case design (white or black frames). */
export const fanModelOf = (design: { fanModel: string }) => `${import.meta.env.BASE_URL}assets/models/products/${design.fanModel}.glb`;
