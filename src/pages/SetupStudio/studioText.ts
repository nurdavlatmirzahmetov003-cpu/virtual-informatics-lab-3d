import type { HardwareCategory, SpecEntry } from '@/data/hardware/types';
import type { TranslationKey, TranslationVars } from '@/lib/i18n';
import type { CompatIssue } from '@/lib/studio/compatibility';

type T = (key: TranslationKey, vars?: TranslationVars) => string;

/** Dynamic studio keys are validated against kk.json by the locale coverage check. */
export const sk = (path: string) => `studio.${path}` as TranslationKey;

const group = (n: number) => (Math.abs(n) >= 10_000 ? n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') : String(n));

/** "180 Гц", "Толық өлшемді", "2560 × 1440" — value plus localised unit. */
export function formatSpec(t: T, spec: SpecEntry): string {
  const value = spec.translate ? t(sk(`values.${spec.value}`)) : typeof spec.value === 'number' ? group(spec.value) : spec.value;
  if (!spec.unit) return value;
  return spec.unit === 'inch' ? `${value}${t('studio.units.inch')}` : `${value}\u00a0${t(sk(`units.${spec.unit}`))}`;
}

export const categoryName = (t: T, category: HardwareCategory) => t(sk(`categories.${category}`));

export function issueText(t: T, issue: CompatIssue): string {
  const vars: TranslationVars = { ...issue.params };
  if (issue.code === 'missing') vars.categoryName = categoryName(t, issue.params.category as HardwareCategory);
  return t(sk(`compat.${issue.code}`), vars);
}
