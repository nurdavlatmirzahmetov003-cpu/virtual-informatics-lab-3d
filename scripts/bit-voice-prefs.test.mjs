/**
 * V4 §10: Bit's voice settings — the voice, the speaking style, the speed and
 * emotion. The 0.37 recordings keep their cache keys; every voice, style and
 * emotion setting is its own recording; only auditioned voices are offered;
 * the quota running out still plays what is recorded; a student's choice
 * lives on the server.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createBitVoice, ttsKey, ttsPrompt } from '../server/bitVoice.ts';
import { BIT_VOICES, DEFAULT_VOICE_PREFS, VOICE_PREVIEW, normalizeVoicePrefs } from '../src/services/bit/voicePrefs.ts';
import { sentencesOf, wavOf } from '../src/services/bit/voice.ts';

const sha = (s) => createHash('sha1').update(s).digest('hex');

/** A fake Gemini that streams one PCM piece and records what it was asked. */
function fakeGemini() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    const piece = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from([1, 0, 2, 0]).toString('base64') } }] } }] })}\n\n`;
    return new Response(piece, { status: 200 });
  };
  return { fetchImpl, calls };
}

async function serve(handler) {
  const server = createServer(async (req, res) => {
    if (!(await handler(req, res))) {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

test('the 0.37 recordings keep their cache keys; each voice, style and emotion setting is its own recording', () => {
  const calm = 'Процессор — компьютердің миы.';
  const joy = 'Жарайсың, бәрі дұрыс!';
  // the default (teacher, emotion on) is exactly the old key
  assert.equal(ttsKey('Kore', 'kk', calm), sha(`Kore|kk|${calm}`));
  assert.equal(ttsKey('Kore', 'kk', joy), sha(`Kore|kk|joyful|${joy}`));
  assert.equal(ttsKey('Kore', 'kk', joy, { style: DEFAULT_VOICE_PREFS.style, emotion: true }), ttsKey('Kore', 'kk', joy));
  const keys = new Set([ttsKey('Kore', 'kk', joy), ttsKey('Charon', 'kk', joy), ttsKey('Kore', 'kk', joy, { style: 'friend' }), ttsKey('Kore', 'kk', joy, { style: 'energetic' }), ttsKey('Kore', 'kk', joy, { emotion: false })]);
  assert.equal(keys.size, 5);
  // emotion off says a joyful sentence the calm way, so it shares the calm recording
  assert.equal(ttsKey('Kore', 'kk', joy, { emotion: false }), sha(`Kore|kk|${joy}`));
  // the teacher's prompts are the 0.37 ones word for word
  assert.equal(ttsPrompt('kk', calm), `Say in a calm, clear and friendly voice, like a kind teacher explaining, clearly in Kazakh: ${calm}`);
  assert.equal(ttsPrompt('kk', joy), `Say in a joyful, excited and warm voice, like a kind teacher proudly praising a student, clearly in Kazakh: ${joy}`);
  assert.match(ttsPrompt('kk', calm, { style: 'friend' }), /cheerful school friend/);
  assert.match(ttsPrompt('kk', calm, { style: 'energetic' }), /energetic/);
  assert.match(ttsPrompt('kk', joy, { emotion: false }), /^Say in a calm, clear/);
});

test('a saved choice is cleaned; only auditioned voices are offered, one of each kind', () => {
  assert.deepEqual(normalizeVoicePrefs(null), DEFAULT_VOICE_PREFS);
  assert.deepEqual(normalizeVoicePrefs({ voice: 'Charon', style: 'friend', speed: 1.15, emotion: false }), { voice: 'Charon', style: 'friend', speed: 1.15, emotion: false });
  assert.deepEqual(normalizeVoicePrefs({ voice: 'Iapetus', style: 'rapper', speed: 3, emotion: 'yes' }), DEFAULT_VOICE_PREFS);
  for (const kind of ['female', 'male', 'neutral']) assert.ok(BIT_VOICES.some((v) => v.kind === kind), `a ${kind} voice`);
  // every offered voice read the Kazakh preview word for word in the audition
  const audition = JSON.parse(readFileSync('docs/v4-section10/audition.json', 'utf8'));
  assert.equal(audition.text, VOICE_PREVIEW.kk.hello);
  for (const v of BIT_VOICES) {
    const row = audition.results.find((r) => r.voice === v.id);
    assert.ok(row && row.accuracy === 1, `${v.id} passed the audition`);
  }
  // a preview is one sentence: one request and one cache entry per voice and style
  for (const lang of ['kk', 'ru', 'en']) for (const s of Object.values(VOICE_PREVIEW[lang])) assert.equal(sentencesOf(s).length, 1, s);
});

test('another speed plays the same recording as a WAV (the audio element keeps the pitch)', async () => {
  const wav = new Uint8Array(await wavOf([new Float32Array([0, 0.5, -0.5])]).arrayBuffer());
  assert.equal(new TextDecoder().decode(wav.slice(0, 4)), 'RIFF');
  assert.equal(wav.length, 44 + 6);
  const v = new DataView(wav.buffer);
  assert.equal(v.getUint32(24, true), 24000);
  assert.equal(v.getInt16(46, true), Math.trunc(0.5 * 0x7fff));
});

test('the server speaks in the asked voice and style; a voice that is not offered gets the default', async () => {
  const gem = fakeGemini();
  const s = await serve(createBitVoice({ apiKey: 'k', fetchImpl: gem.fetchImpl, cacheDir: null }));
  try {
    const say = (extra) => fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: 'Жарайсың, бәрі дұрыс!', lang: 'kk', ...extra }) });
    const voiceOf = () => gem.calls.at(-1).body.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName;
    await (await say({ voice: 'Charon', style: 'friend' })).arrayBuffer();
    assert.equal(voiceOf(), 'Charon');
    assert.match(gem.calls.at(-1).body.contents[0].parts[0].text, /cheerful school friend proudly praising/);
    const before = gem.calls.length;
    assert.equal((await say({ voice: 'Charon', style: 'friend' })).headers.get('x-bit-cache'), 'hit');
    assert.equal(gem.calls.length, before, 'the same voice and style come from the cache');
    await (await say({ voice: 'Iapetus' })).arrayBuffer();
    assert.equal(voiceOf(), 'Kore', 'not an offered voice');
    await (await say({ voice: 'Charon', emotion: false })).arrayBuffer();
    assert.match(gem.calls.at(-1).body.contents[0].parts[0].text, /^Say in a calm/);
  } finally {
    await s.close();
  }
});

test('quota used up: recorded sentences still play, a new one gets 503 «quota» (the browser voice reads it)', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3600s' }] } }), { status: 429 });
  const dir = mkdtempSync(join(tmpdir(), 'bit-quota-'));
  try {
    writeFileSync(join(dir, `${ttsKey('Leda', 'kk', 'Сәлем!')}.pcm.gz`), gzipSync(Buffer.from([5, 0, 6, 0])));
    const voice = createBitVoice({ apiKey: 'k', fetchImpl, ttsModels: ['m1', 'm2'], cacheDir: dir });
    const s = await serve(voice);
    try {
      const say = (text) => fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text, lang: 'kk', voice: 'Leda' }) });
      const fresh = await say('Жаңа сөйлем.');
      assert.equal(fresh.status, 503);
      assert.deepEqual(await fresh.json(), { error: 'quota' });
      assert.equal(voice.ttsAvailable(), false);
      const cached = await say('Сәлем!');
      assert.equal(cached.status, 200);
      assert.deepEqual([...new Uint8Array(await cached.arrayBuffer())], [5, 0, 6, 0]);
    } finally {
      await s.close();
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a student's voice settings live on the server; a guest has none there", async () => {
  const { openDb, migrate } = await import('../server/db.ts');
  const { createApp } = await import('../server/app.ts');
  const { serverConfig } = await import('../server/env.ts');
  const { createUser } = await import('../server/users.ts');
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp({ db, config: { ...serverConfig({}), dbFile: ':memory:' }, now: () => Date.now() });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const password = `T3st-voice-${Math.random().toString(36).slice(2, 10)}`;
    await createUser(db, { login: 'voicefan', displayName: 'Voice Fan', role: 'student', password });
    const login = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login: 'voicefan', password }) });
    const { csrfToken } = await login.json();
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const call = (method = 'GET', body, csrf = csrfToken) =>
      fetch(`${base}/api/bit/voice/me`, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie, 'x-csrf-token': csrf }, body: body ? JSON.stringify(body) : undefined });
    assert.deepEqual(await (await call()).json(), { prefs: null }, 'never saved: the browser keeps its own');
    assert.equal((await call('PUT', { prefs: { voice: 'Puck', style: 'energetic', speed: 0.85, emotion: false, autoRead: false } })).status, 200);
    assert.deepEqual((await (await call()).json()).prefs, { voice: 'Puck', style: 'energetic', speed: 0.85, emotion: false, autoRead: false });
    // nonsense is cleaned, not stored
    await call('PUT', { prefs: { voice: '<script>', speed: 9 } });
    assert.deepEqual((await (await call()).json()).prefs, { ...DEFAULT_VOICE_PREFS, autoRead: true });
    assert.equal((await call('PUT', { prefs: {} }, 'wrong')).status, 403, 'CSRF');
    assert.equal((await fetch(`${base}/api/bit/voice/me`)).status, 401, 'a guest');
  } finally {
    await new Promise((r) => server.close(r));
  }
});
