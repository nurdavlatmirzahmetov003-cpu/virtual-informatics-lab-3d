/**
 * Bit's built-in answers: the topics and the words that call them, in all
 * three languages (a student may ask in Russian on the Kazakh site — Bit
 * still answers in the site's language). The answers themselves live in
 * content/<lang>.ts, loaded with the assistant. Works without a network.
 */
import { CURRICULUM_IDS, CURRICULUM_KEYS } from './faqCurriculum';
import { hasStem, normalize, words } from './text';

/** The first sixty topics (0.36); the curriculum topics (0.37) follow them. */
const CORE_IDS = [
  'computer',
  'cpu',
  'ram',
  'storage',
  'gpu',
  'motherboard',
  'psu',
  'cooling',
  'os',
  'binary',
  'bitByte',
  'algorithm',
  'programming',
  'network',
  'internet',
  'ip',
  'router',
  'switch',
  'wifi',
  'password',
  'safety',
  'virus',
  'cloud',
  'inputOutput',
  'monitor',
  'ai',
  'file',
  'who',
  'help',
  'progress',
  'keyboard',
  'mouse',
  'printer',
  'usb',
  'bluetooth',
  'laptop',
  'smartphone',
  'server',
  'encryption',
  'backup',
  'update',
  'browser',
  'searchEngine',
  'email',
  'cyberbullying',
  'digitalFootprint',
  'copyright',
  'spreadsheet',
  'database',
  'variable',
  'loop',
  'condition',
  'bug',
  'website',
  'domain',
  'logicGates',
  'hexadecimal',
  'encoding',
  'pixel',
  'compression',
] as const;
export const FAQ_IDS = [...CORE_IDS, ...CURRICULUM_IDS] as const;
export type FaqId = (typeof FAQ_IDS)[number];

/** Topic words; `strong` ones decide alone, `weak` ones only together with another hit. */
interface FaqKeys {
  strong: readonly string[];
  weak?: readonly string[];
}

const CORE_KEYS: Record<(typeof CORE_IDS)[number], FaqKeys> = {
  computer: { strong: ['компьютер деген', 'что такое компьютер$', 'what is a computer$', 'компьютер дегеніміз'] },
  cpu: { strong: ['процессор', 'процессорд', 'cpu', 'processor', 'орталық процессор'] },
  ram: { strong: ['жедел жад', 'жедел жат', 'оперативн', 'ram', 'озу', 'memory'], weak: ['жад'] },
  storage: { strong: ['ssd', 'hdd', 'қатқыл диск', 'жесткий диск', 'hard drive', 'hard disk', 'накопител', 'жинақтауыш', 'storage'] },
  gpu: { strong: ['видеокарта', 'видеокарт', 'gpu', 'graphics card', 'video card'] },
  motherboard: { strong: ['аналық плата', 'материнск', 'motherboard', 'аналық тақта'] },
  psu: { strong: ['қуат блог', 'блок питания', 'power supply', 'psu'] },
  cooling: { strong: ['салқындат', 'кулер', 'охлажден', 'cooling', 'cooler', 'радиатор', 'қызып', 'перегрев', 'overheat'] },
  os: { strong: ['операциялық жүйе', 'операционн', 'operating system', 'windows', 'linux', 'android', 'macos'] },
  binary: { strong: ['екілік', 'двоичн', 'binary', 'нөл мен бір', 'ноль и один', 'екілік санау', 'двоичн систем', 'binary number'] },
  bitByte: { strong: ['байт', 'byte', 'килобайт', 'мегабайт', 'гигабайт', 'kilobyte', 'megabyte', 'gigabyte'], weak: ['бит', 'bit'] },
  algorithm: { strong: ['алгоритм деген', 'что такое алгоритм', 'what is an algorithm', 'алгоритм дегеніміз'], weak: ['алгоритм', 'algorithm'] },
  programming: { strong: ['бағдарламала', 'программирован', 'programming', 'javascript', 'код жаз', 'писать код', 'write code', 'бағдарламалау тілі', 'язык программир'] },
  network: { strong: ['желі', 'сеть', 'network', 'желі деген', 'компьютерлік желі', 'жергілікті желі', 'что такое сеть', 'компьютерная сеть', 'локальная сеть', 'what is a network', 'computer network', 'local network', 'lan'] },
  internet: { strong: ['интернет', 'internet', 'tcp'] },
  ip: { strong: ['ip мекенжай', 'ip адрес', 'ip address', 'айпи', 'маска', 'subnet'] },
  router: { strong: ['роутер', 'маршрутизатор', 'router'] },
  switch: { strong: ['коммутатор', 'свитч', 'switch', 'network switch'] },
  wifi: { strong: ['wi fi', 'wifi', 'вайфай', 'вай фай', 'сымсыз', 'беспровод', 'wireless'] },
  password: { strong: ['құпия сөз', 'пароль', 'password', 'құпиясөз'] },
  safety: { strong: ['қауіпсіз', 'безопасн', 'safety', 'safe online', 'stay safe', 'интернетте қауіпсіз', 'қауіпсіз бол', 'безопасности в интернете'] },
  virus: { strong: ['вирус', 'virus', 'антивирус', 'antivirus', 'malware', 'зиянды бағдарлама'] },
  cloud: { strong: ['бұлт', 'облак', 'облачн', 'cloud', 'google drive'] },
  inputOutput: { strong: ['енгізу құрылғы', 'шығару құрылғы', 'устройства ввода', 'устройства вывода', 'input device', 'output device', 'енгізу және шығару', 'ввода и вывода', 'input and output'] },
  monitor: { strong: ['монитор', 'monitor', 'ажыратымдыл', 'разрешени', 'resolution', 'герц', 'hz', 'гц'] },
  ai: { strong: ['жасанды интеллект', 'искусственн', 'artificial intelligence', 'нейросет', 'нейрожелі', 'neural network', 'chatgpt', 'gemini'] },
  file: { strong: ['файл', 'file', 'қалта', 'папк', 'folder', 'кеңейтім', 'расширени файл', 'file extension'] },
  who: { strong: ['сен кімсің', 'кімсің', 'ты кто', 'кто ты', 'who are you', 'сенің атың', 'как тебя зовут', 'your name'] },
  help: { strong: ['не істей аласың', 'не білесің', 'что ты умеешь', 'что ты можешь', 'what can you do', 'көмек', 'помощь', 'help'] },
  progress: { strong: ['менің нәтиже', 'мои результат', 'my results', 'ұпайым', 'мои баллы', 'my score', 'xp', 'деңгейім', 'мой уровень', 'my level'] },
  keyboard: { strong: ['пернетақта', 'клавиатур', 'keyboard'] },
  mouse: { strong: ['тінтуір', 'тышқан', 'мышь', 'мышк', 'computer mouse', 'mouse'] },
  printer: { strong: ['принтер', 'printer', 'басып шығар', 'печата'] },
  usb: { strong: ['usb', 'флешка', 'flash drive'] },
  bluetooth: { strong: ['bluetooth', 'блютуз', 'блютус'] },
  laptop: { strong: ['ноутбук', 'laptop'] },
  smartphone: { strong: ['смартфон', 'smartphone', 'телефон', 'phone'] },
  server: { strong: ['сервер', 'server', 'деректер орталығ', 'дата центр', 'data center'] },
  encryption: { strong: ['шифрла', 'шифрован', 'encrypt', 'криптограф'] },
  backup: { strong: ['сақтық көшірме', 'резервн', 'backup', 'бэкап'] },
  update: { strong: ['жаңарту', 'жаңартул', 'обновлени', 'обнов', 'update'] },
  browser: { strong: ['браузер', 'browser', 'chrome', 'firefox'] },
  searchEngine: { strong: ['іздеу жүйе', 'поисков', 'search engine', 'интернеттен іздеу'] },
  email: { strong: ['электрондық пошта', 'электронная почта', 'электронной почт', 'email', 'e mail', 'gmail'] },
  cyberbullying: { strong: ['кибербуллинг', 'кибербулинг', 'cyberbullying', 'буллинг', 'травл', 'bullying'] },
  digitalFootprint: { strong: ['цифрлық із', 'цифровой след', 'цифровом след', 'digital footprint'] },
  copyright: { strong: ['авторлық құқық', 'авторское право', 'авторск', 'copyright', 'пиратт', 'пиратск', 'piracy'] },
  spreadsheet: { strong: ['электрондық кесте', 'таблиц', 'excel', 'spreadsheet'] },
  database: { strong: ['дерекқор', 'база данных', 'баз данных', 'database', 'sql'] },
  variable: { strong: ['айнымалы', 'переменн', 'variable'] },
  loop: { strong: ['цикл', 'loop'] },
  condition: { strong: ['шартты оператор', 'шарт операторы', 'условный оператор', 'условн', 'if statement', 'if else', 'condition'] },
  bug: { strong: ['баг', 'bug', 'отладк', 'debug'] },
  website: { strong: ['сайт қалай', 'сайт жаса', 'создают сайт', 'создать сайт', 'website', 'html', 'css'] },
  domain: { strong: ['домен', 'domain', 'url', 'dns'] },
  logicGates: { strong: ['вентиль', 'вентил', 'logic gate', 'логикалық вентиль'] },
  hexadecimal: { strong: ['он алтылық', 'шестнадцатер', 'hexadecimal', 'hex'] },
  encoding: { strong: ['кодтау', 'кодировк', 'unicode', 'ascii', 'utf', 'encoding'] },
  pixel: { strong: ['пиксель', 'pixel'] },
  compression: { strong: ['сығу', 'архив', 'архивац', 'zip', 'rar', 'сжати', 'compress', 'file compression'] },
};

export const FAQ_KEYS: Record<FaqId, FaqKeys> = { ...CORE_KEYS, ...CURRICULUM_KEYS };

export interface FaqMatch {
  id: FaqId;
  /** Strong hits ×2 + weak hits. */
  score: number;
  /** How many topics matched at all (2+: a comparison, better left to the model). */
  topics: number;
}

/**
 * The best built-in topic for a question, or null (score ≥ 2: one strong
 * word or two weak ones). On a tie the more specific topic wins — the one
 * whose matched words are longer: «желі топологиясы» is about topology,
 * not about networks in general.
 */
export function matchFaq(text: string): FaqMatch | null {
  const n = normalize(text);
  if (!n) return null;
  let best: (FaqMatch & { length: number }) | null = null;
  const scores: number[] = [];
  for (const id of FAQ_IDS) {
    const k = FAQ_KEYS[id];
    const strong = k.strong.filter((s) => hasStem(n, s));
    const weak = (k.weak ?? []).filter((s) => hasStem(n, s));
    const score = strong.length * 2 + weak.length;
    if (score < 2) continue;
    scores.push(score);
    const length = [...strong, ...weak].reduce((sum, s) => sum + s.length, 0);
    if (!best || score > best.score || (score === best.score && length > best.length)) best = { id, score, topics: 0, length };
  }
  return best && { id: best.id, score: best.score, topics: scores.length };
}

/** A short, direct question the built-in answer covers fully (longer ones go to the model when it is on). */
export const isShortQuestion = (text: string) => words(normalize(text)).length <= 7;
