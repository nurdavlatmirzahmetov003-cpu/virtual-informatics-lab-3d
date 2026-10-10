import { create } from 'zustand';
import type { LabZoneId } from '@/data/lab/zones';
import { stepZone } from '@/lib/lab/navigation';

interface LabState {
  /** Focused zone; null = overview of the whole hall. */
  focus: LabZoneId | null;
  /** Zone under the pointer or keyboard focus (highlight only). */
  hovered: LabZoneId | null;
  /** Bumped to re-run the flight to the current shot (e.g. "reset camera"). */
  flightToken: number;
  /** Zoom / orbit nudges from the keyboard and on-screen buttons, consumed by LabCamera. */
  nudge: { zoom: number; orbit: number };
  focusZone: (zone: LabZoneId | null) => void;
  step: (dir: 1 | -1) => void;
  hover: (zone: LabZoneId | null) => void;
  resetView: () => void;
  zoom: (dir: 1 | -1) => void;
  orbit: (dir: 1 | -1) => void;
}

export const useLabStore = create<LabState>()((set, get) => ({
  focus: null,
  hovered: null,
  flightToken: 0,
  nudge: { zoom: 0, orbit: 0 },
  focusZone: (focus) => set((s) => ({ focus, flightToken: s.flightToken + 1 })),
  step: (dir) => get().focusZone(stepZone(get().focus, dir)),
  hover: (hovered) => set({ hovered }),
  resetView: () => set((s) => ({ flightToken: s.flightToken + 1 })),
  zoom: (dir) => set((s) => ({ nudge: { ...s.nudge, zoom: s.nudge.zoom + dir } })),
  orbit: (dir) => set((s) => ({ nudge: { ...s.nudge, orbit: s.nudge.orbit + dir } })),
}));

/** Camera pose for the minimap, written every frame by LabCamera (no React re-render). */
export const labCameraPose = { x: 0, z: 0, yaw: 0 };
