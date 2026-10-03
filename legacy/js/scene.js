// ================================================================
//  ZERTHANA PLATFORM — фотореалистік 3D жұмыс орны
//  PBR материалдар + HDRI жарық + Bloom + RGB жүйе
// ================================================================
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('scene3d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060c);
scene.fog = new THREE.Fog(0x05060c, 9, 26);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, .04, 60);

// ---------- ҚОРШАҒАН ОРТА (реалистік бейнелер) ----------
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;

// ---------- ПОСТПРОЦЕССІНГ: Bloom ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .5, .8, .78);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- ТЕКСТУРАЛАР ----------
const TL = new THREE.TextureLoader();
function tex(name, srgb=false){
  const t = TL.load('textures/' + name);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const woodMap   = tex('wood_diff.jpg', true);   woodMap.repeat.set(1.6, .8);
const woodNor   = tex('wood_nor.jpg');          woodNor.repeat.set(1.6, .8);
const woodRough = tex('wood_rough.jpg');        woodRough.repeat.set(1.6, .8);
const floorMap  = tex('floor_diff.jpg', true);  floorMap.repeat.set(6,6);
const floorRgh  = tex('floor_rough.jpg');       floorRgh.repeat.set(6,6);

// ---------- МАТЕРИАЛДАР ----------
const M = {
  wood:   new THREE.MeshStandardMaterial({ map:woodMap, normalMap:woodNor, roughnessMap:woodRough, roughness:1, metalness:0, envMapIntensity:.55 }),
  floor:  new THREE.MeshStandardMaterial({ map:floorMap, roughnessMap:floorRgh, roughness:1, color:0x777788, envMapIntensity:.25 }),
  metal:  new THREE.MeshStandardMaterial({ color:0x22242e, metalness:.9, roughness:.32, envMapIntensity:.9 }),
  alu:    new THREE.MeshStandardMaterial({ color:0x9aa0ac, metalness:.95, roughness:.28, envMapIntensity:1 }),
  black:  new THREE.MeshStandardMaterial({ color:0x0c0d12, metalness:.2, roughness:.55, envMapIntensity:.5 }),
  glass:  new THREE.MeshPhysicalMaterial({ color:0xffffff, metalness:0, roughness:.03, transmission:.94, thickness:.06, ior:1.5, envMapIntensity:1.2, transparent:true }),
  ceramic:new THREE.MeshStandardMaterial({ color:0xe8e6e2, roughness:.32, metalness:0 }),
  pcb:    new THREE.MeshStandardMaterial({ color:0x14181f, metalness:.35, roughness:.5 }),
  mobo:   new THREE.MeshStandardMaterial({ color:0x101318, metalness:.3, roughness:.45 }),
  gold:   new THREE.MeshStandardMaterial({ color:0xc8a03e, metalness:.9, roughness:.35 }),
  silver: new THREE.MeshStandardMaterial({ color:0xb9bec8, metalness:.95, roughness:.22 }),
  fabric: new THREE.MeshStandardMaterial({ color:0x14151d, roughness:.95 }),
  wall:   new THREE.MeshStandardMaterial({ color:0x0b0d15, roughness:.9, metalness:0 }),
};

// ---------- ҚЫЗМЕТТІК ФУНКЦИЯЛАР ----------
function mesh(geo, mat, x=0,y=0,z=0, parent=scene){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x,y,z); m.castShadow = m.receiveShadow = true;
  parent.add(m); return m;
}
const rbox = (w,h,d,r) => new RoundedBoxGeometry(w,h,d,3,Math.min(r, Math.min(w,h,d)/2*.49));
function tube(points, radius, mat, parent=scene){
  const curve = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 8), mat);
  m.castShadow = true; parent.add(m); return m;
}

// RGB түс айналымы бар материалдар тізімі
const rgbMats = [];
function rgbMat(hueOffset=0, intensity=2.2){
  const m = new THREE.MeshStandardMaterial({ color:0x000000, emissive:0xff0044, emissiveIntensity:intensity, roughness:.4 });
  m.userData.hueOff = hueOffset; rgbMats.push(m); return m;
}

// желдеткіш (айналатын пішіндер + RGB сақина)
const fans = [];
function makeFan(radius, parent, x,y,z, hueOff=0, axis='z'){
  const g = new THREE.Group(); g.position.set(x,y,z);
  if (axis==='x') g.rotation.y = Math.PI/2;
  const frame = mesh(new THREE.TorusGeometry(radius, radius*.1, 12, 40), M.black, 0,0,0, g);
  frame.castShadow = true;
  const ring = mesh(new THREE.TorusGeometry(radius*.9, radius*.08, 8, 40), rgbMat(hueOff, 2.6), 0,0,0, g);
  const hub = mesh(new THREE.CylinderGeometry(radius*.22, radius*.22, radius*.26, 20), M.black, 0,0,0, g);
  hub.rotation.x = Math.PI/2;
  const blades = new THREE.Group();
  const bladeMat = new THREE.MeshStandardMaterial({ color:0x191a22, roughness:.35, metalness:.4 });
  for (let i=0;i<7;i++){
    const bg = new THREE.BoxGeometry(radius*.2, radius*.9, radius*.03);
    bg.rotateY(.55);
    bg.translate(0, radius*.52, 0);
    const b = new THREE.Mesh(bg, bladeMat);
    b.rotation.z = i/7 * Math.PI*2;
    b.castShadow = true;
    blades.add(b);
  }
  g.add(blades);
  g.userData.blades = blades;
  g.userData.speed = .8 + Math.random()*1.4;
  fans.push(g);
  parent.add(g);
  return g;
}

// ================================================================
//  БӨЛМЕ
// ================================================================
const floor = mesh(new THREE.CircleGeometry(16, 48), M.floor, 0,0,0);
floor.rotation.x = -Math.PI/2;
const backWall = mesh(new THREE.BoxGeometry(16, 7, .2), M.wall, 0, 3.4, -3.2);
backWall.receiveShadow = true;

// қабырға панельдері (акустика)
const panelMat = new THREE.MeshStandardMaterial({ color:0x12141d, roughness:.85 });
for (let i=0;i<14;i++) for (let j=0;j<5;j++){
  const p = mesh(new THREE.BoxGeometry(.52,.52,.05), panelMat, -4.2+i*.65, 1.1+j*.62, -3.05);
  p.rotation.y = (i+j)%2 ? .02 : -.015;
}

// неон жолақтар (bloom жарқырайды)
mesh(new THREE.BoxGeometry(.05, 3.4, .05), rgbMat(0, 4), -4.9, 2.2, -3.0);
mesh(new THREE.BoxGeometry(.05, 3.4, .05), rgbMat(.55, 4),  4.9, 2.2, -3.0);
mesh(new THREE.BoxGeometry(5.4, .03, .03), rgbMat(.75, 2.2), 0, 4.55, -3.05);

// қабырға плакаттары
function poster(x, c1, c2){
  const cv = document.createElement('canvas'); cv.width=256; cv.height=340;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0,0,256,340);
  g.addColorStop(0,c1); g.addColorStop(1,c2);
  c.fillStyle=g; c.fillRect(0,0,256,340);
  c.fillStyle='rgba(255,255,255,.9)';
  c.font='800 30px Unbounded, sans-serif'; c.fillText('Z', 20, 48);
  c.font='500 13px Manrope'; c.fillText('PLATFORM', 52, 46);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  mesh(new THREE.BoxGeometry(1.05, 1.4, .04), M.black, x, 2.6, -3.02);
  mesh(new THREE.PlaneGeometry(.95, 1.3),
    new THREE.MeshStandardMaterial({ map:t, roughness:.6 }), x, 2.6, -2.99);
}
poster(-2.6, '#0ea5b7', '#7c5cf0');
poster( 2.9, '#e04f9b', '#7c5cf0');

// шаң бөлшектері
const pGeo = new THREE.BufferGeometry();
const pN = 260, pPos = new Float32Array(pN*3);
for (let i=0;i<pN;i++){ pPos[i*3]=(Math.random()-.5)*14; pPos[i*3+1]=Math.random()*5; pPos[i*3+2]=(Math.random()-.5)*10-1; }
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos,3));
const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0x9fd8ff, size:.018, transparent:true, opacity:.35 }));
scene.add(dust);

// ================================================================
//  ЖАРЫҚ
// ================================================================
scene.add(new THREE.AmbientLight(0x30405a, .5));
const key = new THREE.SpotLight(0xfff2e0, 90, 18, .75, .45);
key.position.set(2.5, 6.5, 3.5);
key.castShadow = true;
key.shadow.mapSize.set(2048,2048);
key.shadow.bias = -.0002;
scene.add(key);
const rimA = new THREE.PointLight(0x22d3ee, 22, 12); rimA.position.set(-4, 2.6, 1.5); scene.add(rimA);
const rimB = new THREE.PointLight(0xc44cff, 22, 12); rimB.position.set(4.2, 2.8, -1); scene.add(rimB);
const screenGlow = new THREE.PointLight(0x9fd0ff, 6, 4); screenGlow.position.set(0, 1.8, 1.2); scene.add(screenGlow);

// ================================================================
//  ҮСТЕЛ
// ================================================================
const DESK_Y = .92;
mesh(rbox(4.8,.07,1.9,.012), M.wood, 0, DESK_Y, 0);
[[-2.15,-.75],[2.15,-.75],[-2.15,.75],[2.15,.75]].forEach(([x,z])=>{
  mesh(new THREE.BoxGeometry(.07,DESK_Y-.02,.07), M.metal, x, DESK_Y/2, z);
});
mesh(new THREE.BoxGeometry(4.3,.06,.08), M.metal, 0, .25, -.78);
mesh(new THREE.BoxGeometry(4.3,.06,.08), M.metal, 0, .25, .78);
// үстел кілемі (deskmat)
mesh(rbox(2.6,.008,.85,.003), M.fabric, .1, DESK_Y+.04, .35);

// ================================================================
//  МОНИТОР
// ================================================================
const monitor = new THREE.Group(); scene.add(monitor);
const scrCanvas = document.createElement('canvas');
scrCanvas.width = 640; scrCanvas.height = 380;
const scrTex = new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace = THREE.SRGBColorSpace;
function drawScreen(){
  const c = scrCanvas.getContext('2d');
  const g = c.createLinearGradient(0,0,640,380);
  g.addColorStop(0,'#05060f'); g.addColorStop(.5,'#101331'); g.addColorStop(1,'#1c0f2e');
  c.fillStyle=g; c.fillRect(0,0,640,380);
  for (const [x,y,r,col] of [[140,90,110,'rgba(34,211,238,.25)'],[500,290,130,'rgba(167,139,250,.22)'],[420,60,80,'rgba(244,114,182,.15)']]){
    const rg = c.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,col); rg.addColorStop(1,'transparent');
    c.fillStyle=rg; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
  }
  c.fillStyle='rgba(255,255,255,.06)'; c.fillRect(0,0,640,26);
  c.fillStyle='rgba(255,255,255,.75)'; c.font='600 11px Manrope, sans-serif';
  c.fillText('ZERTHANA', 16, 17);
  const time = new Date().toLocaleTimeString('kk-KZ',{hour:'2-digit',minute:'2-digit'});
  c.textAlign='right'; c.fillText(time, 626, 17); c.textAlign='left';
  c.fillStyle='rgba(255,255,255,.05)';
  c.beginPath(); c.roundRect(120,70,400,200,10); c.fill();
  c.fillStyle='rgba(255,255,255,.09)';
  c.beginPath(); c.roundRect(120,70,400,30,10); c.fill();
  c.fillStyle='rgba(255,255,255,.7)'; c.font='600 12px Manrope';
  c.fillText('platform.kz — жұмыс орны', 136, 90);
  c.font='400 11px Consolas, monospace'; c.fillStyle='rgba(140,255,220,.8)';
  ['> system.init()   ... OK','> gpu.connect()   ... OK','> net.ready()     ... OK','> welcome, student_01'].forEach((l,i)=>c.fillText(l, 136, 122+i*22));
  c.fillStyle='rgba(255,255,255,.07)';
  c.beginPath(); c.roundRect(180,330,280,40,12); c.fill();
  for (let i=0;i<6;i++){
    c.fillStyle=['#22d3ee','#a78bfa','#f472b6','#34d399','#fbbf24','#64748b'][i];
    c.beginPath(); c.roundRect(196+i*44,338,24,24,6); c.fill();
  }
  scrTex.needsUpdate = true;
}
drawScreen();
setInterval(drawScreen, 10000);

mesh(rbox(.6,.025,.4,.008), M.alu, 0, DESK_Y+.045, -.05, monitor);
mesh(new THREE.CylinderGeometry(.035,.05,.45,20), M.alu, 0, DESK_Y+.28, -.12, monitor);
mesh(rbox(1.78,1.04,.05,.008), M.black, 0, DESK_Y+.85, 0, monitor);
mesh(new THREE.PlaneGeometry(1.66,.94),
  new THREE.MeshStandardMaterial({ map:scrTex, emissiveMap:scrTex, emissive:0xffffff, emissiveIntensity:1.05, roughness:.18 }),
  0, DESK_Y+.85, .028, monitor);
mesh(new THREE.BoxGeometry(.24,.012,.012), rgbMat(.3,1.6), 0, DESK_Y+.36, .01, monitor);

// ================================================================
//  ПЕРНЕТАҚТА (механикалық, RGB)
// ================================================================
const keyboard = new THREE.Group(); scene.add(keyboard);
mesh(rbox(.95,.04,.34,.008), M.alu, 0,0,0, keyboard);
mesh(rbox(.88,.015,.27,.004), M.black, -.01,.022,0, keyboard);
const keyMats = [];
for (let r=0;r<4;r++) for (let k=0;k<13;k++){
  const km = new THREE.MeshStandardMaterial({ color:0x17181f, roughness:.6, emissive:0x22d3ee, emissiveIntensity:.0 });
  km.userData.hueOff = (r*13+k)*.012;
  keyMats.push(km);
  mesh(rbox(.052,.022,.05,.005), km, -.415+k*.0695, .04, -.113+r*.0755, keyboard);
}
keyboard.position.set(0, DESK_Y+.09, .5);
tube([[.42,DESK_Y+.1,.5],[.75,DESK_Y+.02,.42],[1.1,DESK_Y+.01,.25],[1.35,DESK_Y+.01,-.1]], .007, M.black);

// ================================================================
//  ТІЫШҚАН
// ================================================================
const mouse = new THREE.Group(); scene.add(mouse);
const mBody = mesh(new THREE.SphereGeometry(.095, 32, 20),
  new THREE.MeshStandardMaterial({ color:0x101116, roughness:.35, metalness:.1 }), 0,0,0, mouse);
mBody.scale.set(.82,.52,1.3);
mesh(new THREE.BoxGeometry(.002,.01,.16), M.metal, 0,.046,.01, mouse);
const wheel = mesh(new THREE.CylinderGeometry(.014,.014,.03,16), rgbMat(.15, 2.5), 0,.045,-.055, mouse);
wheel.rotation.x = Math.PI/2;
mouse.position.set(.78, DESK_Y+.075, .5);
tube([[.78,DESK_Y+.05,.38],[.8,DESK_Y+.01,.2],[1.0,DESK_Y+.01,-.05],[1.3,DESK_Y+.01,-.2]], .006, M.black);

// ================================================================
//  ДЫБЫС ҚОНДЫРҒЫЛАРЫ
// ================================================================
function makeSpeaker(){
  const s = new THREE.Group();
  mesh(rbox(.17,.44,.2,.012), M.black, 0,0,0, s);
  const t1 = mesh(new THREE.CylinderGeometry(.06,.06,.012,24), M.metal, 0,.11,.095, s); t1.rotation.x = Math.PI/2;
  const t2 = mesh(new THREE.CylinderGeometry(.034,.034,.01,24), M.metal, 0,-.07,.095, s); t2.rotation.x = Math.PI/2;
  const t3 = mesh(new THREE.CylinderGeometry(.008,.008,.008,12), rgbMat(.2,2), 0,-.185,.098, s); t3.rotation.x = Math.PI/2;
  return s;
}
const sp1 = makeSpeaker(); sp1.position.set(-1.08, DESK_Y+.24, .3); scene.add(sp1);
const sp2 = makeSpeaker(); sp2.position.set( 1.08, DESK_Y+.24, .3); scene.add(sp2);

// ================================================================
//  ЖҮЙЕЛІК БЛОК (геймерлік корпус)
// ================================================================
const tower = new THREE.Group();
const TW = { x:1.68, y:DESK_Y+.55, z:-.02 };
const caseMat = new THREE.MeshStandardMaterial({ color:0x1a1c26, metalness:.85, roughness:.34, envMapIntensity:1, side:THREE.DoubleSide });
// қуысты корпус: 5 қабырға (алдыңғы жағы — рамка + шыны)
mesh(new THREE.BoxGeometry(.025,1.06,.98), caseMat, .2475,0,0, tower);      // оң қабырға
mesh(new THREE.BoxGeometry(.52,.025,.98), caseMat, 0,.5175,0, tower);       // төбе
mesh(new THREE.BoxGeometry(.52,.025,.98), caseMat, 0,-.5175,0, tower);      // табан
mesh(new THREE.BoxGeometry(.52,1.06,.025), caseMat, 0,0,-.4775, tower);     // арқа
// алдыңғы рамка (4 жиек) — шыны мен желдеткіштер көрініп тұрады
mesh(new THREE.BoxGeometry(.52,.05,.03), M.black, 0,.505,.49, tower);
mesh(new THREE.BoxGeometry(.52,.05,.03), M.black, 0,-.505,.49, tower);
mesh(new THREE.BoxGeometry(.05,.96,.03), M.black, -.235,0,.49, tower);
mesh(new THREE.BoxGeometry(.05,.96,.03), M.black, .235,0,.49, tower);
mesh(rbox(.44,.94,.012,.005), M.glass, 0,0,.478, tower);      // алдыңғы шыны
mesh(rbox(.012,.92,.84,.005), M.glass, -.262,.01,0, tower);   // бүйір шыны
mesh(rbox(.1,.02,.1,.006), M.alu, -.16,.5,.492, tower);
mesh(new THREE.BoxGeometry(.5,.012,.95), rgbMat(.4,2.4), 0,-.53,0, tower);
tower.position.set(TW.x, TW.y, TW.z); scene.add(tower);

// алдыңғы 3 желдеткіш
for (let i=0;i<3;i++) makeFan(.15, tower, .05, .33-i*.32, .45, i*.18, 'z');
const innerLight = new THREE.PointLight(0xbfe9ff, 2.6, 2.0);
innerLight.position.set(-.15, .1, 0);
tower.add(innerLight);

// ---------- ІШКІ КОМПОНЕНТЕР ----------
const inner = new THREE.Group(); tower.add(inner);
const COMP = {};
function comp(name, x,y,z){
  const g = new THREE.Group();
  g.position.set(x,y,z); g.userData.base = g.position.clone();
  inner.add(g); COMP[name] = g; return g;
}
const mb = comp('mb', .17, .08, 0);
mesh(rbox(.025,.64,.7,.004), M.mobo, 0,0,0, mb);
mesh(rbox(.012,.12,.12,.003), M.black, -.018,.18,.22, mb);
mesh(rbox(.012,.06,.3,.003), M.black, -.018,.02,-.05, mb);
for (let i=0;i<3;i++) mesh(rbox(.012,.05,.045,.002), M.black, -.018,.3,-.2+i*.08, mb);
const cpu = comp('cpu', .14, .22, -.06);
mesh(rbox(.028,.135,.135,.004), M.pcb, 0,0,0, cpu);
mesh(rbox(.006,.1,.1,.002), M.silver, -.017,0,0, cpu);
const cool = comp('cooler', .09, .22, -.06);
mesh(rbox(.06,.21,.21,.01), M.metal, 0,0,0, cool);
makeFan(.085, cool, -.05, 0, 0, .5, 'x');
const ram = comp('ram', .15, .05, .16);
for (let i=0;i<2;i++){
  mesh(rbox(.032,.3,.026,.003), M.black, -.018*i, .15, .045*i, ram);
  mesh(new THREE.BoxGeometry(.006,.27,.014), rgbMat(.1+i*.12, 2.4), -.038*i, .15, .045*i+.014, ram);
}
const gpu = comp('gpu', .1, -.12, -.05);
mesh(rbox(.15,.055,.33,.006), M.metal, 0,0,0, gpu);
mesh(new THREE.BoxGeometry(.01,.03,.28), rgbMat(.6,2), -.08,-.028,0, gpu);
makeFan(.062, gpu, -.085, -.005, -.08, .3, 'x');
makeFan(.062, gpu, -.085, -.005, .08, .45, 'x');
const psu = comp('psu', .02, -.4, .05);
mesh(rbox(.42,.13,.32,.008), M.black, 0,0,0, psu);
const psuFan = mesh(new THREE.CylinderGeometry(.05,.05,.012,20), M.metal, -.215,.03,0, psu); psuFan.rotation.z = Math.PI/2;
mesh(rbox(.1,.02,.06,.003), M.metal, -.18,.03,.1, psu);
const ssd = comp('ssd', .1, .12, .22);
mesh(rbox(.065,.032,.15,.004), M.metal, 0,0,0, ssd);
mesh(new THREE.BoxGeometry(.02,.01,.06), rgbMat(.85,1.8), -.02,.017,.03, ssd);
// кабельдер
const cableMat = new THREE.MeshStandardMaterial({ color:0x0e0f14, roughness:.7 });
tube([[.02,-.34,.1],[-.05,-.2,.14],[-.02,-.05,.12]], .012, cableMat, inner);
tube([[.02,-.34,.16],[-.02,-.28,.2],[.05,-.1,.24]], .01, cableMat, inner);

// ================================================================
//  АКСЕССУАРЛАР
// ================================================================
const mug = new THREE.Group(); scene.add(mug);
const mugProfile = [];
for (let i=0;i<=10;i++) mugProfile.push(new THREE.Vector2(.042*Math.sin(i/10*Math.PI*.5)+.005, i*.0085));
mesh(new THREE.LatheGeometry(mugProfile, 28), M.ceramic, 0,0,0, mug);
const torusH = mesh(new THREE.TorusGeometry(.026,.007,10,20), M.ceramic, .05,.032,0, mug);
torusH.rotation.y = Math.PI/2;
mesh(new THREE.CylinderGeometry(.038,.038,.004,24),
  new THREE.MeshStandardMaterial({ color:0x2b1a10, roughness:.25 }), 0,.084,0, mug);
mug.position.set(-.68, DESK_Y+.04, .12);
// наушниктер + тұғыр
const hp = new THREE.Group(); scene.add(hp);
mesh(new THREE.CylinderGeometry(.012,.05,.3,12), M.metal, 0,.15,0, hp);
mesh(new THREE.TorusGeometry(.085,.014,12,30), new THREE.MeshStandardMaterial({color:0x15161c,roughness:.5}), 0,.31,0, hp);
[-1,1].forEach(s=>{
  const cup = mesh(new THREE.CylinderGeometry(.05,.05,.035,20), M.black, s*.088,.31,0, hp);
  cup.rotation.z = Math.PI/2;
  const gr = mesh(new THREE.TorusGeometry(.048,.008,8,24), rgbMat(.7,1.6), s*.088,.31,0, hp);
  gr.rotation.y = Math.PI/2;
});
hp.position.set(-1.5, DESK_Y, -.45);
// дәптер мен қалам
mesh(rbox(.24,.012,.32,.003), new THREE.MeshStandardMaterial({color:0x242836, roughness:.8}), -1.35, DESK_Y+.06, .35);
const pen = mesh(new THREE.CylinderGeometry(.005,.005,.16,10), M.alu, -1.3, DESK_Y+.075, .42);
pen.rotation.z = Math.PI/2;
// телефон
mesh(rbox(.075,.008,.15,.003), M.black, -.95, DESK_Y+.06, -.25);

// жұлдыздар
const pGeo2 = new THREE.BufferGeometry();
const p2 = new Float32Array(400*3);
for (let i=0;i<400;i++){ p2[i*3]=(Math.random()-.5)*26; p2[i*3+1]=Math.random()*9; p2[i*3+2]=(Math.random()-.5)*26; }
pGeo2.setAttribute('position', new THREE.BufferAttribute(p2,3));
const stars = new THREE.Points(pGeo2, new THREE.PointsMaterial({ color:0x67e8f9, size:.02, transparent:true, opacity:.4 }));
scene.add(stars);

// ---------- СТОП-ПОЙНТТЕР ----------
const STOPS = [
  { t:0.00, cam:[0,2.3,6.4],  look:[0,1.25,0],  card:null },
  { t:0.08, cam:[0,1.95,3.1], look:[0,1.7,0],   card:{ n:'01', title:'Монитор', desc:'Шығару құрылғысы. Процессор өңдеген ақпаратты пиксельдерге айналдырып, экранға шығарады.', facts:['Өлшемі — дюйммен өлшенеді','Экран — миллиондаған пиксель торы','Жаңару жиілігі: 60–240 Гц'], ref:monitor } },
  { t:0.17, cam:[.25,1.75,1.75], look:[0,.99,.5], card:{ n:'02', title:'Пернетақта', desc:'Енгізу құрылғысы. Әріп, сан және командаларды енгіземіз. Әр перне бассаң — сигнал 0 мен 1 кодына айналып процессорға барады.', facts:['Механикалық пернелер — дәл басу','Стандартты жоспар — QWERTY','RGB жарық — пернелер астында'], ref:keyboard } },
  { t:0.26, cam:[1.45,1.55,1.6], look:[.78,.99,.5], card:{ n:'03', title:'Тіышқан', desc:'Меңзерді басқаратын енгізу құрылғысы. Оның доңғалағын осы саяхатты айналдыру үшін қолданып жүрсің!', facts:['1968 ж. Д. Энгельбарт ойлап тапқан','Оптикалық сенсор: 800–16000 DPI','Екі батырма + скролл доңғалағы'], ref:mouse } },
  { t:0.35, cam:[-.45,1.8,2.15], look:[-1.08,1.2,.3], card:{ n:'04', title:'Дыбыс қондырғысы', desc:'Шығару құрылғысы. Электронды сигналды тербеліске — дыбысқа айналдырады.', facts:['Дыбыс картасы арқылы қосылады','Жиілігі герцпен (Гц) өлшенеді','Стерео = 2 арна'], ref:sp1 } },
  { t:0.44, cam:[.75,1.7,2.0], look:[1.68,1.5,-.02], card:{ n:'05', title:'Жүйелік блок', desc:'Компьютердің бас миы! Ішінде ең маңызды құрылғылар тұрады. Дайынсың ба? Енді оның ІШІНЕ кіреміз!', facts:['Термошыны қабырға — іші көрінеді','3 RGB желдеткіш — салқындату','Кабельдер мен жарық — шынайы жүйе'], ref:tower } },
  { t:0.53, cam:[.7,1.6,1.6], look:[1.6,1.5,0], card:{ n:'06', title:'Корпустың іші', desc:'Мөлдір қабырғадан өттік! Алдыңда компьютердің жүрегі — аналық плата және оның құрылғылары. Әрқайсысымен танысайық!', facts:['Осыдан кейін 7 құрылғыны көресің','Әр құрылғының өз «жұмысы» бар'], ref:tower } },
  { t:0.60, dist:1.0, cam:[.95,1.55,.75], look:[1.82,1.52,0], card:{ n:'07', title:'Аналық плата', desc:'Барлық құрылғылар жалғанатын негізгі плата — компьютердің «жүйке жүйесі». Деректер шиналар арқылы жүреді.', facts:['Чипсет жұмысты үйлестіреді','PCIe, SATA, USB қосқыштары','Барлық жол осы платаға барып тіреседі'], ref:COMP.mb } },
  { t:0.68, dist:.55, cam:[1.42,1.78,.3], look:[1.79,1.66,-.11], card:{ n:'08', title:'Процессор (CPU)', desc:'Компьютердің миы! Барлық есептеулерді орындайды. Ақпаратпен 0 және 1 (екілік код) түрінде жұмыс істейді.', facts:['Жиілігі — ГГц (секундина миллиардтаған цикл)','Ядролар — параллель жұмыс істейді','Кэш-жад — ең жылдам жад'], ref:COMP.cpu } },
  { t:0.75, dist:.6, cam:[1.36,1.8,.4], look:[1.74,1.66,-.11], card:{ n:'09', title:'Салқындатқыш', desc:'Процессор жұмыс істегенде қызады — кулер оны салқындатпайсаң, компьютер өшіп қалады!', facts:['Мыс түтіктік — жылуды тез өткізеді','Вентилятор ыстық ауаны сыртқа үрлейді','Температура сенсорлары бақылайды'], ref:COMP.cooler } },
  { t:0.82, dist:.55, cam:[1.42,1.6,.6], look:[1.80,1.49,.12], card:{ n:'10', title:'ДДЖ (RAM)', desc:'Оперативті жад — бағдарламалар мен деректер уақытша сақталатын орын. Қуат өшсе, ішіндегісі жоғалады!', facts:['Көлемі: 8–32 ГБ','Процессорға ең жақын жад','RGB жолақ — жадтың көрсеткіші'], ref:COMP.ram } },
  { t:0.87, dist:.65, cam:[1.35,1.5,.7], look:[1.75,1.32,-.1], card:{ n:'11', title:'Видеокарта (GPU)', desc:'Кескін өңдейтін құрылғы: ойындар, 3D графика, видео монтаж — бәрі оның арқасында.', facts:['Мыңдаған кішкене ядролар','Өз видеожады бар (VRAM)','FPS — кадр жиілігі'], ref:COMP.gpu } },
  { t:0.91, dist:.6, cam:[1.32,1.3,.55], look:[1.67,1.05,.05], card:{ n:'12', title:'Қоректендіру блогы (PSU)', desc:'Электр тоғын қабылдап, әр құрылғыға қажетті кернеумен таратады.', facts:['220 В → 12/5/3.3 В-қа айналдырады','Қуаты — Ваттпен өлшенеді','Сапалы PSU = қауіпсіз жүйе'], ref:COMP.psu } },
  { t:0.95, dist:.55, cam:[1.38,1.66,.62], look:[1.75,1.56,.17], card:{ n:'13', title:'SSD жинақтауыш', desc:'Тұрақты жад — файлдар, бағдарламалар мен операциялық жүйе осында мәңгі сақталады.', facts:['500 ГБ – 4 ТБ көлем','Қозғалатын бөлігі жоқ — өте жылдам!','HDD — ескі магниттік диск'], ref:COMP.ssd } },
  { t:1.00, cam:[0,2.6,6.8],  look:[0,1.3,0],  card:{ n:'14', title:'Тамаша!', desc:'Компьютерді іші-тысымен зерттедің! Енді өзің байқап көр — төменде 5 зертхана сені күтуде. Әр тапсырма автоматты бағаланады!', facts:['Компьютер құрастыру','Желі құру • Алгоритмдер','Логика • Тәжірибелер'], ref:null, cta:true } },
];

// ---------- HTML ЭЛЕМЕНТТЕР ----------
const hero = document.getElementById('heroOverlay');
const infoCard = document.getElementById('infoCard');
const icStep = document.getElementById('icStep'), icTitle = document.getElementById('icTitle'),
      icDesc = document.getElementById('icDesc'), icFacts = document.getElementById('icFacts');
const hint = document.getElementById('journeyHint');
const progFill = document.getElementById('progressFill');

const cta = document.createElement('button');
cta.className = 'btn-grad big'; cta.style.marginTop = '16px';
cta.textContent = 'ЗЕРТХАНАҒА ӨТҮ →'; cta.style.display = 'none';
infoCard.appendChild(cta);
cta.onclick = () => document.getElementById('labs').scrollIntoView({ behavior:'smooth' });

let curStop = -2;
function showStop(idx){
  if (idx === curStop) return;
  curStop = idx;
  const st = STOPS[idx];
  if (!st.card){ infoCard.classList.add('hidden'); cta.style.display='none'; return; }
  icStep.textContent = st.card.n;
  icTitle.textContent = st.card.title;
  icDesc.textContent = st.card.desc;
  icFacts.innerHTML = st.card.facts.map(f=>`<span>${f}</span>`).join('');
  cta.style.display = st.card.cta ? 'block' : 'none';
  infoCard.classList.remove('hidden');
  infoCard.classList.remove('pop'); void infoCard.offsetWidth; infoCard.classList.add('pop');
}

// ---------- СКРОЛЛ + СҮЙРЕУ ----------
let prog = 0, targetProg = 0;
const spacer = document.getElementById('scrollSpace');
function maxScroll(){ return spacer.offsetHeight - innerHeight; }
addEventListener('scroll', () => {
  targetProg = Math.min(1, Math.max(0, scrollY / maxScroll()));
}, { passive:true });

let drag = false, px=0, py=0, az=0, el=0, tAz=0, tEl=0;
canvas.addEventListener('pointerdown', e=>{ drag=true; px=e.clientX; py=e.clientY; canvas.setPointerCapture(e.pointerId); });
addEventListener('pointerup', ()=> drag=false);
addEventListener('pointermove', e=>{
  if(!drag) return;
  tAz -= (e.clientX-px)*.004; tEl += (e.clientY-py)*.003;
  tAz = Math.max(-1.1, Math.min(1.1, tAz)); tEl = Math.max(-.45, Math.min(.6, tEl));
  px=e.clientX; py=e.clientY;
});

// ---------- АНИМАЦИЯ ----------
const clock = new THREE.Clock();
const smooth = x => x*x*(3-2*x);
const V3 = (a)=> new THREE.Vector3(a[0],a[1],a[2]);
const tmpC = new THREE.Vector3(), tmpL = new THREE.Vector3();

function renderFrame(){
  // зертхана көрінісі жасырын болса — рендерлемеймз (GPU үнемдеу)
  if (!document.getElementById('view-lab').classList.contains('active')) return;
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;

  targetProg = Math.min(1, Math.max(0, scrollY / maxScroll()));
  prog += (targetProg - prog) * (1 - Math.pow(.001, dt));

  let i = 0;
  while (i < STOPS.length-1 && prog > STOPS[i+1].t) i++;
  const a = STOPS[i], b = STOPS[Math.min(i+1, STOPS.length-1)];
  const f = smooth(Math.min(1, Math.max(0, (prog - a.t) / (b.t - a.t || 1))));
  function dyn(st){
    const dir = V3(st.cam).sub(V3(st.look)).normalize();
    const lookW = new THREE.Vector3(); st.card.ref.getWorldPosition(lookW);
    return { cam: lookW.clone().add(dir.multiplyScalar(st.dist || .5)), look: lookW };
  }
  const inComp = st => Object.values(COMP).includes(st.card && st.card.ref);
  const A = inComp(a) ? dyn(a) : { cam: V3(a.cam), look: V3(a.look) };
  const B = inComp(b) ? dyn(b) : { cam: V3(b.cam), look: V3(b.look) };
  tmpC.lerpVectors(A.cam, B.cam, f);
  tmpL.lerpVectors(A.look, B.look, f);

  if (prog < .02 && !drag) tAz = Math.sin(t*.25)*.22;
  az += (tAz - az)*.08; el += (tEl - el)*.08;
  const off = tmpC.clone().sub(tmpL);
  const sph = new THREE.Spherical().setFromVector3(off);
  sph.theta += az;
  sph.phi = Math.max(.35, Math.min(Math.PI-.35, sph.phi - el));
  off.setFromSpherical(sph);
  camera.position.copy(tmpL).add(off);
  camera.lookAt(tmpL);

  hero.classList.toggle('gone', prog > .015);
  hint.classList.toggle('gone', prog > .04 || prog >= .999);
  progFill.style.width = (prog*100).toFixed(1) + '%';

  let active = -1;
  for (let k=0;k<STOPS.length;k++){
    const st = STOPS[k];
    const half = (k<STOPS.length-1 ? STOPS[k+1].t : 1.01) - st.t;
    if (prog >= st.t - .012 && prog < st.t + half - .012){ active = k; break; }
  }
  showStop(active);

  // ішкі компоненттер: активті құрылғы корпус ішінен сыртқа шығады
  Object.entries(COMP).forEach(([name,g])=>{
    const isAct = STOPS[active] && STOPS[active].card && STOPS[active].card.ref === g;
    g.position.x = g.userData.base.x - (isAct ? .72 : 0);
    const target = isAct ? 1.1 : 1;
    g.scale.lerp(new THREE.Vector3(target,target,target), .1);
  });

  // RGB циклі
  for (const m of rgbMats) m.emissive.setHSL((1 - ((t*.06 + m.userData.hueOff) % 1)) % 1, .85, .55);
  for (const m of keyMats){
    m.emissiveIntensity = .2 + .6*Math.pow(Math.sin(t*1.6 + m.userData.hueOff*30)*.5+.5, 2);
    m.emissive.setHSL((1 - ((t*.06 + m.userData.hueOff) % 1)) % 1, .85, .5);
  }
  // желдеткіштер
  for (const fn of fans) fn.userData.blades.rotation.z += fn.userData.speed*dt*6;

  dust.rotation.y = t*.01;
  stars.rotation.y = t*.008;

  const flash = document.getElementById('flash') || (()=>{ const d=document.createElement('div'); d.id='flash';
    d.style.cssText='position:fixed;inset:0;background:radial-gradient(circle,#bfefff,#22d3ee 40%,transparent 75%);opacity:0;pointer-events:none;z-index:20;transition:opacity .15s';
    document.body.appendChild(d); return d; })();
  flash.style.opacity = Math.max(0, 1 - Math.abs(prog-.53)/.028) * .9;

  composer.render();
}
function animate(){ requestAnimationFrame(animate); renderFrame(); }
animate();
setInterval(()=>{ if (document.hidden || !document.hasFocus()) renderFrame(); }, 250);
window.__vlabSkip = () => { prog = targetProg; renderFrame(); };

addEventListener('resize', ()=>{
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
