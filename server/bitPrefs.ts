/**
 * Bit's voice settings per student (V4 §10): which voice, the speaking
 * style, the speed, emotion and auto-read. Guests keep them in the browser.
 *
 *   GET /api/bit/voice/me           → { prefs }   (null: never saved, the browser keeps its own)
 *   PUT /api/bit/voice/me { prefs } → { prefs }
 */
import type { Db } from './db';
import { json, readJson } from './http';
import type { Role, UserRow } from './users';
import { createRouter, type RouteCtx } from './router';
import { normalizeVoicePrefs, type VoicePrefs } from '@/services/bit/voicePrefs';

export interface BitPrefsDeps {
  db: Db;
  now: () => number;
  requireUser: (ctx: RouteCtx, ...roles: Role[]) => UserRow;
  checkCsrf: (ctx: RouteCtx) => void;
}

export type SavedVoicePrefs = VoicePrefs & { autoRead: boolean };

export const normalizeSavedPrefs = (raw: unknown): SavedVoicePrefs => ({ ...normalizeVoicePrefs(raw), autoRead: (raw as { autoRead?: unknown } | null)?.autoRead !== false });

export function loadVoicePrefs(db: Db, userId: string): SavedVoicePrefs | null {
  const row = db.prepare('SELECT data FROM bit_voice_prefs WHERE user_id = ?').get(userId) as { data: string } | undefined;
  if (!row) return null;
  try {
    return normalizeSavedPrefs(JSON.parse(row.data));
  } catch {
    return null;
  }
}

export function bitPrefsRoutes({ db, now, requireUser, checkCsrf }: BitPrefsDeps) {
  const router = createRouter();

  router.on('GET', '/api/bit/voice/me', (ctx) => {
    const u = requireUser(ctx);
    json(ctx.res, 200, { prefs: loadVoicePrefs(db, u.id) });
  });

  router.on('PUT', '/api/bit/voice/me', async (ctx) => {
    const u = requireUser(ctx);
    checkCsrf(ctx);
    const b = await readJson<{ prefs?: unknown }>(ctx.req, 2048);
    const prefs = normalizeSavedPrefs(b.prefs);
    db.prepare('INSERT INTO bit_voice_prefs (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at').run(u.id, JSON.stringify(prefs), now());
    json(ctx.res, 200, { prefs });
  });

  return router.route;
}
