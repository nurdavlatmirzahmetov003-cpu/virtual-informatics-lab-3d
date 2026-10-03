/**
 * Local natural-language parser (kk / ru / en). Deliberately bounded
 * patterns: it only extracts what the catalog can act on and never invents
 * products — anything it cannot satisfy is reported as unavailable later.
 */
import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';
import { BUDGET_LIMITS } from '@/data/studio/options';
import type { AssistantRequest, MonitorResolution, WirelessDevice } from './types';

/** Category words; matched as stems so Kazakh/Russian endings still match. */
const CATEGORY_WORDS: Array<[HardwareCategory, RegExp]> = [
  ['monitor', /монитор|monitor|экран|дисплей/g],
  ['mouse', /тышқан|мыш[ькиу]|mouse/g],
  ['keyboard', /пернетақта|клавиатур|keyboard/g],
  ['headset', /құлаққап|наушник|гарнитур|headset|headphone/g],
  ['speakers', /колонка|колон|динамик|speaker|акустик/g],
  ['chair', /орындық|кресл|chair/g],
  ['desk', /үстел|(?<![а-яё])стол(?!ько|ица|ов)|desk/g],
  ['cpu', /процессор|\bcpu\b/g],
  ['gpu', /видеокарт|\bgpu\b|графикалық карта/g],
  ['ram', /жедел жад|оперативн|(?<![а-яё])озу(?![а-яё])|\bram\b|\bddr[45]\b|памят/g],
  ['ssd', /\bssd\b|жинақтауыш|накопител|диск/g],
  ['case', /корпус|\bcase\b/g],
  ['psu', /блок пит|қоректендіру|\bpsu\b/g],
  ['cooling', /кулер|cooler|салқындат/g],
];

/** Brand → spelling in the catalog and the category it most likely refers to. */
const BRANDS: Array<{ re: RegExp; name: string; fallback: HardwareCategory }> = [
  { re: /logitech|логит[еэ]к|логитех/, name: 'Logitech', fallback: 'mouse' },
  { re: /razer|рейзер|разер/, name: 'Razer', fallback: 'mouse' },
  { re: /asus|асус/, name: 'ASUS', fallback: 'monitor' },
  { re: /\blg\b|элджи/, name: 'LG', fallback: 'monitor' },
  { re: /\bdell\b|делл/, name: 'Dell', fallback: 'monitor' },
  { re: /samsung|самсунг/, name: 'Samsung', fallback: 'ssd' },
  { re: /ryzen|райзен/, name: 'AMD', fallback: 'cpu' },
  { re: /radeon|радеон/, name: 'Radeon', fallback: 'gpu' },
  { re: /\bamd\b|(?<![а-яё])амд(?![а-яё])/, name: 'AMD', fallback: 'cpu' },
  { re: /intel|интел/, name: 'Intel', fallback: 'cpu' },
  { re: /nvidia|geforce|\brtx\b|нвидиа|джифорс/, name: 'GeForce', fallback: 'gpu' },
  { re: /corsair|корсар/, name: 'Corsair', fallback: 'psu' },
  { re: /kingston|кингстон/, name: 'Kingston', fallback: 'ram' },
  { re: /hyperx/, name: 'HyperX', fallback: 'headset' },
  { re: /steelseries/, name: 'SteelSeries', fallback: 'headset' },
  { re: /keychron/, name: 'Keychron', fallback: 'keyboard' },
  { re: /secretlab/, name: 'Secretlab', fallback: 'chair' },
  { re: /noctua/, name: 'Noctua', fallback: 'cooling' },
  { re: /nzxt/, name: 'NZXT', fallback: 'case' },
];

const PURPOSES: Array<[SetupPurpose, RegExp]> = [
  ['design3d', /дизайн|рендер|\b3d\b|3д|blender|монтаж|design/],
  ['streaming', /стрим|stream|трансляц/],
  ['gaming', /ойын|игр|gaming|\bgame|гейм/],
  ['programming', /программ|бағдарлам|(?<![а-яёәғқңөұүһі])код|coding|programming|developer|әзірле/],
  ['study', /оқу|оқушы|сабақ|уч[её]б|школ|студент|study|school/],
  ['universal', /әмбебап|универсал|universal|всего понемногу/],
];

const OPTIONAL: readonly HardwareCategory[] = ['headset', 'speakers', 'desk', 'chair', 'gpu'];

function parseBudget(text: string, current: number): number {
  const money = text.match(/(\d[\d\s]*(?:[.,]\d+)?)\s*(млн|миллион|million|тыс\.?|мың|k(?![a-z])|к(?![а-яёәғқңөұүһі])|₸|теңге|тенге|tenge|тг)/i);
  const bare = text.match(/\b(\d{1,2}(?:\s\d{3}){1,2}|\d{6,8})\b/);
  if (money || bare) {
    const number = Number((money?.[1] ?? bare![1]).replace(/\s/g, '').replace(',', '.'));
    const unit = money?.[2] ?? '';
    const multiplier = /млн|миллион|million/.test(unit) ? 1_000_000 : /тыс|мың|k|к/.test(unit) ? 1000 : 1;
    const value = Math.round(number * multiplier);
    if (Number.isFinite(value) && value >= BUDGET_LIMITS.min) return Math.min(BUDGET_LIMITS.max, value);
  }
  if (/арзан|дешев|cheaper|үнемд/.test(text)) return Math.max(BUDGET_LIMITS.min, Math.round(current * 0.8));
  if (/қымбат|дорож|more powerful|қуаттырақ|мощнее/.test(text)) return Math.min(BUDGET_LIMITS.max, Math.round(current * 1.25));
  return current;
}

/**
 * The category word closest to a brand / adjective at `index` (within
 * `radius` characters). Words after it win ties — "Logitech тышқан",
 * "сымсыз пернетақта" — but "мышка Logitech" works too.
 */
function categoryNear(text: string, index: number, length: number, radius = 24): HardwareCategory | undefined {
  let best: { c: HardwareCategory; d: number } | undefined;
  for (const [c, re] of CATEGORY_WORDS) {
    for (const m of text.matchAll(new RegExp(re.source, 'g'))) {
      const after = m.index - (index + length);
      const before = index - (m.index + m[0].length);
      const d = after >= 0 ? after : before >= 0 ? before + 0.5 : 0;
      if (d <= radius && (!best || d < best.d)) best = { c, d };
    }
  }
  return best?.c;
}

function mentioned(text: string): Set<HardwareCategory> {
  return new Set(CATEGORY_WORDS.filter(([, re]) => new RegExp(re.source).test(text)).map(([c]) => c));
}

/**
 * Merges what the message says into the previous request: unspecified fields
 * keep their earlier value, so a follow-up like "make it white" refines it.
 */
export function parseRequest(message: string, previous: AssistantRequest): AssistantRequest {
  const text = message.toLocaleLowerCase().replace(/\u00a0/g, ' ');
  const out: AssistantRequest = { ...previous, purposes: [...previous.purposes] };

  out.budget = parseBudget(text, previous.budget);

  const found = PURPOSES.map(([p, re]) => ({ p, at: text.search(re) })).filter((x) => x.at >= 0).sort((a, b) => a.at - b.at);
  if (found.length) {
    out.purposes = found.map((x) => x.p);
    out.purpose = out.purposes[0];
  }

  if (/ақ\s*(?:түст|сетап|корпус|жинақ)|ақ түс|бел(?:ый|ая|ое|ую|ого|ом)|white/.test(text)) out.style = 'white';
  else if (/rgb\s*[-–]?\s*с[ыі]з|без\s*(?:rgb|подсвет)|no\s*rgb|жарықсыз/.test(text)) out.style = 'noRgb';
  else if (/rgb|подсвет|жарқыраған|жарығы бар/.test(text)) out.style = 'rgb';
  else if (/қара|ч[её]рн|black/.test(text)) out.style = 'black';

  const monitor = { ...previous.monitor };
  const hz = text.match(/(?<!\d)(\d{2,4})\s*(?:гц|hz|герц)/);
  if (hz) monitor.minHz = Number(hz[1]);
  const resolution: MonitorResolution | undefined = /(?<!\d)4\s?[kк](?![a-zа-я])|uhd|3840/.test(text) ? '4k' : /(?<!\d)2[kк](?![a-zа-я])|qhd|1440/.test(text) ? 'qhd' : undefined;
  if (resolution) monitor.resolution = resolution;
  if (/ultrawide|ультрашир|21:9|кең экран/.test(text)) monitor.ultrawide = true;
  if (Object.keys(monitor).length) out.monitor = monitor;

  const brands = { ...previous.brands };
  for (const brand of BRANDS) {
    const m = brand.re.exec(text);
    if (!m) continue;
    const category = categoryNear(text, m.index, m[0].length) ?? brand.fallback;
    if (!brands[category]) brands[category] = brand.name;
  }
  if (Object.keys(brands).length) out.brands = brands;

  const wireless = new Set<WirelessDevice>();
  let anyWireless = false;
  for (const m of text.matchAll(/сымсыз|беспровод\S*|wireless|bluetooth|блютуз/g)) {
    anyWireless = true;
    const c = categoryNear(text, m.index, m[0].length);
    if (c === 'mouse' || c === 'keyboard' || c === 'headset') wireless.add(c);
  }
  if (anyWireless) out.wireless = wireless.size ? [...wireless] : ['mouse', 'keyboard', 'headset'];

  const ram = text.match(/(8|16|32|64)\s*(?:гб|gb)/);
  if (ram && /жад|ram|озу|памят|ddr/.test(text)) out.minRamGb = Number(ram[1]);
  const storage = text.match(/(\d(?:[.,]\d)?)\s*(?:тб|tb)/);
  if (storage) out.minStorageTb = Number(storage[1].replace(',', '.'));

  const include = new Set(previous.include ?? []);
  const exclude = new Set(previous.exclude ?? []);
  if (/толық\s*(?:сетап|жинақ|жиынтық)|бәрі\s*бар|полн\w*\s*(?:сетап|комплект|сборк)|full\s*setup|everything/.test(text)) {
    for (const c of ['headset', 'speakers', 'desk', 'chair'] as const) include.add(c);
  }
  for (const c of mentioned(text)) if (OPTIONAL.includes(c)) include.add(c);
  // "...сыз / -сіз" (kk) and "без ..." (ru) remove an optional part
  for (const [c, re] of CATEGORY_WORDS) {
    if (!OPTIONAL.includes(c)) continue;
    const stem = re.source.split('|')[0];
    if (new RegExp(`${stem}\\S*с[ыі]з|без\\s+(?:${re.source})|without\\s+(?:${re.source})`).test(text)) {
      exclude.add(c);
      include.delete(c);
    }
  }
  out.include = [...include].filter((c) => !exclude.has(c));
  out.exclude = [...exclude];
  return out;
}

export function defaultRequest(budget: number, purpose: SetupPurpose, style: AssistantRequest['style']): AssistantRequest {
  return { budget, purpose, purposes: [purpose], style };
}
