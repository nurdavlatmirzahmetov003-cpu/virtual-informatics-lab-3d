/**
 * Games arena in the browser (0.36). Signed in: the server hands out the
 * seed and referees the answers (server/arcade.ts). As a guest or offline:
 * the same rules run here and the record stays in this browser.
 */
import { call } from '@/services/auth/api';
import { ARCADE_GAMES, newSeed, scoreRun, type ArcadeGame, type ArcadeResult } from '@/labs/Arcade';
import { STORAGE_NAMESPACE, safeStorage } from '@/lib/storage';
import { useAuthStore } from '@/store/authStore';

export interface Run {
  game: ArcadeGame;
  seed: number;
  /** Server run id; null: a local (guest / offline) run. */
  runId: string | null;
  startedAt: number;
}

export interface Finish {
  result: ArcadeResult;
  best: number;
  previousBest: number | null;
  /** Saved on the server (the leaderboards count it). */
  ranked: boolean;
}

export interface BoardRow {
  rank: number;
  name: string | null;
  score: number;
  me: boolean;
}

export interface Board {
  game: ArcadeGame;
  scope: 'class' | 'school';
  period: 'week' | 'all';
  title: string;
  rows: BoardRow[];
  me: BoardRow | null;
}

export interface Boards {
  classes: Array<{ id: string; name: string }>;
  school: { id: string; name: string } | null;
}

const LOCAL_KEY = `${STORAGE_NAMESPACE}:arcade`;

/** Local records (guest / offline), per game. */
export function localBests(): Partial<Record<ArcadeGame, number>> {
  try {
    const raw = JSON.parse(safeStorage()?.getItem(LOCAL_KEY) ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(ARCADE_GAMES.filter((g) => typeof raw[g] === 'number').map((g) => [g, raw[g] as number]));
  } catch {
    return {};
  }
}

function saveLocalBest(game: ArcadeGame, score: number) {
  const all = { ...localBests(), [game]: Math.max(localBests()[game] ?? 0, score) };
  try {
    safeStorage()?.setItem(LOCAL_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked: the record is just not kept */
  }
}

const signedIn = () => useAuthStore.getState().status === 'signedIn';
const csrf = () => useAuthStore.getState().csrf ?? '';

/** Starts a run; a seed from a challenge link makes the same rounds as the friend's. */
export async function startRun(game: ArcadeGame, seed?: number): Promise<Run> {
  if (signedIn()) {
    try {
      const r = await call<{ runId: string; seed: number }>('/api/arcade/start', { method: 'POST', body: { game, seed }, csrf: csrf() });
      return { game, seed: r.seed, runId: r.runId, startedAt: Date.now() };
    } catch {
      /* offline: play locally */
    }
  }
  return { game, seed: seed ?? newSeed(), runId: null, startedAt: Date.now() };
}

/** Ends a run. Throws ApiError with the referee's reason (tooFast, expired…) for a refused server run. */
export async function finishRun(run: Run, answers: unknown[]): Promise<Finish> {
  if (run.runId) {
    const r = await call<{ result: ArcadeResult; best: number; previousBest: number | null }>('/api/arcade/finish', { method: 'POST', body: { runId: run.runId, answers }, csrf: csrf() });
    return { ...r, ranked: true };
  }
  const verdict = scoreRun(run.game, run.seed, answers, Date.now() - run.startedAt);
  if (!verdict.ok) throw Object.assign(new Error(verdict.reason), { code: verdict.reason });
  const previousBest = localBests()[run.game] ?? null;
  saveLocalBest(run.game, verdict.result.score);
  return { result: verdict.result, previousBest, best: Math.max(previousBest ?? 0, verdict.result.score), ranked: false };
}

export const arcadeApi = {
  me: () => call<{ bests: Partial<Record<ArcadeGame, number>>; boards: Boards; enabled: boolean }>('/api/arcade/me'),
  board: (game: ArcadeGame, scope: 'class' | 'school', id: string | null, period: 'week' | 'all') =>
    call<Board>(`/api/arcade/board?game=${game}&scope=${scope}&period=${period}${id ? `&id=${encodeURIComponent(id)}` : ''}`),
};
