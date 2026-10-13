/**
 * Who is using the lab (V2-8): a guest (default — every lab works without an
 * account), or a signed-in student / teacher / admin. A student's progress
 * moves to their account on sign-in: what they did as a guest on this
 * computer is merged in and the guest copy is cleared, so the next person
 * at a shared school computer starts clean. Signing out returns to guest mode.
 */
import { create } from 'zustand';
import { ApiError, authApi, progressApi, type User } from '@/services/auth/api';
import { createAccountProgressRepository } from '@/services/progress/accountRepository';
import { createLocalProgressRepository } from '@/services/progress/repository';
import { setProgressRepository } from './progressStore';

export type AuthStatus = 'loading' | 'guest' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  csrf: string | null;
  /** The server answered at least once (false: offline / not started → guest mode only). */
  serverOnline: boolean | null;
  init: () => Promise<void>;
  signIn: (login: string, password: string) => Promise<{ ok: true; user: User } | { ok: false; code: string; retryAfter?: number }>;
  signOut: () => Promise<void>;
}

let flushAccount: (() => Promise<void>) | null = null;

async function switchToAccount(user: User, csrf: string, mergeGuest: boolean) {
  if (user.role !== 'student') return;
  const repo = createAccountProgressRepository(user.id, { get: progressApi.get, put: (s) => progressApi.put(s, useAuthStore.getState().csrf ?? csrf) });
  flushAccount = repo.flush;
  await setProgressRepository(repo, { keepCurrent: mergeGuest });
  // the guest copy now lives in the account; leave nothing behind on this computer
  if (mergeGuest) await createLocalProgressRepository().clear();
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  status: 'loading',
  user: null,
  csrf: null,
  serverOnline: null,

  init: async () => {
    try {
      const { user, csrfToken } = await authApi.me();
      set({ serverOnline: true, user, csrf: csrfToken ?? null, status: user ? 'signedIn' : 'guest' });
      // a returning student: their account copy, not the guest one
      if (user && csrfToken) await switchToAccount(user, csrfToken, false);
    } catch {
      set({ serverOnline: false, status: 'guest', user: null, csrf: null });
    }
  },

  signIn: async (login, password) => {
    try {
      const { user, csrfToken } = await authApi.login(login, password);
      set({ status: 'signedIn', user, csrf: csrfToken, serverOnline: true });
      await switchToAccount(user, csrfToken, true);
      return { ok: true, user };
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError(0, 'offline');
      if (err.code === 'offline') set({ serverOnline: false });
      return { ok: false, code: err.code, retryAfter: err.retryAfter };
    }
  },

  signOut: async () => {
    const { csrf, user } = get();
    await flushAccount?.().catch(() => {});
    flushAccount = null;
    if (csrf) await authApi.logout(csrf).catch(() => {});
    set({ status: 'guest', user: null, csrf: null });
    // back to an empty guest progress (the account copy stays in the account)
    if (user?.role === 'student') await setProgressRepository(createLocalProgressRepository(), { keepCurrent: false });
  },
}));
