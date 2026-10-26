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
 *
 * V4 §3.2 style: a soft rounded head with a big dark screen face, large
 * glowing eyes with highlights, pink cheeks and a wide smile; bodies are
 * rounded, and a robot that wears a shirt wears it fitted — the shirt is the
 * body's own ellipsoid, 3 % larger, cut to the torso, with short sleeves on
 * the arms and the BitLab mark printed on a patch that follows the chest.
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

export type RobotKind = 'advisor' | 'cleaner' | 'courier' | 'builder' | 'presenter' | 'bit';

export interface RobotLogo {
  at: Vec3;
  rot?: Vec3;
  size: number;
  /** A curved patch printed on the shirt (placed at `at`, scaled by `scale`); otherwise a flat square. */
  geo?: BufferGeometry;
  scale?: Vec3;
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

export const CHEEK = '#ff9cc0';

/**
 * A friendly head: a soft rounded shell, a big dark screen face with two
 * large glowing eyes (white highlights), pink cheeks and a wide smile, ear
 * pods and an antenna with a glowing tip.
 */
function headPieces(w: number, h: number, at: Vec3 = [0, 0, 0]): { solid: Piece[]; glow: Piece[] } {
  const ear = (s: number): Place => ({ at: [at[0] + s * (w / 2 + 0.006), at[1], at[2]], rot: [0, 0, (s * Math.PI) / 2] });
  const front = at[2] + w * 0.39;
  const face = front + 0.014;
  const eyeY = at[1] + h * 0.07;
  return {
    solid: [
      { geo: new RoundedBoxGeometry(w, h, w * 0.78, 4, Math.min(w, h) * 0.34), at, color: SHELL },
      { geo: visor(w * 0.84, h * 0.74, h * 0.24), at: [at[0], at[1], front + 0.004], color: VISOR },
      { geo: new CylinderGeometry(w * 0.12, w * 0.12, 0.04, 20), color: JOINT, parents: [ear(-1)] },
      { geo: new CylinderGeometry(w * 0.12, w * 0.12, 0.04, 20), color: JOINT, parents: [ear(1)] },
      { geo: new CylinderGeometry(0.006, 0.006, h * 0.36, 8), at: [at[0], at[1] + h * 0.66, at[2]], color: JOINT },
      // highlights in the eyes and rosy cheeks: lit, so they read as glossy and soft
      ...[-1, 1].map((s) => ({ geo: new CircleGeometry(w * 0.026, 12), at: [at[0] + s * w * 0.18 - w * 0.03, eyeY + h * 0.06, face + 0.004] as Vec3 })),
      ...[-1, 1].map((s) => ({ geo: new CircleGeometry(w * 0.045, 16), at: [at[0] + s * w * 0.3, at[1] - h * 0.11, face + 0.001] as Vec3, scale: [1, 0.7, 1] as Vec3, color: CHEEK })),
    ],
    glow: [
      ...[-1, 1].map((s) => ({ geo: new CircleGeometry(w * 0.085, 20), at: [at[0] + s * w * 0.18, eyeY, face + 0.002] as Vec3, scale: [1, 1.3, 1] as Vec3 })),
      { geo: new TorusGeometry(w * 0.13, 0.008, 6, 20, Math.PI), at: [at[0], at[1] - h * 0.1, face + 0.002], rot: [0, 0, Math.PI] },
      { geo: new SphereGeometry(0.022, 12, 8), at: [at[0], at[1] + h * 0.86, at[2]] },
    ],
  };
}

/**
 * A rounded torso and the shirt it wears (V4 §3.2): the shirt is the same
 * ellipsoid 3 % larger, cut to the band between `from` and `to` (polar angle
 * from the top, radians), so it follows the body everywhere and cannot clip.
 * The BitLab mark is a small patch of the same surface, a little further out.
 */
function torso(r: number, scale: Vec3, at: Vec3, shirt: { from: number; to: number } | null, logoSize = r * 0.62) {
  const solid: Piece[] = [{ geo: new SphereGeometry(r, 36, 24), at, scale, color: SHELL }];
  const accent: Piece[] = [];
  if (shirt) {
    accent.push({ geo: new SphereGeometry(r * 1.03, 36, 20, 0, Math.PI * 2, shirt.from, shirt.to - shirt.from), at, scale });
    // a rolled hem where the shirt ends, following the body's section there
    const ring = r * 1.03 * Math.sin(shirt.to);
    accent.push({ geo: new TorusGeometry(ring, 0.009, 6, 40), at: [at[0], at[1] + r * 1.03 * Math.cos(shirt.to) * scale[1], at[2]], rot: [Math.PI / 2, 0, 0], scale: [scale[0], scale[2], 1] });
  }
  const R = r * 1.045;
  // the patch spans the logo's size on the scaled surface, centred on the chest (+Z)
  const phiLen = logoSize / (R * scale[0]);
  const thetaLen = logoSize / (R * scale[1]);
  // mid-chest: below any collar or bow tie
  const centre = shirt ? shirt.from + (shirt.to - shirt.from) * 0.55 : Math.PI * 0.42;
  const logo: RobotLogo = {
    at,
    scale,
    size: logoSize,
    geo: new SphereGeometry(R, 12, 12, Math.PI / 2 - phiLen / 2, phiLen, centre - thetaLen / 2, thetaLen),
  };
  return { solid, accent, logo };
}

/** An arm hanging from its shoulder; `sleeve`: a short shirt sleeve in that colour round its top. */
const armPieces = (len: number, parents: readonly Place[] = [], sleeve?: string): Piece[] => [
  { geo: new SphereGeometry(0.045, 12, 8), color: JOINT, parents },
  { geo: new CapsuleGeometry(0.035, len, 3, 10), at: [0, -len / 2 - 0.03, 0], color: SHELL, parents },
  { geo: new SphereGeometry(0.042, 12, 8), at: [0, -len - 0.06, 0], color: JOINT, parents },
  ...(sleeve ? [{ geo: new CylinderGeometry(0.056, 0.05, 0.09, 16), at: [0, -0.035, 0] as Vec3, color: sleeve, parents }] : []),
];

/** Advisor (guide): a hovering egg in a fitted shirt of its zone colour, a tablet held in front, a ring light under it. */
function advisor(accent: string): RobotGeometry {
  const head = headPieces(0.34, 0.27, [0, 1.13, 0]);
  const body = torso(0.17, [1, 1.22, 0.88], [0, 0.74, 0], { from: 0.3, to: 1.85 });
  const leftArm: Place = { at: [-0.19, 0.88, 0.02], rot: [-0.5, 0, -0.15] };
  const rightArm: Place = { at: [0.19, 0.88, 0.02], rot: [-0.5, 0, 0.15] };
  return {
    solid: mergePieces(
      [
        ...body.solid,
        { geo: new CylinderGeometry(0.045, 0.055, 0.06, 14), at: [0, 0.98, 0], color: JOINT },
        { geo: new CylinderGeometry(0.1, 0.15, 0.1, 28), at: [0, 0.4, 0], color: JOINT },
        ...armPieces(0.16, [leftArm], accent),
        ...armPieces(0.16, [rightArm], accent),
        { geo: new RoundedBoxGeometry(0.2, 0.14, 0.012, 2, 0.01), at: [0, 0.66, 0.22], rot: [-0.6, 0, 0], color: VISOR },
        ...head.solid,
      ],
      true,
    ),
    accent: mergePieces([...body.accent, { geo: new TorusGeometry(0.15, 0.012, 6, 32), at: [0, 0.35, 0], rot: [Math.PI / 2, 0, 0] }]),
    glow: mergePieces([...head.glow, { geo: new TorusGeometry(0.12, 0.01, 6, 28), at: [0, 0.27, 0], rot: [Math.PI / 2, 0, 0] }, { geo: new BoxGeometry(0.14, 0.008, 0.002), at: [0, 0.69, 0.226], rot: [-0.6, 0, 0] }]),
    logo: body.logo,
    height: 1.34,
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

/** Builder: a sturdy round body on tracks in a work shirt, yellow hard hat and tool belt; the right arm holds a screwdriver. */
function builder(accent: string): RobotGeometry {
  const head = headPieces(0.34, 0.27, [0, 1.13, 0]);
  const body = torso(0.2, [1.08, 1.12, 0.86], [0, 0.73, 0], { from: 0.32, to: 1.8 });
  return {
    solid: mergePieces(
      [
        ...body.solid,
        { geo: new RoundedBoxGeometry(0.36, 0.12, 0.38, 3, 0.05), at: [0, 0.08, 0], color: TYRE },
        { geo: new CylinderGeometry(0.085, 0.1, 0.42, 18), at: [0, 0.33, 0], color: JOINT },
        { geo: new CylinderGeometry(0.045, 0.05, 0.06, 12), at: [0, 0.98, 0], color: JOINT },
        ...armPieces(0.18, [{ at: [-0.23, 0.87, 0], rot: [-0.3, 0, -0.2] }], accent),
        // hard hat with a brim, the tool belt round the hips and its pouch
        { geo: new SphereGeometry(0.185, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), at: [0, 1.23, 0], color: '#facc15' },
        { geo: new CylinderGeometry(0.225, 0.225, 0.016, 28), at: [0, 1.23, 0.012], color: '#facc15' },
        { geo: new TorusGeometry(0.2, 0.022, 8, 40), at: [0, 0.63, 0], rot: [Math.PI / 2, 0, 0], scale: [1.08, 0.82, 1], color: '#6b4a2b' },
        { geo: new RoundedBoxGeometry(0.07, 0.08, 0.04, 2, 0.01), at: [0.14, 0.6, 0.17], color: '#6b4a2b' },
        ...head.solid,
      ],
      true,
    ),
    accent: mergePieces(body.accent),
    glow: mergePieces(head.glow),
    arm: {
      geo: mergePieces(
        [
          ...armPieces(0.18, [], accent),
          { geo: new CylinderGeometry(0.012, 0.012, 0.09, 8), at: [0, -0.3, 0.05], rot: [Math.PI / 2, 0, 0], color: '#f5b83d' },
          { geo: new CylinderGeometry(0.004, 0.004, 0.08, 6), at: [0, -0.3, 0.13], rot: [Math.PI / 2, 0, 0], color: '#9aa3b2' },
        ],
        true,
      ),
      pivot: [0.23, 0.87, 0],
    },
    logo: body.logo,
    height: 1.36,
  };
}

/** Presenter: a tall, slim robot in a fitted BitLab T-shirt with a bow tie and a headset mic; points with its right arm. */
function presenter(accent: string): RobotGeometry {
  const head = headPieces(0.4, 0.31, [0, 0, 0]);
  const body = torso(0.2, [1, 1.2, 0.86], [0, 0.76, 0], { from: 0.3, to: 1.85 });
  return {
    solid: mergePieces(
      [
        ...body.solid,
        // legs reach up into the body: no gap at the hips
        { geo: new CapsuleGeometry(0.08, 0.32, 4, 14), at: [-0.09, 0.31, 0], color: JOINT },
        { geo: new CapsuleGeometry(0.08, 0.32, 4, 14), at: [0.09, 0.31, 0], color: JOINT },
        ...[-1, 1].map((s) => ({ geo: new RoundedBoxGeometry(0.13, 0.06, 0.21, 2, 0.025), at: [s * 0.09, 0.03, 0.03] as Vec3, color: TYRE })),
        { geo: new CylinderGeometry(0.045, 0.05, 0.08, 12), at: [0, 1.02, 0], color: JOINT },
        ...armPieces(0.22, [{ at: [-0.22, 0.9, 0], rot: [0, 0, -0.12] }], accent),
        // bow tie at the collar
        ...[-1, 1].map((s) => ({ geo: new CylinderGeometry(0.004, 0.034, 0.05, 4), at: [s * 0.027, 0.98, 0.155] as Vec3, rot: [0, 0, (s * Math.PI) / 2] as Vec3, color: JOINT })),
        { geo: new SphereGeometry(0.013, 10, 8), at: [0, 0.98, 0.16], color: JOINT },
      ],
      true,
    ),
    accent: mergePieces(body.accent),
    glow: mergePieces([{ geo: new SphereGeometry(0.012, 8, 6), at: [0.15, 1.16, 0.2] }]),
    head: {
      geo: mergePieces([...head.solid, { geo: new CylinderGeometry(0.004, 0.004, 0.18, 6), at: [0.14, -0.09, 0.12], rot: [0.9, 0, 0.6], color: JOINT }], true),
      glow: mergePieces(head.glow),
      pivot: [0, 1.24, 0],
    },
    arm: { geo: mergePieces(armPieces(0.22, [], accent), true), pivot: [0.22, 0.9, 0] },
    logo: body.logo,
    height: 1.6,
  };
}

/**
 * Bit as a desk figure (V4 §2.3, §3.2): a round white body in a fitted shirt
 * of the accent colour, a big friendly head, stubby feet, the left arm down
 * and the right arm free to wave. Built about 1 m tall in kit units; the home
 * desk shows it scaled down.
 */
function bit(accent: string): RobotGeometry {
  const head = headPieces(0.46, 0.36, [0, 0, 0]);
  const body = torso(0.2, [1, 1.1, 0.9], [0, 0.34, 0], { from: 0.34, to: 1.9 }, 0.14);
  return {
    solid: mergePieces(
      [
        ...body.solid,
        ...[-1, 1].map((s) => ({ geo: new SphereGeometry(0.075, 16, 10), at: [s * 0.1, 0.045, 0.03] as Vec3, scale: [1, 0.6, 1.35] as Vec3, color: JOINT })),
        { geo: new CylinderGeometry(0.05, 0.065, 0.09, 14), at: [0, 0.6, 0], color: JOINT },
        ...armPieces(0.15, [{ at: [-0.21, 0.48, 0], rot: [0, 0, -0.3] }], accent),
      ],
      true,
    ),
    accent: mergePieces(body.accent),
    glow: mergePieces([{ geo: new SphereGeometry(0.001, 4, 3) }]),
    head: { geo: mergePieces(head.solid, true), glow: mergePieces(head.glow), pivot: [0, 0.84, 0] },
    arm: { geo: mergePieces(armPieces(0.15, [], accent), true), pivot: [0.21, 0.48, 0] },
    logo: body.logo,
    height: 1.1,
  };
}

/** `accent`: the robot's own colour — its shirt and sleeves are built in it. */
export function robotGeometry(kind: RobotKind, accent = '#5f7bff'): RobotGeometry {
  switch (kind) {
    case 'advisor':
      return advisor(accent);
    case 'cleaner':
      return cleaner();
    case 'courier':
      return courier();
    case 'builder':
      return builder(accent);
    case 'presenter':
      return presenter(accent);
    case 'bit':
      return bit(accent);
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

