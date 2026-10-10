/**
 * Storage wall and peripherals desk. The storage wall carries a read-speed
 * chart built from the catalog specs (an HDD at its typical speed for
 * comparison), so the zone teaches something before V2-4 adds the 360° viewer.
 */
import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { Hdd } from '@/scenes/HardwareExplorer/placeholders';
import { Shelving, Table } from '../furniture';
import { Product } from './common';
import { KEYBOARDS, MICE, SSDS, speedRows, type SpeedRow, type ZoneContentProps } from './zoneData';

function chartTexture(title: string, unit: string, rows: SpeedRow[], light: boolean, accent: string) {
  const W = 1024;
  const H = 560;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.beginPath();
    ctx.roundRect(4, 4, W - 8, H - 8, 40);
    ctx.fillStyle = light ? 'rgba(255,255,255,0.92)' : 'rgba(12,16,28,0.88)';
    ctx.fill();
    ctx.fillStyle = light ? '#111827' : '#eef2f8';
    ctx.font = '700 44px "Unbounded Variable", "Manrope Variable", sans-serif';
    ctx.fillText(title, 48, 84);
    const max = Math.max(...rows.map((r) => r.mbps));
    const top = 128;
    const rowH = (H - top - 36) / rows.length;
    rows.forEach((r, i) => {
      const y = top + i * rowH;
      ctx.fillStyle = light ? '#4b5563' : '#aab4c4';
      ctx.font = '600 30px "Manrope Variable", sans-serif';
      ctx.fillText(r.label, 48, y + 30);
      const barW = Math.max(14, ((W - 300) * r.mbps) / max);
      const g = ctx.createLinearGradient(48, 0, 48 + barW, 0);
      g.addColorStop(0, i === 0 ? '#9ca3af' : accent);
      g.addColorStop(1, i === 0 ? '#6b7280' : '#8b5cf6');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(48, y + 44, barW, 22, 11);
      ctx.fill();
      ctx.fillStyle = light ? '#111827' : '#eef2f8';
      ctx.font = '700 28px "Manrope Variable", sans-serif';
      ctx.fillText(`${r.mbps.toLocaleString('ru-RU')} ${unit}`, 60 + barW, y + 64);
    });
  }
  const t = new CanvasTexture(canvas);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function SpeedChart({ accent }: { accent: string }) {
  const t = useT();
  const light = useTheme() === 'light';
  const rows = useMemo(() => speedRows(t('lab.storage.hdd')), [t]);
  const tex = useDisposable(() => chartTexture(t('lab.storage.chartTitle'), t('lab.storage.unit'), rows, light, accent), [t, rows, light, accent]);
  return (
    <mesh>
      <planeGeometry args={[1.6, 0.875]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

const SHELF_ROWS = [0.42, 0.82, 1.22] as const;
/** Lean of a displayed drive: its top face turned towards the aisle (rad from flat). */
const STAND = 1.15;
/** Half the length of a 3.5″ HDD (147 mm), the half that would sink below the shelf. */
const HDD_HALF = 0.0735;

export function StorageZone({ detail, accent }: ZoneContentProps) {
  return (
    // against the wall (1.76 m behind the zone centre), the chart under the zone sign
    <group position-z={-1.4}>
      <Shelving width={2.6} rows={SHELF_ROWS} />
      {/* shelf-edge light strips */}
      {SHELF_ROWS.map((y) => (
        <mesh key={y} position={[0, y - 0.0135, 0.171]}>
          <planeGeometry args={[2.56, 0.008]} />
          <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      ))}
      {/* HDDs (procedural until V2-4), cover towards the visitor, ×2 */}
      {[-0.75, -0.25].map((x, i) => (
        <group key={x} position={[x, SHELF_ROWS[0] + 0.0125 + HDD_HALF * 2 * Math.sin(STAND), -0.02]} rotation={[STAND, 0, i ? 0.06 : -0.05]} scale={2}>
          <Hdd />
        </group>
      ))}
      {detail === 'full' &&
        SSDS.map((id, i) => {
          // ×3 on the middle shelf, leaning back like on a display stand, label towards the aisle
          const half = id.includes('870') ? 0.05 : 0.04;
          return (
            <group key={id} position={[-0.9 + i * 0.6, SHELF_ROWS[1] + 0.0125 + half * 3 * Math.sin(STAND), 0]} rotation-x={STAND} scale={3}>
              <Product product={id} />
            </group>
          );
        })}
      <group position={[0, 2.02, -0.15]}>
        <SpeedChart accent={accent} />
      </group>
    </group>
  );
}

export function PeripheralsZone({ detail }: ZoneContentProps) {
  const light = detail === 'preview';
  return (
    <Table width={3.0} depth={0.95}>
      <Product product="mon-dell-u2724d" lightOnly={light} position={[0, 0, -0.3]} />
      {(light ? KEYBOARDS.slice(2, 3) : KEYBOARDS).map((id, i, all) => (
        <group key={id} position={[(i - (all.length - 1) / 2) * 0.56 - 0.04, 0, 0.18]}>
          <Product product={id} lightOnly={light} />
          {!light && <Product product={MICE[i]} position={[0.27, 0, 0.02]} />}
        </group>
      ))}
      {!light && (
        <>
          <Product product="spk-logitech-z407" position={[-0.6, 0, -0.32]} rotation-y={0.25} />
          <Product product="spk-logitech-z407" position={[0.6, 0, -0.32]} rotation-y={-0.25} />
          <Product product="hs-steelseries-nova7" position={[-1.25, 0, -0.25]} rotation-y={0.4} />
          <Product product="hs-razer-blackshark-v2-pro" position={[1.25, 0, -0.25]} rotation-y={-0.4} />
        </>
      )}
    </Table>
  );
}
