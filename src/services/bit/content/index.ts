import type { Language } from '@/lib/i18n';
import type { BitContent } from './types';

export type { BitContent } from './types';

/** Bit's texts, one chunk per language, fetched when the assistant is first used. */
const LOADERS: Record<Language, () => Promise<{ default: BitContent }>> = {
  kk: () => import('./kk'),
  ru: () => import('./ru'),
  en: () => import('./en'),
};

const cache = new Map<Language, BitContent>();

export async function loadBitContent(language: Language): Promise<BitContent> {
  const hit = cache.get(language);
  if (hit) return hit;
  const content = (await LOADERS[language]()).default;
  cache.set(language, content);
  return content;
}

export const cachedBitContent = (language: Language) => cache.get(language) ?? null;
