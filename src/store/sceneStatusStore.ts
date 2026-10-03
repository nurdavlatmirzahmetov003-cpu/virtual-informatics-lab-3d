import { create } from 'zustand';

/**
 * Lets the global loader know a 3D scene is mounting and when everything in
 * its Suspense boundary (textures, HDRI, models) has resolved.
 */
interface SceneStatus {
  expected: boolean;
  ready: boolean;
  setExpected: (expected: boolean) => void;
  setReady: (ready: boolean) => void;
}

export const useSceneStatus = create<SceneStatus>()((set) => ({
  expected: false,
  ready: false,
  setExpected: (expected) => set(expected ? { expected } : { expected, ready: false }),
  setReady: (ready) => set({ ready }),
}));
