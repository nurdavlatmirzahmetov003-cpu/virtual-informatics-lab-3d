/**
 * Case-local coordinates of the ATX mid-tower (metres). Origin = centre of
 * the case box; −X is the glass side (faces the monitor / camera), +Z the
 * front panel. The motherboard lies on the tray at +X facing −X.
 */
import { PC } from '../layout';

export const [W, H, D] = PC.size;
export const T = 0.004; // sheet steel
export const FAN = 0.12;

/** Motherboard plane (ATX 305 × 244 mm). */
export const MB = { x: W / 2 - T - 0.012, y: H / 2 - 0.03 - 0.305 / 2, z: -D / 2 + 0.024 + 0.244 / 2, h: 0.305, d: 0.244 };
/** Component side of the PCB. */
export const BOARD_FACE = MB.x - 0.0008;
export const CPU = { y: MB.y + 0.07, z: MB.z - 0.015 };
export const RAM = { y: CPU.y - 0.005, z: CPU.z + 0.072, pitch: 0.0095, count: 4 };
/** pcbY: card-local height of the GPU PCB — the board's PCIe slot lines up with it. */
export const GPU = { y: MB.y - 0.045, len: 0.323, height: 0.14, thick: 0.056, z0: -D / 2 + 0.012, pcbY: 0.013 };
export const SSD = { y: MB.y - 0.102, z: MB.z - 0.01 };
export const PSU = { w: 0.15, h: 0.086, l: 0.16, x: W / 2 - T - 0.085, y: -H / 2 + T + 0.045, z: -D / 2 + T + 0.088 };
export const FRONT_FANS = { x: -0.005, z: D / 2 - 0.03, ys: [0.13, 0.005, -0.12] };

/** World-space position of the case centre. */
export const CASE_ORIGIN = [PC.position[0], PC.position[1] + PC.feet + H / 2, PC.position[2]] as const;
