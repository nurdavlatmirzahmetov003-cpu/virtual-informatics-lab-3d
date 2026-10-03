// ===== ЗЕРТХАНА МОДУЛЬДЕРІ + АВТО-БАҒАЛАУ =====
// Әр модуль: 20 ұпай. Барлығы 100. localStorage-та сақталады.

const STORE = 'vlab_progress_v1';
let progress = JSON.parse(localStorage.getItem(STORE) || '{}');
const save = () => localStorage.setItem(STORE, JSON.stringify(progress));
function setScore(mod, val){
  progress[mod] = Math.min(20, Math.max(progress[mod] || 0, val));
  save(); renderDash();
}

/* ---------- ҚЫЛЫМДАР (табтар) ---------- */
const tabs = document.querySelectorAll('#labTabs .tab');
tabs.forEach(t => t.onclick = () => {
  tabs.forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.lab-panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('lab-' + t.dataset.lab).classList.add('active');
});

/* ---------- ДАШБОРД ---------- */
const MODS = ['assemble','network','algo','logic','exp'];
function renderDash(){
  let total = 0;
  MODS.forEach(m => {
    const v = progress[m] || 0; total += v;
    const card = document.querySelector(`.dash-card[data-mod="${m}"]`);
    if (!card) return;
    card.querySelector('.dash-score').textContent = `${v}/20`;
    card.querySelector('.dash-bar i').style.width = (v/20*100) + '%';
    card.classList.toggle('done', v >= 14);
  });
  document.getElementById('totalVal').textContent = total;
}
renderDash();
document.getElementById('resetProgress').onclick = () => {
  if (confirm('Барлық нәтиже өшірілсін бе?')){ progress = {}; save(); renderDash(); }
};

/* ================================================
   1. КОМПЬЮТЕР ҚҰРАСТЫРУ
================================================ */
const PARTS = [
  { id:'cpu1', slot:'cpu', name:'Intel i3-10100F',  spec:'4 ядро • 3.6 ГГц', price:45000, img:'./assets/cpu_chip.jpg' },
  { id:'cpu2', slot:'cpu', name:'Ryzen 5 5600',     spec:'6 ядро • 4.4 ГГц', price:82000, img:'./assets/cpu_chip.jpg' },
  { id:'cpu3', slot:'cpu', name:'Intel i9-13900K',  spec:'24 ядро • 5.8 ГГц', price:210000, img:'./assets/cpu_chip.jpg' },
  { id:'cool1', slot:'cooler', name:'Boxed кулер',   spec:'35 Вт-ға дейін', price:8000, img:'./assets/ssd_nvme.jpg' },
  { id:'cool2', slot:'cooler', name:'DeepCool AK400',spec:'220 Вт-ға дейін', price:18000, img:'./assets/ssd_nvme.jpg' },
  { id:'mb1',  slot:'mb', name:'H510M (LGA1200)',  spec:'2×DDR4 • PCIe 3.0', price:40000, img:'./assets/motherboard.jpg' },
  { id:'mb2',  slot:'mb', name:'B550M (AM4)',      spec:'4×DDR4 • PCIe 4.0', price:55000, img:'./assets/motherboard.jpg' },
  { id:'ram1', slot:'ram', name:'8 ГБ DDR4 2666',  spec:'1×8 ГБ', price:16000, img:'./assets/ram_ddr5.jpg' },
  { id:'ram2', slot:'ram', name:'16 ГБ DDR4 3200', spec:'2×8 ГБ', price:32000, img:'./assets/ram_ddr5.jpg' },
  { id:'ram3', slot:'ram', name:'32 ГБ DDR4 3600', spec:'2×16 ГБ', price:64000, img:'./assets/ram_ddr5.jpg' },
  { id:'gpu0', slot:'gpu', name:'Интеграциялық',    spec:'тексеру үшін (әлсіз)', price:0, img:'./assets/gpu_card.jpg' },
  { id:'gpu1', slot:'gpu', name:'GTX 1650 4ГБ',    spec:'75 Вт • офис/ойын бастауыш', price:90000, img:'./assets/gpu_card.jpg' },
  { id:'gpu2', slot:'gpu', name:'RTX 3060 12ГБ',   spec:'170 Вт • ойындық', price:150000, img:'./assets/gpu_card.jpg' },
  { id:'ssd1', slot:'ssd', name:'SSD 256 ГБ',      spec:'SATA • оқу 550 МБ/с', price:15000, img:'./assets/pc_internals.jpg' },
  { id:'ssd2', slot:'ssd', name:'SSD 1 ТБ NVMe',   spec:'оқу 3500 МБ/с', price:42000, img:'./assets/pc_internals.jpg' },
  { id:'psu1', slot:'psu', name:'450 Вт',          spec:'жасандырма', price:14000, img:'./assets/power_supply.jpg' },
  { id:'psu2', slot:'psu', name:'650 Вт Bronze',   spec:'сапалы қорек', price:30000, img:'./assets/power_supply.jpg' },
];
let budget = 350000;
const chosen = {};   // slot -> part
const shop = document.getElementById('partsShop');

function renderShop(){
  shop.innerHTML = '';
  const activeSlot = document.querySelector('.part-card.selected')?.dataset.slot;
  PARTS.forEach(p => {
    const el = document.createElement('div');
    el.className = 'part-card' + (chosen[p.slot]?.id === p.id ? ' selected' : '');
    el.dataset.slot = p.slot;
    el.innerHTML = `<img src="${p.img}" class="p-thumb" alt="${p.name}"><div class="p-type">${slotName(p.slot)}</div><div class="p-name">${p.name}</div>
      <div class="p-spec">${p.spec}</div><div class="p-price">${p.price ? p.price.toLocaleString('ru-RU') + ' ₸' : 'тегін'}</div>`;
    el.onclick = () => pickPart(p);
    shop.appendChild(el);
  });
}
function slotName(s){ return {cpu:'Процессор',cooler:'Салқындатқыш',mb:'Аналық плата',ram:'ДДЖ',gpu:'Видеокарта',ssd:'SSD',psu:'Қорек'}[s]; }
function pickPart(p){
  const prev = chosen[p.slot];
  if (prev) budget += prev.price;
  chosen[p.slot] = p; budget -= p.price;
  if (budget < 0){
    budget += p.price;
    if (prev) budget -= prev.price;
    chosen[p.slot] = prev;
    alert('❌ Бюджет жетпейді! Арзандау нұсқаны таңда.');
  }
  syncBuildUI();
}
function syncBuildUI(){
  document.getElementById('budgetVal').textContent = budget.toLocaleString('ru-RU') + ' ₸';
  document.querySelectorAll('.slot').forEach(s => {
    const p = chosen[s.dataset.slot];
    s.classList.toggle('filled', !!p);
    s.querySelector('em').textContent = p ? `${p.name} — ${p.price.toLocaleString('ru-RU')} ₸` : 'таңдалмады';
  });
  renderShop();
}
renderShop(); syncBuildUI();

document.getElementById('buildBtn').onclick = () => {
  const res = document.getElementById('buildResult');
  res.innerHTML = '';
  const add = (ok, txt) => {
    const d = document.createElement('div');
    d.className = 'check-line ' + (ok ? 'ok' : 'bad');
    d.textContent = (ok ? '✅ ' : '❌ ') + txt;
    res.appendChild(d);
  };
  if (!chosen.cpu || !chosen.mb || !chosen.ram || !chosen.gpu || !chosen.ssd || !chosen.psu){
    add(false, 'Барлық бөліктерді таңдау керек (салқындатқыш міндетті емес, бірақ ұсынылады)!'); return;
  }
  let score = 0, max = 8;
  // 1. процессор
  const cpuGhz = { cpu1:3.6, cpu2:4.4, cpu3:5.8 }[chosen.cpu.id];
  add(cpuGhz >= 3.5, `Процессор жиілігі ≥ 3.5 ГГц (${cpuGhz.toFixed(1)} ГГц — ${cpuGhz>=3.5?'жарайды':'жетпейді'})`);
  if (cpuGhz >= 3.5) score++;
  // 2. RAM
  const ramOk = chosen.ram.id !== 'ram1';
  add(ramOk, `ДДЖ ≥ 16 ГБ (${chosen.ram.name})`); if (ramOk) score++;
  // 3. SSD
  const ssdOk = chosen.ssd.id === 'ssd2';
  add(ssdOk, 'SSD ≥ 512 ГБ (NVMe ұсынылады)'); if (ssdOk) score++;
  // 4. GPU
  const gpuOk = chosen.gpu.id === 'gpu2';
  add(gpuOk, 'Ойындық видеокарта (RTX 3060)'); if (gpuOk) score++;
  // 5. PSU жеткілікті ме
  const need = { gpu1:220, gpu2:400 }[chosen.gpu.id] || 150;
  const psuW = { psu1:450, psu2:650 }[chosen.psu.id];
  const psuOk = psuW >= need;
  add(psuOk, `Қорек қуаты жеткілікті (қажет ~${need} Вт, бар ${psuW} Вт)`); if (psuOk) score++;
  // 6. бюджет
  const spent = 350000 - budget;
  const budOk = budget >= 0;
  add(budOk, `Бюджет сақталды: ${spent.toLocaleString('ru-RU')} ₸ / 350 000 ₸`); if (budOk) score++;
  // 7. cooler
  add(!!chosen.cooler, 'Салқындатқыш таңдалды (процессор қызбайды!)'); if (chosen.cooler) score++;
  // 8. баланстық: қымбат CPU + әлсіз GPU емес
  const balance = !(chosen.cpu.id==='cpu3' && chosen.gpu.id!=='gpu2');
  add(balance, 'Конфигурация теңдестірілген (CPU басым болып кетпеген)');
  if (balance) score++;

  const pct = Math.round(score/max*20);
  const banner = document.createElement('div');
  banner.className = 'score-banner';
  banner.innerHTML = score===max ? '🏆 Керемет! Дұрыс ойындық ПК! <br>+'+pct+' ұпай' : `📊 Нәтиже: ${score}/${max} — ${pct}/20 ұпай. Қайта тырыс!`;
  res.appendChild(banner);
  setScore('assemble', pct);
  if (score >= 6 && typeof confetti === 'function') {
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 } });
  }
};

/* ================================================
   2. ЖЕЛІ ҚҰРУ
================================================ */
const netCanvas = document.getElementById('netCanvas');
const nctx = netCanvas.getContext('2d');
const DEV_ICONS = { internet:'🌍', router:'📡', switch:'🔀', pc:'💻', server:'🗄️', printer:'🖨️' };
const DEV_NAMES = { internet:'Интернет', router:'Роутер', switch:'Коммутатор', pc:'Компьютер', server:'Сервер', printer:'Принтер' };
let nodes = [], links = [], selected = null, pendingLink = null, dragNode = null;

document.querySelectorAll('.dev-btn').forEach(b => b.onclick = () => {
  if (nodes.length >= 12) return alert('Максимум 12 құрылғы!');
  const type = b.dataset.dev;
  if (nodes.filter(n=>n.type===type).length >= (type==='internet'?1:3)) return alert('Бұл типтен артық қосуға болмады!');
  nodes.push({ id:Date.now()+Math.random(), type, x:140+Math.random()*800, y:110+Math.random()*240 });
  drawNet();
});
document.getElementById('netClear').onclick = () => { nodes=[]; links=[]; pendingLink=null; drawNet(); };

function nodeAt(x,y){ return nodes.find(n => Math.hypot(n.x-x, n.y-y) < 34); }
function toCanvas(e){
  const r = netCanvas.getBoundingClientRect();
  return { x:(e.clientX-r.left)*(netCanvas.width/r.width), y:(e.clientY-r.top)*(netCanvas.height/r.height) };
}
function toggleLink(A, B){
  const a = Math.min(A.id, B.id), b = Math.max(A.id, B.id);
  const exists = links.find(l => (l.a===a&&l.b===b)||(l.a===b&&l.b===a));
  if (exists) links = links.filter(l => l!==exists);
  else links.push({ a, b });
}
let downPos = null;
netCanvas.addEventListener('pointerdown', e => {
  const {x,y} = toCanvas(e);
  downPos = {x,y};
  const n = nodeAt(x,y);
  if (!n) { pendingLink=null; selected=null; drawNet(); return; }
  if (pendingLink && pendingLink !== n && n.type !== 'internet'){
    toggleLink(pendingLink, n); pendingLink = null; selected = n; drawNet(); return;
  }
  dragNode = n; selected = n;
});
netCanvas.addEventListener('pointermove', e => {
  if (!dragNode) return;
  const {x,y} = toCanvas(e);
  dragNode.x = Math.max(40, Math.min(netCanvas.width-40, x));
  dragNode.y = Math.max(40, Math.min(netCanvas.height-40, y));
  drawNet();
});
netCanvas.addEventListener('pointerup', e => {
  if (!dragNode) return;
  const n = dragNode; dragNode = null;
  const {x,y} = toCanvas(e);
  const moved = downPos && Math.hypot(x-downPos.x, y-downPos.y) > 6;
  const over = nodeAt(x,y);
  if (over && over !== n && n.type !== 'internet'){
    toggleLink(n, over); pendingLink = null;
  } else if (!moved){ pendingLink = n; }   // жай шерту → жалғау режимі
  drawNet();
});

function drawNet(){
  nctx.clearRect(0,0,netCanvas.width,netCanvas.height);
  // тор фон
  nctx.strokeStyle = 'rgba(255,255,255,.04)';
  for(let x=0;x<netCanvas.width;x+=40){ nctx.beginPath(); nctx.moveTo(x,0); nctx.lineTo(x,netCanvas.height); nctx.stroke(); }
  for(let y=0;y<netCanvas.height;y+=40){ nctx.beginPath(); nctx.moveTo(0,y); nctx.lineTo(netCanvas.width,y); nctx.stroke(); }
  // сызықтар
  links.forEach(l => {
    const A = nodes.find(n=>n.id===l.a), B = nodes.find(n=>n.id===l.b);
    if(!A||!B) return;
    const grad = nctx.createLinearGradient(A.x,A.y,B.x,B.y);
    grad.addColorStop(0,'#22d3ee'); grad.addColorStop(1,'#a78bfa');
    nctx.strokeStyle = grad; nctx.lineWidth = 3.5; nctx.lineCap='round';
    nctx.beginPath(); nctx.moveTo(A.x,A.y); nctx.lineTo(B.x,B.y); nctx.stroke();
    // деректер нүктесі
    const t = (Date.now()%1500)/1500;
    nctx.fillStyle = '#fff';
    nctx.beginPath(); nctx.arc(A.x+(B.x-A.x)*t, A.y+(B.y-A.y)*t, 3.5, 0, 7); nctx.fill();
  });
  // құрылғылар
  nodes.forEach(n => {
    nctx.beginPath(); nctx.arc(n.x, n.y, 30, 0, 7);
    nctx.fillStyle = n===selected ? 'rgba(34,211,238,.25)' : 'rgba(22,25,54,.95)';
    nctx.fill();
    nctx.strokeStyle = n===pendingLink ? '#fbbf24' : (n===selected ? '#22d3ee' : 'rgba(255,255,255,.25)');
    nctx.lineWidth = 2.5; nctx.stroke();
    nctx.font = '26px serif'; nctx.textAlign='center'; nctx.textBaseline='middle';
    nctx.fillText(DEV_ICONS[n.type], n.x, n.y+1);
    nctx.font = '600 11.5px Manrope'; nctx.fillStyle = '#9aa0c3';
    nctx.fillText(DEV_NAMES[n.type], n.x, n.y+46);
  });
  if (pendingLink){
    nctx.strokeStyle='rgba(251,191,36,.8)'; nctx.setLineDash([6,6]); nctx.lineWidth=2;
    nctx.beginPath(); nctx.moveTo(pendingLink.x, pendingLink.y); nctx.lineTo(mousePos.x, mousePos.y); nctx.stroke(); nctx.setLineDash([]);
  }
}
let mousePos = {x:0,y:0};
netCanvas.addEventListener('pointermove', e => { mousePos = toCanvas(e); });
setInterval(drawNet, 50);

document.getElementById('netCheck').onclick = () => {
  const res = document.getElementById('netResult');
  res.innerHTML = '';
  const add = (ok, txt) => {
    const d = document.createElement('div');
    d.className = 'check-line ' + (ok?'ok':'bad'); d.textContent = (ok?'✅ ':'❌ ')+txt;
    res.appendChild(d);
  };
  if (nodes.length < 6){ add(false,'Құрылғыларды қос: интернет, роутер, коммутатор, 2 ПК, сервер, принтер!'); return; }
  const byType = t => nodes.filter(n=>n.type===t);
  let score = 0; const max = 8;
  const has = t => byType(t).length >= 1;
  add(has('internet') && has('router') && has('switch') && byType('pc').length>=2 && has('server') && has('printer'),
      'Барлық қажетті құрылғылар орналастырылды'); if (has('internet')&&has('router')&&has('switch')&&byType('pc').length>=2&&has('server')&&has('printer')) score++;
  // байланыс графы
  const adj = {}; nodes.forEach(n=>adj[n.id]=[]); links.forEach(l=>{ if(adj[l.a]&&adj[l.b]){adj[l.a].push(l.b); adj[l.b].push(l.a);} });
  const seen = new Set(); const stack = nodes.length?[nodes[0].id]:[];
  while(stack.length){ const cur = stack.pop(); if(seen.has(cur)) continue; seen.add(cur); adj[cur].forEach(x=>stack.push(x)); }
  const allConn = seen.size === nodes.length;
  add(allConn, 'Барлық құрылғы бір желіде байланысқан'); if (allConn) score++;
  // интернет → роутер
  const inet = byType('internet')[0];
  const inetConn = inet && adj[inet.id].length===1 && adj[inet.id].some(id => nodes.find(n=>n.id===id)?.type==='router');
  add(inetConn, 'Интернет тек роутермен жалғанған'); if (inetConn) score++;
  // роутер → коммутатор
  const router = byType('router')[0], sw = byType('switch')[0];
  const r2s = router && sw && links.some(l => (l.a===router.id&&l.b===sw.id)||(l.a===sw.id&&l.b===router.id));
  add(r2s, 'Роутер коммутаторға жалғанған'); if (r2s) score++;
  // ПК-лер коммутаторға
  const pcsOk = byType('pc').every(p => adj[p.id].some(id => id===sw?.id));
  add(pcsOk, 'Барлық компьютер коммутаторға жалғанған (жұлдызды топология)'); if (pcsOk) score++;
  // сервер коммутаторға
  const srv = byType('server')[0];
  const srvOk = srv && adj[srv.id].some(id => id===sw?.id);
  add(srvOk, 'Сервер коммутаторға жалғанған'); if (srvOk) score++;
  // принтер → сервер
  const prn = byType('printer')[0];
  const prnOk = prn && srv && adj[prn.id].some(id => id===srv.id);
  add(prnOk, 'Принтер серверге жалғанған'); if (prnOk) score++;
  // артық байланыс жоқ: интернетке тек роутер қосылған
  const noDirect = !inet || adj[inet.id].every(id => nodes.find(n=>n.id===id)?.type==='router');
  add(noDirect, 'Құрылғылар интернетке тікелей (роутерсіз) жалғанбаған'); if (noDirect) score++;

  const pct = Math.round(score/max*20);
  const banner = document.createElement('div');
  banner.className = 'score-banner';
  banner.innerHTML = score===max ? '🌐 Желі дұрыс құрылды! Сен нағыз нетуорк-админсің! +'+pct+' ұпай' : `📊 Нәтиже: ${score}/${max} — ${pct}/20 ұпай`;
  res.appendChild(banner);
  setScore('network', pct);
};
drawNet();

/* ================================================
   3. АЛГОРИТМ ВИЗУАЛИЗАЦИЯСЫ
================================================ */
let arr = [], gen = null, playing = false, playTimer = null, cmp=0, swp=0;
const barsEl = document.getElementById('algoBars');

function shuffled(n=14){
  const a = Array.from({length:n}, (_,i)=> Math.round(12 + i*(180/n)));
  for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function* bubbleGen(a){
  cmp=0; swp=0;
  for (let i=0;i<a.length-1;i++) for (let j=0;j<a.length-1-i;j++){
    yield { a:[...a], cmpI:j, cmpJ:j+1, line:3, cmp:++cmp };
    if (a[j] > a[j+1]){ [a[j],a[j+1]]=[a[j+1],a[j]]; yield { a:[...a], cmpI:j, cmpJ:j+1, swap:true, line:4, swap:++swp, cmp }; }
  }
  yield { a:[...a], done:true, line:0, cmp, swap:swp };
}
function* selectGen(a){
  cmp=0; swp=0;
  for (let i=0;i<a.length-1;i++){
    let m = i;
    for (let j=i+1;j<a.length;j++){ yield { a:[...a], cmpI:m, cmpJ:j, line:1, cmp:++cmp };
      if (a[j] < a[m]) m = j; }
    if (m!==i){ [a[i],a[m]]=[a[m],a[i]]; yield { a:[...a], cmpI:i, cmpJ:m, swap:true, line:2, swap:++swp, cmp }; }
  }
  yield { a:[...a], done:true, line:0, cmp, swap:swp };
}
function resetAlgo(){
  arr = shuffled(); gen = null; playing = false; clearInterval(playTimer);
  cmp=0; swp=0; renderBars(arr); highlightLine(0);
  document.getElementById('cmpCount').textContent = 0;
  document.getElementById('swapCount').textContent = 0;
}
function renderBars(a, hi){
  const mx = Math.max(...a, 1);
  barsEl.innerHTML = a.map((v,i)=>{
    let cls = 'bar';
    if (hi){ if (i===hi.cmpI||i===hi.cmpJ) cls += hi.swap?' swap':' cmp'; }
    return `<div class="${cls}" style="height:${v/mx*100}%"><span>${v}</span></div>`;
  }).join('');
}
function highlightLine(n){
  document.querySelectorAll('#algoPseudo div').forEach(d => d.classList.toggle('hl', +d.dataset.line===n));
}
function stepOnce(){
  if (!gen){ const type = document.getElementById('algoType').value;
    gen = type==='bubble' ? bubbleGen([...arr]) : selectGen([...arr]); }
  const st = gen.next();
  if (st.done || st.value.done){
    arr = st.value ? st.value.a : arr;
    renderBars(arr);
    highlightLine(0); playing = false; clearInterval(playTimer);
    barsEl.querySelectorAll('.bar').forEach(b=>b.classList.add('sorted'));
    if (!progress._algoDone){ progress._algoDone = true; setScore('algo', (progress.algo||0)+15); }
    return true;
  }
  arr = st.value.a;
  renderBars(arr, st.value);
  highlightLine(st.value.line);
  document.getElementById('cmpCount').textContent = st.value.cmp || 0;
  document.getElementById('swapCount').textContent = st.value.swap || 0;
  return false;
}
document.getElementById('algoStep').onclick = () => stepOnce();
document.getElementById('algoShuffle').onclick = resetAlgo;
document.getElementById('algoPlay').onclick = () => {
  playing = !playing;
  document.getElementById('algoPlay').textContent = playing ? '⏸ Тоқтату' : '▶ Ойнату';
  if (playing) playTimer = setInterval(() => { if (stepOnce()){ playing=false; document.getElementById('algoPlay').textContent='▶ Ойнату'; clearInterval(playTimer); } }, 120);
  else clearInterval(playTimer);
};
document.getElementById('algoType').onchange = resetAlgo;
resetAlgo();

/* ---------- квиз (жалпы функция) ---------- */
function wireQuiz(quizId, mod, pts){
  const q = document.getElementById(quizId);
  q.querySelectorAll('.quiz-opt').forEach(b => b.onclick = () => {
    const fb = q.querySelector('.quiz-fb');
    q.querySelectorAll('.quiz-opt').forEach(x=>{x.disabled=true;});
    if (b.dataset.ok === '1'){ b.classList.add('correct'); fb.textContent = '🎉 Дұрыс! +'+pts+' ұпай'; fb.className='quiz-fb ok'; setScore(mod, (progress[mod]||0)+pts); }
    else { b.classList.add('wrong'); fb.textContent = '❌ Қате, тағы ойлан!'; fb.className='quiz-fb bad';
      setTimeout(()=>{ q.querySelectorAll('.quiz-opt').forEach(x=>{x.disabled=false;}); b.classList.remove('wrong'); }, 1200); }
  });
}
wireQuiz('algoQuiz','algo',5);

/* ================================================
   4. ЛОГИКАЛЫҚ СХЕМАЛАР
================================================ */
let gate = null, tA = 0, tB = 0;
const GATES = {
  AND:  (a,b)=>a&&b,   OR: (a,b)=>a||b,
  NAND: (a,b)=>!(a&&b), XOR:(a,b)=>a!==b,
};
const gatePalette = document.getElementById('gatePalette');
gatePalette.querySelectorAll('button').forEach(b => b.onclick = () => {
  gate = b.dataset.gate;
  gatePalette.querySelectorAll('button').forEach(x=>x.classList.toggle('active', x===b));
  document.getElementById('gateChip').textContent = gate;
  document.getElementById('gateChip').classList.add('hot');
  updateLogic();
});
function out(){ return gate ? GATES[gate](!!tA, !!tB) ? 1 : 0 : 0; }
function updateLogic(){
  const swA = document.getElementById('swA'), swB = document.getElementById('swB');
  swA.textContent = tA; swA.classList.toggle('on', !!tA);
  swB.textContent = tB; swB.classList.toggle('on', !!tB);
  const bulb = document.getElementById('bulb');
  const q = out();
  bulb.classList.toggle('lit', !!q);
  bulb.textContent = q ? '💡' : '🔌';
  document.getElementById('outWire').style.stroke = q ? '#fbbf24' : 'rgba(154,160,195,.5)';
  // ақиқат кестесі
  const target = [0,0,1,1]; // XOR-ға ұқсас мақсат: A=0,B=0→0; 0,1→1; 1,0→1; 1,1→0 (XOR)
  const targetFn = [0,1,1,0];
  const tbl = document.getElementById('truthTable');
  tbl.innerHTML = '<tr><th>A</th><th>B</th><th>Сенің жауабың</th><th>Мақсат</th></tr>';
  let allMatch = !!gate;
  for (let a=0;a<2;a++) for (let b=0;b<2;b++){
    const mine = GATES[gate||'AND'](!!a,!!b)?1:0;
    const tgt = targetFn[a*2+b];
    const ok = mine===tgt;
    if(!ok) allMatch = false;
    tbl.innerHTML += `<tr><td>${a}</td><td>${b}</td><td class="${ok?'match':'diff'}">${mine}</td><td>${tgt}</td></tr>`;
  }
  if (allMatch && !progress._logicDone){
    progress._logicDone = true;
    setTimeout(()=> setScore('logic', (progress.logic||0)+15), 400);
  }
}
document.getElementById('swA').onclick = ()=>{ tA^=1; updateLogic(); };
document.getElementById('swB').onclick = ()=>{ tB^=1; updateLogic(); };
updateLogic();
wireQuiz('logicQuiz','logic',5);

/* ================================================
   5. ВИРТУАЛДЫ ТӘЖІРИБЕЛЕР
================================================ */
// 1) Екілік сандар
let binTarget = 0, bits = Array(8).fill(0);
const bitRow = document.getElementById('bitRow');
for (let i=7;i>=0;i--){
  const d = document.createElement('div');
  d.className = 'bit';
  d.innerHTML = `<button data-i="${i}">0</button><small>2^${i}=${1<<i}</small>`;
  bitRow.appendChild(d);
}
bitRow.querySelectorAll('button').forEach(b => b.onclick = () => {
  const i = +b.dataset.i; bits[i]^=1;
  b.textContent = bits[i]; b.classList.toggle('on', !!bits[i]);
  const val = bits.reduce((s,v,k)=>s+v*(1<<k),0);
  document.getElementById('binValue').textContent = val;
  const st = document.getElementById('binStatus');
  if (val === binTarget){
    st.textContent = '✅ Дұрыс!'; st.className='ok';
    if (!progress._binDone){ progress._binDone = true; setScore('exp', (progress.exp||0)+10); }
    setTimeout(newBinTarget, 1500);
  } else { st.textContent = val < binTarget ? '⬆️ әлі кем' : '⬇️ артық'; st.className='no'; }
});
function newBinTarget(){
  binTarget = 20 + Math.floor(Math.random()*200);
  document.getElementById('binTarget').textContent = binTarget;
  progress._binDone = false;
  bits = Array(8).fill(0);
  bitRow.querySelectorAll('button').forEach(b=>{ b.textContent='0'; b.classList.remove('on'); });
  document.getElementById('binValue').textContent = 0;
  document.getElementById('binStatus').textContent = '';
}
newBinTarget();

// 2) Өлшем бірліктері
const CONV_TASKS = [
  { q:'2 ГБ неше <b>МБ</b>?', ans:2048, unit:'МБ', hint:'1 ГБ = 1024 МБ' },
  { q:'2048 КБ неше <b>МБ</b>?', ans:2, unit:'МБ', hint:'1024 КБ = 1 МБ' },
  { q:'3 ГБ неше <b>МБ</b>?', ans:3072, unit:'МБ', hint:'1 ГБ = 1024 МБ' },
  { q:'1 ГБ неше <b>КБ</b>?', ans:1048576, unit:'КБ', hint:'1 МБ = 1024 КБ' },
];
let convIdx = 0;
function newConv(){
  const t = CONV_TASKS[convIdx % CONV_TASKS.length];
  document.getElementById('convTask').innerHTML = t.q + ` <small style="color:var(--dim)">(Кеңес: ${t.hint})</small>`;
  return t;
}
document.getElementById('convCheck').onclick = () => {
  const t = CONV_TASKS[convIdx % CONV_TASKS.length];
  const fb = document.getElementById('convFb');
  const v = parseFloat(document.getElementById('convAnswer').value);
  if (v === t.ans){
    fb.textContent = '🎉 Дұрыс! ' + t.ans + ' ' + t.unit; fb.className = 'quiz-fb ok';
    if (!progress._convDone){ progress._convDone = true; setScore('exp', (progress.exp||0)+5); }
    convIdx++; setTimeout(()=>{ progress._convDone=false; document.getElementById('convAnswer').value=''; fb.textContent=''; newConv(); }, 1800);
  } else { fb.textContent = '❌ Қате! ' + t.hint; fb.className = 'quiz-fb bad'; }
};
newConv();

// 3) RGB
function updRGB(){
  const r = +document.getElementById('rR').value, g = +document.getElementById('rG').value, b = +document.getElementById('rB').value;
  document.getElementById('rgbPreview').style.background = `rgb(${r},${g},${b})`;
  const fb = document.getElementById('rgbFb');
  const dist = Math.hypot(r-0, g-255, b-255);
  if (dist <= 30){
    fb.textContent = '🌈 Керемет! Түс дұрыс: rgb(0,255,255)'; fb.className = 'quiz-fb ok';
    if (!progress._rgbDone){ progress._rgbDone = true; setScore('exp', (progress.exp||0)+5); }
  } else if (dist <= 90){ fb.textContent = 'Жақындайсың! Сәл қиындық бар...'; fb.className='quiz-fb'; fb.style.color='var(--warn)'; }
  else { fb.textContent = 'Керек: Қызыл=0, Жасыл=max, Көк=max'; fb.className = 'quiz-fb bad'; fb.style.color=''; }
}
['rR','rG','rB'].forEach(id => document.getElementById(id).addEventListener('input', updRGB));
updRGB();

// Прогресс бөліміне өту
document.getElementById('dashBtn').onclick = () => document.getElementById('dashboard').scrollIntoView({ behavior:'smooth' });
