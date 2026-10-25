import { BITLAB_PANORAMA, COOL_BITLAB_AERO, GPU_BITLAB_AERO, MB_BITLAB_AERO, PSU_BITLAB_AERO, RAM_BITLAB_AERO } from '@/data/hardware/house';
import { resolveBuild, type ResolvedBuild } from './build';

let cached: ResolvedBuild | null = null;

/**
 * The PC shown where the student has not chosen one (home hero and exploded
 * view, PC Assembly Lab, Connect Lab, teardown): the V4 white showcase build
 * (BitLab Panorama with the white AERO board, card, RAM and 360 mm AIO) with
 * a real catalog CPU and SSD.
 */
export function showcaseBuild(): ResolvedBuild {
  return (cached ??= {
    ...resolveBuild({ cpu: 'cpu-amd-r7-7800x3d', ssd: 'ssd-samsung-990-pro-2tb' }),
    case: BITLAB_PANORAMA,
    motherboard: MB_BITLAB_AERO,
    gpu: GPU_BITLAB_AERO,
    ram: RAM_BITLAB_AERO,
    cooling: COOL_BITLAB_AERO,
    psu: PSU_BITLAB_AERO,
  });
}
