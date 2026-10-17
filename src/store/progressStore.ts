import { useMemo } from 'react';
import { computeXp, levelOf } from '@/services/game/xp';
import { create } from 'zustand';
import type { GradeReport } from '@/services/grading';
import {
  createLocalProgressRepository,
  emptySnapshot,
  fromReport,
  applyAttempt,
  mergeSnapshots,
  summarize,
  unlockAchievements,
  type AchievementId,
  type AttemptRecord,
  type ProgressRepository,
  type ProgressSnapshot,
} from '@/services/progress';

/**
 * All graded results of every lab. Data logic lives in services/progress
 * (pure, tested); this store only holds the snapshot for React and hands it
 * to the repository on every change.
 */
interface ProgressState extends ProgressSnapshot {
  hydrated: boolean;
  /** Achievements unlocked in this session, waiting to be announced. */
  toasts: AchievementId[];
  /** XP just earned by a graded attempt (V2-11a), with the new level when it went up. */
  gains: XpGain[];
  /** Stores a graded report; returns the stored attempt. */
  record: (report: GradeReport) => AttemptRecord;
  /** Merges an imported snapshot; returns how many attempts were new. */
  importSnapshot: (s: ProgressSnapshot) => { added: number };
  /** Deletes all progress (after the user confirmed). */
  reset: () => void;
  dismissToast: (id: AchievementId) => void;
  dismissGain: (id: string) => void;
}

export interface XpGain {
  id: string;
  xp: number;
  /** Set when this attempt reached a new level. */
  level: number | null;
}

let repo: ProgressRepository = createLocalProgressRepository();

const snapshotOf = (s: ProgressSnapshot): ProgressSnapshot => ({ attempts: s.attempts, exercises: s.exercises, achievements: s.achievements, meta: s.meta });

function persist(s: ProgressSnapshot) {
  void Promise.resolve(repo.save(snapshotOf(s))).catch(() => {
    // a failing backend must not break the lab; the data stays in memory
  });
}

export const useProgressStore = create<ProgressState>()((set, get) => ({
  ...emptySnapshot(),
  hydrated: false,
  toasts: [],
  gains: [],

  record: (report) => {
    const attempt = fromReport(report);
    const before = computeXp(get().attempts).total;
    const { snapshot, unlocked } = unlockAchievements(applyAttempt(snapshotOf(get()), attempt), attempt.at);
    const after = computeXp(snapshot.attempts).total;
    const levelUp = levelOf(after).level > levelOf(before).level ? levelOf(after).level : null;
    const gains = after > before ? [...get().gains, { id: attempt.id, xp: after - before, level: levelUp }] : get().gains;
    set({ ...snapshot, toasts: [...get().toasts, ...unlocked], gains });
    persist(snapshot);
    return attempt;
  },

  importSnapshot: (incoming) => {
    const before = new Set(get().attempts.map((a) => a.id));
    // imported achievements count as earned earlier, so they are not announced again
    const { snapshot, unlocked } = unlockAchievements(mergeSnapshots(snapshotOf(get()), incoming));
    set({ ...snapshot, toasts: [...get().toasts, ...unlocked] });
    persist(snapshot);
    return { added: snapshot.attempts.filter((a) => !before.has(a.id)).length };
  },

  reset: () => {
    // keep the "prototype already imported" mark, or it would come back on reload
    const snapshot = { ...emptySnapshot(), meta: { createdAt: Date.now(), legacyImported: true } };
    set({ ...snapshot, toasts: [], gains: [] });
    void Promise.resolve(repo.clear()).then(() => persist(snapshot));
  },

  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t !== id) }),
  dismissGain: (id) => set({ gains: get().gains.filter((g) => g.id !== id) }),
}));

/**
 * Loads stored progress. Anything recorded before loading finished (async
 * backends) is merged, not lost. Achievements earned by migrated data are
 * unlocked silently.
 */
export function hydrateProgress(): Promise<void> {
  const apply = (loaded: ProgressSnapshot) => {
    const state = useProgressStore.getState();
    const merged = state.attempts.length ? mergeSnapshots(loaded, snapshotOf(state)) : loaded;
    const { snapshot } = unlockAchievements(merged);
    useProgressStore.setState({ ...snapshot, hydrated: true });
    persist(snapshot);
  };
  const loaded = repo.load();
  // localStorage answers synchronously: the first render already has the data
  if (loaded instanceof Promise) return loaded.then(apply);
  apply(loaded);
  return Promise.resolve();
}

let unwatch: (() => void) | undefined;

/**
 * Swaps the storage backend (tests, the signed-in student's account) and
 * reloads. `keepCurrent` (default) merges what is on screen into the new
 * backend — a guest's work moves into the account on sign-in; `false` starts
 * from the new backend alone (sign-out: the next person sees nothing of the last).
 */
export function setProgressRepository(next: ProgressRepository, { keepCurrent = true }: { keepCurrent?: boolean } = {}) {
  repo = next;
  if (!keepCurrent) useProgressStore.setState({ ...emptySnapshot(), hydrated: false });
  unwatch?.();
  // another tab changed the data: take it as is (it already contains this tab's saves)
  unwatch = repo.watch?.(() => {
    void Promise.resolve(repo.load()).then((s) => useProgressStore.setState({ ...s, hydrated: true }));
  });
  return hydrateProgress();
}

void setProgressRepository(repo);

/** Memoised summary of the current progress (tasks, labs, totals). */
export function useProgressSummary() {
  const exercises = useProgressStore((s) => s.exercises);
  return useMemo(() => summarize({ exercises }), [exercises]);
}
