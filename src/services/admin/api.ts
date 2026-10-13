/** Admin panel API (V2-10); shapes mirror server/admin*.ts. Writes carry the CSRF token. */
import { ApiError, call, type Role, type User } from '@/services/auth/api';
import type { Banner, PublicSite } from '@/store/siteStore';

export interface AdminUserRow {
  id: string;
  login: string;
  displayName: string;
  role: Role;
  disabled: boolean;
  schoolId: string | null;
  schoolName: string | null;
  createdAt: number;
  lastLoginAt: number | null;
  /** Classes taught (teacher/admin) or joined (student). */
  classes: number;
}

export interface School {
  id: string;
  name: string;
  createdAt: number;
  users: number;
  classes: number;
}

export interface AdminClass {
  id: string;
  name: string;
  joinCode: string;
  createdAt: number;
  schoolId: string | null;
  schoolName: string | null;
  teacherId: string;
  teacherName: string;
  students: number;
  assignments: number;
}

export interface AuditEntry {
  id: string;
  at: number;
  action: string;
  actor: string | null;
  target: string | null;
  ip: string | null;
  detail: string;
}

export interface Security {
  yourIp: string;
  activity: {
    last24h: Partial<Record<'login.ok' | 'login.fail' | 'login.blocked', number>>;
    failsByIp: Array<{ ip: string; fails: number; last: number; logins: number }>;
    recent: Array<{ at: number; action: string; ip: string | null; login: string | null }>;
  };
  limiter: Array<{ key: string; ip: string; login: string | null; fails: number; retryAfter: number }>;
  ipBlocks: Array<{ ip: string; reason: string; by: string | null; createdAt: number; expiresAt: number | null }>;
}

export interface SiteSettings {
  banner: Banner;
  allowJoinByCode: boolean;
  allowTeacherRegistration: boolean;
  sessionHours: number;
  aiEnabled: boolean;
}

export interface Override {
  key: string;
  lang: 'kk' | 'ru' | 'en';
  value: string;
  updatedAt: number;
  by: string | null;
}

export interface BackupInfo {
  name: string;
  size: number;
  createdAt: number;
}

export interface Health {
  now: number;
  server: { node: string; platform: string; uptime: number; rss: number; heapUsed: number; pid: number };
  database: { file: string; size: number; wal: number; migrations: string[]; rows: Record<string, number> };
  backups: { count: number; last: number | null; dir: string };
  sessions: { active: number };
  disk: { free: number; total: number } | null;
  ai: { provider: string | null; model: string | null };
  config: { port: number; cookieSecure: boolean; trustProxy: string; allowedOrigins: string[] };
  warnings: string[];
}

const A = '/api/admin';
const enc = encodeURIComponent;
const qs = (o: Record<string, string>) => new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();

export const adminApi = {
  users: (filter: { q?: string; role?: string; status?: string; school?: string } = {}) => call<{ total: number; users: AdminUserRow[] }>(`${A}/users?${qs(filter)}`),
  createUser: (input: { login: string; displayName: string; role: Role; password: string }, csrf: string) => call<{ user: User }>(`${A}/users`, { method: 'POST', body: input, csrf }),
  updateUser: (id: string, patch: { displayName?: string; role?: Role; disabled?: boolean; schoolId?: string | null }, csrf: string) =>
    call<{ changes: string[] }>(`${A}/users/${enc(id)}`, { method: 'PATCH', body: patch, csrf }),
  resetLink: (id: string, csrf: string) => call<{ token: string; expiresAt: number; login: string }>(`${A}/users/${enc(id)}/reset-link`, { method: 'POST', csrf }),

  schools: () => call<{ schools: School[] }>(`${A}/schools`),
  createSchool: (name: string, csrf: string) => call<{ id: string }>(`${A}/schools`, { method: 'POST', body: { name }, csrf }),
  renameSchool: (id: string, name: string, csrf: string) => call<{ ok: true }>(`${A}/schools/${enc(id)}`, { method: 'PATCH', body: { name }, csrf }),
  deleteSchool: (id: string, csrf: string) => call<{ ok: true }>(`${A}/schools/${enc(id)}`, { method: 'DELETE', csrf }),
  classes: () => call<{ classes: AdminClass[] }>(`${A}/classes`),
  updateClass: (id: string, patch: { teacherId?: string; schoolId?: string | null }, csrf: string) => call<{ changes: string[] }>(`${A}/classes/${enc(id)}`, { method: 'PATCH', body: patch, csrf }),

  audit: (filter: { action?: string; q?: string; before?: number }) => call<{ more: boolean; entries: AuditEntry[] }>(`${A}/audit?${qs({ action: filter.action ?? '', q: filter.q ?? '', before: filter.before ? String(filter.before) : '' })}`),
  security: () => call<Security>(`${A}/security`),
  clearLimiter: (key: string, csrf: string) => call<{ ok: true }>(`${A}/security/clear`, { method: 'POST', body: { key }, csrf }),
  blockIp: (ip: string, reason: string, hours: number | null, csrf: string) => call<{ ip: string }>(`${A}/ip-blocks`, { method: 'POST', body: { ip, reason, hours }, csrf }),
  unblockIp: (ip: string, csrf: string) => call<{ ok: true }>(`${A}/ip-blocks/${enc(ip)}`, { method: 'DELETE', csrf }),

  settings: () => call<{ settings: SiteSettings }>(`${A}/settings`),
  saveSettings: (patch: Partial<SiteSettings>, csrf: string) => call<{ settings: SiteSettings }>(`${A}/settings`, { method: 'PUT', body: patch, csrf }),

  content: () => call<{ sections: string[]; overrides: Override[] }>(`${A}/content`),
  setText: (key: string, lang: string, value: string | null, csrf: string) => call<{ result: 'set' | 'reset'; overrides: PublicSite['content'] }>(`${A}/content`, { method: 'PUT', body: { key, lang, value }, csrf }),

  backups: () => call<{ backups: BackupInfo[]; restorable: boolean }>(`${A}/backups`),
  createBackup: (csrf: string) => call<{ backup: BackupInfo }>(`${A}/backups`, { method: 'POST', csrf }),
  restore: (name: string, csrf: string) => call<{ ok: true; safety: BackupInfo }>(`${A}/backups/${enc(name)}/restore`, { method: 'POST', csrf }),
  deleteBackup: (name: string, csrf: string) => call<{ ok: true }>(`${A}/backups/${enc(name)}`, { method: 'DELETE', csrf }),
  downloadUrl: (name: string) => `${A}/backups/${enc(name)}/download`,
  /** Raw .db upload (not JSON). */
  upload: async (file: File, csrf: string) => {
    let res: Response;
    try {
      res = await fetch(`${A}/backups/upload`, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/octet-stream', 'x-csrf-token': csrf }, body: file });
    } catch {
      throw new ApiError(0, 'offline');
    }
    const data = (await res.json().catch(() => ({}))) as { backup?: BackupInfo; error?: string };
    if (!res.ok) throw new ApiError(res.status, data.error ?? 'server');
    return data.backup!;
  },

  health: () => call<Health>(`${A}/health`),
  integrity: (csrf: string) => call<{ result: string[] }>(`${A}/health/integrity`, { method: 'POST', csrf }),
};

export const resetApi = {
  check: (token: string) => call<{ login: string; displayName: string }>(`/api/auth/reset?token=${enc(token)}`),
  set: (token: string, password: string) => call<{ ok: true; login: string }>('/api/auth/reset', { method: 'POST', body: { token, password } }),
};
