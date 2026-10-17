/**
 * Small canvas-generated detail maps (brushed metal, fabric weave, perforated
 * mesh, mouse shell seams). They add micro-surface variation to the interim
 * procedural models without shipping extra image files.
 */
import { CanvasTexture, ClampToEdgeWrapping, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';
import { mouseSurface, type MouseShape } from './geometry';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { c, ctx };
}

/** Deterministic PRNG so textures are identical between reloads. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function finish(c: HTMLCanvasElement, { srgb = false, repeat = [1, 1] as [number, number] } = {}): Texture {
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (srgb) t.colorSpace = SRGBColorSpace;
  return t;
}

/** Horizontal brushed-metal streaks — use as roughnessMap and bumpMap. */
export function brushedMetalTexture(repeat: [number, number] = [1, 1]) {
  const { c, ctx } = canvas(512, 512);
  const r = rng(7);
  ctx.fillStyle = '#8a8a8a';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = r() * 512;
    const g = 110 + r() * 60;
    ctx.strokeStyle = `rgba(${g},${g},${g},${0.25 + r() * 0.35})`;
    ctx.lineWidth = 0.5 + r() * 1.2;
    ctx.beginPath();
    const x = r() * 512;
    ctx.moveTo(x - 200, y);
    ctx.lineTo(x + 200 + r() * 200, y + (r() - 0.5) * 1.5);
    ctx.stroke();
  }
  return finish(c, { repeat });
}

/** Fine woven fabric — desk mat surface (roughness / bump). */
export function fabricTexture(repeat: [number, number] = [1, 1]) {
  const { c, ctx } = canvas(256, 256);
  const r = rng(11);
  const img = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const weave = ((x >> 1) + (y >> 1)) % 2 === 0 ? 18 : -18;
      const v = Math.max(0, Math.min(255, 150 + weave + (r() - 0.5) * 60));
      const i = (y * 256 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c, { repeat });
}

/** Hex-perforated sheet for case vents / front mesh. White = solid (alphaMap). */
export function perforatedTexture(repeat: [number, number] = [1, 1]) {
  const { c, ctx } = canvas(256, 256);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#000';
  const step = 16;
  for (let row = 0; row * step * 0.866 < 256 + step; row++) {
    for (let col = -1; col * step < 256 + step; col++) {
      const x = col * step + (row % 2 ? step / 2 : 0);
      const y = row * step * 0.866;
      ctx.beginPath();
      ctx.arc(x, y, step * 0.36, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return finish(c, { repeat });
}

/**
 * Mouse shell maps painted in the sphere's UV space so the button seams and
 * the logo follow the sculpted surface exactly.
 * Returns { color, emissive } — color holds seams, emissive holds the logo.
 */
export function mouseShellTextures(shape: MouseShape) {
  const W = 512;
  const H = 256;
  const color = canvas(W, H);
  const emissive = canvas(W, H);
  const cImg = color.ctx.createImageData(W, H);
  const eImg = emissive.ctx.createImageData(W, H);
  for (let py = 0; py < H; py++) {
    // SphereGeometry: v = 1 - theta/PI (v=1 top), u = phi/2PI
    const theta = (py / (H - 1)) * Math.PI;
    for (let px = 0; px < W; px++) {
      const phi = (px / (W - 1)) * Math.PI * 2;
      const x = -Math.cos(phi) * Math.sin(theta);
      const y = Math.cos(theta);
      const z = Math.sin(phi) * Math.sin(theta);
      const p = mouseSurface(shape, x, y, z);
      // canvas row 0 = texture top = v 1 = theta 0
      const i = (py * W + px) * 4;
      let shade = 255;
      const top = y > 0.25;
      // central split between left/right buttons (front half only)
      if (top && z < -0.02 && Math.abs(p.x) < 0.0011) shade = 18;
      // rear edge of the buttons
      if (top && Math.abs(z - 0.02) < 0.018 && Math.abs(x) < 0.82) shade = 18;
      // side seams where the shell meets the grips
      if (Math.abs(y - 0.28) < 0.022 && z < 0.4) shade = 40;
      cImg.data[i] = cImg.data[i + 1] = cImg.data[i + 2] = shade;
      cImg.data[i + 3] = 255;
      // logo: small ring on the palm rest
      const d = Math.hypot(p.x, p.z - shape.length * 0.27);
      const logo = top && d > 0.0045 && d < 0.0058 ? 255 : 0;
      eImg.data[i] = eImg.data[i + 1] = eImg.data[i + 2] = logo;
      eImg.data[i + 3] = 255;
    }
  }
  color.ctx.putImageData(cImg, 0, 0);
  emissive.ctx.putImageData(eImg, 0, 0);
  const colorTex = finish(color.c, { srgb: true });
  const emissiveTex = finish(emissive.c, { srgb: true });
  colorTex.wrapS = colorTex.wrapT = emissiveTex.wrapS = emissiveTex.wrapT = ClampToEdgeWrapping;
  return { color: colorTex, emissive: emissiveTex };
}

/** Wallpaper for the monitor: branded virtual-lab desktop. Redrawn after fonts load. */
export function drawWallpaper(c: HTMLCanvasElement) {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = c;
  // size unit: the height on landscape screens, the width on portrait ones (phones, tablets)
  const u = Math.min(h, w * 0.56);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#05070d');
  bg.addColorStop(0.55, '#0a1424');
  bg.addColorStop(1, '#04060a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // aurora ribbons
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 26; k++) {
    const t = k / 25;
    ctx.strokeStyle = `rgba(${40 + t * 30 | 0}, ${150 + t * 80 | 0}, 255, ${0.05 + 0.06 * Math.sin(t * Math.PI)})`;
    ctx.lineWidth = 2 + 10 * Math.sin(t * Math.PI);
    ctx.beginPath();
    ctx.moveTo(-50, h * (0.62 + 0.1 * t));
    ctx.bezierCurveTo(w * 0.3, h * (0.25 + 0.2 * t), w * 0.62, h * (0.95 - 0.25 * t), w + 50, h * (0.38 + 0.12 * t));
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, w * 0.45);
  glow.addColorStop(0, 'rgba(56,214,245,0.18)');
  glow.addColorStop(1, 'rgba(56,214,245,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // logo mark
  const s = u * 0.09;
  ctx.save();
  ctx.translate(w / 2, h * 0.42);
  ctx.strokeStyle = '#38d6f5';
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(56,214,245,0.8)';
  ctx.shadowBlur = s * 0.4;
  ctx.beginPath();
  ctx.moveTo(-s * 0.45, -s * 0.38);
  ctx.lineTo(s * 0.45, -s * 0.38);
  ctx.lineTo(-s * 0.45, s * 0.38);
  ctx.lineTo(s * 0.45, s * 0.38);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = 'rgba(238,241,246,0.92)';
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(u * 0.045)}px "Unbounded Variable", "Segoe UI", sans-serif`;
  ctx.fillText('VIRTUAL INFORMATICS LAB', w / 2, h * 0.6);
  ctx.fillStyle = 'rgba(163,171,187,0.85)';
  ctx.font = `500 ${Math.round(u * 0.028)}px "Manrope Variable", "Segoe UI", sans-serif`;
  ctx.fillText('Виртуалды информатика зертханасы', w / 2, h * 0.655);

  // taskbar
  ctx.fillStyle = 'rgba(12,15,22,0.85)';
  ctx.fillRect(0, h - u * 0.055, w, u * 0.055);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i === 0 ? 'rgba(56,214,245,0.9)' : 'rgba(200,210,225,0.35)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - u * 0.12 + i * u * 0.045, h - u * 0.042, u * 0.03, u * 0.03, u * 0.006);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(220,226,235,0.7)';
  ctx.textAlign = 'right';
  ctx.font = `600 ${Math.round(u * 0.022)}px "Manrope Variable", sans-serif`;
  ctx.fillText('09:41', w - u * 0.03, h - u * 0.02);
}

/** PCB: solder mask with faint copper traces and silkscreen outlines (sRGB colour map). */
export function pcbTexture(base = '#14181d', w = 512, h = 640, seed = 3) {
  const { c, ctx } = canvas(w, h);
  const r = rng(seed);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  // copper traces under the solder mask
  ctx.lineCap = 'round';
  for (let i = 0; i < 220; i++) {
    ctx.strokeStyle = `rgba(120,140,150,${0.05 + r() * 0.07})`;
    ctx.lineWidth = 0.6 + r() * 1.4;
    let x = r() * w;
    let y = r() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      if (r() > 0.5) x += (r() - 0.5) * 160;
      else y += (r() - 0.5) * 160;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // vias
  ctx.fillStyle = 'rgba(170,175,180,0.25)';
  for (let i = 0; i < 260; i++) {
    ctx.beginPath();
    ctx.arc(r() * w, r() * h, 1 + r(), 0, Math.PI * 2);
    ctx.fill();
  }
  // silkscreen component outlines
  ctx.strokeStyle = 'rgba(225,230,235,0.28)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const bw = 8 + r() * 30;
    const bh = 6 + r() * 20;
    ctx.strokeRect(r() * (w - bw), r() * (h - bh), bw, bh);
  }
  return finish(c, { srgb: true });
}

/** Faint smudges / dust for glass roughness (values stay low: 0.02 – 0.14). */
export function smudgeTexture() {
  const { c, ctx } = canvas(512, 512);
  const r = rng(21);
  ctx.fillStyle = 'rgb(6,6,6)';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const rad = 10 + r() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(36,36,36,${0.25 + r() * 0.35})`);
    g.addColorStop(1, 'rgba(36,36,36,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(60,60,60,${r() * 0.5})`;
    ctx.fillRect(r() * 512, r() * 512, 1, 1);
  }
  return finish(c);
}

/** Generic product label: dark sticker with a title, sub-lines and an accent bar. */
export function labelTexture(lines: string[], { w = 512, h = 160, bg = '#0d0f13', accent = '#38d6f5' } = {}) {
  const { c, ctx } = canvas(w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w * 0.018, h);
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? 'rgba(238,241,246,0.95)' : 'rgba(170,178,192,0.85)';
    ctx.font = `${i === 0 ? 700 : 500} ${Math.round(h * (i === 0 ? 0.22 : 0.13))}px "Manrope Variable", "Segoe UI", sans-serif`;
    ctx.fillText(line, w * 0.06, h * (0.3 + i * 0.24));
  });
  return finish(c, { srgb: true });
}
