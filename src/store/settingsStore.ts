import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_LANGUAGE, isLanguage, loadLanguage, type Language } from '@/lib/i18n';
import { isQualityMode, stepQuality, type QualityLevel, type QualityMode } from '@/lib/quality/presets';
import { detectQuality } from '@/lib/quality/detect';
import { STORAGE_KEYS, STORAGE_VERSIONS, safeStorage } from '@/lib/storage';
import { isThemeMode, type ThemeMode } from '@/lib/theme';

interface PersistedSettings {
  language: Language;
  qualityMode: QualityMode;
  soundEnabled: boolean;
  soundVolume: number;
  theme: ThemeMode;
}

interface SettingsState extends PersistedSettings {
  /** Level picked by device detection + runtime FPS monitoring (not persisted). */
  autoQuality: QualityLevel;
  setLanguage: (language: Language) => void;
  setQualityMode: (mode: QualityMode) => void;
  /** Called by the performance monitor; only affects `auto` mode. */
  degradeAutoQuality: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
}

const DEFAULTS: PersistedSettings = {
  language: DEFAULT_LANGUAGE,
  qualityMode: 'auto',
  soundEnabled: false,
  soundVolume: 0.25,
  // the bright day lab is the default since 0.35; dark and system are opt-in
  theme: 'light',
};

const memoryStorage = new Map<string, string>();
const storage = createJSONStorage<PersistedSettings>(
  () =>
    safeStorage() ?? {
      getItem: (k) => memoryStorage.get(k) ?? null,
      setItem: (k, v) => void memoryStorage.set(k, v),
      removeItem: (k) => void memoryStorage.delete(k),
    },
);

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      autoQuality: detectQuality(),
      // switch once the dictionary is here (offline: switch anyway, Kazakh fills the gaps)
      setLanguage: (language) => {
        const apply = () => set({ language });
        void loadLanguage(language).then(apply, apply);
      },
      setQualityMode: (qualityMode) => set({ qualityMode }),
      degradeAutoQuality: () => {
        const current = get().autoQuality;
        const next = stepQuality(current, -1);
        if (next !== current) {
          if (import.meta.env.DEV) console.info(`[quality] auto: ${current} -> ${next} (low FPS)`);
          set({ autoQuality: next });
        }
      },
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: STORAGE_KEYS.settings,
      version: STORAGE_VERSIONS.settings,
      storage,
      partialize: ({ language, qualityMode, soundEnabled, soundVolume, theme }) => ({
        language,
        qualityMode,
        soundEnabled,
        soundVolume,
        theme,
      }),
      // Validate whatever is on disk instead of trusting it; future schema
      // bumps add their transforms here keyed on `version`.
      migrate: (persisted, version) => {
        const raw = (persisted ?? {}) as Partial<PersistedSettings>;
        // before v3 dark was the default nobody had to pick: move everyone to the new bright theme once
        if (version < 3 && raw.theme === 'dark') raw.theme = 'light';
        return {
          language: isLanguage(raw.language) ? raw.language : DEFAULTS.language,
          qualityMode: isQualityMode(raw.qualityMode) ? raw.qualityMode : DEFAULTS.qualityMode,
          soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : DEFAULTS.soundEnabled,
          soundVolume:
            typeof raw.soundVolume === 'number' ? Math.min(1, Math.max(0, raw.soundVolume)) : DEFAULTS.soundVolume,
          theme: isThemeMode(raw.theme) ? raw.theme : DEFAULTS.theme,
        };
      },
    },
  ),
);

export const selectEffectiveQuality = (s: SettingsState): QualityLevel =>
  s.qualityMode === 'auto' ? s.autoQuality : s.qualityMode;
