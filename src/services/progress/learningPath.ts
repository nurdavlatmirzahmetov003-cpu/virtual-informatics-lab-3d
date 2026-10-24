/**
 * A personal learning path (0.37), worked out from the student's own
 * progress — nothing new is stored on the server:
 *
 *   - the next step: the first task, in the suggested learning order, that
 *     is not done yet;
 *   - the review list: tasks finished with mistakes (under 80 %) come back
 *     after a day; finished ones come back later and later (1, 3, 7, 21
 *     days) — spaced repetition, so what was learnt is not forgotten;
 *   - flash cards: short questions from Bit's built-in answers on the labs
 *     where the student is weakest, in Leitner boxes (a card the student
 *     knew comes back after 1, 3, 7, 14, 30 days; one they did not, tomorrow).
 *
 * Pure functions; the cards' boxes live in this browser (see cardsStore).
 */
import type { FaqId } from '@/services/bit/faq';
import { LAB_IDS, TASKS, type LabId, type TaskInfo } from './catalog';
import type { ProgressSnapshot } from './types';

export const DAY = 86_400_000;
/** Days until a finished task comes back, by how many times it has been done. */
export const TASK_INTERVALS = [1, 3, 7, 21] as const;
/** Days until a known card comes back, by its Leitner box (1 … 5). */
export const BOX_DAYS = [0, 1, 3, 7, 14, 30] as const;
export const WEAK = 80;

/** The next task to do: the first one in the learning order that is not completed. */
export const nextStep = (s: ProgressSnapshot): TaskInfo | null => TASKS.find((t) => !s.exercises[t.id]?.completedAt) ?? null;

export interface ReviewItem {
  task: TaskInfo;
  /** Best result, 0 … 100. */
  best: number;
  weak: boolean;
  dueAt: number;
}

/** Tasks to come back to, the most urgent first; `due` ones are due now. */
export function reviewQueue(s: ProgressSnapshot, now: number): { due: ReviewItem[]; later: ReviewItem[] } {
  const items: ReviewItem[] = [];
  for (const task of TASKS) {
    const p = s.exercises[task.id];
    if (!p) continue;
    const best = p.best.percent;
    const weak = best < WEAK;
    const days = weak ? 1 : TASK_INTERVALS[Math.min(p.attempts, TASK_INTERVALS.length) - 1];
    items.push({ task, best, weak, dueAt: p.lastAt + days * DAY });
  }
  items.sort((a, b) => Number(b.weak) - Number(a.weak) || a.dueAt - b.dueAt || a.task.order - b.task.order);
  return { due: items.filter((i) => i.dueAt <= now), later: items.filter((i) => i.dueAt > now) };
}

/** Average best result per lab (null: nothing done there yet). */
export function labScores(s: ProgressSnapshot): Record<LabId, number | null> {
  const out = {} as Record<LabId, number | null>;
  for (const lab of LAB_IDS) {
    const done = TASKS.filter((t) => t.lab === lab && s.exercises[t.id]);
    out[lab] = done.length ? Math.round(done.reduce((sum, t) => sum + s.exercises[t.id].best.percent, 0) / done.length) : null;
  }
  return out;
}

/** Bit's topics that go with each lab (the flash cards' pool). */
export const LAB_TOPICS: Readonly<Record<LabId, readonly FaqId[]>> = {
  hardware: ['cpu', 'ram', 'storage', 'gpu', 'motherboard', 'psu', 'cooling', 'clockSpeed', 'cores', 'cache', 'bios', 'ports', 'inputOutput', 'monitor'],
  assembly: ['motherboard', 'cpu', 'ram', 'psu', 'cooling', 'thermalPaste', 'storage', 'gpu'],
  network: ['network', 'internet', 'ip', 'router', 'switch', 'wifi', 'lanWan', 'topology', 'protocol', 'dhcp', 'ping', 'mac', 'https'],
  algorithms: ['algorithm', 'algorithmTypes', 'flowchart', 'sorting', 'bubbleSort', 'binarySearch', 'recursion', 'loop', 'condition', 'variable'],
  logic: ['logicGates', 'truthTable', 'binary', 'bitByte'],
  experiments: ['binary', 'bitByte', 'pixel', 'colorModel', 'sound', 'encoding', 'monitor', 'cooling', 'informationAmount'],
};

export interface Card {
  /** Leitner box 1 … 5 (0: never seen). */
  box: number;
  dueAt: number;
}
export type Cards = Record<string, Card>;

/** The card after an answer: one box up when known, back to box 1 when not. */
export function answerCard(card: Card | undefined, knew: boolean, now: number): Card {
  const box = knew ? Math.min(5, (card?.box ?? 0) + 1) : 1;
  return { box, dueAt: now + BOX_DAYS[box] * DAY };
}

/**
 * Cards for one session: the due ones first, then new ones, from the
 * weakest labs first (labs never tried count as weak too).
 */
export function sessionCards(cards: Cards, scores: Record<LabId, number | null>, now: number, size = 5): FaqId[] {
  const labs = [...LAB_IDS].sort((a, b) => (scores[a] ?? -1) - (scores[b] ?? -1));
  const pool: FaqId[] = [];
  for (const lab of labs) for (const id of LAB_TOPICS[lab]) if (!pool.includes(id)) pool.push(id);
  const due = pool.filter((id) => cards[id] && cards[id].dueAt <= now).sort((a, b) => cards[a].dueAt - cards[b].dueAt);
  const fresh = pool.filter((id) => !cards[id]);
  return [...due, ...fresh].slice(0, size);
}
