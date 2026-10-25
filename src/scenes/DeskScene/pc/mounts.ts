/**
 * The data-driven mounting system (V4 §1.2). Every case has named mounts
 * (motherboard standoffs, PSU bay, expansion slots, fan and radiator
 * positions); every motherboard model has its slot anchors (CPU socket,
 * DIMMs, PCIe x16, M.2 — measured from the model's slot markers, see
 * scripts/extract-mounts.mjs); every part has an attach point (CPU base,
 * cooler base, a card's gold fingers, a stick's edge, a PSU's back and
 * bottom). `installBuild` aligns each attach point with its target, so a part
 * always lands where its board or case says, whatever the combination.
 *
 * Pure data and maths: the 3D scenes (home hero, exploded view, Setup Studio,
 * PC Assembly Lab) and scripts/pc-fit.test.mjs all call it.
 *
 * Frame: case-local metres, origin = centre of the case box, −X glass side,
 * +Y up, +Z front. Boards stand on the tray with their component side −X,
 * top edge +Y and I/O edge −Z; cards and sticks are perpendicular to them.
 */
import { PART_GEOMETRY } from '@/data/hardware/partGeometry.generated';
import type { PartGeometry, Vec3 } from '@/data/hardware/mountTypes';
import type { HardwareItem } from '@/data/hardware/types';
import { CASE_MOUNTS, LEGACY_MOUNTS, type CaseMounts, type FanMount } from './caseMounts';

export type { CaseMounts, FanMount, Vec3 };

/** A quarter turn about Z lays a board, card or stick model against the tray (component side −X). */
export const ON_BOARD = [0, 0, Math.PI / 2] as const;

/** A column of 120 mm fans along Y facing +Z (device displays in the 3D lab). */
export const fanColumn = (ys: readonly number[], z = 0): FanMount[] => ys.map((y) => ({ p: [0, y, z], n: [0, 0, -1], group: 'front', size: 0.12 }));

/** How far above the back of the PCB each part's contact face sits (PCB 1.6 mm + the socket / slot it rests in). */
export const SEAT = { socket: 0.0048, dimm: 0.0028, pcie: 0.0048, m2: 0.0018 } as const;
/** Gap kept under a part that stands on a panel. */
const PSU_REST = 0.001;
/** 2 sticks go in A2/B2 (slots 2 and 4), as every board manual says. */
const DIMM_FOR: Record<number, readonly number[]> = { 1: [2], 2: [2, 4], 3: [1, 2, 4], 4: [1, 2, 3, 4] };

export interface Box3Like {
  min: Vec3;
  max: Vec3;
}

/** Where one part is in the case: the centre of its bounding box, plus the box itself. */
export interface Placement {
  /** Centre of the part's bounding box (models are centred by ModelLoader). */
  p: Vec3;
  size: Vec3;
  /** The target anchor this part was aligned to, and its own attach point (both case-local; equal when installed). */
  target: Vec3;
  attach: Vec3;
}

export interface RamPlacement extends Placement {
  /** Centre of every stick, relative to `p`. */
  sticks: readonly Vec3[];
  /** One stick's box size. */
  stick: Vec3;
  /** DIMM slot numbers used (1-based). */
  slots: readonly number[];
}

export interface CoolerPlacement extends Placement {
  /** The case could not take this air cooler (too tall): an AIO is shown instead. */
  liquid: boolean;
  /** AIO: radiator centre, its long axis and the side its fans blow from. */
  radiator?: { p: Vec3; along: Vec3; normal: Vec3; mm: number };
}

export interface Installed {
  mounts: CaseMounts;
  motherboard: Placement | null;
  cpu: Placement | null;
  cooler: CoolerPlacement | null;
  ram: RamPlacement | null;
  gpu: Placement | null;
  ssd: Placement | null;
  psu: Placement | null;
  /** Case fans (radiator positions are left free when an AIO uses them). */
  fans: readonly FanMount[];
  /** Why a chosen part is not drawn (it would not fit this case). */
  skipped: Partial<Record<'motherboard' | 'gpu' | 'cooler', 'formFactor' | 'length' | 'height' | 'clearance'>>;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const r = (v: number) => Math.round(v * 1e6) / 1e6;
const round = (v: Vec3): Vec3 => [r(v[0]), r(v[1]), r(v[2])];

export function geometryOf(modelPath: string | undefined): PartGeometry | null {
  return (modelPath && PART_GEOMETRY[modelPath]) || null;
}

/** Mounts of a case model; cases without their own data use the scene's reference mid-tower. */
export function caseMountsFor(caseId?: string | null): CaseMounts {
  return (caseId && CASE_MOUNTS[caseId]) || LEGACY_MOUNTS;
}

export function boxOf(pl: Pick<Placement, 'p' | 'size'>): Box3Like {
  const h: Vec3 = [pl.size[0] / 2, pl.size[1] / 2, pl.size[2] / 2];
  return { min: sub(pl.p, h), max: add(pl.p, h) };
}

/** Placement that puts `attach` (relative to the part's box centre) on `target`. */
function align(geo: PartGeometry, attach: Vec3, target: Vec3): Placement {
  const p = round(sub(target, attach));
  return { p, size: geo.size, target: round(target), attach: round(add(p, attach)) };
}

/** A part's contact face centre: the +X side of its box (the side facing the board). */
const backFace = (geo: PartGeometry): Vec3 => [geo.size[0] / 2, 0, 0];

export interface BuildParts {
  motherboard?: HardwareItem;
  cpu?: HardwareItem;
  cooling?: HardwareItem;
  ram?: HardwareItem;
  gpu?: HardwareItem;
  ssd?: HardwareItem;
  psu?: HardwareItem;
}

/** Number of sticks in a RAM kit ("… (2 × 16 GB)"). */
export const stickCount = (ram?: HardwareItem) => Math.min(4, Math.max(1, Number(ram?.model.match(/\((\d+)\s*[×x]/)?.[1] ?? 2)));
export const isSata = (ssd?: HardwareItem) => !!ssd && /SATA/.test(ssd.model);

/**
 * Installs every chosen part in `mounts`. Parts without a measured model
 * (procedural stand-ins) return null and keep their own placement.
 */
export function installBuild(mounts: CaseMounts, build: BuildParts): Installed {
  const out: Installed = { mounts, motherboard: null, cpu: null, cooler: null, ram: null, gpu: null, ssd: null, psu: null, fans: mounts.fans, skipped: {} };
  const board = geometryOf(build.motherboard?.modelPath);
  const ff = build.motherboard?.compatibility.formFactor;
  if (board && ff && mounts.formFactors.includes(ff)) {
    // the PCB's top-rear corner (back face) on the case's reference standoff
    const corner = mounts.board.corner;
    const p = round([corner[0] - board.size[0] / 2, corner[1] - board.size[1] / 2, corner[2] + board.size[2] / 2]);
    out.motherboard = { p, size: board.size, target: corner, attach: corner };
  } else if (board) out.skipped.motherboard = 'formFactor';

  const mb = out.motherboard;
  /** A board anchor in case space, its height replaced by the seat height above the PCB back. */
  const slot = (name: string, seat: number): Vec3 | null => {
    const a = board?.anchors[name];
    if (!mb || !a) return null;
    return [mb.p[0] + board!.size[0] / 2 - seat, mb.p[1] + a[1], mb.p[2] + a[2]];
  };

  const cpu = geometryOf(build.cpu?.modelPath);
  const socket = slot('socket_cpu_1', SEAT.socket);
  if (cpu && socket) out.cpu = align(cpu, cpu.anchors.base ?? backFace(cpu), socket);

  const cooler = geometryOf(build.cooling?.modelPath);
  const liquidMm = build.cooling?.compatibility.radiatorMm;
  if (out.cpu && (cooler || liquidMm)) {
    const cpuTop: Vec3 = [out.cpu.p[0] - out.cpu.size[0] / 2, socket![1], socket![2]];
    // an air cooler must clear the glass: the case's max cooler height is measured from the board's back
    const room = mounts.board.corner[0] - mounts.main.min[0];
    const tooTall = !!cooler && coolerHeight(out.cpu, cooler, mounts) > room;
    if (cooler && !tooTall) out.cooler = { ...align(cooler, cooler.anchors.base ?? backFace(cooler), cpuTop), liquid: false };
    else {
      if (tooTall) out.skipped.cooler = 'height';
      out.cooler = liquidOn(out.cpu, socket!, mounts, liquidMm);
    }
  }

  const ram = geometryOf(build.ram?.modelPath);
  if (ram && mb) {
    const slots = DIMM_FOR[stickCount(build.ram)];
    const at = slots.map((n) => slot(`slot_dimm_${n}`, SEAT.dimm)).filter((v): v is Vec3 => !!v);
    if (at.length) {
      const centres = at.map((t) => sub(t, backFace(ram)));
      const lo = centres.reduce((m, c) => [Math.min(m[0], c[0]), Math.min(m[1], c[1]), Math.min(m[2], c[2])] as Vec3);
      const hi = centres.reduce((m, c) => [Math.max(m[0], c[0]), Math.max(m[1], c[1]), Math.max(m[2], c[2])] as Vec3);
      const p = round([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]);
      const size: Vec3 = [ram.size[0] + hi[0] - lo[0], ram.size[1] + hi[1] - lo[1], ram.size[2] + hi[2] - lo[2]];
      out.ram = { p, size, target: at[0], attach: round(add(centres[0], backFace(ram))), sticks: centres.map((c) => round(sub(c, p))), stick: ram.size, slots };
    }
  }

  const gpu = geometryOf(build.gpu?.modelPath);
  const pcie = slot('slot_pcie_x16_1', SEAT.pcie);
  if (gpu && pcie) {
    const fingers = gpu.anchors.slot_pcie_x16_1 ?? [gpu.size[0] / 2, 0, -gpu.size[2] / 4];
    const placed = align(gpu, fingers, pcie);
    const front = placed.p[2] + gpu.size[2] / 2;
    if (front > mounts.gpuClearZ) out.skipped.gpu = 'length';
    else out.gpu = placed;
  }

  // a tower cooler that would sit on the card (a wide cooler over a high first slot): the AIO takes its place
  if (out.cooler && !out.cooler.liquid && out.gpu && overlaps(boxOf(out.cooler), boxOf(out.gpu))) {
    out.skipped.cooler = 'clearance';
    out.cooler = liquidOn(out.cpu!, socket!, mounts, build.cooling?.compatibility.radiatorMm);
  }

  const ssd = geometryOf(build.ssd?.modelPath);
  if (ssd && isSata(build.ssd)) {
    const d = mounts.drive;
    out.ssd = { p: round([d[0], d[1] + ssd.size[1] / 2 + PSU_REST, d[2]]), size: ssd.size, target: d, attach: d };
  } else if (ssd) {
    const m2 = slot('slot_m2_1', SEAT.m2);
    if (m2) out.ssd = align(ssd, backFace(ssd), m2);
  }

  const psu = geometryOf(build.psu?.modelPath);
  if (psu) {
    const bay = mounts.psu;
    // back against the bay's rear wall, standing on its floor, centred across it
    const target: Vec3 = [(bay.min[0] + bay.max[0]) / 2, bay.min[1] + PSU_REST, bay.min[2]];
    out.psu = align(psu, [0, -psu.size[1] / 2, -psu.size[2] / 2], target);
  }

  if (out.cooler?.liquid && out.cooler.radiator && mounts.radiator) out.fans = mounts.fans.filter((f) => f.group !== mounts.radiator!.replaces);
  return out;
}

const overlaps = (a: Box3Like, b: Box3Like, tol = 0.001) => [0, 1, 2].every((k) => Math.min(a.max[k], b.max[k]) - Math.max(a.min[k], b.min[k]) > tol);

/** AIO pump block on the CPU, its radiator at the case's radiator mount. */
function liquidOn(cpu: Placement, socket: Vec3, mounts: CaseMounts, radiatorMm?: number): CoolerPlacement {
  const cpuTop: Vec3 = [cpu.p[0] - cpu.size[0] / 2, socket[1], socket[2]];
  const rad = mounts.radiator;
  const mm = Math.min(radiatorMm ?? 360, rad?.maxMm ?? 0);
  const pump: Vec3 = [0.03, 0.06, 0.06];
  return {
    p: round([cpuTop[0] - pump[0] / 2, cpuTop[1], cpuTop[2]]),
    size: pump,
    target: round(cpuTop),
    attach: round(cpuTop),
    liquid: true,
    radiator: rad && mm ? { p: rad.p, along: rad.along, normal: rad.normal, mm } : undefined,
  };
}

/** Height of an air cooler above the board's back, when seated on `cpu`. */
function coolerHeight(cpu: Placement, cooler: PartGeometry, mounts: CaseMounts) {
  return mounts.board.corner[0] - (cpu.p[0] - cpu.size[0] / 2 - cooler.size[0]);
}

/** Bounding boxes of every installed part in case space (each RAM stick on its own). */
export function installedBoxes(inst: Installed): Array<{ id: string; box: Box3Like }> {
  const list: Array<{ id: string; box: Box3Like }> = [];
  for (const id of ['motherboard', 'cpu', 'cooler', 'gpu', 'ssd', 'psu'] as const) {
    const pl = inst[id];
    if (pl) list.push({ id, box: boxOf(pl) });
  }
  if (inst.ram) for (const [i, s] of inst.ram.sticks.entries()) list.push({ id: `ram${inst.ram.slots[i]}`, box: boxOf({ p: add(inst.ram.p, s), size: inst.ram.stick }) });
  return list;
}
