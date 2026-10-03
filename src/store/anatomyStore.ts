import { create } from 'zustand';
import type { AnatomyCategory, AnatomyId } from '@/data/hardware/anatomy';

export type AnatomyView = 'scene' | 'list';

/** Computer Anatomy (Hardware Explorer) UI state; the 3D scene reads it in useFrame. */
interface AnatomyState {
  category: AnatomyCategory;
  selected: AnatomyId | null;
  hovered: AnatomyId | null;
  view: AnatomyView;
  /** Bumped to fly the camera back to the category overview. */
  resetToken: number;
  setCategory: (category: AnatomyCategory) => void;
  select: (id: AnatomyId | null) => void;
  hover: (id: AnatomyId | null) => void;
  setView: (view: AnatomyView) => void;
  reset: () => void;
}

export const useAnatomyStore = create<AnatomyState>()((set) => ({
  category: 'external',
  selected: null,
  hovered: null,
  view: 'scene',
  resetToken: 0,
  setCategory: (category) => set((s) => (s.category === category ? s : { category, selected: null, hovered: null })),
  select: (selected) => set({ selected }),
  hover: (hovered) => set((s) => (s.hovered === hovered ? s : { hovered })),
  setView: (view) => set({ view }),
  reset: () => set((s) => ({ selected: null, resetToken: s.resetToken + 1 })),
}));
