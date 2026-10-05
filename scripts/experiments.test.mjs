import test from 'node:test';
import assert from 'node:assert/strict';
import { EXPERIMENT_IDS } from '../src/labs/Experiments/index.ts';
import * as cpuTemp from '../src/labs/Experiments/cpuTemp.ts';
import * as memory from '../src/labs/Experiments/memory.ts';
import * as storage from '../src/labs/Experiments/storage.ts';
import * as latency from '../src/labs/Experiments/latency.ts';
import * as binary from '../src/labs/Experiments/binary.ts';
import * as cpuCycle from '../src/labs/Experiments/cpuCycle.ts';
import * as rgb from '../src/labs/Experiments/rgb.ts';
import * as resolution from '../src/labs/Experiments/resolution.ts';
import * as refresh from '../src/labs/Experiments/refresh.ts';
import { grade, startAttempt } from '../src/services/grading/index.ts';

const MODULES = { cpuTemp, memory, storage, latency, binaryData: binary, cpuCycle, rgb, resolution, refresh };

test('cpu: power rises with load, better coolers run cooler, the stock cooler throttles at 100 %', () => {
  let last = -1;
  for (let l = 0; l <= 100; l += 10) {
    const s = cpuTemp.thermal(l, 'tower');
    assert.ok(s.powerW > last);
    last = s.powerW;
  }
  for (const load of [20, 60, 100]) {
    const [a, b, c] = cpuTemp.COOLERS.map((k) => cpuTemp.thermal(load, k).tempC);
    assert.ok(a >= b && b >= c, `load ${load}`);
  }
  const stock = cpuTemp.thermal(100, 'stock');
  assert.ok(stock.throttling);
  assert.equal(stock.tempC, cpuTemp.CPU.tjmax);
  assert.ok(stock.clockGHz < cpuTemp.CPU.boostGHz);
  assert.ok(!cpuTemp.thermal(100, 'liquid').throttling);
  // realistic range: idle 30–45 °C, full load on a tower cooler 60–80 °C
  assert.ok(cpuTemp.thermal(0, 'tower').tempC > 28 && cpuTemp.thermal(0, 'tower').tempC < 45);
  assert.ok(cpuTemp.thermal(100, 'tower').tempC > 60 && cpuTemp.thermal(100, 'tower').tempC < 80);
  // warm-up converges to the steady temperature, faster for lighter heatsinks
  const w = cpuTemp.warmUp(100, 'liquid', 300);
  assert.ok(Math.abs(w.at(-1).c - cpuTemp.thermal(100, 'liquid').tempC) < 3);
  const at20 = (k) => cpuTemp.warmUp(100, k).find((p) => p.t === 20).c / cpuTemp.thermal(100, k).tempC;
  assert.ok(at20('stock') > at20('liquid'));
});

test('memory: swap appears exactly when programs exceed RAM', () => {
  assert.equal(memory.memory(16, []).usedGB, memory.OS_GB);
  const heavy = ['game', 'browser', 'obs', 'discord'];
  const m16 = memory.memory(16, heavy);
  assert.ok(m16.swapGB > 0 && m16.level !== 'ok');
  assert.equal(m16.inRamGB, 16);
  const m32 = memory.memory(32, heavy);
  assert.equal(m32.swapGB, 0);
  assert.ok(Math.abs(m32.freeGB + m32.usedGB - 32) < 1e-9);
  assert.equal(memory.memory(8, ['game', 'blender', 'photoshop']).level, 'critical');
});

test('storage: realistic speeds and copy times', () => {
  const s = storage.DRIVE_SPEED;
  assert.ok(s.hdd.seq >= 100 && s.hdd.seq <= 200);
  assert.ok(s.sata.seq <= 560);
  assert.ok(s.nvme3.seq >= 3000 && s.nvme4.seq <= 7500);
  assert.equal(storage.copySeconds('hdd', 10), 62.5);
  for (const w of ['big', 'small']) {
    const t = storage.DRIVES.map((d) => storage.copySeconds(d, 5, w));
    assert.ok(t.every((x, i) => i === 0 || x < t[i - 1]), `faster drives are faster (${w})`);
  }
  // small files hurt the HDD far more than the NVMe
  const hddPenalty = storage.copySeconds('hdd', 1, 'small') / storage.copySeconds('hdd', 1);
  const nvmePenalty = storage.copySeconds('nvme4', 1, 'small') / storage.copySeconds('nvme4', 1);
  assert.ok(hddPenalty > nvmePenalty);
  assert.deepEqual(storage.formatDuration(45), { value: '45', unit: 's' });
  assert.deepEqual(storage.formatDuration(600), { value: '10', unit: 'min' });
});

test('latency: physics of fibre, access delay and the geostationary satellite', () => {
  const near = latency.ping(10, 'fiber');
  const astana = latency.ping(970, 'fiber');
  assert.ok(near.rttMs < 5);
  assert.ok(astana.rttMs > 10 && astana.rttMs < 25, `Almaty–Astana ${astana.rttMs}`);
  assert.ok(latency.ping(970, 'mobile').rttMs > astana.rttMs);
  const sat = latency.ping(970, 'satellite');
  assert.ok(sat.rttMs > 500 && sat.rttMs < 700, `GEO ${sat.rttMs}`);
  // propagation doubles with distance
  assert.ok(Math.abs(latency.ping(2000, 'fiber').propagationMs - 2 * latency.ping(1000, 'fiber').propagationMs) < 1e-9);
});

test('binary: ASCII is one byte, Kazakh letters two (UTF-8)', () => {
  const a = binary.encode('A')[0];
  assert.equal(a.codePoint, 65);
  assert.deepEqual(a.bits, ['01000001']);
  const ae = binary.encode('ә')[0];
  assert.equal(ae.bytes.length, 2);
  assert.equal(binary.bitCount(binary.encode('Hi')), 16);
  assert.equal(binary.bitCount(binary.encode('Сәлем')), 80);
  assert.equal(binary.encode('x'.repeat(40)).length, binary.MAX_CHARS);
  assert.equal(binary.sendSeconds(9600, 9600), 1);
});

test('cpu cycle: fetch → decode → execute until HALT, PC increments on fetch', () => {
  const steps = cpuCycle.runCycle(5, 3);
  assert.deepEqual(steps.map((s) => s.stage), ['fetch', 'decode', 'execute', 'fetch', 'decode', 'execute', 'fetch', 'decode', 'execute', 'fetch', 'halt']);
  assert.equal(steps.at(-1).acc, 8);
  assert.equal(steps.at(-1).memory[cpuCycle.DATA_ADDR.out], 8);
  assert.equal(steps[0].pc, 1);
  assert.equal(cpuCycle.runCycle(5, 3, 'SUB').at(-1).acc, 2);
  // snapshots are independent (stepping back is safe)
  steps.at(-1).memory[5] = 99;
  assert.equal(steps[0].memory[5], 5);
});

test('rgb: HEX, mixing names, luminance', () => {
  assert.equal(rgb.toHex(255, 165, 0), '#FFA500');
  assert.equal(rgb.toHex(-5, 300, 15.6), '#00FF10');
  assert.equal(rgb.describe(255, 255, 0), 'yellow');
  assert.equal(rgb.describe(0, 0, 0), 'black');
  assert.equal(rgb.describe(255, 255, 255), 'white');
  assert.equal(rgb.describe(0, 255, 255), 'cyan');
  assert.ok(rgb.luminance(255, 255, 255) > 0.99 && rgb.luminance(0, 0, 0) === 0);
  assert.equal(rgb.TOTAL_COLOURS, 16_777_216);
});

test('resolution: pixel counts, PPI, finer grids for denser panels', () => {
  assert.equal(resolution.megapixels(1920, 1080), 2.0736);
  assert.ok(Math.abs(resolution.ppi(2560, 1440, 27) - 108.8) < 0.2);
  assert.ok(Math.abs(resolution.ppi(1920, 1080, 24) - 91.8) < 0.2);
  const coarse = resolution.pixelsInPatch(resolution.ppi(1280, 720, 32));
  const fine = resolution.pixelsInPatch(resolution.ppi(3840, 2160, 27));
  assert.ok(fine > coarse * 2);
  const grid = resolution.rasterA(20);
  assert.equal(grid.length, 20);
  assert.ok(grid.flat().filter(Boolean).length > 30);
});

test('refresh: frame time and per-frame jump', () => {
  assert.ok(Math.abs(refresh.frameMs(60) - 16.67) < 0.01);
  assert.equal(refresh.jumpPx(1200, 60), 20);
  assert.equal(refresh.jumpPx(1200, 240), 5);
  // the drawn object only moves at frame boundaries
  assert.equal(refresh.shownPosition(0.01, 60, 600, 10_000), 0);
  assert.equal(refresh.shownPosition(1 / 60 + 0.001, 60, 600, 10_000), 10);
});

test('every experiment: 3 questions, distinct options, correct answer exists, grading works', () => {
  assert.deepEqual(Object.keys(MODULES).sort(), [...EXPERIMENT_IDS].sort());
  for (const [id, mod] of Object.entries(MODULES)) {
    const qs = mod.questions();
    assert.equal(qs.length, 3, id);
    for (const q of qs) {
      assert.ok(q.correct >= 0 && q.correct < q.options.length, `${id}.${q.id}`);
      const labels = q.options.map((o) => JSON.stringify(o));
      assert.equal(new Set(labels).size, labels.length, `${id}.${q.id} distinct`);
    }
    const ex = mod.exercise();
    assert.equal(ex.id, `experiment:${id}`);
    assert.equal(ex.gradingRules.reduce((s, r) => s + r.points, 0), 10);
    const right = Object.fromEntries(qs.map((q) => [q.id, q.correct]));
    assert.equal(grade(ex, { answers: right }, startAttempt('x', 0), 0).report.score, 10);
    const wrong = { ...right, [qs[0].id]: (qs[0].correct + 1) % qs[0].options.length };
    const r = grade(ex, { answers: wrong }, startAttempt('x', 0), 0).report;
    assert.equal(r.status, 'incomplete');
    assert.equal(r.outcomes[0].feedback[0].key, qs[0].why.key, `${id}: wrong answer explains why`);
    // conclusions exist for the default state
  }
});
