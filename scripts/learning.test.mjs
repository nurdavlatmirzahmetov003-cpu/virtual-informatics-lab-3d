import test from 'node:test';
import assert from 'node:assert/strict';
import {ALGORITHMS,algorithmSteps,algorithmAnswer,parseArray} from '../src/lib/labs/algorithms.ts';
import {logicValue,gradeLogic,truthTable} from '../src/lib/labs/logic.ts';
import {experimentModel,gradeNumeric} from '../src/lib/labs/experiments.ts';
test('five algorithms handle negatives, duplicates, absent targets and immutable input',()=>{
  const input=[5,-2,5,0,1],copy=[...input];
  for(const kind of ALGORITHMS){const steps=algorithmSteps(kind,input,99);assert.ok(steps.length>1);assert.deepEqual(input,copy);if(kind==='linear'||kind==='binary')assert.equal(algorithmAnswer(kind,input,99),'-1');else assert.deepEqual(steps.at(-1).values,[-2,0,1,5,5]);}
  assert.equal(algorithmAnswer('linear',input,5),'0');assert.ok([3,4].includes(Number(algorithmAnswer('binary',input,5))));assert.equal(parseArray('2, nope'),null);assert.deepEqual(parseArray('2; -1, 3'),[2,-1,3]);
});
test('logic grading checks behavior, rejects missing wires and cycles',()=>{
  const gates=[{id:'G1',type:'AND',x:0,y:0}],wires=[{from:'A',to:'G1',port:0},{from:'B',to:'G1',port:1},{from:'G1',to:'Y',port:0}];
  assert.equal(gradeLogic('and',gates,wires),1);assert.equal(gradeLogic('xor',gates,wires),.25);assert.equal(gradeLogic('and',gates,wires.slice(1)),0);
  assert.equal(logicValue(gates,[{from:'G1',to:'G1',port:0},{from:'B',to:'G1',port:1},{from:'G1',to:'Y',port:0}],false,false),null);
  const alternative=[{id:'N',type:'NAND',x:0,y:0},{id:'I',type:'NOT',x:0,y:0}];const altW=[{from:'A',to:'N',port:0},{from:'B',to:'N',port:1},{from:'N',to:'I',port:0},{from:'I',to:'Y',port:0}];assert.equal(gradeLogic('and',alternative,altW),1);assert.equal(truthTable(alternative,altW).length,4);
});
test('experiments apply formulas and numeric answers allow rounded decimal comma only',()=>{
  assert.equal(experimentModel('refresh',[300]).value,1000/300);assert.equal(experimentModel('storage',[1000,500]).value,2);assert.equal(experimentModel('binaryData',[42]).value,3);assert.equal(gradeNumeric('3,33',1000/300),1);assert.equal(gradeNumeric('0x10',16),0);assert.equal(gradeNumeric('100',2),0);assert.equal(gradeNumeric('2.999',3,true),0);
});
