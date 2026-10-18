/**
 * Exhibit tables (V2-4a): devices stand in tidy rows, each on its own pad
 * with a name plate in front; a click opens the device's info panel and 360°
 * viewer. The back row sits on a riser so nothing hides behind the front.
 */
import { useMemo, useRef, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CanvasTexture, SRGBColorSpace, type MeshStandardMaterial } from 'three';
import { deviceById, deviceKey } from '@/data/devices/devices';
import type { TranslationKey } from '@/lib/i18n';
import { useDisposable } from '@/hooks/useDisposable';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { useLabStore } from '@/store/labStore';
import { Table } from '../furniture';
import { useFurnitureColors } from '../furnitureColors';
import { inOverview } from './deviceAssets';
import { DeviceModel } from './DeviceModel';
import { FONT_SANS } from '@/lib/fonts';

function plateTexture(text: string, light: boolean, accent: string) {
  const W = 512;
  const H = 112;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.roundRect(2, 2, W - 4, H - 4, 26);
    ctx.fillStyle = light ? 'rgba(255,255,255,0.96)' : 'rgba(12,16,28,0.94)';
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(24, H - 14, 64, 5);
    let size = 44;
    ctx.font = `700 ${size}px ${FONT_SANS}`;
    while (ctx.measureText(text).width > W - 48 && size > 22) {
      size -= 2;
      ctx.font = `700 ${size}px ${FONT_SANS}`;
    }
    ctx.fillStyle = light ? '#0f172a' : '#f1f5fb';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 24, H / 2 - 4);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Name plate lying on the table edge, angled towards the visitor. */
function Plate({ id, accent, width }: { id: string; accent: string; width: number }) {
  const t = useT();
  const light = useTheme() === 'light';
  const device = deviceById(id);
  const name = device ? t(deviceKey(device, 'name') as TranslationKey) : id;
  const fonts = useCanvasFonts();
  const tex = useDisposable(() => plateTexture(name, light, accent), [name, light, accent, fonts]);
  const w = Math.min(width, 0.3);
  return (
    <mesh rotation-x={-Math.PI / 2 + 0.55} position-y={0.012}>
      <planeGeometry args={[w, (w * 112) / 512]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

/**
 * One device on its pad: clicking opens it, hovering lights the pad edge.
 * `plate` puts the name plate `plateZ` in front of the pad.
 */
export function DeviceSpot({ id, accent, padSize, children, plate = true, plateZ, light = false, bare = false }: {
  id: string;
  accent: string;
  padSize: readonly [number, number];
  children?: ReactNode;
  plate?: boolean;
  plateZ?: number;
  light?: boolean;
  /** No pad (wall-hung items); the plate still shows. */
  bare?: boolean;
}) {
  const edge = useRef<MeshStandardMaterial>(null);
  const c = useFurnitureColors();
  useFrame(() => {
    const m = edge.current;
    if (!m) return;
    const s = useLabStore.getState();
    const goal = s.device === id ? 3.4 : s.hoveredDevice === id ? 2.4 : 0.6;
    m.emissiveIntensity += (goal - m.emissiveIntensity) * 0.15;
  });
  const handlers = useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        useLabStore.getState().hoverDevice(id);
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        if (useLabStore.getState().hoveredDevice === id) useLabStore.getState().hoverDevice(null);
        document.body.style.cursor = '';
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 6) return;
        e.stopPropagation();
        useLabStore.getState().openDevice(id);
      },
    }),
    [id],
  );
  const [pw, pd] = padSize;
  return (
    <group {...handlers}>
      {!bare && (
        <>
          <RoundedBox args={[pw + 0.012, 0.006, pd + 0.012]} radius={0.003} position-y={0.003}>
            <meshStandardMaterial ref={edge} color="#05070c" emissive={accent} emissiveIntensity={0.6} toneMapped={false} />
          </RoundedBox>
          <RoundedBox args={[pw, 0.01, pd]} radius={0.004} position-y={0.005} receiveShadow>
            <meshStandardMaterial color={c.shelf} roughness={0.45} />
          </RoundedBox>
        </>
      )}
      {/* no children: the device itself; an explicit null (the overview) shows nothing */}
      <group position-y={0.01}>{children === undefined ? <DeviceModel id={id} display light={light} /> : children}</group>
      {plate && (
        <group position={[0, 0, plateZ ?? pd / 2 + 0.055]}>
          <Plate id={id} accent={accent} width={pw} />
        </group>
      )}
    </group>
  );
}

export interface ExhibitItem {
  id: string;
  /** Relative slot width (default 1). */
  w?: number;
}

export interface ExhibitRow {
  items: readonly ExhibitItem[];
  /** Row centre along the table depth (m, + towards the visitor). */
  z: number;
  /** Height of the riser under this row (m). */
  riser?: number;
  /** Pad depth (m). */
  depth?: number;
}

/**
 * A lab table with one or two exhibit rows. In the overview (`detail`
 * preview) only `hero` devices show, at their lightest level.
 */
export function ExhibitTable({ width, depth, rows, accent, detail, hero = [] }: {
  width: number;
  depth: number;
  rows: readonly ExhibitRow[];
  accent: string;
  detail: 'preview' | 'full';
  hero?: readonly string[];
}) {
  const c = useFurnitureColors();
  const full = detail === 'full';
  const level = useQualityPreset().level;
  return (
    <Table width={width} depth={depth}>
      {rows.map((row, ri) => {
        const total = row.items.reduce((s, it) => s + (it.w ?? 1), 0);
        const usable = width - 0.12;
        const pd = row.depth ?? 0.24;
        let x = -usable / 2;
        return (
          <group key={ri} position={[0, 0, row.z]}>
            {row.riser ? (
              <RoundedBox args={[width - 0.04, row.riser, pd + 0.16]} radius={0.008} position-y={row.riser / 2} castShadow receiveShadow>
                <meshStandardMaterial color={c.body} roughness={0.5} />
              </RoundedBox>
            ) : null}
            {row.items.map((it) => {
              const slot = (usable * (it.w ?? 1)) / total;
              const cx = x + slot / 2;
              x += slot;
              const show = full || (hero.includes(it.id) && inOverview(it.id, level));
              if (!show) return null;
              return (
                <group key={it.id} position={[cx, row.riser ?? 0, 0]}>
                  {/* the overview shows the hero device alone (no pad, no plate): fewer draw calls */}
                  <DeviceSpot id={it.id} accent={accent} padSize={[slot - 0.05, pd]} plate={full} bare={!full} light={!full} />
                </group>
              );
            })}
          </group>
        );
      })}
    </Table>
  );
}
