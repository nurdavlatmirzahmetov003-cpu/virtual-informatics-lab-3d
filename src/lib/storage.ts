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

/**
 * V4 §8.4 demo mode: a flag in this tab's sessionStorage (services/demo).
 * Entering or leaving it reloads the page, so it is read once, here.
 */
export const DEMO_FLAG_KEY = `${STORAGE_NAMESPACE}:demo`;
export const DEMO_ACTIVE: boolean = (() => {
  try {
    return (globalThis as { sessionStorage?: Storage }).sessionStorage?.getItem(DEMO_FLAG_KEY) === '1';
  } catch {
    return false;
  }
})();

/**
 * Where the student's own data lives (progress, robots, learning-path cards):
 * in demo mode a separate namespace, so demo data never mixes with real data.
 * Settings and interface preferences stay shared.
 */
export const DEMO_NAMESPACE = `${STORAGE_NAMESPACE}:demo`;
export const DATA_NAMESPACE = DEMO_ACTIVE ? DEMO_NAMESPACE : STORAGE_NAMESPACE;

export const STORAGE_KEYS = {
  settings: `${STORAGE_NAMESPACE}:settings`,
  /** Setup Studio configuration (store/studioStore.ts). */
  setup: `${STORAGE_NAMESPACE}:setup`,
  /** Student progress (services/progress — repository, migrations); the demo profile has its own. */
  progress: `${DATA_NAMESPACE}:progress`,
  /** Bit the assistant: voice on/off, conversation mode (store/bitStore.ts). */
  bit: `${STORAGE_NAMESPACE}:bit`,
} as const;

export const STORAGE_VERSIONS = {
  /** v2: colour theme; v3: light is the default (0.36). */
  settings: 3,
  setup: 1,
  /** v3: attempts + per-exercise summary + achievements (services/progress/migrate.ts). */
  progress: 3,
  /** v2: where the button lives (dock). */
  bit: 2,
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
