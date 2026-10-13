/**
 * Browser side of the lab server API (V2-8). Same-origin requests (Vite
 * proxies /api to the server), the session lives in an httpOnly cookie the
 * page never sees; state-changing calls echo the CSRF token from /me or login.
 * No secret ever reaches this file.
 */
import type { ProgressSnapshot } from '@/services/progress/types';

export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  login: string;
  displayName: string;
  role: Role;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfter?: number;

  constructor(status: number, code: string, retryAfter?: number) {
    super(code);
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export async function call<T>(path: string, init: { method?: string; body?: unknown; csrf?: string } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', ...(init.csrf ? { 'x-csrf-token': init.csrf } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch {
    throw new ApiError(0, 'offline');
  }
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    // no JSON (e.g. the dev proxy without a server)
  }
  if (!res.ok) {
    // the dev proxy answers 503 when nothing listens on the API port
    const code = res.status === 503 || res.status === 502 ? 'offline' : String(data.error ?? 'server');
    throw new ApiError(res.status, code, typeof data.retryAfter === 'number' ? data.retryAfter : undefined);
  }
  return data as T;
}

export const authApi = {
  me: () => call<{ user: User | null; csrfToken?: string }>('/api/auth/me'),
  login: (login: string, password: string) => call<{ user: User; csrfToken: string }>('/api/auth/login', { method: 'POST', body: { login, password } }),
  logout: (csrf: string) => call<{ ok: true }>('/api/auth/logout', { method: 'POST', csrf }),
};

export const progressApi = {
  get: () => call<{ snapshot: ProgressSnapshot }>('/api/progress'),
  put: (snapshot: ProgressSnapshot, csrf: string) => call<{ snapshot: ProgressSnapshot }>('/api/progress', { method: 'PUT', body: { snapshot }, csrf }),
};
