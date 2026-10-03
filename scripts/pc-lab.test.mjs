import assert from 'node:assert/strict';
import test from 'node:test';
import {LAB_PARTS,canInstall,missingBefore,assemblyCoverage} from '../src/lib/labs/pcAssembly.ts';
import {assess,isAssessment} from '../src/lib/labs/assessment.ts';
test('realistic installation constraints allow safe order, reject GPU without PSU and cooler before RAM',()=>{
  assert.ok(canInstall('psu',[]));assert.ok(!canInstall('cpu',[]));
  assert.deepEqual(missingBefore('gpu',['motherboard']),['psu']);
  assert.ok(!canInstall('cooler',['motherboard','cpu']));
  const installed=[];
  for(const id of [...LAB_PARTS,'cables']){assert.ok(canInstall(id,installed),id);installed.push(id);}
  assert.equal(assemblyCoverage(installed),1);assert.ok(!canInstall('cpu',installed));
  assert.equal(assemblyCoverage(['cpu','cpu']),1/9);
});
test('grading is bounded and independent of speed; malformed saved scores are rejected',()=>{
  assert.equal(assess('assembly',1,400,0,0).score,100);
  assert.equal(assess('assembly',1,2,2,1).score,90);
  assert.equal(assess('assembly',.5,5,100,100).score,0);
  assert.equal(assess('assembly',NaN,-1).score,0);
  assert.ok(isAssessment(assess('assembly',1,40)));
  assert.ok(!isAssessment({exercise:'assembly',score:999,maxScore:100}));
});
