import type { CameraStateName } from '@/data/camera/cameraStates';
import { KEYBOARD, MONITOR, MOUSE, PC_CENTER, DESK_TOP } from './layout';
import { PARTS } from './pc/parts';

export type ChapterId = 'setup' | 'monitor' | 'keyboard' | 'mouse' | 'pc' | 'inside' | 'exploded';

export interface Chapter {
  id: ChapterId;
  /** hero = opening copy, device = info panel with specs, exploded = per-part panel. */
  kind: 'hero' | 'device' | 'exploded';
  camera: CameraStateName;
  /** World point kept in focus (DOF) while the chapter is active. */
  focus: readonly [number, number, number];
  /** Bokeh strength: 0 = everything sharp. */
  bokeh: number;
  /** Which side of the screen the info panel sits on (the object is on the other). */
  panel: 'left' | 'right' | 'none';
  /** Spec keys under story.chapters.<id>.specs in the locale files. */
  specs: readonly string[];
  /** Hold length in timeline units (defaults to STORY_TIMING.hold). */
  hold?: number;
}

/** Timeline units: initial hold, per-chapter transition and hold, per-part step in the exploded view. */
export const STORY_TIMING = { firstHold: 0.6, transition: 1, hold: 0.8, partStep: 0.55 } as const;

export const CHAPTERS: readonly Chapter[] = [
  { id: 'setup', kind: 'hero', camera: 'HOME_WIDE', focus: [0, 0.95, -0.1], bokeh: 0, panel: 'none', specs: [] },
  {
    id: 'monitor',
    kind: 'device',
    camera: 'MONITOR',
    focus: [MONITOR.position[0], DESK_TOP + MONITOR.panelCenterY, MONITOR.position[2]],
    bokeh: 2.2,
    panel: 'right',
    specs: ['size', 'resolution', 'refresh', 'panel', 'response', 'purpose'],
  },
  {
    id: 'keyboard',
    kind: 'device',
    camera: 'KEYBOARD',
    focus: [KEYBOARD.position[0], KEYBOARD.position[1] + 0.02, KEYBOARD.position[2]],
    bokeh: 2.6,
    panel: 'right',
    specs: ['switches', 'keycaps', 'layout', 'connection', 'rgb', 'usage'],
  },
  {
    id: 'mouse',
    kind: 'device',
    camera: 'MOUSE',
    focus: [MOUSE.position[0], MOUSE.position[1] + 0.02, MOUSE.position[2]],
    bokeh: 3.2,
    panel: 'left',
    specs: ['sensor', 'dpi', 'polling', 'switches', 'connectivity', 'weight'],
  },
  {
    id: 'pc',
    kind: 'device',
    camera: 'PC_EXTERIOR',
    focus: PC_CENTER,
    bokeh: 2,
    panel: 'left',
    specs: ['formFactor', 'sidePanel', 'cooling', 'airflow', 'inside', 'purpose'],
  },
  {
    id: 'inside',
    kind: 'device',
    camera: 'PC_INTERIOR',
    focus: [PC_CENTER[0] + 0.03, PC_CENTER[1] + 0.03, PC_CENTER[2] - 0.05],
    bokeh: 1.6,
    panel: 'left',
    specs: ['board', 'cpu', 'ram', 'gpu', 'storage', 'psu'],
    hold: 1,
  },
  {
    id: 'exploded',
    kind: 'exploded',
    camera: 'EXPLODED',
    focus: [PC_CENTER[0] - 0.15, PC_CENTER[1] + 0.05, PC_CENTER[2] + 0.12],
    bokeh: 1.4,
    panel: 'left',
    specs: [],
    hold: PARTS.length * STORY_TIMING.partStep + 0.4,
  },
];

export const CHAPTER_INDEX = Object.fromEntries(CHAPTERS.map((c, i) => [c.id, i])) as Record<ChapterId, number>;

/** Total timeline length in units. */
export const STORY_LENGTH = CHAPTERS.slice(1).reduce<number>(
  (sum, c) => sum + STORY_TIMING.transition + (c.hold ?? STORY_TIMING.hold),
  STORY_TIMING.firstHold,
);

/** Scroll length of the story in viewport heights (~0.95 screen per timeline unit). */
export const STORY_SCREENS = Math.ceil(STORY_LENGTH * 0.95);
