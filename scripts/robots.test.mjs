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
