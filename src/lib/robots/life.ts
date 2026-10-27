/**
 * V4 §4.3: the robots' daily life in their yard — a small simulation, pure
 * and seeded, so the lab, the «Біздің роботтар» page and the tests run the
 * very same thing.
 *
 *   work ──battery low──▶ toGarage ──at the pad──▶ charging ──full──▶ waking ──▶ work
 *   work ──a match starts──▶ toPlay ──▶ play ──final whistle──▶ rest (lounge) ──▶ work
 *
 * Every few minutes the robots with enough battery gather for a match on
 * the mini pitch (two teams, a ball, goals). Movement follows grid paths
 * (lib/robots/grid.ts) and a step is only taken when the robot still fits
 * there and stays clear of every other robot — so robots never walk through
 * walls, props or each other; a blocked robot waits, side-steps, and after a
 * while finds another way round. `away` robots are on duty in the hall (on
 * Low the yard shows fewer robots) and stand still.
 */
import { ROSTER, type RobotId } from '@/data/robots/roster';
import { GARAGES, LOUNGE_SPOTS, PITCH, PITCH_CENTRE, WORK, YARD_HALF, YARD_OBSTACLES, garageOf, type P2 } from '@/data/robots/yard';
import { CELL, buildGrid, cellOf, findPath, fits, nearestFit, segmentFits, type YardGrid } from './grid';

export const LIFE_STATES = ['work', 'toGarage', 'charging', 'waking', 'toPlay', 'play', 'rest', 'away'] as const;
export type LifeState = (typeof LIFE_STATES)[number];

export const LIFE = {
  /** Battery used per second while active (full → empty in about three minutes), and while resting. */
  drain: 1 / 170,
  restDrain: 1 / 600,
  /** Charged per second in the garage. */
  charge: 1 / 28,
  /** Below this a robot goes to charge; a match needs at least `playMin`. */
  low: 0.2,
  playMin: 0.42,
  wake: 2.5,
  /** Matches: the first one soon after the lab opens, then every `matchEvery` seconds. */
  firstMatch: 35,
  matchEvery: 150,
  matchLength: 45,
  maxPlayers: 6,
  rest: 12,
  /** Gap kept between two robots' footprints (m). */
  gap: 0.03,
  /** Level 5 skill: a charge lasts 30 % longer. */
  skillDrain: 0.7,
} as const;

export interface Agent {
  id: RobotId;
  radius: number;
  speed: number;
  pos: [number, number];
  /** Heading (radians, 0 = +Z). */
  yaw: number;
  state: LifeState;
  /** 0..1 */
  battery: number;
  path: P2[];
  /** Index of the work spot it is at or heading to. */
  spot: number;
  /** Seconds left at the current spot (work) or in the current state (waking, rest). */
  timer: number;
  /** Seconds it could not move, and who stood in the way. */
  blocked: number;
  blocker: RobotId | null;
  /** Seconds without getting any closer (a replan does not reset it). */
  stuck: number;
  /** It moved this step (walk animation). */
  moving: boolean;
  /** Cargo: carrying a box. */
  carrying: boolean;
  team: 0 | 1 | null;
  /** Seconds since it last kicked the ball. */
  kicked: number;
  drainFactor: number;
}

export interface Match {
  until: number;
  score: [number, number];
  /** The ball waits at the centre spot after a goal until this time. */
  restartAt: number;
}

export interface YardWorld {
  t: number;
  agents: Agent[];
  /** `team`: who kicked it last. */
  ball: { pos: [number, number]; vel: [number, number]; team: 0 | 1 | null };
  match: Match | null;
  nextMatch: number;
  grid: YardGrid;
  rand: () => number;
}

export type YardEvent = { type: 'goal'; team: 0 | 1 } | { type: 'kick'; id: RobotId } | { type: 'matchStart' } | { type: 'matchEnd'; score: [number, number] } | { type: 'state'; id: RobotId; state: LifeState };

/** mulberry32: small, fast and reproducible. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let sharedGrid: YardGrid | null = null;
/** The yard's walking grid (built once: about 13 000 cells). */
export const yardGrid = () => (sharedGrid ??= buildGrid(YARD_HALF, YARD_OBSTACLES));

export interface YardOptions {
  seed?: number;
  /** Robots on duty in the hall: not in the yard. */
  away?: readonly RobotId[];
  /** Robot levels (level 5 unlocks the long-lasting charge). */
  levels?: Partial<Record<RobotId, number>>;
}

export function createYard({ seed = 7, away = [], levels = {} }: YardOptions = {}): YardWorld {
  const grid = yardGrid();
  const rand = seeded(seed);
  const agents: Agent[] = [];
  for (const r of ROSTER) {
    const plan = WORK[r.id];
    // the first of its spots that is free of the robots placed before it (or a free point near one)
    const free = (p: P2) => fits(grid, p, r.radius) && agents.every((b) => dist(p, b.pos) >= r.radius + b.radius + LIFE.gap);
    let start = plan.spots.map((s) => nearestFit(grid, s, r.radius)).find((p): p is P2 => !!p && free(p));
    for (let k = 1; !start && k < 200; k++) {
      const a = k * 2.4;
      const p = nearestFit(grid, [plan.spots[0][0] + Math.cos(a) * k * 0.03, plan.spots[0][1] + Math.sin(a) * k * 0.03], r.radius);
      if (p && free(p)) start = p;
    }
    start ??= plan.spots[0];
    agents.push({
      id: r.id,
      radius: r.radius,
      speed: r.speed,
      pos: [start[0], start[1]],
      yaw: plan.face ?? 0,
      state: away.includes(r.id) ? 'away' : 'work',
      // staggered, so the robots go to charge one by one
      battery: 0.3 + rand() * 0.7,
      path: [],
      spot: Math.max(0, plan.spots.findIndex((p) => dist(p, start!) < 0.1)),
      timer: plan.dwell * rand(),
      blocked: 0,
      blocker: null,
      stuck: 0,
      moving: false,
      carrying: false,
      team: null,
      kicked: 99,
      drainFactor: (levels[r.id] ?? 1) >= 5 ? LIFE.skillDrain : 1,
    });
  }
  return { t: 0, agents, ball: { pos: [PITCH_CENTRE[0], PITCH_CENTRE[1]], vel: [0, 0], team: null }, match: null, nextMatch: LIFE.firstMatch, grid, rand };
}

const dist = (a: P2, b: P2) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const active = (a: Agent) => a.state !== 'away';

/** Another robot that a robot at `p` would come too close to. */
function crowding(w: YardWorld, a: Agent, p: P2): Agent | null {
  for (const b of w.agents) {
    if (b === a || !active(b)) continue;
    if (dist(p, b.pos) < a.radius + b.radius + LIFE.gap) return b;
  }
  return null;
}

/** Can the robot stand at `p`: it fits on the grid and keeps clear of everyone. */
export const canStand = (w: YardWorld, a: Agent, p: P2) => fits(w.grid, p, a.radius) && !crowding(w, a, p);

function setState(a: Agent, s: LifeState, events: YardEvent[]) {
  if (a.state === s) return;
  a.state = s;
  a.path = [];
  a.blocked = 0;
  events.push({ type: 'state', id: a.id, state: s });
}

/** Plans a path; other robots' footprints count as blocked (only when it has been stuck behind them). */
function plan(w: YardWorld, a: Agent, to: P2, avoidOthers = false) {
  let blocked: ((c: number, r: number) => boolean) | undefined;
  if (avoidOthers) {
    const others = w.agents.filter((b) => b !== a && active(b)).map((b) => ({ cell: cellOf(w.grid, b.pos), reach: Math.ceil((a.radius + b.radius + LIFE.gap) / CELL) }));
    blocked = (c, r) => others.some((o) => Math.hypot(c - o.cell[0], r - o.cell[1]) <= o.reach);
  }
  a.path = findPath(w.grid, a.pos, to, a.radius, blocked) ?? (avoidOthers ? (findPath(w.grid, a.pos, to, a.radius) ?? []) : []);
}

/** Walks along the path for `dt`; true when it has arrived (no path left). */
function walk(w: YardWorld, a: Agent, dt: number): boolean {
  a.moving = false;
  let budget = a.speed * dt;
  while (budget > 1e-6 && a.path.length) {
    const next = a.path[0];
    const d = dist(a.pos, next);
    if (d < 1e-4) {
      a.path.shift();
      continue;
    }
    const step = Math.min(budget, d);
    const dir: P2 = [(next[0] - a.pos[0]) / d, (next[1] - a.pos[1]) / d];
    const to: P2 = [a.pos[0] + dir[0] * step, a.pos[1] + dir[1] * step];
    const inWay = fits(w.grid, to, a.radius) ? crowding(w, a, to) : null;
    if (!inWay && fits(w.grid, to, a.radius)) {
      a.blocker = null;
      a.stuck = 0;
      a.pos[0] = to[0];
      a.pos[1] = to[1];
      a.yaw = Math.atan2(dir[0], dir[1]);
      a.moving = true;
      a.blocked = 0;
      budget -= step;
      if (step >= d - 1e-6) a.path.shift();
      continue;
    }
    // something is in the way: wait a moment, then try a side step, then another way round
    a.blocked += dt;
    a.stuck += dt;
    a.blocker = inWay?.id ?? null;
    // two robots face to face in a narrow walkway, each waiting for the other: the one later in the roster steps aside
    if (inWay && inWay.blocker === a.id && a.stuck > 4 && ROSTER.findIndex((r) => r.id === a.id) > ROSTER.findIndex((r) => r.id === inWay.id)) {
      const away = stepAside(w, a, inWay);
      if (away) {
        a.path = [away];
        a.blocked = 0;
        a.stuck = 0;
        return false;
      }
    }
    if (a.blocked > 0.5) {
      for (const turn of [0.6, -0.6, 1.2, -1.2]) {
        const c = Math.cos(turn);
        const s = Math.sin(turn);
        const side: P2 = [dir[0] * c - dir[1] * s, dir[0] * s + dir[1] * c];
        const p: P2 = [a.pos[0] + side[0] * step * 0.6, a.pos[1] + side[1] * step * 0.6];
        if (canStand(w, a, p)) {
          a.pos[0] = p[0];
          a.pos[1] = p[1];
          a.yaw = Math.atan2(side[0], side[1]);
          a.moving = true;
          break;
        }
      }
    }
    const goal = a.path[a.path.length - 1];
    // someone stands right at its goal and stays (a robot at its own spot): close enough is there
    if (a.blocked > 3 && a.state !== 'toGarage' && dist(a.pos, goal) < 0.5) {
      a.path = [];
      a.blocked = 0;
      return true;
    }
    if (a.blocked > 2.5) {
      plan(w, a, goal, true);
      a.blocked = 0.6;
    }
    return false;
  }
  return a.path.length === 0;
}

/** A free point about half a metre away from the robot in the way, reachable in a straight line (null if none). */
function stepAside(w: YardWorld, a: Agent, from: Agent): P2 | null {
  let best: P2 | null = null;
  let bestD = -1;
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2;
    for (const r of [0.5, 0.8]) {
      const p: P2 = [a.pos[0] + Math.sin(ang) * r, a.pos[1] + Math.cos(ang) * r];
      if (!canStand(w, a, p) || !segmentFits(w.grid, a.pos, p, a.radius)) continue;
      const d = dist(p, from.pos);
      if (d > bestD) {
        bestD = d;
        best = p;
      }
    }
  }
  return best;
}

/** Turns towards `yaw` at most `rate` rad/s. */
function turnTo(a: Agent, yaw: number, dt: number, rate = 3) {
  let d = yaw - a.yaw;
  d = Math.atan2(Math.sin(d), Math.cos(d));
  a.yaw += Math.max(-rate * dt, Math.min(rate * dt, d));
}

const workSpot = (a: Agent) => WORK[a.id].spots[a.spot % WORK[a.id].spots.length];

/** Where each player of a team lines up (team 0 attacks +X). */
function formation(team: 0 | 1, i: number): P2 {
  const dir = team === 0 ? -1 : 1;
  const rows: P2[] = [
    [0.55, 0],
    [1.15, -0.55],
    [1.15, 0.55],
  ];
  const [dx, dz] = rows[i % rows.length];
  return [PITCH_CENTRE[0] + dir * dx, PITCH_CENTRE[1] + dz];
}

function startMatch(w: YardWorld, events: YardEvent[]) {
  const players = w.agents
    .filter((a) => a.state === 'work' && a.battery >= LIFE.playMin)
    .sort((x, y) => y.battery - x.battery)
    .slice(0, LIFE.maxPlayers);
  w.nextMatch = w.t + LIFE.matchEvery;
  if (players.length < 2) return;
  w.match = { until: w.t + LIFE.matchLength, score: [0, 0], restartAt: w.t + 4 };
  w.ball.pos = [PITCH_CENTRE[0], PITCH_CENTRE[1]];
  w.ball.vel = [0, 0];
  const count: [number, number] = [0, 0];
  players.forEach((a, i) => {
    const team = (i % 2) as 0 | 1;
    a.team = team;
    setState(a, 'toPlay', events);
    a.carrying = false;
    plan(w, a, formation(team, count[team]++));
  });
  events.push({ type: 'matchStart' });
}

function endMatch(w: YardWorld, events: YardEvent[]) {
  if (!w.match) return;
  events.push({ type: 'matchEnd', score: w.match.score });
  w.match = null;
  let seat = 0;
  for (const a of w.agents) {
    if (a.state !== 'play' && a.state !== 'toPlay') continue;
    a.team = null;
    setState(a, 'rest', events);
    plan(w, a, LOUNGE_SPOTS[seat++ % LOUNGE_SPOTS.length]);
    a.timer = LIFE.rest;
  }
}

/** One player's move in the match: the nearest of each team runs to the ball, the others hold their shape. */
function playStep(w: YardWorld, a: Agent, dt: number, events: YardEvent[]) {
  const m = w.match!;
  const team = a.team ?? 0;
  const mates = w.agents.filter((b) => b.state === 'play' && b.team === team);
  const ball = w.ball.pos;
  const attack = team === 0 ? 1 : -1;
  const chaser = mates.reduce((best, b) => (dist(b.pos, ball) < dist(best.pos, ball) ? b : best), a);
  let target: P2;
  if (chaser === a && w.t >= m.restartAt) {
    // get behind the ball, facing the goal it attacks
    target = [ball[0] - attack * (a.radius + PITCH.ball + 0.02), ball[1]];
  } else {
    const idx = mates.filter((b) => b !== chaser).indexOf(a);
    const home = formation(team, idx + 1);
    target = [home[0] + (ball[0] - PITCH_CENTRE[0]) * 0.4, home[1] + (ball[1] - PITCH_CENTRE[1]) * 0.25];
  }
  const goal = nearestFit(w.grid, target, a.radius) ?? target;
  // short hops straight at the target; a grid path when something stands in the way
  if (!a.path.length || dist(a.path[a.path.length - 1], goal) > 0.15) {
    a.path = segmentFits(w.grid, a.pos, goal, a.radius) ? [goal] : (findPath(w.grid, a.pos, goal, a.radius) ?? []);
  }
  walk(w, a, dt);
  a.kicked += dt;
  // a kick when it reaches the ball
  if (w.t >= m.restartAt && a.kicked > 0.6 && dist(a.pos, ball) < a.radius + PITCH.ball + 0.06) {
    const goalX = attack > 0 ? PITCH.max[0] : PITCH.min[0];
    const aimZ = PITCH_CENTRE[1] + (w.rand() - 0.5) * PITCH.goalWidth * 1.4;
    const dx = goalX - ball[0];
    const dz = aimZ - ball[1];
    const d = Math.hypot(dx, dz) || 1;
    const power = 2.0 + w.rand() * 0.9;
    w.ball.vel = [(dx / d) * power, (dz / d) * power];
    w.ball.team = team;
    a.kicked = 0;
    events.push({ type: 'kick', id: a.id });
  }
  if (!a.moving) turnTo(a, Math.atan2(ball[0] - a.pos[0], ball[1] - a.pos[1]), dt);
}

/** The ball rolls, slows down and bounces off the lines (it rolls between the robots: only a kick moves it); a goal restarts from the centre. */
function ballStep(w: YardWorld, dt: number, events: YardEvent[]) {
  const b = w.ball;
  const m = w.match;
  if (m && w.t < m.restartAt) return;
  const friction = Math.exp(-0.85 * dt);
  b.vel[0] *= friction;
  b.vel[1] *= friction;
  b.pos[0] += b.vel[0] * dt;
  b.pos[1] += b.vel[1] * dt;
  const r = PITCH.ball;
  const inMouth = Math.abs(b.pos[1] - PITCH_CENTRE[1]) < PITCH.goalWidth / 2 - r;
  if (m && inMouth && (b.pos[0] > PITCH.max[0] || b.pos[0] < PITCH.min[0])) {
    const team: 0 | 1 = b.pos[0] > PITCH.max[0] ? 0 : 1;
    m.score[team]++;
    events.push({ type: 'goal', team });
    b.pos = [PITCH_CENTRE[0], PITCH_CENTRE[1]];
    b.vel = [0, 0];
    b.team = null;
    m.restartAt = w.t + 2.5;
    return;
  }
  if (b.pos[0] < PITCH.min[0] + r || b.pos[0] > PITCH.max[0] - r) {
    b.pos[0] = Math.max(PITCH.min[0] + r, Math.min(PITCH.max[0] - r, b.pos[0]));
    b.vel[0] *= -0.6;
  }
  if (b.pos[1] < PITCH.min[1] + r || b.pos[1] > PITCH.max[1] - r) {
    b.pos[1] = Math.max(PITCH.min[1] + r, Math.min(PITCH.max[1] - r, b.pos[1]));
    b.vel[1] *= -0.6;
  }
}

/** Advances the yard by `dt` seconds (keep dt ≤ 0.2: steps shorter than a robot's size). */
export function stepYard(w: YardWorld, dt: number): YardEvent[] {
  const events: YardEvent[] = [];
  w.t += dt;
  if (!w.match && w.t >= w.nextMatch) startMatch(w, events);
  if (w.match && w.t >= w.match.until) endMatch(w, events);

  for (const a of w.agents) {
    if (!active(a)) continue;
    const working = a.state === 'work' || a.state === 'play' || a.state === 'toPlay' || a.state === 'toGarage';
    if (a.state !== 'charging' && a.state !== 'waking') a.battery = Math.max(0, a.battery - (working ? LIFE.drain : LIFE.restDrain) * a.drainFactor * dt);
    // a flat battery wins over everything: off to the garage
    if (a.battery < LIFE.low && (a.state === 'work' || a.state === 'play' || a.state === 'toPlay' || a.state === 'rest')) {
      a.team = null;
      a.carrying = false;
      setState(a, 'toGarage', events);
      plan(w, a, garageOf(a.id).pad);
    }

    switch (a.state) {
      case 'work': {
        if (!a.path.length && dist(a.pos, workSpot(a)) > 0.08) plan(w, a, workSpot(a));
        if (a.path.length) {
          walk(w, a, dt);
          if (!a.path.length) a.timer = WORK[a.id].dwell;
          break;
        }
        a.moving = false;
        const face = WORK[a.id].face;
        if (face !== undefined) turnTo(a, face, dt);
        a.timer -= dt;
        if (a.timer <= 0) {
          if (a.id === 'cargo') a.carrying = a.spot % 2 === 0;
          a.spot = (a.spot + 1) % WORK[a.id].spots.length;
          plan(w, a, workSpot(a));
        }
        break;
      }
      case 'toGarage': {
        if (!a.path.length && dist(a.pos, garageOf(a.id).pad) > 0.05) plan(w, a, garageOf(a.id).pad);
        if (walk(w, a, dt) && dist(a.pos, garageOf(a.id).pad) <= 0.06) {
          setState(a, 'charging', events);
          a.moving = false;
        }
        break;
      }
      case 'charging': {
        turnTo(a, 0, dt);
        a.moving = false;
        a.battery = Math.min(1, a.battery + LIFE.charge * dt);
        if (a.battery >= 1) {
          setState(a, 'waking', events);
          a.timer = LIFE.wake;
        }
        break;
      }
      case 'waking': {
        a.moving = false;
        a.timer -= dt;
        if (a.timer <= 0) {
          setState(a, 'work', events);
          plan(w, a, workSpot(a));
        }
        break;
      }
      case 'toPlay': {
        walk(w, a, dt);
        if (w.match && !a.path.length) setState(a, 'play', events);
        break;
      }
      case 'play': {
        if (w.match) playStep(w, a, dt, events);
        break;
      }
      case 'rest': {
        if (a.path.length) {
          walk(w, a, dt);
          break;
        }
        a.moving = false;
        a.timer -= dt;
        if (a.timer <= 0) {
          setState(a, 'work', events);
          plan(w, a, workSpot(a));
        }
        break;
      }
    }
  }
  if (w.match) ballStep(w, dt, events);
  return events;
}

/** Every garage's pad (for drawing the docks' battery bars). */
export const GARAGE_PADS = GARAGES.map((g) => g.pad);
