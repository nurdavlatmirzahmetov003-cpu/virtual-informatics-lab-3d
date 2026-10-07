/**
 * Computer Anatomy display layout (metres, same desk as the hero scene).
 * External devices sit where they stand in the hero setup; internal parts
 * are laid out flat on an anti-static bench mat in two rows (large parts at
 * the back, small ones in front). GLBs are the optimised hero assets —
 * nothing extra is downloaded for this page.
 */
import type { ComponentProps } from 'react';
import type { ModelLoader } from '@/components/3d/ModelLoader';
import type { AnatomyCategory, AnatomyId } from '@/data/hardware/anatomy';
import { DESK_TOP, HEADSET, KEYBOARD, MONITOR, MOUSE, SPEAKERS } from '@/scenes/DeskScene/layout';

type Vec3 = readonly [number, number, number];
export type Fit = NonNullable<ComponentProps<typeof ModelLoader>['fit']>;

export interface AnatomyModel {
  file: string;
  fit: Fit;
  /** Offset from the item origin (item-local, before magnify). */
  position?: Vec3;
  rotationY?: number;
  /** Fan rotor: spins around its local Y axis. */
  spin?: boolean;
}

export interface AnatomyPlacement {
  id: AnatomyId;
  /** Base of the item on the desk / mat (world). */
  position: Vec3;
  rotationY?: number;
  /** Display scale for parts too small to read at desk distance (1 = true size). */
  magnify?: number;
  /** True height of the displayed object — hotspot and camera focus sit on it. */
  height: number;
  /** Hotspot height above the base when the top would collide with a neighbour (true size). */
  hotspotY?: number;
  /** Camera distance when the item is focused. */
  distance: number;
  /** Licensed GLB(s); omitted → procedural [PLACEHOLDER] from placeholders.tsx. */
  models?: readonly AnatomyModel[];
}

export const BENCH = { size: [1.62, 0.66] as const, z: -0.01, thickness: 0.004 };
const BENCH_TOP = DESK_TOP + BENCH.thickness;
const R = Math.PI;

const monitorFit: Fit = { axis: 0, size: 0.7, align: 'floor' };
const keyboardFit: Fit = { axis: 0, size: 0.405, align: 'floor' };
const mouseFit: Fit = { axis: 2, size: 0.122, rotation: [0, R, 0], align: 'floor' };
const headsetFit: Fit = { axis: 1, size: 0.225, align: 'floor', offset: [0, 0.045, 0] };
const speakerFit: Fit = { axis: 1, size: 0.15, align: 'floor' };

const boardFit: Fit = { axis: 2, size: 0.305, rotation: [-R / 2, 0, 0], align: 'floor' };
const cpuFit: Fit = { axis: 0, size: 0.04, rotation: [-R / 2, 0, 0], align: 'floor' };
const ramFit: Fit = { axis: 0, size: 0.133, rotation: [0, R / 2, R / 2], align: 'floor' };
const gpuFit: Fit = { axis: 0, size: 0.323, align: 'floor' };
const ssdFit: Fit = { axis: 0, size: 0.08, rotation: [-R / 2, 0, 0], align: 'floor' };
const psuFit: Fit = { axis: 0, size: 0.15, align: 'floor' };
const coolerFit: Fit = { axis: 1, size: 0.158, align: 'floor' };
const fanFrameFit: Fit = { axis: 0, size: 0.12 };
const fanRotorFit: Fit = { axis: 0, size: 0.0935 };

export const PLACEMENTS: Record<AnatomyCategory, readonly AnatomyPlacement[]> = {
  external: [
    { id: 'monitor', position: MONITOR.position, height: 0.41, hotspotY: 0.24, distance: 1.05, models: [{ file: 'monitor_ultrawide', fit: monitorFit }] },
    { id: 'keyboard', position: KEYBOARD.position, height: 0.03, distance: 0.62, models: [{ file: 'keyboard_mech', fit: keyboardFit }] },
    { id: 'mouse', position: MOUSE.position, rotationY: MOUSE.yaw, height: 0.04, distance: 0.34, models: [{ file: 'mouse_gaming', fit: mouseFit }] },
    { id: 'headset', position: HEADSET.position, rotationY: HEADSET.yaw, height: 0.27, distance: 0.62, models: [{ file: 'headset_gaming', fit: headsetFit }] },
    { id: 'microphone', position: [-0.53, DESK_TOP, 0.13], rotationY: 0.35, height: 0.23, distance: 0.5 },
    { id: 'webcam', position: [MONITOR.position[0], DESK_TOP + 0.405, MONITOR.position[2] + 0.01], height: 0.045, distance: 0.34 },
    {
      id: 'speaker',
      position: SPEAKERS.left.position,
      height: 0.15,
      distance: 0.5,
      models: [
        { file: 'speakers#speaker_left', fit: speakerFit, rotationY: SPEAKERS.left.yaw },
        {
          file: 'speakers#speaker_right',
          fit: speakerFit,
          rotationY: SPEAKERS.right.yaw,
          position: [SPEAKERS.right.position[0] - SPEAKERS.left.position[0], 0, SPEAKERS.right.position[2] - SPEAKERS.left.position[2]],
        },
      ],
    },
    { id: 'printer', position: [0.64, DESK_TOP, -0.1], rotationY: -0.22, height: 0.2, distance: 0.85 },
  ],
  internal: [
    { id: 'motherboard', position: [-0.08, BENCH_TOP, -0.12], height: 0.04, distance: 0.62, models: [{ file: 'motherboard_x570', fit: boardFit }] },
    { id: 'cpu', position: [-0.12, BENCH_TOP, 0.17], magnify: 2.5, height: 0.005, distance: 0.3, models: [{ file: 'cpu_am4', fit: cpuFit }] },
    { id: 'ram', position: [0.13, BENCH_TOP, 0.16], rotationY: 0.12, height: 0.008, distance: 0.36, models: [{ file: 'ram_rgb', fit: ramFit }] },
    { id: 'gpu', position: [0.31, BENCH_TOP, -0.16], rotationY: -0.08, height: 0.056, distance: 0.62, models: [{ file: 'gpu_triple_fan', fit: gpuFit }] },
    { id: 'ssd', position: [-0.36, BENCH_TOP, 0.17], rotationY: -0.1, magnify: 1.6, height: 0.004, distance: 0.3, models: [{ file: 'ssd_m2', fit: ssdFit }] },
    { id: 'hdd', position: [-0.41, BENCH_TOP, -0.16], rotationY: 0.08, height: 0.026, distance: 0.42 },
    { id: 'psu', position: [-0.64, BENCH_TOP, -0.14], rotationY: 0.18, height: 0.086, distance: 0.5, models: [{ file: 'psu', fit: psuFit }] },
    { id: 'cooler', position: [0.63, BENCH_TOP, -0.14], rotationY: -0.35, height: 0.158, distance: 0.52, models: [{ file: 'cooler_tower', fit: coolerFit }] },
    {
      id: 'fans',
      position: [0.4, BENCH_TOP, 0.15],
      height: 0.026,
      distance: 0.4,
      models: [
        { file: 'fan_frame', fit: fanFrameFit, position: [0, 0.0129, 0] },
        { file: 'fan_rotor', fit: fanRotorFit, position: [0, 0.0129, 0], spin: true },
      ],
    },
    { id: 'nic', position: [-0.63, BENCH_TOP, 0.16], rotationY: 0.25, height: 0.018, distance: 0.36 },
  ],
};

export const OVERVIEW = { external: 'ANATOMY_EXTERNAL', internal: 'ANATOMY_INTERNAL' } as const;

/** `speakers#speaker_left` → …/speakers.glb#speaker_left (one node of a shared file). */
export const modelUrl = (file: string) => `${import.meta.env.BASE_URL}assets/models/hardware/${file.replace(/(#|$)/, '.glb$1')}`;

/** Centre of an item for hotspots and camera focus (world). */
export function itemCenter(p: AnatomyPlacement): [number, number, number] {
  return [p.position[0], p.position[1] + (p.height * (p.magnify ?? 1)) / 2, p.position[2]];
}
