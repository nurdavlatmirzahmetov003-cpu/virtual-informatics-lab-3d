import type { TranslationKey, TranslationVars } from '@/lib/i18n';
import type { ResolvedBuild } from '@/lib/studio/build';
import type { HeroLook } from './looks';

type Translate = (key: TranslationKey, vars?: TranslationVars) => string;

/** "Бұл — ақ сетап: BitLab AERO 16G, 32 ГБ жад, AMD Ryzen 7 7800X3D." */
export function presenterLine(t: Translate, look: HeroLook) {
  const b: ResolvedBuild = look.build;
  const name = (p: { brand: string; model: string } | undefined) => (p ? `${p.brand} ${p.model}` : '—');
  const capacity = b.ram?.specifications.find((s) => s.key === 'capacity')?.value;
  const ram = String(capacity ?? '').match(/\d+/)?.[0] ?? '—';
  const key = look.id === 'white' ? 'home.decor.presenterWhite' : look.id === 'black' ? 'home.decor.presenterBlack' : 'home.decor.presenterRgb';
  return t('home.decor.presenterLine', { look: t(key), gpu: name(b.gpu), ram, cpu: name(b.cpu) });
}

