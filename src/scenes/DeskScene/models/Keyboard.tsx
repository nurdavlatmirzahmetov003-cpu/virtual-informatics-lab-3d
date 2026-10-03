/**
 * [PLACEHOLDER] Procedural TKL (87-key, ANSI) mechanical keyboard:
 * anodised aluminium top frame, sculpted keycaps per row (one InstancedMesh),
 * per-key RGB glow leaking between caps. Replace with an optimised GLB.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Matrix4, Quaternion, Vector3, type Group, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFlat, frameShape, keycapGeometry, roundedRectShape } from '@/lib/three/geometry';
import { brushedMetalTexture } from '@/lib/three/proceduralTextures';
import { KEYBOARD } from '../layout';
import { storyRig } from '../storyRig';

const U = 0.019; // 1 key unit (19.05 mm)
const CAP = { gap: 0.0013, height: 0.0105 };

type Key = { w: number; mod?: boolean; accent?: boolean } | { gap: number };
const k = (w = 1, mod = false, accent = false): Key => ({ w, mod, accent });
const gap = (g: number): Key => ({ gap: g });
const run = (n: number) => Array.from({ length: n }, () => k());

/** ANSI TKL layout in key units; rows top → bottom. */
const ROWS: Key[][] = [
  [k(1, true, true), gap(1), ...run(4), gap(0.5), ...run(4), gap(0.5), ...run(4), gap(0.25), k(1, true), k(1, true), k(1, true)],
  [...run(13), k(2, true), gap(0.25), k(1, true), k(1, true), k(1, true)],
  [k(1.5, true), ...run(12), k(1.5, true), gap(0.25), k(1, true), k(1, true), k(1, true)],
  [k(1.75, true), ...run(11), k(2.25, true, true)],
  [k(2.25, true), ...run(10), k(2.75, true), gap(1.25), k(1, true)],
  [k(1.25, true), k(1.25, true), k(1.25, true), k(6.25), k(1.25, true), k(1.25, true), k(1.25, true), k(1.25, true), gap(0.25), k(1, true), k(1, true), k(1, true)],
];
const ROW_GAP_AFTER_F = 0.25;
const WIDTH_U = 18.25;
const DEPTH_U = 6 + ROW_GAP_AFTER_F;
const MARGIN = 0.011;
const KEYBOARD_SIZE = { w: WIDTH_U * U + MARGIN * 2, d: DEPTH_U * U + MARGIN * 2 };
const CASE_H = 0.018;
/** Cherry-like sculpt: each row tilted a little differently. */
const ROW_TILT = [0.12, 0.1, 0.04, 0, -0.06, -0.08];

interface KeyInstance {
  x: number;
  z: number;
  w: number;
  row: number;
  mod: boolean;
  accent: boolean;
}

function layoutKeys(): KeyInstance[] {
  const keys: KeyInstance[] = [];
  ROWS.forEach((row, r) => {
    let x = 0;
    const zu = r + (r > 0 ? ROW_GAP_AFTER_F : 0);
    for (const key of row) {
      if ('gap' in key) {
        x += key.gap;
        continue;
      }
      keys.push({
        x: (x + key.w / 2 - WIDTH_U / 2) * U,
        z: (zu + 0.5 - DEPTH_U / 2) * U,
        w: key.w,
        row: r,
        mod: !!key.mod,
        accent: !!key.accent,
      });
      x += key.w;
    }
  });
  return keys;
}

export function Keyboard() {
  const group = useRef<Group>(null);
  const caps = useRef<InstancedMesh>(null);
  const keys = useMemo(() => layoutKeys(), []);

  const res = useDisposable(
    () => ({
      cap: keycapGeometry(),
      body: extrudeFlat(roundedRectShape(KEYBOARD_SIZE.w, KEYBOARD_SIZE.d, 0.009), CASE_H, { bevel: 0.003 }),
      frame: extrudeFlat(frameShape(KEYBOARD_SIZE.w, KEYBOARD_SIZE.d, 0.009, MARGIN - 0.002, 0.003), 0.006, { bevel: 0.0012 }),
      plate: extrudeFlat(roundedRectShape(KEYBOARD_SIZE.w - MARGIN * 2 - 0.002, KEYBOARD_SIZE.d - MARGIN * 2 - 0.002, 0.003), 0.0015, { bevel: 0 }),
      brushed: brushedMetalTexture([3, 1]),
    }),
    [],
  );

  useLayoutEffect(() => {
    const mesh = caps.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    const alpha = new Color('#25282e');
    const mod = new Color('#17191d');
    const accent = new Color('#c7ccd4');
    keys.forEach((key, i) => {
      p.set(key.x, CASE_H + 0.0035, key.z);
      q.setFromAxisAngle(new Vector3(1, 0, 0), ROW_TILT[key.row]);
      s.set(key.w * U - CAP.gap, CAP.height, U - CAP.gap);
      mesh.setMatrixAt(i, m.compose(p, q, s));
      mesh.setColorAt(i, key.accent ? accent : key.mod ? mod : alpha);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [keys]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.position.y = KEYBOARD.position[1] + storyRig.keyboardLift;
    g.rotation.x = 0.045 + storyRig.keyboardTilt; // typing angle (back raised)
  });

  return (
    <group ref={group} position={[...KEYBOARD.position]}>
      {/* plastic bottom shell */}
      <mesh geometry={res.body} castShadow receiveShadow>
        <meshStandardMaterial color="#111216" roughness={0.6} metalness={0.1} />
      </mesh>
      {/* anodised aluminium top frame */}
      <mesh geometry={res.frame} position-y={CASE_H - 0.001} castShadow>
        <meshStandardMaterial
          color="#2b2e34"
          metalness={0.9}
          roughness={0.3}
          roughnessMap={res.brushed}
          bumpMap={res.brushed}
          bumpScale={0.1}
        />
      </mesh>
      {/* switch plate with per-key RGB glow showing through the gaps */}
      <mesh geometry={res.plate} position-y={CASE_H}>
        <meshStandardMaterial color="#05070a" emissive="#2fc8ff" emissiveIntensity={0.16} roughness={0.5} />
      </mesh>
      <instancedMesh ref={caps} args={[res.cap, undefined, keys.length]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.62} metalness={0} envMapIntensity={0.5} />
      </instancedMesh>
    </group>
  );
}
