import kk from '@/locales/kk.json';

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

/**
 * Kazakh ships with the app (default language and fallback); Russian and
 * English are separate chunks fetched only when chosen, so a visitor
 * downloads one dictionary instead of three.
 */
const dictionaries: Partial<Record<Language, unknown>> = { kk };
const loaders: Record<Exclude<Language, 'kk'>, () => Promise<{ default: unknown }>> = {
  ru: () => import('@/locales/ru.json'),
  en: () => import('@/locales/en.json'),
};
const pending = new Map<Language, Promise<void>>();

export const isLanguageLoaded = (lang: Language) => dictionaries[lang] !== undefined;

/** Fetches a dictionary once; resolves immediately when it is already here. */
export function loadLanguage(lang: Language): Promise<void> {
  if (isLanguageLoaded(lang)) return Promise.resolve();
  let p = pending.get(lang);
  if (!p) {
    p = loaders[lang as Exclude<Language, 'kk'>]()
      .then((m) => {
        dictionaries[lang] = m.default;
      })
      .finally(() => pending.delete(lang));
    pending.set(lang, p);
  }
  return p;
}

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

/**
 * Texts the admin edited on the server (V2-10): a flat key → text map per
 * language, laid over the shipped dictionaries. Shown as plain text only.
 */
let overrides: Partial<Record<Language, Record<string, string>>> = {};

export function setContentOverrides(next: Partial<Record<Language, Record<string, string>>>) {
  overrides = next;
}

/** The shipped text of a key (no admin edits) — the admin panel's "default". */
export function defaultText(lang: Language, key: string): string | undefined {
  return lookup(dictionaries[lang], key);
}

/** The shipped dictionary of a loaded language (for the admin's content editor). */
export const shippedDictionary = (lang: Language) => dictionaries[lang] as Record<string, unknown> | undefined;

/** Resolves a key in `lang` (admin edit first), falling back to Kazakh (also while `lang` is loading), then to the key itself. */
export function translate(lang: Language, key: TranslationKey, vars?: TranslationVars): string {
  const text = overrides[lang]?.[key] ?? lookup(dictionaries[lang], key) ?? overrides[DEFAULT_LANGUAGE]?.[key] ?? lookup(dictionaries[DEFAULT_LANGUAGE], key);
  if (text === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key "${key}"`);
    return key;
  }
  return interpolate(text, vars);
}

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}
