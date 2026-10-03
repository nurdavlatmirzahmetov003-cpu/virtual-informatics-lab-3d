import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';
import { isAssessment, type Assessment } from '@/lib/labs/assessment';

interface ProgressState {
  attempts: Assessment[];
  record: (assessment: Assessment) => void;
}
const memory = new Map<string,string>();
export const useProgressStore = create<ProgressState>()(persist((set) => ({
  attempts: [],
  record: (a) => { if (isAssessment(a)) set(s => ({ attempts: [...s.attempts,a].slice(-200) })); },
}), { name: 'vil3d:progress', version: 1, storage: createJSONStorage(() => safeStorage() ?? {
  getItem: k => memory.get(k) ?? null, setItem: (k,v) => void memory.set(k,v), removeItem: k => void memory.delete(k),
}),
  partialize: s => ({ attempts: s.attempts }),
  merge: (raw,current) => {
    const saved = raw as { attempts?: unknown } | null;
    return { ...current, attempts: Array.isArray(saved?.attempts) ? saved.attempts.filter(isAssessment).slice(-200) : [] };
  },
}));

export function bestResults(attempts: readonly Assessment[]) {
  const best = new Map<string, Assessment>();
  for (const a of attempts) if (!best.has(a.exercise) || a.score > best.get(a.exercise)!.score) best.set(a.exercise,a);
  return [...best.values()];
}
