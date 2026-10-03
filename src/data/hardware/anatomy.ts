/**
 * Computer Anatomy (Hardware Explorer) content model. Only structure lives
 * here — every visible string is in `locales/<lang>.json` under
 * `anatomy.items.<id>`: name, description, purpose, specs.<key>.{label,value},
 * compat and quiz.q1–q3.{question,a,b,c,explain}.
 * Values are typical textbook figures, not a product catalogue.
 */
export type AnatomyCategory = 'external' | 'internal';

export type AnatomyId = 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'microphone' | 'webcam' | 'speaker' | 'printer' | 'motherboard' | 'cpu' | 'ram' | 'gpu' | 'ssd' | 'hdd' | 'psu' | 'cooler' | 'fans' | 'nic';

export type QuizOption = 'a' | 'b' | 'c';

export interface AnatomyItem {
  id: AnatomyId;
  category: AnatomyCategory;
  /** Keys under anatomy.items.<id>.specs, in display order. */
  specs: readonly string[];
  /** Correct option of quiz questions q1, q2, q3. */
  answers: readonly [QuizOption, QuizOption, QuizOption];
}

export const ANATOMY_CATEGORIES: readonly AnatomyCategory[] = ['external', 'internal'];
export const QUIZ_OPTIONS: readonly QuizOption[] = ['a', 'b', 'c'];

export const ANATOMY_ITEMS: readonly AnatomyItem[] = [
  { id: 'monitor', category: 'external', specs: ['diagonal', 'resolution', 'refresh', 'ports'], answers: ['a', 'c', 'b'] },
  { id: 'keyboard', category: 'external', specs: ['type', 'layout', 'keys', 'connection'], answers: ['b', 'a', 'c'] },
  { id: 'mouse', category: 'external', specs: ['sensor', 'dpi', 'buttons', 'connection'], answers: ['c', 'b', 'a'] },
  { id: 'headset', category: 'external', specs: ['type', 'freq', 'connection', 'mic'], answers: ['a', 'c', 'b'] },
  { id: 'microphone', category: 'external', specs: ['type', 'pattern', 'connection', 'sampling'], answers: ['b', 'a', 'c'] },
  { id: 'webcam', category: 'external', specs: ['resolution', 'fps', 'mic', 'connection'], answers: ['c', 'b', 'a'] },
  { id: 'speaker', category: 'external', specs: ['system', 'power', 'freq', 'connection'], answers: ['a', 'c', 'b'] },
  { id: 'printer', category: 'external', specs: ['type', 'resolution', 'speed', 'connection'], answers: ['b', 'a', 'c'] },
  { id: 'motherboard', category: 'internal', specs: ['formFactor', 'socket', 'ram', 'expansion'], answers: ['c', 'b', 'a'] },
  { id: 'cpu', category: 'internal', specs: ['cores', 'clock', 'cache', 'tdp'], answers: ['a', 'c', 'b'] },
  { id: 'ram', category: 'internal', specs: ['capacity', 'type', 'speed', 'channel'], answers: ['b', 'a', 'c'] },
  { id: 'gpu', category: 'internal', specs: ['vram', 'bus', 'power', 'ports'], answers: ['c', 'b', 'a'] },
  { id: 'ssd', category: 'internal', specs: ['form', 'interface', 'speed', 'capacity'], answers: ['a', 'c', 'b'] },
  { id: 'hdd', category: 'internal', specs: ['form', 'rpm', 'capacity', 'speed'], answers: ['b', 'a', 'c'] },
  { id: 'psu', category: 'internal', specs: ['power', 'efficiency', 'voltages', 'connectors'], answers: ['c', 'b', 'a'] },
  { id: 'cooler', category: 'internal', specs: ['type', 'tdp', 'height', 'paste'], answers: ['a', 'c', 'b'] },
  { id: 'fans', category: 'internal', specs: ['size', 'speed', 'connector', 'noise'], answers: ['b', 'a', 'c'] },
  { id: 'nic', category: 'internal', specs: ['type', 'speed', 'port', 'interface'], answers: ['c', 'b', 'a'] },
];

export const itemsIn = (category: AnatomyCategory) => ANATOMY_ITEMS.filter((item) => item.category === category);
export const anatomyItem = (id: AnatomyId) => ANATOMY_ITEMS.find((item) => item.id === id)!;
