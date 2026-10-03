import type { AnatomyId } from '@/data/hardware/anatomy';
import type { TranslationKey } from '@/lib/i18n';

/** Key under anatomy.items.<id> (dynamic paths are validated by kk.json at build time). */
export const itemKey = (id: AnatomyId, path: string) => `anatomy.items.${id}.${path}` as TranslationKey;
