/**
 * V4 §4.4: the wardrobe's things as geometry — a cap, headphones, a crown,
 * a graduation cap, a kalpak, glasses, a scarf, a backpack and a badge —
 * built to fit the robot's anchor (robotKit WearAnchor: where it sits and
 * how wide). Shirts are not geometry: they repaint the robot's shirt.
 * Everything a robot wears is merged into one geometry for its body and
 * one for its moving head: at most two draw calls more per robot.
 */
import { BoxGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, type BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { itemById, type WardrobeSlot } from '@/services/robots/economy';
import { mergePieces, type Piece, type Vec3 } from '../classroom/mergeParts';
import type { RobotGeometry, WearAnchor } from './robotKit';

const BLUE = '#5f7bff';
const GOLD = '#f5c542';
const DARK = '#1b2133';

/** Pieces of one item around the anchor's origin (y up, +Z forward), scaled to its size. */
function itemPieces(id: string, size: number): Piece[] {
  const s = size;
  switch (id) {
    case 'cap':
      return [
        { geo: new SphereGeometry(s * 0.52, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), scale: [1, 0.55, 1], color: BLUE },
        { geo: new CylinderGeometry(s * 0.34, s * 0.34, 0.012, 24, 1, false, -Math.PI / 2, Math.PI), at: [0, 0.006, s * 0.42], scale: [1.1, 1, 0.8], color: BLUE },
        { geo: new SphereGeometry(s * 0.05, 10, 6), at: [0, s * 0.28, 0], color: '#ffffff' },
      ];
    case 'headphones':
      return [
        { geo: new TorusGeometry(s * 0.55, s * 0.035, 8, 28, Math.PI), at: [0, -s * 0.3, 0], color: DARK },
        ...[-1, 1].map((side) => ({ geo: new CylinderGeometry(s * 0.16, s * 0.16, s * 0.12, 20), at: [side * s * 0.55, -s * 0.32, 0] as Vec3, rot: [0, 0, Math.PI / 2] as Vec3, color: '#a95cf5' })),
        ...[-1, 1].map((side) => ({ geo: new CylinderGeometry(s * 0.12, s * 0.12, s * 0.13, 20), at: [side * s * 0.555, -s * 0.32, 0] as Vec3, rot: [0, 0, Math.PI / 2] as Vec3, color: DARK })),
      ];
    case 'crown': {
      const r = s * 0.3;
      return [
        { geo: new CylinderGeometry(r, r * 0.96, s * 0.14, 28, 1, true), at: [0, s * 0.07, 0], color: GOLD },
        ...Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return { geo: new ConeGeometry(s * 0.05, s * 0.14, 8), at: [Math.sin(a) * r, s * 0.2, Math.cos(a) * r] as Vec3, color: GOLD };
        }),
        ...[0, 2, 4].map((i) => {
          const a = (i / 7) * Math.PI * 2 + Math.PI / 7;
          return { geo: new SphereGeometry(s * 0.03, 8, 6), at: [Math.sin(a) * r * 1.02, s * 0.07, Math.cos(a) * r * 1.02] as Vec3, color: i === 0 ? '#ff4d6d' : '#38d6f5' };
        }),
      ];
    }
    case 'gradcap':
      return [
        { geo: new CylinderGeometry(s * 0.36, s * 0.38, s * 0.16, 24), at: [0, s * 0.06, 0], color: DARK },
        { geo: new BoxGeometry(s * 0.9, 0.012, s * 0.9), at: [0, s * 0.15, 0], rot: [0, Math.PI / 4, 0], color: DARK },
        { geo: new SphereGeometry(s * 0.03, 8, 6), at: [0, s * 0.16, 0], color: GOLD },
        { geo: new CylinderGeometry(0.004, 0.004, s * 0.3, 6), at: [s * 0.3, s * 0.02, s * 0.12], color: GOLD },
        { geo: new SphereGeometry(s * 0.035, 8, 6), at: [s * 0.3, -s * 0.13, s * 0.12], color: GOLD },
      ];
    case 'kalpak':
      return [
        // the white felt crown and its black upturned brim, split at the front
        { geo: new CylinderGeometry(s * 0.2, s * 0.44, s * 0.62, 24), at: [0, s * 0.3, -s * 0.02], color: '#f8f5ee' },
        { geo: new CylinderGeometry(s * 0.47, s * 0.47, s * 0.12, 24, 1, true, Math.PI * 0.12, Math.PI * 1.76), at: [0, s * 0.06, -s * 0.02], color: DARK },
        { geo: new TorusGeometry(s * 0.33, 0.006, 4, 24), at: [0, s * 0.22, -s * 0.02], rot: [Math.PI / 2, 0, 0], color: GOLD },
        { geo: new SphereGeometry(s * 0.04, 10, 6), at: [0, s * 0.62, -s * 0.02], color: '#f8f5ee' },
      ];
    case 'glasses':
      return [
        // light frames: they show on the dark screen face
        ...[-1, 1].map((side) => ({ geo: new TorusGeometry(s * 0.13, s * 0.02, 6, 24), at: [side * s * 0.18, 0, 0] as Vec3, color: '#f8fafc' })),
        { geo: new BoxGeometry(s * 0.1, s * 0.028, s * 0.028), color: '#f8fafc' },
      ];
    case 'scarf':
      return [
        { geo: new TorusGeometry(s * 0.7, s * 0.28, 8, 24), rot: [Math.PI / 2, 0, 0], scale: [1, 1, 0.8], color: '#ef4444' },
        // the tail hangs over the chest, in front of the shirt
        { geo: new RoundedBoxGeometry(s * 0.45, s * 1.3, s * 0.16, 2, s * 0.06), at: [s * 0.35, -s * 0.75, s * 1.55], rot: [0.32, 0, 0.12], color: '#ef4444' },
        { geo: new BoxGeometry(s * 0.47, s * 0.1, s * 0.18), at: [s * 0.3, -s * 1.38, s * 1.75], rot: [0.32, 0, 0.12], color: '#ffffff' },
      ];
    case 'backpack':
      return [
        { geo: new RoundedBoxGeometry(s * 0.72, s * 0.85, s * 0.34, 3, s * 0.1), at: [0, 0, -s * 0.17], color: '#fb923c' },
        { geo: new RoundedBoxGeometry(s * 0.5, s * 0.36, s * 0.1, 2, s * 0.05), at: [0, -s * 0.15, -s * 0.37], color: '#f97316' },
        { geo: new CircleGeometry(s * 0.08, 12), at: [0, s * 0.18, -s * 0.345], rot: [0, Math.PI, 0], color: BLUE },
      ];
    case 'badge':
      return [
        { geo: new CylinderGeometry(s * 0.5, s * 0.5, 0.008, 20), rot: [Math.PI / 2, 0, 0], color: GOLD },
        { geo: new CircleGeometry(s * 0.34, 20), at: [0, 0, 0.0045], color: BLUE },
        { geo: new CircleGeometry(s * 0.12, 12), at: [0, 0, 0.005], color: '#ffffff' },
      ];
    default:
      return [];
  }
}

export interface WornGeometry {
  /** In robot space. */
  body: BufferGeometry | null;
  /** In the moving head's space. */
  head: BufferGeometry | null;
}

/** Everything a robot wears, merged (vertex colours). `worn`: item id per slot (shirts are ignored here). */
export function wornGeometry(geo: RobotGeometry, worn: Partial<Record<WardrobeSlot, string>>): WornGeometry {
  const body: Piece[] = [];
  const head: Piece[] = [];
  for (const [slot, id] of Object.entries(worn) as [WardrobeSlot, string][]) {
    if (slot === 'shirt' || !itemById(id)) continue;
    const anchor: WearAnchor | undefined = geo.wear[slot];
    if (!anchor) continue;
    const place = { at: anchor.at };
    for (const p of itemPieces(id, anchor.size)) (anchor.onHead ? head : body).push({ ...p, parents: [...(p.parents ?? []), place] });
  }
  return { body: body.length ? mergePieces(body, true) : null, head: head.length ? mergePieces(head, true) : null };
}

/** The shirt colour a robot wears (its own colour without a shirt item). */
export const shirtColour = (accent: string, worn: Partial<Record<WardrobeSlot, string>>) => (worn.shirt ? (itemById(worn.shirt)?.color ?? accent) : accent);
