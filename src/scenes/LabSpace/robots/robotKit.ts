/**
 * The lab's helper robots (0.37): shared parts and five kinds, each merged
 * into a handful of geometries so a robot costs 3–5 draw calls:
 *   - `solid`: shell, joints and visor, coloured per vertex;
 *   - `accent`: the parts in the robot's own colour (tinted by the material or
 *     per instance), so one geometry serves every advisor;
 *   - `glow`: eyes, smile and lights (unlit, bloom);
 *   - moving parts (an arm, a head) as their own geometries;
 *   - `logo`: where the BitLab mark sits (chest or top).
 * Robot origin: centre of its footprint on the floor, facing +Z.
 */
import { BoxGeometry, BufferAttribute, CapsuleGeometry, CircleGeometry, Color, CylinderGeometry, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { extrudeFront, roundedRectShape } from '@/lib/three/geometry';
import { mergePieces, type Piece, type Place, type Vec3 } from '../classroom/mergeParts';

export const SHELL = '#f4f6fa';
export const JOINT = '#2a3142';
export const VISOR = '#070c18';
export const TYRE = '#1b1e24';

export type RobotKind = 'advisor' | 'cleaner' | 'courier' | 'builder' | 'presenter';

export interface RobotLogo {
  at: Vec3;
  rot?: Vec3;
  size: number;
}

export interface RobotGeometry {
  solid: BufferGeometry;
  accent: BufferGeometry;
  glow: BufferGeometry;
  /** Moving parts, each with the pivot it turns about (robot space). */
  head?: { geo: BufferGeometry; glow: BufferGeometry; pivot: Vec3 };
  arm?: { geo: BufferGeometry; pivot: Vec3 };
  logo: RobotLogo;
  /** Height of the top of the head (speech bubbles, labels). */
  height: number;
}

function visor(w: number, h: number, r: number, d = 0.02) {
  const g = extrudeFront(roundedRectShape(w, h, r), d, { bevel: 0 });
  g.translate(0, 0, -d / 2);
  return g;
}

/** A friendly head: rounded shell, dark visor with two eyes and a smile, ear pods, antenna. */
function headPieces(w: number, h: number, at: Vec3 = [0, 0, 0]): { solid: Piece[]; glow: Piece[] } {
  const ear = (s: number): Place => ({ at: [at[0] + s * (w / 2 + 0.008), at[1], at[2]], rot: [0, 0, (s * Math.PI) / 2] });
  const front = at[2] + w * 0.38;
  return {
    solid: [
      { geo: new RoundedBoxGeometry(w, h, w * 0.78, 3, Math.min(w, h) * 0.24), at, color: SHELL },
      { geo: visor(w * 0.8, h * 0.66, h * 0.16), at: [at[0], at[1], front + 0.004], color: VISOR },
      { geo: new CylinderGeometry(w * 0.13, w * 0.13, 0.035, 16), color: JOINT, parents: [ear(-1)] },
      { geo: new CylinderGeometry(w * 0.13, w * 0.13, 0.035, 16), color: JOINT, parents: [ear(1)] },
      { geo: new CylinderGeometry(0.007, 0.007, h * 0.4, 8), at: [at[0], at[1] + h * 0.68, at[2]], color: JOINT },
    ],
    glow: [
      ...[-1, 1].map((s) => ({ geo: new CircleGeometry(w * 0.07, 16), at: [at[0] + s * w * 0.17, at[1] + h * 0.06, front + 0.016] as Vec3, scale: [1, 1.35, 1] as Vec3 })),
      { geo: new TorusGeometry(w * 0.11, 0.006, 5, 14, Math.PI), at: [at[0], at[1] - h * 0.12, front + 0.016], rot: [0, 0, Math.PI] },
      { geo: new SphereGeometry(0.022, 10, 8), at: [at[0], at[1] + h * 0.9, at[2]] },
    ],
  };
}

const armPieces = (len: number, parents: readonly Place[] = []): Piece[] => [
  { geo: new SphereGeometry(0.045, 12, 8), color: JOINT, parents },
  { geo: new CapsuleGeometry(0.035, len, 3, 10), at: [0, -len / 2 - 0.03, 0], color: SHELL, parents },
  { geo: new SphereGeometry(0.042, 12, 8), at: [0, -len - 0.06, 0], color: JOINT, parents },
];

/** Advisor: hovering body, a tablet held in front, ring light under it; the accent is its zone colour. */
function advisor(): RobotGeometry {
  const head = headPieces(0.32, 0.24, [0, 1.12, 0]);
  const leftArm: Place = { at: [-0.19, 0.86, 0.02], rot: [-0.5, 0, -0.15] };
  const rightArm: Place = { at: [0.19, 0.86, 0.02], rot: [-0.5, 0, 0.15] };
  return {
    solid: mergePieces(
      [
        { geo: new CapsuleGeometry(0.16, 0.26, 5, 18), at: [0, 0.74, 0], scale: [1, 1, 0.82], color: SHELL },
        { geo: new CylinderGeometry(0.04, 0.05, 0.06, 12), at: [0, 0.98, 0], color: JOINT },
        { geo: new CylinderGeometry(0.11, 0.16, 0.12, 24), at: [0, 0.36, 0], color: JOINT },
        ...armPieces(0.16, [leftArm]),
        ...armPieces(0.16, [rightArm]),
        { geo: new RoundedBoxGeometry(0.2, 0.14, 0.012, 2, 0.01), at: [0, 0.66, 0.2], rot: [-0.6, 0, 0], color: VISOR },
        ...head.solid,
      ],
      true,
    ),
    accent: mergePieces([
      { geo: new CylinderGeometry(0.165, 0.17, 0.03, 28), at: [0, 0.6, 0] },
      { geo: new RoundedBoxGeometry(0.22, 0.16, 0.01, 2, 0.012), at: [0, 0.66, 0.192], rot: [-0.6, 0, 0] },
      { geo: new TorusGeometry(0.17, 0.012, 6, 28), at: [0, 0.31, 0], rot: [Math.PI / 2, 0, 0] },
    ]),
    glow: mergePieces([...head.glow, { geo: new TorusGeometry(0.13, 0.01, 6, 28), at: [0, 0.22, 0], rot: [Math.PI / 2, 0, 0] }, { geo: new BoxGeometry(0.14, 0.008, 0.002), at: [0, 0.69, 0.2], rot: [-0.6, 0, 0] }]),
    logo: { at: [0, 0.83, 0.135], size: 0.1 },
    height: 1.32,
  };
}

/** Cleaner: a disc robot with a little dome face, side brushes and a bumper. */
function cleaner(): RobotGeometry {
  return {
    solid: mergePieces(
      [
        { geo: new CylinderGeometry(0.2, 0.21, 0.07, 36), at: [0, 0.045, 0], color: SHELL },
        { geo: new CylinderGeometry(0.205, 0.205, 0.02, 36), at: [0, 0.03, 0], color: JOINT },
        { geo: new SphereGeometry(0.09, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), at: [0, 0.08, 0.04], color: SHELL },
        { geo: visor(0.11, 0.05, 0.02, 0.01), at: [0, 0.125, 0.115], rot: [-0.35, 0, 0], color: VISOR },
        ...[-1, 1].map((s) => ({ geo: new CylinderGeometry(0.02, 0.02, 0.02, 10), at: [s * 0.15, 0.01, 0.12] as Vec3, color: JOINT })),
      ],
      true,
    ),
    accent: mergePieces([
      { geo: new TorusGeometry(0.205, 0.012, 6, 36), at: [0, 0.075, 0], rot: [Math.PI / 2, 0, 0] },
      ...[-1, 1].flatMap((s) => [0, 1, 2].map((k) => ({ geo: new BoxGeometry(0.07, 0.004, 0.008), at: [s * 0.15, 0.004, 0.12] as Vec3, rot: [0, (k * Math.PI) / 3, 0] as Vec3 }))),
    ]),
    glow: mergePieces([
      ...[-1, 1].map((s) => ({ geo: new CircleGeometry(0.012, 12), at: [s * 0.025, 0.13, 0.122] as Vec3, rot: [-0.35, 0, 0] as Vec3 })),
      { geo: new TorusGeometry(0.17, 0.006, 5, 36), at: [0, 0.081, 0], rot: [Math.PI / 2, 0, 0] },
    ]),
    logo: { at: [0, 0.0815, -0.08], rot: [-Math.PI / 2, 0, 0], size: 0.11 },
    height: 0.2,
  };
}

/** Courier: a wheeled cart robot with a carry deck; the parcel is drawn separately. */
function courier(): RobotGeometry {
  const head = headPieces(0.26, 0.2, [0, 0.82, 0.12]);
  return {
    solid: mergePieces(
      [
        { geo: new RoundedBoxGeometry(0.44, 0.22, 0.5, 3, 0.05), at: [0, 0.2, 0], color: SHELL },
        ...[-1, 1].flatMap((sx) => [-1, 1].map((sz) => ({ geo: new CylinderGeometry(0.07, 0.07, 0.05, 20), at: [sx * 0.23, 0.07, sz * 0.17] as Vec3, rot: [0, 0, Math.PI / 2] as Vec3, color: TYRE }))),
        { geo: new CylinderGeometry(0.03, 0.035, 0.34, 12), at: [0, 0.5, 0.12], color: JOINT },
        { geo: new BoxGeometry(0.4, 0.02, 0.36), at: [0, 0.32, -0.05], color: JOINT },
        ...head.solid,
      ],
      true,
    ),
    accent: mergePieces([
      { geo: new BoxGeometry(0.45, 0.04, 0.51), at: [0, 0.12, 0] },
      { geo: new BoxGeometry(0.03, 0.06, 0.36), at: [-0.2, 0.36, -0.05] },
      { geo: new BoxGeometry(0.03, 0.06, 0.36), at: [0.2, 0.36, -0.05] },
    ]),
    glow: mergePieces([...head.glow, ...[-1, 1].map((s) => ({ geo: new CircleGeometry(0.02, 12), at: [s * 0.14, 0.2, 0.252] as Vec3 }))]),
    logo: { at: [0, 0.2, 0.251], size: 0.1 },
    height: 1.0,
  };
}

/** Builder: sturdy body on tracks, hard hat and tool belt; the right arm holds a screwdriver and moves. */
function builder(): RobotGeometry {
  const head = headPieces(0.3, 0.23, [0, 1.06, 0]);
  return {
    solid: mergePieces(
      [
        { geo: new RoundedBoxGeometry(0.36, 0.42, 0.28, 3, 0.07), at: [0, 0.68, 0], color: SHELL },
        { geo: new RoundedBoxGeometry(0.34, 0.12, 0.36, 3, 0.05), at: [0, 0.08, 0], color: TYRE },
        { geo: new CylinderGeometry(0.06, 0.08, 0.32, 14), at: [0, 0.3, 0], color: JOINT },
        { geo: new CylinderGeometry(0.045, 0.05, 0.06, 12), at: [0, 0.92, 0], color: JOINT },
        ...armPieces(0.18, [{ at: [-0.21, 0.84, 0], rot: [-0.3, 0, -0.2] }]),
        ...head.solid,
      ],
      true,
    ),
    accent: mergePieces([
      // hard hat with a brim, and the tool belt
      { geo: new SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), at: [0, 1.17, 0] },
      { geo: new CylinderGeometry(0.21, 0.21, 0.015, 24), at: [0, 1.17, 0.01] },
      { geo: new BoxGeometry(0.38, 0.05, 0.3), at: [0, 0.5, 0] },
      { geo: new BoxGeometry(0.06, 0.08, 0.04), at: [0.12, 0.47, 0.16] },
    ]),
    glow: mergePieces([...head.glow, { geo: new BoxGeometry(0.1, 0.012, 0.002), at: [0, 0.56, 0.142] }]),
    arm: {
      geo: mergePieces(
        [
          ...armPieces(0.18),
          { geo: new CylinderGeometry(0.012, 0.012, 0.09, 8), at: [0, -0.3, 0.05], rot: [Math.PI / 2, 0, 0], color: '#f5b83d' },
          { geo: new CylinderGeometry(0.004, 0.004, 0.08, 6), at: [0, -0.3, 0.13], rot: [Math.PI / 2, 0, 0], color: '#9aa3b2' },
        ],
        true,
      ),
      pivot: [0.21, 0.84, 0],
    },
    logo: { at: [0.08, 0.78, 0.141], size: 0.09 },
    height: 1.26,
  };
}

/** Presenter: slim humanoid in a BitLab hoodie (the accent) with a headset mic; points with its right arm. */
function presenter(): RobotGeometry {
  const head = headPieces(0.3, 0.24, [0, 0, 0]);
  return {
    solid: mergePieces(
      [
        { geo: new CapsuleGeometry(0.075, 0.38, 4, 14), at: [-0.08, 0.3, 0], color: JOINT },
        { geo: new CapsuleGeometry(0.075, 0.38, 4, 14), at: [0.08, 0.3, 0], color: JOINT },
        ...[-1, 1].map((s) => ({ geo: new RoundedBoxGeometry(0.12, 0.06, 0.2, 2, 0.025), at: [s * 0.08, 0.03, 0.03] as Vec3, color: TYRE })),
        { geo: new CylinderGeometry(0.045, 0.05, 0.08, 12), at: [0, 1.12, 0], color: JOINT },
        ...armPieces(0.24, [{ at: [-0.22, 1.0, 0], rot: [0, 0, -0.12] }]),
      ],
      true,
    ),
    accent: mergePieces([
      // hoodie: torso, hood collar, kangaroo pocket
      { geo: new CapsuleGeometry(0.2, 0.32, 5, 20), at: [0, 0.82, 0], scale: [1, 1, 0.78] },
      { geo: new TorusGeometry(0.11, 0.035, 8, 20), at: [0, 1.08, -0.01], rot: [Math.PI / 2, 0, 0] },
      { geo: new RoundedBoxGeometry(0.22, 0.09, 0.03, 2, 0.02), at: [0, 0.68, 0.145] },
    ]),
    glow: mergePieces([{ geo: new SphereGeometry(0.012, 8, 6), at: [0.12, 1.22, 0.16] }]),
    head: {
      geo: mergePieces([...head.solid, { geo: new CylinderGeometry(0.004, 0.004, 0.16, 6), at: [0.1, -0.08, 0.1], rot: [0.9, 0, 0.6], color: JOINT }], true),
      glow: mergePieces(head.glow),
      pivot: [0, 1.3, 0],
    },
    arm: { geo: mergePieces(armPieces(0.24), true), pivot: [0.22, 1.0, 0] },
    logo: { at: [0, 0.9, 0.158], size: 0.11 },
    height: 1.6,
  };
}

export function robotGeometry(kind: RobotKind): RobotGeometry {
  switch (kind) {
    case 'advisor':
      return advisor();
    case 'cleaner':
      return cleaner();
    case 'courier':
      return courier();
    case 'builder':
      return builder();
    case 'presenter':
      return presenter();
  }
}

/** The courier's parcel: a cardboard box with BitLab tape, one geometry (vertex colours). */
export function parcelGeometry() {
  return mergePieces(
    [
      { geo: new BoxGeometry(0.3, 0.22, 0.26), color: '#c9a072' },
      { geo: new BoxGeometry(0.31, 0.04, 0.27), color: '#5f7bff' },
      { geo: new BoxGeometry(0.04, 0.225, 0.27), color: '#5f7bff' },
    ],
    true,
  );
}

/** Body and accent as one geometry (vertex colours): one draw call less for a robot whose colour never changes. */
export function withAccent(solid: BufferGeometry, accent: BufferGeometry, color: string): BufferGeometry {
  const a = accent.clone();
  const c = new Color(color);
  const n = a.attributes.position.count;
  const data = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) data.set([c.r, c.g, c.b], i * 3);
  a.setAttribute('color', new BufferAttribute(data, 3));
  const merged = mergeGeometries([solid, a]) ?? solid;
  a.dispose();
  return merged;
}

