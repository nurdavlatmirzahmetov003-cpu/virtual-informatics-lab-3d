import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSetupRequest, suggestSetup, isValidSuggestion } from '../src/lib/studio/assistant.ts';
import { resolveBuild } from '../src/lib/studio/build.ts';
const defaults={budget:800000,purpose:'universal',style:'black'};
test('Kazakh, Russian and English money, purpose and colour requests',()=>{
 for(const [message,budget,purpose,style] of [
   ['Маған 800 000 теңгеге ойын компьютері керек',800000,'gaming','black'],
   ['1,2 млн тенге на программирование, белый корпус',1200000,'programming','white'],
   ['1 200 000 tenge white setup',1200000,'universal','white'],
   ['500к оқу RGB-сіз',500000,'study','noRgb'],
   ['800 мың теңгеге 3D дизайн',800000,'design3d','black'],
 ]){const parsed=parseSetupRequest(message,defaults);assert.equal(parsed.budget,budget,message);assert.equal(parsed.purpose,purpose,message);assert.equal(parsed.style,style,message);}
 assert.equal(parseSetupRequest('300 Гц ASUS монитор және Logitech тышқан',defaults).budget,800000);
});
test('all six workloads have compatible catalog-only suggestions across five budgets',()=>{
 for(const purpose of ['gaming','study','programming','design3d','streaming','universal']) for(const budget of [300000,500000,800000,1200000,2000000]){
   const suggestion=suggestSetup({...defaults,purpose,budget});
   assert.ok(isValidSuggestion(suggestion),`${purpose} ${budget}`);
   assert.equal(suggestion.overBudget,Math.max(0,suggestion.total-budget));
 }
});
test('300 Hz ASUS and Logitech constraints survive budget allocation',()=>{
 const suggestion=suggestSetup(parseSetupRequest('1 200 000 теңгеге ойын, ASUS 300 Гц және Logitech тышқан',defaults));
 const products=resolveBuild(suggestion.build);
 assert.equal(products.monitor.id,'mon-asus-xg27aqmr');
 assert.match(products.mouse.brand,/Logitech/);
 assert.ok(isValidSuggestion(suggestion));
 assert.ok(suggestion.total<=1200000);
 assert.deepEqual(suggestion.unavailable,[]);
});
test('unknown devices and insufficient budgets are disclosed; invalid IDs cannot be applied',()=>{
 const notFound=suggestSetup({...defaults,minHz:1000});
 assert.equal(notFound.unavailable.length,1);
 const low=suggestSetup({...defaults,budget:300000,minHz:300,monitorBrand:'ASUS'});
 assert.ok(low.overBudget>0);
 assert.equal(isValidSuggestion({...low,build:{...low.build,cpu:'invented-model'}}),false);
});
