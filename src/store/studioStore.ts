import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import type { HardwareCategory, SetupPurpose } from '@/data/hardware/types';
import {
  BUDGET_LIMITS,
  CASE_FINISH_IDS,
  CATEGORIES,
  DESK_SURFACES,
  PERIPHERAL_THEMES,
  PURPOSES,
  RGB_MODES,
  STYLE_FINISH,
  STYLES,
  type Finish,
  type SetupStyle,
} from '@/data/studio/options';
import type { Build } from '@/lib/studio/build';
import { recommendBuild } from '@/lib/studio/recommend';
import { STORAGE_KEYS, STORAGE_VERSIONS, safeStorage } from '@/lib/storage';

export type StudioStep = 'purpose' | 'budget' | 'style' | 'products' | 'colors';
export const STUDIO_STEPS: readonly StudioStep[] = ['purpose', 'budget', 'style', 'products', 'colors'];

interface PersistedStudio {
  purpose: SetupPurpose;
  budget: number;
  style: SetupStyle;
  build: Build;
  finish: Finish;
  step: StudioStep;
}

interface StudioState extends PersistedStudio {
  /** Category open in the product step (not persisted). */
  category: HardwareCategory;
  autoRotate: boolean;
  /** Bumped to fly the 3D camera back to its start shot. */
  cameraReset: number;
  setPurpose: (purpose: SetupPurpose) => void;
  setBudget: (budget: number) => void;
  /** Applies the style's finishes too; the colour step can still change each one. */
  setStyle: (style: SetupStyle) => void;
  select: (category: HardwareCategory, id: string | null) => void;
  /** Replaces the build with the recommendation for the current purpose / budget / style. */
  recommend: () => void;
  setFinish: (patch: Partial<Finish>) => void;
  setStep: (step: StudioStep) => void;
  setCategory: (category: HardwareCategory) => void;
  toggleAutoRotate: () => void;
  resetCamera: () => void;
  resetAll: () => void;
}

const DEFAULTS: PersistedStudio = {
  purpose: 'universal',
  budget: 800_000,
  style: 'black',
  build: {},
  finish: { ...STYLE_FINISH.black, rgbCustom: '#38d6f5' },
  step: 'purpose',
};

const clampBudget = (n: number) => Math.min(BUDGET_LIMITS.max, Math.max(BUDGET_LIMITS.min, Math.round(n)));
const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

/** Keeps only catalog ids that still exist in the right category. */
function sanitizeBuild(raw: unknown): Build {
  const out: Build = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const category of CATEGORIES) {
    const id = (raw as Record<string, unknown>)[category];
    if (id === null) out[category] = null;
    else if (typeof id === 'string' && CATALOG_BY_ID.get(id)?.category === category) out[category] = id;
  }
  return out;
}

function sanitizeFinish(raw: unknown): Finish {
  const f = (raw ?? {}) as Partial<Finish>;
  const d = DEFAULTS.finish;
  return {
    case: isOneOf(CASE_FINISH_IDS, f.case) ? f.case : d.case,
    rgb: isOneOf(RGB_MODES, f.rgb) ? f.rgb : d.rgb,
    rgbCustom: typeof f.rgbCustom === 'string' && /^#[0-9a-f]{6}$/i.test(f.rgbCustom) ? f.rgbCustom : d.rgbCustom,
    desk: isOneOf(DESK_SURFACES, f.desk) ? f.desk : d.desk,
    peripherals: isOneOf(PERIPHERAL_THEMES, f.peripherals) ? f.peripherals : d.peripherals,
  };
}

const memory = new Map<string, string>();
const storage = createJSONStorage<PersistedStudio>(
  () =>
    safeStorage() ?? {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    },
);

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      category: 'monitor',
      autoRotate: false,
      cameraReset: 0,
      setPurpose: (purpose) => set({ purpose }),
      setBudget: (budget) => set({ budget: clampBudget(budget) }),
      setStyle: (style) => set((s) => ({ style, finish: { ...s.finish, ...STYLE_FINISH[style] } })),
      select: (category, id) => set((s) => ({ build: { ...s.build, [category]: id } })),
      recommend: () => {
        const { purpose, budget, style } = get();
        set({ build: recommendBuild(purpose, budget, style) });
      },
      setFinish: (patch) => set((s) => ({ finish: sanitizeFinish({ ...s.finish, ...patch }) })),
      setStep: (step) => set({ step }),
      setCategory: (category) => set({ category }),
      toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
      resetCamera: () => set((s) => ({ cameraReset: s.cameraReset + 1 })),
      resetAll: () => set({ ...DEFAULTS, category: 'monitor' }),
    }),
    {
      name: STORAGE_KEYS.setup,
      version: STORAGE_VERSIONS.setup,
      storage,
      partialize: ({ purpose, budget, style, build, finish, step }) => ({ purpose, budget, style, build, finish, step }),
      // Validate whatever is on disk; schema bumps add their transforms here keyed on `version`.
      migrate: (persisted) => {
        const raw = (persisted ?? {}) as Partial<PersistedStudio>;
        return {
          purpose: isOneOf(PURPOSES, raw.purpose) ? raw.purpose : DEFAULTS.purpose,
          budget: typeof raw.budget === 'number' && Number.isFinite(raw.budget) ? clampBudget(raw.budget) : DEFAULTS.budget,
          style: isOneOf(STYLES, raw.style) ? raw.style : DEFAULTS.style,
          build: sanitizeBuild(raw.build),
          finish: sanitizeFinish(raw.finish),
          step: raw.step && (['purpose', 'budget', 'style', 'products', 'colors'] as const).includes(raw.step) ? raw.step : DEFAULTS.step,
        };
      },
      // Catalog ids can disappear between releases even without a schema bump.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedStudio>;
        return { ...current, ...p, build: sanitizeBuild(p.build), finish: sanitizeFinish(p.finish) };
      },
    },
  ),
);
