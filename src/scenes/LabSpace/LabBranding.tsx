/**
 * BitLab branding in the lab hall (0.37): banners hanging in the four corners,
 * a flag on every zone (in the zone's colour) and the BitLab logo beside the
 * room's name. Canvas textures drawn once per language and theme; the flags
 * are one instanced mesh (cloth) plus one for the poles; banners and the logo
 * are tagged for the visibility audit.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Color, DoubleSide, Matrix4, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3, type InstancedMesh, type MeshBasicMaterial } from 'three';
import { LAB_ZONES } from '@/data/lab/zones';
import { BRANDING_BANNERS, BRANDING_LOGO, flagPlace, flagZones } from '@/data/lab/branding';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useDisposable } from '@/hooks/useDisposable';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { FONT_HERO, FONT_SANS } from '@/lib/fonts';
import { brandMarkTexture } from './robots/brandMark';
import { signage } from './visibilityAudit';

function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.drawImage(brandMarkTexture().image as HTMLCanvasElement, x, y, size, size);
}

/** Vertical banner: brand gradient, the mark, "BitLab" and the tagline. */
function bannerTexture(tagline: string) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1536;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#2fc8f2');
  g.addColorStop(0.5, '#5f7bff');
  g.addColorStop(1, '#a95cf5');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  for (let i = 0; i < 12; i++) ctx.fillRect(0, 120 + i * 120, c.width, 2);
  drawMark(ctx, 106, 140, 300);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = `700 118px ${FONT_HERO}`;
  ctx.fillText('BitLab', 256, 620);
  ctx.font = `600 46px ${FONT_SANS}`;
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  const words = tagline.split(/\s+/);
  let line = '';
  let y = 740;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > 420 && line) {
      ctx.fillText(line, 256, y);
      y += 62;
      line = w;
    } else line = next;
  }
  if (line) ctx.fillText(line, 256, y);
  // a bit pattern at the bottom
  ctx.font = `700 64px ${FONT_HERO}`;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('0 1 0 1', 256, 1400);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Flag cloth: white logo field (tinted per zone by the instance colour). */
function flagTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, c.height - 40, c.width, 40);
  drawMark(ctx, 40, 60, 180);
  ctx.fillStyle = '#10163a';
  ctx.font = `700 92px ${FONT_HERO}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('BitLab', 240, 150);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** A banner hanging from a slim rod (used in the corners and on the stage). */
export function BannerCloth({ width, height, name }: { width: number; height: number; name: string }) {
  const t = useT();
  const fonts = useCanvasFonts();
  const tex = useDisposable(() => bannerTexture(t('home.decor.posterBrand')), [t, fonts]);
  return (
    <group>
      <mesh position-y={height / 2 + 0.02}>
        <cylinderGeometry args={[0.012, 0.012, width + 0.08, 8]} />
        <meshStandardMaterial color="#c4ccd8" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh userData={signage(name)} name={name}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Zone flags: one cloth and one pole per zone, all in two draw calls; the cloth ripples gently. */
function ZoneFlags() {
  const cloth = useRef<InstancedMesh>(null);
  const poles = useRef<InstancedMesh>(null);
  const reduced = useReducedMotion();
  const fonts = useCanvasFonts();
  const tex = useDisposable(() => flagTexture(), [fonts]);
  const geo = useDisposable(() => {
    const g = new PlaneGeometry(0.48, 0.3, 12, 1);
    g.translate(0.24, 0, 0);
    return g;
  }, []);
  const places = useMemo(() => flagZones(LAB_ZONES).map((z) => ({ ...flagPlace(z), color: z.accent })), []);
  const material = useRef<MeshBasicMaterial>(null);

  useLayoutEffect(() => {
    const c = cloth.current;
    const p = poles.current;
    if (!c || !p) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const col = new Color();
    places.forEach((f, i) => {
      q.setFromAxisAngle(new Vector3(0, 1, 0), f.yaw);
      c.setMatrixAt(i, m.compose(new Vector3(f.at[0], f.top - 0.17, f.at[1]), q, new Vector3(1, 1, 1)));
      // the zone colour, lifted so the white field stays light
      c.setColorAt(i, col.set(f.color).lerp(new Color('#ffffff'), 0.35));
      p.setMatrixAt(i, m.compose(new Vector3(f.at[0], f.top / 2, f.at[1]), new Quaternion(), new Vector3(1, 1, 1)));
    });
    c.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
    p.instanceMatrix.needsUpdate = true;
  }, [places]);

  // a slow ripple along the cloth (vertex shader), off for reduced motion
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    if (!reduced) uniforms.uTime.value = clock.elapsedTime;
  });
  const onBeforeCompile = useMemo(
    () => (shader: { uniforms: Record<string, unknown>; vertexShader: string }) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n  float k = position.x / 0.48;\n  transformed.z += sin(uTime * 2.2 + position.x * 9.0 + float(gl_InstanceID)) * 0.025 * k;\n  transformed.y -= k * k * 0.02;',
      );
    },
    [uniforms],
  );

  return (
    <>
      <instancedMesh ref={poles} args={[undefined, undefined, places.length]} castShadow>
        <cylinderGeometry args={[0.014, 0.018, places[0].top, 8]} />
        <meshStandardMaterial color="#c4ccd8" metalness={0.7} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={cloth} args={[geo, undefined, places.length]} name="zone-flags">
        <meshBasicMaterial ref={material} map={tex} side={DoubleSide} toneMapped={false} onBeforeCompile={onBeforeCompile} />
      </instancedMesh>
    </>
  );
}

export function LabBranding() {
  return (
    <group>
      {BRANDING_BANNERS.map((b) => (
        <group key={b.id} position={[...b.at]} rotation-y={b.yaw}>
          <BannerCloth width={b.size[0]} height={b.size[1]} name={`banner:${b.id}`} />
        </group>
      ))}
      <WallLogo />
      <ZoneFlags />
    </group>
  );
}

/** The BitLab logo on the back wall, left of the room's name (the clock is on its right). */
function WallLogo() {
  const fonts = useCanvasFonts();
  const tex = useDisposable(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 320;
    const ctx = c.getContext('2d')!;
    drawMark(ctx, 10, 10, 300);
    ctx.fillStyle = '#5f7bff';
    ctx.font = `700 190px ${FONT_HERO}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('BitLab', 340, 170);
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [fonts]);
  const [w, h] = BRANDING_LOGO.size;
  return (
    <mesh position={[...BRANDING_LOGO.center]} userData={signage('wall-logo')} name="wall-logo">
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

