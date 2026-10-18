/**
 * Race rules (V2-11b). Every move is checked on the server with the labs'
 * own pure logic — the browser only shows the board:
 *   - assembly: AssemblyLab `place()` until every part is installed;
 *   - connect:  ConnectLab `tryPlug()` on the PC scenario until every cable end is in;
 *   - fault:    five broken computers; name the cause from the symptoms that
 *               SystemSim `check()` produces (the same for every racer).
 * Time decides, each mistake adds a penalty.
 */
import { STEP_IDS, isComplete, newAssembly, place, type AssemblyState, type StepId, type TargetId, TARGET_IDS } from '@/labs/AssemblyLab';
import { PC_SCENARIO, emptyPlugState, endsOf, tryPlug, unplug, type PlugState } from '@/labs/ConnectLab';
import { FAULTS, FAULT_IDS, type FaultId } from '@/labs/SystemSim/faults';
import { check } from '@/labs/SystemSim/sim';
import { rng, shuffle } from './quiz';

export const RACE_KINDS = ['assembly', 'connect', 'fault'] as const;
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

export function newRacer(kind: RaceKind): RacerState {
  if (kind === 'assembly') return { assembly: newAssembly(), mistakes: 0, progress: 0, done: false };
  if (kind === 'connect') return { plugs: emptyPlugState(), mistakes: 0, progress: 0, done: false };
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

export type Move = { t: 'place'; step: string; at: string | null } | { t: 'plug'; end: string; port: string } | { t: 'unplug'; end: string } | { t: 'diagnose'; cause: string };

/** Applies one move; anything malformed or out of turn is refused without counting. */
export function applyMove(kind: RaceKind, s: RacerState, move: Move, faults: readonly FaultId[]): MoveResult {
  if (s.done) return { ok: false, state: s };
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
