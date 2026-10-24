/**
 * Slides of the BitLab presentation stage (zone 10, 0.37), drawn on a canvas:
 * brand gradient, the BitLab mark and wordmark, slide title and text in the
 * site language, a simple picture per slide and the progress dots.
 */
import { FONT_HERO, FONT_SANS } from '@/lib/fonts';

export const SLIDE_COUNT = 6;

export interface Slide {
  title: string;
  body: string;
}

function mark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const s = size / 64;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const g = ctx.createLinearGradient(6, 4, 60, 62);
  g.addColorStop(0, '#2fc8f2');
  g.addColorStop(0.55, '#5f7bff');
  g.addColorStop(1, '#a95cf5');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(2, 2, 60, 60, 17);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(22, 13);
  ctx.lineTo(22, 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(33.5, 37.5, 10.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffb35c';
  ctx.beginPath();
  ctx.arc(45.5, 17.5, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** A small picture for each slide (unit square, drawn in white lines). */
function picture(ctx: CanvasRenderingContext2D, index: number, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = s * 0.03;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const rr = (a: number, b: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(a * s, b * s, w * s, h * s, r * s);
    ctx.fill();
    ctx.stroke();
  };
  switch (index) {
    case 0: // a PC case with a glowing fan
      rr(0.2, 0.05, 0.6, 0.9, 0.06);
      ctx.beginPath();
      ctx.arc(0.5 * s, 0.35 * s, 0.17 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0.5 * s, 0.72 * s, 0.1 * s, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 1: // the hall from above: zones round a showcase
      for (const [a, b] of [[0.05, 0.05], [0.4, 0.05], [0.75, 0.05], [0.05, 0.42], [0.75, 0.42], [0.05, 0.78], [0.75, 0.78]]) rr(a, b, 0.2, 0.17, 0.03);
      ctx.beginPath();
      ctx.arc(0.5 * s, 0.55 * s, 0.13 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    case 2: // monitor, keyboard and a tower
      rr(0.05, 0.12, 0.55, 0.38, 0.04);
      ctx.beginPath();
      ctx.moveTo(0.32 * s, 0.5 * s);
      ctx.lineTo(0.32 * s, 0.62 * s);
      ctx.stroke();
      rr(0.05, 0.7, 0.55, 0.12, 0.03);
      rr(0.7, 0.2, 0.25, 0.62, 0.04);
      break;
    case 3: // a network of nodes
      {
        const nodes = [[0.2, 0.2], [0.8, 0.25], [0.5, 0.5], [0.2, 0.8], [0.82, 0.78]];
        ctx.beginPath();
        for (const [a, b] of [[0, 2], [1, 2], [2, 3], [2, 4], [0, 1], [3, 4]]) {
          ctx.moveTo(nodes[a][0] * s, nodes[a][1] * s);
          ctx.lineTo(nodes[b][0] * s, nodes[b][1] * s);
        }
        ctx.stroke();
        for (const [a, b] of nodes) {
          ctx.beginPath();
          ctx.arc(a * s, b * s, 0.07 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
      break;
    case 4: // a trophy with a star
      ctx.beginPath();
      ctx.moveTo(0.25 * s, 0.1 * s);
      ctx.lineTo(0.75 * s, 0.1 * s);
      ctx.quadraticCurveTo(0.75 * s, 0.6 * s, 0.5 * s, 0.62 * s);
      ctx.quadraticCurveTo(0.25 * s, 0.6 * s, 0.25 * s, 0.1 * s);
      ctx.fill();
      ctx.stroke();
      rr(0.38, 0.62, 0.24, 0.14, 0.02);
      rr(0.28, 0.78, 0.44, 0.1, 0.03);
      break;
    default: // Bit
      rr(0.15, 0.2, 0.7, 0.55, 0.16);
      ctx.fillStyle = '#56dbf8';
      ctx.beginPath();
      ctx.roundRect(0.33 * s, 0.38 * s, 0.1 * s, 0.13 * s, 0.05 * s);
      ctx.roundRect(0.57 * s, 0.38 * s, 0.1 * s, 0.13 * s, 0.05 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0.5 * s, 0.2 * s);
      ctx.lineTo(0.5 * s, 0.08 * s);
      ctx.stroke();
  }
  ctx.restore();
}

/** Draws slide `index` (0-based) onto the canvas. */
export function drawSlide(canvas: HTMLCanvasElement, index: number, slide: Slide, eyebrow: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const u = h / 1152;
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#0d1638');
  bg.addColorStop(0.55, '#1b2a6b');
  bg.addColorStop(1, '#4a2a86');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // soft light from the top right
  const glow = ctx.createRadialGradient(w * 0.85, h * 0.1, 0, w * 0.85, h * 0.1, w * 0.6);
  glow.addColorStop(0, 'rgba(47,200,242,0.35)');
  glow.addColorStop(1, 'rgba(47,200,242,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  mark(ctx, 90 * u, 80 * u, 110 * u);
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${62 * u}px ${FONT_HERO}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('BitLab', 225 * u, 135 * u);
  ctx.font = `600 ${34 * u}px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textAlign = 'right';
  ctx.fillText(eyebrow.toUpperCase(), w - 90 * u, 135 * u);
  ctx.textAlign = 'left';

  // title and text on the left, the picture on the right
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${96 * u}px ${FONT_HERO}`;
  const titleLines = wrap(ctx, slide.title, w * 0.56);
  let y = 420 * u;
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, 90 * u, y);
    y += 112 * u;
  }
  ctx.font = `500 ${46 * u}px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(232,238,255,0.9)';
  y += 24 * u;
  for (const line of wrap(ctx, slide.body, w * 0.55).slice(0, 5)) {
    ctx.fillText(line, 90 * u, y);
    y += 64 * u;
  }
  picture(ctx, index, w * 0.66, 300 * u, 600 * u);

  // progress dots
  for (let i = 0; i < SLIDE_COUNT; i++) {
    ctx.fillStyle = i === index ? '#56dbf8' : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(90 * u + i * 70 * u, h - 110 * u, i === index ? 52 * u : 24 * u, 24 * u, 12 * u);
    ctx.fill();
  }
}
