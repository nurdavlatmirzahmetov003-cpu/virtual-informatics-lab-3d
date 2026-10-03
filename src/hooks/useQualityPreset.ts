import { QUALITY_PRESETS, type QualityPreset } from '@/lib/quality/presets';
import { selectEffectiveQuality, useSettingsStore } from '@/store/settingsStore';

export function useQualityPreset(): QualityPreset {
  return QUALITY_PRESETS[useSettingsStore(selectEffectiveQuality)];
}
