import test from 'node:test';
import assert from 'node:assert/strict';
import {ALGORITHMS,algorithmSteps,algorithmAnswer,parseArray} from '../src/lib/labs/algorithms.ts';
import {logicValue,gradeLogic,truthTable} from '../src/lib/labs/logic.ts';
import {gradeNetwork,networkStart,ping,ipv4,validMask} from '../src/lib/labs/network.ts';
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
test('network grading uses real connectivity, address uniqueness, mask and gateway checks',()=>{
  const data=networkStart('lan');assert.equal(gradeNetwork('lan',data.nodes,data.links),0);data.links=[{a:'PC1',b:'SW1'},{a:'PC2',b:'SW1'},{a:'PC3',b:'SW1'}];assert.equal(gradeNetwork('lan',data.nodes,data.links),1);
  data.nodes[2].ip=data.nodes[0].ip;assert.equal(ping(data.nodes,data.links,'PC1','PC2').reason,'duplicateIP');data.nodes[2].ip='192.168.2.13';assert.equal(ping(data.nodes,data.links,'PC1','PC3').reason,'subnet');data.nodes[2].ip='192.168.1.255';assert.equal(ping(data.nodes,data.links,'PC1','PC3').reason,'invalidIP');
  assert.equal(ping(data.nodes,[{a:'PC1',b:'PC2'},{a:'PC2',b:'PC3'}],'PC1','PC3').reason,'noPath');
  const router=networkStart('router');router.links=[{a:'PC1',b:'SW1'},{a:'PC2',b:'SW1'},{a:'PC3',b:'SW1'},{a:'SW1',b:'R1'}];assert.equal(gradeNetwork('router',router.nodes,router.links),1);router.nodes[0].gateway='192.168.1.254';assert.equal(gradeNetwork('router',router.nodes,router.links),0);
  assert.equal(ipv4('999.1.1.1'),null);assert.ok(validMask('255.255.255.0'));assert.ok(!validMask('255.0.255.0'));
});
test('experiments apply formulas and numeric answers allow rounded decimal comma only',()=>{
  assert.equal(experimentModel('refresh',[300]).value,1000/300);assert.equal(experimentModel('storage',[1000,500]).value,2);assert.equal(experimentModel('binaryData',[42]).value,3);assert.equal(gradeNumeric('3,33',1000/300),1);assert.equal(gradeNumeric('0x10',16),0);assert.equal(gradeNumeric('100',2),0);assert.equal(gradeNumeric('2.999',3,true),0);
});
