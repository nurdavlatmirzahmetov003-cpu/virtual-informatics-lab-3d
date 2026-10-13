/**
 * Generated credentials for the classroom (V2-9): logins from student names
 * (Kazakh / Russian Cyrillic → Latin), readable random passwords and class
 * join codes. Every random choice uses node:crypto, never Math.random.
 */
import { randomInt } from 'node:crypto';

const CYR: Record<string, string> = {
  а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ұ: 'u', ү: 'u', ф: 'f', х: 'kh', һ: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', і: 'i',
  ь: '', э: 'e', ю: 'yu', я: 'ya',
};

/** "Әлия Сейітқызы" → "aliya.seyitqyzy"; '' when nothing Latin-able is left. */
export function loginFromName(name: string): string {
  const latin = [...name.toLowerCase()].map((c) => CYR[c] ?? c).join('');
  const parts = latin
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.join('.').slice(0, 26).replace(/\.$/, '');
}

/** The first free login: base, base2, base3… (`taken` checks the database). */
export function uniqueLogin(base: string, taken: (login: string) => boolean): string {
  const root = base.length >= 3 ? base : `student${base ? `.${base}` : ''}`;
  if (!taken(root)) return root;
  for (let n = 2; n < 10000; n++) {
    const candidate = `${root}${n}`;
    if (!taken(candidate)) return candidate;
  }
  throw new Error('no free login');
}

const CONSONANTS = 'bdfgkmnprstvz';
const VOWELS = 'aeiou';

/** Easy to read aloud and type: "kozu-mafi-teba-47" (~44 bits; logins are rate-limited). */
export function generatePassword(): string {
  const syllable = () => CONSONANTS[randomInt(CONSONANTS.length)] + VOWELS[randomInt(VOWELS.length)];
  const group = () => syllable() + syllable();
  return `${group()}-${group()}-${group()}-${randomInt(10, 100)}`;
}

/** No 0/O, 1/I/L — codes are read off a board. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const JOIN_CODE_LENGTH = 6;
export const joinCode = () => Array.from({ length: JOIN_CODE_LENGTH }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
export const normalizeJoinCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
