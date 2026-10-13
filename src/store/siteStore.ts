/**
 * What the server says about the whole site (V2-10): the admin's banner,
 * whether students may join by code, and the admin-edited texts (laid over
 * the dictionaries; `contentVersion` re-renders every translated string).
 * Without a server it stays at the defaults and the shipped texts.
 */
import { create } from 'zustand';
import { setContentOverrides, type Language } from '@/lib/i18n';
import { call } from '@/services/auth/api';

export interface Banner {
  kk: string;
  ru: string;
  en: string;
  tone: 'info' | 'warning';
}

export interface PublicSite {
  settings: { banner: Banner; allowJoinByCode: boolean };
  content: Partial<Record<Language, Record<string, string>>>;
}

interface SiteState {
  banner: Banner | null;
  allowJoinByCode: boolean;
  contentVersion: number;
  load: () => Promise<void>;
  /** Applies texts just saved in the admin panel without a reload. */
  applyContent: (content: PublicSite['content']) => void;
}

export const useSiteStore = create<SiteState>((set, get) => ({
  banner: null,
  allowJoinByCode: true,
  contentVersion: 0,
  load: async () => {
    try {
      const r = await call<PublicSite>('/api/public');
      get().applyContent(r.content);
      set({ banner: r.settings.banner, allowJoinByCode: r.settings.allowJoinByCode });
    } catch {
      // no server: guest mode with the shipped texts
    }
  },
  applyContent: (content) => {
    setContentOverrides(content);
    set((s) => ({ contentVersion: s.contentVersion + 1 }));
  },
}));
