/**
 * The lab database: node:sqlite now, a PostgreSQL-compatible schema for later
 * (text UUID keys, BIGINT epoch-ms times, no AUTOINCREMENT, plain CHECK and
 * REFERENCES). Migrations are numbered .sql files in server/migrations,
 * applied once each and recorded in schema_migrations.
 */
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

export type Db = DatabaseSync;

export const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations/', import.meta.url));

export function openDb(file: string): Db {
  if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  return db;
}

/** Applies every migration not yet recorded; returns the versions applied now. */
export function migrate(db: Db, dir = MIGRATIONS_DIR, now = Date.now()): string[] {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at BIGINT NOT NULL)');
  const done = new Set((db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: string }>).map((r) => r.version));
  const files = readdirSync(dir)
    .filter((f) => /^\d+_.+\.sql$/.test(f))
    .sort();
  const applied: string[] = [];
  for (const f of files) {
    const version = f.replace(/\.sql$/, '');
    if (done.has(version)) continue;
    db.exec('BEGIN');
    try {
      db.exec(readFileSync(`${dir}${f}`, 'utf8'));
      db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(version, now);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    applied.push(version);
  }
  return applied;
}
