/**
 * System health for the admin (V2-10): server process, database (size,
 * schema version, rows per table, integrity on demand), backups, sessions,
 * disk space and the AI provider — and warnings worth acting on.
 */
import { statSync, statfsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Db } from './db';
import type { ServerConfig } from './env';
import { listBackups } from './backup';

const TABLES = ['users', 'schools', 'classes', 'class_members', 'assignments', 'attempts', 'submissions', 'grades', 'announcements', 'messages', 'achievements', 'sessions', 'audit_log', 'content_overrides'] as const;

const size = (file: string) => {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
};

export function systemHealth(db: Db, config: ServerConfig, extra: { ai: { provider: string | null; model: string | null }; startedAt: number }, now = Date.now()) {
  const rows = Object.fromEntries(TABLES.map((t) => [t, (db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as { n: number }).n]));
  const migrations = (db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as Array<{ version: string }>).map((r) => r.version);
  const backups = listBackups(config.backupDir);
  const lastBackup = backups[0]?.createdAt ?? null;
  const activeSessions = (db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?').get(now) as { n: number }).n;
  const memoryDb = config.dbFile === ':memory:';
  let disk: { free: number; total: number } | null;
  try {
    const st = statfsSync(memoryDb ? '.' : dirname(config.dbFile));
    disk = { free: st.bavail * st.bsize, total: st.blocks * st.bsize };
  } catch {
    disk = null;
  }
  const mem = process.memoryUsage();
  const warnings: string[] = [];
  if (!lastBackup || now - lastBackup > 7 * 24 * 3600_000) warnings.push('noRecentBackup');
  if (disk && disk.free < 1024 ** 3) warnings.push('lowDisk');
  if (!config.cookieSecure) warnings.push('cookieNotSecure');
  if (!extra.ai.provider) warnings.push('noAi');
  return {
    now,
    server: { node: process.version, platform: process.platform, uptime: Math.round((now - extra.startedAt) / 1000), rss: mem.rss, heapUsed: mem.heapUsed, pid: process.pid },
    database: { file: memoryDb ? ':memory:' : config.dbFile, size: memoryDb ? 0 : size(config.dbFile), wal: memoryDb ? 0 : size(`${config.dbFile}-wal`), migrations, rows },
    backups: { count: backups.length, last: lastBackup, dir: config.backupDir },
    sessions: { active: activeSessions },
    disk,
    ai: extra.ai,
    config: { port: config.port, cookieSecure: config.cookieSecure, trustProxy: config.trustProxy, allowedOrigins: config.allowedOrigins },
    warnings,
  };
}

/** PRAGMA integrity_check (slower; on demand). */
export const integrityCheck = (db: Db) => (db.prepare('PRAGMA integrity_check').all() as Array<{ integrity_check: string }>).map((r) => r.integrity_check);
