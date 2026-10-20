/**
 * Hands-on 3D games (0.37): the build, network and fault rules, the referee
 * of the arena runs (moves replayed with the race rules), stars, experience
 * and badges, texts in every language, and a live room of the new kinds.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openDb, migrate } from '../server/db.ts';
import { LiveHub } from '../server/live/hub.ts';
import { createUser } from '../server/users.ts';
import { STEP_IDS, STEPS } from '../src/labs/AssemblyLab/steps.ts';
import { PC_SCENARIO, endsOf, plugProblem, emptyPlugState } from '../src/labs/ConnectLab/index.ts';
import { TEARDOWNS, BUILD_GROUPS } from '../src/data/teardown/teardowns.ts';
import { ARCADE, ARCADE_GAMES, HANDS_ON_GAMES, HANDS_ON_RACE, handsOnFaults, replayHandsOn, scoreRun, starsOf, xpOf } from '../src/labs/Arcade/index.ts';
import { BADGE_IDS, badgesOf, levelOf, totalXp } from '../src/labs/Arcade/badges.ts';
import { applyMove, asMove, buildParts, newRacer, RACE_KINDS, MOVE_TYPES } from '../src/labs/LiveGames/races.ts';
import { NET_PCS, NET_ROUTER, NET_SERVER, NET_SWITCH, networkFrom, networkWorks, routerPorts, startNetwork } from '../src/labs/LiveGames/networkGame.ts';

const locale = (lang) => JSON.parse(readFileSync(new URL(`../src/locales/${lang}.json`, import.meta.url), 'utf8'));
const lookup = (dict, key) => key.split('.').reduce((n, p) => (n && typeof n === 'object' ? n[p] : undefined), dict);
const LANGS = ['kk', 'ru', 'en'];

/** A winning list of moves for each hands-on game. */
function solution(game, seed) {
  if (game === 'phone' || game === 'laptop') return buildParts(game).map((part) => ({ t: 'install', part }));
  if (game === 'pcbuild') {
    const done = [];
    while (done.length < STEP_IDS.length) done.push(STEP_IDS.find((s) => !done.includes(s) && STEPS[s].requires.every((r) => done.includes(r))));
    return done.map((step) => ({ t: 'place', step, at: STEPS[step].target }));
  }
  if (game === 'plug') {
    const moves = [];
    let state = emptyPlugState();
    for (const end of endsOf(PC_SCENARIO)) {
      const port = PC_SCENARIO.ports.find((p) => !plugProblem(PC_SCENARIO, state, end.id, p.id));
      moves.push({ t: 'plug', end: end.id, port: port.id });
      state = { ...state, plugged: { ...state.plugged, [end.id]: port.id } };
    }
    return moves;
  }
  if (game === 'network') {
    const { lan, wan } = routerPorts(seed);
    return [...NET_PCS.map((pc, i) => ({ t: 'cable', a: `${pc}.eth0`, b: `${NET_SWITCH}.p${i + 1}` })), { t: 'cable', a: `${NET_SWITCH}.p8`, b: `${NET_ROUTER}.${lan}` }, { t: 'cable', a: `${NET_ROUTER}.${wan}`, b: `${NET_SERVER}.eth0` }];
  }
  return handsOnFaults('fault', seed).map((cause) => ({ t: 'diagnose', cause }));
}

test('build rules: groups hold every teardown part once; inside a group any order, a later group is too early', () => {
  for (const [device, groups] of Object.entries(BUILD_GROUPS)) {
    assert.deepEqual([...groups.flat()].sort(), [...TEARDOWNS[device].parts].sort(), device);
  }
  let s = newRacer('laptop');
  // the RAM before the board: too early, a mistake
  s = applyMove('laptop', s, { t: 'install', part: 'ram' }, []).state;
  assert.equal(s.mistakes, 1);
  assert.deepEqual(s.built, []);
  s = applyMove('laptop', s, { t: 'install', part: 'motherboard' }, []).state;
  // the three of the second group in any order
  for (const part of ['display_cable', 'cooling', 'speakers']) s = applyMove('laptop', s, { t: 'install', part }, []).state;
  assert.equal(s.built.length, 4);
  assert.equal(applyMove('laptop', s, { t: 'install', part: 'motherboard' }, []).state.mistakes, 1, 'a part already in is ignored, not a mistake');
  assert.equal(applyMove('laptop', s, { t: 'install', part: 'hack' }, []).state.mistakes, 1, 'garbage is refused, not counted');
  for (const part of ['ssd', 'wifi', 'ram', 'battery', 'bottom_cover', 'lid']) s = applyMove('laptop', s, { t: 'install', part }, []).state;
  assert.equal(s.done, true);
  assert.equal(s.progress, 1);
});

test('network: the seed decides the router ports; only a right topology PINGs; cutting a cable is a correction', () => {
  const seen = new Set();
  for (let seed = 0; seed < 40; seed++) {
    const { lan, wan } = routerPorts(seed);
    assert.notEqual(lan, wan);
    seen.add(lan);
  }
  assert.ok(seen.size >= 3, 'the LAN port moves around');
  const seed = 11;
  const { lan, wan } = routerPorts(seed);
  assert.equal(networkWorks(startNetwork(seed)), false);
  // the switch into the server's port: the computers stay cut off
  let s = newRacer('network', seed);
  for (const m of solution('network', seed).slice(0, 3)) s = applyMove('network', s, m, [], seed).state;
  s = applyMove('network', s, { t: 'cable', a: `${NET_SWITCH}.p8`, b: `${NET_ROUTER}.${wan}` }, [], seed).state;
  s = applyMove('network', s, { t: 'cable', a: `${NET_ROUTER}.${lan}`, b: `${NET_SERVER}.eth0` }, [], seed).state;
  assert.equal(s.done, false, 'the router ports swapped: no PING');
  assert.equal(s.progress, 3 / 5);
  // a refused cable (a busy socket) is a mistake
  const busy = applyMove('network', s, { t: 'cable', a: 'PC1.eth0', b: `${NET_SWITCH}.p5` }, [], seed);
  assert.equal(busy.ok, false);
  assert.equal(busy.state.mistakes, 1);
  s = applyMove('network', s, { t: 'cut', end: `${NET_ROUTER}.${wan}` }, [], seed).state;
  s = applyMove('network', s, { t: 'cut', end: `${NET_ROUTER}.${lan}` }, [], seed).state;
  assert.equal(s.mistakes, 2);
  s = applyMove('network', s, { t: 'cable', a: `${NET_SWITCH}.p8`, b: `${NET_ROUTER}.${lan}` }, [], seed).state;
  const last = applyMove('network', s, { t: 'cable', a: `${NET_ROUTER}.${wan}`, b: `${NET_SERVER}.eth0` }, [], seed);
  assert.equal(last.state.done, true);
  assert.equal(last.message.key, 'games3d.network.works');
  // the live room rebuilds the same network from the snapshot's cable list
  const links = last.state.net.links.map((l) => [`${l.a.device}.${l.a.port}`, `${l.b.device}.${l.b.port}`]);
  assert.equal(networkWorks(networkFrom(seed, links)), true);
  assert.equal(applyMove('network', newRacer('network', seed), { t: 'cable', a: 'PC9.eth0', b: 'SW1.p1' }, [], seed).ok, false);
});

test('moves are checked for shape; each race takes only its own moves', () => {
  assert.equal(asMove({ t: 'install', part: 'x'.repeat(41) }), null);
  assert.equal(asMove({ t: 'cable', a: 'PC1.eth0' }), null);
  assert.equal(asMove('install'), null);
  assert.deepEqual(asMove({ t: 'place', step: 'cpu', at: null, extra: 1 }), { t: 'place', step: 'cpu', at: null });
  for (const kind of RACE_KINDS) assert.ok(MOVE_TYPES[kind].length > 0, kind);
});

test('arena referee: every hands-on game is won by its solution, faster and cleaner earns more, junk does not pay', () => {
  const seed = 4242;
  for (const game of HANDS_ON_GAMES) {
    const moves = solution(game, seed);
    assert.equal(replayHandsOn(game, seed, moves).state.done, true, `${game}: the solution finishes the job`);
    const spec = ARCADE[game];
    const quick = scoreRun(game, seed, moves, spec.seconds * 300);
    assert.ok(quick.ok, game);
    assert.equal(quick.result.correct, 100);
    assert.equal(quick.result.mistakes, 0);
    assert.equal(quick.result.stars, 3, `${game}: clean and fast is three stars`);
    const slow = scoreRun(game, seed, moves, spec.seconds * 900);
    assert.ok(slow.ok && slow.result.score < quick.result.score, `${game}: slower scores less`);
    assert.ok(slow.result.stars < 3);
    assert.deepEqual(scoreRun(game, seed, moves, 100), { ok: false, reason: 'tooFast' }, game);
    assert.deepEqual(scoreRun(game, seed, moves, spec.seconds * 1000 + 60_000), { ok: false, reason: 'expired' }, game);
    assert.deepEqual(scoreRun(game, seed, new Array(spec.rounds + 1).fill({ t: 'x' }), 30_000), { ok: false, reason: 'badAnswers' }, game);
    // half the job, then the clock ran out
    const half = scoreRun(game, seed, moves.slice(0, Math.ceil(moves.length / 2)), spec.seconds * 1000);
    assert.ok(half.ok && half.result.score < 500 && half.result.stars === 0, `${game}: unfinished`);
    assert.ok(xpOf(quick.result) > xpOf(half.result));
  }
  // junk moves are skipped and cost nothing — but they do not finish anything either
  const junk = scoreRun('phone', seed, [{ t: 'install', part: 'hack' }, 7, null, { t: 'plug', end: 'x', port: 'y' }], 20_000);
  assert.ok(junk.ok);
  assert.equal(junk.result.mistakes, 0);
  assert.equal(junk.result.score, 0);
  // the fault rounds are the seed's, so a friend's challenge gets the same five computers
  assert.deepEqual(handsOnFaults('fault', 99), handsOnFaults('fault', 99));
  assert.equal(HANDS_ON_RACE.pcbuild, 'assembly');
});

test('stars of the quick games follow the share of right answers', () => {
  assert.equal(starsOf('device', { score: 0, correct: 9, total: 10, mistakes: 1 }, 30_000), 3);
  assert.equal(starsOf('device', { score: 0, correct: 3, total: 10, mistakes: 7 }, 30_000), 0);
  assert.equal(starsOf('binary', { score: 0, correct: 30, total: 31, mistakes: 1 }, 60_000), 3);
  assert.equal(starsOf('binary', { score: 0, correct: 5, total: 5, mistakes: 0 }, 60_000), 0, 'five right in a minute is a start, not a star');
});

test('experience, level and badges come from the best scores', () => {
  assert.equal(totalXp({}), 0);
  assert.deepEqual(levelOf(0), { level: 1, into: 0, toNext: 300 });
  assert.equal(levelOf(650).level, 3);
  assert.deepEqual(badgesOf({}), []);
  assert.deepEqual(badgesOf({ phone: 1500, laptop: 990 }), [], 'the laptop is not finished');
  assert.deepEqual(badgesOf({ phone: 1500, laptop: 1200, pcbuild: 1900 }), ['builder', 'engineer', 'champion']);
  const all = Object.fromEntries(ARCADE_GAMES.map((g) => [g, 1000]));
  assert.ok(badgesOf(all).includes('allRounder'));
  assert.equal(totalXp(all), 100 * ARCADE_GAMES.length);
});

test('every text of the 3D games exists in kk, ru and en', () => {
  const keys = [
    ...HANDS_ON_GAMES.flatMap((g) => [`arcade.games.${g}.title`, `arcade.games.${g}.desc`]),
    ...BADGE_IDS.flatMap((b) => [`games3d.badges.${b}.name`, `games3d.badges.${b}.how`]),
    ...['ram', 'gpu', 'monitor', 'storage', 'cooler', 'psu'].map((f) => `games3d.fault.suspects.${f}`),
    ...['phone', 'laptop', 'network'].flatMap((g) => [`live.kinds.${g}`, `live.kindHints.${g}`]),
    'games3d.build.early',
    'games3d.network.refused',
    'games3d.network.works',
    'games3d.combo',
    'games3d.xp',
    'games3d.level.xp',
  ];
  for (const lang of LANGS) {
    const d = locale(lang);
    for (const key of keys) assert.equal(typeof lookup(d, key), 'string', `${lang}: ${key}`);
    for (const p of TEARDOWNS.smartphone.parts) assert.equal(typeof lookup(d, `teardown.smartphone.parts.${p}.name`), 'string', `${lang}: phone ${p}`);
  }
  // Kazakh texts are Kazakh: no Russian-only letters
  const kk = JSON.stringify(locale('kk').games3d);
  assert.ok(!/[щъэё]/i.test(kk), 'no Russian-only letters in the Kazakh game texts');
});

// ── a live room of a new kind ──
test('live «Build the phone» and «Build the network» races: moves go through the race rules, the snapshot carries the state', async () => {
  const db = openDb(':memory:');
  migrate(db);
  let clock = 1_000_000;
  const hub = new LiveHub({ db, now: () => clock });
  const teacher = await createUser(db, { login: 't.g3d', displayName: 'Мұғалім', role: 'teacher', password: `T3st-${Math.random().toString(36).slice(2)}` });
  const student = await createUser(db, { login: 's.g3d', displayName: 'Ару', role: 'student', password: `T3st-${Math.random().toString(36).slice(2)}` });
  const user = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  let n = 0;
  const socket = () => {
    const c = { id: ++n, open: true, got: [], handlers: [], send: (d) => c.got.push(d), close: () => (c.open = false), onMessage: (fn) => c.handlers.push(fn), onClose: () => undefined };
    c.say = (m) => c.handlers.forEach((fn) => fn(m));
    c.last = (type) => [...c.got].reverse().find((m) => m.t === type);
    return c;
  };
  for (const kind of ['phone', 'network']) {
    const room = hub.create(user(teacher.id), { kind, title: kind, minutes: 3 });
    const host = socket();
    const kid = socket();
    hub.connect(user(teacher.id), room.code, host);
    hub.connect(user(student.id), room.code, kid);
    host.say({ t: 'start' });
    clock += 4000;
    const seed = kid.last('state').room.race.seed;
    assert.equal(typeof seed, 'number');
    // a move of another race is not a move here
    kid.say({ t: 'place', step: 'cpu', at: 'socket' });
    assert.equal(kid.last('state').room.race.me.mistakes, 0);
    const moves = kind === 'phone' ? buildParts('phone').map((part) => ({ t: 'install', part })) : solution('network', seed);
    // one mistake first
    kid.say(kind === 'phone' ? { t: 'install', part: 'sim_tray' } : { t: 'cable', a: 'PC1.eth0', b: 'PC2.eth0' });
    clock += 2500;
    if (kind === 'network') kid.say({ t: 'cut', end: 'PC1.eth0' });
    for (const m of moves) {
      clock += 2500;
      kid.say(m);
    }
    const me = kid.last('state').room.race.me;
    assert.equal(kid.last('state').room.status, 'finished', `${kind}: everyone done ends the race`);
    assert.equal(me.done, true);
    assert.ok(me.mistakes >= 1);
    if (kind === 'phone') assert.deepEqual(me.built, buildParts('phone'));
    else assert.equal(me.links.length, 5);
    const stored = db.prepare('SELECT kind FROM live_sessions WHERE title = ?').get(kind);
    assert.equal(stored.kind, kind === 'phone' ? 'assembly' : 'connect', 'stored under the kind the table allows');
    const detail = JSON.parse(db.prepare('SELECT detail FROM live_results ORDER BY rowid DESC LIMIT 1').get().detail);
    assert.equal(detail.kind, kind);
  }
});
