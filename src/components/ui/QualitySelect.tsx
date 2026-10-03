import { Gauge } from 'lucide-react';
import { QUALITY_LEVELS, isQualityMode } from '@/lib/quality/presets';
import { useSettingsStore } from '@/store/settingsStore';
import { useT } from '@/hooks/useT';
import styles from './Controls.module.css';

export function QualitySelect() {
  const t = useT();
  const mode = useSettingsStore((s) => s.qualityMode);
  const autoQuality = useSettingsStore((s) => s.autoQuality);
  const setQualityMode = useSettingsStore((s) => s.setQualityMode);

  return (
    <label className={styles.select} title={t('settings.quality')}>
      <Gauge size={16} aria-hidden="true" />
      <span className="visually-hidden">{t('settings.quality')}</span>
      <select
        value={mode}
        onChange={(e) => {
          if (isQualityMode(e.target.value)) setQualityMode(e.target.value);
        }}
      >
        <option value="auto">{t('settings.qualityDetected', { level: t(`quality.${autoQuality}`) })}</option>
        {QUALITY_LEVELS.map((level) => (
          <option key={level} value={level}>
            {t(`quality.${level}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
