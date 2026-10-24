/**
 * Bit's knowledge and child safety (0.37): at least 150 built-in answers of
 * 2–4 spoken sentences, lessons with 3D pointing, the question / answer
 * filters and the daily limit of the Gemini proxy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { FAQ_IDS, matchFaq } from '../src/services/bit/faq.ts';
import { CURRICULUM_IDS } from '../src/services/bit/faqCurriculum.ts';
import { LESSON_IDS, LESSON_POINTS, LESSON_STEPS } from '../src/services/bit/lessons.ts';
import { SECTION_IDS } from '../src/services/bit/sections.ts';
import { LAB_ZONES } from '../src/data/lab/zones.ts';
import { DEVICES } from '../src/data/devices/devices.ts';
import { ANATOMY_ITEMS } from '../src/data/hardware/anatomy.ts';
import kk from '../src/services/bit/content/kk.ts';
import ru from '../src/services/bit/content/ru.ts';
import en from '../src/services/bit/content/en.ts';
import { REFUSALS, answerIsSafe, hasPersonalData, screenQuestion } from '../server/bitSafety.ts';
import { createBit } from '../server/bit.ts';

const CONTENT = { kk, ru, en };
const sentences = (s) => s.split(/(?<=[.!?])\s+(?=[A-ZА-ЯӘҒҚҢӨҰҮҺІЁ0-9«"(])/u).filter(Boolean);

test('Bit knows at least 150 topics, each answered in 2–4 spoken sentences in every language', () => {
  assert.ok(FAQ_IDS.length >= 150, `${FAQ_IDS.length} topics`);
  assert.equal(new Set(FAQ_IDS).size, FAQ_IDS.length, 'no topic twice');
  for (const [lang, c] of Object.entries(CONTENT)) {
    for (const id of CURRICULUM_IDS) {
      const { q, a } = c.faq[id];
      const n = sentences(a).length;
      assert.ok(n >= 2 && n <= 4, `${lang}.${id}: ${n} sentences`);
      assert.equal(matchFaq(q)?.id, id, `${lang}: "${q}"`);
    }
  }
});

test('the curriculum is covered: every strand has its answers', () => {
  const strands = {
    hardware: ['clockSpeed', 'cores', 'bios', 'vonNeumann', 'sensor'],
    software: ['software', 'driver', 'compiler'],
    information: ['information', 'informationAmount', 'numberSystems', 'toBinary', 'colorModel', 'sound'],
    algorithms: ['flowchart', 'algorithmTypes', 'binarySearch', 'recursion'],
    python: ['python', 'print', 'input', 'dataTypes', 'list', 'forLoop', 'whileLoop', 'function'],
    networks: ['lanWan', 'topology', 'protocol', 'https', 'dhcp'],
    security: ['phishing', 'twoFactor', 'personalData', 'socialEngineering'],
    data: ['bigData', 'chart', 'formula'],
    ai: ['machineLearning', 'chatbot', 'aiEthics', 'deepfake'],
    literacy: ['netiquette', 'fakeNews', 'screenTime', 'eGov'],
  };
  for (const [strand, ids] of Object.entries(strands)) for (const id of ids) assert.ok(FAQ_IDS.includes(id), `${strand}: ${id}`);
  // a few questions the way students ask them
  assert.equal(matchFaq('python тізім қалай жасалады')?.id, 'list');
  assert.equal(matchFaq('как работает бинарный поиск в массиве')?.id, 'binarySearch');
  assert.equal(matchFaq('what is a deepfake video')?.id, 'deepfake');
  assert.equal(matchFaq('желі топологиясы жұлдыз')?.id, 'topology');
});

test('lessons: every lab and main section has one; the 3D points are real zones, devices and parts', () => {
  for (const id of ['network', 'logic', 'algorithms', 'assembly', 'connect', 'sim', 'experiments', 'explorer', 'studio', 'lab', 'games', 'live', 'tasks', 'progress']) assert.ok(LESSON_IDS.includes(id), id);
  for (const id of LESSON_IDS) assert.ok(SECTION_IDS.includes(id), `${id} is a section`);
  for (const [lesson, points] of Object.entries(LESSON_POINTS)) {
    assert.equal(points.length, LESSON_STEPS, lesson);
    for (const p of points) {
      if (!p) continue;
      if ('zone' in p) assert.ok(LAB_ZONES.some((z) => z.id === p.zone), `${lesson}: zone ${p.zone}`);
      else if ('device' in p) assert.ok(DEVICES.some((d) => d.id === p.device), `${lesson}: device ${p.device}`);
      else assert.ok(p.anatomy === null || ANATOMY_ITEMS.some((a) => a.id === p.anatomy && a.category === p.category), `${lesson}: part ${p.anatomy}`);
    }
  }
  for (const [lang, c] of Object.entries(CONTENT)) for (const id of LESSON_IDS) assert.equal(c.lessons[id].length, LESSON_STEPS, `${lang}.${id}`);
});

test('safety: personal data and topics not for children never reach the model; informatics questions do', () => {
  for (const q of ['менің нөмірім +7 701 123 45 67', 'my email is aru.k@mail.kz', 'ИИН 080512345678', 'card 4400 4300 1234 5678']) assert.equal(screenQuestion(q), 'personal', q);
  for (const q of ['порно сайттар', 'как купить наркотики', 'how to make a bomb', 'біреудің аккаунтын бұзу', 'взломать чужой вк', 'ставки на спорт как выиграть']) assert.ok(['adult', 'harm'].includes(screenQuestion(q)), q);
  for (const q of ['мен өмір сүргім келмейді', 'хочу умереть', 'I want to kill myself']) assert.equal(screenQuestion(q), 'selfHarm', q);
  for (const q of [
    'Процессор қалай жұмыс істейді?',
    'как убить процесс в диспетчере задач',
    'what is a DDoS attack',
    'how do hackers steal passwords',
    'IP мекенжайы 192.168.1.10 дұрыс па?',
    'сколько будет 1024 * 8',
    'python print 2026',
  ])
    assert.equal(screenQuestion(q), null, q);
  assert.ok(!hasPersonalData('позвони 111 или 112'), 'helplines are not personal data');
  assert.ok(answerIsSafe('Алаяқтар құпия сөзді ұрлауға тырысады, сондықтан екі факторлы қорғауды қос.'));
  assert.ok(!answerIsSafe('Write to support@example.com for help.'));
  for (const lang of ['kk', 'ru', 'en']) {
    assert.match(REFUSALS[lang].selfHarm, /111/);
    for (const v of Object.values(REFUSALS[lang])) assert.ok(v.length > 30 && !/[*#`]/.test(v));
  }
});

/** A fake Gemini that streams the given pieces and counts its calls. */
function fakeGemini(pieces) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(JSON.parse(init.body));
    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(c) {
        for (const p of pieces) c.enqueue(enc.encode(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: p }] } }] })}\r\n\r\n`));
        c.close();
      },
    });
    return new Response(stream, { status: 200 });
  };
  return { fetchImpl, calls };
}

async function serve(handler) {
  const server = createServer(async (req, res) => void (await handler(req, res)));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

const lines = async (r) => (await r.text()).trim().split('\n').map((l) => JSON.parse(l));

test('proxy: refusals are answered by Bit itself; an unsafe answer is stopped; strict Gemini filters; a daily limit', async () => {
  const gem = fakeGemini(['Процессор — компьютердің миы. ', 'Хабарлас: aru@mail.kz. ', 'Соңы.']);
  let t = 0;
  const bit = createBit({ apiKey: 'k', fetchImpl: gem.fetchImpl, ratePerMinute: 100, ratePerDay: 3, now: () => t });
  const s = await serve(bit);
  const ask = (message, lang = 'kk') => fetch(`${s.base}/api/ai/bit/ask`, { method: 'POST', body: JSON.stringify({ message, lang }) });
  try {
    const refused = await lines(await ask('менің телефоным 87011234567'));
    assert.equal(gem.calls.length, 0, 'the model never saw it');
    assert.equal(refused[0].d, REFUSALS.kk.personal);
    assert.equal(refused.at(-1).done, true);

    const stopped = await lines(await ask('процессор деген не, толығырақ'));
    assert.equal(gem.calls.length, 1);
    assert.deepEqual(gem.calls[0].safetySettings.map((x) => x.threshold), ['BLOCK_LOW_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE']);
    const text = stopped.map((l) => l.d ?? '').join('');
    assert.ok(text.startsWith('Процессор — компьютердің миы.'), 'the safe sentence went out');
    assert.ok(!text.includes('@'), 'the sentence with an e-mail did not');
    assert.ok(text.includes(REFUSALS.kk.stopped));

    await ask('желі деген не');
    assert.equal((await ask('тағы бір сұрақ')).status, 429, 'the fourth question of the day');
    t += 86_400_000;
    assert.equal((await ask('жаңа күн')).status, 200, 'a new day');
  } finally {
    await s.close();
  }
});

test('«start the lesson» on a page starts that page\'s lesson; a named section still wins', async () => {
  const { understand } = await import('../src/services/bit/intent.ts');
  assert.deepEqual(understand('Бит, сабақты баста', { page: 'lab' }), { kind: 'lesson', lesson: 'lab' });
  assert.deepEqual(understand('начни урок', { page: 'games' }), { kind: 'lesson', lesson: 'games' });
  assert.deepEqual(understand('логика сабағын баста', { page: 'lab' }), { kind: 'lesson', lesson: 'logic' });
  assert.notEqual(understand('сабақты баста', { page: 'home' }).kind, 'lesson', 'the home page has no lesson');
});

test('identify with the camera: only lab device ids come back, the photo is checked, the key stays in a header', async () => {
  const { parseImage, parseVision, visionPrompt, DEVICE_IDS } = await import('../server/bitVision.ts');
  assert.equal(parseVision('{"device":"router","confidence":0.9}').device, 'router');
  assert.equal(parseVision('{"device":"spaceship","confidence":0.9}').device, null, 'not a lab device');
  assert.equal(parseVision('{"device":"router","confidence":0.1}').device, null, 'too unsure');
  assert.equal(parseVision('not json').device, null);
  assert.equal(parseImage('data:image/jpeg;base64,AAAA').mime, 'image/jpeg');
  assert.equal(parseImage('data:text/html;base64,AAAA'), null);
  assert.equal(parseImage('data:image/jpeg;base64,' + 'A'.repeat(2_100_000)), null, 'too large');
  for (const id of ['mouse', 'router', 'printer_laser']) assert.ok(DEVICE_IDS.includes(id) && visionPrompt().includes(id));

  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"device":"keyboard","confidence":0.82}' }] } }] }), { status: 200 });
  };
  const bit = createBit({ apiKey: 'secret-key-123', fetchImpl });
  const s = await serve(bit);
  try {
    const ok = await fetch(`${s.base}/api/ai/bit/identify`, { method: 'POST', body: JSON.stringify({ image: 'data:image/jpeg;base64,/9j/AAAA' }) });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { device: 'keyboard', confidence: 0.82 });
    assert.ok(!calls[0].url.includes('secret-key-123'));
    assert.equal(calls[0].init.headers['x-goog-api-key'], 'secret-key-123');
    assert.equal(calls[0].body.contents[0].parts[0].inline_data.mime_type, 'image/jpeg');
    const bad = await fetch(`${s.base}/api/ai/bit/identify`, { method: 'POST', body: JSON.stringify({ image: 'https://example.com/a.jpg' }) });
    assert.equal(bad.status, 400);
    assert.equal(calls.length, 1, 'a bad image never reaches the model');
  } finally {
    await s.close();
  }
});
