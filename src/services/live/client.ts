/**
 * Live games in the browser (V2-11b): the REST calls a teacher needs and
 * `useLive(code)` — one WebSocket to the room that reconnects by itself
 * (1 → 2 → 4 → 8 s) after a dropped network, and keeps the server's clock
 * offset so every countdown matches the referee.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { call } from '@/services/auth/api';
import type { QuizTopic } from '@/labs/LiveGames/quiz';
import type { GameKind, Symptoms } from '@/labs/LiveGames/races';

export interface LivePlayer {
  id: string;
  name: string | null;
  me: boolean;
  connected: boolean;
  rank: number;
  /** quiz: points; race: seconds with penalties (null until finished) */
  score: number | null;
  progress: number;
  mistakes: number;
  done: boolean;
  answered: boolean;
}

export interface LiveRoom {
  id: string;
  code: string;
  kind: GameKind;
  title: string;
  status: 'lobby' | 'running' | 'finished';
  hostName: string;
  isHost: boolean;
  players: LivePlayer[];
  quiz: null | {
    index: number;
    total: number;
    phase: 'idle' | 'question' | 'reveal';
    deadline: number;
    limitMs: number;
    question: { base: string; device: string; order: Array<'a' | 'b' | 'c'>; pick: string[] | null } | null;
    answered: number;
    myAnswer: number | null;
    reveal: { correct: number; counts: number[]; myPoints: number } | null;
    myScore: number | null;
    myCorrect: number | null;
  };
  race: null | {
    startsAt: number;
    endsAt: number;
    rounds: number;
    me: null | {
      progress: number;
      mistakes: number;
      done: boolean;
      installed: string[] | null;
      plugged: Record<string, string> | null;
      round: number | null;
      symptoms: Symptoms | null;
      seconds: number | null;
    };
  };
}

export interface Feedback {
  ok: boolean;
  message: { key: string; params?: Record<string, string> } | null;
  at: number;
}

export const liveApi = {
  topics: () => call<{ topics: Record<QuizTopic, number> }>('/api/live/topics'),
  create: (input: { kind: GameKind; title: string; classId?: string | null; topics?: QuizTopic[]; count?: number; seconds?: number; minutes?: number }, csrf: string) =>
    call<{ id: string; code: string }>('/api/live/rooms', { method: 'POST', body: input, csrf }),
  rooms: () =>
    call<{
      rooms: Array<{ id: string; code: string; kind: GameKind; title: string; status: string; players: number; createdAt: number }>;
      past: Array<{ id: string; kind: GameKind; title: string; finishedAt: number; players: number }>;
    }>('/api/live/rooms'),
  close: (id: string, csrf: string) => call<{ ok: true }>(`/api/live/rooms/${encodeURIComponent(id)}`, { method: 'DELETE', csrf }),
  session: (id: string) =>
    call<{ session: { id: string; kind: GameKind; title: string; finishedAt: number }; results: Array<{ rank: number; score: number | null; name: string; login: string; detail: Record<string, number> }> }>(
      `/api/live/sessions/${encodeURIComponent(id)}`,
    ),
};

/** Codes after which reconnecting makes no sense. */
const FATAL = new Set(['notFound', 'started', 'studentsOnly', 'full', 'notInClass', 'closed']);

export type LiveStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export function useLive(code: string | null) {
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [status, setStatus] = useState<LiveStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [offset, setOffset] = useState(0);
  const sock = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!code) return;
    let stopped = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const connect = () => {
      const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/live/ws?code=${encodeURIComponent(code)}`;
      const ws = new WebSocket(url);
      sock.current = ws;
      ws.onopen = () => {
        attempt = 0;
        setStatus('open');
      };
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data as string);
        if (m.t === 'state') {
          setRoom(m.room);
          setOffset(m.serverNow - Date.now());
          setError(null);
        } else if (m.t === 'feedback') setFeedback({ ok: m.ok, message: m.message, at: Date.now() });
        else if (m.t === 'error') {
          setError(m.code);
          if (FATAL.has(m.code)) stopped = true;
        }
      };
      ws.onclose = () => {
        sock.current = null;
        if (stopped) return setStatus('closed');
        setStatus('reconnecting');
        timer = setTimeout(connect, Math.min(8000, 1000 * 2 ** attempt++));
      };
    };
    connect();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      sock.current?.close();
    };
  }, [code]);

  const send = useCallback((m: Record<string, unknown>) => {
    if (sock.current?.readyState === WebSocket.OPEN) sock.current.send(JSON.stringify(m));
  }, []);

  return { room, status, error, feedback, offset, send };
}
