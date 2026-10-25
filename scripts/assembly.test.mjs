import test from 'node:test';
import assert from 'node:assert/strict';
import { assemblySteps } from '../src/scenes/SetupStudio/assembly/steps.ts';
import { assemblyRig, resetAssemblyRig, PIECES, INSTALL_ORDER } from '../src/scenes/SetupStudio/assembly/assemblyRig.ts';

test('full setup follows installation dependencies and power-on order', () => {
  const build = Object.fromEntries(['monitor','keyboard','mouse','speakers','headset','chair','case','motherboard','cpu','ram','ssd','cooling','psu','gpu'].map(k => [k,{id:k}]));
  const ids = assemblySteps(build).map(s => s.id);
  for (const [before,after] of [['monitorStand','monitor'],['pcCase','sidePanel'],['sidePanel','motherboard'],['motherboard','cpu'],['cpu','cooler'],['psu','cables'],['gpu','cables'],['cables','fans'],['fans','glassClose'],['glassClose','rgb'],['rgb','monitorOn'],['monitorOn','lights']]) assert.ok(ids.indexOf(before) < ids.indexOf(after), `${before} before ${after}`);
  assert.equal(new Set(ids).size,ids.length);
});
test('V4 §1.3: the CPU drops into an open socket, the lever locks it, paste goes on before the cooler', () => {
  const build = Object.fromEntries(['case','motherboard','cpu','ram','ssd','cooling','psu','gpu'].map(k => [k,{id:k}]));
  const ids = assemblySteps(build).map(s => s.id);
  const order = ['sidePanel','motherboard','socket','cpu','socketLock','paste','cooler','ram','ssd','gpu','psu','cables','fans','glassClose','rgb'];
  assert.deepEqual(ids.filter(id => order.includes(id)), order);
  const steps = assemblySteps(build);
  const lever = steps.filter(s => s.targets.some(t => t.kind === 'value' && t.key === 'socketLever'));
  assert.deepEqual(lever.map(s => s.targets[0].to), [1, 0], 'lever opens, then locks');
  const power = steps.find(s => s.id === 'rgb');
  assert.ok(power.targets.some(t => t.key === 'fanSpeed'), 'fans spin up at power-on');
  // no cooler: no paste step
  assert.ok(!assemblySteps({case:{id:'c'},motherboard:{id:'m'},cpu:{id:'p'}}).some(s => s.id === 'paste'));
});
test('optional products never appear in the animation when left out', () => {
  const steps = assemblySteps({monitor:{id:'screen'},case:{id:'case'},cpu:{id:'cpu'}});
  for (const id of ['gpu','headset','headsetStand','chair','speakers','keyboard','mouse']) assert.ok(!steps.some(s => s.id === id),id);
  assert.ok(steps.some(s => s.id === 'monitorOn'));
  const deskOnly = assemblySteps({});
  assert.deepEqual(deskOnly.map(s => s.id),['mat','lights']);
});
test('replay clears all installed products and power channels', () => {
  resetAssemblyRig(true);
  assert.ok(PIECES.every(k => assemblyRig.pieces[k] === 1));
  assert.ok(INSTALL_ORDER.every(k => assemblyRig.parts[k] === 1));
  resetAssemblyRig(false);
  assert.ok(PIECES.every(k => assemblyRig.pieces[k] === 0));
  assert.ok(INSTALL_ORDER.every(k => assemblyRig.parts[k] === 0));
  for (const k of ['monitorOn','fanSpeed','rgb','cables','glassOpen','socketLever','paste']) assert.equal(assemblyRig[k],0);
});
test('V4 §1.3: camera glides between assembly shots never cut through the PC case', async () => {
  const { CAMERA_STATES } = await import('../src/data/camera/cameraStates.ts');
  // the studio PC (showcase case) as rendered: world box measured in the dev build, with a 3 cm margin
  const box = { min: [0.5, 0.74, -0.33], max: [0.87, 1.33, 0.24] };
  const hits = (a, b) => {
    for (let i = 0; i <= 200; i++) {
      const p = a.map((v, k) => v + (b[k] - v) * (i / 200));
      if (p.every((v, k) => v > box.min[k] && v < box.max[k])) return true;
    }
    return false;
  };
  const build = Object.fromEntries(['monitor','keyboard','mouse','speakers','headset','chair','case','motherboard','cpu','ram','ssd','cooling','psu','gpu'].map(k => [k,{id:k}]));
  let prev = 'ASSEMBLY_START';
  for (const step of assemblySteps(build)) {
    if (step.shot === prev) continue;
    const via = CAMERA_STATES[step.shot].via ?? CAMERA_STATES[prev].via;
    const path = [CAMERA_STATES[prev].position, ...(via ? [via] : []), CAMERA_STATES[step.shot].position];
    for (let i = 1; i < path.length; i++) assert.ok(!hits(path[i - 1], path[i]), `${prev} → ${step.shot} passes through the case`);
    prev = step.shot;
  }
  for (const s of new Set(assemblySteps(build).map(s => s.shot))) {
    const p = CAMERA_STATES[s].position;
    assert.ok(!p.every((v, k) => v > box.min[k] && v < box.max[k]), `${s} camera inside the case`);
  }
});
