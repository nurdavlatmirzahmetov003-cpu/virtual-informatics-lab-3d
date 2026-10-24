/**
 * Bit by voice (0.37): what speech recognisers actually write for Kazakh
 * (no punctuation, lower case, Russian look-alike letters, amounts in words,
 * the wake word misheard) must still reach the right intent; and the server
 * voice routes (TTS / STT through Gemini) behave.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { understand } from '../src/services/bit/intent.ts';
import { wordsToDigits } from '../src/services/bit/numbers.ts';
import { fold, stripWakeWord } from '../src/services/bit/text.ts';
import { createBitVoice, sttPrompt, audioOfEvent } from '../server/bitVoice.ts';

/** [what the recogniser wrote, expected kind, expected target (section / lesson / faq id)] */
const KAZAKH_UTTERANCES = [
  // the site tour
  ['бит сайтты көрсет', 'tour'],
  ['бит сайтты корсет', 'tour'],
  ['біт сайтты көрсетші', 'tour'],
  ['сайт бойынша саяхат жасайықшы', 'tour'],
  ['маған сайтты таныстыршы', 'tour'],
  // lessons
  ['бит логика сабағын баста', 'lesson', 'logic'],
  ['логика сабагын баста', 'lesson', 'logic'],
  ['желілер сабағын бастайықшы', 'lesson', 'network'],
  ['желилер сабагын бастайык', 'lesson', 'network'],
  ['алгоритм сабағын қадам қадаммен түсіндір', 'lesson', 'algorithms'],
  ['компьютер жинау сабағын бастайық', 'lesson', 'assembly'],
  ['анатомия сабағын баста', 'lesson', 'explorer'],
  ['тәжірибелер сабағын баста', 'lesson', 'experiments'],
  // opening sections
  ['бит желілер зертханасын аш', 'navigate', 'network'],
  ['желилер зертханасын ашшы', 'navigate', 'network'],
  ['бид ойындарды аш', 'navigate', 'games'],
  ['ойындар бөліміне апар', 'navigate', 'games'],
  ['сертификатты ашып берші', 'navigate', 'certificate'],
  ['нәтижелерімді көрсет', 'navigate', 'progress'],
  ['setup studio ашшы', 'navigate', 'studio'],
  ['анатомия', 'navigate', 'explorer'],
  ['пікір қалдыру бетін аш', 'navigate', 'feedback'],
  // a PC for a budget — amounts in words and digits
  ['бит бес жүз мың теңгеге ойын компьютерін жинап берші', 'build'],
  ['бес жүз мыңға компьютер жина', 'build'],
  ['төрт жүз елу мың теңгеге компьютер жинап бер', 'build'],
  ['500000 теңгеге сетап жина', 'build'],
  ['бир миллион тенгеге компьютер курастыр', 'build'],
  ['жүз мың теңгеге компьютер құрастырып берші', 'build'],
  // questions with built-in answers
  ['бит жедел жад деген не', 'faq', 'ram'],
  ['жедел жат деген не', 'faq', 'ram'],
  ['процессор деген не', 'faq', 'cpu'],
  ['видеокарта не істейді', 'faq', 'gpu'],
  ['ip мекенжайы деген не', 'faq', 'ip'],
  ['мықты құпия сөз қандай болады', 'faq', 'password'],
  ['екілік санау жүйесі деген не', 'faq', 'binary'],
  ['алгоритм деген не', 'faq', 'algorithm'],
  ['сен кімсің', 'faq', 'who'],
  ['сен не істей аласың', 'faq', 'help'],
  // stop / next / greeting
  ['тоқта', 'stop'],
  ['токта', 'stop'],
  ['әрі қарай', 'next'],
  ['келеси', 'next'],
  ['сәлем бит', 'greet'],
  ['бит', 'greet'],
];

test(`Kazakh voice commands: ${KAZAKH_UTTERANCES.length} recogniser-style phrases reach the right intent`, () => {
  assert.ok(KAZAKH_UTTERANCES.length >= 40);
  const wrong = [];
  for (const [text, kind, target] of KAZAKH_UTTERANCES) {
    // offline: built-in answers only; with the model: the same commands
    for (const modelAvailable of [false, true]) {
      const i = understand(text, { modelAvailable });
      const got = i.lesson ?? i.section ?? i.id;
      if (i.kind !== kind || (target && got !== target)) wrong.push(`${text} [model ${modelAvailable}] → ${i.kind} ${got ?? ''} (want ${kind} ${target ?? ''})`);
    }
  }
  assert.deepEqual(wrong, []);
});

test('the build intent passes the amount on in digits', () => {
  const i = understand('бит бес жүз мыңға ойын компьютерін жина');
  assert.equal(i.kind, 'build');
  assert.match(i.message, /500000/);
});

test('amounts in words → digits (kk / ru / en); ordinary words stay', () => {
  const cases = [
    ['бес жүз мың теңгеге', '500000 теңгеге'],
    ['төрт жүз елу мың теңге', '450000 теңге'],
    ['бір миллион', '1000000'],
    ['бес жүз мыңға компьютер', '500000 компьютер'],
    ['четыреста пятьдесят тысяч тенге', '450000 тенге'],
    ['за полмиллиона', 'за 500000'],
    ['four hundred and fifty thousand tenge', '450000 tenge'],
    ['half a million', '500000'],
    ['нөл мен бір деген не', 'нөл мен бір деген не'],
    ['он жақтағы панель', 'он жақтағы панель'],
    ['бір нәрсе айтшы', 'бір нәрсе айтшы'],
  ];
  for (const [input, want] of cases) assert.equal(wordsToDigits(input), want, input);
});

test('wake word variants and letter folding', () => {
  for (const w of ['Бит, ', 'бит ', 'Біт ', 'бид, ', 'Hey Bit ', 'бит бит ', 'Сәлем, Бит! ']) assert.equal(stripWakeWord(`${w}процессор деген не`), 'процессор деген не', w);
  assert.equal(stripWakeWord('битке рахмет'), 'битке рахмет');
  assert.equal(fold('қазақша әріптер ұзын үй һәм ғ ң ө і'), 'казакша ариптер узын уй хам г н о и');
});

test('the recogniser is told the site language and to keep numbers in words', () => {
  const kk = sttPrompt('kk');
  assert.match(kk, /expected language is Kazakh/);
  assert.match(kk, /ә ғ қ ң ө ұ ү һ і/);
  assert.match(kk, /«Бит»/);
  assert.match(sttPrompt('ru'), /expected language is Russian/);
  assert.match(sttPrompt('en'), /expected language is English/);
});

test('Gemini audio events: base64 PCM pieces, other lines ignored', () => {
  const pcm = Buffer.from([1, 2, 3, 4]);
  const line = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/l16; rate=24000', data: pcm.toString('base64') } }] } }] })}`;
  assert.deepEqual(audioOfEvent(line), [pcm]);
  assert.deepEqual(audioOfEvent(': keep-alive'), []);
  assert.deepEqual(audioOfEvent('data: {broken'), []);
});

/** A fake Gemini: TTS streams two PCM pieces; STT answers with a transcript. */
function fakeGemini() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    if (url.includes('streamGenerateContent')) {
      const enc = new TextEncoder();
      const piece = (bytes) => `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/l16; rate=24000', data: Buffer.from(bytes).toString('base64') } }] } }] })}\r\n\r\n`;
      return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode(piece([1, 0, 2, 0]))); c.enqueue(enc.encode(piece([3, 0]))); c.close(); } }), { status: 200 });
    }
    return Response.json({ candidates: [{ content: { parts: [{ text: '«Бит бес жүз мың теңгеге компьютер жина»' }] } }] });
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

test('server TTS: streams PCM, caches a sentence, key in a header; STT: transcript in the site language', async () => {
  const gem = fakeGemini();
  const key = `k-${Math.random().toString(36).slice(2)}`;
  const voice = createBitVoice({ apiKey: key, fetchImpl: gem.fetchImpl, allowedOrigins: ['http://localhost:5173'], cacheDir: null });
  const s = await serve(voice);
  try {
    const say = () => fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: 'Сәлем, мен Битпін.', lang: 'kk' }) });
    const r1 = await say();
    assert.equal(r1.status, 200);
    assert.match(r1.headers.get('content-type'), /audio\/L16; rate=24000/);
    assert.deepEqual([...new Uint8Array(await r1.arrayBuffer())], [1, 0, 2, 0, 3, 0]);
    const r2 = await say();
    assert.equal(r2.headers.get('x-bit-cache'), 'hit');
    assert.deepEqual([...new Uint8Array(await r2.arrayBuffer())], [1, 0, 2, 0, 3, 0]);
    assert.equal(gem.calls.length, 1, 'the second time comes from the cache');
    assert.ok(!gem.calls[0].url.includes(key) && gem.calls[0].headers['x-goog-api-key'] === key);
    assert.equal(gem.calls[0].body.generationConfig.responseModalities[0], 'AUDIO');

    assert.equal((await fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: '', lang: 'kk' }) })).status, 400);
    assert.equal((await fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', headers: { origin: 'https://evil.example' }, body: JSON.stringify({ text: 'x', lang: 'kk' }) })).status, 403);

    const audio = new Uint8Array(4000);
    const st = await fetch(`${s.base}/api/ai/bit/stt?lang=kk`, { method: 'POST', headers: { 'content-type': 'audio/webm;codecs=opus' }, body: audio });
    assert.deepEqual(await st.json(), { text: 'Бит бес жүз мың теңгеге компьютер жина' }, 'quotes stripped');
    const sttCall = gem.calls.at(-1);
    assert.equal(sttCall.body.contents[0].parts[0].inlineData.mimeType, 'audio/webm');
    assert.match(sttCall.body.contents[0].parts[1].text, /Kazakh/);
    assert.equal((await fetch(`${s.base}/api/ai/bit/stt?lang=de`, { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: audio })).status, 400);
    assert.equal((await fetch(`${s.base}/api/ai/bit/stt?lang=kk`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'hi' })).status, 415);
  } finally {
    await s.close();
  }
});

test('server voice without a key answers 503 (the browser falls back to its own voice)', async () => {
  const s = await serve(createBitVoice({ apiKey: '', cacheDir: null }));
  try {
    assert.equal((await fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: 'x', lang: 'kk' }) })).status, 503);
  } finally {
    await s.close();
  }
});

test('speech pieces: the first sentence alone, then up to 280 characters each', async () => {
  const { speechChunks } = await import('../src/services/bit/text.ts');
  const s = (n, len) => `${String(n).repeat(len - 1)}.`;
  assert.deepEqual(speechChunks(['A.', 'B.', 'C.']), ['A.', 'B. C.']);
  const long = [s(1, 50), s(2, 200), s(3, 100), s(4, 20)];
  assert.deepEqual(speechChunks(long).map((c) => c.length), [50, 200, 121]);
  assert.deepEqual(speechChunks([]), []);
});

test('quota: a 429 rests that model (Google retry time), the next model speaks; all used up → 503 quota', async () => {
  const { quotaPause } = await import('../server/bitVoice.ts');
  const day = JSON.stringify({ error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '27469s' }] } });
  assert.equal(quotaPause(day), 27469_000);
  assert.equal(quotaPause('nope'), 60_000);

  const used = new Set(['m1']);
  const calls = [];
  const fetchImpl = async (url) => {
    const model = /models\/([^:]+):/.exec(url)[1];
    calls.push(model);
    if (used.has(model)) return new Response(day, { status: 429 });
    const piece = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from([7, 0]).toString('base64') } }] } }] })}\n\n`;
    return new Response(piece, { status: 200 });
  };
  let t = 0;
  const s = await serve(createBitVoice({ apiKey: 'k', fetchImpl, ttsModels: ['m1', 'm2'], cacheDir: null, now: () => t }));
  try {
    const say = (text) => fetch(`${s.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text, lang: 'kk' }) });
    const r = await say('Бірінші.');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('x-bit-model'), 'm2');
    assert.deepEqual(calls, ['m1', 'm2']);
    await say('Екінші.');
    assert.deepEqual(calls, ['m1', 'm2', 'm2'], 'the used-up model is not asked again');
    used.add('m2');
    const quota = await say('Үшінші.');
    assert.equal(quota.status, 503);
    assert.equal((await quota.json()).error, 'quota');
    t += 27470_000;
    used.clear();
    assert.equal((await say('Төртінші.')).status, 200, 'after the retry time the first model is back');
  } finally {
    await s.close();
  }
});

test('the disk cache keeps a sentence across server restarts', async () => {
  const { mkdtempSync, rmSync, readdirSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const dir = mkdtempSync(join(tmpdir(), 'bit-voice-'));
  const gem = fakeGemini();
  try {
    const first = await serve(createBitVoice({ apiKey: 'k', fetchImpl: gem.fetchImpl, cacheDir: dir }));
    await (await fetch(`${first.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: 'Сақта.', lang: 'kk' }) })).arrayBuffer();
    await first.close();
    await new Promise((r) => setTimeout(r, 150));
    assert.equal(readdirSync(dir).filter((f) => f.endsWith('.pcm.gz')).length, 1);
    const second = await serve(createBitVoice({ apiKey: 'k', fetchImpl: gem.fetchImpl, cacheDir: dir }));
    const r = await fetch(`${second.base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: 'Сақта.', lang: 'kk' }) });
    assert.equal(r.headers.get('x-bit-cache'), 'hit');
    assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [1, 0, 2, 0, 3, 0]);
    assert.equal(gem.calls.length, 1, 'Gemini was asked once in all');
    await second.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('server STT: a model out of quota rests, the next one listens', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url.match(/models\/([\w.-]+):/)[1]);
    if (url.includes('/main:')) return Response.json({ error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3600s' }] } }, { status: 429 });
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Процессор деген не' }] } }] });
  };
  const s = await serve(createBitVoice({ apiKey: 'k', fetchImpl, sttModel: 'main', sttFallbacks: ['lite'], cacheDir: null }));
  try {
    const hear = () => fetch(`${s.base}/api/ai/bit/stt?lang=kk`, { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: new Uint8Array(4000) }).then((r) => r.json());
    assert.deepEqual(await hear(), { text: 'Процессор деген не' });
    assert.deepEqual(await hear(), { text: 'Процессор деген не' });
    assert.deepEqual(calls, ['main', 'lite', 'lite'], 'the tired model is not asked again');
  } finally {
    await s.close();
  }
});
