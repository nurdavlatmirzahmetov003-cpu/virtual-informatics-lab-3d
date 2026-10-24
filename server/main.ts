/**
 * The lab server (V2-8): REST API with accounts, roles and progress sync on
 * a local SQLite file, plus the AI assistant routes. In production
 * (V2-12, DEPLOY.md) it also serves the built site: STATIC_DIR=dist.
 *
 *   npm run server            → http://127.0.0.1:8787 (Vite proxies /api to it)
 *   npm run server:create-admin
 *   npm run serve:prod        → the built site and the API on one port
 */
import { createServer } from 'node:http';
import { handleAi, aiStatus } from './ai';
import { createBit } from './bit';
import { createBitVoice } from './bitVoice';
import { createApp } from './app';
import { openDb, migrate } from './db';
import { loadEnv, serverConfig } from './env';
import { purgeExpired } from './auth/sessions';
import { countAdmins } from './users';
import { securityHeaders, staticSite } from './static';

loadEnv();
// `--site`: serve the built site too (npm run serve:prod)
if (process.argv.includes('--site')) process.env.STATIC_DIR ??= 'dist';
const config = serverConfig();
const db = openDb(config.dbFile);
const applied = migrate(db);
purgeExpired(db);

const security = { secure: config.cookieSecure, origins: config.allowedOrigins };
const site = config.staticDir ? staticSite(config.staticDir, security) : null;
// Bit, the voice assistant: Gemini behind this server (the key never reaches the browser)
// …and its voice: Gemini speech synthesis and recognition (0.37)
const bitVoice = createBitVoice({ allowedOrigins: config.allowedOrigins });
const bit = createBit({ allowedOrigins: config.allowedOrigins, voice: { tts: bitVoice.configured, stt: bitVoice.configured } });
const app = createApp({ db, config, extra: site ? [bitVoice, bit, handleAi, site] : [bitVoice, bit, handleAi], aiStatus, headers: securityHeaders(security) });
const server = createServer((req, res) => void app(req, res));
// live games (V2-11b, /api/live/ws) and class events (V2-12, /api/events/ws) speak WebSocket
server.on('upgrade', app.upgrade);

server.listen(config.port, config.host, () => {
  const ai = aiStatus();
  console.log(`[server] http://${config.host}:${config.port}${site ? ` (site: ${config.staticDir})` : ''}`);
  console.log(`[server] database: ${config.dbFile}${applied.length ? ` (migrated: ${applied.join(', ')})` : ''}`);
  console.log(`[server] AI provider: ${ai.provider ?? 'none (local fallback only)'}`);
  console.log(`[server] Bit assistant: ${bit.configured ? `Gemini ${bit.model}, voice ${bitVoice.ttsModels.join(' → ')} (${bitVoice.voice})` : 'built-in answers only (set GEMINI_API_KEY in .env)'}`);
  if (countAdmins(db) === 0) console.log('[server] no admin yet — run: npm run server:create-admin');
});

// tidy up expired sessions hourly
setInterval(() => purgeExpired(db), 3600_000).unref();
