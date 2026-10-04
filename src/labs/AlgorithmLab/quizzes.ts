/**
 * Mini tasks. Each variant is generated from a seed (reproducible, so a
 * teacher and the tests see the same question) and graded through the shared
 * grading service. Wrong answers come back with the reason, not just "wrong".
 */
import type { Exercise, Feedback } from '@/services/grading';
import { randInt, randomArray, rng, shuffle, toItems } from './arrays';
import { binarySearch } from './searches';

export const QUIZ_IDS = ['nextSwap', 'binarySteps', 'bubblePass'] as const;
export type QuizId = (typeof QUIZ_IDS)[number];
export const isQuizId = (v: unknown): v is QuizId => QUIZ_IDS.includes(v as QuizId);

export interface QuizOption {
  id: string;
  /** pair: [a, b] · count: [k] · array: the values. */
  values: number[];
}

export interface QuizVariant {
  quiz: QuizId;
  seed: number;
  /** The array shown with the question. */
  array: number[];
  options: QuizOption[];
  correct: string;
  /** Params for the question and the explanation. */
  params: Record<string, string | number>;
}

export interface QuizWork {
  variant: QuizVariant;
  choice: string | null;
}

export function optionLabel(quiz: QuizId, o: QuizOption): string {
  if (quiz === 'nextSwap') return `${o.values[0]} ↔ ${o.values[1]}`;
  if (quiz === 'binarySteps') return String(o.values[0]);
  return `[${o.values.join(', ')}]`;
}

const same = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// ---------------------------------------------------------------------------

function nextSwap(seed: number): QuizVariant {
  const next = rng(seed);
  for (;;) {
    const start = randomArray(next, 6, 1, 40);
    const a = [...start];
    const n = a.length;
    const candidates: Array<{ array: number[]; pass: number; j: number; k: number }> = [];
    for (let pass = 1; pass < n; pass++) {
      for (let j = 0; j < n - pass; j++) {
        let k = j;
        while (k < n - pass && a[k] <= a[k + 1]) k++;
        if (k < n - pass) candidates.push({ array: [...a], pass, j, k });
        if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
      }
    }
    const later = candidates.filter((c) => c.k > c.j);
    const pool = later.length && next() < 0.75 ? later : candidates;
    if (!pool.length) continue;
    const c = pool[randInt(next, 0, pool.length - 1)];
    const pairs = c.array.slice(0, -1).map((v, i) => ({ id: `p${i}`, values: [v, c.array[i + 1]] }));
    const correct = pairs[c.k];
    const options = shuffle([correct, ...shuffle(pairs.filter((p) => p !== correct), next).slice(0, 3)], next);
    const trace = c.array
      .slice(c.j, c.k + 1)
      .map((v, i) => `${v} ${v > c.array[c.j + i + 1] ? '>' : '≤'} ${c.array[c.j + i + 1]}`)
      .join(', ');
    return {
      quiz: 'nextSwap',
      seed,
      array: c.array,
      options,
      correct: correct.id,
      params: { pass: c.pass, j: c.j, j1: c.j + 1, last: n - c.pass, trace, answer: optionLabel('nextSwap', correct) },
    };
  }
}

function binarySteps(seed: number): QuizVariant {
  const next = rng(seed);
  const n = randInt(next, 7, 15);
  const array = randomArray(next, n, 1, 99).sort((x, y) => x - y);
  const index = randInt(next, 0, n - 1);
  const target = array[index];
  const run = binarySearch(toItems(array), target);
  const count = run.steps.at(-1)!.stats.comparisons;
  const mids = run.steps.filter((s) => s.hl.compare.length || s.hl.found !== null).map((s) => {
    const i = s.hl.found ?? s.hl.compare[0];
    return `a[${i}] = ${array[i]}`;
  });
  const options = [1, 2, 3, 4].map((k) => ({ id: `c${k}`, values: [k] }));
  return {
    quiz: 'binarySteps',
    seed,
    array,
    options,
    correct: `c${count}`,
    params: { target, n, count, trace: mids.join(' → '), linear: index + 1 },
  };
}

function bubblePass(seed: number): QuizVariant {
  const next = rng(seed);
  for (;;) {
    const array = randomArray(next, 6, 1, 50);
    const sorted = [...array].sort((x, y) => x - y);
    const once = [...array];
    const swaps: string[] = [];
    for (let j = 0; j < once.length - 1; j++) {
      if (once[j] > once[j + 1]) {
        swaps.push(`${once[j]} ↔ ${once[j + 1]}`);
        [once[j], once[j + 1]] = [once[j + 1], once[j]];
      }
    }
    if (same(once, sorted) || same(once, array) || swaps.length < 2) continue;

    const firstSwap = [...array];
    const f = firstSwap.findIndex((v, i) => i < firstSwap.length - 1 && v > firstSwap[i + 1]);
    [firstSwap[f], firstSwap[f + 1]] = [firstSwap[f + 1], firstSwap[f]];
    const selection = [...array];
    const m = selection.indexOf(Math.min(...selection));
    [selection[0], selection[m]] = [selection[m], selection[0]];
    const max = Math.max(...array);
    const maxToEnd = [...array.filter((v) => v !== max), max];

    const distractors: number[][] = [];
    for (const d of [sorted, firstSwap, selection, maxToEnd, [...array].reverse()]) {
      if (!same(d, once) && !distractors.some((x) => same(x, d))) distractors.push(d);
    }
    if (distractors.length < 3) continue;
    const options = shuffle([once, ...distractors.slice(0, 3)], next).map((values, i) => ({ id: `o${i}`, values }));
    const correct = options.find((o) => same(o.values, once))!;
    return {
      quiz: 'bubblePass',
      seed,
      array,
      options,
      correct: correct.id,
      params: { max, swaps: swaps.join(', '), answer: optionLabel('bubblePass', correct) },
    };
  }
}

export function makeQuiz(quiz: QuizId, seed: number): QuizVariant {
  if (quiz === 'nextSwap') return nextSwap(seed);
  if (quiz === 'binarySteps') return binarySteps(seed);
  return bubblePass(seed);
}

// ---------------------------------------------------------------------------

function exercise(quiz: QuizId): Exercise<QuizWork> {
  const key = (k: string) => `algorithms.quiz.${quiz}.${k}`;
  return {
    id: `algorithm:${quiz}`,
    type: 'algorithm',
    instructions: { key: key('question') },
    expectedResult: { key: key('expected') },
    maxScore: 10,
    hints: [1, 2, 3].map((n) => ({ key: key(`hint${n}`) })),
    gradingRules: [
      {
        id: 'answer',
        points: 10,
        label: { key: key('rule') },
        evaluate: ({ variant, choice }) => {
          if (!choice) return { passed: false, feedback: [{ key: 'algorithms.quiz.noChoice' }] };
          if (choice === variant.correct) return { passed: true };
          const chosen = variant.options.find((o) => o.id === choice);
          const feedback: Feedback = {
            key: 'algorithms.quiz.wrong',
            params: { chosen: chosen ? optionLabel(quiz, chosen) : '—', correct: optionLabel(quiz, variant.options.find((o) => o.id === variant.correct)!) },
            detail: { key: key('why'), params: variant.params },
          };
          return { passed: false, feedback: [feedback] };
        },
      },
    ],
  };
}

export const QUIZZES: Record<QuizId, Exercise<QuizWork>> = {
  nextSwap: exercise('nextSwap'),
  binarySteps: exercise('binarySteps'),
  bubblePass: exercise('bubblePass'),
};
