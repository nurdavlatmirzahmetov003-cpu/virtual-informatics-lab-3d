import { useId } from 'react';
import { Sparkles } from 'lucide-react';
import { BUDGET_LIMITS, BUDGET_PRESETS, PURPOSES, STYLE_FINISH, STYLES, CASE_FINISHES, RGB_COLORS } from '@/data/studio/options';
import { useT } from '@/hooks/useT';
import { formatKZT } from '@/lib/studio/pricing';
import { useStudioStore } from '@/store/studioStore';
import { PURPOSE_ICON } from './icons';
import { sk } from './studioText';
import styles from './SetupStudio.module.css';

export function PurposeStep() {
  const t = useT();
  const purpose = useStudioStore((s) => s.purpose);
  const setPurpose = useStudioStore((s) => s.setPurpose);
  return (
    <section className={styles.step}>
      <h2 className={styles.stepTitle}>{t('studio.purpose.title')}</h2>
      <p className={styles.stepHint}>{t('studio.purpose.hint')}</p>
      <div className={styles.optionGrid} role="radiogroup" aria-label={t('studio.purpose.title')}>
        {PURPOSES.map((p) => {
          const Icon = PURPOSE_ICON[p];
          return (
            <button key={p} type="button" role="radio" aria-checked={purpose === p} className={styles.option} onClick={() => setPurpose(p)}>
              <Icon size={20} strokeWidth={1.6} aria-hidden="true" />
              <strong>{t(sk(`purpose.${p}`))}</strong>
              <span>{t(sk(`purposeDesc.${p}`))}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function BudgetStep() {
  const t = useT();
  const id = useId();
  const budget = useStudioStore((s) => s.budget);
  const setBudget = useStudioStore((s) => s.setBudget);
  return (
    <section className={styles.step}>
      <h2 className={styles.stepTitle}>{t('studio.budget.title')}</h2>
      <p className={styles.stepHint}>{t('studio.budget.hint')}</p>
      <div className={styles.chips} role="radiogroup" aria-label={t('studio.budget.title')}>
        {BUDGET_PRESETS.map((b) => (
          <button key={b} type="button" role="radio" aria-checked={budget === b} className={styles.chip} onClick={() => setBudget(b)}>
            {formatKZT(b)}
          </button>
        ))}
      </div>
      <label className={styles.field} htmlFor={id}>
        <span>{t('studio.budget.custom')}</span>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={BUDGET_LIMITS.min}
          max={BUDGET_LIMITS.max}
          step={10_000}
          value={budget}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v > 0) setBudget(v);
          }}
        />
        <small>{t('studio.budget.range', { min: formatKZT(BUDGET_LIMITS.min), max: formatKZT(BUDGET_LIMITS.max) })}</small>
      </label>
    </section>
  );
}

export function StyleStep() {
  const t = useT();
  const style = useStudioStore((s) => s.style);
  const setStyle = useStudioStore((s) => s.setStyle);
  const recommend = useStudioStore((s) => s.recommend);
  const setStep = useStudioStore((s) => s.setStep);
  return (
    <section className={styles.step}>
      <h2 className={styles.stepTitle}>{t('studio.style.title')}</h2>
      <p className={styles.stepHint}>{t('studio.style.hint')}</p>
      <div className={styles.optionGrid} role="radiogroup" aria-label={t('studio.style.title')}>
        {STYLES.map((s) => {
          const f = STYLE_FINISH[s];
          const glow = f.rgb === 'off' ? 'transparent' : RGB_COLORS[f.rgb as keyof typeof RGB_COLORS];
          return (
            <button key={s} type="button" role="radio" aria-checked={style === s} className={styles.option} onClick={() => setStyle(s)}>
              <span className={styles.swatch} style={{ background: CASE_FINISHES[f.case].color, boxShadow: `inset 0 -6px 0 ${glow}` }} aria-hidden="true" />
              <strong>{t(sk(`style.${s}`))}</strong>
            </button>
          );
        })}
      </div>
      <div className={styles.callout}>
        <p>{t('studio.recommend.hint')}</p>
        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            recommend();
            setStep('products');
          }}
        >
          <Sparkles size={16} aria-hidden="true" />
          {t('studio.recommend.button')}
        </button>
      </div>
    </section>
  );
}
