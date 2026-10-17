/** Leaderboards and contests API (V2-11a); shapes mirror server/game.ts. */
import { call } from '@/services/auth/api';

export interface BoardRow {
  rank: number;
  /** null: the student chose (or the site requires) to stay anonymous. */
  name: string | null;
  xp: number;
  level: number;
  me: boolean;
}

export interface Board {
  scope: 'class' | 'school';
  period: 'week' | 'all';
  title: string;
  weekStart: number;
  rows: BoardRow[];
  anonymous: boolean;
}

export interface GameMe {
  anon: boolean;
  forcedAnon: boolean;
  enabled: boolean;
  boards: { classes: Array<{ id: string; name: string }>; school: { id: string; name: string } | null };
}

export interface ContestInfo {
  id: string;
  title: string;
  startsAt: number;
  endsAt: number;
  status: 'upcoming' | 'live' | 'finished';
  canDelete: boolean;
}

export interface ContestRow {
  classId: string;
  name: string;
  teacher: string;
  students: number;
  active: number;
  total: number;
  average: number;
  mine: boolean;
  rank: number;
}

export interface ContestListItem extends ContestInfo {
  leader: string | null;
  classes: number;
  myRank: number | null;
}

const enc = encodeURIComponent;

export const gameApi = {
  me: () => call<GameMe>('/api/game/me'),
  setAnon: (anon: boolean, csrf: string) => call<{ anon: boolean }>('/api/game/me', { method: 'PATCH', body: { anon }, csrf }),
  board: (scope: 'class' | 'school', id: string | null, period: 'week' | 'all') => call<Board>(`/api/game/board?scope=${scope}&period=${period}${id ? `&id=${enc(id)}` : ''}`),
  contests: () => call<{ contests: ContestListItem[] }>('/api/game/contests'),
  contest: (id: string) => call<{ contest: ContestInfo; rows: ContestRow[] }>(`/api/game/contests/${enc(id)}`),
  contestClasses: () => call<{ classes: Array<{ id: string; name: string; teacher: string }> }>('/api/game/contest-classes'),
  createContest: (input: { title: string; classIds: string[]; startsAt: number; endsAt: number }, csrf: string) => call<{ id: string }>('/api/game/contests', { method: 'POST', body: input, csrf }),
  deleteContest: (id: string, csrf: string) => call<{ ok: true }>(`/api/game/contests/${enc(id)}`, { method: 'DELETE', csrf }),
};
