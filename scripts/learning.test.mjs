import test from 'node:test';
import assert from 'node:assert/strict';
import {experimentModel,gradeNumeric} from '../src/lib/labs/experiments.ts';
test('experiments apply formulas and numeric answers allow rounded decimal comma only',()=>{
  assert.equal(experimentModel('refresh',[300]).value,1000/300);assert.equal(experimentModel('storage',[1000,500]).value,2);assert.equal(experimentModel('binaryData',[42]).value,3);assert.equal(gradeNumeric('3,33',1000/300),1);assert.equal(gradeNumeric('0x10',16),0);assert.equal(gradeNumeric('100',2),0);assert.equal(gradeNumeric('2.999',3,true),0);
});
