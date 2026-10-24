/**
 * The room around the desk (0.37): wall shelves with books, a plant and a
 * little Bit figurine, a tall floor plant, a desk lamp, a rug, a BitLab neon
 * sign on the slats and two posters. Procedural and light: leaves are one
 * instanced mesh per plant, materials are shared, signs are canvas textures
 * drawn once per language (crisp, never mirrored).
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { CanvasTexture, Color, Matrix4, Quaternion, ShapeGeometry, SRGBColorSpace, Vector3, type Group, type InstancedMesh } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { BRAND } from '@/config/brand';
import { canvasFontsReady, FONT_HERO } from '@/lib/fonts';
import { roundedRectShape, roundedSlab } from '@/lib/three/geometry';
import { mergeStatic } from '@/lib/three/mergeStatic';
import { BACKDROP_ORDER, DESK_TOP } from '../layout';

const WALL = -0.92;
const LOGO_URL = `${import.meta.env.BASE_URL}${BRAND.logo}`;

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, logo: HTMLImageElement | null) => void;

/** A canvas texture redrawn when `deps` change and once the logo image has loaded. */
function useCanvasTexture(w: number, h: number, draw: Draw, deps: readonly unknown[]) {
  const texture = useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [w, h]);
  useEffect(() => {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const paint = (logo: HTMLImageElement | null) => {
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, logo);
      texture.needsUpdate = true;
    };
    paint(null);
    const img = new Image();
    let live = true;
    img.onload = () => live && paint(img);
    img.src = LOGO_URL;
    // the hero font (with its Kazakh subset) may arrive after the first paint
    canvasFontsReady().then(() => live && paint(img.complete && img.naturalWidth ? img : null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `draw` is recreated each render; deps carry its inputs
  }, [texture, w, h, ...deps]);
  return texture;
}

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

/** Fits a line of text into `max` px, shrinking from `size`. */
function fitText(ctx: CanvasRenderingContext2D, text: string, size: number, max: number, weight = 700) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${FONT_HERO}`;
    s -= 2;
  } while (ctx.measureText(text).width > max && s > 10);
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

/* ── signs ───────────────────────────────────────────────── */

function NeonSign() {
  const map = useCanvasTexture(1024, 256, (ctx, w, h, logo) => {
    const mark = h * 0.62;
    ctx.font = `800 ${h * 0.46}px ${FONT_HERO}`;
    const tw = ctx.measureText(BRAND.name).width;
    const x0 = (w - (mark + 40 + tw)) / 2;
    ctx.shadowColor = '#56dbf8';
    ctx.shadowBlur = 28;
    if (logo) ctx.drawImage(logo, x0, (h - mark) / 2, mark, mark);
    const g = ctx.createLinearGradient(x0 + mark, 0, x0 + mark + 40 + tw, 0);
    g.addColorStop(0, '#9ff0ff');
    g.addColorStop(0.55, '#b5c2ff');
    g.addColorStop(1, '#e0b8ff');
    ctx.fillStyle = g;
    ctx.textBaseline = 'middle';
    ctx.fillText(BRAND.name, x0 + mark + 40, h / 2 + 4);
    ctx.shadowBlur = 0;
    ctx.fillText(BRAND.name, x0 + mark + 40, h / 2 + 4);
  }, []);
  return (
    <mesh position={[0.02, 1.5, WALL + 0.012]}>
      <planeGeometry args={[0.72, 0.18]} />
      <meshBasicMaterial map={map} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

function Poster({ variant, position, size }: { variant: 'brand' | 'bits'; position: [number, number, number]; size: [number, number] }) {
  const t = useT();
  const title = t(variant === 'brand' ? 'home.decor.posterBrand' : 'home.decor.posterBits');
  const caption = t(variant === 'brand' ? 'home.decor.posterBrandSub' : 'home.decor.posterBitsSub');
  const map = useCanvasTexture(512, 724, (ctx, w, h, logo) => {
    if (variant === 'brand') {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#2fc8f2');
      g.addColorStop(0.55, '#5f7bff');
      g.addColorStop(1, '#a95cf5');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.arc(w * 0.85, h * 0.12, 60 + i * 70, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.stroke();
      }
      if (logo) ctx.drawImage(logo, w / 2 - 110, 110, 220, 220);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      fitText(ctx, BRAND.name, 92, w - 60, 800);
      ctx.fillText(BRAND.name, w / 2, 440);
    } else {
      ctx.fillStyle = '#0d1430';
      ctx.fillRect(0, 0, w, h);
      // circuit traces
      ctx.strokeStyle = 'rgba(86,219,248,0.35)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 14; i++) {
        const y = 40 + i * 30;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(120 + ((i * 53) % 180), y);
        ctx.lineTo(160 + ((i * 53) % 180), y + 22);
        ctx.lineTo(w - 30, y + 22);
        ctx.stroke();
        ctx.fillStyle = '#56dbf8';
        ctx.beginPath();
        ctx.arc(w - 30, y + 22, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.font = `800 150px ${FONT_HERO}`;
      const g = ctx.createLinearGradient(0, 360, w, 520);
      g.addColorStop(0, '#56dbf8');
      g.addColorStop(1, '#c08bff');
      ctx.fillStyle = g;
      ctx.fillText('0 1', w / 2, 520);
    }
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    fitText(ctx, title, 40, w - 70, 700);
    ctx.fillText(title, w / 2, variant === 'brand' ? 520 : 600);
    ctx.font = `500 26px ${FONT_HERO}`;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    wrap(ctx, caption, w - 90).slice(0, 3).forEach((line, i) => ctx.fillText(line, w / 2, (variant === 'brand' ? 575 : 648) + i * 34));
  }, [variant, title, caption]);
  const [pw, ph] = size;
  return (
    <group position={position}>
      {/* thin black frame and the print */}
      <mesh castShadow>
        <boxGeometry args={[pw + 0.03, ph + 0.03, 0.02]} />
        <meshStandardMaterial color="#15171c" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position-z={0.0105}>
        <planeGeometry args={[pw, ph]} />
        <meshStandardMaterial map={map} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ── plants ──────────────────────────────────────────────── */

/** Leaves as one instanced mesh: a flattened sphere scattered round a stem. */
function Leaves({ count, seed, spread, height, size, droop = 0, color }: { count: number; seed: number; spread: number; height: [number, number]; size: number; droop?: number; color: string }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    let r = seed;
    const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    const mat = new Matrix4();
    const q = new Quaternion();
    const tint = new Color();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 * 2.4 + rand();
      const k = rand();
      const y = height[0] + (height[1] - height[0]) * k - droop * (1 - k) * rand();
      const d = spread * (0.35 + 0.65 * rand());
      q.setFromAxisAngle(new Vector3(-Math.sin(a), 0, Math.cos(a)), 0.5 + rand() * 0.6);
      const s = size * (0.7 + rand() * 0.5);
      mat.compose(new Vector3(Math.cos(a) * d, y, Math.sin(a) * d), q, new Vector3(s, s * 0.12, s * 0.55));
      m.setMatrixAt(i, mat);
      m.setColorAt(i, tint.set(color).offsetHSL(0, 0, (rand() - 0.5) * 0.12));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [count, seed, spread, height, size, droop, color]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow>
      <sphereGeometry args={[1, 10, 6]} />
      <meshStandardMaterial roughness={0.6} />
    </instancedMesh>
  );
}

function Pot({ radius, height, color }: { radius: number; height: number; color: string }) {
  return (
    <mesh position-y={height / 2} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 0.82, height, 28]} />
      <meshStandardMaterial color={color} roughness={0.55} />
    </mesh>
  );
}

const FLOOR_LEAVES: [number, number] = [0.45, 1.25];
const SHELF_LEAVES: [number, number] = [-0.06, 0.12];
const TRAIL_LEAVES: [number, number] = [-0.22, 0.08];

/* ── shelf props ─────────────────────────────────────────── */

/** Books as one instanced mesh (one draw call), each in its own colour. */
function Books({ colors }: { colors: readonly string[] }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const mat = new Matrix4();
    const q = new Quaternion();
    const c = new Color();
    colors.forEach((color, i) => {
      const h = 0.17 + ((i * 37) % 5) * 0.012;
      q.setFromAxisAngle(new Vector3(0, 0, 1), i === colors.length - 1 ? -0.22 : 0);
      mat.compose(new Vector3(i * 0.034, h / 2, 0), q, new Vector3(1, h, 1));
      m.setMatrixAt(i, mat);
      m.setColorAt(i, c.set(color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [colors]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, colors.length]} castShadow>
      <boxGeometry args={[0.03, 1, 0.13]} />
      <meshStandardMaterial roughness={0.75} />
    </instancedMesh>
  );
}

/** A tiny Bit: white head, dark visor, glowing eyes — the lab's robot teacher as a figurine. */
function BitFigure() {
  const geo = useDisposable(() => ({ head: roundedSlab(0.11, 0.085, 0.08, 0.025, 0.006), visor: roundedSlab(0.084, 0.056, 0.01, 0.016, 0.003) }), []);
  return (
    <group>
      <mesh position-y={0.025} castShadow>
        <cylinderGeometry args={[0.03, 0.038, 0.05, 20]} />
        <meshStandardMaterial color="#f4f6fb" roughness={0.3} />
      </mesh>
      <mesh geometry={geo.head} position-y={0.052} castShadow>
        <meshStandardMaterial color="#f4f6fb" roughness={0.3} />
      </mesh>
      <mesh geometry={geo.visor} position={[0, 0.066, 0.038]}>
        <meshStandardMaterial color="#0b1328" roughness={0.2} metalness={0.4} />
      </mesh>
      {[-0.016, 0.016].map((x) => (
        <mesh key={x} position={[x, 0.096, 0.0445]}>
          <boxGeometry args={[0.01, 0.014, 0.002]} />
          <meshBasicMaterial color="#56dbf8" toneMapped={false} />
        </mesh>
      ))}
      <mesh position-y={0.152}>
        <sphereGeometry args={[0.009, 12, 8]} />
        <meshBasicMaterial color="#ffb35c" toneMapped={false} />
      </mesh>
    </group>
  );
}

function Shelf({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[width, 0.026, 0.18]} />
      <meshStandardMaterial color="#d8c3a3" roughness={0.7} />
    </mesh>
  );
}

/* ── lamp and rug ────────────────────────────────────────── */

function DeskLamp() {
  return (
    <group position={[-0.8, DESK_TOP, -0.3]} rotation-y={0.5}>
      <mesh position-y={0.008} castShadow>
        <cylinderGeometry args={[0.065, 0.07, 0.016, 32]} />
        <meshStandardMaterial color="#e8e9ec" roughness={0.35} metalness={0.2} />
      </mesh>
      <group position-y={0.016} rotation-z={-0.35}>
        <mesh position-y={0.17} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.34, 12]} />
          <meshStandardMaterial color="#e8e9ec" roughness={0.35} metalness={0.2} />
        </mesh>
        <group position-y={0.34} rotation-z={1.75}>
          <mesh position-y={0.13} castShadow>
            <cylinderGeometry args={[0.006, 0.006, 0.26, 12]} />
            <meshStandardMaterial color="#e8e9ec" roughness={0.35} metalness={0.2} />
          </mesh>
          <group position-y={0.27} rotation-z={-2.1}>
            <mesh castShadow>
              <coneGeometry args={[0.06, 0.09, 28, 1, true]} />
              <meshStandardMaterial color="#e8e9ec" roughness={0.35} metalness={0.2} side={2} />
            </mesh>
            <mesh position-y={-0.03}>
              <sphereGeometry args={[0.024, 16, 10]} />
              <meshBasicMaterial color="#fff3d6" toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

const RUG = [2.5, 1.72] as const;

function Rug() {
  const dark = useTheme() === 'dark';
  const geometry = useDisposable(() => {
    const g = new ShapeGeometry(roundedRectShape(RUG[0], RUG[1], 0.12), 8);
    // shape UVs are in metres: map them onto the whole texture
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / RUG[0] + 0.5, uv.getY(i) / RUG[1] + 0.5);
    return g;
  }, []);
  const map = useCanvasTexture(512, 352, (ctx, w, h) => {
    ctx.fillStyle = dark ? '#252b47' : '#dfe4f0';
    ctx.fillRect(0, 0, w, h);
    // soft woven stripes
    ctx.save();
    roundRect(ctx, 0, 0, w, h, 40);
    ctx.clip();
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.025)' : 'rgba(40,60,120,0.035)';
      ctx.fillRect(x, 0, 8, h);
    }
    ctx.restore();
    ctx.strokeStyle = dark ? 'rgba(126,150,255,0.45)' : 'rgba(95,123,255,0.45)';
    ctx.lineWidth = 7;
    roundRect(ctx, 22, 22, w - 44, h - 44, 28);
    ctx.stroke();
    ctx.strokeStyle = dark ? 'rgba(169,92,245,0.4)' : 'rgba(169,92,245,0.35)';
    ctx.lineWidth = 3;
    roundRect(ctx, 42, 42, w - 84, h - 84, 20);
    ctx.stroke();
  }, [dark]);
  return (
    // opaque rounded shape and a Lambert surface: the rug covers a lot of screen, so it must be cheap to fill
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} position={[0, 0.003, 0.32]} receiveShadow renderOrder={BACKDROP_ORDER}>
      <meshLambertMaterial map={map} />
    </mesh>
  );
}

/* ── room ────────────────────────────────────────────────── */

export function Decor() {
  const books = useMemo(() => ['#5f7bff', '#2fc8f2', '#f4f6fb', '#a95cf5'], []);
  const root = useRef<Group>(null);
  // ~40 small meshes would cost as many draw calls a frame: one per material instead
  useLayoutEffect(() => (root.current ? mergeStatic(root.current) : undefined), []);
  return (
    <group ref={root}>
      <Rug />
      <NeonSign />
      <Poster variant="brand" position={[1.4, 1.5, WALL - 0.015]} size={[0.46, 0.65]} />
      <Poster variant="bits" position={[1.95, 1.44, WALL - 0.015]} size={[0.42, 0.594]} />

      {/* left shelf: books, the Bit figurine, a small plant */}
      <Shelf position={[-0.6, 1.44, WALL + 0.09]} width={0.56} />
      <group position={[-0.82, 1.453, WALL + 0.09]}>
        <Books colors={books} />
      </group>
      <group position={[-0.58, 1.453, WALL + 0.1]} rotation-y={0.35}>
        <BitFigure />
      </group>
      <group position={[-0.4, 1.453, WALL + 0.09]}>
        <Pot radius={0.04} height={0.07} color="#eeece6" />
        <group position-y={0.08}>
          <Leaves count={14} seed={7} spread={0.06} height={SHELF_LEAVES} size={0.045} color="#3f8f55" />
        </group>
      </group>

      {/* right shelf: trailing plant and a cube */}
      <Shelf position={[0.62, 1.64, WALL + 0.09]} width={0.5} />
      <group position={[0.5, 1.653, WALL + 0.09]}>
        <Pot radius={0.045} height={0.08} color="#2b2f3a" />
        <group position-y={0.06}>
          <Leaves count={18} seed={19} spread={0.09} height={TRAIL_LEAVES} droop={0.1} size={0.04} color="#4c9a5e" />
        </group>
      </group>
      <mesh position={[0.74, 1.653 + 0.04, WALL + 0.09]} rotation-y={0.5} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#5f7bff" roughness={0.35} metalness={0.1} />
      </mesh>

      {/* tall floor plant on the right of the desk (the left is the headline's) */}
      <group position={[1.25, 0, -0.55]}>
        <Pot radius={0.15} height={0.34} color="#eeece6" />
        <mesh position-y={0.62} castShadow>
          <cylinderGeometry args={[0.012, 0.016, 0.6, 8]} />
          <meshStandardMaterial color="#5b4a33" roughness={0.9} />
        </mesh>
        <Leaves count={26} seed={3} spread={0.32} height={FLOOR_LEAVES} size={0.17} droop={0.2} color="#3a7f4c" />
      </group>

      <DeskLamp />
    </group>
  );
}
