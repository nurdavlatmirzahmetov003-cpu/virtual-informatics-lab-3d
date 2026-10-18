/**
 * Bit's built-in answers: the topics and the words that call them, in all
 * three languages (a student may ask in Russian on the Kazakh site — Bit
 * still answers in the site's language). The answers themselves live in
 * content/<lang>.ts, loaded with the assistant. Works without a network.
 */
import { countStems, normalize, words } from './text';

export const FAQ_IDS = [
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
] as const;
export type FaqId = (typeof FAQ_IDS)[number];

/** Topic words; `strong` ones decide alone, `weak` ones only together with another hit. */
interface FaqKeys {
  strong: readonly string[];
  weak?: readonly string[];
}

export const FAQ_KEYS: Record<FaqId, FaqKeys> = {
  computer: { strong: ['компьютер деген', 'что такое компьютер$', 'what is a computer$', 'компьютер дегеніміз'] },
  cpu: { strong: ['процессор', 'процессорд', 'cpu', 'processor', 'орталық процессор'] },
  ram: { strong: ['жедел жад', 'оперативн', 'ram', 'озу', 'memory'], weak: ['жад'] },
  storage: { strong: ['ssd', 'hdd', 'қатқыл диск', 'жесткий диск', 'hard drive', 'hard disk', 'накопител', 'жинақтауыш', 'storage'] },
  gpu: { strong: ['видеокарта', 'видеокарт', 'gpu', 'graphics card', 'video card'] },
  motherboard: { strong: ['аналық плата', 'материнск', 'motherboard', 'аналық тақта'] },
  psu: { strong: ['қуат блог', 'блок питания', 'power supply', 'psu'] },
  cooling: { strong: ['салқындат', 'кулер', 'охлажден', 'cooling', 'cooler', 'радиатор', 'қызып', 'перегрев', 'overheat'] },
  os: { strong: ['операциялық жүйе', 'операционн', 'operating system', 'windows', 'linux', 'android', 'macos'] },
  binary: { strong: ['екілік', 'двоичн', 'binary', 'нөл мен бір', 'ноль и один'] },
  bitByte: { strong: ['байт', 'byte', 'килобайт', 'мегабайт', 'гигабайт', 'kilobyte', 'megabyte', 'gigabyte'], weak: ['бит', 'bit'] },
  algorithm: { strong: ['алгоритм деген', 'что такое алгоритм', 'what is an algorithm', 'алгоритм дегеніміз'], weak: ['алгоритм', 'algorithm'] },
  programming: { strong: ['бағдарламала', 'программирован', 'programming', 'python', 'javascript', 'код жаз', 'писать код', 'write code', 'бағдарламалау тілі', 'язык программир'] },
  network: { strong: ['желі', 'сеть', 'network', 'желі деген', 'компьютерлік желі', 'жергілікті желі', 'что такое сеть', 'компьютерная сеть', 'локальная сеть', 'what is a network', 'computer network', 'local network', 'lan'] },
  internet: { strong: ['интернет', 'internet', 'tcp'] },
  ip: { strong: ['ip мекенжай', 'ip адрес', 'ip address', 'айпи', 'маска', 'subnet'] },
  router: { strong: ['роутер', 'маршрутизатор', 'router'] },
  switch: { strong: ['коммутатор', 'свитч', 'switch', 'network switch'] },
  wifi: { strong: ['wi fi', 'wifi', 'вайфай', 'вай фай', 'сымсыз', 'беспровод', 'wireless'] },
  password: { strong: ['құпия сөз', 'пароль', 'password', 'құпиясөз'] },
  safety: { strong: ['қауіпсіз', 'безопасн', 'safety', 'safe online', 'stay safe', 'интернетте қауіпсіз', 'қауіпсіз бол', 'безопасности в интернете', 'фишинг', 'phishing', 'алаяқ', 'мошенни', 'scam'] },
  virus: { strong: ['вирус', 'virus', 'антивирус', 'antivirus', 'malware', 'зиянды бағдарлама'] },
  cloud: { strong: ['бұлт', 'облак', 'облачн', 'cloud', 'google drive'] },
  inputOutput: { strong: ['енгізу құрылғы', 'шығару құрылғы', 'устройства ввода', 'устройства вывода', 'input device', 'output device', 'енгізу және шығару', 'ввода и вывода', 'input and output'] },
  monitor: { strong: ['монитор', 'monitor', 'ажыратымдыл', 'разрешени', 'resolution', 'герц', 'hz', 'гц'] },
  ai: { strong: ['жасанды интеллект', 'искусственн', 'artificial intelligence', 'нейросет', 'нейрожелі', 'neural network', 'chatgpt', 'gemini'] },
  file: { strong: ['файл', 'file', 'қалта', 'папк', 'folder', 'кеңейтім', 'расширени файл', 'file extension'] },
  who: { strong: ['сен кімсің', 'кімсің', 'ты кто', 'кто ты', 'who are you', 'сенің атың', 'как тебя зовут', 'your name'] },
  help: { strong: ['не істей аласың', 'не білесің', 'что ты умеешь', 'что ты можешь', 'what can you do', 'көмек', 'помощь', 'help'] },
  progress: { strong: ['менің нәтиже', 'мои результат', 'my results', 'ұпайым', 'мои баллы', 'my score', 'xp', 'деңгейім', 'мой уровень', 'my level'] },
};

export interface FaqMatch {
  id: FaqId;
  /** Strong hits ×2 + weak hits. */
  score: number;
  /** How many topics matched at all (2+: a comparison, better left to the model). */
  topics: number;
}

/** The best built-in topic for a question, or null (score ≥ 2: one strong word or two weak ones). */
export function matchFaq(text: string): FaqMatch | null {
  const n = normalize(text);
  if (!n) return null;
  let best: FaqMatch | null = null;
  let topics = 0;
  for (const id of FAQ_IDS) {
    const k = FAQ_KEYS[id];
    const score = countStems(n, k.strong) * 2 + countStems(n, k.weak ?? []);
    if (score < 2) continue;
    topics++;
    if (!best || score > best.score) best = { id, score, topics: 0 };
  }
  return best && { ...best, topics };
}

/** A short, direct question the built-in answer covers fully (longer ones go to the model when it is on). */
export const isShortQuestion = (text: string) => words(normalize(text)).length <= 7;
