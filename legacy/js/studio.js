// ================================================================
//  ZERTHANA STUDIO — сетап конфигураторы (фотореалистік 3D)
//  Каталог • 360° • жинау анимациясы • чат-бот • RGB темалар
// ================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { deviceThumb } from './thumbs.js';

/* ---------- РЕНДЕР ---------- */
const canvas = document.getElementById('studioCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x2a2f3d);
scene.fog = new THREE.Fog(0x2a2f3d, 11, 30);
const camera = new THREE.PerspectiveCamera(42, innerWidth/innerHeight, .05, 60);
camera.position.set(-1.9, 1.75, 3.1);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1.05, 0);
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.minDistance = 1.2; controls.maxDistance = 8;
controls.maxPolarAngle = Math.PI*.52;
controls.autoRotate = true; controls.autoRotateSpeed = 1.1;
controls.addEventListener('start', ()=> controls.autoRotate = false);
controls.addEventListener('end', ()=> { idleTimer = 6; });

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .45, .8, .8);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ---------- ЖАРЫҚ ---------- */
scene.add(new THREE.AmbientLight(0x8a95b5, 1.35));
scene.add(new THREE.HemisphereLight(0xcdd6ee, 0x3a4356, .85));
const key = new THREE.SpotLight(0xfff1de, 110, 18, .85, .5);
key.position.set(2.2, 5.5, 3.2); key.castShadow = true;
key.shadow.mapSize.set(2048,2048); key.shadow.bias = -.0002;
scene.add(key);
const blueGlow = new THREE.PointLight(0x2f7bff, 14, 7); blueGlow.position.set(0, 1.7, -1.1); scene.add(blueGlow);
const warmLamp = new THREE.PointLight(0xffb066, 8, 6); warmLamp.position.set(2.6, 3.2, -1.4); scene.add(warmLamp);

/* ---------- МАТЕРИАЛДАР ---------- */
const TL = new THREE.TextureLoader();
function tex(name, srgb=false){
  const t = TL.load('textures/' + name);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const wood = tex('wood_diff.jpg', true); wood.repeat.set(2.2,1); wood.colorSpace = THREE.SRGBColorSpace;
const woodN = tex('wood_nor.jpg'); woodN.repeat.set(2.2,1);
const woodR = tex('wood_rough.jpg'); woodR.repeat.set(2.2,1);
const M = {
  desk:  new THREE.MeshStandardMaterial({ map:wood, normalMap:woodN, roughnessMap:woodR, roughness:1, color:0xf2e0bd, envMapIntensity:.55 }),
  dark:  new THREE.MeshStandardMaterial({ color:0x0b0c11, roughness:.5, metalness:.25 }),
  metal: new THREE.MeshStandardMaterial({ color:0x24262f, metalness:.9, roughness:.3 }),
  alu:   new THREE.MeshStandardMaterial({ color:0x8f95a3, metalness:.95, roughness:.3 }),
  mat:   new THREE.MeshStandardMaterial({ color:0x0b0c10, roughness:.95, envMapIntensity:.12 }),
  deskDark: new THREE.MeshStandardMaterial({ color:0x0b0c11, roughness:.5, metalness:.25 }),
  wall:  new THREE.MeshStandardMaterial({ color:0xaeb2bd, roughness:.95 }),
  slat:  new THREE.MeshStandardMaterial({ color:0x8a7458, roughness:.8 }),
  black: new THREE.MeshStandardMaterial({ color:0x0d0e13, roughness:.42, metalness:.2 }),
  white: new THREE.MeshStandardMaterial({ color:0xe6e8ec, roughness:.4 }),
  pcb:   new THREE.MeshStandardMaterial({ color:0x10131a, roughness:.5, metalness:.3 }),
  silver:new THREE.MeshStandardMaterial({ color:0xb9bec8, metalness:.95, roughness:.22 }),
  glass: new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:.04, transmission:.92, thickness:.05, ior:1.5, envMapIntensity:1.1, transparent:true }),
  glassThin: new THREE.MeshPhysicalMaterial({ color:0x9db8dd, roughness:.08, metalness:.15, transparent:true, opacity:.06, envMapIntensity:.15, side:THREE.DoubleSide }),
};
const rbox = (w,h,d,r)=> new RoundedBoxGeometry(w,h,d,3,Math.min(r, Math.min(w,h,d)/2*.49));
function mesh(g,m,x=0,y=0,z=0,p=scene){ const o=new THREE.Mesh(g,m); o.position.set(x,y,z); o.castShadow=o.receiveShadow=true; p.add(o); return o; }

/* ---------- БӨЛМЕ (фотодағыдай) ---------- */
{
  const floor = mesh(new THREE.CircleGeometry(15,48), new THREE.MeshStandardMaterial({ color:0x7d828e, roughness:.8 }), 0,0,0);
  floor.rotation.x = -Math.PI/2;
  mesh(new THREE.BoxGeometry(15,6.4,.25), M.wall, 0,3.1,-2.6).receiveShadow = true;   // артқы қабырға
  // оң жақ ағаш жолақтар (слат панель)
  for (let i=0;i<12;i++) mesh(new THREE.BoxGeometry(.09,3.4,.07), M.slat, 1.9, 1.9, -2.4 + (i%2)*.012).position.x = 1.62 + i*.075;
  // жылы LED жолақ
  const led = mesh(new THREE.BoxGeometry(1.2,.03,.03), new THREE.MeshStandardMaterial({ color:0x000, emissive:0xffb066, emissiveIntensity:2.6 }), 2.0, 3.35, -2.32);
  // қабырға суреттері (жарқын бөлме декоры)
  function art(x, c1, c2, label){
    const cv = document.createElement('canvas'); cv.width=200; cv.height=260;
    const cc = cv.getContext('2d');
    const g = cc.createLinearGradient(0,0,200,260);
    g.addColorStop(0,c1); g.addColorStop(1,c2);
    cc.fillStyle = g; cc.fillRect(0,0,200,260);
    cc.fillStyle = 'rgba(255,255,255,.85)';
    cc.beginPath(); cc.roundRect(24,90,152,70,8); cc.fill();
    cc.fillStyle = '#10131f'; cc.font = '800 22px Unbounded'; cc.textAlign='center';
    cc.fillText(label, 100, 135);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    mesh(new THREE.BoxGeometry(.9,1.16,.04), new THREE.MeshStandardMaterial({ color:0xe8e4dc, roughness:.6 }), x, 2.5, -2.44);
    mesh(new THREE.PlaneGeometry(.8,1.05), new THREE.MeshStandardMaterial({ map:t, roughness:.55 }), x, 2.5, -2.41);
  }
  art(-1.5, '#7cd6ff', '#4f7cf0', 'Z');
  art(0.1, '#ffd98a', '#ff8a7a', 'IT');
  // жасыл өсімдік (жоғары оң жақта)
  const plant = new THREE.Group();
  mesh(new THREE.CylinderGeometry(.09,.07,.16,16), new THREE.MeshStandardMaterial({color:0x353a47, roughness:.6}), 0,0,0, plant);
  for (let i=0;i<7;i++){
    const leaf = mesh(new THREE.SphereGeometry(.06,10,8), new THREE.MeshStandardMaterial({color:0x2e6b3c, roughness:.7}),
      Math.sin(i*1.3)*.07, .14+i*.03, Math.cos(i*1.3)*.07, plant);
    leaf.scale.set(1,.5,1.6);
  }
  plant.position.set(2.05, 3.05, -2.2); scene.add(plant);
  // жұлдыздар
  const pg = new THREE.BufferGeometry();
  const pp = new Float32Array(300*3);
  for (let i=0;i<300;i++){ pp[i*3]=(Math.random()-.5)*22; pp[i*3+1]=Math.random()*7; pp[i*3+2]=(Math.random()-.5)*20; }
  pg.setAttribute('position', new THREE.BufferAttribute(pp,3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color:0x8ab4ff, size:.016, transparent:true, opacity:.25 })));
}

/* ---------- ҮСТЕЛ ---------- */
const DESK_Y = .76;
{
  mesh(rbox(2.7,.06,1.25,.01), M.desk, 0, DESK_Y, 0);
  mesh(rbox(.06,DESK_Y-.04,1.2,.008), M.dark, -1.29, DESK_Y/2, 0);   // бүйір тіректер
  mesh(rbox(.06,DESK_Y-.04,1.2,.008), M.dark,  1.29, DESK_Y/2, 0);
}

/* ---------- МОНИТОР ЭКРАНЫ (көк құйын) ---------- */
const scrCanvas = document.createElement('canvas');
scrCanvas.width = 768; scrCanvas.height = 432;
const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace;
{
  const c = scrCanvas.getContext('2d');
  c.fillStyle = '#02040c'; c.fillRect(0,0,768,432);
  c.save(); c.translate(384,216);
  for (let i=0;i<60;i++){
    const a = i/60 * Math.PI*6, r = 8 + i*2.1;
    c.beginPath();
    c.strokeStyle = `rgba(${40+i*3|0},${110+i*2|0},255,${.5 - i*.006})`;
    c.lineWidth = 2.2;
    c.arc(Math.cos(a)*r*.9, Math.sin(a)*r*.55, r*.42, a, a+2.4);
    c.stroke();
  }
  c.restore();
  const g = c.createRadialGradient(384,216,0,384,216,430);
  g.addColorStop(0,'rgba(20,60,160,0)'); g.addColorStop(1,'rgba(0,0,8,.55)');
  c.fillStyle = g; c.fillRect(0,0,768,432);
  scrTex.needsUpdate = true;
}

/* ---------- RGB ТЕМА ---------- */
const THEMES = {
  blue:   0x2f7bff, cyan: 0x22d3ee, purple: 0xa855f7,
  red:    0xff3860, green: 0x22ff88, rainbow: null,
};
let themeName = 'blue';
const themeMats = [];   // {mat, off}
function themeMat(off=0, intensity=2.4){
  const m = new THREE.MeshStandardMaterial({ color:0x000000, emissive:0x2f7bff, emissiveIntensity:intensity, roughness:.4 });
  themeMats.push({ mat:m, off });
  return m;
}
function applyTheme(){
  const t = clockT();
  for (const {mat,off} of themeMats){
    if (THEMES[themeName] === null) mat.emissive.setHSL((1-((t*.07+off)%1))%1, .9, .55);
    else mat.emissive.setHex(THEMES[themeName]);
  }
  blueGlow.color.setHex(THEMES[themeName] ?? 0x2f7bff);
}

/* ---------- КАТАЛОГ ---------- */
const CAT = {
  monitor: [
    { id:'asus360', name:'ASUS ROG Swift PG27AQN', spec:'27" IPS • 360 Гц • 1 мс • HDR', price:620000, w:1.06, curved:false, img:'products/asus_monitor.jpg' },
    { id:'asus300', name:'ASUS ROG Strix XG27ACS', spec:'27" IPS • 300 Гц • 1 мс', price:285000, w:1.06, curved:false },
    { id:'odyssey', name:'Samsung Odyssey G7', spec:'27" Curved • 240 Гц • QLED', price:240000, w:1.06, curved:true },
    { id:'ultra', name:'LG UltraGear 27GR93U', spec:'27" 4K • 160 Гц • Nano IPS', price:310000, w:1.06, curved:false, img:'products/lg_monitor.jpg' },
  ],
  mouse: [
    { id:'gp2', name:'Logitech G Pro X Superlight 2', spec:'60 г • HERO 2 • 32K DPI', price:62000, h:.58, len:.125, img:'products/logitech_gp2.jpg' },
    { id:'g502', name:'Logitech G502 X Plus', spec:'RGB • LIGHTSPEED • 25K DPI', price:45000, h:.6, len:.135, rgbline:true, img:'products/logitech_g502.jpg' },
    { id:'viper', name:'Razer Viper V3 Pro', spec:'54 г • Focus Pro • 35K DPI', price:58000, h:.56, len:.128, img:'products/razer_mouse.jpg' },
    { id:'g304', name:'Logitech G304 Lightspeed', spec:'99 г • HERO • 12K DPI', price:12000, h:.56, len:.115 },
  ],
  keyboard: [
    { id:'prox', name:'Logitech G Pro X TKL', spec:'TKL • LIGHTSPEED • механика', price:70000, w:.82 },
    { id:'wooting', name:'Wooting 60HE+', spec:'60% • Hall-effect • 0.1 мс', price:95000, w:.62 },
    { id:'huntsman', name:'Razer Huntsman V3 Pro TKL', spec:'TKL • Analog Optical • 8000Гц', price:85000, w:.82 },
    { id:'azoth', name:'ASUS ROG Azoth', spec:'75% • OLED • гаскет-монтаж', price:120000, w:.74 },
  ],
  // жүйелік блок ішкі бөліктері
  cpu: [
    { id:'r7', name:'Ryzen 7 7800X3D', spec:'8 ядро • 5.0 ГГц • 3D V-Cache', price:185000, socket:'am5', img:'products/ryzen_cpu.jpg' },
    { id:'r5', name:'Ryzen 5 7600', spec:'6 ядро • 5.1 ГГц', price:105000, socket:'am5', img:'products/ryzen_cpu.jpg' },
    { id:'i5', name:'Intel i5-14600KF', spec:'14 ядро • 5.3 ГГц', price:135000, socket:'lga1700', img:'products/intel_cpu.jpg' },
    { id:'i9', name:'Intel i9-14900K', spec:'24 ядро • 6.0 ГГц', price:280000, socket:'lga1700', img:'products/intel_cpu.jpg' },
  ],
  cooler: [
    { id:'ak400', name:'DeepCool AK400', spec:'ауалы • 220 Вт', price:18000, aio:false },
    { id:'kraken', name:'NZXT Kraken 240 RGB', spec:'СҚО • 240 мм • LCD', price:55000, aio:true, img:'products/aio_cooler.jpg' },
  ],
  mb: [
    { id:'b650', name:'MSI B650M Mortar', spec:'AM5 • DDR5 • PCIe 4.0', price:65000, socket:'am5' },
    { id:'z790', name:'ASUS Z790-P WiFi', spec:'LGA1700 • DDR5 • PCIe 5.0', price:95000, socket:'lga1700' },
  ],
  ram: [
    { id:'ram16', name:'Kingston Fury 16ГБ DDR5', spec:'2×8 • 6000 МГц • RGB', price:38000 },
    { id:'ram32', name:'G.Skill Trident Z5 32ГБ', spec:'2×16 • 6000 МГц • RGB', price:72000 },
  ],
  gpu: [
    { id:'4060', name:'RTX 4060 8ГБ', spec:'DLSS 3 • 115 Вт', price:165000, len:.44, watt:550 },
    { id:'4070s', name:'RTX 4070 Super 12ГБ', spec:'DLSS 3 • 220 Вт', price:295000, len:.55, watt:750 },
    { id:'4090', name:'RTX 4090 24ГБ', spec:'флагман • 450 Вт', price:750000, len:.72, watt:850 },
  ],
  ssd: [
    { id:'1tb', name:'Kingston NV2 1ТБ', spec:'PCIe 4.0 • 3500 МБ/с', price:42000 },
    { id:'2tb', name:'Samsung 990 Pro 2ТБ', spec:'PCIe 4.0 • 7450 МБ/с', price:70000 },
  ],
  psu: [
    { id:'650', name:'Corsair CV650 Bronze', spec:'650 Вт', price:30000, watt:650 },
    { id:'850', name:'Corsair RM850x Gold', spec:'850 Вт • модульді', price:52000, watt:850 },
  ],
  case: [
    { id:'zalman', name:'Zalman i3 Neo RGB', spec:'4 желдеткіш • шыны', price:25000, big:false },
    { id:'o11', name:'Lian Li O11 Dynamic', spec:'двой шыны • E-ATX', price:70000, big:true },
  ],
};
const SUBCATS = [
  { id:'case', label:'Корпус' }, { id:'cpu', label:'Процессор' }, { id:'cooler', label:'Салқындатқыш' },
  { id:'mb', label:'Аналық плата' }, { id:'ram', label:'ДДЖ' }, { id:'gpu', label:'Видеокарта' },
  { id:'ssd', label:'SSD' }, { id:'psu', label:'Қорек' },
];
const IMG = { monitor:'curved_monitor.jpg', mouse:'gaming_mouse.jpg', keyboard:'mech_keyboard.jpg',
  cpu:'cpu_chip.jpg', cooler:'ssd_nvme.jpg', mb:'motherboard.jpg', ram:'ram_ddr5.jpg',
  gpu:'gpu_card.jpg', ssd:'pc_internals.jpg', psu:'power_supply.jpg', case:'power_supply.jpg' };

/* ---------- КҮЙ ---------- */
const IS_CONFIG = /config\.html$/.test(location.pathname) || new URLSearchParams(location.search).has('config');
let build = { monitor:'asus300', mouse:'gp2', keyboard:'prox',
  case:'o11', cpu:'r7', cooler:'kraken', mb:'b650', ram:'ram32', gpu:'4070s', ssd:'1tb', psu:'850' };
let curCat = 'monitor', curSub = 'cpu';
const find = (cat,id) => CAT[cat].find(x=>x.id===id);
const fmt = n => n.toLocaleString('ru-RU') + ' ₸';
function totalPrice(){
  let s = 0;
  for (const k of ['monitor','mouse','keyboard','case','cpu','cooler','mb','ram','gpu','ssd','psu']) s += find(k, build[k]).price;
  return s;
}

/* ---------- UI: карточкалар ---------- */
const devCards = document.getElementById('devCards');
const towerSub = document.getElementById('towerSub');
function fillConfigTable(){
  const tbl = document.getElementById('cfgRows');
  if (!tbl) return;
  tbl.innerHTML = Object.keys(LABELS).map(k => {
    const p = find(k, build[k]);
    return `<tr><td class="cfg-cat">${LABELS[k]}</td><td class="cfg-dev"><b>${p.name}</b><em>${p.spec}</em></td><td class="cfg-price">${fmt(p.price)}</td></tr>`;
  }).join('');
  document.getElementById('cfgTotal').textContent = fmt(totalPrice());
  document.getElementById('cfgTheme').textContent =
    {blue:'Көк',cyan:'Циан',purple:'Күлгін',red:'Қызыл',green:'Жасыл',rainbow:'Радуга'}[themeName];
}
let exploded = false, explodedT = 0;
function renderCards(){
  const isTower = curCat === 'tower';
  if (IS_CONFIG) return;
  towerSub.classList.toggle('hidden', !isTower);
  if (isTower){
    towerSub.innerHTML = SUBCATS.map(s =>
      `<button data-sub="${s.id}" class="${s.id===curSub?'active':''}">${s.label}</button>`).join('');
  }
  const cat = isTower ? curSub : curCat;
  const items = CAT[cat];
  devCards.innerHTML = items.map(p => {
    const sel = build[cat] === p.id;
    return `<div class="dev-card ${sel?'selected':''}" data-id="${p.id}">
      <img class="p-thumb" src="${p.img ? './assets/'+p.img : deviceThumb(p, cat)}" alt="">
      <div class="p-type">${isTower ? SUBCATS.find(s=>s.id===cat).label : {monitor:'Монитор',mouse:'Тіышқан',keyboard:'Пернетақта'}[cat]}</div>
      <div class="p-name">${p.name}</div>
      <div class="p-spec">${p.spec}</div>
      <div class="p-price">${fmt(p.price)}</div></div>`;
  }).join('');
  devCards.querySelectorAll('.dev-card').forEach(c => c.onclick = () => {
    build[cat] = c.dataset.id;
    renderCards(); renderPrice();
  });
}
const priceList = document.getElementById('priceList');
const LABELS = { monitor:'Монитор', mouse:'Тіышқан', keyboard:'Пернетақта',
  case:'Корпус', cpu:'Процессор', cooler:'Салқындатқыш', mb:'Аналық плата',
  ram:'ДДЖ', gpu:'Видеокарта', ssd:'SSD', psu:'Қорек' };
function compatWarnings(){
  const w = [];
  const cpu = find('cpu', build.cpu), mb = find('mb', build.mb);
  if (cpu.socket && mb.socket && cpu.socket !== mb.socket)
    w.push('Сокет сәйкес емес: ' + cpu.name + ' → ' + (cpu.socket==='am5'?'AM5':'LGA1700') + ' плата керек');
  const gpu = find('gpu', build.gpu), psu = find('psu', build.psu);
  if (gpu.watt && psu.watt && psu.watt < gpu.watt)
    w.push('Қорек әлсіз: ' + gpu.name + ' үшін ≥ ' + gpu.watt + ' Вт керек');
  const cs = find('case', build.case);
  if (gpu.len >= .7 && !cs.big)
    w.push(gpu.name + ' үлкен корпусты қажет етеді');
  return w;
}
function renderPrice(){
  if (IS_CONFIG) return;
  const rows = Object.keys(LABELS);
  priceList.innerHTML = rows.map(k =>
    `<div class="pc-row"><span>${LABELS[k]}</span><b>${fmt(find(k,build[k]).price)}</b></div>`).join('');
  document.getElementById('priceTotal').textContent = fmt(totalPrice());
  document.getElementById('bpTotal').textContent = fmt(totalPrice());
  const warns = compatWarnings();
  document.getElementById('compatList').innerHTML = warns.map(t=>`<div class="compat-warn">⚠ ${t}</div>`).join('') ||
    '<div class="compat-ok">✓ Барлық құрылғылар үйлесімді</div>';
  localStorage.setItem('zertthana_build_v1', JSON.stringify(build));
}
if (!IS_CONFIG) document.getElementById('bpCats').querySelectorAll('button').forEach(b => b.onclick = () => {
  document.getElementById('bpCats').querySelectorAll('button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); curCat = b.dataset.cat;
  renderCards();
});
if (!IS_CONFIG) towerSub.addEventListener('click', e => {
  const b = e.target.closest('button[data-sub]'); if (!b) return;
  curSub = b.dataset.sub; renderCards();
});
document.getElementById('colorRow')?.addEventListener('click', e => {
  const b = e.target.closest('.csw'); if (!b) return;
  document.querySelectorAll('.csw').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); themeName = b.dataset.theme;
  if (IS_CONFIG) fillConfigTable();
});

/* ================================================================
   3D ЖИНАУ — құрылғыларды құру
   ================================================================ */
const setupRoot = new THREE.Group(); scene.add(setupRoot);
let fansList = [], keyMats = [], currentParts = [];

function buildSetup3D(animated){
  // тазалау
  setupRoot.clear(); fansList = []; keyMats = []; currentParts = [];
  const parts = [];   // {label, obj, to:{x,y,z}, ry}
  const addPart = (label, obj, x,y,z, ry=0) => {
    obj.position.set(x, y+2.6, z); obj.rotation.y = ry;
    setupRoot.add(obj);
    parts.push({ label, obj, to:{x,y,z}, ry });
  };

  /* --- үстел кілемі үстіндегі координаталар --- */
  const mon = find('monitor', build.monitor);
  const mou = find('mouse', build.mouse);
  const keyb = find('keyboard', build.keyboard);
  const cs = find('case', build.case);

  // 1. кілем
  {
    const g = new THREE.Group();
    mesh(rbox(2.4,.012,.85,.004), M.mat, 0,0,0, g);
    addPart('Үстел кілемі', g, .08, DESK_Y+.036, .18);
  }
  // 2. монитор
  {
    const g = new THREE.Group();
    const w = mon.w, h = w*.56;
    mesh(rbox(.55,.025,.38,.008), M.alu, 0, .012, 0, g);
    mesh(new THREE.CylinderGeometry(.03,.045,.42,20), M.alu, 0,.23,-.07, g);
    const body = mesh(rbox(w+.06, h+.06, .05, .008), M.black, 0, .47+h/2, 0, g);
    // иілу
    if (mon.curved){
      const seg = new THREE.CylinderGeometry(1.5, 1.5, h*.94, 32, 1, true, Math.PI - (w/1.5)*.5, (w/1.5));
      const scr = new THREE.Mesh(seg, new THREE.MeshStandardMaterial({ map:scrTex, emissiveMap:scrTex, emissive:0xffffff, emissiveIntensity:1.05, roughness:.18, side:THREE.DoubleSide }));
      scr.rotation.y = Math.PI/2;
      scr.position.set(0, .47+h/2, .1); scr.castShadow = true;
      g.add(scr);
    } else {
      mesh(new THREE.PlaneGeometry(w*.94, h*.94),
        new THREE.MeshStandardMaterial({ map:scrTex, emissiveMap:scrTex, emissive:0xffffff, emissiveIntensity:1.05, roughness:.18 }),
        0, .47+h/2, .028, g);
    }
    const backlight = mesh(new THREE.BoxGeometry(w*.8, .02, .02), themeMat(.15, 2.2), 0, .47-.05, .05, g);
    addPart(mon.name, g, 0, DESK_Y+.065, -.28);
  }
  // 3. жүйелік блок (корпус)
  const towerG = new THREE.Group();
  {
    const scale = cs.big ? 1.12 : 1;
    const W=.48*scale, H=1.04*scale, D=.94*scale;
    const caseMat = new THREE.MeshStandardMaterial({ color:0x14161e, metalness:.85, roughness:.35, envMapIntensity:1, side:THREE.DoubleSide });
    mesh(new THREE.BoxGeometry(.025,H,D), caseMat, W/2,0,0, towerG);
    mesh(new THREE.BoxGeometry(W,.025,D), caseMat, 0,H/2,0, towerG);
    mesh(new THREE.BoxGeometry(W,.025,D), caseMat, 0,-H/2,0, towerG);
    mesh(new THREE.BoxGeometry(W,H,.025), caseMat, 0,0,-D/2, towerG);
    mesh(new THREE.BoxGeometry(W,.05,.03), M.black, 0,H/2-.02,D/2, towerG);
    mesh(new THREE.BoxGeometry(W,.05,.03), M.black, 0,-H/2+.02,D/2, towerG);
    mesh(new THREE.BoxGeometry(.05,H,.03), M.black, -W/2+.02,0,D/2, towerG);
    mesh(new THREE.BoxGeometry(.05,H,.03), M.black, W/2-.02,0,D/2, towerG);
    mesh(new THREE.BoxGeometry(.012,H-.08,D-.08), M.glassThin, -W/2+.005,0,0, towerG);      // бүйір шыны
    mesh(new THREE.BoxGeometry(W-.1, H-.08, .012), M.glassThin, 0,0,D/2-.005, towerG);      // алдыңғы шыны (тік)
    mesh(rbox(.09,.02,.09,.004), M.alu, -.14,H/2-.02,D/2+.02, towerG);
    // 3 алдыңғы желдеткіш
    for (let i=0;i<3;i++){
      const f = makeFan(.14*scale, towerG, 0, H/2-.22-i*(H-.44)/2.35, D/2-.06, i*.18, true);
    }
    const under = mesh(new THREE.BoxGeometry(W*.8,.015,D*.7), themeMat(.3,2), 0,-H/2-.006,0, towerG);
  }
  addPart(cs.name + ' — корпус', towerG, .98, DESK_Y+.06+.52*1.0, -.18);
  // 4-10. ішкі бөліктер (towerG ішінде, жеке қозғалады)
  const tw = { x:.98, y:DESK_Y+.06+.52, z:-.18 };
  const innerDefs = [];
  const pushInner = (label, obj, x,y,z) => innerDefs.push([label, obj, x,y,z, true]);
  {
    const cpu = find('cpu', build.cpu), cool = find('cooler', build.cooler),
          ram = find('ram', build.ram), gpu = find('gpu', build.gpu),
          ssd = find('ssd', build.ssd), psu = find('psu', build.psu);
    // аналық плата
    const mb = new THREE.Group();
    mesh(rbox(.03,.6,.66,.004), M.pcb, 0,0,0, mb);
    mesh(rbox(.014,.11,.11,.003), M.black, -.02,.16,.18, mb);
    innerDefs.push(['Аналық плата — '+find('mb',build.mb).name, mb, .16, .06, 0]);
    // процессор
    const cpuG = new THREE.Group();
    mesh(rbox(.03,.13,.13,.003), M.pcb, 0,0,0, cpuG);
    mesh(rbox(.006,.1,.1,.002), M.silver, -.017,0,0, cpuG);
    innerDefs.push(['Процессор — '+cpu.name, cpuG, .155, .2, -.05]);
    // салқындатқыш
    const coolG = new THREE.Group();
    if (cool.aio){
      mesh(rbox(.07,.17,.17,.02), M.black, 0,0,0, coolG);
      mesh(new THREE.CylinderGeometry(.06,.06,.012,24), themeMat(.1,2.6), -.042,0,0, coolG).rotation.z = Math.PI/2;
      // радиатор — корпус төбесінде, ішінде (корпустан шықпайды)
      const rad = new THREE.Group();
      mesh(rbox(.05,.045,.4,.005), M.black, 0,0,0, rad);
      mesh(new THREE.CylinderGeometry(.05,.05,.014,24), themeMat(.4,2.2), 0,-.032,-.1, rad).rotation.x = Math.PI/2;
      mesh(new THREE.CylinderGeometry(.05,.05,.014,24), themeMat(.55,2.2), 0,-.032,.1, rad).rotation.x = Math.PI/2;
      innerDefs.push(['Салқындатқыш — '+cool.name, coolG, .1, .2, -.05]);
      innerDefs.push(['СҚО радиаторы', rad, .06, .4, 0]);
    } else {
      mesh(rbox(.07,.2,.2,.01), M.metal, 0,0,0, coolG);
      const f = makeFan(.08, coolG, -.05,0,0, .1, false);
      innerDefs.push(['Салқындатқыш — '+cool.name, coolG, .09, .2, -.05]);
    }
    // ДДЖ
    const ramG = new THREE.Group();
    for (let i=0;i<2;i++){
      mesh(rbox(.03,.28,.024,.002), M.black, -.015*i, .14, .04*i, ramG);
      mesh(new THREE.BoxGeometry(.006,.25,.012), themeMat(.12+i*.14, 2.6), -.036*i, .14, .04*i+.012, ramG);
    }
    innerDefs.push(['ДДЖ — '+ram.name, ramG, .15, -.02, .13]);
    // видеокарта
    const gpuG = new THREE.Group();
    mesh(rbox(.16,.05,gpu.len,.006), M.dark, 0,0,0, gpuG);
    mesh(new THREE.BoxGeometry(.008,.026,gpu.len*.86), themeMat(.2,2.4), -.085,-.028,0, gpuG);
    const f1 = makeFan(.055, gpuG, -.09, -.004, -gpu.len*.24, .3, false);
    const f2 = makeFan(.055, gpuG, -.09, -.004, gpu.len*.24, .45, false);
    innerDefs.push(['Видеокарта — '+gpu.name, gpuG, .1, -.1, -.02]);
    // SSD
    const ssdG = new THREE.Group();
    mesh(rbox(.02,.03,.12,.003), M.black, 0,0,0, ssdG);
    mesh(new THREE.BoxGeometry(.006,.014,.05), themeMat(.5,2), -.012,.017,.02, ssdG);
    innerDefs.push(['SSD — '+ssd.name, ssdG, .16, .28, -.18]);
    // қорек
    const psuG = new THREE.Group();
    mesh(rbox(.4,.13,.3,.008), M.black, 0,0,0, psuG);
    mesh(new THREE.CylinderGeometry(.05,.05,.012,20), M.metal, -.2,.03,0, psuG).rotation.z = Math.PI/2;
    innerDefs.push(['Қорек — '+psu.name, psuG, .04, -.38, .02]);
    // кабельдер
    const cb = new THREE.Group();
    tubeIn(cb, [[.02,-.3,.06],[-.04,-.12,.1],[-.02,.02,.08]], .011);
    tubeIn(cb, [[.02,-.3,.12],[-.02,-.24,.18],[.04,-.08,.2]], .009);
    innerDefs.push(['Кабель менеджмент', cb, .12, -.05, .02]);
  }
  for (const [label, obj, x,y,z] of innerDefs){
    obj.position.set(x+1.9, y+tw.y+2.4, z+tw.z);
    setupRoot.add(obj);
    parts.push({ label, obj, to:{x:tw.x+x, y:tw.y+y, z:tw.z+z}, ry:0, inner:true, spread:(parts.length%5-2)*.05 });
  }
  // 11. пернетақта
  {
    const g = new THREE.Group();
    mesh(rbox(keyb.w,.035,.24,.007), M.alu, 0,0,0, g);
    mesh(rbox(keyb.w-.06,.012,.18,.004), M.black, 0,.02,0, g);
    const cols = Math.round(keyb.w/.052);
    for (let r=0;r<4;r++) for (let k=0;k<cols;k++){
      const km = new THREE.MeshStandardMaterial({ color:0x15161c, roughness:.55, emissive:0x2f7bff, emissiveIntensity:.3 });
      keyMats.push({ mat:km, off:(r*cols+k)*.02 });
      mesh(rbox(.043,.016,.042,.004), km, -keyb.w/2+.038+k*(keyb.w-.076)/(cols-1||1), .035, -.062+r*.062, g);
    }
    addPart('Пернетақта — '+keyb.name, g, -.05, DESK_Y+.06, .22);
  }
  // 12. тіышқан
  {
    const g = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(.055,28,18),
      new THREE.MeshStandardMaterial({ color:0x0f1015, roughness:.35, metalness:.15 }), 0,0,0, g);
    body.scale.set(.8,.52,1.3);
    mesh(new THREE.CylinderGeometry(.009,.009,.022,14), themeMat(.25,2.6), 0,.028,-.03, g).rotation.x = Math.PI/2;
    if (mou.rgbline) mesh(new THREE.BoxGeometry(.004,.006,.09), themeMat(.4,2.4), .026,.008,.02, g);
    addPart('Тіышқан — '+mou.name, g, .42, DESK_Y+.055, .22);
  }
  // 13. дыбыс қондырғылары
  {
    [-1,1].forEach(s=>{
      const g = new THREE.Group();
      mesh(rbox(.13,.34,.17,.01), M.black, 0,0,0, g);
      mesh(new THREE.CylinderGeometry(.045,.045,.01,20), M.metal, 0,.08,.085, g).rotation.x = Math.PI/2;
      mesh(new THREE.CylinderGeometry(.026,.026,.008,20), M.metal, 0,-.06,.084, g).rotation.x = Math.PI/2;
      addPart('Дыбыс қондырғысы', g, s*.64, DESK_Y+.175, -.28);
    });
  }
  // 14. наушниктер
  {
    const g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(.01,.045,.26,12), M.metal, 0,.13,0, g);
    mesh(new THREE.TorusGeometry(.075,.013,12,30), M.black, 0,.28,0, g);
    [-1,1].forEach(s=>{
      const cup = mesh(new THREE.CylinderGeometry(.045,.045,.03,20), M.black, s*.078,.28,0, g);
      cup.rotation.z = Math.PI/2;
      const gr = mesh(new THREE.TorusGeometry(.043,.007,8,24), themeMat(.6,2), s*.078,.28,0, g);
      gr.rotation.y = Math.PI/2;
    });
    addPart('Наушниктер', g, -.95, DESK_Y, -.32);
  }
  currentParts = parts;
  if (!animated) parts.forEach(p => { p.obj.position.set(p.to.x, p.to.y, p.to.z); p.obj.rotation.y = p.ry; });
  return parts;
}

function tubeIn(parent, pts, r){
  const curve = new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, r, 8), new THREE.MeshStandardMaterial({ color:0x0e0f14, roughness:.7 }));
  m.castShadow = true; parent.add(m); return m;
}

const fanList = [];
function makeFan(radius, parent, x,y,z, hueOff, front){
  const g = new THREE.Group(); g.position.set(x,y,z);
  if (!front) g.rotation.y = Math.PI/2;
  mesh(new THREE.TorusGeometry(radius, radius*.1, 12, 40), M.black, 0,0,0, g);
  mesh(new THREE.TorusGeometry(radius*.88, radius*.08, 8, 40), themeMat(hueOff, 2.8), 0,0,0, g);
  const hub = mesh(new THREE.CylinderGeometry(radius*.22, radius*.22, radius*.24, 20), M.black, 0,0,0, g);
  hub.rotation.x = Math.PI/2;
  const blades = new THREE.Group();
  const bmat = new THREE.MeshStandardMaterial({ color:0x171821, roughness:.4, metalness:.35 });
  for (let i=0;i<7;i++){
    const bg = new THREE.BoxGeometry(radius*.2, radius*.9, radius*.03);
    bg.rotateY(.55); bg.translate(0, radius*.52, 0);
    const b = new THREE.Mesh(bg, bmat);
    b.rotation.z = i/7*Math.PI*2;
    blades.add(b);
  }
  g.add(blades);
  g.userData = { blades, speed: .8 + Math.random()*1.2 };
  fanList.push(g);
  parent.add(g);
  return g;
}

/* ================================================================
   ЖИНАУ АНИАМАЦИЯСЫ (кино)
   ================================================================ */
const asmOverlay = document.getElementById('asmOverlay');
const asmStep = document.getElementById('asmStep');
let queue = [], qT = 0, assembling = false;
const easeOutBack = x => 1 + 2.2*Math.pow(x-1,3) + 1.2*Math.pow(x-1,2);
const easeOutCubic = x => 1 - Math.pow(1-x,3);

function startAssembly(){
  const parts = buildSetup3D(false);           // жаңа сетап (бірден орнында)
  // бөліктер жоғарыдан түз түседі (корпус қабырғаларынан сырт өтпейді)
  queue = parts.map(p => ({ p, t:0 }));
  queue.forEach(q => {
    q.p.obj.position.y += 2.4;
    q.p.obj.rotation.y = q.p.ry + .7;
    q.p.obj.scale.setScalar(.92);
  });
  assembling = true; qT = -0.4;
  asmOverlay.classList.remove('hidden');
  controls.autoRotate = false;
  controls.target.set(0, 1.05, 0);
  camera.position.set(-1.6, 2.1, 3.4);
}
function updateAssembly(dt){
  if (!assembling) return;
  qT += dt;
  if (queue.length === 0){
    assembling = false;
    asmOverlay.classList.add('hidden');
    controls.autoRotate = true;
    if (typeof confetti === 'function') confetti({ particleCount:130, spread:75, origin:{ y:.7 } });
    return;
  }
  const dur = .5;
  if (qT < 0) return;
  const q = queue[0];
  if (q.sx === undefined){
    q.sx = q.p.obj.position.x; q.sz = q.p.obj.position.z; q.sry = q.p.obj.rotation.y; q.ss = q.p.obj.scale.x;
  }
  const f = Math.min(1, qT/dur);
  const e = easeOutBack(f);
  const p = q.p;
  p.obj.position.y = (p.to.y+2.6) + (p.to.y - (p.to.y+2.6))*e;
  p.obj.position.x = q.sx + (p.to.x - q.sx)*e;
  p.obj.position.z = q.sz + (p.to.z - q.sz)*e;
  p.obj.rotation.y = q.sry + (p.ry - q.sry)*e;
  p.obj.scale.setScalar(q.ss + (1-q.ss)*e);
  asmStep.textContent = p.label;
  if (f >= 1){ queue.shift(); qT = 0; }
}

/* ---------- БАСТАПҚЫ ЖИНДЫРУ / КОНФИГУРАЦИЯ БЕТІ ---------- */
if (!IS_CONFIG) {
  buildSetup3D(false);
  renderCards(); renderPrice();
  setTimeout(startAssembly, 900);   // бет ашылғанда кино түрінде жиналу
} else {
  // КОНФИГУРАЦИЯНЫ КӨРУ БЕТІ
  document.body.classList.add('config');
  try { Object.assign(build, JSON.parse(localStorage.getItem('zertthana_build_v1') || '{}')); } catch(e){}
  buildSetup3D(false);
  controls.autoRotate = true; controls.autoRotateSpeed = 1.4;
  camera.position.set(-.9, 1.55, 2.4);
  controls.target.set(.25, 1.02, 0);
  fillConfigTable();
  document.getElementById('btn360').onclick = () => controls.autoRotate = !controls.autoRotate;
  document.getElementById('btnExplode').onclick = () => {
    exploded = !exploded;
    document.getElementById('btnExplode').classList.toggle('active', exploded);
  };
  document.getElementById('btnInside').onclick = () => {
    controls.autoRotate = false;
    controls.target.set(.98, 1.15, -.18);
    camera.position.set(-.35, 1.5, .55);
  };
  document.getElementById('btnReset').onclick = () => {
    controls.target.set(.25, 1.02, 0);
    camera.position.set(-.9, 1.55, 2.4);
  };
}

/* ================================================================
   ЧАТ-БОТ
   ================================================================ */
const chatBody = document.getElementById('chatBody');
function botMsg(html){
  const d = document.createElement('div');
  d.className = 'msg bot'; d.innerHTML = html;
  chatBody.appendChild(d); chatBody.scrollTop = chatBody.scrollHeight;
}
function userMsg(text){
  const d = document.createElement('div');
  d.className = 'msg user'; d.textContent = text;
  chatBody.appendChild(d); chatBody.scrollTop = chatBody.scrollHeight;
}
function recommend(budget){
  const pick = (cat, max) => [...CAT[cat]].sort((a,b)=>b.price-a.price).find(p => p.price <= max)
    || [...CAT[cat]].sort((a,b)=>a.price-b.price)[0];
  const b = {};
  b.monitor = pick('monitor', budget*.32).id;
  b.keyboard = pick('keyboard', budget*.15).id;
  b.mouse = pick('mouse', budget*.14).id;
  let rest = budget - find('monitor',b.monitor).price - find('keyboard',b.keyboard).price - find('mouse',b.mouse).price;
  b.gpu = pick('gpu', rest*.42).id;  rest -= find('gpu',b.gpu).price;
  b.cpu = pick('cpu', rest*.34).id;  rest -= find('cpu',b.cpu).price;
  b.case = pick('case', rest*.25).id; rest -= find('case',b.case).price;
  b.cooler = pick('cooler', rest*.5).id; rest -= find('cooler',b.cooler).price;
  b.ram = pick('ram', rest*.6).id; rest -= find('ram',b.ram).price;
  b.mb = pick('mb', rest*.85).id;   rest -= find('mb',b.mb).price;
  b.psu = pick('psu', rest).id;     rest -= find('psu',b.psu).price;
  b.ssd = pick('ssd', Math.max(rest, 0) + 40000).id;
  // бюджеттен асса — ең қымбатты біртіндеп арзандату
  const keys = ['gpu','cpu','monitor','ram','mb','cooler','case','psu','ssd'];
  let total = () => ['monitor','mouse','keyboard','case','cpu','cooler','mb','ram','gpu','ssd','psu']
    .reduce((s,k)=>s+find(k,b[k]).price, 0);
  let guard = 40;
  while (total() > budget && guard-- > 0){
    let changed = false;
    for (const k of keys){
      const cur = find(k, b[k]);
      const cheaper = [...CAT[k]].filter(p=>p.price < cur.price).sort((a,b2)=>b2.price-a.price)[0];
      if (cheaper){ b[k] = cheaper.id; changed = true; break; }
    }
    if (!changed) break;
  }
  const t = total();
  return { build:b, total:t };
}
function applyBuild(newBuild){
  build = { ...build, ...newBuild };
  renderCards(); renderPrice();
  startAssembly();
}
function handleChat(text){
  userMsg(text);
  const num = parseInt(text.replace(/[^\d]/g,''), 10);
  const budget = num > 0 && num <= 5000 ? num*1000 : num;
  setTimeout(()=>{
    if (!budget || budget < 80000){
      botMsg('Бюджетті жаз: мысалы <b>«300 000 ₸»</b> немесе <b>«350к»</b>. Сонау 80 000 ₸-ден бастап толық сетап жинай аламын 🙂<br>Тағы <b>«300 Гц монитор»</b> немесе <b>«Logitech»</b> деп тауап көр!');
      return;
    }
    const t = text.toLowerCase();
    if (t.includes('300') && t.includes('монитор')){
      build.monitor = 'asus360';
      renderPrice(); renderCards();
      botMsg('ASUS ROG Swift <b>PG27AQN 360 Гц</b> — деп қойдым! Енді бюджетіңді жаз, қалғанын сол бойынша жинаймын 🎯');
      return;
    }
    if (t.includes('logitech')){
      build.mouse = 'gp2'; build.keyboard = 'prox';
      renderPrice(); renderCards();
      botMsg('Logitech жиынтығы таңдалды: <b>G Pro X Superlight 2 + G Pro X TKL</b> ⚡ Бюджет жазсаң — толық сетап жинаймын.');
      return;
    }
    const { build:nb, total } = recommend(budget);
    const over = total > budget;
    const lines = ['monitor','keyboard','mouse','gpu','cpu','ram','ssd','psu','cooler','mb','case']
      .map(k => { const p = find(k, nb[k]); return `• ${p.name} — <b>${fmt(p.price)}</b>`; }).join('<br>');
    botMsg(`<b>${fmt(budget)}</b> бюджетке сетап жинадым:${lines}<br><span class="chat-total">Барлығы: <b>${fmt(total)}</b>${over?' — ең арзан толық нұсқа, бюджеттен жоғары 😅':' ✓ бюджетке сыйды'}</span><br><button class="chat-apply" onclick="__applyBotBuild()">🔨 Осыны жинау</button>`);
    window.__pendingBotBuild = nb;
  }, 500);
}
window.__applyBotBuild = () => { if (window.__pendingBotBuild) applyBuild(window.__pendingBotBuild); };
if (!IS_CONFIG) {
  document.getElementById('chatSend').onclick = () => {
    const inp = document.getElementById('chatText');
    if (inp.value.trim()){ handleChat(inp.value.trim()); inp.value=''; }
  };
  document.getElementById('chatText').addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById('chatSend').click(); });
  document.getElementById('chatToggle').onclick = () => {
    chatBody.parentElement.classList.toggle('min');
  };
  botMsg('Сәлем! 👋 Мен ZERTHANA көмекшісімін. Бюджетіңді жаз (мысалы <b>«900 000 ₸»</b>) — сенімді сетап жинап, 3D-да көрсетемін. Немесе <b>«300 гц монитор»</b>, <b>«Logitech»</b> деп көр!');
  setTimeout(()=> userMsg('900 000 ₸'), 1400);
  setTimeout(()=> handleChat('900 000 ₸'), 1600);
}

/* ---------- «СЕТАПТЫ ҚҰРУ» ---------- */
if (!IS_CONFIG) document.getElementById('viewSetupBtn').onclick = () => startAssembly();

/* ---------- КӨРІНІС АУЫСТЫРУ ---------- */
document.getElementById('topbar').addEventListener('click', e => {
  const b = e.target.closest('.tb-view'); if (!b) return;
  document.querySelectorAll('.tb-view').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  document.getElementById('view-' + b.dataset.view).classList.add('active');
  onResize();
});

/* ---------- АНИМАЦИЯ ---------- */
const clock = new THREE.Clock();
let idleTimer = 0, lastReal = performance.now();
function clockT(){ return clock.elapsedTime; }
function renderStudio(){
  const now = performance.now();
  const realDt = Math.min((now - lastReal)/1000, .3);   // нақты уақыт (headless үшін)
  lastReal = now;
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;
  applyTheme();
  updateAssembly(realDt);
  // бөлшектелген көрініс (exploded)
  if (!assembling){
    explodedT += ((exploded?1:0) - explodedT)*.1;
    for (const p of currentParts) if (p.inner){
      p.obj.position.x += ((p.to.x - explodedT*.55) - p.obj.position.x)*.12;
      p.obj.position.y += ((p.to.y + explodedT*p.spread) - p.obj.position.y)*.12;
    }
  }
  for (const f of fanList) f.userData.blades.rotation.z += f.userData.speed*dt*5;
  // перне жарығы
  for (const {mat,off} of keyMats){
    mat.emissiveIntensity = .25 + .5*Math.pow(Math.sin(t*1.8+off*40)*.5+.5, 2);
    mat.emissive.setHex(THEMES[themeName] ?? new THREE.Color().setHSL((1-((t*.07+off)%1))%1,.9,.55).getHex());
  }
  controls.update();
  composer.render();
}
function animate(){
  requestAnimationFrame(animate);
  const studioActive = document.getElementById('view-studio').classList.contains('active');
  if (studioActive) renderStudio();
}
// фон/headless режимде rAF баяулайды — жинау кезінде fallback рендер
setInterval(()=>{
  if (!document.getElementById('view-studio').classList.contains('active')) return;
  if (document.hidden || !document.hasFocus() || assembling) renderStudio();
}, 160);
window.__studioDebug = () => ({ q: queue.length, qT, assembling, parts: currentParts.length,
  pos: currentParts.map(p => ({ l: p.label.slice(0,18), x:+p.obj.position.x.toFixed(2), y:+p.obj.position.y.toFixed(2), z:+p.obj.position.z.toFixed(2), s:[+p.obj.scale.x.toFixed(2)] })) });
window.__studioCam = (px,py,pz,tx=.25,ty=1.02,tz=0) => { camera.position.set(px,py,pz); controls.target.set(tx,ty,tz); controls.autoRotate=false; };
function onResize(){
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', onResize);
animate();
