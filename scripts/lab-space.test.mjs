import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LAB_HALL, LAB_OVERVIEW, LAB_ZONE_IDS, LAB_ZONES, zoneById } from '../src/data/lab/zones.ts';
import { BoxGeometry, Color } from 'three';
import { mergePieces } from '../src/scenes/LabSpace/classroom/mergeParts.ts';
import { inOverview } from '../src/scenes/LabSpace/devices/deviceAssets.ts';
import { clampToHall, keyAction, loadPlan, stepZone, toMinimap, zoneNumber, zoneShot, zonesNear } from '../src/lib/lab/navigation.ts';

const inside = ([x, z], m = 0) => x >= LAB_HALL.minX + m && x <= LAB_HALL.maxX - m && z >= LAB_HALL.minZ + m && z <= LAB_HALL.maxZ - m;

test('nine zones, unique ids, inside the hall, platforms do not overlap', () => {
  assert.equal(LAB_ZONES.length, 9);
  assert.deepEqual(LAB_ZONES.map((z) => z.id), [...LAB_ZONE_IDS]);
  for (const z of LAB_ZONES) {
    assert.ok(inside(z.center, 1), `${z.id} inside`);
    assert.ok(Math.abs(Math.hypot(...z.facing) - 1) < 1e-9, `${z.id} facing is a unit vector`);
  }
  // footprints as circles of the half-diagonal: generous, still none may touch
  for (const a of LAB_ZONES) for (const b of LAB_ZONES) {
    if (a === b) continue;
    const d = Math.hypot(a.center[0] - b.center[0], a.center[1] - b.center[1]);
    assert.ok(d > Math.max(...a.size) / 2 + Math.max(...b.size) / 2 - 0.2, `${a.id} / ${b.id} overlap`);
  }
});

test('every DEVICE_CATALOG device has exactly one zone', () => {
  const catalog = readFileSync(new URL('../DEVICE_CATALOG.md', import.meta.url), 'utf8');
  const ids = [...catalog.matchAll(/^\| \d+ \| `([a-z0-9_]+)` \|/gm)].map((m) => m[1]);
  assert.equal(ids.length, 60);
  const placed = LAB_ZONES.flatMap((z) => z.devices);
  assert.equal(new Set(placed).size, placed.length, 'no device in two zones');
  assert.deepEqual([...placed].sort(), [...ids].sort());
});

test('zone shots stand in the hall, in front of the zone, looking at it', () => {
  for (const z of LAB_ZONES) {
    const { position, target } = zoneShot(z);
    assert.ok(inside([position[0], position[2]], 0.3), `${z.id} camera inside the hall`);
    const toZone = [target[0] - position[0], target[2] - position[2]];
    assert.ok(toZone[0] * -z.facing[0] + toZone[1] * -z.facing[1] > 0, `${z.id} camera faces the zone`);
    assert.ok(position[1] > 1 && position[1] < LAB_HALL.height - 0.5);
  }
  assert.ok(LAB_OVERVIEW.position[1] > LAB_HALL.height, 'overview from above');
});

test('keyboard: digits, escape, stepping, zoom and orbit', () => {
  assert.deepEqual(keyAction('1'), { type: 'focus', zone: LAB_ZONE_IDS[0] });
  assert.deepEqual(keyAction('9'), { type: 'focus', zone: LAB_ZONE_IDS[8] });
  for (const k of ['Escape', '0', 'Home']) assert.deepEqual(keyAction(k), { type: 'overview' });
  assert.deepEqual(keyAction('PageDown'), { type: 'step', dir: 1 });
  assert.deepEqual(keyAction('['), { type: 'step', dir: -1 });
  assert.deepEqual(keyAction('+'), { type: 'zoom', dir: 1 });
  assert.deepEqual(keyAction('ArrowLeft'), { type: 'orbit', dir: -1 });
  assert.equal(keyAction('a'), null);
  assert.equal(stepZone(null, 1), LAB_ZONE_IDS[0]);
  assert.equal(stepZone(null, -1), LAB_ZONE_IDS[8]);
  assert.equal(stepZone(LAB_ZONE_IDS[8], 1), LAB_ZONE_IDS[0]);
  assert.equal(zoneNumber('storage'), 3);
});

test('loading policy: overview mounts nothing in full; a zone mounts itself and only prefetches neighbours', () => {
  assert.deepEqual(loadPlan(null), { full: [], prefetch: [] });
  for (const id of LAB_ZONE_IDS) {
    const plan = loadPlan(id);
    assert.deepEqual(plan.full, [id]);
    assert.ok(!plan.prefetch.includes(id));
    assert.ok(plan.prefetch.length < LAB_ZONE_IDS.length - 1, `${id}: never every zone`);
  }
  assert.equal(zonesNear(zoneById('workstation').center, 0.1)[0], 'workstation');
});

test('minimap projection and hall clamp', () => {
  assert.deepEqual(toMinimap(LAB_HALL.minX, LAB_HALL.minZ, 200, 150), [0, 0]);
  assert.deepEqual(toMinimap(LAB_HALL.maxX, LAB_HALL.maxZ, 200, 150), [200, 150]);
  assert.deepEqual(clampToHall([50, 9, -50]), [LAB_HALL.maxX - 0.6, LAB_HALL.height - 0.4, LAB_HALL.minZ + 0.6]);
});

test('storage chart: catalog read speeds, HDD first, sorted, NVMe over 30× the HDD', async () => {
  const { speedRows, HDD_READ_MBPS, zoneProducts } = await import('../src/scenes/LabSpace/zones/zoneData.ts');
  const rows = speedRows('HDD');
  assert.equal(rows[0].label, 'HDD');
  assert.equal(rows[0].mbps, HDD_READ_MBPS);
  assert.equal(rows.length, 5);
  for (let i = 2; i < rows.length; i++) assert.ok(rows[i].mbps >= rows[i - 1].mbps);
  assert.ok(rows.at(-1).mbps / HDD_READ_MBPS > 30);
  // every product file a zone mounts exists as a catalog model
  const products = zoneProducts();
  for (const ids of Object.values(products)) for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  assert.ok(products.assembly.length >= 7);
});

test('no zone camera stands on another zone (the showcase shot once landed inside the mobile zone)', () => {
  for (const a of LAB_ZONES) {
    const { position } = zoneShot(a);
    for (const b of LAB_ZONES) {
      if (a === b) continue;
      const d = Math.hypot(position[0] - b.center[0], position[2] - b.center[1]);
      assert.ok(d > Math.max(...b.size) / 2 + 0.3, `${a.id} camera is on ${b.id}`);
    }
  }
});

test('classroom: posters on the walls, clear of each other and of the windows; robot in the open floor', async () => {
  const { POSTERS, POSTER_IDS, WINDOWS, ROBOT, posterShot, robotShot } = await import('../src/data/lab/classroom.ts');
  assert.deepEqual(POSTERS.map((p) => p.id).sort(), [...POSTER_IDS].sort());
  const along = (p) => (p.wall === 'back' ? p.center[0] : p.center[2]);
  for (const p of POSTERS) {
    const onWall = p.wall === 'back' ? Math.abs(p.center[2] - LAB_HALL.minZ) < 0.05 : Math.abs(Math.abs(p.center[0]) - LAB_HALL.maxX) < 0.05;
    assert.ok(onWall, `${p.id} hangs on its wall`);
    assert.ok(p.center[1] - p.size[1] / 2 > 1.0 && p.center[1] + p.size[1] / 2 < 3.2, `${p.id} between the tables and the light band`);
    for (const q of POSTERS) if (q !== p && q.wall === p.wall) assert.ok(Math.abs(along(p) - along(q)) > (p.size[0] + q.size[0]) / 2, `${p.id} / ${q.id} overlap`);
    for (const w of WINDOWS) if (w.wall === p.wall) assert.ok(Math.abs(along(p) - w.z) > (p.size[0] + w.w) / 2, `${p.id} covers a window`);
    // the close-up stands in the hall, in front of the poster
    const s = posterShot(p);
    assert.ok(inside([s.position[0], s.position[2]], 0.5), `${p.id} shot inside the hall`);
  }
  // the robot stands clear of every zone platform
  for (const z of LAB_ZONES) {
    const d = Math.hypot(ROBOT.position[0] - z.center[0], ROBOT.position[2] - z.center[1]);
    assert.ok(d > Math.max(...z.size) / 2 + 0.3, `robot clear of ${z.id}`);
  }
  assert.ok(inside([robotShot().position[0], robotShot().position[2]], 0.5));
});

test('robot teacher check: start, a zone to-do list, next task, all done', async () => {
  const { teacherCheck, deviceExerciseId } = await import('../src/lib/lab/teacher.ts');
  const { DEVICES } = await import('../src/data/devices/devices.ts');
  const { TASKS } = await import('../src/services/progress/catalog.ts');
  const fresh = teacherCheck({}, 'network');
  assert.equal(fresh.mood, 'start');
  assert.equal(fresh.completed, 0);
  assert.ok(fresh.next, 'something to start with');
  assert.ok(fresh.zoneTodo.length > 0 && fresh.zoneTodo.every((id) => DEVICES.find((d) => d.id === id).zone === 'network'));
  assert.equal(fresh.teardownsTodo.length, 6);
  const done = (id) => ({ attempts: 1, best: { percent: 100, score: 1, maxScore: 1, at: 1 }, lastAt: 1, completedAt: 1 });
  // the network zone's device tests passed: its to-do list empties
  const zone = Object.fromEntries(DEVICES.filter((d) => d.zone === 'network').map(deviceExerciseId).filter(Boolean).map((id) => [id, done(id)]));
  assert.deepEqual(teacherCheck(zone, 'network').zoneTodo, []);
  assert.equal(teacherCheck(zone, null).zoneTodo.length, 0, 'no zone in view, no zone list');
  const all = Object.fromEntries(TASKS.map((t) => [t.id, done(t.id)]));
  const finished = teacherCheck(all, 'mobile');
  assert.equal(finished.mood, 'done');
  assert.equal(finished.next, null);
  assert.equal(finished.percent, 100);
  assert.deepEqual(finished.teardownsTodo, []);
});

test('merged pieces: one geometry, parent transforms applied, a vertex colour per piece; overview model rule', () => {
  const g = mergePieces(
    [
      { geo: new BoxGeometry(1, 1, 1), at: [1, 0, 0], color: '#ff0000' },
      // inside a group moved to x = 10 and turned 90° about Y: the 2 m long box ends up along Z
      { geo: new BoxGeometry(2, 1, 1), parents: [{ at: [10, 0, 0], rot: [0, Math.PI / 2, 0] }], color: '#0000ff' },
    ],
    true,
  );
  assert.equal(g.index, null);
  assert.deepEqual(Object.keys(g.attributes).sort(), ['color', 'normal', 'position', 'uv']);
  assert.equal(g.attributes.position.count, 72, 'two boxes, 36 vertices each');
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  assert.deepEqual([min.x, max.x].map((v) => +v.toFixed(3)), [0.5, 10.5]);
  assert.deepEqual([min.z, max.z].map((v) => +v.toFixed(3)), [-1, 1]);
  const red = new Color('#ff0000');
  assert.deepEqual([...g.attributes.color.array.slice(0, 3)], [red.r, red.g, red.b]);
  assert.equal(g.attributes.color.array[72 * 3 - 1], new Color('#0000ff').b);

  // lab device models stay out of the Low / Medium overview; catalog models do not
  assert.equal(inOverview('ups', 'low'), false);
  assert.equal(inOverview('ups', 'high'), true);
  assert.equal(inOverview('monitor', 'low'), true);
  assert.equal(inOverview('scanner', 'medium'), true, 'no model of its own');
});
