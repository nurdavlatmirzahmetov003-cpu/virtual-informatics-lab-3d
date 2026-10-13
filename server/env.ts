/**
 * Server configuration from `.env` / the environment. Secrets live only
 * here, on the server — never in VITE_ variables (those reach the browser).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadEnv(file = fileURLToPath(new URL('../.env', import.meta.url))) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trimStart().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export interface ServerConfig {
  port: number;
  /** SQLite file (created on first start). */
  dbFile: string;
  sessionHours: number;
  /** Send cookies with `Secure` (behind HTTPS in production). */
  cookieSecure: boolean;
  /** Origins allowed to send state-changing requests (CSRF defence in depth). */
  allowedOrigins: string[];
  /** Folder of database backups (V2-10). */
  backupDir: string;
  /**
   * Whose X-Forwarded-For to believe: 'loopback' (default — the Vite proxy
   * or a reverse proxy on this machine), 'none', or 'all' (behind a trusted
   * proxy only). Without it every request behind a proxy has one IP.
   */
  trustProxy: 'loopback' | 'none' | 'all';
}

export function serverConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const dbFile = env.DB_FILE ?? fileURLToPath(new URL('../data/lab.db', import.meta.url));
  const trust = env.TRUST_PROXY;
  return {
    port: Number(env.SERVER_PORT ?? env.AI_PORT ?? 8787),
    dbFile,
    backupDir: env.BACKUP_DIR ?? (dbFile === ':memory:' ? fileURLToPath(new URL('../data/backups', import.meta.url)) : join(dirname(dbFile), 'backups')),
    trustProxy: trust === 'none' || trust === 'all' ? trust : 'loopback',
    sessionHours: Math.max(1, Number(env.SESSION_TTL_HOURS ?? 12)),
    cookieSecure: env.COOKIE_SECURE === 'true',
    allowedOrigins: (env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
