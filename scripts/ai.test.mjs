import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { askAssistant, defaultRequest, isValidBuild, parseRequest, resetAssistantServerState, sanitizeLlmAnswer, suggestSetup } from '../src/services/ai/index.ts';
import { CATALOG_BY_ID } from '../src/data/hardware/catalog.ts';
import { resolveBuild } from '../src/lib/studio/build.ts';

const kk = JSON.parse(readFileSync(new URL('../src/locales/kk.json', import.meta.url), 'utf8'));
const lookup = (path) => path.split('.').reduce((node, key) => node?.[key], kk);
const base = defaultRequest(800_000, 'universal', 'black');
const PURPOSES = ['gaming', 'study', 'programming', 'design3d', 'streaming', 'universal'];
const BUDGETS = [300_000, 500_000, 800_000, 1_200_000, 2_000_000];
const spec = (p, key) => p.specifications.find((s) => s.key === key)?.value;
const sum = (build, cats) => cats.reduce((s, c) => s + (build[c]?.priceKZT ?? 0), 0);

test('parses the brief examples (kk / ru)', () => {
  const a = parseRequest('Маған 800 000 теңгеге ойын және программалауға компьютер жина', base);
  assert.equal(a.budget, 800_000);
  assert.deepEqual(a.purposes, ['gaming', 'programming']);
  assert.equal(a.purpose, 'gaming');

  const b = parseRequest('1 200 000 теңгеге ақ түсті толық сетап керек', base);
  assert.equal(b.budget, 1_200_000);
  assert.equal(b.style, 'white');
  for (const c of ['headset', 'speakers', 'desk', 'chair']) assert.ok(b.include.includes(c), c);

  const c = parseRequest('300 Гц монитор және Logitech мышка керек', base);
  assert.equal(c.monitor.minHz, 300);
  assert.equal(c.brands.mouse, 'Logitech');
  assert.equal(c.budget, 800_000, 'no budget in the message keeps the previous one');

  const d = parseRequest('Нужен компьютер для учёбы и программирования за 600 тысяч, без RGB', base);
  assert.equal(d.budget, 600_000);
  assert.deepEqual(d.purposes, ['study', 'programming'], 'order of mention: учёба first');
  assert.equal(d.style, 'noRgb');
});

test('parses hardware wishes: 4K, RAM, storage, wireless, brands, exclusions', () => {
  const r = parseRequest('4K монитор, 32 ГБ жад, 2 ТБ SSD, сымсыз тышқан, AMD процессор, орындықсыз', base);
  assert.equal(r.monitor.resolution, '4k');
  assert.equal(r.minRamGb, 32);
  assert.equal(r.minStorageTb, 2);
  assert.deepEqual(r.wireless, ['mouse']);
  assert.equal(r.brands.cpu, 'AMD');
  assert.ok(r.exclude.includes('chair'));
  const ru = parseRequest('игровой ПК 1,5 млн, видеокарта NVIDIA, без колонок', base);
  assert.equal(ru.budget, 1_500_000);
  assert.equal(ru.brands.gpu, 'GeForce');
  assert.ok(ru.exclude.includes('speakers'));
});

test('every purpose × budget gives a compatible, catalog-only build close to the budget', () => {
  for (const purpose of PURPOSES) for (const budget of BUDGETS) for (const style of ['black', 'white']) {
    const s = suggestSetup({ ...base, purpose, purposes: [purpose], budget, style });
    const label = `${purpose} ${budget} ${style}`;
    assert.ok(isValidBuild(s.build), label);
    for (const [category, id] of Object.entries(s.build)) if (id) assert.equal(CATALOG_BY_ID.get(id)?.category, category, label);
    if (budget >= 500_000) {
      assert.ok(s.total <= budget, `${label}: ${s.total} over`);
      assert.ok(s.total >= budget * 0.8, `${label}: only ${s.total} of ${budget} used`);
    }
    assert.equal(s.overBudget, Math.max(0, s.total - budget));
  }
});

test('purpose priorities: gaming spends most on the GPU, study/programming on CPU + RAM + SSD', () => {
  for (const budget of [800_000, 1_200_000, 2_000_000]) {
    const g = resolveBuild(suggestSetup({ ...base, purpose: 'gaming', purposes: ['gaming'], budget }).build);
    assert.ok(g.gpu, `gaming ${budget} has a GPU`);
    assert.ok(g.gpu.priceKZT >= g.cpu.priceKZT, `gaming ${budget}: GPU ≥ CPU`);
    for (const purpose of ['study', 'programming']) {
      const p = resolveBuild(suggestSetup({ ...base, purpose, purposes: [purpose], budget }).build);
      assert.ok(sum(p, ['cpu', 'ram', 'ssd']) > sum(p, ['keyboard', 'mouse', 'headset', 'speakers']), `${purpose} ${budget}: core over accessories`);
    }
  }
});

test('wishes are honoured or reported, never invented', () => {
  const s = suggestSetup(parseRequest('1 200 000 теңгеге ойын, 300 Гц монитор, Logitech тышқан, 32 ГБ жад, сымсыз пернетақта', base));
  const b = resolveBuild(s.build);
  assert.ok(spec(b.monitor, 'refresh') >= 300);
  assert.match(b.mouse.brand, /Logitech/);
  assert.ok(Number.parseFloat(spec(b.ram, 'capacity')) >= 32);
  assert.notEqual(spec(b.keyboard, 'connection'), 'usb');
  assert.deepEqual(s.unavailable, []);
  assert.ok(isValidBuild(s.build));

  const impossible = suggestSetup(parseRequest('1000 Гц монитор және Apple тышқан', base));
  assert.ok(impossible.unavailable.includes('1000 Hz'));
  assert.ok(isValidBuild(impossible.build));
});

test('explanations exist in kk.json and follow the purpose priority', () => {
  for (const purpose of PURPOSES) {
    const s = suggestSetup({ ...base, purpose, purposes: [purpose], budget: 1_200_000 });
    assert.ok(s.explanations.length >= 5, purpose);
    for (const e of s.explanations) assert.equal(typeof lookup(`assistant.why.${e.key}`), 'string', `missing assistant.why.${e.key}`);
    const first = s.explanations[0].key;
    if (purpose === 'gaming') assert.match(first, /^gpu\./);
    if (purpose === 'programming' || purpose === 'study') assert.match(first, /^cpu\./);
  }
});

test('LLM answers are sanitised: unknown ids, purposes and fields are dropped', () => {
  const clean = sanitizeLlmAnswer({ budget: 900000, purposes: ['gaming', 'hacking'], style: 'neon', pins: { gpu: 'gpu-nvidia-5070-fe', cpu: 'invented-cpu', mouse: 'gpu-nvidia-5080-fe' }, brands: { mouse: 'Razer', toaster: 'X' }, note: 'ok' });
  assert.deepEqual(clean.purposes, ['gaming']);
  assert.equal(clean.style, undefined);
  assert.deepEqual(clean.pins, { gpu: 'gpu-nvidia-5070-fe' });
  assert.deepEqual(clean.brands, { mouse: 'Razer' });
  assert.equal(sanitizeLlmAnswer('not json'), null);
});

const ctx = { previous: base };
const okResponse = (answer) => async () => new Response(JSON.stringify({ answer }), { status: 200, headers: { 'content-type': 'application/json' } });

test('client: server answer is used when valid, local engine otherwise', async () => {
  resetAssistantServerState();
  const llm = await askAssistant('ойын компьютері', ctx, { fetchImpl: okResponse({ budget: 1_000_000, purposes: ['gaming'], pins: { gpu: 'gpu-nvidia-5070-fe' }, note: 'Видеокартаға басымдық берілді.' }) });
  assert.equal(llm.source, 'llm');
  assert.equal(llm.build.gpu, 'gpu-nvidia-5070-fe');
  assert.equal(llm.request.budget, 1_000_000);
  assert.ok(isValidBuild(llm.build));

  resetAssistantServerState();
  const garbage = await askAssistant('ойын', ctx, { fetchImpl: async () => new Response('{"answer":"nope"}', { status: 200 }) });
  assert.equal(garbage.source, 'local');
  assert.equal(garbage.fallbackReason, 'invalid');

  resetAssistantServerState();
  const noKey = await askAssistant('800 мың теңгеге оқу', ctx, { fetchImpl: async () => new Response('{"error":"no-key"}', { status: 503 }) });
  assert.equal(noKey.source, 'local');
  assert.equal(noKey.request.budget, 800_000);
  assert.ok(isValidBuild(noKey.build));

  resetAssistantServerState();
  const offline = await askAssistant('500к ойын', ctx, { fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(offline.fallbackReason, 'unavailable');
  // the next call does not wait on the dead server again
  let called = false;
  await askAssistant('500к ойын', ctx, { fetchImpl: async () => { called = true; throw new Error(); } });
  assert.equal(called, false);

  resetAssistantServerState();
  const slow = await askAssistant('ойын', ctx, { timeoutMs: 50, fetchImpl: (_url, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  assert.equal(slow.source, 'local');
});

test('improve mode reports what changes against the current build', async () => {
  const current = suggestSetup({ ...base, budget: 500_000 }).build;
  const reply = await askAssistant('жақсарт, 1 200 000 теңге', { previous: { ...base, budget: 500_000 }, current }, { localOnly: true });
  assert.ok(reply.changes.length > 0);
  for (const change of reply.changes) assert.equal(reply.build[change.category] ?? null, change.to);
});
