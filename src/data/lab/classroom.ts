/**
 * The lab hall as an informatics classroom (2026-10): learning posters on the
 * walls (each opens its explanation), windows, the room's name and the robot
 * teacher. Pure data, world metres (LAB_HALL frame: back wall at minZ, side
 * walls at ±maxX, the open front at +Z). Texts live in the locales under
 * `lab.classroom.posters.<id>.*` and `lab.teacher.*`.
 */
import { LAB_HALL, type Vec3 } from './zones';

export const POSTER_IDS = ['architecture', 'units', 'numbers', 'algorithm', 'network', 'safety'] as const;
export type PosterId = (typeof POSTER_IDS)[number];

export type Wall = 'back' | 'left' | 'right';

export interface Poster {
  id: PosterId;
  wall: Wall;
  /** Centre of the poster on its wall (m). */
  center: Vec3;
  /** Width × height (m). */
  size: readonly [number, number];
  accent: string;
  /** The lab that practises the subject. */
  link?: string;
}

const BACK_Z = LAB_HALL.minZ + 0.02;
const LEFT_X = LAB_HALL.minX + 0.02;
const RIGHT_X = LAB_HALL.maxX - 0.02;

export const POSTERS: readonly Poster[] = [
  // behind the PC build bench and the storage wall
  { id: 'architecture', wall: 'back', center: [-7.85, 2.05, BACK_Z], size: [1.3, 1.62], accent: '#4ade80', link: '/explorer' },
  { id: 'units', wall: 'back', center: [-4.6, 2.05, BACK_Z], size: [1.3, 1.62], accent: '#38d6f5', link: '/labs/experiments' },
  { id: 'numbers', wall: 'back', center: [4.6, 2.05, BACK_Z], size: [1.3, 1.62], accent: '#f5b83d', link: '/labs/logic' },
  { id: 'algorithm', wall: 'back', center: [7.85, 2.05, BACK_Z], size: [1.3, 1.62], accent: '#a78bfa', link: '/labs/algorithms' },
  // side walls, between their zones
  { id: 'network', wall: 'left', center: [LEFT_X, 2.0, 1.8], size: [1.3, 1.62], accent: '#22d3ee', link: '/labs/network' },
  { id: 'safety', wall: 'right', center: [RIGHT_X, 2.0, 1.8], size: [1.3, 1.62], accent: '#fb7185' },
];

/** Rotation about Y that turns a poster (drawn facing +Z) to face into the room from its wall. */
export const wallYaw = (wall: Wall) => (wall === 'back' ? 0 : wall === 'left' ? Math.PI / 2 : -Math.PI / 2);

/** Windows on the side walls: centre (z, y on that wall) and size. */
export const WINDOWS: readonly { wall: 'left' | 'right'; z: number; y: number; w: number; h: number }[] = [
  { wall: 'left', z: -4.6, y: 2.25, w: 2.2, h: 1.7 },
  { wall: 'left', z: 6.9, y: 2.25, w: 1.8, h: 1.7 },
  { wall: 'right', z: -4.6, y: 2.25, w: 2.2, h: 1.7 },
  { wall: 'right', z: 6.9, y: 2.25, w: 1.8, h: 1.7 },
];

/** The room's name above the workstation, and the wall clock. */
export const ROOM_SIGN = { center: [0, 3.72, BACK_Z] as Vec3, size: [3.6, 0.56] as const };
export const CLOCK = { center: [2.55, 3.72, BACK_Z] as Vec3, radius: 0.27 };

/** The robot teacher: in the open middle of the hall, right of the showcase, facing the visitors. */
export const ROBOT = { position: [3.1, 0, 2.6] as Vec3, yaw: -0.2 };

/** A camera shot: where the camera stands and what it looks at. */
export interface Shot {
  position: Vec3;
  target: Vec3;
}

/** Sideways shift (m) that keeps a close-up subject left of the side panel on wide screens. */
const PANEL_SHIFT = 0.65;

/** Close enough to read a poster: in front of it, the poster left of the explanation panel. */
export function posterShot(p: Poster): Shot {
  const yaw = wallYaw(p.wall);
  const [x, y, z] = p.center;
  const d = 3.2;
  // along the wall, to the viewer's right: the target moves right, the poster appears left
  const tx = x + Math.cos(yaw) * PANEL_SHIFT;
  const tz = z - Math.sin(yaw) * PANEL_SHIFT;
  return { position: [tx + Math.sin(yaw) * d, y - 0.05, tz + Math.cos(yaw) * d], target: [tx, y, tz] };
}

/** The robot teacher, face to face, left of its panel. */
export function robotShot(): Shot {
  const [x, , z] = ROBOT.position;
  const d = 2.8;
  const tx = x + Math.cos(ROBOT.yaw) * 0.45;
  const tz = z - Math.sin(ROBOT.yaw) * 0.45;
  return { position: [tx + Math.sin(ROBOT.yaw) * d, 1.5, tz + Math.cos(ROBOT.yaw) * d], target: [tx, 0.85, tz] };
}
