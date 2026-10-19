import { CanvasTexture, SRGBColorSpace } from 'three';

let logoTexture: CanvasTexture | null = null;
/** The BitLab mark (components/brand/BrandMark.tsx) on a shared 256 px canvas: one texture for every robot. */
export function brandMarkTexture() {
  if (logoTexture) return logoTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.scale(4, 4);
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
  const dot = ctx.createLinearGradient(40, 10, 52, 24);
  dot.addColorStop(0, '#ffc15c');
  dot.addColorStop(1, '#ff7a6b');
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(45.5, 17.5, 5.5, 0, Math.PI * 2);
  ctx.fill();
  logoTexture = new CanvasTexture(c);
  logoTexture.colorSpace = SRGBColorSpace;
  logoTexture.anisotropy = 4;
  return logoTexture;
}
