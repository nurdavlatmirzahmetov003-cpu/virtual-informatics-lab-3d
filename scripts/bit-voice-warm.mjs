/**
 * Pre-records Bit's built-in texts (60+ answers, the site tour, the lessons,
 * the stock phrases) in Gemini's voice into the server's voice cache
 * (data/voice-cache), so they start instantly and never spend quota again.
 * Cuts the texts exactly as the browser does (speechChunks), so the cache hits.
 *
 *   npm run bit:voice-warm            all three languages
 *   npm run bit:voice-warm -- kk      one language
 *
 * Stops when every speech model's quota is used up (free tier: ~10 requests a
 * day per model); run it again later — what is cached is skipped.
 */
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../server/env.ts';
import { createBitVoice, ttsKey, DEFAULT_TTS_VOICE } from '../server/bitVoice.ts';
import { sentencesOf } from '../src/services/bit/voice.ts';
import { speechChunks } from '../src/services/bit/text.ts';
import { BRAND } from '../src/config/brand.ts';

loadEnv();
const langs = process.argv.slice(2).filter((a) => ['kk', 'ru', 'en'].includes(a));
const LANGS = langs.length ? langs : ['kk', 'ru', 'en'];
const fill = (s) => s.replace(/\{brand\}/g, BRAND.name);

/** Every text Bit says without the model, per language. */
async function texts(lang) {
  const c = (await import(`../src/services/bit/content/${lang}.ts`)).default;
  const out = [
    ...Object.values(c.faq).map((f) => f.a),
    c.tourIntro,
    ...Object.values(c.tour),
    ...Object.values(c.lessons).flat(),
    ...Object.values(c.say).filter((v) => typeof v === 'string' && !/\{(?!brand\})/.test(v)),
  ];
  return out.map(fill);
}

const voice = createBitVoice();
if (!voice.configured) {
  console.error('GEMINI_API_KEY is not set in .env');
  process.exit(1);
}
const cacheDir = process.env.BIT_VOICE_CACHE_DIR?.trim() || join(process.cwd(), 'data', 'voice-cache');
const voiceName = process.env.GEMINI_TTS_VOICE?.trim() || DEFAULT_TTS_VOICE;
const server = createServer(async (req, res) => {
  if (!(await voice(req, res))) {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

let made = 0;
let had = 0;
let stopped = false;
for (const lang of LANGS) {
  const pieces = [...new Set((await texts(lang)).flatMap((t) => speechChunks(sentencesOf(t))))];
  for (const text of pieces) {
    if (existsSync(join(cacheDir, `${ttsKey(voiceName, lang, text)}.pcm.gz`))) {
      had++;
      continue;
    }
    const r = await fetch(`${base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text, lang }) });
    if (r.status === 503) {
      stopped = true;
      break;
    }
    await r.arrayBuffer();
    if (r.ok) made++;
    process.stdout.write(`\r${lang}: ${made} recorded, ${had} already there`);
  }
  if (stopped) break;
}
// the cache files are written in the background: give them a moment
await new Promise((r) => setTimeout(r, 1500));
server.close();
console.log(`\n${made} pieces recorded, ${had} were already cached.${stopped ? ' Stopped: every speech model has used its quota — run again later (or enable billing in Google AI Studio).' : ' Done.'}`);
