import { useMemo } from 'react';
import { AlertTriangle, Check, ExternalLink, Sparkles } from 'lucide-react';
import { productsIn } from '@/data/hardware/catalog';
import type { HardwareCategory, HardwareItem } from '@/data/hardware/types';
import { CATEGORY_GROUPS, REQUIRED_CATEGORIES } from '@/data/studio/options';
import { useT } from '@/hooks/useT';
import { resolveBuild } from '@/lib/studio/build';
import { checkCompatibility } from '@/lib/studio/compatibility';
import { formatKZT } from '@/lib/studio/pricing';
import { useStudioStore } from '@/store/studioStore';
import { CATEGORY_ICON } from './icons';
import { categoryName, formatSpec, sk } from './studioText';
import { useStudioBuild } from './useStudioBuild';
import styles from './SetupStudio.module.css';

/** Categories with an error after picking `id` — shown on the card before the user commits. */
function useConflicts(category: HardwareCategory) {
  const build = useStudioStore((s) => s.build);
  return useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of productsIn(category)) {
      const issues = checkCompatibility(resolveBuild({ ...build, [category]: p.id }));
      map.set(p.id, issues.some((i) => i.severity === 'error' && i.categories.includes(category)));
    }
    return map;
  }, [build, category]);
}

function CategoryNav() {
  const t = useT();
  const current = useStudioStore((s) => s.category);
  const setCategory = useStudioStore((s) => s.setCategory);
  const build = useStudioStore((s) => s.build);
  const { issues } = useStudioBuild();
  return (
    <nav className={styles.categoryNav} aria-label={t('studio.products.title')}>
      {CATEGORY_GROUPS.map((g) => (
        <div key={g.id} className={styles.categoryGroup}>
          <span className={styles.groupLabel}>{t(sk(`groups.${g.id}`))}</span>
          <div className={styles.categoryChips}>
            {g.categories.map((c) => {
              const Icon = CATEGORY_ICON[c];
              const error = issues.some((i) => i.severity === 'error' && i.categories.includes(c) && build[c]);
              const state = error ? 'error' : build[c] ? 'done' : REQUIRED_CATEGORIES.has(c) ? 'todo' : 'optional';
              return (
                <button key={c} type="button" aria-current={current === c ? 'true' : undefined} data-state={state} onClick={() => setCategory(c)}>
                  <Icon size={15} aria-hidden="true" />
                  {categoryName(t, c)}
                  {state === 'error' && <AlertTriangle size={13} className={styles.chipFlag} aria-label={t('studio.compat.error')} />}
                  {state === 'done' && <Check size={13} className={styles.chipFlag} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ProductCard({ product, selected, conflict }: { product: HardwareItem; selected: boolean; conflict: boolean }) {
  const t = useT();
  const purpose = useStudioStore((s) => s.purpose);
  const select = useStudioStore((s) => s.select);
  return (
    <article className={styles.card} data-selected={selected} data-conflict={conflict}>
      <header className={styles.cardHead}>
        <span className={styles.brand}>{product.brand}</span>
        <span className={styles.tier}>{t(sk(`tiers.${product.performanceTier}`))}</span>
      </header>
      <h3 className={styles.model}>{product.model}</h3>
      <dl className={styles.cardSpecs}>
        {product.specifications.slice(0, 4).map((s) => (
          <div key={s.key}>
            <dt>{t(sk(`specs.${s.key}`))}</dt>
            <dd>{formatSpec(t, s)}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.badges}>
        {product.recommendedUse.includes(purpose) && (
          <span className={styles.badgeGood}>
            <Sparkles size={12} aria-hidden="true" />
            {t('studio.products.recommendedFor', { purpose: t(sk(`purpose.${purpose}`)) })}
          </span>
        )}
        {conflict && (
          <span className={styles.badgeBad}>
            <AlertTriangle size={12} aria-hidden="true" />
            {t('studio.products.conflict')}
          </span>
        )}
        {product.colors.map((c) => (
          <span key={c} className={styles.colorDot} data-color={c} title={t(sk(`finish.${c}`))} aria-label={t(sk(`finish.${c}`))} />
        ))}
      </div>
      <footer className={styles.cardFoot}>
        <div className={styles.price}>
          <strong>{formatKZT(product.priceKZT)}</strong>
          {product.priceSource.kind === 'demo' && (
            <span className={styles.demo} title={t('studio.demoPriceHint')}>
              {t('studio.demoPrice')}
            </span>
          )}
        </div>
        <a className={styles.source} href={product.specSourceUrl} target="_blank" rel="noopener noreferrer">
          {t('studio.products.source')}
          <ExternalLink size={12} aria-hidden="true" />
        </a>
        <button type="button" className={selected ? styles.selectedButton : styles.selectButton} aria-pressed={selected} onClick={() => select(product.category, product.id)}>
          {selected ? (
            <>
              <Check size={14} aria-hidden="true" />
              {t('studio.products.selected')}
            </>
          ) : (
            t('studio.products.choose')
          )}
        </button>
      </footer>
    </article>
  );
}

export function ProductsStep() {
  const t = useT();
  const category = useStudioStore((s) => s.category);
  const selectedId = useStudioStore((s) => s.build[category]);
  const select = useStudioStore((s) => s.select);
  const recommend = useStudioStore((s) => s.recommend);
  const conflicts = useConflicts(category);
  const optional = !REQUIRED_CATEGORIES.has(category);

  return (
    <section className={styles.step}>
      <div className={styles.stepHeadRow}>
        <h2 className={styles.stepTitle}>{t('studio.products.title')}</h2>
        <button type="button" className={styles.ghost} onClick={recommend}>
          <Sparkles size={14} aria-hidden="true" />
          {t('studio.recommend.button')}
        </button>
      </div>
      <CategoryNav />
      <div className={styles.cards}>
        {productsIn(category).map((p) => (
          <ProductCard key={p.id} product={p} selected={selectedId === p.id} conflict={conflicts.get(p.id) ?? false} />
        ))}
        {optional && (
          <button type="button" className={styles.noneCard} aria-pressed={!selectedId} onClick={() => select(category, null)}>
            <strong>{t('studio.products.none')}</strong>
            <span>{t(category === 'gpu' ? 'studio.products.noneHint.gpu' : 'studio.products.noneHint.default')}</span>
          </button>
        )}
      </div>
      <p className={styles.caption}>{t('studio.demoPriceHint')}</p>
    </section>
  );
}
