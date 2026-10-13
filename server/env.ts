/**
 * Server configuration from `.env` / the environment. Secrets live only
 * here, on the server — never in VITE_ variables (those reach the browser).
 */
import { existsSync, readFileSync } from 'node:fs';
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
}

export function serverConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    port: Number(env.SERVER_PORT ?? env.AI_PORT ?? 8787),
    dbFile: env.DB_FILE ?? fileURLToPath(new URL('../data/lab.db', import.meta.url)),
    sessionHours: Math.max(1, Number(env.SESSION_TTL_HOURS ?? 12)),
    cookieSecure: env.COOKIE_SECURE === 'true',
    allowedOrigins: (env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:4173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
