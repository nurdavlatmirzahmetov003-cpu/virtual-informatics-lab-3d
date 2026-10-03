import { create } from 'zustand';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import type { DeviceId } from '@/scenes/DeskScene/devices';

export type ViewMode = 'story' | 'explore';

/**
 * PC exploration state shared by the 3D scene and the HTML overlay.
 * `story` = scroll-driven camera; `explore` = free 360° orbit with hotspots.
 */
interface PcState {
  mode: ViewMode;
  /** Part highlighted by the scroll story (exploded chapter). */
  storyPart: PartId | null;
  /** Part chosen by click / hotspot in explore mode. */
  selectedPart: PartId | null;
  selectedDevice: DeviceId | null;
  hoveredPart: PartId | null;
  autoRotate: boolean;
  /** Explore mode: parts spread out (true) or assembled (false). */
  exploded: boolean;
  /** Incremented to request a camera reset. */
  resetToken: number;
  setStoryPart: (id: PartId | null) => void;
  enterExplore: (part?: PartId | null) => void;
  enterDevice: (device: DeviceId) => void;
  exitExplore: () => void;
  selectPart: (id: PartId | null) => void;
  hoverPart: (id: PartId | null) => void;
  toggleAutoRotate: () => void;
  toggleExploded: () => void;
  resetCamera: () => void;
}

export const usePcStore = create<PcState>()((set) => ({
  mode: 'story',
  storyPart: null,
  selectedPart: null,
  selectedDevice: null,
  hoveredPart: null,
  autoRotate: false,
  exploded: true,
  resetToken: 0,
  setStoryPart: (storyPart) => set((s) => (s.storyPart === storyPart ? s : { storyPart })),
  enterExplore: (part = null) => set({ mode: 'explore', selectedPart: part, selectedDevice: null, hoveredPart: null, exploded: true }),
  enterDevice: (selectedDevice) => set({ mode: 'explore', selectedDevice, selectedPart: null, hoveredPart: null, exploded: false }),
  exitExplore: () => set({ mode: 'story', selectedPart: null, selectedDevice: null, hoveredPart: null, autoRotate: false }),
  selectPart: (selectedPart) => set({ selectedPart, selectedDevice: null }),
  hoverPart: (hoveredPart) => set((s) => (s.hoveredPart === hoveredPart ? s : { hoveredPart })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleExploded: () => set((s) => ({ exploded: !s.exploded })),
  resetCamera: () => set((s) => ({ resetToken: s.resetToken + 1, selectedPart: null })),
}));

/** Part that should be emphasised right now (read inside useFrame). */
export function activePart(): PartId | null {
  const s = usePcStore.getState();
  return s.mode === 'explore' ? (s.selectedPart ?? s.hoveredPart) : s.storyPart;
}
