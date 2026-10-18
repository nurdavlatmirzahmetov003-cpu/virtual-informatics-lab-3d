/**
 * Numbers said in words → digits, in Kazakh, Russian and English: voice
 * recognition writes «бес жүз мың теңгеге», «четыреста пятьдесят тысяч»,
 * «half a million». Bit's command parser and the budget parser read digits.
 * A word with a Kazakh case ending keeps it: «мыңға» → «…000 ға» is not
 * needed — the ending is dropped and the number stays whole.
 */

const UNITS: Record<string, number> = {
  // kk
  нөл: 0, бір: 1, екі: 2, үш: 3, төрт: 4, бес: 5, алты: 6, жеті: 7, сегіз: 8, тоғыз: 9,
  он: 10, жиырма: 20, отыз: 30, қырық: 40, елу: 50, алпыс: 60, жетпіс: 70, сексен: 80, тоқсан: 90,
  // ru
  ноль: 0, один: 1, одна: 1, одну: 1, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9,
  десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14, пятнадцать: 15, шестнадцать: 16,
  семнадцать: 17, восемнадцать: 18, девятнадцать: 19, двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50,
  шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500, шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,
  // en
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/** "Hundred": multiplies what came before (or 1). */
const HUNDRED = new Set(['жүз', 'hundred']);
/** Scales close a group: "бес жүз мың" = (5 × 100) × 1000. */
const SCALES: Record<string, number> = {
  мың: 1000, тысяча: 1000, тысячи: 1000, тысяч: 1000, тыс: 1000, thousand: 1000,
  миллион: 1_000_000, миллиона: 1_000_000, миллионов: 1_000_000, million: 1_000_000, млн: 1_000_000,
};
/** Words that only join numbers ("one hundred and fifty"). */
const JOIN = new Set(['and']);

/** Kazakh case endings after a scale word: мыңға, мыңнан, жүзге, миллионға… */
const KK_ENDING = /^(мың|жүз|миллион)(ға|ге|нан|нен|дан|ден|ның|нің|ды|ді|ны|ні|да|де|да|дық|дік|ға дейін)$/;

function wordValue(w: string): { kind: 'unit' | 'hundred' | 'scale'; value: number } | null {
  const m = KK_ENDING.exec(w);
  const base = m ? m[1] : w;
  if (base in UNITS) return { kind: 'unit', value: UNITS[base] };
  if (HUNDRED.has(base)) return { kind: 'hundred', value: 100 };
  if (base in SCALES) return { kind: 'scale', value: SCALES[base] };
  return null;
}

/**
 * Replaces each run of number words with its value in digits — only runs
 * with «жүз / мың / миллион» (or сто / тысяча, hundred / thousand…): amounts
 * like budgets. A lone «бір» or «он» stays a word («нөл мен бір», «он жақ»).
 */
export function wordsToDigits(text: string): string {
  const tokens = text.split(/(\s+)/);
  const out: string[] = [];
  let run: string[] = [];
  let total = 0;
  let group = 0;
  let big = false;
  const end = () => {
    if (!run.length) return;
    // trailing spaces of the run go back after it
    const tail: string[] = [];
    while (run.length && /^\s+$/.test(run[run.length - 1])) tail.unshift(run.pop()!);
    if (big) out.push(String(total + group));
    else out.push(...run);
    out.push(...tail);
    run = [];
    total = 0;
    group = 0;
    big = false;
  };
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (!tok) continue;
    if (/^\s+$/.test(tok)) {
      if (run.length) run.push(tok);
      else out.push(tok);
      continue;
    }
    const lower = tok.toLowerCase().replace(/[.,!?;:»"]+$/, '');
    const trail = tok.slice(lower.length);
    if (lower === 'полмиллиона') {
      end();
      out.push(`500000${trail}`);
      continue;
    }
    if (lower === 'half' && tokens[i + 2]?.toLowerCase() === 'a' && /^million/.test(tokens[i + 4]?.toLowerCase() ?? '')) {
      end();
      out.push('500000');
      i += 4;
      continue;
    }
    const v = wordValue(lower);
    const digits = /^\d+$/.test(lower) ? Number(lower) : null;
    const joins = run.length > 0 && JOIN.has(lower);
    if (!v && digits === null && !joins) {
      end();
      out.push(tok);
      continue;
    }
    run.push(tok);
    if (digits !== null) group += digits;
    else if (v?.kind === 'unit') group += v.value;
    else if (v?.kind === 'hundred') {
      group = (group || 1) * 100;
      big = true;
    } else if (v?.kind === 'scale') {
      total += (group || 1) * v.value;
      group = 0;
      big = true;
    }
    if (trail) {
      const was = big;
      const value = total + group;
      if (was) {
        run = [];
        total = 0;
        group = 0;
        big = false;
        out.push(`${value}${trail}`);
      } else end();
    }
  }
  end();
  return out.join('');
}
