import { create } from 'zustand';

export type AssemblyPhase = 'assembling' | 'done';
/** What the finished setup shows: whole desk orbit, PC with the glass off, or the exploded parts. */
export type AssemblyView = 'orbit' | 'inside' | 'exploded';

/** Final setup assembly + presentation (not persisted: every visit replays the assembly). */
interface AssemblyState {
  phase: AssemblyPhase;
  /** Bumped to replay the whole sequence. */
  runId: number;
  /** Bumped by "Skip": the timeline jumps to its end. */
  skipToken: number;
  /** Index / count / id of the step currently playing (UI caption). */
  step: { index: number; total: number; id: string };
  view: AssemblyView;
  autoRotate: boolean;
  configOpen: boolean;
  setStep: (step: AssemblyState['step']) => void;
  finish: () => void;
  skip: () => void;
  replay: () => void;
  setView: (view: AssemblyView) => void;
  toggleAutoRotate: () => void;
  toggleConfig: () => void;
}

export const useAssemblyStore = create<AssemblyState>()((set) => ({
  phase: 'assembling',
  runId: 0,
  skipToken: 0,
  step: { index: 0, total: 0, id: 'start' },
  view: 'orbit',
  autoRotate: true,
  configOpen: true,
  setStep: (step) => set({ step }),
  finish: () => set({ phase: 'done', view: 'orbit', autoRotate: true, configOpen: true }),
  skip: () => set((s) => ({ skipToken: s.skipToken + 1 })),
  replay: () => set((s) => ({ phase: 'assembling', runId: s.runId + 1, view: 'orbit', step: { index: 0, total: 0, id: 'start' } })),
  setView: (view) => set((s) => ({ view, autoRotate: view === 'orbit' ? !s.autoRotate || s.view !== 'orbit' : false })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  toggleConfig: () => set((s) => ({ configOpen: !s.configOpen })),
}));
