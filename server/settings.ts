/**
 * Site settings (V2-10), stored as one JSON value per key. Every setting
 * has a default and a validator; unknown keys are refused. The server
 * enforces them (joining by code, teacher registration, session length,
 * the AI routes); the banner and the join switch are also public.
 */
import type { Db } from './db';
import { HttpError } from './http';

export interface Banner {
  kk: string;
  ru: string;
  en: string;
  tone: 'info' | 'warning';
}

export interface SiteSettings {
  /** A notice on every page (empty: none). */
  banner: Banner;
  /** Students may join a class with its code / QR. */
  allowJoinByCode: boolean;
  /** Teachers may create student accounts from a list. */
  allowTeacherRegistration: boolean;
  /** Length of a new session, hours. */
  sessionHours: number;
  /** The LLM assistant routes; off → the browser's local assistant only. */
  aiEnabled: boolean;
  /** Students see class and school leaderboards (V2-11a). */
  leaderboardsEnabled: boolean;
  /** Every student shows as "Participant N" to other students (adult groups). */
  leaderboardAnonymous: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  banner: { kk: '', ru: '', en: '', tone: 'info' },
  allowJoinByCode: true,
  allowTeacherRegistration: true,
  sessionHours: 12,
  aiEnabled: true,
  leaderboardsEnabled: true,
  leaderboardAnonymous: false,
};

const bool = (v: unknown) => {
  if (typeof v !== 'boolean') throw new HttpError(400, 'badSetting');
  return v;
};

const VALIDATE: { [K in keyof SiteSettings]: (v: unknown) => SiteSettings[K] } = {
  banner: (v) => {
    const b = v as Partial<Banner> | null;
    if (!b || typeof b !== 'object') throw new HttpError(400, 'badSetting');
    const text = (x: unknown) => {
      const s = typeof x === 'string' ? x.trim() : '';
      if (s.length > 300) throw new HttpError(400, 'badSetting');
      return s;
    };
    return { kk: text(b.kk), ru: text(b.ru), en: text(b.en), tone: b.tone === 'warning' ? 'warning' : 'info' };
  },
  allowJoinByCode: bool,
  allowTeacherRegistration: bool,
  sessionHours: (v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 72) throw new HttpError(400, 'badSetting');
    return n;
  },
  aiEnabled: bool,
  leaderboardsEnabled: bool,
  leaderboardAnonymous: bool,
};

const isKey = (k: string): k is keyof SiteSettings => k in VALIDATE;

/** Reads every setting (defaults for the missing ones). `base` lets .env set the default session length. */
export function getSettings(db: Db, base: Partial<SiteSettings> = {}): SiteSettings {
  const out: SiteSettings = { ...DEFAULT_SETTINGS, ...base };
  for (const row of db.prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>) {
    if (!isKey(row.key)) continue;
    try {
      (out as unknown as Record<string, unknown>)[row.key] = VALIDATE[row.key](JSON.parse(row.value));
    } catch {
      // a bad stored value falls back to the default
    }
  }
  return out;
}

/** Validates and stores the given keys; returns the changed key names. */
export function setSettings(db: Db, patch: Record<string, unknown>, actorId: string, now = Date.now()): string[] {
  const keys = Object.keys(patch);
  if (!keys.length || keys.some((k) => !isKey(k))) throw new HttpError(400, 'badSetting');
  const clean = keys.map((k) => [k, VALIDATE[k as keyof SiteSettings](patch[k])] as const);
  const put = db.prepare(
    'INSERT INTO settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at',
  );
  for (const [k, v] of clean) put.run(k, JSON.stringify(v), actorId, now);
  return keys;
}

/** What every visitor may know. */
export const publicSettings = (s: SiteSettings) => ({ banner: s.banner, allowJoinByCode: s.allowJoinByCode, leaderboardsEnabled: s.leaderboardsEnabled });
