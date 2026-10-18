/**
 * What the student wants from Bit, decided locally and instantly — no
 * network: stop talking, a site tour, a step-by-step lesson, opening a
 * section, a PC for a budget, a built-in answer, or (only then) a question
 * for the language model. Accepts Kazakh, Russian and English whatever the
 * site language is; the reply language is chosen elsewhere (always the
 * site's).
 */
import { matchFaq, isShortQuestion, type FaqId } from './faq';
import { SECTIONS, type SectionId } from './sections';
import { LESSON_IDS, type LessonId } from './lessons';
import { countStems, hasStem, normalize, stripWakeWord } from './text';
import { wordsToDigits } from './numbers';

export type Intent =
  | { kind: 'empty' }
  | { kind: 'stop' }
  | { kind: 'next' }
  | { kind: 'greet' }
  | { kind: 'tour' }
  | { kind: 'lesson'; lesson: LessonId }
  | { kind: 'navigate'; section: SectionId }
  | { kind: 'build'; message: string }
  | { kind: 'faq'; id: FaqId; fallback: boolean }
  | { kind: 'ask'; message: string };

const STOP = ['тоқта', 'тоқтат', 'үндеме', 'жетеді', 'стоп', 'хватит', 'замолчи', 'остановись', 'stop', 'be quiet', 'enough', 'cancel', 'отмена', 'болдырма'];
const NEXT = ['әрі қарай', 'келесі', 'жалғастыр', 'дальше', 'следующ', 'продолж', 'next', 'continue', 'go on'];
const GREET = ['сәлем', 'салем', 'сәлеметсіз', 'қайырлы', 'привет', 'здравствуй', 'добрый', 'hello', 'hi', 'hey', 'good morning'];
const TOUR = ['саяхат', 'экскурс', 'тур', 'tour', 'сайтты көрсет', 'сайтты таныстыр', 'покажи сайт', 'show me the site', 'show me around', 'сайт бойынша', 'по сайту'];
const LESSON = ['сабақ', 'сабағ', 'урок', 'lesson', 'қадам', 'шаг', 'step by step', 'бірге орында', 'научи', 'teach me', 'үйрет', 'start the lesson', 'начни урок', 'сабақты баста'];
const OPEN = ['аш', 'ашып', 'ашшы', 'көрсет', 'апар', 'өтші', 'өтейік', 'кірші', 'кірейік', 'открой', 'откро', 'перейд', 'покажи', 'зайди', 'веди', 'open', 'go to', 'take me', 'show', 'navigate'];
/** A question about the thing, not a wish to go there: "желі деген не?" */
const QUESTION = ['деген', 'дегеніміз', 'не үшін', 'неге', 'қалай', 'қандай', 'что', 'как', 'почему', 'зачем', 'какой', 'what', 'how', 'why', 'which'];
const BUILD = ['компьютер', 'пк', 'pc', 'computer', 'сетап', 'setup', 'жина', 'құрастыр', 'собер', 'собрать', 'сборк', 'build', 'assemble', 'конфигурац'];
/** "500 000", "500к", "500 мың", "1,2 млн", "400000 тг" — a budget means a PC request. */
const MONEY = /\d[\d\s]*(?:[.,]\d+)?\s*(?:млн|миллион|million|тыс|мың|k(?![a-z])|к(?![а-яёәғқңөұүһі])|₸|теңге|тенге|tenge|тг|tg)|\d{2,3}\s?\d{3}\s?\d{3}|\b\d{5,7}\b/iu;

/** The section named in the text with the most matching words (ties: the more specific, later one). */
export function findSection(normalized: string): SectionId | null {
  let best: { id: SectionId; score: number } | null = null;
  for (const s of SECTIONS) {
    const score = countStems(normalized, s.words);
    if (score > 0 && (!best || score >= best.score)) best = { id: s.id, score };
  }
  return best?.id ?? null;
}

const lessonFor = (section: SectionId | null): LessonId | null => (section && (LESSON_IDS as readonly string[]).includes(section) ? (section as LessonId) : null);

export function understand(raw: string, options: { modelAvailable?: boolean } = {}): Intent {
  // amounts said in words («бес жүз мың») become digits for the budget
  const text = wordsToDigits(stripWakeWord(raw));
  const n = normalize(text);
  // just "Бит!": the student is calling, answer with a greeting
  if (!n) return normalize(raw) ? { kind: 'greet' } : { kind: 'empty' };
  const wordCount = n.split(' ').length;

  if (wordCount <= 3 && countStems(n, STOP)) return { kind: 'stop' };
  if (wordCount <= 3 && countStems(n, NEXT)) return { kind: 'next' };
  if (countStems(n, TOUR)) return { kind: 'tour' };

  const section = findSection(n);
  if (MONEY.test(text) && countStems(n, BUILD)) return { kind: 'build', message: text };
  const lesson = lessonFor(section);
  if (lesson && countStems(n, LESSON)) return { kind: 'lesson', lesson };
  const question = /\?/.test(raw) || countStems(n, QUESTION) > 0;
  if (section && (countStems(n, OPEN) || (wordCount <= 3 && !question))) return { kind: 'navigate', section };

  const faq = matchFaq(n);
  // one topic, asked briefly: the built-in answer is complete; two topics ("CPU vs GPU") need the model
  if (faq && (!options.modelAvailable || ((isShortQuestion(n) || faq.score >= 4) && faq.topics === 1))) return { kind: 'faq', id: faq.id, fallback: false };
  if (wordCount <= 3 && countStems(n, GREET)) return { kind: 'greet' };
  if (!options.modelAvailable && faq) return { kind: 'faq', id: faq.id, fallback: true };
  return { kind: 'ask', message: text };
}

/** For tests and the UI: does the text address Bit by name ("Бит, …")? */
export const addressesBit = (raw: string) => stripWakeWord(raw) !== raw.trim() || hasStem(normalize(raw), 'бит');
