/**
 * Admin-edited texts (V2-10). The locale files stay the defaults; an
 * override replaces one string key in one language. Only the learning
 * content is editable (devices, anatomy, teardowns, tasks and quiz
 * questions, lab descriptions) — never the interface itself. A new text
 * must keep the same {placeholders} as the default, so it still renders.
 * React prints these as text, never as HTML.
 */
import { readFileSync } from 'node:fs';
import type { Db } from './db';
import { HttpError } from './http';

export const CONTENT_LANGS = ['kk', 'ru', 'en'] as const;
export type ContentLang = (typeof CONTENT_LANGS)[number];

/** Top-level locale sections the admin may edit. */
export const CONTENT_SECTIONS = ['devices', 'anatomy', 'teardown', 'tasks', 'network', 'logic', 'algorithms', 'experiments', 'connect', 'sim', 'labs'] as const;

export const MAX_TEXT = 4000;

type Dict = Record<string, unknown>;
let defaults: Record<ContentLang, Dict> | null = null;

/** The shipped dictionaries (read once). */
export function defaultTexts(): Record<ContentLang, Dict> {
  defaults ??= Object.fromEntries(CONTENT_LANGS.map((l) => [l, JSON.parse(readFileSync(new URL(`../src/locales/${l}.json`, import.meta.url), 'utf8'))])) as Record<ContentLang, Dict>;
  return defaults;
}

export function lookup(dict: Dict, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Dict)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

/** Every override, grouped by language (public: the app merges them into its dictionaries). */
export function allOverrides(db: Db): Record<ContentLang, Record<string, string>> {
  const out = { kk: {}, ru: {}, en: {} } as Record<ContentLang, Record<string, string>>;
  for (const r of db.prepare('SELECT key, lang, value FROM content_overrides').all() as Array<{ key: string; lang: ContentLang; value: string }>) out[r.lang][r.key] = r.value;
  return out;
}

/** A version that changes with every edit (lets the browser skip unchanged data later). */
export const contentVersion = (db: Db) => (db.prepare('SELECT COUNT(*) AS n, COALESCE(MAX(updated_at), 0) AS t FROM content_overrides').get() as { n: number; t: number });

/** Sets (or, with null / the default text, removes) one override. */
export function setOverride(db: Db, input: { key?: unknown; lang?: unknown; value?: unknown }, actorId: string, now = Date.now()): 'set' | 'reset' {
  const key = typeof input.key === 'string' ? input.key : '';
  const lang = CONTENT_LANGS.find((l) => l === input.lang);
  if (!/^[A-Za-z0-9_.-]{3,200}$/.test(key) || !CONTENT_SECTIONS.some((s) => key.startsWith(`${s}.`))) throw new HttpError(400, 'badKey');
  if (!lang) throw new HttpError(400, 'badLang');
  // the key must be a real string in the shipped Kazakh dictionary (the reference)
  const base = lookup(defaultTexts().kk, key);
  if (base === undefined) throw new HttpError(400, 'badKey');
  const own = lookup(defaultTexts()[lang], key) ?? base;
  if (input.value === null || input.value === own) {
    db.prepare('DELETE FROM content_overrides WHERE key = ? AND lang = ?').run(key, lang);
    return 'reset';
  }
  const value = typeof input.value === 'string' ? input.value.replace(/\r\n/g, '\n').trim() : '';
  if (!value || value.length > MAX_TEXT) throw new HttpError(400, 'badText');
  if (placeholders(value) !== placeholders(base)) throw new HttpError(400, 'placeholders', { expected: placeholders(base) });
  db.prepare(
    'INSERT INTO content_overrides (key, lang, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT (key, lang) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at',
  ).run(key, lang, value, actorId, now);
  return 'set';
}
