import test from 'node:test';
import assert from 'node:assert/strict';
import { assemblySteps } from '../src/scenes/SetupStudio/assembly/steps.ts';
import { assemblyRig, resetAssemblyRig, PIECES, INSTALL_ORDER } from '../src/scenes/SetupStudio/assembly/assemblyRig.ts';

test('full setup follows installation dependencies and power-on order', () => {
  const build = Object.fromEntries(['monitor','keyboard','mouse','speakers','headset','chair','case','motherboard','cpu','ram','ssd','cooling','psu','gpu'].map(k => [k,{id:k}]));
  const ids = assemblySteps(build).map(s => s.id);
  for (const [before,after] of [['monitorStand','monitor'],['pcCase','sidePanel'],['sidePanel','motherboard'],['motherboard','cpu'],['cpu','cooler'],['psu','cables'],['gpu','cables'],['cables','fans'],['fans','rgb'],['rgb','glassClose'],['glassClose','monitorOn'],['monitorOn','lights']]) assert.ok(ids.indexOf(before) < ids.indexOf(after), `${before} before ${after}`);
  assert.equal(new Set(ids).size,ids.length);
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
  for (const k of ['monitorOn','fanSpeed','rgb','cables','glassOpen']) assert.equal(assemblyRig[k],0);
});
