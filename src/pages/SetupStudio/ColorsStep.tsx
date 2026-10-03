import { useId } from 'react';
import { CASE_FINISHES, CASE_FINISH_IDS, DESK_SURFACES, PERIPHERAL_THEMES, RGB_COLORS, RGB_MODES, type Finish } from '@/data/studio/options';
import { useT } from '@/hooks/useT';
import { useStudioStore } from '@/store/studioStore';
import { sk } from './studioText';
import styles from './SetupStudio.module.css';

const DESK_SWATCH: Record<Finish['desk'], string> = {
  darkWood: 'linear-gradient(135deg, #5a3b26, #7a5236 60%, #4a3020)',
  lightWood: 'linear-gradient(135deg, #c9ab83, #dcc39f 60%, #b8966b)',
  black: '#1a1b1e',
  white: '#e6e6e2',
};
const THEME_SWATCH: Record<Finish['peripherals'], string> = {
  black: '#16171b',
  white: '#e6e8ec',
  mixed: 'linear-gradient(90deg, #e6e8ec 50%, #16171b 50%)',
};

function Swatches<K extends string>({ label, items, value, onPick, swatch, labelOf }: {
  label: string;
  items: readonly K[];
  value: K;
  onPick: (k: K) => void;
  swatch: (k: K) => string;
  labelOf: (k: K) => string;
}) {
  return (
    <fieldset className={styles.swatchGroup}>
      <legend>{label}</legend>
      <div className={styles.swatchRow}>
        {items.map((k) => (
          <button key={k} type="button" aria-pressed={value === k} className={styles.swatchButton} onClick={() => onPick(k)}>
            <span className={styles.swatch} style={{ background: swatch(k) }} aria-hidden="true" />
            {labelOf(k)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ColorsStep() {
  const t = useT();
  const pickerId = useId();
  const finish = useStudioStore((s) => s.finish);
  const setFinish = useStudioStore((s) => s.setFinish);

  return (
    <section className={styles.step}>
      <h2 className={styles.stepTitle}>{t('studio.colors.title')}</h2>
      <p className={styles.stepHint}>{t('studio.colors.hint')}</p>

      <Swatches
        label={t('studio.colors.case')}
        items={CASE_FINISH_IDS}
        value={finish.case}
        onPick={(c) => setFinish({ case: c })}
        swatch={(c) => CASE_FINISHES[c].color}
        labelOf={(c) => t(sk(`finish.${c}`))}
      />

      <Swatches
        label={t('studio.colors.rgb')}
        items={RGB_MODES}
        value={finish.rgb}
        onPick={(rgb) => setFinish({ rgb })}
        swatch={(m) =>
          m === 'off' ? 'repeating-linear-gradient(45deg, #2a2d34 0 4px, #15171c 4px 8px)' : m === 'custom' ? finish.rgbCustom : RGB_COLORS[m]
        }
        labelOf={(m) => t(sk(`rgb.${m}`))}
      />
      {finish.rgb === 'custom' && (
        <label className={styles.colorField} htmlFor={pickerId}>
          <span>{t('studio.colors.customPick')}</span>
          <input id={pickerId} type="color" value={finish.rgbCustom} onChange={(e) => setFinish({ rgbCustom: e.target.value })} />
        </label>
      )}

      <Swatches
        label={t('studio.colors.desk')}
        items={DESK_SURFACES}
        value={finish.desk}
        onPick={(desk) => setFinish({ desk })}
        swatch={(d) => DESK_SWATCH[d]}
        labelOf={(d) => t(sk(`desk.${d}`))}
      />

      <Swatches
        label={t('studio.colors.peripherals')}
        items={PERIPHERAL_THEMES}
        value={finish.peripherals}
        onPick={(peripherals) => setFinish({ peripherals })}
        swatch={(p) => THEME_SWATCH[p]}
        labelOf={(p) => t(sk(`theme.${p}`))}
      />
    </section>
  );
}
