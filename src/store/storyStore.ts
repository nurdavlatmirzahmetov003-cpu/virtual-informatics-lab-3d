import { create } from 'zustand';

/** UI-facing scroll story state (the 3D scene reads `storyRig` instead). */
interface StoryState {
  chapter: number;
  setChapter: (chapter: number) => void;
}

export const useStoryStore = create<StoryState>()((set) => ({
  chapter: 0,
  setChapter: (chapter) => set((s) => (s.chapter === chapter ? s : { chapter })),
}));
