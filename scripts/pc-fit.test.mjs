/**
 * The mounting system against every catalog combination (V4 §1.2, §1.5):
 * each part's attach anchor lies on its target, every part stays inside its
 * case, the cooler sits on the CPU, a card's bracket reaches the case's slot
 * plane, the PSU stands in its bay, and no two parts intersect. Boxes come
 * from the real GLB files (scripts/lib/glbBounds.mjs), so the generated mount
 * data is checked against the models too.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { Box3, Group, Vector3 } from 'three';
import { loadGlbBounds } from './lib/glbBounds.mjs';
import { fitModel } from '../src/lib/three/fit.ts';
import { CASE_MOUNTS, hddBay } from '../src/scenes/DeskScene/pc/caseMounts.ts';
import { boxOf, caseMountsFor, entryPaths, geometryOf, installBuild, installedBoxes, isIntakeFan, ON_BOARD, pathOffset, SEAT, stickCount } from '../src/scenes/DeskScene/pc/mounts.ts';
import { INSTALL_ORDER } from '../src/scenes/SetupStudio/assembly/assemblyRig.ts';
import { CATALOG } from '../src/data/hardware/catalog.ts';
import { HOUSE_PARTS } from '../src/data/hardware/house.ts';

const root = path.resolve(import.meta.dirname, '..');
const MODELS = new URL('../public/assets/models/', import.meta.url);
const MM = 0.001;
const own = (p) => /^products\/[^/]+\.glb$/.test(p.modelPath);
/** Catalog products plus BitLab's own parts (the showcase build): every one meets every other. */
const in_ = (cat) => [...CATALOG, ...HOUSE_PARTS].filter((p) => p.category === cat && own(p));
const cases = in_('case');
const boards = in_('motherboard');
const cpus = in_('cpu');
const coolers = [...CATALOG, ...HOUSE_PARTS].filter((p) => p.category === 'cooling');
const rams = in_('ram');
const gpus = in_('gpu');
const ssds = in_('ssd');
const psus = in_('psu');
const v = (a) => new Vector3(a[0], a[1], a[2]);
const B = (b) => new Box3(v(b.min), v(b.max));
const fmt = (b) => `[${b.min.toArray().map((x) => x.toFixed(3))}]…[${b.max.toArray().map((x) => x.toFixed(3))}]`;
const overlap = (a, b) => {
  const i = a.clone().intersect(b);
  return i.isEmpty() ? 0 : Math.min(i.max.x - i.min.x, i.max.y - i.min.y, i.max.z - i.min.z);
};

test('mount data is generated from the current models', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts/extract-mounts.mjs'), '--check'], { stdio: 'pipe' });
});

test('every catalog case has its own mounts', () => {
  for (const c of cases) assert.ok(CASE_MOUNTS[c.id], `${c.id}: add its mounts (caseMounts.ts / caseDesigns.ts)`);
});

test('every part model has measured mount geometry', () => {
  for (const p of [...boards, ...cpus, ...rams, ...gpus, ...ssds, ...psus, ...coolers.filter((c) => own(c))]) assert.ok(geometryOf(p.modelPath), `${p.id}: run node scripts/extract-mounts.mjs`);
  for (const b of boards) {
    const a = geometryOf(b.modelPath).anchors;
    for (const k of ['socket_cpu_1', 'slot_dimm_1', 'slot_dimm_2', 'slot_dimm_3', 'slot_dimm_4', 'slot_pcie_x16_1', 'slot_m2_1', 'header_24pin_1', 'header_eps_8pin_1']) assert.ok(a[k], `${b.id}: anchor ${k}`);
  }
});

test('measured sizes match the GLB bounds the scene fits (ModelLoader centres the rotated box)', () => {
  for (const p of [...boards, ...cpus, ...rams, ...gpus, ...psus, ...coolers.filter((c) => own(c))]) {
    const g = geometryOf(p.modelPath);
    const flat = p.category === 'psu';
    const fitted = fitModel([loadGlbBounds(new URL(p.modelPath, MODELS))], flat ? { axis: 0 } : { axis: 1, rotation: ON_BOARD }, p.id);
    const box = new Box3().setFromObject(fitted);
    const size = box.getSize(new Vector3());
    const centre = box.getCenter(new Vector3());
    for (const k of [0, 1, 2]) assert.ok(Math.abs(size.getComponent(k) - g.size[k]) < 0.5 * MM, `${p.id}: size ${size.toArray()} vs ${g.size}`);
    assert.ok(centre.length() < 0.5 * MM, `${p.id}: fitted model not centred (${centre.toArray()})`);
  }
});

/**
 * Every case × board × cooler × card × PSU combination (V4 §1.5); CPU, RAM and
 * SSD rotate through the catalog alongside, so each of them meets every case
 * and board too.
 */
function* builds(c) {
  let i = 0;
  for (const motherboard of boards)
    for (const cooling of coolers)
      for (const gpu of gpus)
        for (const psu of psus) {
          yield { case: c, motherboard, cpu: cpus[i % cpus.length], cooling, ram: rams[i % rams.length], gpu, ssd: ssds[i % ssds.length], psu };
          i++;
        }
}

/** The AIO radiator with its fans as a box: core centred on the mount, fans on the inner side, end tanks beyond the fans. */
function radiatorBox(inst) {
  const r = inst.cooler?.liquid ? inst.cooler.radiator : null;
  if (!r) return null;
  const a = v(r.along).normalize();
  const n = v(r.normal).normalize();
  const w = new Vector3().crossVectors(n, a).normalize();
  const p = v(r.p);
  const half = (d, lo, hi) => [p.clone().addScaledVector(d, lo), p.clone().addScaledVector(d, hi)];
  const pts = [...half(a, -(r.mm / 1000) / 2 - 0.017, r.mm / 1000 / 2 + 0.017), ...half(w, -0.06, 0.06), ...half(n, -(0.0135 + 0.025), 0.0135)];
  // the three extents are along orthogonal axes: combine them around the centre
  const box = new Box3(p.clone(), p.clone());
  for (const q of pts) box.expandByPoint(q);
  return box;
}

/** Board-mounted parts sit on the board; the CPU is under the cooler, the M.2 drive under the card; tower coolers overhang the RAM by design. */
function allowed(a, b) {
  const onBoard = new Set(['cpu', 'cooler', 'radiator', 'gpu', 'ssd', 'ram1', 'ram2', 'ram3', 'ram4']);
  if ([a, b].includes('motherboard') && (onBoard.has(a) || onBoard.has(b))) return true;
  const pair = [a, b].sort().join('×');
  if (pair === 'cooler×cpu' || pair === 'gpu×ssd' || /^cooler×ram\d$/.test(pair)) return true;
  return a.startsWith('ram') && b.startsWith('ram');
}

const fanBox = (f) => {
  const half = f.n.map((n) => (Math.abs(n) > 0.5 ? 0.0125 : f.size / 2));
  return new Box3(v(f.p).sub(v(half)), v(f.p).add(v(half)));
};

for (const c of cases) {
  const mounts = caseMountsFor(c.id);
  const rooms = [mounts.main, ...mounts.rooms].map(B);
  const inside = (box) => rooms.some((r) => r.clone().expandByScalar(2 * MM).containsBox(box));
  const maxGpu = c.compatibility.maxGpuLengthMm ?? Infinity;
  const maxCooler = c.compatibility.maxCoolerHeightMm ?? Infinity;

  test(`${c.id}: every part lands exactly on its anchor`, () => {
    const errors = [];
    for (const build of builds(c)) {
      const inst = installBuild(mounts, build);
      const tag = `${build.motherboard.id}`;
      for (const id of ['motherboard', 'cpu', 'cooler', 'ram', 'gpu', 'ssd', 'psu']) {
        const pl = inst[id];
        if (!pl) continue;
        const d = v(pl.attach).distanceTo(v(pl.target));
        if (d > MM) errors.push(`${tag}/${id}: attach ${pl.attach} is ${(d * 1000).toFixed(1)} mm from ${pl.target}`);
      }
      // the CPU on the socket, the cooler (or AIO pump) on the CPU, centred on the socket
      const cpu = inst.cpu;
      const cool = inst.cooler;
      if (cpu && cool) {
        const cpuTop = cpu.p[0] - cpu.size[0] / 2;
        const coolBottom = cool.p[0] + cool.size[0] / 2;
        if (!cool.liquid && Math.abs(coolBottom - cpuTop) > MM) errors.push(`${tag}/${build.cooling.id}: cooler base ${coolBottom.toFixed(4)} not on the CPU top ${cpuTop.toFixed(4)}`);
        if (Math.hypot(cool.target[1] - cpu.target[1], cool.target[2] - cpu.target[2]) > MM) errors.push(`${tag}/${build.cooling.id}: cooler not centred on the socket`);
      }
      // the card's fingers in the slot, its bracket at the case's slot plane
      if (inst.gpu) {
        const bracket = inst.gpu.p[2] - inst.gpu.size[2] / 2;
        if (Math.abs(bracket - mounts.slots.z) > 12 * MM) errors.push(`${tag}/${build.gpu.id}: bracket at z ${bracket.toFixed(3)}, slots at ${mounts.slots.z}`);
        const fingersHeight = inst.gpu.p[0] + (geometryOf(build.gpu.modelPath).anchors.slot_pcie_x16_1?.[0] ?? inst.gpu.size[0] / 2);
        const pcb = inst.motherboard.p[0] + inst.motherboard.size[0] / 2;
        if (Math.abs(pcb - fingersHeight - SEAT.pcie) > MM) errors.push(`${tag}/${build.gpu.id}: fingers not seated`);
      }
      // the PSU in its bay
      if (inst.psu) {
        const bay = B(mounts.psu).expandByScalar(MM);
        if (!bay.containsBox(B(boxOf(inst.psu)))) errors.push(`${build.psu.id}: ${fmt(B(boxOf(inst.psu)))} outside the PSU bay ${fmt(bay)}`);
      }
      if (inst.ram && inst.ram.sticks.length !== Math.min(4, stickCount(build.ram))) errors.push(`${build.ram.id}: ${inst.ram.sticks.length} sticks`);
    }
    assert.deepEqual([...new Set(errors)], []);
  });

  test(`${c.id}: every part stays inside the case`, () => {
    const errors = new Set();
    for (const build of builds(c)) {
      const inst = installBuild(mounts, build);
      for (const { id, box } of installedBoxes(inst)) {
        const b = B(box);
        // a card's bracket and a PSU's back sit in the rear-panel cutouts
        if (id === 'gpu' || id === 'psu') b.min.z = Math.max(b.min.z, mounts.main.min[2]);
        if (!inside(b)) errors.add(`${id} (${build[id === 'cooler' ? 'cooling' : id.replace(/ram\d/, 'ram')]?.id ?? ''}) ${fmt(b)} leaves the case`);
      }
      for (const f of inst.fans) {
        const h = f.size / 2;
        const t = 0.0125;
        const half = f.n.map((n) => (Math.abs(n) > 0.5 ? t : h));
        const b = new Box3(v(f.p).sub(v(half)), v(f.p).add(v(half)));
        if (!inside(b)) errors.add(`${f.group} fan ${fmt(b)} leaves the case`);
      }
      // a part the case cannot take is left out instead of clipping
      if (build.gpu.compatibility.lengthMm > maxGpu) assert.ok(!inst.gpu || inst.gpu.size[2] * 1000 <= maxGpu + 15, `${build.gpu.id} longer than ${c.id} allows is drawn`);
      if ((build.cooling.compatibility.coolerHeightMm ?? 0) > maxCooler + 5) assert.ok(inst.cooler?.liquid !== false, `${build.cooling.id} taller than ${c.id} allows is drawn as an air cooler`);
    }
    // the PC Assembly Lab's 3.5″ drive (dev-hdd: 102 × 26 × 147 mm, standing on its bottom)
    const at = v(hddBay(mounts));
    const g = new Group();
    g.position.copy(at);
    g.add(fitModel([loadGlbBounds(new URL('products/dev-hdd.glb', MODELS))], undefined, 'hdd'));
    g.updateMatrixWorld(true);
    const hdd = new Box3().setFromObject(g);
    if (!inside(hdd)) errors.add(`lab HDD ${fmt(hdd)} leaves the case`);
    assert.deepEqual([...errors], []);
  });

  test(`${c.id}: no two parts intersect in any build`, () => {
    const errors = new Set();
    for (const build of builds(c)) {
      const inst = installBuild(mounts, build);
      const list = installedBoxes(inst).map(({ id, box }) => ({ id, box: B(box) }));
      for (const f of inst.fans) {
        const half = f.n.map((n) => (Math.abs(n) > 0.5 ? 0.0125 : f.size / 2));
        list.push({ id: `${f.group} fan`, box: new Box3(v(f.p).sub(v(half)), v(f.p).add(v(half))) });
      }
      const name = (id) => (id.startsWith('ram') ? build.ram.id : id === 'cooler' ? build.cooling.id : build[id]?.id ?? id);
      // board-mounted parts sit on the board; everything else must clear it
      const onBoard = new Set(['cpu', 'cooler', 'gpu', 'ssd', 'ram1', 'ram2', 'ram3', 'ram4']);
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          if ([a.id, b.id].includes('motherboard') && (onBoard.has(a.id) || onBoard.has(b.id))) continue;
          // the CPU is under the cooler, the M.2 drive under the card: they only touch
          const pair = [a.id, b.id].sort().join('×');
          if (pair === 'cooler×cpu' || pair === 'gpu×ssd') continue;
          // tower coolers overhang the RAM by design (checked against the real heights in §1.5)
          if (/^cooler×ram\d$/.test(pair)) continue;
          if (a.id.startsWith('ram') && b.id.startsWith('ram')) continue;
          const o = overlap(a.box, b.box);
          if (o > MM) errors.add(`${build.motherboard.id}: ${name(a.id)} × ${name(b.id)}: ${(o * 1000).toFixed(1)} mm`);
        }
    }
    assert.deepEqual([...errors], []);
  });

  test(`${c.id}: nothing is tilted (every turn a whole quarter, within 0.5°)`, () => {
    const errors = new Set();
    const quarter = (a) => Math.abs(a - Math.round(a / (Math.PI / 2)) * (Math.PI / 2)) <= (0.5 * Math.PI) / 180;
    for (const f of mounts.fans) {
      const n = v(f.n);
      if (Math.abs(n.length() - 1) > 1e-6 || ![0, 1, 2].some((k) => Math.abs(Math.abs(n.getComponent(k)) - 1) < 1e-4)) errors.add(`${f.group} fan normal ${f.n} is not a case axis`);
    }
    if (mounts.radiator) for (const d of [mounts.radiator.along, mounts.radiator.normal]) if (!d.some((x) => Math.abs(Math.abs(x) - 1) < 1e-4)) errors.add(`radiator axis ${d}`);
    for (const build of builds(c)) {
      const inst = installBuild(mounts, build);
      for (const id of ['motherboard', 'cpu', 'cooler', 'gpu', 'ssd', 'psu']) {
        const r = inst[id]?.r;
        if (r && !r.every(quarter)) errors.add(`${build[id === 'cooler' ? 'cooling' : id].id}: turned ${r.map((x) => ((x * 180) / Math.PI).toFixed(2))}°`);
      }
    }
    assert.deepEqual([...errors], []);
  });

  test(`${c.id}: the AIO radiator stays inside the case and clears every part and fan`, () => {
    const errors = new Set();
    for (const build of builds(c)) {
      const inst = installBuild(mounts, build);
      const rad = radiatorBox(inst);
      if (!rad) continue;
      if (!inside(rad)) errors.add(`${build.cooling.id}: radiator ${fmt(rad)} leaves the case`);
      for (const { id, box } of installedBoxes(inst)) {
        if (id === 'cooler' || allowed('radiator', id)) continue;
        const o = overlap(rad, B(box));
        if (o > MM) errors.add(`${build.cooling.id} radiator × ${id}: ${(o * 1000).toFixed(1)} mm`);
      }
      for (const f of inst.fans) {
        const o = overlap(rad, fanBox(f));
        if (o > MM) errors.add(`${build.cooling.id} radiator × ${f.group} fan: ${(o * 1000).toFixed(1)} mm`);
      }
    }
    assert.deepEqual([...errors], []);
  });

  test(`${c.id}: in the assembly every part slides in from outside without passing through another (V4 §1.3)`, () => {
    const errors = new Set();
    for (const build of builds(c)) {
      const inst = installBuild(mounts, build);
      const paths = entryPaths(inst);
      const boxes = installedBoxes(inst).map(({ id, box }) => ({ id, group: id.startsWith('ram') ? 'ram' : id, box: B(box) }));
      const rad = radiatorBox(inst);
      if (rad) boxes.push({ id: 'radiator', group: 'cooler', box: rad });
      // the fans that ship with the case are there from the start; the intake fans are the last group in
      const exhaust = inst.fans.filter((f) => !isIntakeFan(f)).map((f) => ({ id: `${f.group} fan`, group: 'case', box: fanBox(f) }));
      const intake = inst.fans.filter(isIntakeFan).map((f) => ({ id: `${f.group} fan`, group: 'fans', box: fanBox(f) }));
      const all = [...boxes, ...intake];
      const placed = [...exhaust];
      for (const group of INSTALL_ORDER) {
        const moving = all.filter((b) => b.group === group);
        const path = paths[group];
        if (!moving.length) continue;
        if (!path) {
          errors.add(`${group}: no entry path`);
          continue;
        }
        const d = v(pathOffset(path, 1));
        // the entry point is outside the case: beyond the glass, or behind the rear panel (PSU)
        for (const m of moving) {
          const at = m.box.clone().translate(d);
          const out = at.max.x < mounts.main.min[0] + MM || at.max.z < mounts.shell.min[2] + MM;
          if (!out) errors.add(`${build[group === 'cooler' ? 'cooling' : group]?.id ?? group} (${m.id}) starts inside the case ${fmt(at)}`);
        }
        for (let k = 0; k <= 60; k++) {
          const off = v(pathOffset(path, k / 60));
          for (const m of moving) {
            const b = m.box.clone().translate(off);
            for (const s of placed) {
              if (allowed(m.id, s.id)) continue;
              const o = overlap(b, s.box);
              if (o > MM) errors.add(`${build.motherboard.id}: ${m.id} (${build[group === 'cooler' ? 'cooling' : group]?.id ?? group}) passes through ${s.id} (${(o * 1000).toFixed(1)} mm)`);
            }
          }
        }
        placed.push(...moving);
      }
    }
    assert.deepEqual([...errors].slice(0, 20), []);
  });
}

test('the desk mat and the system unit stay on every desk', async () => {
  const { DEFAULT_DESK_TOP, deskTopOf, matOn, MAT_MARGIN, PC_MARGIN, pcShiftOn } = await import('../src/scenes/DeskScene/deskFit.ts');
  const { PC } = await import('../src/scenes/DeskScene/layout.ts');
  const desks = [null, ...CATALOG.filter((p) => p.category === 'desk')];
  for (const d of desks) {
    const top = deskTopOf(d);
    if (d) assert.notEqual(top, DEFAULT_DESK_TOP, `${d.id}: no measured top (run node scripts/extract-mounts.mjs)`);
    const mat = matOn(top);
    const name = d?.id ?? 'house desk';
    assert.ok(mat.position[0] - mat.size[0] / 2 >= top.min[0] + MAT_MARGIN - 1e-6 && mat.position[0] + mat.size[0] / 2 <= top.max[0] - MAT_MARGIN + 1e-6, `${name}: mat sticks out sideways`);
    assert.ok(mat.position[2] - mat.size[1] / 2 >= top.min[1] + MAT_MARGIN - 1e-6 && mat.position[2] + mat.size[1] / 2 <= top.max[1] - MAT_MARGIN + 1e-6, `${name}: mat sticks out at the front or back`);
    assert.ok(Math.abs(mat.position[1] - top.y) < MM, `${name}: mat not on the top`);
    for (const c of cases) {
      const s = caseMountsFor(c.id).shell;
      const half = [(s.max[0] - s.min[0]) / 2, (s.max[2] - s.min[2]) / 2];
      const [dx, dz] = pcShiftOn(top, half);
      const x = PC.position[0] + dx;
      const z = PC.position[2] + dz;
      assert.ok(x - half[0] >= top.min[0] + PC_MARGIN - 1e-6 && x + half[0] <= top.max[0] - PC_MARGIN + 1e-6 && z - half[1] >= top.min[1] + PC_MARGIN - 1e-6 && z + half[1] <= top.max[1] - PC_MARGIN + 1e-6, `${name}: ${c.id} hangs over the edge`);
    }
  }
});
