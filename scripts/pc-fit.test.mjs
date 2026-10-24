/**
 * Every catalog case × every catalog part (0.37): each part's bounding box lies
 * inside the case, the PSU stands on the floor under the shroud, the 2.5″ drive
 * on the shroud, and no two parts intersect. Boxes come from the real GLB files
 * (scripts/lib/glbBounds.mjs) placed with the same fits the scene uses.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Group, Vector3 } from 'three';
import { loadGlbBounds } from './lib/glbBounds.mjs';
import { fitModel } from '../src/lib/three/fit.ts';
import { CASE_INTERIORS, caseFit, caseInterior, driveBay, fanFit, frontFans, productFits, psuFit, rearFanZ, sataFitFor } from '../src/scenes/DeskScene/pc/fits.ts';
import { FAN, FRONT_FANS, MB, PSU, RAM } from '../src/scenes/DeskScene/pc/constants.ts';
import { PARTS } from '../src/scenes/DeskScene/pc/parts.ts';
import { CATALOG } from '../src/data/hardware/catalog.ts';
import { BITLAB_AERO } from '../src/data/hardware/house.ts';

const MODELS = new URL('../public/assets/models/', import.meta.url);
const file = (p) => new URL(p, MODELS);
const anchor = Object.fromEntries(PARTS.map((p) => [p.id, new Vector3(...p.anchor)]));
const own = (p) => /^products\/[^/]+\.glb$/.test(p.modelPath);
const in_ = (cat) => CATALOG.filter((p) => p.category === cat && own(p));
const cases = [...in_('case'), BITLAB_AERO];
/** Air coolers have their own model; liquid coolers are drawn procedurally (radiator at the top). */
const coolers = in_('cooling').filter((p) => !p.compatibility.radiatorMm);
const MM = 0.001;

const cache = new Map();
const bounds = (path) => {
  if (!cache.has(path)) cache.set(path, loadGlbBounds(file(path)));
  return cache.get(path).clone();
};
/** Case-local box of a model placed at `at` with `fit`, plus extra copies at `copies` offsets. */
function place(path, fit, at, copies = [new Vector3()]) {
  const box = new Box3();
  for (const c of copies) {
    const g = new Group();
    g.position.copy(at).add(c);
    g.add(fitModel([bounds(path)], fit, path));
    g.updateMatrixWorld(true);
    box.union(new Box3().setFromObject(g));
  }
  return box;
}
const overlap = (a, b) => {
  const i = a.clone().intersect(b);
  return i.isEmpty() ? 0 : Math.min(i.max.x - i.min.x, i.max.y - i.min.y, i.max.z - i.min.z);
};
const fmt = (b) => `[${b.min.toArray().map((v) => v.toFixed(3))}]…[${b.max.toArray().map((v) => v.toFixed(3))}]`;

function caseBox(c) {
  return new Box3().setFromObject(fitModel([bounds(c.modelPath)], caseFit(c.id), c.id));
}

/** Boxes of every part product inside case `c`. */
function partsIn(c) {
  const inside = caseInterior(c.id);
  const out = { boards: {}, cpus: {}, coolers: {}, rams: {}, gpus: {}, ssds: {}, psus: {} };
  for (const p of in_('motherboard')) out.boards[p.id] = place(p.modelPath, productFits.motherboard, anchor.motherboard);
  for (const p of in_('cpu')) out.cpus[p.id] = place(p.modelPath, productFits.cpu, anchor.cpu);
  for (const p of coolers) out.coolers[p.id] = place(p.modelPath, productFits.cooler, anchor.cooler);
  for (const p of in_('ram')) {
    const count = Number(p.model.match(/\((\d+)\s*[×x]/)?.[1] ?? 2);
    const slots = Array.from({ length: Math.min(4, count) }, (_, i) => new Vector3(0, 0, RAM.pitch * (count === 2 ? i * 2 + 1 : i)));
    out.rams[p.id] = place(p.modelPath, productFits.ram, anchor.ram, slots);
  }
  for (const p of in_('gpu')) out.gpus[p.id] = place(p.modelPath, productFits.gpu, anchor.gpu);
  for (const p of in_('ssd')) out.ssds[p.id] = place(p.modelPath, /SATA/.test(p.model) ? sataFitFor(inside) : productFits.ssd, anchor.ssd);
  for (const p of in_('psu')) out.psus[p.id] = place(p.modelPath, psuFit(inside, PSU.y, true), anchor.psu);
  const fans = frontFans(inside);
  out.fans = place('hardware/fan_frame.glb', fanFit, anchor.fans, fans.ys.map((y) => new Vector3(0, y, fans.z - FRONT_FANS.z)));
  const rz = rearFanZ(inside);
  out.rearFan = new Box3(new Vector3(-FAN / 2, MB.y + 0.06 - FAN / 2, rz - 0.0125), new Vector3(FAN / 2, MB.y + 0.06 + FAN / 2, rz + 0.0125));
  return out;
}

test('every catalog case has a measured interior', () => {
  for (const c of cases) assert.ok(CASE_INTERIORS[c.id], `${c.id}: add its interior to CASE_INTERIORS (fits.ts)`);
});

for (const c of cases) {
  test(`${c.id}: every part stays inside the case and the PSU stands on its floor`, () => {
    const shell = caseBox(c);
    const inside = caseInterior(c.id);
    const room = new Box3(new Vector3(shell.min.x, inside.floor, inside.rear), new Vector3(MB.x + 0.006, inside.top, inside.front));
    const parts = partsIn(c);
    const errors = [];
    // the GPU bracket and the PSU's back mount in the rear-panel cutouts: they may reach the shell's back face
    const check = (name, box, rear = room.min.z) => {
      const slack = 2 * MM;
      if (box.min.x < room.min.x - slack || box.max.x > room.max.x + slack || box.min.y < room.min.y - slack || box.max.y > room.max.y + slack || box.min.z < rear - slack || box.max.z > room.max.z + slack)
        errors.push(`${name} ${fmt(box)} leaves the case ${fmt(room)}`);
    };
    for (const group of ['boards', 'cpus', 'coolers', 'rams', 'gpus', 'ssds', 'psus']) for (const [id, box] of Object.entries(parts[group])) check(id, box, group === 'gpus' || group === 'psus' ? shell.min.z : room.min.z);
    check('front fans', parts.fans);
    check('rear fan', parts.rearFan);
    for (const [id, box] of Object.entries(parts.psus)) {
      assert.ok(Math.abs(box.min.y - inside.floor) < 3 * MM, `${c.id}/${id}: PSU bottom ${box.min.y.toFixed(3)} is not on the floor ${inside.floor}`);
      if (inside.shroud) assert.ok(box.max.y <= inside.shroud.top + MM, `${c.id}/${id}: PSU top ${box.max.y.toFixed(3)} rises through the shroud ${inside.shroud.top}`);
    }
    for (const p of in_('ssd').filter((x) => /SATA/.test(x.model))) {
      const id = p.id;
      const box = parts.ssds[id];
      const rest = inside.shroud?.top ?? inside.floor;
      assert.ok(Math.abs(box.min.y - rest) < 3 * MM, `${c.id}/${id}: drive at ${box.min.y.toFixed(3)} does not lie on the shroud ${rest}`);
      if (inside.shroud) assert.ok(box.min.z >= inside.shroud.z[0] && box.max.z <= inside.shroud.z[1], `${c.id}/${id}: drive ${box.min.z.toFixed(3)}…${box.max.z.toFixed(3)} overhangs the shroud ${inside.shroud.z}`);
    }
    // the Assembly Lab's 3.5″ HDD (dev-hdd: 102 × 26 × 147 mm, standing on y = 0)
    const bay = new Vector3(...driveBay(inside));
    const hdd = place('products/dev-hdd.glb', undefined, bay);
    check('lab HDD', hdd);
    if (inside.shroud) assert.ok(hdd.min.z >= inside.shroud.z[0] && hdd.max.z <= inside.shroud.z[1] && Math.abs(hdd.min.y - inside.shroud.top) < 3 * MM, `${c.id}: lab HDD ${fmt(hdd)} is not on the shroud`);
    for (const [g, gb] of Object.entries(parts.gpus)) if (overlap(gb, hdd) > MM) errors.push(`lab HDD × ${g}`);
    if (overlap(parts.fans, hdd) > MM) errors.push('lab HDD × front fans');
    assert.deepEqual(errors, []);
  });

  test(`${c.id}: no two parts intersect in any build`, () => {
    const parts = partsIn(c);
    const shroud = caseInterior(c.id).shroud;
    const errors = new Set();
    const hit = (a, an, b, bn, tol = MM) => {
      const o = overlap(a, b);
      if (o > tol) errors.add(`${an} × ${bn}: ${(o * 1000).toFixed(1)} mm`);
    };
    // parts above the shroud must not dip into it
    for (const [id, box] of [...Object.entries(parts.gpus), ...Object.entries(parts.coolers), ['front fans', parts.fans]]) if (shroud && box.min.y < shroud.top - MM && box.max.z > shroud.z[0] && box.min.z < shroud.z[1]) errors.add(`${id} dips into the PSU shroud (${box.min.y.toFixed(3)} < ${shroud.top})`);
    for (const [g, gb] of Object.entries(parts.gpus)) {
      for (const [k, kb] of Object.entries(parts.coolers)) hit(gb, g, kb, k);
      for (const [r, rb] of Object.entries(parts.rams)) hit(gb, g, rb, r);
      for (const [p, pb] of Object.entries(parts.psus)) hit(gb, g, pb, p);
      for (const [s, sb] of Object.entries(parts.ssds)) hit(gb, g, sb, s, 3 * MM);
      hit(gb, g, parts.fans, 'front fans');
      hit(gb, g, parts.rearFan, 'rear fan');
    }
    for (const [k, kb] of Object.entries(parts.coolers)) {
      hit(kb, k, parts.fans, 'front fans');
      hit(kb, k, parts.rearFan, 'rear fan');
    }
    for (const [p, pb] of Object.entries(parts.psus)) for (const [s, sb] of Object.entries(parts.ssds)) hit(pb, p, sb, s);
    for (const [r, rb] of Object.entries(parts.rams)) hit(rb, r, parts.rearFan, 'rear fan');
    hit(parts.fans, 'front fans', parts.rearFan, 'rear fan');
    assert.deepEqual([...errors], []);
  });
}
