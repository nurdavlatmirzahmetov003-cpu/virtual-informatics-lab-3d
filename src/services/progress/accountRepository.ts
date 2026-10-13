/**
 * Progress of a signed-in student (V2-8): a local copy under the user's own
 * key (works offline, no mix-up on a shared school computer) plus the server.
 * Loading merges both; every save writes locally at once and pushes to the
 * server a moment later (one request for a burst of changes). A failed push
 * is simply retried with the next save — nothing is lost while offline.
 */
import { mergeSnapshots } from './records';
import { createLocalProgressRepository, memoryStore, type KeyValueStore, type ProgressRepository } from './repository';
import type { ProgressSnapshot } from './types';
import { safeStorage, STORAGE_KEYS } from '@/lib/storage';

export interface ProgressServer {
  get(): Promise<{ snapshot: ProgressSnapshot }>;
  put(snapshot: ProgressSnapshot): Promise<unknown>;
}

export const accountKey = (userId: string) => `${STORAGE_KEYS.progress}:u:${userId}`;

export function createAccountProgressRepository(userId: string, server: ProgressServer, store: KeyValueStore = safeStorage() ?? memoryStore(), delayMs = 1500): ProgressRepository & { flush(): Promise<void> } {
  const local = createLocalProgressRepository(store, accountKey(userId));
  let pending: ProgressSnapshot | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = async () => {
    if (timer) clearTimeout(timer);
    timer = null;
    const s = pending;
    pending = null;
    if (!s) return;
    try {
      await server.put(s);
    } catch {
      // offline or signed out meanwhile: keep it for the next save
      pending ??= s;
    }
  };

  return {
    async load() {
      const mine = local.load() as ProgressSnapshot;
      try {
        const { snapshot } = await server.get();
        const merged = mergeSnapshots(snapshot, mine);
        local.save(merged);
        // the server may lack what was done offline: send the union back
        if (merged.attempts.length > snapshot.attempts.length || Object.keys(merged.achievements).length > Object.keys(snapshot.achievements).length) {
          pending = merged;
          void flush();
        }
        return merged;
      } catch {
        return mine;
      }
    },
    save(snapshot) {
      local.save(snapshot);
      pending = snapshot;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void flush(), delayMs);
    },
    clear() {
      local.clear();
    },
    flush,
  };
}
