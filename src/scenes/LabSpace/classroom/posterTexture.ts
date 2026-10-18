/**
 * Classroom posters drawn into canvas textures (2026-10): a header with the
 * title, an infographic per subject and a "click to learn more" footer.
 * Every word comes from the locales (`lab.classroom.posters.<id>.*`), so the
 * posters follow the site language; numbers and symbols are universal.
 */
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { PosterId } from '@/data/lab/classroom';

export const POSTER_W = 1024;
export const POSTER_H = 1276;

/** Label of the poster being drawn: `L('cpu')` → `lab.classroom.posters.<id>.cpu`. */
type Label = (key: string) => string;
type Ctx = CanvasRenderingContext2D;

interface Palette {
  bg: string;
  panel: string;
  text: string;
  muted: string;
  line: string;
}

const DISPLAY = '"Unbounded Variable", "Manrope Variable", sans-serif';
const SANS = '"Manrope Variable", "Segoe UI", sans-serif';
const MONO = '"JetBrains Mono", Consolas, monospace';

function setFont(ctx: Ctx, text: string, max: number, size: number, weight: number, family: string, min = 18) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > max && s > min) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

/** Text wrapped to a width, starting at baseline y; returns the baseline after the last line. */
function wrap(ctx: Ctx, text: string, x: number, y: number, max: number, lh: number) {
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

function rounded(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient, stroke?: string, width = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = width;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function arrow(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, both = false) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const head = (ax: number, ay: number, bx: number, by: number) => {
    const a = Math.atan2(by - ay, bx - ax);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 24 * Math.cos(a - 0.5), by - 24 * Math.sin(a - 0.5));
    ctx.lineTo(bx - 24 * Math.cos(a + 0.5), by - 24 * Math.sin(a + 0.5));
    ctx.closePath();
    ctx.fill();
  };
  head(x1, y1, x2, y2);
  if (both) head(x2, y2, x1, y1);
}

/** Centred text, on one line or split into two when it does not fit. */
function centred(ctx: Ctx, text: string, cx: number, cy: number, max: number, size: number, color: string, weight = 700) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${weight} ${size}px ${SANS}`;
  const words = text.split(' ');
  if (ctx.measureText(text).width <= max || words.length === 1) {
    setFont(ctx, text, max, size, weight, SANS);
    ctx.fillText(text, cx, cy + 2);
  } else {
    const half = Math.ceil(words.length / 2);
    const a = words.slice(0, half).join(' ');
    const b = words.slice(half).join(' ');
    setFont(ctx, a.length >= b.length ? a : b, max, size, weight, SANS);
    // the font is "700 28px …": take the pixel size, not the weight
    const lh = Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? size) * 1.12;
    ctx.fillText(a, cx, cy - lh / 2 + 2);
    ctx.fillText(b, cx, cy + lh / 2 + 2);
  }
  ctx.textBaseline = 'alphabetic';
}

/** A labelled box centred on (cx, cy). */
function block(ctx: Ctx, p: Palette, cx: number, cy: number, w: number, h: number, label: string, accent: string, size = 34) {
  rounded(ctx, cx - w / 2, cy - h / 2, w, h, 22, p.panel, accent);
  centred(ctx, label, cx, cy, w - 28, size, p.text);
}

// ── the six subjects ─────────────────────────────────────────────────────

function architecture(ctx: Ctx, p: Palette, L: Label, accent: string) {
  // processor with its two parts
  rounded(ctx, 286, 310, 452, 300, 28, p.panel, accent, 5);
  ctx.fillStyle = accent;
  ctx.textAlign = 'center';
  setFont(ctx, L('cpu'), 400, 40, 800, DISPLAY, 22);
  ctx.fillText(L('cpu'), 512, 372);
  block(ctx, p, 404, 500, 190, 130, L('alu'), '#94a3b8', 28);
  block(ctx, p, 620, 500, 190, 130, L('cu'), '#94a3b8', 28);
  // input → processor → output
  block(ctx, p, 138, 460, 200, 170, L('input'), '#38d6f5', 30);
  block(ctx, p, 886, 460, 200, 170, L('output'), '#f5b83d', 30);
  arrow(ctx, 240, 460, 284, 460, '#38d6f5');
  arrow(ctx, 740, 460, 784, 460, '#f5b83d');
  // memory and storage below
  block(ctx, p, 512, 760, 340, 120, L('ram'), '#a78bfa', 32);
  block(ctx, p, 512, 960, 340, 120, L('storage'), '#fb7185', 32);
  arrow(ctx, 512, 614, 512, 698, p.line, true);
  arrow(ctx, 512, 822, 512, 898, p.line, true);
  ctx.fillStyle = p.muted;
  ctx.textAlign = 'left';
  ctx.font = `600 26px ${SANS}`;
  ctx.fillText(L('bus'), 530, 664);
  ctx.textAlign = 'center';
  ctx.font = `500 28px ${SANS}`;
  wrap(ctx, L('caption'), 512, 1078, 880, 36);
}

function units(ctx: Ctx, p: Palette, L: Label, accent: string) {
  for (let i = 0; i < 6; i++) {
    const y = 300 + i * 132;
    rounded(ctx, 70, y, 884, 108, 22, p.panel);
    // the bar grows with the unit (a log scale: each step is ×1024)
    const g = ctx.createLinearGradient(70, 0, 954, 0);
    g.addColorStop(0, accent);
    g.addColorStop(1, `${accent}33`);
    rounded(ctx, 70, y + 92, 120 + (764 * i) / 5, 16, 8, g);
    ctx.fillStyle = p.text;
    ctx.textAlign = 'left';
    setFont(ctx, L(`r${i + 1}`), 820, 40, 700, SANS, 22);
    ctx.fillText(L(`r${i + 1}`), 104, y + 64);
  }
  ctx.fillStyle = p.muted;
  ctx.textAlign = 'center';
  ctx.font = `500 28px ${SANS}`;
  wrap(ctx, L('caption'), 512, 1110, 880, 36);
}

function numbers(ctx: Ctx, p: Palette, L: Label, accent: string) {
  const cols = [180, 420, 650, 862];
  const heads = [L('dec'), L('bin'), L('oct'), L('hex')];
  rounded(ctx, 60, 288, 904, 70, 18, accent);
  ctx.fillStyle = '#05070d';
  ctx.textAlign = 'center';
  heads.forEach((h, i) => {
    setFont(ctx, h, 200, 30, 800, SANS, 18);
    ctx.fillText(h, cols[i], 334);
  });
  ctx.font = `600 34px ${MONO}`;
  for (let n = 0; n <= 15; n++) {
    const y = 404 + n * 44;
    if (n % 2 === 0) rounded(ctx, 60, y - 32, 904, 44, 10, p.panel);
    ctx.fillStyle = p.text;
    [String(n), n.toString(2).padStart(4, '0'), n.toString(8), n.toString(16).toUpperCase()].forEach((v, i) => ctx.fillText(v, cols[i], y));
  }
  ctx.fillStyle = accent;
  ctx.font = `700 40px ${MONO}`;
  ctx.fillText('13₁₀ = 1101₂ = 15₈ = D₁₆', 512, 1124);
}

function algorithm(ctx: Ctx, p: Palette, L: Label, accent: string) {
  const oval = (cy: number, label: string) => {
    rounded(ctx, 372, cy - 42, 280, 84, 42, p.panel, accent);
    centred(ctx, label, 512, cy, 250, 32, p.text);
  };
  const para = (cy: number, label: string) => {
    ctx.beginPath();
    ctx.moveTo(352, cy - 46);
    ctx.lineTo(712, cy - 46);
    ctx.lineTo(672, cy + 46);
    ctx.lineTo(312, cy + 46);
    ctx.closePath();
    ctx.fillStyle = p.panel;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38d6f5';
    ctx.stroke();
    centred(ctx, label, 512, cy, 320, 30, p.text);
  };
  oval(330, L('start'));
  arrow(ctx, 512, 374, 512, 420, p.line);
  para(468, L('input'));
  arrow(ctx, 512, 516, 512, 560, p.line);
  // condition
  ctx.beginPath();
  ctx.moveTo(512, 562);
  ctx.lineTo(682, 652);
  ctx.lineTo(512, 742);
  ctx.lineTo(342, 652);
  ctx.closePath();
  ctx.fillStyle = p.panel;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#f5b83d';
  ctx.stroke();
  centred(ctx, L('cond'), 512, 652, 220, 32, p.text);
  // branches
  arrow(ctx, 342, 652, 214, 652, p.line);
  arrow(ctx, 214, 652, 214, 790, p.line);
  arrow(ctx, 682, 652, 810, 652, p.line);
  arrow(ctx, 810, 652, 810, 790, p.line);
  ctx.font = `800 28px ${SANS}`;
  ctx.fillStyle = '#4ade80';
  ctx.textAlign = 'center';
  ctx.fillText(L('yes'), 270, 630);
  ctx.fillStyle = '#fb7185';
  ctx.fillText(L('no'), 754, 630);
  block(ctx, p, 214, 850, 300, 116, L('out1'), '#4ade80', 28);
  block(ctx, p, 810, 850, 300, 116, L('out2'), '#fb7185', 28);
  // join and end
  ctx.strokeStyle = p.line;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(214, 908);
  ctx.lineTo(214, 960);
  ctx.lineTo(810, 960);
  ctx.lineTo(810, 908);
  ctx.stroke();
  arrow(ctx, 512, 960, 512, 1004, p.line);
  oval(1048, L('end'));
}

function network(ctx: Ctx, p: Palette, L: Label, accent: string) {
  // the internet as a cloud
  ctx.fillStyle = p.panel;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const [x, y, r] of [
    [452, 350, 56],
    [520, 320, 70],
    [592, 352, 54],
    [512, 372, 64],
  ] as const)
    ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  centred(ctx, L('internet'), 518, 352, 240, 30, p.text);
  arrow(ctx, 512, 438, 512, 486, p.line);
  block(ctx, p, 512, 534, 300, 96, L('router'), accent, 32);
  // Wi-Fi to a laptop
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 5;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(662, 534);
  ctx.lineTo(800, 534);
  ctx.stroke();
  ctx.setLineDash([]);
  block(ctx, p, 880, 534, 160, 96, L('wifi'), '#a78bfa', 28);
  arrow(ctx, 512, 582, 512, 650, p.line);
  block(ctx, p, 512, 700, 340, 96, L('switch'), '#38d6f5', 32);
  // a star of computers
  const pcs = [150, 384, 640, 874];
  pcs.forEach((x) => {
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(512, 748);
    ctx.lineTo(x, 860);
    ctx.stroke();
    rounded(ctx, x - 78, 862, 156, 104, 14, p.panel, '#4ade80');
    rounded(ctx, x - 64, 874, 128, 70, 8, '#0b1220');
    rounded(ctx, x - 26, 970, 52, 14, 6, '#4ade80');
    ctx.fillStyle = p.text;
    ctx.textAlign = 'center';
    ctx.font = `700 28px ${SANS}`;
    ctx.fillText(L('pc'), x, 1022);
  });
  ctx.fillStyle = p.muted;
  ctx.font = `500 28px ${SANS}`;
  wrap(ctx, L('caption'), 512, 1104, 880, 36);
}

function safety(ctx: Ctx, p: Palette, L: Label, accent: string) {
  for (let i = 0; i < 6; i++) {
    const y = 300 + i * 136;
    rounded(ctx, 60, y, 904, 118, 22, p.panel);
    ctx.beginPath();
    ctx.arc(124, y + 59, 38, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = '#05070d';
    ctx.textAlign = 'center';
    ctx.font = `800 40px ${DISPLAY}`;
    ctx.fillText(String(i + 1), 124, y + 74);
    ctx.fillStyle = p.text;
    ctx.textAlign = 'left';
    ctx.font = `600 30px ${SANS}`;
    const text = L(`r${i + 1}`);
    const lines = Math.ceil(ctx.measureText(text).width / 760);
    wrap(ctx, text, 186, y + (lines > 1 ? 50 : 70), 760, 36);
  }
}

const DRAW: Record<PosterId, (ctx: Ctx, p: Palette, L: Label, accent: string) => void> = { architecture, units, numbers, algorithm, network, safety };

/**
 * The poster of `id` with the current language: `L(key)` gives its labels,
 * `common` the shared eyebrow and footer hint.
 */
export function posterTexture(id: PosterId, L: Label, common: { eyebrow: string; hint: string }, accent: string, light: boolean): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = POSTER_W;
  c.height = POSTER_H;
  const ctx = c.getContext('2d');
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  if (!ctx) return texture;
  const p: Palette = light
    ? { bg: '#ffffff', panel: '#f1f4f9', text: '#0f172a', muted: '#475569', line: '#64748b' }
    : { bg: '#0d1322', panel: '#172036', text: '#eef2f8', muted: '#a3abbb', line: '#7c879c' };
  rounded(ctx, 0, 0, POSTER_W, POSTER_H, 34, p.bg);
  // header
  const band = ctx.createLinearGradient(0, 0, POSTER_W, 0);
  band.addColorStop(0, accent);
  band.addColorStop(1, `${accent}00`);
  ctx.fillStyle = band;
  ctx.fillRect(40, 40, POSTER_W - 80, 10);
  ctx.fillStyle = accent;
  ctx.textAlign = 'left';
  ctx.font = `800 28px ${SANS}`;
  ctx.fillText(common.eyebrow.toUpperCase(), 60, 108);
  ctx.fillStyle = p.text;
  const title = L('title');
  const size = setFont(ctx, title, 900, 62, 800, DISPLAY, 40);
  if (ctx.measureText(title).width > 900) {
    ctx.font = `800 44px ${DISPLAY}`;
    wrap(ctx, title, 60, 176, 900, 54);
  } else ctx.fillText(title, 60, 176 + (62 - size) / 2);
  ctx.fillStyle = p.muted;
  ctx.font = `500 30px ${SANS}`;
  wrap(ctx, L('subtitle'), 60, 236, 900, 36);
  DRAW[id](ctx, p, L, accent);
  // footer: what a click does
  rounded(ctx, 60, POSTER_H - 96, POSTER_W - 120, 60, 30, `${accent}22`, accent, 3);
  ctx.fillStyle = p.text;
  ctx.textAlign = 'center';
  setFont(ctx, common.hint, POSTER_W - 180, 28, 700, SANS, 18);
  ctx.fillText(common.hint, POSTER_W / 2, POSTER_H - 56);
  return texture;
}

/** The room's name for above the workstation. */
export function roomSignTexture(text: string, caption: string, light: boolean): CanvasTexture {
  const W = 2048;
  const H = 320;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const texture = new CanvasTexture(c);
  texture.colorSpace = SRGBColorSpace;
  if (!ctx) return texture;
  rounded(ctx, 0, 0, W, H, 60, light ? 'rgba(255,255,255,0.96)' : 'rgba(10,15,28,0.94)');
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#38d6f5');
  g.addColorStop(0.5, '#8b5cf6');
  g.addColorStop(1, '#e879f9');
  ctx.fillStyle = g;
  ctx.fillRect(120, H - 40, W - 240, 8);
  ctx.textAlign = 'center';
  ctx.fillStyle = light ? '#0f172a' : '#f1f5fb';
  setFont(ctx, text, W - 200, 128, 800, DISPLAY, 60);
  ctx.fillText(text, W / 2, 168);
  ctx.fillStyle = light ? '#475569' : '#a3abbb';
  setFont(ctx, caption, W - 260, 54, 500, SANS, 28);
  ctx.fillText(caption, W / 2, 252);
  return texture;
}
