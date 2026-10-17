/**
 * Real-time class events in the browser (V2-12): one WebSocket per signed-in
 * tab on /api/events/ws, reconnecting by itself (1 → 2 → 4 … 30 s). For a
 * student it only marks them online; teachers and admins keep who is online
 * per class and a short feed of graded attempts, which their pages read.
 */
import { create } from 'zustand';

export interface AttemptEvent {
  t: 'attempt';
  classIds: string[];
  studentId: string;
  name: string;
  exerciseId: string;
  percent: number;
  completed: boolean;
  at: number;
}

interface LiveEventsState {
  connected: boolean;
  /** Online students per class (teachers / admins only). */
  online: Record<string, string[]>;
  /** Newest graded attempts first, at most 40. */
  feed: AttemptEvent[];
  /** Bumped on every attempt, so a page can refresh what it shows. */
  version: number;
}

export const useLiveEvents = create<LiveEventsState>()(() => ({ connected: false, online: {}, feed: [], version: 0 }));

let socket: WebSocket | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let attempt = 0;
let wanted = false;

function handle(raw: string) {
  let m: Record<string, unknown>;
  try {
    m = JSON.parse(raw);
  } catch {
    return;
  }
  if (m.t === 'hello') useLiveEvents.setState({ online: (m.online as Record<string, string[]>) ?? {} });
  else if (m.t === 'presence') {
    const { classIds, studentId, online } = m as { classIds: string[]; studentId: string; online: boolean };
    useLiveEvents.setState((s) => {
      const next = { ...s.online };
      for (const c of classIds) {
        const list = (next[c] ?? []).filter((id) => id !== studentId);
        next[c] = online ? [...list, studentId] : list;
      }
      return { online: next };
    });
  } else if (m.t === 'attempt') useLiveEvents.setState((s) => ({ feed: [m as unknown as AttemptEvent, ...s.feed].slice(0, 40), version: s.version + 1 }));
}

function open() {
  if (!wanted || socket) return;
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/events/ws`);
  socket = ws;
  ws.onopen = () => {
    attempt = 0;
    useLiveEvents.setState({ connected: true });
  };
  ws.onmessage = (e) => handle(String(e.data));
  ws.onclose = () => {
    socket = null;
    useLiveEvents.setState({ connected: false });
    if (!wanted) return;
    timer = setTimeout(open, Math.min(30_000, 1000 * 2 ** attempt++));
  };
}

/** Opens the connection (signed in) or closes it (signed out). */
export function setLiveEvents(on: boolean) {
  wanted = on;
  if (on) open();
  else {
    if (timer) clearTimeout(timer);
    timer = null;
    socket?.close();
    socket = null;
    useLiveEvents.setState({ connected: false, online: {}, feed: [] });
  }
}
