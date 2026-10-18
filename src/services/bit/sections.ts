/**
 * Every place Bit can open, with the words students use for it in Kazakh,
 * Russian and English. Pure data: the intent parser (browser) and the
 * Gemini prompt (server) share it, so the model can only name these ids.
 *
 * Words are matched at the start of a word ("желі" also finds "желілер"),
 * several-word entries anywhere in the phrase. Keep short stems distinct:
 * Russian "сет" would also hit "сетап".
 */
export const SECTION_IDS = [
  'home',
  'lab',
  'explorer',
  'labs',
  'studio',
  'assembly',
  'network',
  'connect',
  'sim',
  'algorithms',
  'logic',
  'experiments',
  'tasks',
  'progress',
  'leaderboard',
  'live',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export interface Section {
  id: SectionId;
  route: string;
  /** Locale key of the section's display name. */
  nameKey: string;
  words: readonly string[];
}

export const SECTIONS: readonly Section[] = [
  { id: 'home', route: '/', nameKey: 'nav.home', words: ['басты бет', 'бастапқы бет', 'главн', 'домашн', 'home', 'main page', 'start page'] },
  { id: 'lab', route: '/lab', nameKey: 'nav.lab', words: ['3d зертхана', 'кабинет', 'зал', '3d лаборатор', '3d lab', 'hall', 'classroom', 'үлкен зертхана'] },
  { id: 'explorer', route: '/explorer', nameKey: 'nav.explorer', words: ['анатомия', 'анатоми', 'anatomy', 'hardware explorer'] },
  { id: 'labs', route: '/labs', nameKey: 'nav.labs', words: ['зертханалар', 'зертханалар тізімі', 'лаборатории', 'список лаборатор', 'all labs', 'labs'] },
  { id: 'studio', route: '/studio', nameKey: 'nav.studio', words: ['сетап', 'setup', 'студия', 'студи', 'studio', 'конфигуратор', 'configurator'] },
  { id: 'assembly', route: '/labs/assembly', nameKey: 'labs.modules.assembly.title', words: ['компьютер жинау', 'пк жинау', 'жинау зертхана', 'құрастыр', 'сборк', 'собрать пк', 'собрать компьютер', 'assembly', 'pc build lab', 'build a pc lab'] },
  { id: 'network', route: '/labs/network', nameKey: 'labs.modules.network.title', words: ['желі', 'желілер', 'сеть', 'сети', 'сетей', 'сетям', 'сетях', 'сетев', 'network', 'ping', 'пинг', 'ip мекенжай', 'ip адрес', 'ip address'] },
  { id: 'connect', route: '/labs/connect', nameKey: 'connect.title', words: ['жалғау', 'кабель', 'кабел', 'подключ', 'cable', 'connect', 'порттар', 'порты', 'ports'] },
  { id: 'sim', route: '/labs/sim', nameKey: 'sim.title', words: ['себеп', 'салдар', 'симуляц', 'ақау', 'причин', 'следстви', 'неисправ', 'cause', 'effect', 'simulat', 'fault'] },
  { id: 'algorithms', route: '/labs/algorithms', nameKey: 'labs.modules.algorithms.title', words: ['алгоритм', 'сұрыптау', 'сортиров', 'algorithm', 'sorting'] },
  { id: 'logic', route: '/labs/logic', nameKey: 'labs.modules.logic.title', words: ['логика', 'логикалық', 'вентиль', 'логик', 'вентил', 'logic', 'gate'] },
  { id: 'experiments', route: '/labs/experiments', nameKey: 'labs.modules.experiments.title', words: ['тәжірибе', 'эксперимент', 'опыт', 'experiment'] },
  { id: 'tasks', route: '/assignments', nameKey: 'labs.modules.assignments.title', words: ['тапсырма', 'задани', 'task', 'assignment'] },
  { id: 'progress', route: '/progress', nameKey: 'nav.progress', words: ['нәтиже', 'прогресс', 'жетістік', 'результат', 'достижен', 'progress', 'results', 'achievement'] },
  { id: 'leaderboard', route: '/leaderboard', nameKey: 'game.title', words: ['рейтинг', 'көшбасшы', 'лидер', 'leaderboard', 'ranking'] },
  { id: 'live', route: '/live', nameKey: 'live.title', words: ['тікелей ойын', 'викторина', 'живые игры', 'викторин', 'live game', 'quiz'] },
];

export const sectionById = (id: string): Section | undefined => SECTIONS.find((s) => s.id === id);
export const isSectionId = (v: unknown): v is SectionId => typeof v === 'string' && (SECTION_IDS as readonly string[]).includes(v);

/** The section a route belongs to (longest matching prefix), for "where am I". */
export function sectionOfPath(path: string): SectionId {
  let best: Section = SECTIONS[0];
  for (const s of SECTIONS) if ((path === s.route || path.startsWith(`${s.route}/`)) && s.route.length > best.route.length) best = s;
  return best.id;
}
