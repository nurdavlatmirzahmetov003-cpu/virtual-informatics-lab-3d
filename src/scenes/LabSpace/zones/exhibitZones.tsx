/**
 * V2-4a exhibit zones: PC build bench, storage wall, input/output desk and
 * print & media corner. Every device stands on its own pad in tidy rows with
 * a name plate; a click opens its info panel, 360° viewer and test.
 */
import { useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { DeviceSpot, ExhibitTable } from '../devices/Exhibit';
import { DeviceModel } from '../devices/DeviceModel';
import { Pedestal } from '../furniture';
import { useWallpaper } from './useWallpaper';
import { speedRows, type SpeedRow, type ZoneContentProps } from './zoneData';
import { FONT_DISPLAY, FONT_SANS } from '@/lib/fonts';

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
    ctx.font = `700 44px ${FONT_DISPLAY}`;
    ctx.fillText(title, 48, 84);
    const max = Math.max(...rows.map((r) => r.mbps));
    const top = 128;
    const rowH = (H - top - 36) / rows.length;
    rows.forEach((r, i) => {
      const y = top + i * rowH;
      ctx.fillStyle = light ? '#4b5563' : '#aab4c4';
      ctx.font = `600 30px ${FONT_SANS}`;
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
      ctx.font = `700 28px ${FONT_SANS}`;
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
  const fonts = useCanvasFonts();
  const rows = useMemo(() => speedRows(t('lab.storage.hdd')), [t]);
  const tex = useDisposable(() => chartTexture(t('lab.storage.chartTitle'), t('lab.storage.unit'), rows, light, accent), [t, rows, light, accent, fonts]);
  return (
    <mesh>
      <planeGeometry args={[1.6, 0.875]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

/** PC build bench: board, card, coolers, PSU on the riser; small parts in front; the case beside it. */
export function AssemblyZone({ detail, accent }: ZoneContentProps) {
  return (
    <>
      <group position={[-0.28, 0, -0.3]}>
        <ExhibitTable
          width={2.5}
          depth={1.0}
          accent={accent}
          detail={detail}
          hero={['motherboard']}
          rows={[
            { z: -0.24, riser: 0.14, depth: 0.3, items: [{ id: 'motherboard', w: 1.3 }, { id: 'gpu', w: 1.3 }, { id: 'cooler_air' }, { id: 'cooler_liquid', w: 1.2 }, { id: 'psu' }] },
            { z: 0.24, items: [{ id: 'cpu' }, { id: 'ram' }, { id: 'thermal_paste' }, { id: 'cmos_battery' }, { id: 'internal_cables', w: 1.2 }, { id: 'case_fan' }] },
          ]}
        />
      </group>
      {/* the case stands on the floor beside the bench, open side towards the visitor */}
      <group position={[1.3, 0, -0.32]}>
        <DeviceSpot id="case" accent={accent} padSize={[0.58, 0.34]} light={detail === 'preview'} plate={detail === 'full'} plateZ={0.3}>
          <group rotation-y={Math.PI / 2}>
            <DeviceModel id="case" light={detail === 'preview'} />
          </group>
        </DeviceSpot>
      </group>
    </>
  );
}

/** Storage wall: drives on a two-row exhibit, the read-speed chart on the wall above. */
export function StorageZone({ detail, accent }: ZoneContentProps) {
  return (
    <>
      <group position={[0, 0, -0.35]}>
        <ExhibitTable
          width={2.8}
          depth={0.95}
          accent={accent}
          detail={detail}
          hero={[]}
          rows={[
            { z: -0.22, riser: 0.14, depth: 0.26, items: [{ id: 'hdd_35' }, { id: 'hdd_25' }, { id: 'external_drive' }, { id: 'optical_drive' }] },
            { z: 0.24, items: [{ id: 'ssd_sata' }, { id: 'ssd_nvme' }, { id: 'usb_flash' }, { id: 'sd_card' }, { id: 'optical_disc' }] },
          ]}
        />
      </group>
      <group position={[0, 1.95, -1.72]}>
        <SpeedChart accent={accent} />
      </group>
    </>
  );
}

/** Input / output desk: big devices on the riser, hand-held ones in front. */
export function PeripheralsZone({ detail, accent }: ZoneContentProps) {
  return (
    <group position={[0, 0, -0.3]}>
      <ExhibitTable
        width={3.0}
        depth={1.0}
        accent={accent}
        detail={detail}
        hero={['monitor']}
        rows={[
          { z: -0.24, riser: 0.12, depth: 0.3, items: [{ id: 'speakers', w: 1.15 }, { id: 'monitor', w: 1.9 }, { id: 'headset' }, { id: 'microphone', w: 0.8 }, { id: 'webcam', w: 0.8 }] },
          { z: 0.25, items: [{ id: 'keyboard', w: 1.7 }, { id: 'mouse', w: 0.8 }, { id: 'gamepad' }, { id: 'graphics_tablet', w: 1.4 }] },
        ]}
      />
    </group>
  );
}

/** Print & media: printers, scanner and projector on the table; 3D printer and the panel stand on the floor. */
export function PrintMediaZone({ detail, accent }: ZoneContentProps) {
  const wallpaper = useWallpaper();
  return (
    <>
      {/* projection screen on the wall */}
      <mesh position={[0, 1.95, -1.72]}>
        <planeGeometry args={[1.9, 1.07]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={wallpaper} emissiveIntensity={0.55} roughness={0.9} />
      </mesh>
      <group position={[0, 0, -0.35]}>
        <ExhibitTable
          width={2.2}
          depth={0.7}
          accent={accent}
          detail={detail}
          hero={['printer_laser']}
          rows={[{ z: -0.04, depth: 0.44, items: [{ id: 'printer_laser' }, { id: 'printer_inkjet' }, { id: 'scanner', w: 1.1 }, { id: 'projector', w: 0.8 }] }]}
        />
      </group>
      <group position={[-1.42, 0, 0.45]}>
        <DeviceSpot id="printer_3d" accent={accent} padSize={[0.5, 0.5]} plate={detail === 'full'} plateZ={0.33}>
          <Pedestal height={0.42} radius={0.32} accent={accent}>
            {detail === 'full' ? <DeviceModel id="printer_3d" /> : null}
          </Pedestal>
        </DeviceSpot>
      </group>
      <group position={[1.4, 0, 0.45]} rotation-y={-0.35}>
        <DeviceSpot id="interactive_panel" accent={accent} padSize={[0.74, 0.52]} plate={detail === 'full'} plateZ={0.34}>
          {detail === 'full' ? <DeviceModel id="interactive_panel" /> : null}
        </DeviceSpot>
      </group>
    </>
  );
}
