/**
 * White sleeved power cables of the showcase build (V4 §1.1): the 24-pin, the
 * CPU EPS 8-pin and the card's 12V-2×6, each a flat bundle of single sleeved
 * wires from its header to a tray grommet, held by cable combs. Paths are
 * built from the mounting system's ports and the case's grommets, so they
 * follow the parts in every case design. One merged mesh for all wires, one
 * for the plugs and combs.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, CatmullRomCurve3, Matrix4, Quaternion, TubeGeometry, Vector3, type BufferGeometry, type Group } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useDisposable } from '@/hooks/useDisposable';
import { fabricTexture } from '@/lib/three/proceduralTextures';
import type { Installed, Vec3 } from './mounts';
import { pcRig } from './pcRig';

const WIRE = 0.0019;
const v = (a: readonly number[]) => new Vector3(a[0], a[1], a[2]);

interface Bundle {
  /** Centre line from the plug to the grommet. */
  path: Vector3[];
  /** Wire grid at the plug: columns along `across`, rows along `depth`. */
  cols: number;
  rows: number;
  across: Vector3;
  depth: Vector3;
  plug: { at: Vector3; size: Vector3 };
}

function bundles(inst: Installed): Bundle[] {
  const m = inst.mounts;
  const out: Bundle[] = [];
  const tray = m.main.max[0];
  const { atx24, eps8, gpuPower } = inst.ports;
  const holes = m.cableHoles;
  if (atx24 && holes.atx24) {
    const s = v(atx24);
    const h = v(holes.atx24);
    out.push({
      path: [s.clone().add(new Vector3(-0.012, 0, 0)), s.clone().add(new Vector3(-0.032, 0, 0.012)), new Vector3(tray - 0.03, (s.y + h.y) / 2, h.z - 0.004), new Vector3(tray - 0.01, h.y, h.z), new Vector3(tray + 0.012, h.y, h.z)],
      cols: 12,
      rows: 2,
      across: new Vector3(0, 1, 0),
      depth: new Vector3(0, 0, 1),
      plug: { at: s.clone().add(new Vector3(-0.006, 0, 0)), size: new Vector3(0.012, 0.052, 0.015) },
    });
  }
  if (eps8 && holes.eps) {
    const s = v(eps8);
    const h = v(holes.eps);
    out.push({
      path: [s.clone().add(new Vector3(-0.012, 0, 0)), s.clone().add(new Vector3(-0.026, 0.012, 0)), new Vector3(tray - 0.022, h.y - 0.002, h.z), new Vector3(tray + 0.012, h.y, h.z)],
      cols: 4,
      rows: 2,
      across: new Vector3(0, 1, 0),
      depth: new Vector3(0, 0, 1),
      plug: { at: s.clone().add(new Vector3(-0.006, 0, 0)), size: new Vector3(0.012, 0.018, 0.009) },
    });
  }
  if (gpuPower && holes.gpu && inst.gpu) {
    const s = v(gpuPower);
    const h = v(holes.gpu);
    const below = inst.gpu.p[1] - inst.gpu.size[1] / 2 - 0.025;
    out.push({
      path: [s.clone().add(new Vector3(-0.012, 0, 0)), s.clone().add(new Vector3(-0.03, -0.01, 0.004)), new Vector3(s.x - 0.032, below, s.z - 0.01), new Vector3(tray - 0.045, h.y + 0.004, h.z + 0.02), new Vector3(tray + 0.012, h.y, h.z)],
      cols: 8,
      rows: 2,
      across: new Vector3(0, 0, 1),
      depth: new Vector3(0, 1, 0),
      plug: { at: s.clone().add(new Vector3(-0.006, 0, 0)), size: new Vector3(0.012, 0.009, 0.02) },
    });
  }
  return out;
}

/** Wires of one bundle: the grid spreads at the plug and narrows to a tight bundle at the grommet. */
function wires(b: Bundle): BufferGeometry[] {
  const centre = new CatmullRomCurve3(b.path, false, 'centripetal', 0.5);
  const n = 48;
  const out: BufferGeometry[] = [];
  const pitch = WIRE * 2.15;
  for (let c = 0; c < b.cols; c++)
    for (let r = 0; r < b.rows; r++) {
      const oc = (c - (b.cols - 1) / 2) * pitch;
      const or = (r - (b.rows - 1) / 2) * pitch;
      const pts: Vector3[] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        // keep the plug's grid for the first third, then gather into a round bundle
        const squeeze = 1 - 0.55 * Math.max(0, (t - 0.35) / 0.65);
        pts.push(centre.getPoint(t).addScaledVector(b.across, oc * squeeze).addScaledVector(b.depth, or));
      }
      out.push(new TubeGeometry(new CatmullRomCurve3(pts), n, WIRE, 6, false));
    }
  return out;
}

/** Plugs and two cable combs per bundle. */
function hardware(b: Bundle): BufferGeometry[] {
  const out: BufferGeometry[] = [];
  const plug = new BoxGeometry(b.plug.size.x, b.plug.size.y, b.plug.size.z);
  plug.translate(b.plug.at.x, b.plug.at.y, b.plug.at.z);
  out.push(plug);
  const centre = new CatmullRomCurve3(b.path, false, 'centripetal', 0.5);
  for (const t of [0.22, 0.5]) {
    const p = centre.getPoint(t);
    const tan = centre.getTangent(t);
    const width = b.cols * WIRE * 2.15 * (1 - 0.55 * Math.max(0, (t - 0.35) / 0.65)) + 0.004;
    const comb = new BoxGeometry(width, 0.004, b.rows * WIRE * 2.15 + 0.003);
    // the comb's width along the wire grid, its thin side along the cable
    const m = new Matrix4().makeBasis(b.across.clone(), tan.clone(), b.depth.clone());
    const q = new Quaternion().setFromRotationMatrix(m);
    comb.applyMatrix4(new Matrix4().compose(p, q, new Vector3(1, 1, 1)));
    out.push(comb);
  }
  return out;
}

export function ShowcaseCables({ inst, origin = [0, 0, 0] }: { inst: Installed; origin?: Vec3 }) {
  const group = useRef<Group>(null);
  const res = useDisposable(() => {
    const list = bundles(inst);
    const w = list.flatMap(wires);
    const h = list.flatMap(hardware);
    return {
      wires: w.length ? mergeGeometries(w, false)! : new BoxGeometry(0, 0, 0),
      hardware: h.length ? mergeGeometries(h, false)! : new BoxGeometry(0, 0, 0),
      braid: fabricTexture([1, 40]),
    };
  }, [inst]);
  useFrame(() => {
    // cables would float when the parts separate: tucked away while anything is out
    if (group.current) group.current.visible = pcRig.cables > 0.5 && pcRig.explode < 0.02;
  });
  const offset = useMemo(() => [-origin[0], -origin[1], -origin[2]] as const, [origin]);
  return (
    <group ref={group} position={[...offset]}>
      <mesh geometry={res.wires} castShadow receiveShadow>
        <meshStandardMaterial color="#f3f4f7" roughness={0.82} bumpMap={res.braid} bumpScale={0.6} />
      </mesh>
      <mesh geometry={res.hardware} castShadow>
        <meshStandardMaterial color="#e6e8ec" roughness={0.45} />
      </mesh>
    </group>
  );
}
