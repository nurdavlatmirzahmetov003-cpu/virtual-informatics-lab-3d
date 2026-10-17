/**
 * The informatics classroom around the lab (2026-10): learning posters on the
 * back and side walls (a click opens the explanation beside the scene),
 * daylight windows, the room's name above the workstation and a wall clock
 * on local time. Canvas textures only — nothing to download — redrawn when
 * the language or the theme changes, and after the web fonts arrive.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type Group, type MeshStandardMaterial } from 'three';
import { CLOCK, POSTERS, ROOM_SIGN, WINDOWS, wallYaw, type Poster } from '@/data/lab/classroom';
import { LAB_HALL } from '@/data/lab/zones';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import type { TranslationKey } from '@/lib/i18n';
import { useLabStore } from '@/store/labStore';
import { posterTexture, roomSignTexture } from './posterTexture';

const k = (s: string) => s as TranslationKey;

/** Bumps once the site fonts are ready, so canvas text is drawn with them. */
function useFontsReady() {
  const [ready, setReady] = useState(0);
  useEffect(() => {
    let alive = true;
    void Promise.all([document.fonts.load('800 40px "Unbounded Variable"'), document.fonts.load('600 30px "Manrope Variable"')])
      .catch(() => undefined)
      .then(() => alive && setReady(1));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

function PosterBoard({ poster, light, fonts }: { poster: Poster; light: boolean; fonts: number }) {
  const t = useT();
  const open = useLabStore((s) => s.openPoster);
  const selected = useLabStore((s) => s.poster === poster.id);
  const material = useRef<MeshStandardMaterial>(null);
  const [hover, setHover] = useState(false);
  const texture = useDisposable(
    () =>
      posterTexture(poster.id, (key) => t(k(`lab.classroom.posters.${poster.id}.${key}`)), { eyebrow: t('lab.classroom.eyebrow'), hint: t('lab.classroom.hint') }, poster.accent, light),
    // fonts: redraw once the web fonts are in
    [poster, t, light, fonts],
  );
  useFrame((_, dt) => {
    const m = material.current;
    if (!m) return;
    const goal = hover || selected ? 0.32 : 0.06;
    m.emissiveIntensity += (goal - m.emissiveIntensity) * Math.min(1, dt * 8);
  });
  const [w, h] = poster.size;
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    open(poster.id);
  };
  return (
    <group position={[...poster.center]} rotation-y={wallYaw(poster.wall)}>
      {/* frame */}
      <mesh position-z={0.012}>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.024]} />
        <meshStandardMaterial color={selected ? poster.accent : light ? '#cfd6e2' : '#1b2338'} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh
        position-z={0.026}
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = '';
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial ref={material} map={texture} emissive="#ffffff" emissiveMap={texture} emissiveIntensity={0.06} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Sky seen through a window: a soft daylight gradient with a faint skyline. */
function skyTexture(light: boolean) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    if (light) {
      g.addColorStop(0, '#9fd3ff');
      g.addColorStop(0.7, '#e3f2ff');
      g.addColorStop(1, '#f5fbff');
    } else {
      g.addColorStop(0, '#0b1636');
      g.addColorStop(0.65, '#1d2f5c');
      g.addColorStop(1, '#3b4f80');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = light ? 'rgba(120,140,170,0.35)' : 'rgba(5,9,20,0.75)';
    for (let i = 0; i < 9; i++) {
      const w = 18 + ((i * 37) % 23);
      const h = 30 + ((i * 53) % 60);
      ctx.fillRect(i * 29 - 4, 256 - h, w, h);
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function Windows({ light }: { light: boolean }) {
  const sky = useDisposable(() => skyTexture(light), [light]);
  const frame = light ? '#e8ecf3' : '#151b2c';
  return (
    <>
      {WINDOWS.map((win, i) => {
        const x = win.wall === 'left' ? LAB_HALL.minX + 0.03 : LAB_HALL.maxX - 0.03;
        return (
          <group key={i} position={[x, win.y, win.z]} rotation-y={win.wall === 'left' ? Math.PI / 2 : -Math.PI / 2}>
            <mesh>
              <planeGeometry args={[win.w, win.h]} />
              <meshBasicMaterial map={sky} toneMapped={false} />
            </mesh>
            {/* frame, mullion and transom */}
            {[
              [0, win.h / 2, win.w + 0.1, 0.07],
              [0, -win.h / 2, win.w + 0.14, 0.09],
              [-win.w / 2, 0, 0.07, win.h],
              [win.w / 2, 0, 0.07, win.h],
              [0, 0, 0.05, win.h],
              [0, win.h * 0.18, win.w, 0.045],
            ].map(([fx, fy, fw, fh], j) => (
              <mesh key={j} position={[fx, fy, 0.025]}>
                <boxGeometry args={[fw, fh, 0.05]} />
                <meshStandardMaterial color={frame} roughness={0.5} />
              </mesh>
            ))}
            {/* window sill */}
            <mesh position={[0, -win.h / 2 - 0.05, 0.1]}>
              <boxGeometry args={[win.w + 0.2, 0.04, 0.22]} />
              <meshStandardMaterial color={frame} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}

function RoomSign({ light, fonts }: { light: boolean; fonts: number }) {
  const t = useT();
  const texture = useDisposable(() => roomSignTexture(t('lab.classroom.room'), t('lab.classroom.roomCaption'), light), [t, light, fonts]);
  const [w, h] = ROOM_SIGN.size;
  return (
    <mesh position={[ROOM_SIGN.center[0], ROOM_SIGN.center[1], ROOM_SIGN.center[2] + 0.02]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

function Clock({ light }: { light: boolean }) {
  const hour = useRef<Group>(null);
  const minute = useRef<Group>(null);
  const second = useRef<Group>(null);
  const last = useRef(-1);
  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds();
    if (s === last.current) return;
    last.current = s;
    const m = now.getMinutes() + s / 60;
    const hr = (now.getHours() % 12) + m / 60;
    if (second.current) second.current.rotation.z = -(s / 60) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(hr / 12) * Math.PI * 2;
  });
  const r = CLOCK.radius;
  const ink = light ? '#0f172a' : '#e8eef8';
  const ticks = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <group position={[CLOCK.center[0], CLOCK.center[1], CLOCK.center[2] + 0.03]}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[r + 0.025, r + 0.025, 0.05, 48]} />
        <meshStandardMaterial color={light ? '#cfd6e2' : '#1b2338'} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position-z={0.026}>
        <circleGeometry args={[r, 48]} />
        <meshStandardMaterial color={light ? '#ffffff' : '#0b1222'} roughness={0.6} />
      </mesh>
      {ticks.map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * r * 0.86, Math.cos(a) * r * 0.86, 0.03]} rotation-z={-a}>
          <planeGeometry args={[i % 3 === 0 ? 0.016 : 0.009, i % 3 === 0 ? 0.05 : 0.03]} />
          <meshBasicMaterial color={ink} />
        </mesh>
      ))}
      <group ref={hour} position-z={0.034}>
        <mesh position-y={r * 0.25}>
          <planeGeometry args={[0.018, r * 0.5]} />
          <meshBasicMaterial color={ink} />
        </mesh>
      </group>
      <group ref={minute} position-z={0.036}>
        <mesh position-y={r * 0.36}>
          <planeGeometry args={[0.012, r * 0.72]} />
          <meshBasicMaterial color={ink} />
        </mesh>
      </group>
      <group ref={second} position-z={0.038}>
        <mesh position-y={r * 0.38}>
          <planeGeometry args={[0.005, r * 0.8]} />
          <meshBasicMaterial color="#38d6f5" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export function Classroom() {
  const light = useTheme() === 'light';
  const fonts = useFontsReady();
  return (
    <group>
      {POSTERS.map((p) => (
        <PosterBoard key={p.id} poster={p} light={light} fonts={fonts} />
      ))}
      <Windows light={light} />
      <RoomSign light={light} fonts={fonts} />
      <Clock light={light} />
    </group>
  );
}
