import type { PartId } from '@/scenes/DeskScene/pc/parts';

/** Desk-side pieces the assembly brings in, each 0 (absent) … 1 (in place). */
export type PieceKey =
  | 'monitorStand'
  | 'monitor'
  | 'mat'
  | 'keyboard'
  | 'mouse'
  | 'speakers'
  | 'headsetStand'
  | 'headset'
  | 'chair'
  | 'pcCase';

export const PIECES: readonly PieceKey[] = ['monitorStand', 'monitor', 'mat', 'keyboard', 'mouse', 'speakers', 'headsetStand', 'headset', 'chair', 'pcCase'];

/** PC internals in install order; the front fans ship with the case. */
export const INSTALL_ORDER: readonly PartId[] = ['motherboard', 'cpu', 'ram', 'ssd', 'cooler', 'psu', 'gpu'];

const emptyPieces = () => Object.fromEntries(PIECES.map((k) => [k, 0])) as Record<PieceKey, number>;
const emptyParts = () => Object.fromEntries(INSTALL_ORDER.map((k) => [k, 0])) as Record<PartId, number>;

/**
 * Animated state of the final setup assembly. SetupAssemblyTimeline (GSAP)
 * writes it, the 3D components read it in useFrame — no React re-render per
 * frame. `presented` = everything in place (static scenes and skipped runs).
 */
export const assemblyRig = {
  pieces: emptyPieces(),
  /** 0 = not installed yet (hidden), 1 = seated in the case. */
  parts: emptyParts(),
  /** Side glass: 0 closed … 1 off. */
  glassOpen: 0,
  cables: 0,
  fanSpeed: 0,
  rgb: 0,
  interior: 0,
  monitorOn: 0,
  /** Room light level (scales environment + key lights). */
  light: 0.5,
  /** Camera position / target, tweened between named shots. */
  camera: { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 },
};

export function resetAssemblyRig(presented: boolean) {
  const v = presented ? 1 : 0;
  for (const k of PIECES) assemblyRig.pieces[k] = v;
  for (const k of INSTALL_ORDER) assemblyRig.parts[k] = v;
  assemblyRig.glassOpen = 0;
  assemblyRig.cables = v;
  assemblyRig.fanSpeed = v;
  assemblyRig.rgb = v;
  assemblyRig.interior = v;
  assemblyRig.monitorOn = v;
  assemblyRig.light = presented ? 0.85 : 0.5;
}
