import { create } from 'zustand';
import type { LabZoneId } from '@/data/lab/zones';
import { stepZone } from '@/lib/lab/navigation';
import { deviceById } from '@/data/devices/devices';

interface LabState {
  /** Focused zone; null = overview of the whole hall. */
  focus: LabZoneId | null;
  /** Zone under the pointer or keyboard focus (highlight only). */
  hovered: LabZoneId | null;
  /** Device whose info panel / 360° viewer is open (V2-4a). */
  device: string | null;
  /** Device under the pointer (its display pad glows). */
  hoveredDevice: string | null;
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
  /** Open a device: flies to its zone (if needed) and opens the viewer. */
  openDevice: (id: string) => void;
  closeDevice: () => void;
  hoverDevice: (id: string | null) => void;
}

export const useLabStore = create<LabState>()((set, get) => ({
  focus: null,
  hovered: null,
  device: null,
  hoveredDevice: null,
  flightToken: 0,
  nudge: { zoom: 0, orbit: 0 },
  // leaving a zone also closes its device
  focusZone: (focus) => set((s) => ({ focus, flightToken: s.flightToken + 1, device: s.device && deviceById(s.device)?.zone === focus ? s.device : null })),
  step: (dir) => get().focusZone(stepZone(get().focus, dir)),
  hover: (hovered) => set({ hovered }),
  resetView: () => set((s) => ({ flightToken: s.flightToken + 1 })),
  zoom: (dir) => set((s) => ({ nudge: { ...s.nudge, zoom: s.nudge.zoom + dir } })),
  orbit: (dir) => set((s) => ({ nudge: { ...s.nudge, orbit: s.nudge.orbit + dir } })),
  openDevice: (id) => {
    const zone = deviceById(id)?.zone;
    if (!zone) return;
    set((s) => (s.focus === zone ? { device: id } : { device: id, focus: zone, flightToken: s.flightToken + 1 }));
  },
  closeDevice: () => set({ device: null }),
  hoverDevice: (hoveredDevice) => set((s) => (s.hoveredDevice === hoveredDevice ? s : { hoveredDevice })),
}));

/** Camera pose for the minimap, written every frame by LabCamera (no React re-render). */
export const labCameraPose = { x: 0, z: 0, yaw: 0 };
