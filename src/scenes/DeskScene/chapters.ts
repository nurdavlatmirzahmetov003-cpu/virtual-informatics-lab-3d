import type { CameraStateName } from '@/data/camera/cameraStates';
import { KEYBOARD, MONITOR, MOUSE, PC_CENTER, DESK_TOP } from './layout';

export type ChapterId = 'setup' | 'monitor' | 'keyboard' | 'mouse' | 'pc';

export interface Chapter {
  id: ChapterId;
  camera: CameraStateName;
  /** World point kept in focus (DOF) while the chapter is active. */
  focus: readonly [number, number, number];
  /** Bokeh strength: 0 = everything sharp. */
  bokeh: number;
  /** Which side of the screen the info panel sits on (the object is on the other). */
  panel: 'left' | 'right' | 'none';
  /** Spec keys under story.chapters.<id>.specs in the locale files. */
  specs: readonly string[];
}

export const CHAPTERS: readonly Chapter[] = [
  { id: 'setup', camera: 'HOME_WIDE', focus: [0, 0.95, -0.1], bokeh: 0, panel: 'none', specs: [] },
  {
    id: 'monitor',
    camera: 'MONITOR',
    focus: [MONITOR.position[0], DESK_TOP + MONITOR.panelCenterY, MONITOR.position[2]],
    bokeh: 2.2,
    panel: 'right',
    specs: ['size', 'resolution', 'refresh', 'panel', 'response', 'purpose'],
  },
  {
    id: 'keyboard',
    camera: 'KEYBOARD',
    focus: [KEYBOARD.position[0], KEYBOARD.position[1] + 0.02, KEYBOARD.position[2]],
    bokeh: 2.6,
    panel: 'right',
    specs: ['switches', 'keycaps', 'layout', 'connection', 'rgb', 'usage'],
  },
  {
    id: 'mouse',
    camera: 'MOUSE',
    focus: [MOUSE.position[0], MOUSE.position[1] + 0.02, MOUSE.position[2]],
    bokeh: 3.2,
    panel: 'left',
    specs: ['sensor', 'dpi', 'polling', 'switches', 'connectivity', 'weight'],
  },
  {
    id: 'pc',
    camera: 'PC_EXTERIOR',
    focus: PC_CENTER,
    bokeh: 2,
    panel: 'left',
    specs: ['formFactor', 'sidePanel', 'cooling', 'airflow', 'inside', 'purpose'],
  },
];

/** Timeline units: initial hold, per-chapter transition and hold. */
export const STORY_TIMING = { firstHold: 0.6, transition: 1, hold: 0.8 } as const;
/** Scroll length of the story in viewport heights. */
export const STORY_SCREENS = 7;
