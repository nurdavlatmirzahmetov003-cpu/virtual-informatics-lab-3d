/**
 * The Games arena (0.36): five quick competitive games. Pure functions,
 * shared by the browser (plays them) and the server (referees them): a run
 * is a seed — everyone with the same seed gets the same rounds — and the
 * score is recomputed on the server from the answers and the server's own
 * clock, so a typed-in score counts for nothing.
 *
 *   device  «What device is this?»  — a 3D model, four names        (10 rounds)
 *   ports   «Cable and socket»      — a job, four port types        (10 rounds)
 *   order   «Build the PC»          — install the parts in a valid order (11 steps)
 *   binary  «Binary rush»           — decimal ↔ binary, 60 seconds
 *   subnet  «Network master»        — same network or not? 60 seconds
 *
 * Hands-on 3D games (0.37): the live races played alone, in 3D. The answers
 * are the moves; the referee replays them with the race rules
 * (labs/LiveGames/races `applyMove`), so the arena and the class room judge
 * the same way.
 *
 *   phone    «Build the phone»     — the smartphone back together, part by part
 *   laptop   «Build the laptop»    — the same for a laptop
 *   pcbuild  «PC build race»       — the Assembly Lab against the clock
 *   plug     «Plug it in»          — every cable of the PC into the right socket
 *   network  «Build the network»   — cable it until every computer PINGs the server
 *   fault    «Find the fault»      — five broken computers: which part is to blame?
 */
import { DEVICES } from '@/data/devices/devices';
import { rng, shuffle, type LiveQuestion } from '@/labs/LiveGames/quiz';
import { applyMove, asMove, faultOrder, newRacer, type RaceKind, type RacerState } from '@/labs/LiveGames/races';
import { STEP_IDS, canInstall, type StepId } from '@/labs/AssemblyLab/steps';
import { formatIp, maskFromPrefix, parseIp, parseMask, sameSubnet } from '@/labs/NetworkLab/ipv4';

export const QUICK_GAMES = ['device', 'order', 'ports', 'binary', 'subnet'] as const;
export const HANDS_ON_GAMES = ['phone', 'laptop', 'pcbuild', 'plug', 'network', 'fault'] as const;
export const ARCADE_GAMES = [...QUICK_GAMES, ...HANDS_ON_GAMES] as const;
export type ArcadeGame = (typeof ARCADE_GAMES)[number];
export type HandsOnGame = (typeof HANDS_ON_GAMES)[number];
export const isArcadeGame = (v: unknown): v is ArcadeGame => typeof v === 'string' && (ARCADE_GAMES as readonly string[]).includes(v);
export const isHandsOn = (g: ArcadeGame): g is HandsOnGame => (HANDS_ON_GAMES as readonly string[]).includes(g);

/** The race whose rules referee each hands-on game. */
export const HANDS_ON_RACE: Readonly<Record<HandsOnGame, RaceKind>> = { phone: 'phone', laptop: 'laptop', pcbuild: 'assembly', plug: 'connect', network: 'network', fault: 'fault' };

export interface ArcadeSpec {
  /** rounds: answer every round, time only adds a bonus; timed: as many as you can before the clock runs out; build: a hands-on 3D job, finished fast and clean. */
  mode: 'rounds' | 'timed' | 'build';
  rounds: number;
  /** Time limit (s). */
  seconds: number;
  /** Fastest plausible answer (ms): a run answering faster than this is refused. */
  minAnswerMs: number;
}

export const ARCADE: Record<ArcadeGame, ArcadeSpec> = {
  device: { mode: 'rounds', rounds: 10, seconds: 150, minAnswerMs: 400 },
  ports: { mode: 'rounds', rounds: 10, seconds: 120, minAnswerMs: 400 },
  order: { mode: 'rounds', rounds: STEP_IDS.length, seconds: 120, minAnswerMs: 150 },
  binary: { mode: 'timed', rounds: 60, seconds: 60, minAnswerMs: 450 },
  subnet: { mode: 'timed', rounds: 60, seconds: 60, minAnswerMs: 350 },
  // build games: `rounds` = the most moves a run may send; `minAnswerMs` per move that worked
  phone: { mode: 'build', rounds: 60, seconds: 120, minAnswerMs: 350 },
  laptop: { mode: 'build', rounds: 60, seconds: 150, minAnswerMs: 350 },
  pcbuild: { mode: 'build', rounds: 80, seconds: 240, minAnswerMs: 500 },
  plug: { mode: 'build', rounds: 80, seconds: 180, minAnswerMs: 400 },
  network: { mode: 'build', rounds: 80, seconds: 180, minAnswerMs: 400 },
  fault: { mode: 'build', rounds: 40, seconds: 150, minAnswerMs: 800 },
};

/** A server-side clock slack for the network and the last answer (ms). */
export const GRACE_MS = 15_000;

/* ── device: «What device is this?» ───────────────────────────────── */

export interface DeviceRound {
  device: string;
  /** Four device ids in display order (the answer is one of them). */
  options: string[];
}

/** Too small or too plain to recognise from a model alone: never asked (they may still be wrong options). */
const NOT_ASKED = new Set(['thermal_paste', 'cmos_battery', 'internal_cables', 'hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable', 'ethernet_cable', 'sd_card']);

/** Devices whose models look alike: never offered together with each other. */
export const LOOKALIKES: readonly (readonly string[])[] = [
  ['hdd_35', 'hdd_25', 'ssd_sata', 'external_drive'],
  ['hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable', 'ethernet_cable', 'internal_cables'],
  ['printer_laser', 'printer_inkjet'],
  ['router', 'access_point', 'modem'],
  ['smartphone', 'tablet'],
  ['wifi_adapter', 'usb_flash'],
  ['card_reader', 'usb_hub', 'docking_station'],
];
export const lookAlike = (a: string, b: string) => LOOKALIKES.some((g) => g.includes(a) && g.includes(b));

export function deviceRounds(seed: number, count: number = ARCADE.device.rounds): DeviceRound[] {
  const r = rng(seed);
  const picked = shuffle(
    DEVICES.filter((d) => !NOT_ASKED.has(d.id)),
    r,
  ).slice(0, count);
  return picked.map((d) => {
    const fair = (x: { id: string }) => x.id !== d.id && !lookAlike(x.id, d.id);
    // devices of the same zone make it a real question — but never a twin of the answer
    const sameZone = shuffle(
      DEVICES.filter((x) => x.zone === d.zone && fair(x)),
      r,
    );
    const others = shuffle(
      DEVICES.filter((x) => x.zone !== d.zone && fair(x)),
      r,
    );
    const distractors = [...sameZone, ...others].slice(0, 3).map((x) => x.id);
    return { device: d.id, options: shuffle([d.id, ...distractors], r) };
  });
}

/** The same game as a live room question list (labs/LiveGames quiz format, `pick` options). */
export const deviceQuiz = (count: number, seed: number): LiveQuestion[] =>
  deviceRounds(seed, count).map((d) => ({ base: 'arcade.device', device: d.device, order: [], pick: d.options, correct: d.options.indexOf(d.device) }));

/* ── ports: «Cable and socket» ─────────────────────────────────────── */

/** Jobs and the one port type that does them (labels: deviceUi.portTypes.*, texts: arcade.ports.jobs.*). */
export const PORT_JOBS = {
  internet: 'rj45',
  phoneCharge: 'usb_c',
  headphones: 'audio_35',
  pcPower: 'iec_c14',
  printer: 'usb_b',
  nvme: 'm2',
  gpuSlot: 'pcie_x16',
  gpuPower: 'pcie_8pin',
  cpuPower: 'eps_8pin',
  boardPower: 'atx_24pin',
  ram: 'dimm',
  sataDisk: 'sata_data',
  tv: 'hdmi',
  dsl: 'rj11',
  cameraCard: 'sd_slot',
  caseFan: 'fan_4pin',
} as const;
export type PortJob = keyof typeof PORT_JOBS;
export const PORT_JOB_IDS = Object.keys(PORT_JOBS) as PortJob[];

export interface PortRound {
  job: PortJob;
  /** Four port types in display order. */
  options: string[];
}

export function portRounds(seed: number): PortRound[] {
  const r = rng(seed ^ 0x5bd1e995);
  const types = [...new Set(Object.values(PORT_JOBS))];
  return shuffle(PORT_JOB_IDS, r)
    .slice(0, ARCADE.ports.rounds)
    .map((job) => {
      const right = PORT_JOBS[job];
      const wrong = shuffle(
        types.filter((t) => t !== right),
        r,
      ).slice(0, 3);
      return { job, options: shuffle([right, ...wrong], r) };
    });
}

/* ── order: «Build the PC» ─────────────────────────────────────────── */

/** The parts as cards, shuffled (the player taps them in an order that works). */
export const orderCards = (seed: number): StepId[] => shuffle(STEP_IDS, rng(seed ^ 0x27d4eb2d));

/** Replays the taps: a part that needs another one first is a mistake. */
export function replayOrder(taps: readonly unknown[]) {
  const installed: StepId[] = [];
  let mistakes = 0;
  for (const t of taps.slice(0, 60)) {
    const step = STEP_IDS.find((s) => s === t);
    if (step && canInstall(step, installed)) installed.push(step);
    else mistakes++;
  }
  return { installed, mistakes, done: installed.length === STEP_IDS.length };
}

/* ── binary: «Binary rush» ─────────────────────────────────────────── */

export interface BinaryRound {
  /** toBin: show a decimal, type binary; toDec: show binary, type decimal. */
  dir: 'toBin' | 'toDec';
  value: number;
}

export function binaryRounds(seed: number): BinaryRound[] {
  const r = rng(seed ^ 0x9e3779b9);
  return Array.from({ length: ARCADE.binary.rounds }, (_, i) => {
    // warm up with small numbers, then a byte
    const [lo, hi] = i < 8 ? [1, 15] : i < 20 ? [8, 63] : [32, 255];
    return { dir: i % 2 === 0 ? 'toBin' : 'toDec', value: lo + Math.floor(r() * (hi - lo + 1)) };
  });
}

export const binaryPrompt = (b: BinaryRound) => (b.dir === 'toBin' ? String(b.value) : b.value.toString(2));

export function binaryRight(b: BinaryRound, answer: unknown): boolean {
  if (typeof answer !== 'string') return false;
  const a = answer.replace(/\s+/g, '');
  if (!a) return false;
  if (b.dir === 'toBin') return /^[01]+$/.test(a) && parseInt(a, 2) === b.value;
  return /^\d+$/.test(a) && Number(a) === b.value;
}

/* ── subnet: «Network master» ──────────────────────────────────────── */

export interface SubnetRound {
  a: string;
  b: string;
  prefix: number;
  same: boolean;
}

const PREFIXES = [24, 24, 24, 16, 25, 26, 8, 28] as const;

export function subnetRounds(seed: number): SubnetRound[] {
  const r = rng(seed ^ 0x85ebca6b);
  const int = (lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
  return Array.from({ length: ARCADE.subnet.rounds }, () => {
    const prefix = PREFIXES[int(0, PREFIXES.length - 1)];
    const base = [
      () => parseIp(`192.168.${int(0, 254)}.${int(1, 254)}`)!,
      () => parseIp(`10.${int(0, 254)}.${int(0, 254)}.${int(1, 254)}`)!,
      () => parseIp(`172.${int(16, 31)}.${int(0, 254)}.${int(1, 254)}`)!,
    ][int(0, 2)]();
    const mask = parseMask(maskFromPrefix(prefix))!;
    const hostBits = 32 - prefix;
    const network = (base & mask) >>> 0;
    const host = () => (network | (1 + Math.floor(r() * (2 ** hostBits - 2)))) >>> 0;
    const a = host();
    let b = host();
    if (r() < 0.5) {
      // another network: flip one of the last network bits (the tricky ones)
      const bit = 32 - prefix + int(0, Math.min(7, prefix - 1));
      b = (b ^ (1 << bit)) >>> 0;
    }
    if (b === a) b = (b ^ 1) >>> 0;
    return { a: formatIp(a), b: formatIp(b), prefix, same: sameSubnet(a, b, mask) };
  });
}

/* ── hands-on 3D games ─────────────────────────────────────────────── */

/** The broken computers of a «Find the fault» run (the same for one seed). */
export const handsOnFaults = (game: HandsOnGame, seed: number) => (game === 'fault' ? faultOrder(seed) : []);

/** A fresh racer for a hands-on run. */
export const handsOnStart = (game: HandsOnGame, seed: number): RacerState => newRacer(HANDS_ON_RACE[game], seed);

/** Replays the moves of a run; malformed moves are skipped, `ok` counts the moves that worked. */
export function replayHandsOn(game: HandsOnGame, seed: number, moves: readonly unknown[]): { state: RacerState; ok: number } {
  const kind = HANDS_ON_RACE[game];
  const faults = handsOnFaults(game, seed);
  let state = handsOnStart(game, seed);
  let ok = 0;
  for (const raw of moves) {
    const move = asMove(raw);
    if (!move || state.done) continue;
    const r = applyMove(kind, state, move, faults, seed);
    state = r.state;
    if (r.ok) ok++;
  }
  return { state, ok };
}

/** Points of a hands-on run: a finished job earns 1000, up to 1000 more for time left, 80 less per mistake. */
export function handsOnScore(done: boolean, progress: number, mistakes: number, elapsedMs: number, limitMs: number): number {
  if (!done) return Math.round(progress * 500);
  return Math.max(100, 1000 + Math.round(1000 * Math.max(0, 1 - elapsedMs / limitMs)) - mistakes * 80);
}

/* ── scoring (the referee) ─────────────────────────────────────────── */

export interface ArcadeResult {
  score: number;
  correct: number;
  total: number;
  mistakes: number;
  /** 0 … 3 stars (0.37). */
  stars: number;
}

/**
 * Stars of a run: three for a clean, fast job (or ≥ 90 % right), two for a
 * good one, one for finishing (or ≥ 40 % right).
 */
export function starsOf(game: ArcadeGame, r: Omit<ArcadeResult, 'stars'>, elapsedMs: number): number {
  const spec = ARCADE[game];
  if (spec.mode === 'build') {
    if (r.correct < r.total) return 0;
    if (r.mistakes === 0 && elapsedMs <= spec.seconds * 500) return 3;
    return r.mistakes <= 2 ? 2 : 1;
  }
  const share = spec.mode === 'timed' ? Math.min(1, r.correct / 25) * (r.total ? r.correct / r.total : 0) : r.total ? r.correct / r.total : 0;
  return share >= 0.9 ? 3 : share >= 0.7 ? 2 : share >= 0.4 ? 1 : 0;
}

/** Experience for a run (0.37): a tenth of the points, at least 5 for playing it through. */
export const xpOf = (r: ArcadeResult) => Math.max(5, Math.floor(r.score / 10));

export type ArcadeVerdict = { ok: true; result: ArcadeResult } | { ok: false; reason: 'tooFast' | 'expired' | 'badAnswers' };

/** Up to `max` bonus points for time left (rounds games), scaled by how many answers were right. */
const timeBonus = (max: number, elapsedMs: number, limitMs: number, share: number) => Math.round(max * share * Math.max(0, 1 - elapsedMs / limitMs));

/**
 * The score of a run from its answers and the time it took on the server's
 * clock. Refuses runs answered faster than humanly possible or far too late.
 */
export function scoreRun(game: ArcadeGame, seed: number, answers: unknown, elapsedMs: number): ArcadeVerdict {
  const spec = ARCADE[game];
  if (!Array.isArray(answers) || answers.length > (game === 'order' ? 60 : spec.rounds)) return { ok: false, reason: 'badAnswers' };
  const limit = spec.seconds * 1000;
  if (elapsedMs > limit + GRACE_MS) return { ok: false, reason: 'expired' };
  const replay = isHandsOn(game) ? replayHandsOn(game, seed, answers) : null;
  const counted = replay ? replay.ok : game === 'order' ? replayOrder(answers).installed.length : answers.filter((a) => a !== null && a !== '').length;
  if (counted > 0 && elapsedMs < counted * spec.minAnswerMs) return { ok: false, reason: 'tooFast' };
  const result = rawResult(game, seed, answers, elapsedMs, limit, replay?.state ?? null);
  return { ok: true, result: { ...result, stars: starsOf(game, result, elapsedMs) } };
}

function rawResult(game: ArcadeGame, seed: number, answers: unknown[], elapsedMs: number, limit: number, racer: RacerState | null): Omit<ArcadeResult, 'stars'> {
  if (racer) {
    // a hands-on job: done or how far it got; «correct» counts the finished share in steps of 1 %
    const correct = racer.done ? 100 : Math.floor(racer.progress * 100);
    return { score: handsOnScore(racer.done, racer.progress, racer.mistakes, elapsedMs, limit), correct, total: 100, mistakes: racer.mistakes };
  }
  if (game === 'device' || game === 'ports') {
    const keys = game === 'device' ? deviceRounds(seed).map((x) => x.device) : portRounds(seed).map((x) => PORT_JOBS[x.job]);
    const correct = keys.filter((k, i) => answers[i] === k).length;
    const total = keys.length;
    return { score: correct * 100 + timeBonus(500, elapsedMs, limit, correct / total), correct, total, mistakes: total - correct };
  }
  if (game === 'order') {
    const { installed, mistakes, done } = replayOrder(answers);
    const seconds = Math.floor(elapsedMs / 1000);
    const score = done ? Math.max(100, 1500 - mistakes * 100 - seconds * 10) : installed.length * 20;
    return { score, correct: installed.length, total: STEP_IDS.length, mistakes };
  }
  // timed games: points per right answer, a growing bonus for a streak
  const rounds = game === 'binary' ? binaryRounds(seed) : subnetRounds(seed);
  let score = 0;
  let streak = 0;
  let correct = 0;
  let mistakes = 0;
  answers.forEach((a, i) => {
    const round = rounds[i];
    const right = game === 'binary' ? binaryRight(round as BinaryRound, a) : typeof a === 'boolean' && a === (round as SubnetRound).same;
    if (right) {
      correct++;
      streak++;
      score += (game === 'binary' ? 100 : 50) + Math.min(streak - 1, 10) * (game === 'binary' ? 10 : 5);
    } else {
      mistakes++;
      streak = 0;
      // yes / no can be guessed: a wrong guess costs
      if (game === 'subnet') score -= 50;
    }
  });
  return { score: Math.max(0, score), correct, total: answers.length, mistakes };
}

/** A fresh seed (32-bit, positive). */
export const newSeed = () => Math.floor(Math.random() * 2 ** 31);
export const isSeed = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0 && (v as number) < 2 ** 31;
