/**
 * V4 §8.4 demo mode for the defence. A flag in this tab's sessionStorage
 * switches the student's data to its own namespace (lib/storage.ts
 * DATA_NAMESPACE), filled with sample data (./data.ts). Real progress,
 * robots and the account are never read or written in demo mode, and
 * nothing of the demo reaches the server. Every switch reloads the page, so
 * each store starts from the right namespace.
 */
import { DEMO_ACTIVE, DEMO_FLAG_KEY, DEMO_NAMESPACE, safeStorage } from '@/lib/storage';
import { createLocalProgressRepository } from '@/services/progress';
import { demoCode } from '@/services/certificate/codes';
import { demoProgress, demoRobots } from './data';

export const isDemo = () => DEMO_ACTIVE;

const KEYS = {
  progress: `${DEMO_NAMESPACE}:progress`,
  robots: `${DEMO_NAMESPACE}:robots`,
  certificate: `${DEMO_NAMESPACE}:certificate`,
} as const;

function session(): Storage | undefined {
  try {
    return globalThis.sessionStorage;
  } catch {
    return undefined;
  }
}

/** Removes every demo key (the real data has none of this prefix). */
export function clearDemoData() {
  const ls = safeStorage();
  if (!ls) return;
  const prefix = `${DEMO_NAMESPACE}:`;
  for (const key of Object.keys(ls)) if (key.startsWith(prefix)) ls.removeItem(key);
}

/** Writes a fresh demo profile into the demo namespace. */
export function seedDemo(now = Date.now()) {
  const ls = safeStorage();
  if (!ls) return;
  clearDemoData();
  const progress = demoProgress(now);
  void createLocalProgressRepository(ls, KEYS.progress).save(progress);
  ls.setItem(KEYS.robots, JSON.stringify(demoRobots(progress, now)));
}

const go = (path: string) => window.location.replace(`${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`);

/**
 * Into demo mode. A signed-in user is signed out first (their work is saved
 * to the account), so a demo never shares a session with a real account.
 */
export async function enterDemo(path = '/progress') {
  const { useAuthStore } = await import('@/store/authStore');
  if (useAuthStore.getState().status === 'loading') await useAuthStore.getState().init();
  if (useAuthStore.getState().status === 'signedIn') await useAuthStore.getState().signOut();
  seedDemo();
  session()?.setItem(DEMO_FLAG_KEY, '1');
  go(path);
}

/** One click: the demo profile as it was at the start. */
export function resetDemo() {
  seedDemo();
  go(window.location.pathname.slice(import.meta.env.BASE_URL.length - 1) || '/');
}

/** Back to the real profile; the demo data is deleted. */
export function exitDemo(path = '/') {
  session()?.removeItem(DEMO_FLAG_KEY);
  clearDemoData();
  go(path);
}

/** The demo profile's certificate code (made once per demo, never verifies). */
export function demoCertificateCode() {
  const ls = safeStorage();
  const stored = ls?.getItem(KEYS.certificate);
  if (stored) return stored;
  const code = demoCode();
  ls?.setItem(KEYS.certificate, code);
  return code;
}
