/**
 * Live rooms (V2-11b): a teacher's live quiz or race, with students joined
 * by code. The server is the referee — questions keep their right answer
 * until the reveal, points come from the server's own clock, and every race
 * move goes through the labs' pure logic (labs/LiveGames). Rooms live in
 * memory while they run; a finished game is written to live_sessions /
 * live_results. A dropped connection just reconnects: the student is found
 * by their account and gets the full state again.
 */
import { randomUUID } from 'node:crypto';
import type { Db } from '../db';
import { HttpError } from '../http';
import { audit } from '../audit';
import type { UserRow } from '../users';
import { joinCode, normalizeJoinCode } from '../names';
import type { WsConn } from './ws';
import { QUIZ_TOPICS, buildQuiz, quizPoints, type LiveQuestion, type QuizTopic } from '@/labs/LiveGames/quiz';
import { deviceQuiz } from '@/labs/Arcade';
import { GAME_KINDS, MOVE_TYPES, applyMove, asMove, faultOrder, newRacer, raceSeconds, rankRacers, symptomsOf, type GameKind, type Move, type RaceKind, type RacerState } from '@/labs/LiveGames/races';
import type { FaultId } from '@/labs/SystemSim/faults';

export const MAX_PLAYERS = 60;
/** live_sessions.kind of each game (its CHECK allows quiz, assembly, connect, fault). */
const STORED_KIND: Readonly<Record<GameKind, 'quiz' | 'assembly' | 'connect' | 'fault'>> = { quiz: 'quiz', device: 'quiz', assembly: 'assembly', connect: 'connect', fault: 'fault', phone: 'assembly', laptop: 'assembly', network: 'connect' };
/** Answer slots of a question: four device names, or a, b, c. */
const optionCount = (q: LiveQuestion | undefined) => q?.pick?.length ?? q?.order.length ?? 0;
const COUNTDOWN_MS = 3000;
const KEEP_FINISHED_MS = 30 * 60_000;
const LOBBY_TTL_MS = 3 * 3_600_000;

interface Player {
  id: string;
  name: string;
  anon: boolean;
  joinedAt: number;
  sockets: Set<WsConn>;
  score: number;
  correct: number;
  answers: Map<number, { slot: number; at: number; points: number }>;
  racer: RacerState | null;
  finishedAt: number | null;
}

interface QuizState {
  questions: LiveQuestion[];
  limitMs: number;
  index: number;
  phase: 'idle' | 'question' | 'reveal';
  startedAt: number;
  deadline: number;
}

interface RaceState {
  startsAt: number;
  endsAt: number;
  faults: FaultId[];
  /** The room's seed: the network race's router ports (0.37). */
  seed: number;
}

export interface Room {
  id: string;
  code: string;
  kind: GameKind;
  title: string;
  hostId: string;
  hostName: string;
  classId: string | null;
  createdAt: number;
  status: 'lobby' | 'running' | 'finished';
  startedAt: number | null;
  finishedAt: number | null;
  players: Map<string, Player>;
  hostSockets: Set<WsConn>;
  quiz: QuizState | null;
  race: RaceState | null;
  timer: ReturnType<typeof setTimeout> | null;
  sessionId: string | null;
}

export interface CreateInput {
  kind?: unknown;
  title?: unknown;
  classId?: unknown;
  topics?: unknown;
  count?: unknown;
  seconds?: unknown;
  minutes?: unknown;
}

export interface HubOptions {
  db: Db;
  now?: () => number;
  /** Whether students see each other's names (site setting). */
  anonymous?: () => boolean;
}

export class LiveHub {
  private rooms = new Map<string, Room>();
  private readonly db: Db;
  private readonly now: () => number;
  private readonly anonymous: () => boolean;

  constructor({ db, now = Date.now, anonymous = () => false }: HubOptions) {
    this.db = db;
    this.now = now;
    this.anonymous = anonymous;
  }

  // ── rooms ────────────────────────────────────────────────────────────────

  create(host: UserRow, input: CreateInput): Room {
    const kind = GAME_KINDS.find((k) => k === input.kind);
    if (!kind) throw new HttpError(400, 'badKind');
    const title = typeof input.title === 'string' ? input.title.trim() : '';
    if (!title || title.length > 80) throw new HttpError(400, 'badTitle');
    let classId: string | null = null;
    if (input.classId) {
      const cls = this.db.prepare('SELECT id, teacher_id FROM classes WHERE id = ?').get(String(input.classId)) as { id: string; teacher_id: string } | undefined;
      if (!cls || (host.role !== 'admin' && cls.teacher_id !== host.id)) throw new HttpError(400, 'badClass');
      classId = cls.id;
    }
    const seed = Math.floor(Math.random() * 2 ** 31);
    let quiz: QuizState | null = null;
    let race: RaceState | null = null;
    if (kind === 'device') {
      const count = Number(input.count ?? 10);
      const seconds = Number(input.seconds ?? 20);
      if (!Number.isInteger(count) || count < 3 || count > 30) throw new HttpError(400, 'badCount');
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 60) throw new HttpError(400, 'badSeconds');
      quiz = { questions: deviceQuiz(count, seed), limitMs: seconds * 1000, index: -1, phase: 'idle', startedAt: 0, deadline: 0 };
    } else if (kind === 'quiz') {
      const topics = Array.isArray(input.topics) ? input.topics.filter((t): t is QuizTopic => (QUIZ_TOPICS as readonly unknown[]).includes(t)) : [];
      const count = Number(input.count ?? 10);
      const seconds = Number(input.seconds ?? 20);
      if (!topics.length) throw new HttpError(400, 'badTopics');
      if (!Number.isInteger(count) || count < 3 || count > 30) throw new HttpError(400, 'badCount');
      if (!Number.isInteger(seconds) || seconds < 5 || seconds > 60) throw new HttpError(400, 'badSeconds');
      const questions = buildQuiz(topics, count, seed);
      if (!questions.length) throw new HttpError(400, 'badTopics');
      quiz = { questions, limitMs: seconds * 1000, index: -1, phase: 'idle', startedAt: 0, deadline: 0 };
    } else {
      const minutes = Number(input.minutes ?? 8);
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 30) throw new HttpError(400, 'badMinutes');
      race = { startsAt: 0, endsAt: minutes * 60_000, faults: kind === 'fault' ? faultOrder(seed) : [], seed };
    }
    let code = joinCode();
    while ([...this.rooms.values()].some((r) => r.code === code)) code = joinCode();
    const room: Room = {
      id: randomUUID(),
      code,
      kind,
      title,
      hostId: host.id,
      hostName: host.display_name,
      classId,
      createdAt: this.now(),
      status: 'lobby',
      startedAt: null,
      finishedAt: null,
      players: new Map(),
      hostSockets: new Set(),
      quiz,
      race,
      timer: null,
      sessionId: null,
    };
    this.rooms.set(room.id, room);
    this.sweep();
    return room;
  }

  /** The host's rooms still in memory (newest first). */
  roomsOf(host: UserRow) {
    this.sweep();
    return [...this.rooms.values()]
      .filter((r) => host.role === 'admin' || r.hostId === host.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => ({ id: r.id, code: r.code, kind: r.kind, title: r.title, status: r.status, players: r.players.size, createdAt: r.createdAt }));
  }

  close(host: UserRow, id: string) {
    const room = this.rooms.get(id);
    if (!room || (host.role !== 'admin' && room.hostId !== host.id)) throw new HttpError(404, 'notFound');
    if (room.status !== 'finished') this.finish(room);
    for (const s of [...room.hostSockets, ...[...room.players.values()].flatMap((p) => [...p.sockets])]) s.close(1000, 'closed');
    this.rooms.delete(id);
  }

  /** Drops finished rooms after a while and lobbies nobody started. */
  private sweep() {
    const now = this.now();
    for (const r of this.rooms.values()) {
      if ((r.status === 'finished' && r.finishedAt && now - r.finishedAt > KEEP_FINISHED_MS) || (r.status === 'lobby' && now - r.createdAt > LOBBY_TTL_MS)) {
        if (r.timer) clearTimeout(r.timer);
        this.rooms.delete(r.id);
      }
    }
  }

  // ── connections ──────────────────────────────────────────────────────────

  /** A socket arrives with a room code; the user becomes the host's screen, a (returning) player, or is refused. */
  connect(user: UserRow, code: string, conn: WsConn) {
    const c = normalizeJoinCode(code);
    const room = [...this.rooms.values()].find((r) => r.code === c);
    if (!room) return this.refuse(conn, 'notFound');
    if (room.hostId === user.id || user.role === 'admin') {
      room.hostSockets.add(conn);
      conn.onClose(() => room.hostSockets.delete(conn));
      conn.onMessage((m) => this.guard(conn, () => this.hostMessage(room, m)));
      this.sendState(room, conn, null);
      return;
    }
    let player = room.players.get(user.id);
    if (!player) {
      if (user.role !== 'student') return this.refuse(conn, 'studentsOnly');
      if (room.status !== 'lobby') return this.refuse(conn, 'started');
      if (room.players.size >= MAX_PLAYERS) return this.refuse(conn, 'full');
      if (room.classId && !this.db.prepare('SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?').get(room.classId, user.id)) return this.refuse(conn, 'notInClass');
      player = {
        id: user.id,
        name: user.display_name,
        anon: !!user.leaderboard_anon,
        joinedAt: this.now(),
        sockets: new Set(),
        score: 0,
        correct: 0,
        answers: new Map(),
        racer: room.race ? newRacer(room.kind as RaceKind, room.race.seed) : null,
        finishedAt: null,
      };
      room.players.set(user.id, player);
    }
    const p = player;
    p.sockets.add(conn);
    conn.onClose(() => {
      p.sockets.delete(conn);
      this.broadcast(room);
    });
    conn.onMessage((m) => this.guard(conn, () => this.playerMessage(room, p, conn, m)));
    this.broadcast(room);
  }

  private refuse(conn: WsConn, code: string) {
    conn.send({ t: 'error', code });
    conn.close(4000, code);
  }

  /** Per-connection flood limit (20 messages / 2 s), then the message itself. */
  private buckets = new WeakMap<WsConn, { n: number; since: number }>();
  private guard(conn: WsConn, fn: () => void) {
    const now = this.now();
    const b = this.buckets.get(conn) ?? { n: 0, since: now };
    if (now - b.since > 2000) {
      b.n = 0;
      b.since = now;
    }
    b.n++;
    this.buckets.set(conn, b);
    if (b.n > 20) return conn.send({ t: 'error', code: 'slowDown' });
    try {
      fn();
    } catch (e) {
      conn.send({ t: 'error', code: e instanceof HttpError ? e.code : 'server' });
    }
  }

  // ── messages ─────────────────────────────────────────────────────────────

  private hostMessage(room: Room, m: unknown) {
    const msg = m as { t?: string };
    if (msg.t === 'start' && room.status === 'lobby') return this.start(room);
    if (msg.t === 'next' && room.status === 'running' && room.quiz) return this.nextQuestion(room);
    if (msg.t === 'reveal' && room.quiz?.phase === 'question') return this.reveal(room);
    if (msg.t === 'end' && room.status === 'running') return this.finish(room);
  }

  private playerMessage(room: Room, p: Player, conn: WsConn, m: unknown) {
    const msg = m as Record<string, unknown>;
    if (msg.t === 'answer') return this.answer(room, p, Number(msg.slot), conn);
    const move = room.race ? asMove(msg) : null;
    if (move && MOVE_TYPES[room.kind as RaceKind].includes(move.t)) return this.move(room, p, move, conn);
  }

  private start(room: Room) {
    if (!room.players.size) throw new HttpError(400, 'noPlayers');
    room.status = 'running';
    room.startedAt = this.now();
    if (room.quiz) return this.nextQuestion(room);
    const race = room.race!;
    const limit = race.endsAt;
    race.startsAt = this.now() + COUNTDOWN_MS;
    race.endsAt = race.startsAt + limit;
    this.schedule(room, race.endsAt - this.now(), () => this.finish(room));
    this.broadcast(room);
  }

  private schedule(room: Room, ms: number, fn: () => void) {
    if (room.timer) clearTimeout(room.timer);
    room.timer = setTimeout(() => {
      room.timer = null;
      fn();
    }, Math.max(0, ms));
    room.timer.unref?.();
  }

  private nextQuestion(room: Room) {
    const q = room.quiz!;
    if (q.phase === 'question') return;
    q.index++;
    if (q.index >= q.questions.length) return this.finish(room);
    q.phase = 'question';
    q.startedAt = this.now();
    q.deadline = q.startedAt + q.limitMs;
    this.schedule(room, q.limitMs, () => this.reveal(room));
    this.broadcast(room);
  }

  private answer(room: Room, p: Player, slot: number, conn: WsConn) {
    const q = room.quiz;
    const now = this.now();
    const options = q ? optionCount(q.questions[q.index]) : 0;
    if (!q || q.phase !== 'question' || now > q.deadline || p.answers.has(q.index) || !Number.isInteger(slot) || slot < 0 || slot >= options) return conn.send({ t: 'error', code: 'notNow' });
    const right = slot === q.questions[q.index].correct;
    const points = quizPoints(right, q.deadline - now, q.limitMs);
    p.answers.set(q.index, { slot, at: now, points });
    p.score += points;
    if (right) p.correct++;
    // everyone connected has answered: no need to wait for the clock
    const waiting = [...room.players.values()].some((x) => x.sockets.size > 0 && !x.answers.has(q.index));
    if (!waiting) return this.reveal(room);
    this.broadcast(room);
  }

  private reveal(room: Room) {
    const q = room.quiz!;
    if (q.phase !== 'question') return;
    q.phase = 'reveal';
    if (room.timer) clearTimeout(room.timer);
    room.timer = null;
    this.broadcast(room);
  }

  private move(room: Room, p: Player, move: Move, conn: WsConn) {
    const race = room.race;
    const now = this.now();
    if (!race || room.status !== 'running' || now < race.startsAt || !p.racer || p.racer.done) return conn.send({ t: 'error', code: 'notNow' });
    const r = applyMove(room.kind as RaceKind, p.racer, move, race.faults, race.seed);
    p.racer = r.state;
    if (r.state.done && p.finishedAt === null) p.finishedAt = now;
    conn.send({ t: 'feedback', ok: r.ok, message: r.message ?? null });
    if ([...room.players.values()].every((x) => x.racer?.done)) return this.finish(room);
    this.broadcast(room);
  }

  private finish(room: Room) {
    if (room.status === 'finished') return;
    if (room.timer) clearTimeout(room.timer);
    room.timer = null;
    if (room.quiz && room.quiz.phase === 'question') room.quiz.phase = 'reveal';
    room.status = 'finished';
    room.finishedAt = this.now();
    this.persist(room);
    this.broadcast(room);
  }

  // ── results ──────────────────────────────────────────────────────────────

  standings(room: Room) {
    if (room.quiz) {
      const list = [...room.players.values()].sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt);
      const out: Array<{ p: Player; rank: number; score: number | null }> = [];
      list.forEach((p, i) => out.push({ p, rank: i > 0 && list[i - 1].score === p.score ? out[i - 1].rank : i + 1, score: p.score }));
      return out;
    }
    const start = room.race?.startsAt ?? 0;
    const ranked = rankRacers(
      [...room.players.values()].map((p) => ({ p, seconds: raceSeconds(start, p.finishedAt, p.racer?.mistakes ?? 0), progress: p.racer?.progress ?? 0, mistakes: p.racer?.mistakes ?? 0 })),
    );
    return ranked.map((r) => ({ p: r.p, rank: r.rank, score: r.seconds }));
  }

  private persist(room: Room) {
    if (!room.players.size) return;
    const id = randomUUID();
    room.sessionId = id;
    // the table's CHECK predates the newer kinds: «What device is this?» is stored as a quiz, the 0.37 races
    // as the race their results read like (build → assembly, network → connect); `detail.kind` keeps the real one
    this.db.prepare('INSERT INTO live_sessions (id, kind, title, host_id, class_id, started_at, finished_at, players) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, STORED_KIND[room.kind], room.title, room.hostId, room.classId, room.startedAt, room.finishedAt, room.players.size);
    const put = this.db.prepare('INSERT INTO live_results (session_id, user_id, rank, score, detail) VALUES (?, ?, ?, ?, ?)');
    for (const s of this.standings(room)) {
      const detail = room.quiz ? { correct: s.p.correct, of: room.quiz.questions.length } : { mistakes: s.p.racer?.mistakes ?? 0, progress: s.p.racer?.progress ?? 0, kind: room.kind };
      put.run(id, s.p.id, s.rank, s.score, JSON.stringify(detail));
    }
    audit(this.db, 'live.finish', { actor: room.hostId, target: id, detail: `${room.kind} ${room.players.size}` }, this.now());
  }

  // ── state to the screens ────────────────────────────────────────────────

  private broadcast(room: Room) {
    for (const s of room.hostSockets) this.sendState(room, s, null);
    for (const p of room.players.values()) for (const s of p.sockets) this.sendState(room, s, p);
  }

  /** What one screen may see: the host everything but answers in play; a player their own detail. */
  snapshot(room: Room, viewer: Player | null) {
    const q = room.quiz;
    const showNames = viewer === null || !this.anonymous();
    const standings = this.standings(room);
    const players = standings.map(({ p, rank, score }, i) => ({
      id: viewer === null || p.id === viewer.id ? p.id : `p${i}`,
      name: p.id === viewer?.id || (showNames && !p.anon) || viewer === null ? p.name : null,
      me: p.id === viewer?.id,
      connected: p.sockets.size > 0,
      rank,
      score,
      progress: p.racer?.progress ?? (q ? p.answers.size / q.questions.length : 0),
      mistakes: p.racer?.mistakes ?? 0,
      done: p.racer?.done ?? false,
      answered: q ? p.answers.has(q.index) : false,
    }));
    const question = q && q.index >= 0 && q.index < q.questions.length ? q.questions[q.index] : null;
    const revealed = q?.phase === 'reveal' || room.status === 'finished';
    const counts = question ? Array.from({ length: optionCount(question) }, (_, slot) => slot).map((slot) => [...room.players.values()].filter((p) => p.answers.get(q!.index)?.slot === slot).length) : null;
    const mine = viewer && q ? viewer.answers.get(q.index) : undefined;
    const race = room.race;
    const r = viewer?.racer;
    return {
      t: 'state',
      serverNow: this.now(),
      room: {
        id: room.id,
        code: room.code,
        kind: room.kind,
        title: room.title,
        status: room.status,
        hostName: room.hostName,
        isHost: viewer === null,
        players,
        quiz: q && {
          index: q.index,
          total: q.questions.length,
          phase: q.phase,
          deadline: q.deadline,
          limitMs: q.limitMs,
          question: question && { base: question.base, device: question.device, order: question.order, pick: question.pick ?? null },
          answered: [...room.players.values()].filter((p) => p.answers.has(q.index)).length,
          myAnswer: mine?.slot ?? null,
          reveal: revealed && question ? { correct: question.correct, counts, myPoints: mine?.points ?? 0 } : null,
          myScore: viewer?.score ?? null,
          myCorrect: viewer?.correct ?? null,
        },
        race: race && {
          startsAt: race.startsAt,
          endsAt: race.endsAt,
          rounds: race.faults.length,
          seed: race.seed,
          me: r && {
            progress: r.progress,
            mistakes: r.mistakes,
            done: r.done,
            installed: r.assembly?.installed ?? null,
            plugged: r.plugs?.plugged ?? null,
            built: r.built ?? null,
            links: r.net ? r.net.links.map((l) => [`${l.a.device}.${l.a.port}`, `${l.b.device}.${l.b.port}`]) : null,
            round: r.round ?? null,
            // the fault race shows the symptoms of the current round, never its cause
            symptoms: room.kind === 'fault' && room.status === 'running' && r.round !== undefined && r.round < race.faults.length ? symptomsOf(race.faults[r.round]) : null,
            seconds: viewer ? raceSeconds(race.startsAt, viewer.finishedAt, r.mistakes) : null,
          },
        },
      },
    };
  }

  private sendState(room: Room, conn: WsConn, viewer: Player | null) {
    conn.send(this.snapshot(room, viewer));
  }

  /** For tests and the REST layer. */
  roomById = (id: string) => this.rooms.get(id);
}

/** Past games of a host (or every game for an admin), newest first. */
export function pastSessions(db: Db, host: UserRow) {
  const rows = (
    host.role === 'admin'
      ? db.prepare('SELECT * FROM live_sessions ORDER BY finished_at DESC LIMIT 30').all()
      : db.prepare('SELECT * FROM live_sessions WHERE host_id = ? ORDER BY finished_at DESC LIMIT 30').all(host.id)
  ) as Array<{ id: string; kind: string; title: string; finished_at: number; players: number }>;
  return rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, finishedAt: r.finished_at, players: r.players }));
}

export function sessionResults(db: Db, host: UserRow, id: string) {
  const s = db.prepare('SELECT * FROM live_sessions WHERE id = ?').get(id) as { id: string; kind: string; title: string; host_id: string; finished_at: number } | undefined;
  if (!s || (host.role !== 'admin' && s.host_id !== host.id)) throw new HttpError(404, 'notFound');
  const rows = db
    .prepare('SELECT r.rank, r.score, r.detail, u.display_name AS name, u.login FROM live_results r JOIN users u ON u.id = r.user_id WHERE r.session_id = ? ORDER BY r.rank')
    .all(id) as Array<{ rank: number; score: number | null; detail: string; name: string; login: string }>;
  return { session: { id: s.id, kind: s.kind, title: s.title, finishedAt: s.finished_at }, results: rows.map((r) => ({ rank: r.rank, score: r.score, name: r.name, login: r.login, detail: JSON.parse(r.detail) })) };
}
