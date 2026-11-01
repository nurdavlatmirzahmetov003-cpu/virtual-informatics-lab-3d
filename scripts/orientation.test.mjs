/**
 * V4 §2.1: every device on the hero desk faces the person sitting at it.
 *
 * Each model's own front was audited by rendering it from four sides
 * (`npm run models:sides -- <ids>`) and is recorded
 * below as the direction its front points in the source file. The import
 * correction (lib/three/modelFront.ts) must bring that to +Z, and the desk
 * layout must then turn it towards the seat within ±25°.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Euler, Vector3 } from 'three';
import { HERO_LOOKS } from '../src/scenes/DeskScene/hero/looks.ts';
import { HEADSET, KEYBOARD, LAMP, MONITOR, SEAT, SPEAKERS, yawToSeat } from '../src/scenes/DeskScene/layout.ts';
import { MODEL_FRONT, frontRotationOf, modelIdOf } from '../src/lib/three/modelFront.ts';
import { CATALOG } from '../src/data/hardware/catalog.ts';

const LIMIT = (25 * Math.PI) / 180;
const Z = [0, 0, 1];
/** Where each peripheral model's front points in its source file (audited; +Z unless listed). */
const NATIVE_FRONT = {
  'spk-creative-pebble-v3': [1, 0, 0],
  'spk-edifier-r1280db': [0, -1, 0],
};
const AUDITED = ['monitor', 'keyboard', 'mouse', 'headset', 'speakers', 'chair'];

/** The model's front in the world: its native front, the import correction, then the yaw on the desk. */
function forward(modelPath, yaw) {
  const id = modelIdOf(modelPath);
  const v = new Vector3(...(NATIVE_FRONT[id] ?? Z));
  const fix = frontRotationOf(modelPath);
  if (fix) v.applyEuler(new Euler(...fix));
  return v.applyEuler(new Euler(0, yaw, 0));
}

/** Angle between the device's front and the line from it to the seat, on the floor plane. */
function offSeat(position, dir) {
  const want = Math.atan2(SEAT.position[0] - position[0], SEAT.position[2] - position[2]);
  const got = Math.atan2(dir.x, dir.z);
  return Math.abs(Math.atan2(Math.sin(got - want), Math.cos(got - want)));
}

test('the import correction turns every audited model front to +Z, standing upright', () => {
  for (const [id, native] of Object.entries(NATIVE_FRONT)) {
    const v = new Vector3(...native).applyEuler(new Euler(...(MODEL_FRONT[id] ?? [0, 0, 0])));
    assert.ok(v.distanceTo(new Vector3(...Z)) < 1e-6, `${id}: front ends at ${v.toArray().map((n) => n.toFixed(2))}`);
  }
  for (const id of Object.keys(MODEL_FRONT)) assert.ok(id in NATIVE_FRONT, `${id} has a correction but no audited front`);
});

test('every peripheral in the catalog has had its front audited', () => {
  // a new model joins NATIVE_FRONT (or faces +Z already) after a look from four sides
  const known = new Set([
    'mon-asus-va24ehf', 'mon-dell-u2724d', 'mon-asus-xg27acs', 'mon-lg-27gr93u', 'mon-asus-xg27aqmr',
    'kb-logitech-k120', 'kb-logitech-mx-keys-s', 'kb-keychron-k8-pro', 'kb-logitech-pro-x-tkl', 'kb-razer-huntsman-v3-pro-tkl',
    'mouse-logitech-g102', 'mouse-logitech-g305', 'mouse-logitech-g502x-plus', 'mouse-logitech-superlight2', 'mouse-razer-viper-v3-pro',
    'hs-hyperx-cloud-iii', 'hs-steelseries-nova7', 'hs-razer-blackshark-v2-pro', 'hs-logitech-pro-x2',
    'spk-creative-pebble-v3', 'spk-logitech-z407', 'spk-edifier-r1280db',
    'chair-ikea-markus', 'chair-secretlab-titan-evo', 'chair-hm-embody-gaming',
  ]);
  for (const item of CATALOG.filter((h) => AUDITED.includes(h.category) && h.modelPath.startsWith('products/'))) {
    assert.ok(known.has(modelIdOf(item.modelPath)), `${item.id}: look at its model from four sides and record its front`);
  }
});

for (const look of HERO_LOOKS) {
  test(`hero look "${look.id}": speakers, lamp, monitor, keyboard and headset stand face the seat`, () => {
    const { monitor, keyboard, headset, speakers } = look.build;
    const devices = [
      ['monitor', monitor, MONITOR.position, 0],
      ['keyboard', keyboard, KEYBOARD.position, 0],
      ['headset on its stand', headset, HEADSET.position, HEADSET.yaw],
      ['left speaker', speakers, SPEAKERS.left.position, SPEAKERS.left.yaw],
      ['right speaker', speakers, SPEAKERS.right.position, SPEAKERS.right.yaw],
    ];
    for (const [name, product, position, yaw] of devices) {
      assert.ok(product, `${look.id}: no ${name}`);
      const off = offSeat(position, forward(product.modelPath, yaw));
      assert.ok(off <= LIMIT, `${look.id} ${name} (${product.id}) is ${((off * 180) / Math.PI).toFixed(1)}° off the seat`);
    }
    // the lamp is built facing +Z (models/Decor.tsx)
    const lampOff = offSeat(LAMP.position, new Vector3(0, 0, 1).applyEuler(new Euler(0, LAMP.yaw, 0)));
    assert.ok(lampOff <= LIMIT, `lamp is ${((lampOff * 180) / Math.PI).toFixed(1)}° off the seat`);
  });
}

test('speakers stand mirrored about the monitor and toe in a little', () => {
  const { left, right } = SPEAKERS;
  assert.ok(Math.abs(left.position[0] + right.position[0] - 2 * MONITOR.position[0]) < 1e-9, 'same distance either side of the monitor');
  assert.equal(left.position[2], right.position[2]);
  assert.ok(Math.abs(left.yaw + right.yaw) < 1e-9, 'mirrored toe-in');
  // toed in: turned towards the middle, but less than straight at the seat
  assert.ok(left.yaw > 0 && left.yaw < yawToSeat(left.position), `left toe-in ${left.yaw}`);
  assert.ok(right.yaw < 0 && right.yaw > yawToSeat(right.position), `right toe-in ${right.yaw}`);
});
