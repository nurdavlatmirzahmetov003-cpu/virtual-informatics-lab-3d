import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { understand, findSection } from '../src/services/bit/intent.ts';
import { matchFaq, FAQ_IDS } from '../src/services/bit/faq.ts';
import { SECTIONS, SECTION_IDS, sectionOfPath } from '../src/services/bit/sections.ts';
import { LESSON_IDS, LESSON_STEPS, TOUR_STOPS } from '../src/services/bit/lessons.ts';
import { normalize, splitSentences, stripWakeWord } from '../src/services/bit/text.ts';
import { extractAction, visiblePart, askBit } from '../src/services/bit/client.ts';
import { chooseVoice, speakable } from '../src/services/bit/speech.ts';
import { bitSystemPrompt, createBit, parseGeminiEvent, toContents } from '../server/bit.ts';
import kk from '../src/services/bit/content/kk.ts';
import ru from '../src/services/bit/content/ru.ts';
import en from '../src/services/bit/content/en.ts';

const CONTENT = { kk, ru, en };
const locale = (lang) => JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8'));
const lookup = (dict, key) => key.split('.').reduce((n, p) => (n && typeof n === 'object' ? n[p] : undefined), dict);

test('wake word and normalisation', () => {
  assert.equal(stripWakeWord('Бит, процессор деген не?'), 'процессор деген не?');
  assert.equal(stripWakeWord('Hey Bit: open the labs'), 'open the labs');
  assert.equal(stripWakeWord('Битке рахмет'), 'Битке рахмет', 'a word that only starts with "бит" is not the wake word');
  assert.equal(normalize('  Что ТАКОЕ ёлка?! '), 'что такое елка');
});

test('intents: commands in all three languages, whatever the site language', () => {
  const cases = [
    ['Бит, сайтты көрсет', 'tour'],
    ['покажи сайт', 'tour'],
    ['Bit, show me around', 'tour'],
    ['Бит, логика сабағын баста', 'lesson', 'logic'],
    ['начни урок по сетям', 'lesson', 'network'],
    ['start the algorithms lesson', 'lesson', 'algorithms'],
    ['Желілер зертханасын аш', 'navigate', 'network'],
    ['Открой лабораторию сетей', 'navigate', 'network'],
    ['open setup studio', 'navigate', 'studio'],
    ['анатомия', 'navigate', 'explorer'],
    ['Бит, 500 000 теңгеге компьютер жина', 'build'],
    ['собери компьютер за 400 тыс тенге', 'build'],
    ['Build a PC for 400,000 tenge', 'build'],
    ['тоқта', 'stop'],
    ['дальше', 'next'],
    ['Бит!', 'greet'],
    ['сәлем', 'greet'],
  ];
  for (const [text, kind, target] of cases) {
    const i = understand(text, { modelAvailable: true });
    assert.equal(i.kind, kind, `${text} → ${JSON.stringify(i)}`);
    if (target) assert.equal(i.lesson ?? i.section, target, text);
  }
});

test('intents: a question about a section is not a request to open it', () => {
  assert.equal(understand('желі деген не?', { modelAvailable: false }).kind, 'faq');
  assert.equal(understand('Процессор деген не?', { modelAvailable: true }).kind, 'faq');
  // two topics: the model compares them when it is on; offline the best built-in answer still helps
  assert.equal(understand('процессор мен видеокартаның айырмасы неде', { modelAvailable: true }).kind, 'ask');
  assert.equal(understand('процессор мен видеокартаның айырмасы неде', { modelAvailable: false }).kind, 'faq');
  assert.equal(understand('почему небо голубое', { modelAvailable: true }).kind, 'ask');
});

test('FAQ: every topic answers in every language and is found by its own question', () => {
  for (const [lang, c] of Object.entries(CONTENT)) {
    assert.deepEqual(Object.keys(c.faq).sort(), [...FAQ_IDS].sort(), lang);
    for (const id of FAQ_IDS) {
      const { q, a } = c.faq[id];
      assert.ok(q.length > 5 && a.length > 60, `${lang}.${id}`);
      assert.ok(!/[*#`]|\[\[/.test(a), `${lang}.${id}: no markdown in spoken text`);
      if (id === 'computer' || id === 'help' || id === 'progress') continue;
      assert.equal(matchFaq(q)?.id, id, `${lang}: "${q}" → ${JSON.stringify(matchFaq(q))}`);
    }
  }
});

test('Kazakh texts use the Kazakh letters (no Russian look-alikes in Kazakh words)', () => {
  const all = JSON.stringify(kk);
  for (const ch of 'әғқңөұүі') assert.ok(all.includes(ch), `uses ${ch}`);
  // common slips: Russian "и" in place of Kazakh "і" inside Kazakh-only words
  for (const wrong of ['бир ', 'биз ', 'кирис', 'шыгар', 'курыл', 'кабылда']) assert.ok(!all.toLowerCase().includes(wrong), wrong);
});

test('tour, lessons and phrases are complete in all languages', () => {
  for (const [lang, c] of Object.entries(CONTENT)) {
    assert.deepEqual(Object.keys(c.tour).sort(), [...TOUR_STOPS].sort(), lang);
    assert.deepEqual(Object.keys(c.lessons).sort(), [...LESSON_IDS].sort(), lang);
    for (const id of LESSON_IDS) assert.equal(c.lessons[id].length, LESSON_STEPS, `${lang}.${id}`);
    for (const [k, v] of Object.entries(c.say)) if (typeof v === 'string') assert.ok(v.length > 5, `${lang}.say.${k}`);
    assert.deepEqual(Object.keys(c.say).sort(), Object.keys(kk.say).sort(), lang);
  }
});

test('sections: routes exist in the router, names exist in every locale, ids are unique', () => {
  assert.equal(new Set(SECTION_IDS).size, SECTION_IDS.length);
  const router = readFileSync(new URL('../src/app/router.tsx', import.meta.url), 'utf8');
  for (const s of SECTIONS) {
    if (s.route !== '/') assert.ok(router.includes(`path: '${s.route.slice(1)}'`), `${s.id}: ${s.route}`);
    for (const lang of ['kk', 'ru', 'en']) assert.equal(typeof lookup(locale(lang), s.nameKey), 'string', `${lang}: ${s.nameKey}`);
  }
  assert.equal(sectionOfPath('/labs/network'), 'network');
  assert.equal(sectionOfPath('/labs'), 'labs');
  assert.equal(sectionOfPath('/teacher/class/3'), 'home');
  assert.equal(findSection(normalize('setup studio')), 'studio');
});

test('UI strings of Bit exist in every locale', () => {
  const keys = (n, p = '') => Object.entries(n).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const kkKeys = keys(locale('kk').bit).sort();
  for (const lang of ['ru', 'en']) assert.deepEqual(keys(locale(lang).bit).sort(), kkKeys, lang);
});

test('streamed text: sentences split for speech, action tags removed', () => {
  assert.deepEqual(splitSentences('IP 192.168.1.10 деп жаз. Содан кейін PING жібер! Әр'), { done: ['IP 192.168.1.10 деп жаз.', 'Содан кейін PING жібер!'], rest: ' Әр' });
  assert.deepEqual(splitSentences('Мысалы 192.'), { done: [], rest: 'Мысалы 192.' });
  assert.deepEqual(extractAction('Ашып жатырмын. [[go:network]]'), { text: 'Ашып жатырмын.', go: 'network' });
  assert.deepEqual(extractAction('Hi [[go:nowhere]]'), { text: 'Hi', go: null });
  assert.equal(visiblePart('Жарайды. [[go:ne'), 'Жарайды. ');
  assert.equal(speakable('A — B [[go:lab]] https://x.y/z'), 'A, B');
});

test('voices: the site language first, Kazakh falls back to a Russian voice, never to English', () => {
  const v = (lang, name, localService = true) => ({ lang, name, localService });
  assert.deepEqual(chooseVoice('kk', [v('en-US', 'A'), v('kk-KZ', 'Aigul'), v('kk-KZ', 'Microsoft Daulet Online (Natural)', false)]), { index: 2, approximate: false });
  assert.deepEqual(chooseVoice('kk', [v('en-US', 'A'), v('ru-RU', 'Irina')]), { index: 1, approximate: true });
  assert.equal(chooseVoice('kk', [v('en-US', 'A')]), null);
  assert.deepEqual(chooseVoice('ru', [v('ru_RU', 'X')]), { index: 0, approximate: false });
  assert.equal(chooseVoice('en', [v('ru-RU', 'X')]), null);
});

test('Gemini prompt: the answer language is the site language, ids are the site sections', () => {
  const kkPrompt = bitSystemPrompt('kk', 'network');
  assert.match(kkPrompt, /ONLY in Kazakh/);
  assert.match(kkPrompt, /әдеби/);
  assert.match(kkPrompt, /Never switch language/);
  assert.match(kkPrompt, /"network" section/);
  for (const s of SECTIONS) assert.ok(kkPrompt.includes(`${s.id} (${s.route})`));
  assert.match(bitSystemPrompt('ru', null), /ONLY in Russian/);
  assert.match(bitSystemPrompt('en', 'nonsense'), /ONLY in English/);
  assert.doesNotMatch(bitSystemPrompt('en', 'nonsense'), /nonsense/);
});

test('Gemini contents alternate user/model and end with the question', () => {
  const c = toContents(
    [
      { role: 'bit', text: 'hello' },
      { role: 'user', text: 'a' },
      { role: 'user', text: 'b' },
      { role: 'bit', text: 'c' },
      { role: 'evil', text: 'x' },
    ],
    'q',
  );
  assert.deepEqual(
    c.map((x) => [x.role, x.parts[0].text]),
    [
      ['user', 'a\nb'],
      ['model', 'c'],
      ['user', 'q'],
    ],
  );
  assert.deepEqual(parseGeminiEvent('data: {"candidates":[{"content":{"parts":[{"text":"Сә"},{"text":"лем"}]}}]}'), { text: 'Сәлем', blocked: undefined, finish: undefined });
  assert.equal(parseGeminiEvent(': keep-alive'), null);
});

/** A fake Gemini: streams the given pieces as SSE and records what it was sent. */
function fakeGemini(pieces, { status = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    if (status !== 200) return new Response('{}', { status });
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(c) {
        for (const p of pieces) c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: p }] } }] })}\r\n\r\n`));
        c.close();
      },
    });
    return new Response(stream, { status: 200, headers: { 'content-type': 'text/event-stream' } });
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
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}

test('server: without a key Bit reports "not configured" and refuses questions', async () => {
  const bit = createBit({ apiKey: '' });
  const s = await serve(bit);
  try {
    assert.deepEqual(await (await fetch(`${s.base}/api/ai/bit/health`)).json(), { configured: false, model: null });
    const r = await fetch(`${s.base}/api/ai/bit/ask`, { method: 'POST', body: JSON.stringify({ message: 'hi', lang: 'kk' }) });
    assert.equal(r.status, 503);
    assert.equal((await r.json()).error, 'no-key');
  } finally {
    await s.close();
  }
});

test('server: streams Gemini text to the browser; key in a header, never in the URL; language from the site', async () => {
  const gem = fakeGemini(['Процессор — ', 'компьютердің миы. ', 'Ол командаларды орындайды. [[go:', 'explorer]]']);
  const key = `test-key-${Math.random().toString(36).slice(2)}`;
  const bit = createBit({ apiKey: key, model: 'gemini-2.5-flash', fetchImpl: gem.fetchImpl, allowedOrigins: ['http://localhost:5173'] });
  const s = await serve(bit);
  try {
    // the browser-side client against the real handler
    const seen = [];
    const answer = await askBit({
      message: 'что такое процессор?',
      lang: 'kk',
      page: 'labs',
      history: [{ role: 'user', text: 'сәлем' }],
      onText: (t) => seen.push(t),
      fetchImpl: (path, init) => fetch(s.base + path, init),
    });
    assert.equal(answer.text, 'Процессор — компьютердің миы. Ол командаларды орындайды.');
    assert.equal(answer.go, 'explorer');
    assert.ok(seen.length >= 3 && seen.every((t) => !t.includes('[[')), 'tags never shown while streaming');
    const call = gem.calls[0];
    assert.ok(!call.url.includes(key), 'no key in the URL');
    assert.equal(call.init.headers['x-goog-api-key'], key);
    assert.match(call.url, /gemini-2\.5-flash:streamGenerateContent\?alt=sse$/);
    assert.match(call.body.systemInstruction.parts[0].text, /ONLY in Kazakh/, 'a Russian question still gets a Kazakh answer');
    assert.deepEqual(call.body.generationConfig.thinkingConfig, { thinkingBudget: 0 });
    assert.equal(call.body.contents.at(-1).parts[0].text, 'сәлем\nчто такое процессор?');

    const bad = await fetch(`${s.base}/api/ai/bit/ask`, { method: 'POST', headers: { origin: 'https://evil.example' }, body: JSON.stringify({ message: 'hi', lang: 'kk' }) });
    assert.equal(bad.status, 403, 'other sites may not use the quota');
    const badLang = await fetch(`${s.base}/api/ai/bit/ask`, { method: 'POST', body: JSON.stringify({ message: 'hi', lang: 'de' }) });
    assert.equal(badLang.status, 400);
  } finally {
    await s.close();
  }
});

test('server: Gemini errors become short codes; the rate limit holds', async () => {
  const gem = fakeGemini([], { status: 429 });
  let t = 0;
  const bit = createBit({ apiKey: 'k', fetchImpl: gem.fetchImpl, ratePerMinute: 2, now: () => t });
  const s = await serve(bit);
  try {
    const ask = () => fetch(`${s.base}/api/ai/bit/ask`, { method: 'POST', body: JSON.stringify({ message: 'hi', lang: 'en' }) });
    const r1 = await ask();
    assert.equal(r1.status, 502);
    assert.equal((await r1.json()).error, 'busy');
    await ask();
    assert.equal((await ask()).status, 429);
    t += 61_000;
    assert.equal((await ask()).status, 502, 'the window moves on');
  } finally {
    await s.close();
  }
});
