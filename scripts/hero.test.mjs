/**
 * Living home hero (0.37): the assembly timing and the three looks.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { HERO_ORDER, HERO_TIMING, LOOK_SECONDS, easeOutBack, lookAt, piecePresence } from '../src/scenes/DeskScene/hero/heroCycle.ts';
import { HERO_LOOKS } from '../src/scenes/DeskScene/hero/looks.ts';

const DEVICES = ['case', 'monitor', 'keyboard', 'mouse', 'headset', 'speakers'];
const INSIDE = ['cpu', 'motherboard', 'ram', 'gpu', 'cooling', 'psu', 'ssd'];
const arrived = HERO_TIMING.stagger * (HERO_ORDER.length - 1) + HERO_TIMING.fly;

test('pieces arrive one after another and are all in place for the hold', () => {
  assert.equal(piecePresence(0, 0), 0);
  for (let i = 1; i < HERO_ORDER.length; i++) {
    const t = i * HERO_TIMING.stagger - 0.01;
    assert.equal(piecePresence(t, i), 0, `${HERO_ORDER[i]} is not there yet`);
    assert.ok(piecePresence(t, i - 1) > 0, `${HERO_ORDER[i - 1]} is on its way`);
  }
  for (let i = 0; i < HERO_ORDER.length; i++) assert.ok(Math.abs(piecePresence(arrived + 1, i) - 1) < 1e-9, HERO_ORDER[i]);
});

test('a landing bounces a little but never far', () => {
  assert.equal(easeOutBack(0), 0);
  assert.ok(Math.abs(easeOutBack(1) - 1) < 1e-9);
  let peak = 0;
  for (let x = 0; x <= 1; x += 0.01) peak = Math.max(peak, easeOutBack(x));
  assert.ok(peak > 1 && peak < 1.15, `peak ${peak}`);
});

test('the setup leaves in reverse order and the desk is empty before the next look', () => {
  const leaving = arrived + HERO_TIMING.hold;
  const last = HERO_ORDER.length - 1;
  const early = leaving + HERO_TIMING.leave * 0.5;
  assert.ok(piecePresence(early, last) < 1, 'last piece in leaves first');
  assert.equal(piecePresence(early, 0), 1, 'first piece in is still there');
  const empty = LOOK_SECONDS - HERO_TIMING.pause / 2;
  for (let i = 0; i < HERO_ORDER.length; i++) assert.equal(piecePresence(empty, i), 0, HERO_ORDER[i]);
});

test('the clock walks through the looks and wraps', () => {
  assert.deepEqual(lookAt(0, 3), { look: 0, t: 0 });
  assert.equal(lookAt(LOOK_SECONDS + 1, 3).look, 1);
  assert.equal(lookAt(LOOK_SECONDS * 3 + 0.5, 3).look, 0);
  assert.ok(Math.abs(lookAt(LOOK_SECONDS * 2 + 2, 3).t - 2) < 1e-9);
});

test('three looks: white first, then black and RGB', () => {
  assert.deepEqual(HERO_LOOKS.map((l) => l.id), ['white', 'black', 'rgb']);
  const white = HERO_LOOKS[0];
  assert.equal(white.finish.case, 'white');
  assert.equal(white.finish.peripherals, 'white');
  assert.equal(white.desk, 'white');
  assert.ok(white.build.case?.colors.includes('white'), 'the white look has a case that comes in white');
  assert.notEqual(HERO_LOOKS[2].finish.rgb, 'off', 'the RGB look lights up');
});

test('every look is a complete setup of real catalog products', () => {
  for (const l of HERO_LOOKS) {
    for (const c of [...DEVICES, ...INSIDE]) assert.ok(l.build[c], `${l.id} has a ${c}`);
    for (const c of DEVICES) assert.match(l.build[c].modelPath, /products\/.+\.glb$/, `${l.id} ${c} has its own model`);
  }
});

test('the devices change from look to look; the parts inside stay the same', () => {
  for (const c of DEVICES) {
    const ids = new Set(HERO_LOOKS.map((l) => l.build[c].id));
    if (c !== 'speakers' || ids.size > 1) assert.equal(ids.size, HERO_LOOKS.length, `${c}: ${[...ids].join(', ')}`);
  }
  for (const c of INSIDE) assert.equal(new Set(HERO_LOOKS.map((l) => l.build[c].id)).size, 1, c);
});

/** Draw calls of a GLB: primitives of every mesh, times the nodes that use it. */
function drawCalls(modelPath) {
  const b = readFileSync(new URL(`../public/assets/models/${modelPath}`, import.meta.url));
  const json = JSON.parse(b.toString('utf8', 20, 20 + b.readUInt32LE(12)));
  const uses = {};
  for (const n of json.nodes ?? []) if (n.mesh !== undefined) uses[n.mesh] = (uses[n.mesh] ?? 0) + 1;
  return (json.meshes ?? []).reduce((sum, m, i) => sum + m.primitives.length * (uses[i] ?? 0), 0);
}

test('each look stays within the draw-call budget of the old home setup', () => {
  // the 0.36 home devices cost 34 calls (monitor 3, keyboard 2, mouse 8, speakers 2×4, headset 4, case 9)
  for (const l of HERO_LOOKS) {
    const calls = DEVICES.reduce((sum, c) => sum + drawCalls(l.build[c].modelPath) * (c === 'speakers' ? 2 : 1), 0);
    assert.ok(calls <= 34, `${l.id}: ${calls} calls`);
  }
});
