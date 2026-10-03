import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronDown, Zap } from 'lucide-react';
import { useT } from '@/hooks/useT';
import { formatKZT } from '@/lib/studio/pricing';
import { useStudioStore } from '@/store/studioStore';
import { categoryName, issueText, sk } from './studioText';
import { useStudioBuild } from './useStudioBuild';
import styles from './SetupStudio.module.css';

/** Live price, budget meter, power estimate and compatibility report. */
export function StudioSummary() {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const budget = useStudioStore((s) => s.budget);
  const setCategory = useStudioStore((s) => s.setCategory);
  const setStep = useStudioStore((s) => s.setStep);
  const { price, power, issues, blocked, empty } = useStudioBuild();
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const over = price.overBudget > 0;

  return (
    <aside className={styles.summary} data-open={open} aria-labelledby="studio-summary-title">
      <button type="button" className={styles.summaryToggle} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>{t('studio.summary.toggle')}</span>
        <strong data-over={over}>{formatKZT(price.total)}</strong>
        {errors.length > 0 && <AlertTriangle size={15} className={styles.flagBad} aria-label={t('studio.compat.error')} />}
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      <div className={styles.summaryBody}>
        <h2 id="studio-summary-title" className={styles.eyebrow}>{t('studio.summary.title')}</h2>

        <div className={styles.total} aria-live="polite">
          <span>{t('studio.summary.total')}</span>
          <strong data-over={over}>{formatKZT(price.total)}</strong>
          {price.hasDemoPrices && (
            <span className={styles.demo} title={t('studio.demoPriceHint')}>
              {t('studio.demoPrice')}
            </span>
          )}
        </div>
        <div className={styles.meter} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, price.budgetUse) * 100)} aria-label={t('studio.summary.budget', { budget: formatKZT(budget) })}>
          <span style={{ transform: `scaleX(${Math.min(1, price.budgetUse)})` }} data-over={over} />
        </div>
        <p className={styles.budgetLine} data-over={over}>
          {t('studio.summary.budget', { budget: formatKZT(budget) })} ·{' '}
          {over ? t('studio.summary.over', { amount: formatKZT(price.overBudget) }) : t('studio.summary.left', { amount: formatKZT(budget - price.total) })}
        </p>

        {empty ? (
          <p className={styles.stepHint}>{t('studio.summary.empty')}</p>
        ) : (
          <>
            <ul className={styles.lines}>
              {price.lines.map(({ category, product }) => (
                <li key={category}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('products');
                      setCategory(category);
                    }}
                  >
                    <span>{categoryName(t, category)}</span>
                    <em>{product.brand} {product.model}</em>
                  </button>
                  <b>{formatKZT(product.priceKZT)}</b>
                </li>
              ))}
            </ul>
            <p className={styles.power}>
              <Zap size={13} aria-hidden="true" />
              {t('studio.summary.power', { peak: power.peakW, required: power.requiredW })}
            </p>
          </>
        )}

        {!empty && <h3 className={styles.eyebrow}>{t('studio.summary.issues')}</h3>}
        {empty ? null : issues.length === 0 ? (
          <p className={styles.ok}>
            <CheckCircle2 size={15} aria-hidden="true" />
            {t('studio.summary.ok')}
          </p>
        ) : (
          <ul className={styles.issues}>
            {[...errors, ...warnings].map((issue, i) => (
              <li key={`${issue.code}-${i}`} data-severity={issue.severity}>
                <AlertTriangle size={14} aria-hidden="true" />
                <span>
                  <b>{t(sk(`compat.${issue.severity}`))}:</b> {issueText(t, issue)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.viewButton} disabled={blocked || empty} onClick={() => navigate('/studio/summary')}>
          {t('studio.summary.view')}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        {blocked && <p className={styles.caption}>{t('studio.summary.viewBlocked')}</p>}
      </div>
    </aside>
  );
}
