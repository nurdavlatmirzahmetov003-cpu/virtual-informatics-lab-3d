import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clapperboard, ExternalLink, Zap } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { CATEGORIES } from '@/data/studio/options';
import { useT } from '@/hooks/useT';
import { formatKZT } from '@/lib/studio/pricing';
import { useStudioStore } from '@/store/studioStore';
import { CATEGORY_ICON } from './icons';
import { categoryName, formatSpec, issueText, sk } from './studioText';
import { useStudioBuild } from './useStudioBuild';
import styles from './SetupSummary.module.css';

/**
 * "Сетапты көру" destination. For now a summary of the saved configuration;
 * Phase 5 turns it into the cinematic assembly that starts from an empty desk.
 */
export default function SetupSummaryPage() {
  const t = useT();
  const purpose = useStudioStore((s) => s.purpose);
  const style = useStudioStore((s) => s.style);
  const budget = useStudioStore((s) => s.budget);
  const finish = useStudioStore((s) => s.finish);
  const { resolved, price, power, issues, empty } = useStudioBuild();
  const over = price.overBudget > 0;

  return (
    <PageLayout eyebrow={t('studio.title')} title={t('studio.final.title')} subtitle={t('studio.final.subtitle')}>
      <div className={styles.actions}>
        <Link to="/studio" className={styles.back}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t('studio.final.edit')}
        </Link>
        <span className={styles.saved}>{t('studio.final.saved')}</span>
      </div>

      {empty ? (
        <p className={styles.empty}>{t('studio.final.empty')}</p>
      ) : (
        <div className={styles.layout}>
          <section aria-labelledby="final-parts">
            <h2 id="final-parts" className={styles.heading}>{t('studio.final.parts')}</h2>
            <ul className={styles.parts}>
              {CATEGORIES.map((c) => {
                const product = resolved[c];
                const Icon = CATEGORY_ICON[c];
                return (
                  <li key={c} data-empty={!product}>
                    <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                    <div className={styles.partText}>
                      <span className={styles.category}>{categoryName(t, c)}</span>
                      {product ? (
                        <>
                          <strong>
                            {product.brand} {product.model}
                          </strong>
                          <span className={styles.specs}>{product.specifications.slice(0, 3).map((s) => formatSpec(t, s)).join(' · ')}</span>
                          <a href={product.specSourceUrl} target="_blank" rel="noopener noreferrer" className={styles.source}>
                            {t('studio.products.source')}
                            <ExternalLink size={11} aria-hidden="true" />
                          </a>
                        </>
                      ) : (
                        <strong className={styles.none}>{t('studio.final.notSelected')}</strong>
                      )}
                    </div>
                    {product && <b className={styles.price}>{formatKZT(product.priceKZT)}</b>}
                  </li>
                );
              })}
            </ul>
          </section>

          <aside className={styles.side}>
            <div className={styles.card}>
              <span className={styles.label}>{t('studio.summary.total')}</span>
              <strong className={styles.total} data-over={over}>{formatKZT(price.total)}</strong>
              {price.hasDemoPrices && <span className={styles.demo}>{t('studio.demoPrice')}</span>}
              <p className={styles.muted} data-over={over}>
                {t('studio.summary.budget', { budget: formatKZT(budget) })} ·{' '}
                {over ? t('studio.summary.over', { amount: formatKZT(price.overBudget) }) : t('studio.summary.left', { amount: formatKZT(budget - price.total) })}
              </p>
              <p className={styles.muted}>
                <Zap size={13} aria-hidden="true" /> {t('studio.summary.power', { peak: power.peakW, required: power.requiredW })}
              </p>
              <p className={styles.caption}>{t('studio.demoPriceHint')}</p>
            </div>

            <div className={styles.card}>
              <dl className={styles.facts}>
                <div>
                  <dt>{t('studio.final.purpose')}</dt>
                  <dd>{t(sk(`purpose.${purpose}`))}</dd>
                </div>
                <div>
                  <dt>{t('studio.final.style')}</dt>
                  <dd>{t(sk(`style.${style}`))}</dd>
                </div>
                <div>
                  <dt>{t('studio.colors.case')}</dt>
                  <dd>{t(sk(`finish.${finish.case}`))}</dd>
                </div>
                <div>
                  <dt>{t('studio.colors.rgb')}</dt>
                  <dd>{t(sk(`rgb.${finish.rgb}`))}</dd>
                </div>
                <div>
                  <dt>{t('studio.colors.desk')}</dt>
                  <dd>{t(sk(`desk.${finish.desk}`))}</dd>
                </div>
                <div>
                  <dt>{t('studio.colors.peripherals')}</dt>
                  <dd>{t(sk(`theme.${finish.peripherals}`))}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.card}>
              <span className={styles.label}>{t('studio.summary.issues')}</span>
              {issues.length === 0 ? (
                <p className={styles.ok}>
                  <CheckCircle2 size={15} aria-hidden="true" /> {t('studio.summary.ok')}
                </p>
              ) : (
                <ul className={styles.issues}>
                  {issues.map((issue, i) => (
                    <li key={`${issue.code}-${i}`} data-severity={issue.severity}>
                      <AlertTriangle size={14} aria-hidden="true" />
                      <span>{issueText(t, issue)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className={styles.next}>
              <Clapperboard size={16} aria-hidden="true" />
              {t('studio.final.assemblyNote')}
            </p>
          </aside>
        </div>
      )}
    </PageLayout>
  );
}
