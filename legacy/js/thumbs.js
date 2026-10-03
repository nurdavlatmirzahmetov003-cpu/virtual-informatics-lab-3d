// ================================================================
//  deviceThumb — әр девайсқа типіне САЙ генерацияланған сурет
//  Каталогтағы әр модель өз пішінін көрсетеді (қайталанбайды)
// ================================================================
const _cache = {};

function base(c, accent = '#22d3ee') {
  const bg = c.createLinearGradient(0, 0, 0, 320);
  bg.addColorStop(0, '#232840');
  bg.addColorStop(.62, '#141828');
  bg.addColorStop(1, '#0b0d16');
  c.fillStyle = bg; c.fillRect(0, 0, 480, 320);
  const sp = c.createRadialGradient(240, 120, 10, 240, 120, 240);
  sp.addColorStop(0, 'rgba(120,160,255,.16)');
  sp.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = sp; c.fillRect(0, 0, 480, 320);
  // еден сызығы
  c.fillStyle = 'rgba(255,255,255,.05)';
  c.fillRect(0, 268, 480, 52);
  c.fillStyle = accent;
  c.font = '700 13px Manrope, sans-serif';
  c.textAlign = 'left';
}
function shadow(c, x, y, w) {
  c.save(); c.fillStyle = 'rgba(0,0,0,.4)';
  c.beginPath(); c.ellipse(x, y, w, 9, 0, 0, 7); c.fill(); c.restore();
}
function rr(c, x, y, w, h, r) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
}

/* --- Монитор: қисық/түз, тұғыр түрі --- */
function drawMonitor(c, p) {
  base(c, '#7cd6ff');
  const w = p.curved ? 300 : 320, h = 176;
  const x = 240 - w / 2, y = 42;
  shadow(c, 240, 258, w * .34);
  if (p.curved) {
    // қисық экран: доға бөліктері
    const segs = 24;
    for (let i = 0; i < segs; i++) {
      const t0 = i / segs, t1 = (i + 1) / segs;
      const ang = Math.PI * (.78 + t0 * .44), ang2 = Math.PI * (.78 + t1 * .44);
      const R = 420;
      const cx = 240, cy = 150 + R * .32;
      const g = c.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#0a1e4a'); g.addColorStop(.5, '#1140a8'); g.addColorStop(1, '#0a1e4a');
      c.beginPath();
      c.arc(cx, cy, R + 3, ang, ang2);
      c.arc(cx, cy, R - h + 3, ang2, ang, true);
      c.closePath(); c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(120,190,255,.35)'; c.lineWidth = 1.4; c.stroke();
    }
    c.strokeStyle = '#0c0e16'; c.lineWidth = 7;
    c.beginPath(); c.arc(240, 150 + 420 + 134, 420 + h / 2 + 4, Math.PI * .78, Math.PI * 1.22); c.stroke();
  } else {
    rr(c, x - 7, y - 7, w + 14, h + 14, 8); c.fillStyle = '#10121c'; c.fill();
    const g = c.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#0a1e4a'); g.addColorStop(.5, '#1345b8'); g.addColorStop(1, '#0a1e4a');
    rr(c, x, y, w, h, 4); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(120,190,255,.4)'; c.lineWidth = 1.2;
    rr(c, x + 2, y + 2, w - 4, h - 4, 3); c.stroke();
    // экран жарқылы
    const gl = c.createLinearGradient(x, y, x + w * .6, y + h);
    gl.addColorStop(0, 'rgba(255,255,255,.10)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    rr(c, x, y, w, h, 4); c.fillStyle = gl; c.fill();
  }
  // тұғыр
  c.fillStyle = '#171a26';
  c.fillRect(236, y + h + 8, 8, 34);
  rr(c, 240 - (p.curved ? 70 : 78), y + h + 40, (p.curved ? 140 : 156), 9, 4); c.fill();
  // логотип
  c.fillStyle = 'rgba(160,210,255,.75)'; c.font = '800 12px Unbounded, sans-serif'; c.textAlign = 'center';
  c.fillText('ASUS', 240, y + h + 26);
}

/* --- Пернетақта: өлшемі бойынша --- */
function drawKeyboard(c, p) {
  base(c, '#8f7bff');
  const w = p.w >= .8 ? 330 : p.w >= .72 ? 290 : 210;
  const h = w >= 300 ? 118 : 92;
  const x = 240 - w / 2, y = 110;
  shadow(c, 240, y + h + 14, w * .42);
  rr(c, x, y, w, h, 7); c.fillStyle = '#191b28'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1.5; c.stroke();
  // пернелер
  const cols = Math.round(w / 24), rows = 4, kw = (w - 16) / cols, kh = (h - 20) / rows;
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const hue = (210 + r * 30 + k * 6) % 360;
    rr(c, x + 8 + k * kw, y + 10 + r * kh, kw - 3, kh - 4, 3);
    c.fillStyle = '#22242f'; c.fill();
    c.strokeStyle = `hsla(${hue},85%,62%,.8)`; c.lineWidth = 1.2; c.stroke();
  }
  // астыңғы RGB жарық
  const ug = c.createLinearGradient(0, y + h, 0, y + h + 16);
  ug.addColorStop(0, 'rgba(90,140,255,.75)'); ug.addColorStop(1, 'rgba(90,140,255,0)');
  c.fillStyle = ug; c.fillRect(x + 4, y + h, w - 8, 16);
  c.fillStyle = 'rgba(200,220,255,.8)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name.split(' ').slice(0, 2).join(' '), 240, y + h + 44);
}

/* --- Тіышқан --- */
function drawMouse(c, p) {
  base(c, '#ff7bd5');
  shadow(c, 240, 232, 56);
  c.save(); c.translate(240, 138); c.scale(1.35, 1.35);
  c.beginPath();
  c.moveTo(0, -62);
  c.bezierCurveTo(30, -62, 34, -20, 33, 12);
  c.bezierCurveTo(32, 48, 18, 62, 0, 62);
  c.bezierCurveTo(-18, 62, -32, 48, -33, 12);
  c.bezierCurveTo(-34, -20, -30, -62, 0, -62);
  const g = c.createLinearGradient(-33, 0, 33, 0);
  g.addColorStop(0, '#0d0e15'); g.addColorStop(.45, '#262938'); g.addColorStop(1, '#08090f');
  c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.4; c.stroke();
  // батырма сызығы + доңғалақ
  c.beginPath(); c.moveTo(0, -58); c.lineTo(0, -6); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1.6; c.stroke();
  const wg = c.createRadialGradient(0, -26, 1, 0, -26, 8);
  wg.addColorStop(0, '#9fd8ff'); wg.addColorStop(1, '#1a3a6a');
  rr(c, -4.5, -38, 9, 24, 4); c.fillStyle = wg; c.fill();
  c.restore();
  c.fillStyle = 'rgba(200,220,255,.8)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name, 240, 262);
}

/* --- Видеокарта: желдеткіш саны бойынша --- */
function drawGPU(c, p) {
  base(c, '#57e389');
  const fans = p.len >= .7 ? 3 : p.len >= .5 ? 2 : 2;
  const w = 150 + fans * 62, h = 96;
  const x = 240 - w / 2, y = 96;
  shadow(c, 240, y + h + 12, w * .42);
  rr(c, x, y, w, h, 9); c.fillStyle = '#14161f'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.5; c.stroke();
  rr(c, x + 6, y + 6, w - 12, h - 12, 6); c.fillStyle = '#0d0e15'; c.fill();
  for (let i = 0; i < fans; i++) {
    const fx = x + (w / fans) * (i + .5), fy = y + h / 2, fr = h * .36;
    c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fillStyle = '#1a1c26'; c.fill();
    c.strokeStyle = 'rgba(120,190,255,.55)'; c.lineWidth = 2; c.stroke();
    for (let b = 0; b < 9; b++) {
      const a = b / 9 * Math.PI * 2;
      c.beginPath(); c.moveTo(fx, fy);
      c.ellipse(fx + Math.cos(a) * fr * .55, fy + Math.sin(a) * fr * .55, fr * .38, fr * .17, a, 0, 7);
      c.fillStyle = '#242736'; c.fill();
    }
    c.beginPath(); c.arc(fx, fy, fr * .3, 0, 7); c.fillStyle = '#0f1017'; c.fill();
  }
  c.fillStyle = 'rgba(120,220,150,.9)'; c.font = '800 12px Unbounded'; c.textAlign = 'center';
  c.fillText(p.name.toUpperCase(), 240, y + h + 34);
}

/* --- Қорек --- */
function drawPSU(c, p) {
  base(c, '#ffc94d');
  const w = 220, h = 130, x = 130, y = 80;
  shadow(c, 240, y + h + 12, 110);
  const g = c.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, '#2a2d3a'); g.addColorStop(.5, '#191b25'); g.addColorStop(1, '#101218');
  rr(c, x, y, w, h, 8); c.fillStyle = g; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5; c.stroke();
  // желдеткіш торы
  const fx = x + w * .34, fy = y + h / 2, fr = h * .36;
  c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fillStyle = '#0c0d13'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 2;
  for (let i = 1; i <= 5; i++) { c.beginPath(); c.arc(fx, fy, fr * i / 5, 0, 7); c.stroke(); }
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    c.beginPath(); c.moveTo(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6);
    c.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr); c.stroke();
  }
  // нақтыланған тақта + ватт
  rr(c, x + w * .62, y + 18, w * .3, h - 36, 4); c.fillStyle = '#0e0f16'; c.fill();
  c.fillStyle = '#ffd76e'; c.font = '800 20px Unbounded'; c.textAlign = 'center';
  c.fillText(p.watt + 'W', x + w * .77, y + h / 2 + 2);
  c.fillStyle = 'rgba(200,220,255,.75)'; c.font = '700 11px Manrope';
  c.fillText(p.name, 240, y + h + 34);
}

/* --- Корпус --- */
function drawCase(c, p) {
  base(c, '#6ea8ff');
  const w = p.big ? 128 : 112, h = 200, x = p.big ? 176 : 184, y = 46;
  shadow(c, 240, y + h + 10, w * .5);
  rr(c, x, y, w, h, 8); c.fillStyle = '#101218'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.5; c.stroke();
  // мөлдір бүйір
  rr(c, x + 10, y + 10, w - 20, h - 20, 5);
  const gg = c.createLinearGradient(x, y, x + w, y + h);
  gg.addColorStop(0, 'rgba(90,150,255,.16)'); gg.addColorStop(1, 'rgba(20,30,60,.28)');
  c.fillStyle = gg; c.fill();
  // желдеткіштер
  const fr = w * .26;
  for (let i = 0; i < 3; i++) {
    const fy = y + h * .22 + i * (h * .3);
    c.beginPath(); c.arc(x + w / 2, fy, fr, 0, 7);
    c.fillStyle = 'rgba(30,50,110,.5)'; c.fill();
    c.strokeStyle = 'rgba(110,168,255,.85)'; c.lineWidth = 2.5; c.stroke();
    for (let b = 0; b < 8; b++) {
      const a = b / 8 * Math.PI * 2;
      c.beginPath(); c.moveTo(x + w / 2, fy);
      c.ellipse(x + w / 2 + Math.cos(a) * fr * .55, fy + Math.sin(a) * fr * .55, fr * .36, fr * .15, a, 0, 7);
      c.fillStyle = 'rgba(40,60,120,.7)'; c.fill();
    }
  }
  c.fillStyle = 'rgba(200,220,255,.8)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name, 240, y + h + 30);
}

/* --- ДДЖ --- */
function drawRAM(c, p) {
  base(c, '#b98bff');
  const n = 2, sw = 74, sh = 150;
  const startX = 240 - (n * sw + (n - 1) * 26) / 2;
  for (let i = 0; i < n; i++) {
    const x = startX + i * (sw + 26), y = 70;
    shadow(c, x + sw / 2, y + sh + 10, sw * .5);
    rr(c, x, y, sw, sh, 5); c.fillStyle = '#111319'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.15)'; c.lineWidth = 1.2; c.stroke();
    // чиптер
    for (let ch = 0; ch < 4; ch++) { rr(c, x + 8, y + 26 + ch * 26, sw - 16, 18, 2); c.fillStyle = '#1b1e2a'; c.fill(); }
    // RGB жолақ
    for (let s = 0; s < 8; s++) {
      c.fillStyle = `hsla(${200 + s * 22 + i * 40},85%,60%,.9)`;
      c.fillRect(x + 6 + s * (sw - 12) / 8, y + 8, (sw - 12) / 8, 12);
    }
    // алтын жалғағыштар
    for (let g2 = 0; g2 < 20; g2++) { c.fillStyle = 'rgba(212,175,55,.8)'; c.fillRect(x + 4 + g2 * (sw - 8) / 20, y + sh - 5, (sw - 8) / 24, 5); }
  }
  c.fillStyle = 'rgba(200,220,255,.8)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name, 240, 286);
}

/* --- SSD M.2 --- */
function drawSSD(c, p) {
  base(c, '#7bd6ff');
  const w = 250, h = 66, x = 115, y = 120;
  shadow(c, 240, y + h + 10, 130);
  rr(c, x, y, w, h, 5); c.fillStyle = '#14181f'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1.2; c.stroke();
  for (let i = 0; i < 4; i++) { rr(c, x + 22 + i * 52, y + 14, 40, 24, 3); c.fillStyle = '#0d0f16'; c.fill(); }
  rr(c, x + 22, y + 44, w - 60, 12, 2); c.fillStyle = 'rgba(123,214,255,.85)'; c.fill();
  c.fillStyle = 'rgba(200,220,255,.85)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name + ' — M.2 NVMe', 240, y + h + 34);
}

/* --- Ауалы салқындатқыш --- */
function drawCoolerAir(c, p) {
  base(c, '#9fb6c9');
  const w = 170, h = 190, x = 155, y = 56;
  shadow(c, 240, y + h + 10, 90);
  // радиатор қанаттары
  for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#3a4252' : '#2c3342'; c.fillRect(x, y + i * (h / 16), w, h / 16 - 2); }
  // база
  c.fillStyle = '#20242e'; c.fillRect(x + 20, y + h - 6, w - 40, 26);
  // желдеткіш
  const fx = x + w / 2, fy = y + h * .55, fr = w * .38;
  c.beginPath(); c.arc(fx, fy, fr, 0, 7); c.fillStyle = '#151821'; c.fill();
  c.strokeStyle = 'rgba(160,190,220,.5)'; c.lineWidth = 2; c.stroke();
  for (let b = 0; b < 9; b++) {
    const a = b / 9 * Math.PI * 2;
    c.beginPath(); c.moveTo(fx, fy);
    c.ellipse(fx + Math.cos(a) * fr * .55, fy + Math.sin(a) * fr * .55, fr * .36, fr * .16, a, 0, 7);
    c.fillStyle = '#242a38'; c.fill();
  }
  // жылы түтіктер
  c.strokeStyle = '#c98a3d'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x + 14, y + h - 10); c.quadraticCurveTo(x - 8, y + h * .4, x + 30, y + 6); c.stroke();
  c.beginPath(); c.moveTo(x + w - 14, y + h - 10); c.quadraticCurveTo(x + w + 8, y + h * .4, x + w - 30, y + 6); c.stroke();
  c.fillStyle = 'rgba(200,220,255,.8)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name + ' — ауалы', 240, y + h + 38);
}

/* --- Аналық плата --- */
function drawMB(c, p) {
  base(c, p.id === 'b650' ? '#57e389' : '#7c9dff');
  const w = 210, h = 190, x = 135, y = 56;
  shadow(c, 240, y + h + 10, 110);
  rr(c, x, y, w, h, 6);
  c.fillStyle = p.id === 'b650' ? '#101418' : '#12141f'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 1.3; c.stroke();
  // сокет
  rr(c, x + w * .3, y + h * .3, 56, 56, 4); c.fillStyle = '#1c2029'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.stroke();
  // ДДЖ слоттары
  for (let i = 0; i < 2; i++) { c.fillStyle = '#242836'; c.fillRect(x + w - 52, y + 24 + i * 26, 12, 68); }
  // PCIe
  for (let i = 0; i < 3; i++) { c.fillStyle = '#2a2e3c'; c.fillRect(x + 26, y + h - 58 + i * 18, w * .62, 7); }
  // VRM радиаторлар
  rr(c, x + 14, y + 12, w * .34, 26, 3); c.fillStyle = '#33394a'; c.fill();
  rr(c, x + 14, y + h - 34, 44, 24, 3); c.fillStyle = '#33394a'; c.fill();
  c.fillStyle = 'rgba(200,220,255,.8)'; c.font = '700 11px Manrope'; c.textAlign = 'center';
  c.fillText(p.name, 240, y + h + 34);
}

const DRAWERS = {
  monitor: drawMonitor, keyboard: drawKeyboard, mouse: drawMouse, gpu: drawGPU,
  psu: drawPSU, case: drawCase, ram: drawRAM, ssd: drawSSD, cooler_air: drawCoolerAir, mb: drawMB,
};

export function deviceThumb(p, cat) {
  const key = (p.gen || cat) + ':' + p.id;
  if (_cache[key]) return _cache[key];
  const cv = document.createElement('canvas');
  cv.width = 480; cv.height = 320;
  const c = cv.getContext('2d');
  if (cat === 'cooler' && !p.aio) DRAWERS.cooler_air(c, p);
  else DRAWERS[cat](c, p);
  _cache[key] = cv.toDataURL('image/jpeg', .88);
  return _cache[key];
}
