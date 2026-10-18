/**
 * Versioned local persistence.
 *
 * Every persisted slice gets a namespaced key and its own schema version.
 * When a schema changes, bump its version and add a migration in the owning
 * store instead of wiping the user's data. Keys are listed here so the full
 * persistence surface is visible in one place (and can later move to
 * Supabase/PostgreSQL without hunting through components).
 */
export const STORAGE_NAMESPACE = 'vil3d';

export const STORAGE_KEYS = {
  settings: `${STORAGE_NAMESPACE}:settings`,
  /** Setup Studio configuration (store/studioStore.ts). */
  setup: `${STORAGE_NAMESPACE}:setup`,
  /** Student progress (services/progress — repository, migrations). */
  progress: `${STORAGE_NAMESPACE}:progress`,
} as const;

export const STORAGE_VERSIONS = {
  /** v2: colour theme. */
  settings: 3,
  setup: 1,
  /** v3: attempts + per-exercise summary + achievements (services/progress/migrate.ts). */
  progress: 3,
} as const;

/** localStorage can throw (private mode, blocked storage, quota). */
export function safeStorage(): Storage | undefined {
  try {
    const probe = `${STORAGE_NAMESPACE}:probe`;
    // globalThis: this module is also imported by the Node server (no DOM there)
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    if (!ls) return undefined;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return undefined;
  }
}
