/**
 * The lab server (V2-8): REST API with accounts, roles and progress sync on
 * a local SQLite file, plus the AI assistant routes. Local only for now —
 * hosting comes after V2-12.
 *
 *   npm run server            → http://localhost:8787 (Vite proxies /api to it)
 *   npm run server:create-admin
 */
import { createServer } from 'node:http';
import { handleAi, aiStatus } from './ai';
import { createApp } from './app';
import { openDb, migrate } from './db';
import { loadEnv, serverConfig } from './env';
import { purgeExpired } from './auth/sessions';
import { countAdmins } from './users';

loadEnv();
const config = serverConfig();
const db = openDb(config.dbFile);
const applied = migrate(db);
purgeExpired(db);

const app = createApp({ db, config, extra: [handleAi] });
const server = createServer((req, res) => void app(req, res));

server.listen(config.port, () => {
  const ai = aiStatus();
  console.log(`[server] http://localhost:${config.port}`);
  console.log(`[server] database: ${config.dbFile}${applied.length ? ` (migrated: ${applied.join(', ')})` : ''}`);
  console.log(`[server] AI provider: ${ai.provider ?? 'none (local fallback only)'}`);
  if (countAdmins(db) === 0) console.log('[server] no admin yet — run: npm run server:create-admin');
});

// tidy up expired sessions hourly
setInterval(() => purgeExpired(db), 3600_000).unref();
