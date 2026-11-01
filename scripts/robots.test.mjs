/**
 * V4 §4 «Біздің роботтар»: the roster, the yard's layout, walking (paths
 * never through walls, props or the platform's edge), the daily-life state
 * machine (work → charge → wake, matches, the lounge) and that robots never
 * walk through each other over a long run.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { ROBOT_IDS, ROSTER } from '../src/data/robots/roster.ts';
import { GARAGES, LOUNGE_SPOTS, PITCH, PROPS, WORK, YARD_HALF, YARD_OBSTACLES, garageOf } from '../src/data/robots/yard.ts';
import { clearanceAt, findPath, fits, segmentFits } from '../src/lib/robots/grid.ts';
import { LIFE, createYard, seeded, stepYard, yardGrid } from '../src/lib/robots/life.ts';
import { TIPS, TIP_IDS, tipsOf } from '../src/data/robots/tips.ts';
import { ECONOMY, MAX_LEVEL, WEARABLE, balance, buy, canWear, checkSave, coinsEarned, coinsSpent, emptySave, heardTip, itemById, normalizeSave, train, trainCost, trainedCost, wear } from '../src/services/robots/economy.ts';
import { TIP_LIMITS, createTipLimiter, pickTip } from '../src/services/robots/tipPicker.ts';
import { robotGeometry } from '../src/scenes/LabSpace/robots/robotKit.ts';

const grid = yardGrid();
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

test('ten distinct robots, each with its own colour, garage and work plan', () => {
  assert.ok(ROSTER.length >= 10);
  assert.equal(new Set(ROSTER.map((r) => r.id)).size, ROSTER.length);
  assert.equal(new Set(ROSTER.map((r) => r.accent)).size, ROSTER.length, 'colours are unique');
  assert.equal(new Set(ROSTER.map((r) => r.kind)).size, ROSTER.length, 'every robot has its own body');
  assert.deepEqual(GARAGES.map((g) => g.robot), [...ROBOT_IDS]);
  for (const r of ROSTER) assert.ok(WORK[r.id].spots.length >= 1, `${r.id} has work`);
});

test('props sit on the platform and do not overlap each other', () => {
  for (const p of YARD_OBSTACLES) {
    assert.ok(Math.abs(p.at[0]) + p.half[0] <= YARD_HALF[0] + 1e-9 && Math.abs(p.at[1]) + p.half[1] <= YARD_HALF[1] + 1e-9, `${p.id} on the platform`);
  }
  for (let i = 0; i < PROPS.length; i++) {
    for (let j = i + 1; j < PROPS.length; j++) {
      const a = PROPS[i];
      const b = PROPS[j];
      const apart = Math.abs(a.at[0] - b.at[0]) >= a.half[0] + b.half[0] || Math.abs(a.at[1] - b.at[1]) >= a.half[1] + b.half[1];
      assert.ok(apart, `${a.id} and ${b.id} overlap`);
    }
  }
  // the pitch is open floor: no prop on it
  for (const p of PROPS) {
    const onPitch = p.at[0] + p.half[0] > PITCH.min[0] && p.at[0] - p.half[0] < PITCH.max[0] && p.at[1] + p.half[1] > PITCH.min[1] && p.at[1] - p.half[1] < PITCH.max[1];
    assert.ok(!onPitch, `${p.id} on the pitch`);
  }
});

test('every robot fits its garage pad, its work spots and reaches all of them from its garage', () => {
  for (const r of ROSTER) {
    const pad = garageOf(r.id).pad;
    assert.ok(fits(grid, pad, r.radius), `${r.id} fits its pad (clearance ${clearanceAt(grid, pad).toFixed(2)} < ${r.radius})`);
    for (const s of WORK[r.id].spots) {
      assert.ok(fits(grid, s, r.radius), `${r.id} fits its spot ${s} (clearance ${clearanceAt(grid, s).toFixed(2)})`);
      assert.ok(findPath(grid, pad, s, r.radius), `${r.id}: a way from the garage to ${s}`);
      assert.ok(findPath(grid, s, pad, r.radius), `${r.id}: a way back from ${s}`);
    }
    for (const s of LOUNGE_SPOTS) assert.ok(findPath(grid, s, pad, r.radius), `${r.id}: a way from the lounge spot ${s}`);
  }
  for (const s of LOUNGE_SPOTS) assert.ok(fits(grid, s, Math.max(...ROSTER.map((r) => r.radius)) - 0.06), `lounge spot ${s} is open`);
});

test('work spots of different robots keep their footprints apart', () => {
  const spots = ROSTER.flatMap((r) => WORK[r.id].spots.map((p) => ({ id: r.id, p, r: r.radius })));
  for (let i = 0; i < spots.length; i++) {
    for (let j = i + 1; j < spots.length; j++) {
      const a = spots[i];
      const b = spots[j];
      if (a.id === b.id) continue;
      // the cleaner, the inspector and the guide walk loops: they only pass through others' spots
      if (['cleaner', 'inspector'].includes(a.id) || ['cleaner', 'inspector'].includes(b.id)) continue;
      assert.ok(dist(a.p, b.p) >= a.r + b.r + LIFE.gap, `${a.id} ${a.p} and ${b.id} ${b.p} too close`);
    }
  }
});

test('paths never cross a wall, a prop or the platform edge', () => {
  const rand = seeded(11);
  let checked = 0;
  for (let i = 0; i < 400; i++) {
    const r = ROSTER[i % ROSTER.length];
    const a = [(rand() * 2 - 1) * YARD_HALF[0], (rand() * 2 - 1) * YARD_HALF[1]];
    const b = [(rand() * 2 - 1) * YARD_HALF[0], (rand() * 2 - 1) * YARD_HALF[1]];
    if (!fits(grid, a, r.radius) || !fits(grid, b, r.radius)) continue;
    const path = findPath(grid, a, b, r.radius);
    if (!path) continue;
    let from = a;
    for (const p of path) {
      assert.ok(segmentFits(grid, from, p, r.radius), `${r.id}: segment ${from} → ${p} cuts an obstacle`);
      from = p;
    }
    assert.ok(dist(path[path.length - 1], b) < 0.08, 'ends at the goal');
    checked++;
  }
  assert.ok(checked > 150, `enough paths checked (${checked})`);
});

for (const seed of [3, 13]) test(`a long day (seed ${seed}): robots never overlap or leave the open floor; they work, charge, wake, play and rest`, () => {
  const w = createYard({ seed });
  const seen = Object.fromEntries(ROSTER.map((r) => [r.id, new Set()]));
  const charged = Object.fromEntries(ROSTER.map((r) => [r.id, 0]));
  let goals = 0;
  let matches = 0;
  let minGap = Infinity;
  const dt = 0.1;
  for (let i = 0; i < (25 * 60) / dt; i++) {
    for (const e of stepYard(w, dt)) {
      if (e.type === 'goal') goals++;
      if (e.type === 'matchStart') matches++;
      if (e.type === 'state' && e.state === 'charging') charged[e.id]++;
    }
    for (const a of w.agents) {
      seen[a.id].add(a.state);
      assert.ok(clearanceAt(grid, a.pos) >= a.radius - 1e-6, `${a.id} inside an obstacle at ${a.pos.map((v) => v.toFixed(2))} (t=${w.t.toFixed(1)})`);
      assert.ok(a.battery >= 0 && a.battery <= 1, 'battery 0..1');
    }
    for (let x = 0; x < w.agents.length; x++) {
      for (let y = x + 1; y < w.agents.length; y++) {
        const a = w.agents[x];
        const b = w.agents[y];
        const gap = dist(a.pos, b.pos) - a.radius - b.radius;
        minGap = Math.min(minGap, gap);
        assert.ok(gap >= 0, `${a.id} and ${b.id} overlap by ${(-gap).toFixed(3)} m (t=${w.t.toFixed(1)})`);
      }
    }
  }
  for (const r of ROSTER) {
    for (const s of ['work', 'toGarage', 'charging', 'waking']) assert.ok(seen[r.id].has(s), `${r.id} was never ${s}`);
    assert.ok(charged[r.id] >= 2, `${r.id} charged ${charged[r.id]} times in 25 minutes`);
  }
  assert.ok(matches >= 8, `matches: ${matches}`);
  assert.ok(goals >= 3, `goals: ${goals}`);
  const played = ROSTER.filter((r) => seen[r.id].has('play')).length;
  assert.ok(played >= 6, `${played} robots played football`);
  assert.ok(ROSTER.filter((r) => seen[r.id].has('rest')).length >= 6, 'robots rest in the lounge after a match');
  assert.ok(minGap >= 0, `closest gap ${minGap}`);
});

test('state machine: a flat battery sends a robot to its own garage, it charges to full, wakes and goes back to work', () => {
  const w = createYard({ seed: 5 });
  const a = w.agents.find((x) => x.id === 'librarian');
  a.battery = LIFE.low + 0.001;
  const states = [];
  for (let i = 0; i < 2000 && states.at(-1) !== 'work'; i++) {
    for (const e of stepYard(w, 0.1)) if (e.type === 'state' && e.id === 'librarian') states.push(e.state);
  }
  assert.deepEqual(states.slice(0, 4), ['toGarage', 'charging', 'waking', 'work']);
  assert.ok(a.battery > 0.95, 'charged');
});

test('skill at level 5: a charge lasts 30 % longer', () => {
  const base = createYard({ seed: 1 }).agents[0].drainFactor;
  const skilled = createYard({ seed: 1, levels: { guide: 5 } }).agents[0].drainFactor;
  assert.equal(base, 1);
  assert.equal(skilled, LIFE.skillDrain);
});

test('robots away on duty (fewer robots on Low) stand still and others walk round them', () => {
  const w = createYard({ seed: 9, away: ['guide', 'presenter', 'teacher', 'assembler'] });
  const before = w.agents.filter((a) => a.state === 'away').map((a) => [...a.pos]);
  for (let i = 0; i < 3000; i++) stepYard(w, 0.1);
  const after = w.agents.filter((a) => a.state === 'away').map((a) => [...a.pos]);
  assert.equal(before.length, 4);
  assert.deepEqual(after, before);
});

/* ── V4 §4.4 economy and §4.5 tips ─────────────────────────── */

test('at least 60 tips, in all three languages, each robot teaching its own topic', () => {
  assert.ok(TIPS.length >= 60, `${TIPS.length} tips`);
  assert.equal(TIP_IDS.size, TIPS.length, 'unique ids');
  for (const lang of ['kk', 'ru', 'en']) {
    const texts = TIPS.map((t) => t[lang]);
    assert.ok(texts.every((s) => typeof s === 'string' && s.length >= 20 && s.length <= 220), `${lang}: every tip written, short enough to read aloud`);
    assert.equal(new Set(texts).size, texts.length, `${lang}: no duplicates`);
  }
  // Kazakh texts in Kazakh (its own letters show up), Russian in Cyrillic, English in Latin letters
  assert.ok(TIPS.filter((t) => /[әғқңөұүһі]/i.test(t.kk)).length >= TIPS.length * 0.9, 'kk uses Kazakh letters');
  assert.ok(TIPS.every((t) => /[а-яё]/i.test(t.ru)), 'ru is Cyrillic');
  assert.ok(TIPS.every((t) => !/[а-яёәғқңөұүһі]/i.test(t.en)), 'en has no Cyrillic');
  for (const r of ROSTER) assert.ok(tipsOf(r.id).length >= 6, `${r.id} has ${tipsOf(r.id).length} tips`);
  const byTopic = {};
  for (const t of TIPS) {
    const topic = ROSTER.find((r) => r.id === t.robot).topic;
    byTopic[topic] = (byTopic[topic] ?? 0) + 1;
  }
  for (const topic of ['cyber', 'room', 'posture', 'etiquette', 'facts']) assert.ok(byTopic[topic] >= 6, `${topic}: ${byTopic[topic]}`);
});

test('tips are rate-limited: a click every few seconds, a proximity tip far less often, the same robot not again soon', () => {
  const limiter = createTipLimiter();
  assert.ok(limiter.allow('guard', 'click', 0));
  assert.ok(!limiter.allow('coach', 'click', 1000), 'clicks too close together');
  assert.ok(limiter.allow('coach', 'click', TIP_LIMITS.click + 1));
  assert.ok(!limiter.allow('guide', 'near', TIP_LIMITS.click + 2000), 'a proximity tip right after a click');
  const t = TIP_LIMITS.click + TIP_LIMITS.near + 10;
  assert.ok(limiter.allow('guide', 'near', t));
  assert.ok(!limiter.allow('guide', 'near', t + TIP_LIMITS.near + 1), 'the same robot again by proximity');
  assert.ok(limiter.allow('guide', 'near', t + TIP_LIMITS.nearSameRobot + 1));
  // the next tip of a robot: the ones not heard yet first
  const heard = new Set(tipsOf('coach').slice(0, 3).map((x) => x.id));
  for (let i = 0; i < 20; i++) assert.ok(!heard.has(pickTip('coach', heard, seeded(i)).id));
});

test('coins: earned from XP and tips, spent on items and training; never below zero', () => {
  let s = emptySave();
  assert.equal(coinsEarned(0, s), ECONOMY.start);
  assert.equal(coinsEarned(400, s), ECONOMY.start + 100);
  const bought = buy(s, 0, 'cap');
  assert.ok(bought.ok);
  s = bought.save;
  assert.equal(balance(0, s), ECONOMY.start - itemById('cap').price);
  assert.deepEqual(buy(s, 0, 'cap'), { ok: false, reason: 'owned' });
  assert.deepEqual(buy(s, 0, 'crown'), { ok: false, reason: 'coins' });
  // training: 40, 80, 120, 160 coins; level 5 is the top
  assert.deepEqual([1, 2, 3, 4].map(trainCost), [40, 80, 120, 160]);
  assert.equal(trainedCost(5), 400);
  const rich = 4 * (400 + 500);
  for (let l = 1; l < MAX_LEVEL; l++) {
    const r = train(s, rich, 'coach');
    assert.ok(r.ok && r.level === l + 1);
    s = r.save;
  }
  assert.deepEqual(train(s, rich, 'coach'), { ok: false, reason: 'max' });
  assert.equal(coinsSpent(s), itemById('cap').price + 400);
  // a tip counts once
  const tip = TIPS[0].id;
  s = heardTip(heardTip(s, tip), tip);
  assert.equal(s.tips.length, 1);
  assert.equal(coinsEarned(0, s), ECONOMY.start + ECONOMY.perTip);
});

test('wardrobe: only owned items, in their own slot, at the robot level, on a body that can wear them', () => {
  let s = emptySave();
  s = { ...s, owned: ['cap', 'crown', 'scarf', 'shirt_blue'] };
  assert.equal(canWear(s, 'guide', 'glasses'), 'notOwned');
  assert.equal(canWear(s, 'guide', 'crown'), 'level');
  assert.equal(canWear(s, 'cleaner', 'scarf'), 'cannot', 'the cleaner has no neck');
  assert.equal(canWear(s, 'guide', 'cap'), 'ok');
  s = wear(s, 'guide', 'hat', 'cap');
  s = wear(s, 'guide', 'hat', 'scarf'); // wrong slot: ignored
  assert.deepEqual(s.wear.guide, { hat: 'cap' });
  s = wear(s, 'guide', 'hat', null);
  assert.deepEqual(s.wear.guide, {});
  // every robot body has an anchor for each slot it may wear (the shirt is its colour, no anchor)
  for (const r of ROSTER) {
    const anchors = robotGeometry(r.kind, r.accent).wear;
    for (const slot of WEARABLE[r.id]) if (slot !== 'shirt') assert.ok(anchors[slot], `${r.id} wears ${slot} but has no anchor`);
  }
});

test('a save from a browser is cleaned and may not spend more than it earned', () => {
  const s = normalizeSave({ owned: ['cap', 'nope', 'cap'], levels: { guide: 9, nobody: 3 }, tips: ['x', TIPS[1].id], wear: { guide: { hat: 'cap', face: 'cap' }, nobody: { hat: 'cap' } } });
  assert.deepEqual(s.owned, ['cap']);
  assert.deepEqual(s.levels, { guide: 5 });
  assert.deepEqual(s.tips, [TIPS[1].id]);
  assert.deepEqual(s.wear, { guide: { hat: 'cap' } });
  assert.deepEqual(checkSave(s, 0), { ok: false, reason: 'overspent' }, 'level 5 and a cap cost more than the starting coins');
  assert.ok(checkSave(s, 4 * 2000).ok);
});

test('server: a student save lives on the server and is checked against the server XP', async () => {
  const { openDb, migrate } = await import('../server/db.ts');
  const { createApp } = await import('../server/app.ts');
  const { serverConfig } = await import('../server/env.ts');
  const { createUser } = await import('../server/users.ts');
  const { createServer } = await import('node:http');
  const db = openDb(':memory:');
  migrate(db);
  const app = createApp({ db, config: { ...serverConfig({}), dbFile: ':memory:' }, now: () => Date.now() });
  const server = createServer((req, res) => void app(req, res));
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const password = `T3st-robots-${Math.random().toString(36).slice(2, 10)}`;
    await createUser(db, { login: 'robofan', displayName: 'Robo Fan', role: 'student', password });
    const login = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ login: 'robofan', password }) });
    const { csrfToken } = await login.json();
    const cookie = login.headers.get('set-cookie').split(';')[0];
    const call = (path, method = 'GET', body) =>
      fetch(base + path, { method, headers: { 'content-type': 'application/json', origin: 'http://localhost:5173', cookie, 'x-csrf-token': csrfToken }, body: body ? JSON.stringify(body) : undefined });
    const first = await (await call('/api/robots/me')).json();
    assert.deepEqual(first.save.owned, []);
    assert.equal(first.xp, 0);
    // affordable with the starting coins: a cap and a badge, worn by the guide
    const ok = await call('/api/robots/me', 'PUT', { save: { owned: ['cap', 'badge'], wear: { guide: { hat: 'cap', badge: 'badge' } }, levels: {}, tips: [] } });
    assert.equal(ok.status, 200);
    const again = await (await call('/api/robots/me')).json();
    assert.deepEqual(again.save.wear, { guide: { hat: 'cap', badge: 'badge' } });
    // the crown and four levels are far beyond what this student earned
    const greedy = await call('/api/robots/me', 'PUT', { save: { owned: ['crown'], levels: { coach: 5 } } });
    assert.equal(greedy.status, 409);
    const unchanged = await (await call('/api/robots/me')).json();
    assert.deepEqual(unchanged.save.owned, ['cap', 'badge']);
    // signed out: nothing
    assert.equal((await fetch(base + '/api/robots/me')).status, 401);
  } finally {
    await new Promise((r) => server.close(r));
  }
});
