import kk from '@/locales/kk.json';
import ru from '@/locales/ru.json';
import en from '@/locales/en.json';

export const LANGUAGES = ['kk', 'ru', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'kk';

export const LANGUAGE_LABELS: Record<Language, string> = {
  kk: 'Қазақша',
  ru: 'Русский',
  en: 'English',
};

/** kk.json is the reference dictionary: every key must exist there. */
type Dictionary = typeof kk;

type Join<K extends string, P extends string> = `${K}.${P}`;
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : T[K] extends object ? Join<K, Paths<T[K]>> : never;
}[keyof T & string];

export type TranslationKey = Paths<Dictionary>;
export type TranslationVars = Record<string, string | number>;

const dictionaries: Record<Language, unknown> = { kk, ru, en };

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

function interpolate(text: string, vars?: TranslationVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/** Resolves a key in `lang`, falling back to Kazakh, then to the key itself. */
export function translate(lang: Language, key: TranslationKey, vars?: TranslationVars): string {
  const text = lookup(dictionaries[lang], key) ?? lookup(dictionaries[DEFAULT_LANGUAGE], key);
  if (text === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key "${key}"`);
    return key;
  }
  return interpolate(text, vars);
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
