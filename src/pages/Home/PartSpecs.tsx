import type { TranslationKey } from '@/lib/i18n';
import { useT } from '@/hooks/useT';
import type { HardwareCategory } from '@/data/hardware/types';
import { showcaseBuild } from '@/lib/studio/showcase';
import type { PartDef, PartId } from '@/scenes/DeskScene/pc/parts';
import { formatSpec, sk } from '@/pages/SetupStudio/studioText';

const CATEGORY: Record<PartId, HardwareCategory> = { motherboard: 'motherboard', cpu: 'cpu', cooler: 'cooling', ram: 'ram', gpu: 'gpu', ssd: 'ssd', psu: 'psu', fans: 'case' };

/**
 * The real part behind a numbered label of the exploded view (V4 §1.3): its
 * name and its own specifications, as the Setup Studio shows them. Fans: the
 * case's fan set. Parts without a product keep the generic text.
 */
export function PartSpecs({ part, classes }: { part: PartDef; classes: { product: string; specs: string; spec?: string } }) {
  const t = useT();
  const product = showcaseBuild()[CATEGORY[part.id]];
  const base = `pc.parts.${part.id}`;
  if (!product) {
    return (
      <dl className={classes.specs}>
        {part.specs.map((s) => (
          <div key={s} className={classes.spec}>
            <dt>{t(`${base}.specs.${s}.label` as TranslationKey)}</dt>
            <dd>{t(`${base}.specs.${s}.value` as TranslationKey)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  const specs = (part.id === 'fans' ? product.specifications.filter((s) => s.key === 'fans') : product.specifications).slice(0, 4);
  return (
    <>
      <p className={classes.product}>
        {product.brand} {product.model}
      </p>
      <dl className={classes.specs}>
        {specs.map((s) => (
          <div key={s.key} className={classes.spec}>
            <dt>{t(sk(`specs.${s.key}`))}</dt>
            <dd>{formatSpec(t, s)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
