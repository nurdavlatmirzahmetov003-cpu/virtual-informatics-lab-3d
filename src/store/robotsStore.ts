/**
 * V4 §4.4: the student's robots — what they bought, what each robot wears,
 * the robots' levels and the tips heard. Guests keep it in this browser;
 * a signed-in student's save lives on the server (server/robots.ts), which
 * checks it against the server's own XP. If the server cannot be reached,
 * the change stays in this browser and is sent with the next one.
 * Coins are derived, never stored: services/robots/economy.ts.
 */
import { create } from 'zustand';
import type { RobotId } from '@/data/robots/roster';
import { call } from '@/services/auth/api';
import { buy, emptySave, heardTip, normalizeSave, train, wear, type ItemId, type RobotSave, type WardrobeSlot } from '@/services/robots/economy';
import { STORAGE_NAMESPACE, safeStorage } from '@/lib/storage';
import { useAuthStore } from './authStore';

const KEY = `${STORAGE_NAMESPACE}:robots`;

function readLocal(): RobotSave {
  try {
    const raw = safeStorage()?.getItem(KEY);
    return raw ? normalizeSave(JSON.parse(raw)) : emptySave();
  } catch {
    return emptySave();
  }
}

function writeLocal(save: RobotSave) {
  try {
    safeStorage()?.setItem(KEY, JSON.stringify(save));
  } catch {
    /* storage full or blocked: the save lives for this visit */
  }
}

type Sync = 'local' | 'loading' | 'saved' | 'saving' | 'offline';

interface RobotsState {
  save: RobotSave;
  /** Where the save lives right now. */
  sync: Sync;
  /** The account the save was loaded for (null: guest). */
  owner: string | null;
  load(): Promise<void>;
  buy(item: ItemId, xp: number): ReturnType<typeof buy>;
  train(robot: RobotId, xp: number): ReturnType<typeof train>;
  wear(robot: RobotId, slot: WardrobeSlot, item: ItemId | null): void;
  heardTip(tipId: string): void;
}

let pending: ReturnType<typeof setTimeout> | null = null;

export const useRobotsStore = create<RobotsState>((set, get) => {
  /** Keeps the change and sends it (signed in) shortly after, so a burst of clicks is one request. */
  const commit = (save: RobotSave) => {
    const next = { ...save, updatedAt: Date.now() };
    set({ save: next });
    const { user, csrf } = useAuthStore.getState();
    if (!user || !csrf || get().owner !== user.id) {
      writeLocal(next);
      set({ sync: 'local' });
      return;
    }
    set({ sync: 'saving' });
    if (pending) clearTimeout(pending);
    pending = setTimeout(async () => {
      pending = null;
      try {
        const r = await call<{ save: RobotSave }>('/api/robots/me', { method: 'PUT', body: { save: get().save }, csrf: useAuthStore.getState().csrf ?? csrf });
        set({ save: normalizeSave(r.save), sync: 'saved' });
      } catch {
        // the server said no (overspent on another device) or is away: keep it here and say so
        writeLocal(get().save);
        set({ sync: 'offline' });
      }
    }, 500);
  };

  return {
    save: readLocal(),
    sync: 'local',
    owner: null,
    async load() {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ save: readLocal(), sync: 'local', owner: null });
        return;
      }
      if (get().owner === user.id && get().sync !== 'offline') return;
      set({ sync: 'loading', owner: user.id });
      try {
        const r = await call<{ save: RobotSave }>('/api/robots/me');
        set({ save: normalizeSave(r.save), sync: 'saved' });
      } catch {
        set({ save: readLocal(), sync: 'offline' });
      }
    },
    buy(item, xp) {
      const r = buy(get().save, xp, item);
      if (r.ok) commit(r.save);
      return r;
    },
    train(robot, xp) {
      const r = train(get().save, xp, robot);
      if (r.ok) commit(r.save);
      return r;
    },
    wear(robot, slot, item) {
      const next = wear(get().save, robot, slot, item);
      if (next !== get().save) commit(next);
    },
    heardTip(tipId) {
      const next = heardTip(get().save, tipId);
      if (next !== get().save) commit(next);
    },
  };
});

// a different account (or signing out) loads that account's robots
useAuthStore.subscribe((s, prev) => {
  if (s.user?.id !== prev.user?.id && s.status !== 'loading') void useRobotsStore.getState().load();
});
