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
  // Reserved for later phases:
  setup: `${STORAGE_NAMESPACE}:setup`,
  progress: `${STORAGE_NAMESPACE}:progress`,
} as const;

export const STORAGE_VERSIONS = {
  settings: 1,
} as const;

/** localStorage can throw (private mode, blocked storage, quota). */
export function safeStorage(): Storage | undefined {
  try {
    const probe = `${STORAGE_NAMESPACE}:probe`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return undefined;
  }
}
