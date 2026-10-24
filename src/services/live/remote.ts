/**
 * Class mode in the browser (0.37): one WebSocket to /api/live/remote as
 * the projector's «screen» or the phone's «remote», reconnecting with a
 * growing delay when the network drops. Both ends must be signed in to the
 * same teacher account (the server pairs them by account).
 */
import { useEffect, useRef, useState } from 'react';

export type RemoteCommand = { t: 'zone'; dir: 1 | -1 } | { t: 'zoneTo'; zone: string } | { t: 'overview' } | { t: 'ask'; text: string } | { t: 'quiet' };
export type RemoteStatus = 'connecting' | 'open' | 'closed' | 'refused';

export function useRemoteSocket(role: 'screen' | 'remote', onMessage: (m: Record<string, unknown>) => void, enabled = true) {
  const [status, setStatus] = useState<RemoteStatus>('connecting');
  const socket = useRef<WebSocket | null>(null);
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let delay = 1000;
    let timer = 0;
    const open = () => {
      setStatus('connecting');
      const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/live/remote?role=${role}`);
      socket.current = ws;
      ws.onopen = () => {
        delay = 1000;
        setStatus('open');
      };
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(String(e.data)) as Record<string, unknown>;
          if (m.t === 'error' && m.code === 'teachersOnly') setStatus('refused');
          handler.current(m);
        } catch {
          /* not ours */
        }
      };
      ws.onclose = (e) => {
        socket.current = null;
        if (!alive) return;
        // a refusal (not a teacher, not signed in) does not get better by retrying
        if (e.code === 4003 || e.code === 1008) return setStatus('refused');
        setStatus('closed');
        timer = window.setTimeout(open, delay);
        delay = Math.min(15_000, delay * 2);
      };
    };
    open();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      socket.current?.close();
    };
  }, [role, enabled]);

  const send = (m: Record<string, unknown>) => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(m));
  };
  return { status, send };
}
