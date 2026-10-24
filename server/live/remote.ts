/**
 * Class mode (0.37): the projector shows the 3D lab, the teacher's phone is
 * the remote. Both are signed in to the same teacher (or admin) account and
 * open WS /api/live/remote?role=screen|remote; a remote's commands go to
 * that account's screens, the screens' state goes back to its remotes.
 * Nothing crosses between accounts, students cannot connect, and every
 * message is checked for shape — a remote can only move the camera between
 * zones or ask Bit something, exactly as the teacher could on the screen.
 */
import type { UserRow } from '../users';
import type { WsConn } from './ws';
import { LAB_ZONES } from '@/data/lab/zones';

export type RemoteRole = 'screen' | 'remote';
export const isRemoteRole = (v: unknown): v is RemoteRole => v === 'screen' || v === 'remote';

const ZONES = new Set<string>(LAB_ZONES.map((z) => z.id));

export type RemoteCommand = { t: 'zone'; dir: 1 | -1 } | { t: 'zoneTo'; zone: string } | { t: 'overview' } | { t: 'ask'; text: string } | { t: 'quiet' };

/** A command from a phone, or null when it is not one. */
export function asCommand(v: unknown): RemoteCommand | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (m.t === 'zone' && (m.dir === 1 || m.dir === -1)) return { t: 'zone', dir: m.dir };
  if (m.t === 'zoneTo' && typeof m.zone === 'string' && ZONES.has(m.zone)) return { t: 'zoneTo', zone: m.zone };
  if (m.t === 'overview') return { t: 'overview' };
  if (m.t === 'quiet') return { t: 'quiet' };
  if (m.t === 'ask' && typeof m.text === 'string' && m.text.trim() && m.text.length <= 200) return { t: 'ask', text: m.text.trim() };
  return null;
}

/** What a screen tells the phones: the zone on screen and whether Bit is talking. */
function asState(v: unknown): { t: 'state'; zone: string | null; speaking: boolean; sentence: string } | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  if (m.t !== 'state') return null;
  return {
    t: 'state',
    zone: typeof m.zone === 'string' && ZONES.has(m.zone) ? m.zone : null,
    speaking: m.speaking === true,
    sentence: typeof m.sentence === 'string' ? m.sentence.slice(0, 300) : '',
  };
}

/** Messages a connection may send per 10 s (a remote's taps, a screen's state updates). */
const FLOOD = 60;

export class RemoteHub {
  private readonly sockets = new Map<string, { screen: Set<WsConn>; remote: Set<WsConn> }>();

  private of(userId: string) {
    let s = this.sockets.get(userId);
    if (!s) this.sockets.set(userId, (s = { screen: new Set(), remote: new Set() }));
    return s;
  }

  /** Counts for the phones: how many screens are listening. */
  private presence(userId: string) {
    const s = this.of(userId);
    for (const r of s.remote) if (r.open) r.send({ t: 'presence', screens: s.screen.size });
    for (const sc of s.screen) if (sc.open) sc.send({ t: 'presence', remotes: s.remote.size });
  }

  connect(user: UserRow, role: RemoteRole, conn: WsConn) {
    if (user.role !== 'teacher' && user.role !== 'admin') {
      conn.send({ t: 'error', code: 'teachersOnly' });
      return conn.close(4003, 'teachersOnly');
    }
    const group = this.of(user.id);
    group[role].add(conn);
    conn.onClose(() => {
      group[role].delete(conn);
      if (!group.screen.size && !group.remote.size) this.sockets.delete(user.id);
      else this.presence(user.id);
    });
    let count = 0;
    let since = Date.now();
    conn.onMessage((data) => {
      const now = Date.now();
      if (now - since > 10_000) {
        since = now;
        count = 0;
      }
      if (++count > FLOOD) return conn.close(1008, 'flood');
      if (role === 'remote') {
        const cmd = asCommand(data);
        if (!cmd) return conn.send({ t: 'error', code: 'badCommand' });
        for (const s of group.screen) if (s.open) s.send({ t: 'command', command: cmd });
        conn.send({ t: 'sent', screens: group.screen.size });
      } else {
        const state = asState(data);
        if (state) for (const r of group.remote) if (r.open) r.send(state);
      }
    });
    this.presence(user.id);
  }

  get size() {
    return [...this.sockets.values()].reduce((n, s) => n + s.screen.size + s.remote.size, 0);
  }
}
