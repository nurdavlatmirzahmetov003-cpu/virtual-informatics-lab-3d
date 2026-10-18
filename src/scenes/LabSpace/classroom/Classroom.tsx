/**
 * The informatics classroom around the lab (2026-10): learning posters on the
 * back and side walls (a click opens the explanation beside the scene),
 * daylight windows, the room's name above the workstation and a wall clock
 * on local time. Canvas textures only — nothing to download — redrawn when
 * the language or the theme changes, and after the web fonts arrive.
 */
import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { BoxGeometry, CanvasTexture, CircleGeometry, PlaneGeometry, SRGBColorSpace, type Group, type MeshBasicMaterial } from 'three';
import { CLOCK, POSTERS, ROOM_SIGN, WINDOWS, wallYaw, type Poster } from '@/data/lab/classroom';
import { LAB_HALL } from '@/data/lab/zones';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import type { TranslationKey } from '@/lib/i18n';
import { useLabStore } from '@/store/labStore';
import { mergePieces, type Place } from './mergeParts';
import { posterTexture, roomSignTexture } from './posterTexture';

const k = (s: string) => s as TranslationKey;

/**
 * Frames and trims: PBR on High / Ultra, Lambert (no environment lighting)
 * on Low / Medium, where the classroom must cost next to nothing (V2-12 perf).
 */
function Trim({ color, metalness = 0, roughness }: { color: string; metalness?: number; roughness: number }) {
  const level = useQualityPreset().level;
  return level === 'low' || level === 'medium' ? <meshLambertMaterial color={color} /> : <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

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
  const material = useRef<MeshBasicMaterial>(null);
  const glow = useRef(0);
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
    const goal = hover || selected ? 1 : 0;
    if (Math.abs(goal - glow.current) < 0.002) return;
    glow.current += (goal - glow.current) * Math.min(1, dt * 8);
    m.color.setScalar(0.94 + 0.22 * glow.current);
  });
  const [w, h] = poster.size;
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    open(poster.id);
  };
  return (
    <group position={[...poster.center]} rotation-y={wallYaw(poster.wall)}>
      {/* the frame is drawn by PosterFrames; the open poster gets its own, in its accent */}
      {selected && (
        <mesh position-z={0.012}>
          <boxGeometry args={[w + 0.06, h + 0.06, 0.024]} />
          <meshStandardMaterial color={poster.accent} metalness={0.4} roughness={0.4} />
        </mesh>
      )}
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
        {/* unlit: the poster is its own light (cheap on Low / Medium); brighter on hover */}
        <meshBasicMaterial ref={material} map={texture} color={[0.94, 0.94, 0.94]} />
      </mesh>
    </group>
  );
}

/** Frames of all posters but the open one, merged into one mesh. */
function PosterFrames({ light }: { light: boolean }) {
  const open = useLabStore((s) => s.poster);
  const geometry = useDisposable(
    () =>
      mergePieces(
        POSTERS.filter((p) => p.id !== open).map((p) => ({
          geo: new BoxGeometry(p.size[0] + 0.06, p.size[1] + 0.06, 0.024),
          at: [0, 0, 0.012],
          parents: [{ at: p.center, rot: [0, wallYaw(p.wall), 0] }],
        })),
      ),
    [open],
  );
  return (
    <mesh geometry={geometry}>
      <Trim color={light ? '#cfd6e2' : '#1b2338'} metalness={0.4} roughness={0.4} />
    </mesh>
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

/** Where a window sits on its side wall, facing into the room. */
const windowPlace = (win: (typeof WINDOWS)[number]): Place => ({
  at: [win.wall === 'left' ? LAB_HALL.minX + 0.03 : LAB_HALL.maxX - 0.03, win.y, win.z],
  rot: [0, win.wall === 'left' ? Math.PI / 2 : -Math.PI / 2, 0],
});

/** All windows in two draw calls: the skies, and the frames with mullions, transoms and sills. */
function Windows({ light }: { light: boolean }) {
  const sky = useDisposable(() => skyTexture(light), [light]);
  const { skies, frames } = useDisposable(
    () => ({
      skies: mergePieces(WINDOWS.map((win) => ({ geo: new PlaneGeometry(win.w, win.h), parents: [windowPlace(win)] }))),
      frames: mergePieces(
        WINDOWS.flatMap((win) => {
          const parents = [windowPlace(win)];
          const bars = [
            [0, win.h / 2, win.w + 0.1, 0.07],
            [0, -win.h / 2, win.w + 0.14, 0.09],
            [-win.w / 2, 0, 0.07, win.h],
            [win.w / 2, 0, 0.07, win.h],
            [0, 0, 0.05, win.h],
            [0, win.h * 0.18, win.w, 0.045],
          ].map(([fx, fy, fw, fh]) => ({ geo: new BoxGeometry(fw, fh, 0.05), at: [fx, fy, 0.025] as const, parents }));
          // window sill
          return [...bars, { geo: new BoxGeometry(win.w + 0.2, 0.04, 0.22), at: [0, -win.h / 2 - 0.05, 0.1] as const, parents }];
        }),
      ),
    }),
    [],
  );
  return (
    <>
      <mesh geometry={skies}>
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      <mesh geometry={frames}>
        <Trim color={light ? '#e8ecf3' : '#151b2c'} roughness={0.5} />
      </mesh>
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
  // dial and its twelve ticks in one draw call (vertex colours)
  const dial = useDisposable(
    () =>
      mergePieces(
        [
          { geo: new CircleGeometry(r, 48), at: [0, 0, 0.026], color: light ? '#ffffff' : '#0b1222' },
          ...Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const big = i % 3 === 0;
            return { geo: new PlaneGeometry(big ? 0.016 : 0.009, big ? 0.05 : 0.03), at: [Math.sin(a) * r * 0.86, Math.cos(a) * r * 0.86, 0.03] as const, rot: [0, 0, -a] as const, color: ink };
          }),
        ],
        true,
      ),
    [r, light, ink],
  );
  return (
    <group position={[CLOCK.center[0], CLOCK.center[1], CLOCK.center[2] + 0.03]}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[r + 0.025, r + 0.025, 0.05, 48]} />
        <Trim color={light ? '#cfd6e2' : '#1b2338'} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh geometry={dial}>
        <meshBasicMaterial vertexColors />
      </mesh>
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
      <PosterFrames light={light} />
      <Windows light={light} />
      <RoomSign light={light} fonts={fonts} />
      <Clock light={light} />
    </group>
  );
}
