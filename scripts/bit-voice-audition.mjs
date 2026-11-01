/**
 * V4 §10: which Gemini voices read Kazakh well enough to offer. Each candidate
 * says the Kazakh preview sentence; Gemini's recogniser writes it back; a
 * voice is kept when at least 90 % of the words come back right. The median
 * pitch of each recording says how it sounds (female, male or in between).
 * The recordings land in the voice cache, so every kept voice's preview then
 * plays instantly and costs no quota.
 *
 *   npm run bit:voice-audition            the default candidates
 *   npm run bit:voice-audition -- Kore Leda
 *
 * Writes docs/v4-section10/audition.json. Uses ~1 speech and 1 recognition
 * request per voice (free tier: ~10 speech requests a day per model).
 */
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadEnv } from '../server/env.ts';
import { createBitVoice, TTS_RATE } from '../server/bitVoice.ts';
import { VOICE_PREVIEW } from '../src/services/bit/voicePrefs.ts';
import { normalize } from '../src/services/bit/text.ts';

loadEnv();
const CANDIDATES = ['Kore', 'Leda', 'Aoede', 'Sulafat', 'Charon', 'Puck', 'Orus', 'Iapetus', 'Achird', 'Umbriel'];
const voices = process.argv.slice(2).length ? process.argv.slice(2) : CANDIDATES;
const text = VOICE_PREVIEW.kk.hello;

const bit = createBitVoice({ voices });
if (!bit.configured) {
  console.error('GEMINI_API_KEY is not set in .env');
  process.exit(1);
}
const server = createServer(async (req, res) => {
  if (!(await bit(req, res))) {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

function wav(pcm) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(TTS_RATE, 24);
  h.writeUInt32LE(TTS_RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Median fundamental frequency (Hz) of the voiced 40 ms frames, by autocorrelation. */
function medianPitch(pcm) {
  const n = Math.floor(pcm.length / 2);
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = pcm.readInt16LE(i * 2) / 32768;
  const frame = Math.round(TTS_RATE * 0.04);
  const minLag = Math.round(TTS_RATE / 400);
  const maxLag = Math.round(TTS_RATE / 70);
  const found = [];
  for (let s = 0; s + frame + maxLag < n; s += frame) {
    let energy = 0;
    for (let i = 0; i < frame; i++) energy += x[s + i] * x[s + i];
    if (energy / frame < 1e-3) continue;
    let best = 0;
    let lag = 0;
    for (let l = minLag; l <= maxLag; l++) {
      let c = 0;
      for (let i = 0; i < frame; i++) c += x[s + i] * x[s + i + l];
      if (c > best) {
        best = c;
        lag = l;
      }
    }
    if (lag && best / energy > 0.5) found.push(TTS_RATE / lag);
  }
  found.sort((a, b) => a - b);
  return found.length ? Math.round(found[Math.floor(found.length / 2)]) : null;
}

const words = (s) => normalize(s).split(' ').filter(Boolean);
function accuracy(said, heard) {
  const pool = words(heard);
  const ref = words(said);
  let hit = 0;
  for (const w of ref) {
    const i = pool.indexOf(w);
    if (i >= 0) {
      hit++;
      pool.splice(i, 1);
    }
  }
  return ref.length ? hit / ref.length : 0;
}

const results = [];
for (const voice of voices) {
  const r = await fetch(`${base}/api/ai/bit/tts`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, lang: 'kk', voice }) });
  if (!r.ok) {
    const why = (await r.json().catch(() => ({}))).error ?? r.status;
    console.log(`${voice}: no recording (${why})`);
    results.push({ voice, status: String(why) });
    if (why === 'quota') break;
    continue;
  }
  const pcm = Buffer.from(await r.arrayBuffer());
  const s = await fetch(`${base}/api/ai/bit/stt?lang=kk`, { method: 'POST', headers: { 'content-type': 'audio/wav' }, body: wav(pcm) });
  const heard = s.ok ? (await s.json()).text : '';
  const acc = accuracy(text, heard);
  const pitch = medianPitch(pcm);
  const row = { voice, status: s.ok ? 'ok' : `stt-${s.status}`, cache: r.headers.get('x-bit-cache') ?? 'new', seconds: +(pcm.length / 2 / TTS_RATE).toFixed(1), pitchHz: pitch, accuracy: +acc.toFixed(2), heard, keep: s.ok && acc >= 0.9 };
  results.push(row);
  console.log(`${voice}: ${row.accuracy * 100}% · ${pitch ?? '?'} Hz · ${row.seconds} s · «${heard}»`);
}
server.close();
mkdirSync('docs/v4-section10', { recursive: true });
writeFileSync('docs/v4-section10/audition.json', JSON.stringify({ text, at: new Date().toISOString(), results }, null, 2) + '\n');
console.log('→ docs/v4-section10/audition.json');
