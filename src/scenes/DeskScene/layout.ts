/**
 * Physical layout of the desk setup (metres). Desk top surface is at
 * DESK_TOP; +Z points toward the viewer, −Z toward the wall.
 * Camera states in `data/camera/cameraStates.ts` are framed on these values.
 */
export const DESK_TOP = 0.75;
export const DESK = { width: 1.8, depth: 0.8, thickness: 0.035 } as const;

export const MAT = { position: [0.04, DESK_TOP, 0.16], size: [0.92, 0.38], thickness: 0.003 } as const;
export const MAT_TOP = DESK_TOP + MAT.thickness;

export const MONITOR = { position: [-0.06, DESK_TOP, -0.2], panelCenterY: 0.32 } as const;
export const KEYBOARD = { position: [-0.1, MAT_TOP, 0.17] } as const;
export const MOUSE = { position: [0.31, MAT_TOP, 0.18], yaw: -0.14 } as const;
export const PC = { position: [0.67, DESK_TOP, -0.06], size: [0.23, 0.47, 0.45], feet: 0.014 } as const;
export const SPEAKERS = {
  left: { position: [-0.5, DESK_TOP, -0.2], yaw: 0.28 },
  right: { position: [0.35, DESK_TOP, -0.24], yaw: -0.22 },
} as const;
export const HEADSET = { position: [-0.74, DESK_TOP, 0.06], yaw: 0.5 } as const;

/** World-space centre of the PC case (useful for camera framing / lights). */
export const PC_CENTER = [PC.position[0], DESK_TOP + PC.feet + PC.size[1] / 2, PC.position[2]] as const;
