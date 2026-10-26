/**
 * V4 §2.3: the life around the home desk stays in place — nothing on the
 * desk overlaps (the PC, speakers, lamp, headset stand, Bit, the plant, the
 * mat), everything stands on the desk top, the presenter robot keeps clear of
 * the desk, the wall and the shelf above it, and its speech bubble says
 * something real about every look in every language.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { HERO_LOOKS } from '../src/scenes/DeskScene/hero/looks.ts';
import { presenterLine } from '../src/scenes/DeskScene/hero/presenter.ts';
import { DESK, DESK_BIT, DESK_PLANT, GAMING_DESK, HEADSET, LAMP, MOUSE, PC, PRESENTER, SPEAKERS } from '../src/scenes/DeskScene/layout.ts';
import { deskTopOf, matOn, pcShiftOn } from '../src/scenes/DeskScene/deskFit.ts';
import { caseMountsFor } from '../src/scenes/DeskScene/pc/mounts.ts';
import { modelIdOf } from '../src/lib/three/modelFront.ts';
import { loadLanguage, translate } from '../src/lib/i18n/index.ts';

/** Footprints on the desk (m): width × depth once standing the right way (audited with npm run models:sides). */
const SPEAKER_FOOT = { 'spk-creative-pebble-v3': [0.12, 0.116], 'spk-logitech-z407': [0.08, 0.09], 'spk-edifier-r1280db': [0.146, 0.234] };
const MARGIN = 0.01;

/** A circle on the desk top: [x, z, r]. */
const circle = (p, r) => [p[0], p[2], r];
const halfDiagonal = ([w, d]) => Math.hypot(w / 2, d / 2);

/** The PC's footprint as a rectangle [minX, minZ, maxX, maxZ], the way SetupItems places it. */
function pcRect(caseId) {
  const shell = caseMountsFor(caseId).shell;
  const half = [(shell.max[0] - shell.min[0]) / 2, (shell.max[2] - shell.min[2]) / 2];
  const [sx, sz] = pcShiftOn(deskTopOf(null), half);
  const x = PC.position[0] + sx;
  const z = PC.position[2] + sz;
  return [x + shell.min[0], z + shell.min[2], x + shell.max[0], z + shell.max[2]];
}

const circleOffRect = ([cx, cz, r], [x0, z0, x1, z1]) => Math.hypot(Math.max(x0 - cx, 0, cx - x1), Math.max(z0 - cz, 0, cz - z1)) - r;
const circleOffCircle = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]) - a[2] - b[2];

for (const look of HERO_LOOKS) {
  test(`hero look "${look.id}": nothing on the desk overlaps and everything stands on it`, () => {
    const speakers = look.build.speakers;
    const foot = SPEAKER_FOOT[modelIdOf(speakers.modelPath)];
    assert.ok(foot, `${speakers.id}: no audited footprint`);
    const items = {
      'left speaker': circle(SPEAKERS.left.position, halfDiagonal(foot)),
      'right speaker': circle(SPEAKERS.right.position, halfDiagonal(foot)),
      'lamp base': circle(LAMP.position, 0.076),
      'headset on its stand': circle(HEADSET.position, 0.095),
      'Bit figure': circle(DESK_BIT.position, 0.22 * DESK_BIT.scale + 0.01),
      'desk plant': circle(DESK_PLANT, 0.055),
      mouse: circle(MOUSE.position, 0.07),
    };
    const names = Object.keys(items);
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const gap = circleOffCircle(items[names[i]], items[names[j]]);
        assert.ok(gap >= 0, `${look.id}: ${names[i]} and ${names[j]} overlap by ${(-gap * 100).toFixed(1)} cm`);
      }
    }
    const pc = pcRect(look.build.case?.id);
    for (const name of names) {
      const gap = circleOffRect(items[name], pc);
      assert.ok(gap >= 0, `${look.id}: ${name} runs ${(-gap * 100).toFixed(1)} cm into the PC`);
    }
    // the mat lies in front of everything that stands on the desk except Bit, the mouse and the keyboard
    const mat = matOn(deskTopOf(null));
    const matRect = [mat.position[0] - mat.size[0] / 2, mat.position[2] - mat.size[1] / 2, mat.position[0] + mat.size[0] / 2, mat.position[2] + mat.size[1] / 2];
    for (const name of ['left speaker', 'right speaker', 'lamp base', 'headset on its stand', 'Bit figure', 'desk plant']) {
      assert.ok(circleOffRect(items[name], matRect) >= 0, `${look.id}: ${name} stands on the desk mat`);
    }
    for (const name of names) {
      const [x, z, r] = items[name];
      assert.ok(Math.abs(x) + r <= DESK.width / 2 - MARGIN && Math.abs(z) + r <= DESK.depth / 2 - MARGIN, `${look.id}: ${name} hangs over the desk edge`);
    }
  });
}

test("the presenter stands beside the desk's left front corner, clear of the desk, the lamp and the headset", () => {
  const s = PRESENTER.scale;
  const [x, , z] = PRESENTER.position;
  // presenter body: a sphere of radius 0.2 scaled [1, 1.2, 0.86], arms reach 0.3 out (robots/robotKit.ts)
  const reach = 0.3 * s;
  assert.ok(x + reach <= -DESK.width / 2 - 0.02, `its right side is ${((x + reach + DESK.width / 2) * 100).toFixed(1)} cm into the desk`);
  assert.ok(Math.abs(z) <= DESK.depth / 2 + 0.2, 'beside the desk, not in front of it');
  assert.ok(z > 0, 'at the front half of the desk');
  assert.ok(Math.hypot(x - LAMP.position[0], z - LAMP.position[2]) > reach + 0.1, 'clear of the lamp');
  assert.ok(Math.hypot(x - HEADSET.position[0], z - HEADSET.position[2]) > reach + 0.1, 'clear of the headset stand');
  assert.ok(PRESENTER.yaw > 0, 'half turned to the desk');
});

test('the gaming corner stands right of the main desk with room between them', () => {
  const [cx] = GAMING_DESK.center;
  const [w] = GAMING_DESK.size;
  assert.ok(cx - w / 2 >= DESK.width / 2 + 0.3, 'room for the floor plant between the desks');
});

for (const lang of ['kk', 'ru', 'en']) {
  test(`speech bubble (${lang}) names every look's graphics card, memory and processor`, async () => {
    await loadLanguage(lang);
    const t = (key, vars) => translate(lang, key, vars);
    for (const look of HERO_LOOKS) {
      const line = presenterLine(t, look);
      assert.ok(!line.includes(', —') && !line.includes('{'), `${look.id}: "${line}"`);
      if (lang !== 'kk') assert.ok(line !== presenterLine((key, vars) => translate('kk', key, vars), look), `${look.id}: not translated`);
      assert.ok(line.includes(look.build.gpu.model) && line.includes(look.build.cpu.model), `${look.id}: "${line}"`);
      assert.match(line, /\d+ (ГБ|GB)/, `${look.id}: memory size in "${line}"`);
    }
  });
}
