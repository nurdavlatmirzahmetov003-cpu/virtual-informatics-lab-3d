/**
 * Race rules (V2-11b). Every move is checked on the server with the labs'
 * own pure logic — the browser only shows the board:
 *   - assembly: AssemblyLab `place()` until every part is installed;
 *   - connect:  ConnectLab `tryPlug()` on the PC scenario until every cable end is in;
 *   - fault:    five broken computers; name the cause from the symptoms that
 *               SystemSim `check()` produces (the same for every racer);
 *   - phone, laptop (0.37): put the device back together, part by part, in an
 *               order that works (data/teardown BUILD_GROUPS);
 *   - network (0.37): cable a router, a switch, three computers and a server
 *               until every computer PINGs the server (NetworkLab rules).
 * Time decides, each mistake adds a penalty. The same rules referee the
 * hands-on arena games (labs/Arcade), which are these races played alone.
 */
import { STEP_IDS, isComplete, newAssembly, place, type AssemblyState, type StepId, type TargetId, TARGET_IDS } from '@/labs/AssemblyLab';
import { PC_SCENARIO, emptyPlugState, endsOf, tryPlug, unplug, type PlugState } from '@/labs/ConnectLab';
import { FAULTS, FAULT_IDS, type FaultId } from '@/labs/SystemSim/faults';
import { check } from '@/labs/SystemSim/sim';
import { BUILD_GROUPS } from '@/data/teardown/teardowns';
import type { Network } from '@/labs/NetworkLab/types';
import { NET_LINKS_NEEDED, cable, cut, endKey, goodLinks, networkWorks, parseEnd, startNetwork } from './networkGame';
import { rng, shuffle } from './quiz';

export const RACE_KINDS = ['assembly', 'connect', 'fault', 'phone', 'laptop', 'network'] as const;
export type RaceKind = (typeof RACE_KINDS)[number];
/** Question games: the classic quiz and «What device is this?» (0.36, a 3D model and four names). */
export const QUIZ_KINDS = ['quiz', 'device'] as const;
export const GAME_KINDS = [...QUIZ_KINDS, ...RACE_KINDS] as const;
export type GameKind = (typeof GAME_KINDS)[number];

/** Seconds added to a racer's time for each mistake. */
export const PENALTY_S = 10;
export const FAULT_ROUNDS = 5;

export interface RacerState {
  assembly?: AssemblyState;
  plugs?: PlugState;
  /** fault race: the round being solved */
  round?: number;
  /** phone / laptop: the parts back in, in the order they went in */
  built?: string[];
  /** network: the cables so far */
  net?: Network;
  mistakes: number;
  /** 0..1 */
  progress: number;
  done: boolean;
}

export interface MoveResult {
  ok: boolean;
  state: RacerState;
  /** Locale key (and params) explaining the result to the racer. */
  message?: { key: string; params?: Record<string, string> };
}

const PC_ENDS = endsOf(PC_SCENARIO).map((e) => e.id);

/** Build races and the device they rebuild. */
export const BUILD_DEVICE = { phone: 'smartphone', laptop: 'laptop' } as const;
export type BuildKind = keyof typeof BUILD_DEVICE;
export const isBuildKind = (k: string): k is BuildKind => k in BUILD_DEVICE;
export const buildGroups = (kind: BuildKind) => BUILD_GROUPS[BUILD_DEVICE[kind]]!;
export const buildParts = (kind: BuildKind) => buildGroups(kind).flat();

/** The group whose parts may go in next (null when the device is whole). */
export function nextGroup(kind: BuildKind, built: readonly string[]): readonly string[] | null {
  return buildGroups(kind).find((g) => g.some((p) => !built.includes(p))) ?? null;
}

/** Why a part may not go in now: already in, unknown, or too early (another part goes first); null when it fits. */
export function buildProblem(kind: BuildKind, built: readonly string[], part: string): 'unknown' | 'installed' | 'early' | null {
  if (!buildParts(kind).includes(part)) return 'unknown';
  if (built.includes(part)) return 'installed';
  return nextGroup(kind, built)?.includes(part) ? null : 'early';
}

/** `seed`: the network game's router ports (which port faces which network). */
export function newRacer(kind: RaceKind, seed = 0): RacerState {
  if (kind === 'assembly') return { assembly: newAssembly(), mistakes: 0, progress: 0, done: false };
  if (kind === 'connect') return { plugs: emptyPlugState(), mistakes: 0, progress: 0, done: false };
  if (kind === 'phone' || kind === 'laptop') return { built: [], mistakes: 0, progress: 0, done: false };
  if (kind === 'network') return { net: startNetwork(seed), mistakes: 0, progress: 0, done: false };
  return { round: 0, mistakes: 0, progress: 0, done: false };
}

/** The faults of a fault race, in order (the same for every racer of the room). */
export const faultOrder = (seed: number): FaultId[] => shuffle(FAULT_IDS, rng(seed)).slice(0, FAULT_ROUNDS);

export interface Symptoms {
  /** POST result: noRam | noVideo | wrongPort | noBoot | desktop */
  outcome: string;
  beep: string;
  cpuFanWarning: boolean;
  /** under a game load (only when it reaches the desktop) */
  throttled: boolean;
  shutdown: 'overheat' | 'psu' | null;
  peakC: number | null;
}

/** What the broken computer does — all a racer gets to see. */
export function symptomsOf(fault: FaultId): Symptoms {
  const d = check(FAULTS[fault]);
  return {
    outcome: d.post.outcome,
    beep: d.post.beep,
    cpuFanWarning: d.post.warnings.includes('cpuFan'),
    throttled: !!d.game?.throttled,
    shutdown: d.game?.shutdown?.reason ?? null,
    peakC: d.game ? Math.round(d.game.peakC) : null,
  };
}

export type Move =
  | { t: 'place'; step: string; at: string | null }
  | { t: 'plug'; end: string; port: string }
  | { t: 'unplug'; end: string }
  | { t: 'diagnose'; cause: string }
  | { t: 'install'; part: string }
  | { t: 'cable'; a: string; b: string }
  | { t: 'cut'; end: string };

/** Move types each race takes (anything else is not a move of that race). */
export const MOVE_TYPES: Readonly<Record<RaceKind, readonly Move['t'][]>> = {
  assembly: ['place'],
  connect: ['plug', 'unplug'],
  fault: ['diagnose'],
  phone: ['install'],
  laptop: ['install'],
  network: ['cable', 'cut'],
};

/** A move as it came over the wire, checked for shape only (the race rules decide the rest). */
export function asMove(v: unknown): Move | null {
  if (!v || typeof v !== 'object') return null;
  const m = v as Record<string, unknown>;
  const str = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length <= 40;
  switch (m.t) {
    case 'place':
      return str(m.step) && (m.at === null || str(m.at)) ? { t: 'place', step: m.step, at: m.at as string | null } : null;
    case 'plug':
      return str(m.end) && str(m.port) ? { t: 'plug', end: m.end, port: m.port } : null;
    case 'unplug':
      return str(m.end) ? { t: 'unplug', end: m.end } : null;
    case 'diagnose':
      return str(m.cause) ? { t: 'diagnose', cause: m.cause } : null;
    case 'install':
      return str(m.part) ? { t: 'install', part: m.part } : null;
    case 'cable':
      return str(m.a) && str(m.b) ? { t: 'cable', a: m.a, b: m.b } : null;
    case 'cut':
      return str(m.end) ? { t: 'cut', end: m.end } : null;
    default:
      return null;
  }
}

/** Applies one move; anything malformed or out of turn is refused without counting. `seed`: the network game's ports. */
export function applyMove(kind: RaceKind, s: RacerState, move: Move, faults: readonly FaultId[], seed = 0): MoveResult {
  if (s.done) return { ok: false, state: s };
  if ((kind === 'phone' || kind === 'laptop') && move.t === 'install' && s.built) {
    const problem = buildProblem(kind, s.built, move.part);
    if (problem === 'unknown' || problem === 'installed') return { ok: false, state: s };
    if (problem === 'early') return { ok: false, state: { ...s, mistakes: s.mistakes + 1 }, message: { key: 'games3d.build.early' } };
    const built = [...s.built, move.part];
    const total = buildParts(kind).length;
    return { ok: true, state: { ...s, built, progress: built.length / total, done: built.length === total } };
  }
  if (kind === 'network' && s.net && (move.t === 'cable' || move.t === 'cut')) {
    const net = s.net;
    const after = (n: Network, mistakes: number): RacerState => ({ ...s, net: n, mistakes, progress: goodLinks(n, seed) / NET_LINKS_NEEDED, done: networkWorks(n) });
    if (move.t === 'cut') {
      const end = parseEnd(net, move.end);
      const n = end && cut(net, end);
      // pulling a cable out is a correction: it costs a mistake
      return n ? { ok: true, state: after(n, s.mistakes + 1) } : { ok: false, state: s };
    }
    const a = parseEnd(net, move.a);
    const b = parseEnd(net, move.b);
    if (!a || !b) return { ok: false, state: s };
    const n = cable(net, a, b);
    if (!n) return { ok: false, state: { ...s, mistakes: s.mistakes + 1 }, message: { key: 'games3d.network.refused', params: { a: endKey(a), b: endKey(b) } } };
    const state = after(n, s.mistakes);
    return { ok: true, state, message: state.done ? { key: 'games3d.network.works' } : undefined };
  }
  if (kind === 'assembly' && move.t === 'place' && s.assembly) {
    if (!(STEP_IDS as readonly string[]).includes(move.step) || (move.at !== null && !(TARGET_IDS as readonly string[]).includes(move.at))) return { ok: false, state: s };
    const r = place(s.assembly, move.step as StepId, move.at as TargetId | null);
    const mistake = r.event.outcome === 'slot' || r.event.outcome === 'order';
    const state: RacerState = {
      ...s,
      assembly: r.state,
      mistakes: s.mistakes + (mistake ? 1 : 0),
      progress: r.state.installed.length / STEP_IDS.length,
      done: isComplete(r.state),
    };
    return { ok: r.event.outcome === 'installed', state, message: r.message };
  }
  if (kind === 'connect' && s.plugs) {
    if (move.t === 'unplug') {
      const plugs = unplug(s.plugs, move.end);
      return { ok: true, state: { ...s, plugs, progress: Object.keys(plugs.plugged).length / PC_ENDS.length } };
    }
    if (move.t === 'plug') {
      if (!PC_ENDS.includes(move.end)) return { ok: false, state: s };
      const r = tryPlug(PC_SCENARIO, s.plugs, move.end, move.port);
      const n = Object.keys(r.state.plugged).length;
      const state: RacerState = { ...s, plugs: r.state, mistakes: s.mistakes + (r.ok ? 0 : 1), progress: n / PC_ENDS.length, done: n === PC_ENDS.length };
      return { ok: r.ok, state, message: r.ok ? undefined : { key: `connect.why.${r.reason}`, params: { end: move.end, port: move.port } } };
    }
  }
  if (kind === 'fault' && move.t === 'diagnose' && s.round !== undefined) {
    if (!(FAULT_IDS as readonly string[]).includes(move.cause)) return { ok: false, state: s };
    const right = faults[s.round] === move.cause;
    if (!right) return { ok: false, state: { ...s, mistakes: s.mistakes + 1 }, message: { key: 'live.fault.wrong' } };
    const round = s.round + 1;
    return { ok: true, state: { ...s, round, progress: round / faults.length, done: round >= faults.length }, message: { key: 'live.fault.right' } };
  }
  return { ok: false, state: s };
}

/** Race time with penalties, seconds (null while unfinished). */
export const raceSeconds = (startedAt: number, finishedAt: number | null, mistakes: number) => (finishedAt === null ? null : Math.round(((finishedAt - startedAt) / 1000 + mistakes * PENALTY_S) * 10) / 10);

/** Finished racers by time; the others by progress, then fewer mistakes. */
export function rankRacers<T extends { seconds: number | null; progress: number; mistakes: number }>(list: readonly T[]): Array<T & { rank: number }> {
  const sorted = [...list].sort((a, b) => {
    if (a.seconds !== null && b.seconds !== null) return a.seconds - b.seconds;
    if (a.seconds !== null) return -1;
    if (b.seconds !== null) return 1;
    return b.progress - a.progress || a.mistakes - b.mistakes;
  });
  return sorted.map((r, i) => ({ ...r, rank: i + 1 }));
}
