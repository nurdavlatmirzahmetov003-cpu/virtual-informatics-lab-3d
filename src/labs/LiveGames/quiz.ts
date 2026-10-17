/**
 * Live quiz questions (V2-11b) from the lab's own device tests: every
 * device in DEVICES has three questions (its own, or its Computer Anatomy
 * item's) with a, b, c options and a known answer. Topics are the lab
 * zones. The server shuffles the options once per question (the same order
 * for every player) and keeps the right one to itself until the reveal.
 */
import { ANATOMY_ITEMS, type QuizOption } from '@/data/hardware/anatomy';
import { DEVICES } from '@/data/devices/devices';
import type { LabZoneId } from '@/data/lab/zones';

export const QUIZ_TOPICS = ['assembly', 'storage', 'peripherals', 'print_media', 'network', 'power', 'mobile'] as const satisfies readonly LabZoneId[];
export type QuizTopic = (typeof QUIZ_TOPICS)[number];

export interface BankQuestion {
  /** Locale base of the question: `<base>.question`, `<base>.a|b|c`, `<base>.explain`. */
  base: string;
  /** Locale key of the device's name (context line under the question). */
  device: string;
  topic: QuizTopic;
  correct: QuizOption;
}

const ANATOMY = new Map(ANATOMY_ITEMS.map((a) => [a.id, a]));

function buildBank(): BankQuestion[] {
  const seen = new Set<string>();
  const out: BankQuestion[] = [];
  for (const d of DEVICES) {
    if (!(QUIZ_TOPICS as readonly string[]).includes(d.zone)) continue;
    const anatomy = d.anatomy ? ANATOMY.get(d.anatomy) : undefined;
    const answers = anatomy?.answers ?? d.answers;
    if (!answers) continue;
    const root = anatomy ? `anatomy.items.${anatomy.id}` : `devices.${d.id}`;
    if (seen.has(root)) continue;
    seen.add(root);
    answers.forEach((correct, i) => out.push({ base: `${root}.quiz.q${i + 1}`, device: `${root}.name`, topic: d.zone as QuizTopic, correct }));
  }
  return out;
}

export const QUIZ_BANK: readonly BankQuestion[] = buildBank();

export const topicCounts = () => Object.fromEntries(QUIZ_TOPICS.map((t) => [t, QUIZ_BANK.filter((q) => q.topic === t).length])) as Record<QuizTopic, number>;

/** Small seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], r: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface LiveQuestion {
  base: string;
  device: string;
  /** Options in the order shown to everyone. */
  order: QuizOption[];
  /** Index into `order` of the right answer (server only until the reveal). */
  correct: number;
}

/** `count` questions from the chosen topics, one question per device at most where possible. */
export function buildQuiz(topics: readonly QuizTopic[], count: number, seed: number): LiveQuestion[] {
  const r = rng(seed);
  const pool = QUIZ_BANK.filter((q) => topics.includes(q.topic));
  // first one question per device, then the rest: variety before depth
  const byDevice = new Map<string, BankQuestion[]>();
  for (const q of shuffle(pool, r)) byDevice.set(q.device, [...(byDevice.get(q.device) ?? []), q]);
  const firsts = [...byDevice.values()].map((l) => l[0]);
  const rest = [...byDevice.values()].flatMap((l) => l.slice(1));
  return [...firsts, ...rest].slice(0, count).map((q) => {
    const order = shuffle(['a', 'b', 'c'] as QuizOption[], r);
    return { base: q.base, device: q.device, order, correct: order.indexOf(q.correct) };
  });
}

/** Points for one answer: 500 for being right, up to 500 more for speed. */
export const QUIZ_POINTS = 1000;
export function quizPoints(correct: boolean, msLeft: number, limitMs: number): number {
  if (!correct) return 0;
  const speed = Math.max(0, Math.min(1, msLeft / limitMs));
  return Math.round(QUIZ_POINTS * (0.5 + 0.5 * speed));
}
