/**
 * Where progress lives. The store talks only to `ProgressRepository`, so a
 * Supabase/PostgreSQL implementation can replace the local one later
 * (methods may return promises; the store awaits them) without touching
 * any page or lab.
 *
 * The local repository keeps the zustand-persist envelope `{ version, state }`
 * under `vil3d:progress`, so data saved by v1/v2 builds is read and upgraded
 * in place. Before an upgrade the original text is copied to
 * `vil3d:progress:backup-v<n>` once, and unreadable data is kept under
 * `vil3d:progress:corrupt` instead of being overwritten silently.
 */
import { safeStorage, STORAGE_KEYS } from '@/lib/storage';
import { fromPrototype, readEnvelope } from './migrate';
import { emptySnapshot, rebuild } from './records';
import { PROGRESS_VERSION, type ProgressSnapshot } from './types';

type MaybePromise<T> = T | Promise<T>;

export interface ProgressRepository {
  load(): MaybePromise<ProgressSnapshot>;
  save(snapshot: ProgressSnapshot): MaybePromise<void>;
  /** Removes stored progress (and its backups). */
  clear(): MaybePromise<void>;
  /** Notifies when the data changed elsewhere (another tab). Returns an unsubscribe. */
  watch?(onChange: () => void): () => void;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStore(): KeyValueStore & { dump(): Record<string, string> } {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

export const PROTOTYPE_KEY = 'vlab_progress_v1';

export function createLocalProgressRepository(store: KeyValueStore = safeStorage() ?? memoryStore(), key: string = STORAGE_KEYS.progress): ProgressRepository {
  const backupKey = (version: number) => `${key}:backup-v${version}`;
  const CORRUPT_KEY = `${key}:corrupt`;
  const write = (k: string, v: string) => {
    try {
      store.setItem(k, v);
    } catch {
      // quota or blocked storage: progress stays in memory for this session
    }
  };

  return {
    load() {
      const now = Date.now();
      const read = (k: string) => {
        try {
          return store.getItem(k);
        } catch {
          return null;
        }
      };
      const text = read(key);

      let snapshot = emptySnapshot(now);
      if (text) {
        let raw: unknown;
        try {
          raw = JSON.parse(text);
        } catch {
          write(CORRUPT_KEY, text);
        }
        if (raw !== undefined) {
          const env = readEnvelope(raw, now);
          snapshot = env.snapshot;
          if (env.version !== PROGRESS_VERSION && read(backupKey(env.version)) === null) write(backupKey(env.version), text);
        }
      }

      if (!snapshot.meta.legacyImported) {
        let proto: unknown;
        try {
          proto = JSON.parse(read(PROTOTYPE_KEY) ?? 'null');
        } catch {
          proto = undefined;
        }
        const old = fromPrototype(proto, now);
        snapshot = { ...(old.length ? rebuild(old, snapshot) : snapshot), meta: { ...snapshot.meta, legacyImported: true } };
      }
      return snapshot;
    },

    save(snapshot) {
      write(key, JSON.stringify({ version: PROGRESS_VERSION, state: snapshot }));
    },

    clear() {
      for (const k of [key, CORRUPT_KEY, ...[0, 1, 2].map(backupKey)]) {
        try {
          store.removeItem(k);
        } catch {
          // ignore
        }
      }
    },

    watch(onChange) {
      if (typeof window === 'undefined') return () => {};
      const handler = (e: StorageEvent) => {
        if (e.key === key) onChange();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}
