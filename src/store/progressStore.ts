import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage, STORAGE_KEYS, STORAGE_VERSIONS } from '@/lib/storage';
import { isAssessment, type Assessment } from '@/lib/labs/assessment';

interface ProgressState {
  attempts: Assessment[];
  /** Lifetime best scores survive trimming the recent-attempt history. */
  best: Assessment[];
  record: (assessment: Assessment) => void;
}
const memory = new Map<string,string>();
function restoreResults(raw: unknown) {
  const saved = raw as { attempts?: unknown; best?: unknown } | null;
  const attempts = Array.isArray(saved?.attempts) ? saved.attempts.filter(isAssessment) : [];
  const best = Array.isArray(saved?.best) ? saved.best.filter(isAssessment) : [];
  return { attempts: attempts.slice(-200), best: bestResults([...best,...attempts]) };
}
export const useProgressStore = create<ProgressState>()(persist((set) => ({
  attempts: [],
  best: [],
  record: (a) => { if (isAssessment(a)) set(s => ({ attempts: [...s.attempts,a].slice(-200), best: bestResults([...s.best,a]) })); },
}), { name: STORAGE_KEYS.progress, version: STORAGE_VERSIONS.progress, storage: createJSONStorage(() => safeStorage() ?? {
  getItem: k => memory.get(k) ?? null, setItem: (k,v) => void memory.set(k,v), removeItem: k => void memory.delete(k),
}),
  partialize: s => ({ attempts: s.attempts, best: s.best }),
  migrate: restoreResults,
  merge: (raw,current) => {
    return { ...current, ...restoreResults(raw) };
  },
}));

export function bestResults(attempts: readonly Assessment[]) {
  const best = new Map<string, Assessment>();
  for (const a of attempts) if (!best.has(a.exercise) || a.score > best.get(a.exercise)!.score) best.set(a.exercise,a);
  return [...best.values()];
}
