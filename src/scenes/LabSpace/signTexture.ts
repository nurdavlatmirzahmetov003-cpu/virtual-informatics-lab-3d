import { CanvasTexture, SRGBColorSpace } from 'three';
import { FONT_DISPLAY, FONT_SANS } from '@/lib/fonts';

export interface SignStyle {
  /** Panel fill (with alpha) and text colour, from the theme. */
  background: string;
  text: string;
  muted: string;
}

const W = 1024;
const H = 256;

/**
 * Zone sign: an accent disc with the zone number, the zone name and a short
 * caption, drawn with the site's fonts into a canvas texture (no font files
 * are loaded for 3D text). Re-created when the language or theme changes.
 */
export function signTexture(number: number, name: string, caption: string, accent: string, style: SignStyle): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const r = 56;
    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, r);
    ctx.fillStyle = style.background;
    ctx.fill();
    // gradient hairline along the bottom edge
    const line = ctx.createLinearGradient(0, 0, W, 0);
    line.addColorStop(0, accent);
    line.addColorStop(1, `${accent}00`);
    ctx.fillStyle = line;
    ctx.fillRect(64, H - 22, W - 128, 4);

    ctx.beginPath();
    ctx.arc(128, H / 2, 70, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = '#05070d';
    ctx.font = `700 84px ${FONT_DISPLAY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(number), 128, H / 2 + 4);

    ctx.textAlign = 'left';
    ctx.fillStyle = style.text;
    let size = 64;
    ctx.font = `700 ${size}px ${FONT_DISPLAY}`;
    while (ctx.measureText(name).width > W - 290 && size > 34) {
      size -= 2;
      ctx.font = `700 ${size}px ${FONT_DISPLAY}`;
    }
    ctx.fillText(name, 236, H / 2 - 22);
    ctx.fillStyle = style.muted;
    ctx.font = `500 34px ${FONT_SANS}`;
    let text = caption;
    while (ctx.measureText(text).width > W - 290 && text.length > 4) text = `${text.slice(0, -2).trimEnd()}…`;
    ctx.fillText(text, 238, H / 2 + 48);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export const SIGN_ASPECT = W / H;
