/**
 * Real-time class events (V2-12): one WebSocket per signed-in browser on
 * /api/events/ws.
 *
 *   - Students' sockets only mark them online (presence) in their classes.
 *   - Teachers receive the presence and the graded attempts of the students
 *     of their own classes, the moment the progress sync stores them.
 *   - Admins receive the same for every class.
 *
 * Nothing is sent to a socket about a class it may not see. Events carry the
 * student's display name, never their login or anything else.
 */
import type { Db } from '../db';
import type { UserRow } from '../users';
import type { WsConn } from './ws';

export type ClassEvent =
  | { t: 'presence'; classIds: string[]; studentId: string; online: boolean }
  | { t: 'attempt'; classIds: string[]; studentId: string; name: string; exerciseId: string; percent: number; completed: boolean; at: number };

interface Sub {
  conn: WsConn;
  user: UserRow;
}

/** Most messages a socket may send per 10 s (it has nothing to say but pings). */
const FLOOD = 20;

export class EventHub {
  private readonly db: Db;
  private readonly subs = new Set<Sub>();
  /** Open student sockets per student id. */
  private readonly online = new Map<string, number>();

  constructor({ db }: { db: Db }) {
    this.db = db;
  }

  /** Classes a student belongs to. */
  classesOf(studentId: string): string[] {
    return (this.db.prepare('SELECT class_id FROM class_members WHERE user_id = ?').all(studentId) as Array<{ class_id: string }>).map((r) => r.class_id);
  }

  /** Classes a teacher may watch (all classes for an admin: null), read when needed so new classes count at once. */
  private watched(user: UserRow): Set<string> | null {
    if (user.role === 'admin') return null;
    return new Set((this.db.prepare('SELECT id FROM classes WHERE teacher_id = ?').all(user.id) as Array<{ id: string }>).map((r) => r.id));
  }

  connect(user: UserRow, conn: WsConn) {
    if (user.role === 'student') {
      this.markOnline(user.id, +1);
      conn.onClose(() => this.markOnline(user.id, -1));
      conn.send({ t: 'hello', role: 'student' });
    } else {
      const sub: Sub = { conn, user };
      this.subs.add(sub);
      conn.onClose(() => this.subs.delete(sub));
      conn.send({ t: 'hello', role: user.role, online: this.onlineIn(this.watched(user)) });
    }
    let count = 0;
    let since = Date.now();
    conn.onMessage(() => {
      const now = Date.now();
      if (now - since > 10_000) {
        since = now;
        count = 0;
      }
      if (++count > FLOOD) conn.close(1008, 'flood');
    });
  }

  /** Online students of the given classes (all classes for null), as class id → student ids. */
  onlineIn(classes: Set<string> | null): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const [studentId, n] of this.online) {
      if (n <= 0) continue;
      for (const c of this.classesOf(studentId)) {
        if (classes && !classes.has(c)) continue;
        (out[c] ??= []).push(studentId);
      }
    }
    return out;
  }

  isOnline(studentId: string) {
    return (this.online.get(studentId) ?? 0) > 0;
  }

  private markOnline(studentId: string, delta: number) {
    const before = this.online.get(studentId) ?? 0;
    const after = Math.max(0, before + delta);
    if (after) this.online.set(studentId, after);
    else this.online.delete(studentId);
    if ((before > 0) !== (after > 0)) this.publish({ t: 'presence', classIds: this.classesOf(studentId), studentId, online: after > 0 });
  }

  /** Sends an event to every teacher / admin socket allowed to see one of its classes. */
  publish(event: ClassEvent) {
    if (!event.classIds.length || !this.subs.size) return;
    const owner = new Map<string, string | undefined>(
      event.classIds.map((c) => [c, (this.db.prepare('SELECT teacher_id FROM classes WHERE id = ?').get(c) as { teacher_id: string } | undefined)?.teacher_id]),
    );
    for (const s of this.subs) {
      const visible = s.user.role === 'admin' ? event.classIds : event.classIds.filter((c) => owner.get(c) === s.user.id);
      if (visible.length && s.conn.open) s.conn.send({ ...event, classIds: visible });
    }
  }

  get size() {
    return { sockets: this.subs.size, online: [...this.online.values()].filter((n) => n > 0).length };
  }
}
