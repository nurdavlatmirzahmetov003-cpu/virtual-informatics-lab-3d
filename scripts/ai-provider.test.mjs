/**
 * V4 §12.1: Bit's AI provider slot. Gemini by default; OpenAI only with
 * BIT_PROVIDER=openai and its key; Gemini takes over whenever OpenAI fails;
 * the key travels in a header only. Fake endpoints, no network.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createBit } from '../server/bit.ts';
import { createBitVoice } from '../server/bitVoice.ts';
import { describeProvider, selectProvider } from '../server/providers/index.ts';
import { openAiVoice, parseOpenAiEvent, toOpenAiMessages } from '../server/providers/openai.ts';
import { BIT_VOICES } from '../src/services/bit/voicePrefs.ts';

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

/** Fake OpenAI and Gemini; `fail` makes OpenAI answer that status. */
function fakeApis({ fail = 0 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, headers: init.headers, body: init.body });
    if (url.startsWith('https://api.openai.com')) {
      if (fail) return new Response('{}', { status: fail });
      if (url.endsWith('/chat/completions')) {
        const ev = (o) => `data: ${JSON.stringify(o)}\n\n`;
        return new Response(ev({ choices: [{ delta: { content: 'Сәлем! ' } }] }) + ev({ choices: [{ delta: { content: 'Мен OpenAI арқылы жауап беремін.' }, finish_reason: 'stop' }] }) + 'data: [DONE]\n\n', { status: 200 });
      }
      if (url.endsWith('/audio/speech')) return new Response(new Uint8Array([9, 0, 8, 0]), { status: 200 });
      if (url.endsWith('/audio/transcriptions')) return Response.json({ text: 'процессор деген не' });
    }
    if (url.includes('generativelanguage.googleapis.com')) {
      if (url.includes(':streamGenerateContent') && JSON.parse(init.body).generationConfig?.responseModalities) {
        const piece = `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from([1, 0, 2, 0]).toString('base64') } }] } }] })}\n\n`;
        return new Response(piece, { status: 200 });
      }
      if (url.includes(':streamGenerateContent')) return new Response(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Gemini жауап берді.' }] }, finishReason: 'STOP' }] })}\n\n`, { status: 200 });
      return Response.json({ candidates: [{ content: { parts: [{ text: 'жедел жад деген не' }] } }] });
    }
    throw new Error(`unexpected ${url}`);
  };
  return { fetchImpl, calls };
}

const ask = (base) => fetch(`${base}/api/ai/bit/ask`, { method: 'POST', body: JSON.stringify({ message: 'Процессор деген не?', lang: 'kk' }) });
const textOf = async (r) => (await r.text()).split('\n').filter(Boolean).map((l) => JSON.parse(l)).map((o) => o.d ?? '').join('');

test('Gemini is the default; BIT_PROVIDER=openai takes effect only with its key; a key is never in the description', () => {
  assert.equal(selectProvider({ GEMINI_API_KEY: 'g' }).primary, 'gemini');
  assert.equal(selectProvider({ GEMINI_API_KEY: 'g' }).reason, 'default');
  const noKey = selectProvider({ GEMINI_API_KEY: 'g', BIT_PROVIDER: 'openai' });
  assert.deepEqual([noKey.primary, noKey.reason], ['gemini', 'openai-without-key']);
  const both = selectProvider({ GEMINI_API_KEY: 'g', BIT_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test-123' });
  assert.deepEqual([both.primary, both.fallback, both.openai.chatModel], ['openai', 'gemini', 'gpt-4o-mini']);
  assert.equal(selectProvider({ BIT_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test-123' }).fallback, null);
  assert.equal(selectProvider({ BIT_PROVIDER: 'claude' }).reason, 'unknown-provider');
  // the setup assistant's model name is reused
  assert.equal(selectProvider({ BIT_PROVIDER: 'openai', OPENAI_API_KEY: 'k', OPENAI_MODEL: 'gpt-4.1-mini' }).openai.chatModel, 'gpt-4.1-mini');
  for (const p of [noKey, both]) assert.ok(!describeProvider(p).includes('sk-test'));
});

test('OpenAI stream and messages: text deltas, a content filter is a block, Bit’s turns become chat roles', () => {
  assert.deepEqual(parseOpenAiEvent('data: {"choices":[{"delta":{"content":"Сәлем"}}]}'), { text: 'Сәлем' });
  assert.deepEqual(parseOpenAiEvent('data: {"choices":[{"delta":{},"finish_reason":"content_filter"}]}'), { text: '', finish: 'SAFETY' });
  assert.deepEqual(parseOpenAiEvent('data: [DONE]'), { text: '', finish: 'STOP' });
  assert.equal(parseOpenAiEvent(': keep-alive'), null);
  assert.deepEqual(toOpenAiMessages('sys', [{ role: 'user', parts: [{ text: 'a' }] }, { role: 'model', parts: [{ text: 'b' }] }]), [
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'a' },
    { role: 'assistant', content: 'b' },
  ]);
  // every Bit voice has an OpenAI voice of the same kind
  for (const v of BIT_VOICES) assert.match(openAiVoice(v.id), v.kind === 'male' ? /^(onyx|echo)$/ : v.kind === 'neutral' ? /^alloy$/ : /^(nova|shimmer|coral)$/);
});

test('chat: OpenAI answers first (key in the Authorization header only); when it fails, Gemini answers', async () => {
  const env = { GEMINI_API_KEY: 'g-key', BIT_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-test-abc' };
  for (const fail of [0, 500, 429]) {
    const apis = fakeApis({ fail });
    const bit = createBit({ apiKey: 'g-key', fetchImpl: apis.fetchImpl, provider: selectProvider(env, apis.fetchImpl), retryDelayMs: 1 });
    const s = await serve(bit);
    try {
      const health = await (await fetch(`${s.base}/api/ai/bit/health`)).json();
      assert.equal(health.provider, 'openai');
      const r = await ask(s.base);
      assert.equal(r.status, 200);
      const said = await textOf(r);
      if (fail) assert.equal(said, 'Gemini жауап берді.', `OpenAI ${fail}: Gemini takes over`);
      else assert.equal(said, 'Сәлем! Мен OpenAI арқылы жауап беремін.');
      const oa = apis.calls.find((c) => c.url.startsWith('https://api.openai.com'));
      assert.equal(oa.headers.authorization, 'Bearer sk-test-abc');
      assert.ok(apis.calls.every((c) => !c.url.includes('sk-test') && !c.url.includes('g-key')));
      assert.equal(JSON.parse(oa.body).messages[0].role, 'system');
    } finally {
      await s.close();
    }
  }
});

test('without BIT_PROVIDER=openai OpenAI is never called', async () => {
  const apis = fakeApis();
  const bit = createBit({ apiKey: 'g-key', fetchImpl: apis.fetchImpl, provider: selectProvider({ GEMINI_API_KEY: 'g-key', OPENAI_API_KEY: 'sk-x' }, apis.fetchImpl) });
  const s = await serve(bit);
  try {
    assert.equal(await textOf(await ask(s.base)), 'Gemini жауап берді.');
    assert.ok(apis.calls.every((c) => !c.url.startsWith('https://api.openai.com')));
  } finally {
    await s.close();
  }
});

test('voice: OpenAI speaks (PCM, cached apart from Gemini) and listens; Gemini takes over when it fails', async () => {
  const env = { GEMINI_API_KEY: 'g', BIT_PROVIDER: 'openai', OPENAI_API_KEY: 'sk-voice' };
  const say = (base) => fetch(`${base}/api/ai/bit/tts`, { method: 'POST', body: JSON.stringify({ text: 'Сәлем, мен Битпін.', lang: 'kk', voice: 'Charon', style: 'friend' }) });
  const listen = (base) => fetch(`${base}/api/ai/bit/stt?lang=kk`, { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: new Uint8Array(4000) });
  {
    const apis = fakeApis();
    const s = await serve(createBitVoice({ apiKey: 'g', fetchImpl: apis.fetchImpl, cacheDir: null, provider: selectProvider(env, apis.fetchImpl) }));
    try {
      const r = await say(s.base);
      assert.match(r.headers.get('x-bit-model'), /^openai:/);
      assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [9, 0, 8, 0]);
      const speech = JSON.parse(apis.calls.at(-1).body);
      assert.equal(speech.voice, 'onyx');
      assert.equal(speech.response_format, 'pcm');
      assert.match(speech.instructions, /cheerful school friend/);
      assert.equal((await say(s.base)).headers.get('x-bit-cache'), 'hit');
      assert.deepEqual(await (await listen(s.base)).json(), { text: 'процессор деген не' });
      assert.match(apis.calls.at(-1).url, /audio\/transcriptions$/);
    } finally {
      await s.close();
    }
  }
  {
    const apis = fakeApis({ fail: 500 });
    const s = await serve(createBitVoice({ apiKey: 'g', fetchImpl: apis.fetchImpl, cacheDir: null, provider: selectProvider(env, apis.fetchImpl) }));
    try {
      const r = await say(s.base);
      assert.equal(r.headers.get('x-bit-model'), 'gemini-3.8-flash-tts');
      assert.deepEqual([...new Uint8Array(await r.arrayBuffer())], [1, 0, 2, 0]);
      assert.deepEqual(await (await listen(s.base)).json(), { text: 'жедел жад деген не' });
    } finally {
      await s.close();
    }
  }
});
