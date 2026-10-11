/**
 * Non-component data of the lab zones: product lists, the storage speed
 * chart rows and the per-zone file list used for prefetching.
 */
import type { LabZoneId } from '@/data/lab/zones';
import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import type { ResolvedBuild } from '@/lib/studio/build';
import { showcaseBuild } from '@/lib/studio/showcase';
import { isTieredModel } from '@/lib/three/modelUrls';
import { devicesIn } from '@/data/devices/devices';
import { deviceProducts } from '../devices/deviceAssets';

export type ZoneDetail = 'preview' | 'full';
export interface ZoneContentProps {
  detail: ZoneDetail;
  accent: string;
}

export const productUrl = (id: string) => `${import.meta.env.BASE_URL}assets/models/products/${id}.glb`;

/** Product id of a catalog item with its own model (`products/<id>.glb`), else null. */
export const tieredId = (path?: string) => (path && isTieredModel(path) ? path.replace(/^products\/|\.glb$/g, '') : null);

export const SSDS = ['ssd-samsung-870-evo-1tb', 'ssd-kingston-nv3-1tb', 'ssd-wd-sn850x-1tb', 'ssd-samsung-990-pro-2tb'] as const;
export const SHOWCASE = { case: 'case-lianli-o11d-evo', monitor: 'mon-asus-xg27aqmr', chair: 'chair-secretlab-titan-evo', keyboard: 'kb-razer-huntsman-v3-pro-tkl', headset: 'hs-logitech-pro-x2' } as const;

/** Typical sequential read of a 7200 rpm 3.5″ desktop HDD (MB/s), for the comparison bar. */
export const HDD_READ_MBPS = 200;

export interface SpeedRow {
  label: string;
  mbps: number;
}

/** Storage chart rows from the catalog read speeds, slowest first; the HDD comes first. */
export function speedRows(hddLabel: string): SpeedRow[] {
  const rows = SSDS.map((id) => {
    const item = CATALOG_BY_ID.get(id);
    const read = item?.specifications.find((s) => s.key === 'read')?.value;
    return item && typeof read === 'number' ? { label: `${item.brand} ${item.model.replace(/\s*\(.*\)$/, '')}`, mbps: read } : null;
  }).filter((r): r is SpeedRow => r !== null);
  return [{ label: hddLabel, mbps: HDD_READ_MBPS }, ...rows.sort((a, b) => a.mbps - b.mbps)];
}

/** Product files each zone mounts at full detail (prefetched while a neighbour is focused). */
export function zoneProducts(): Partial<Record<LabZoneId, string[]>> {
  const b = showcaseBuild();
  const ids = (keys: Array<keyof ResolvedBuild>) => keys.map((k) => tieredId(b[k]?.modelPath)).filter((x): x is string => !!x);
  return {
    workstation: ids(['monitor', 'keyboard', 'mouse', 'headset', 'speakers', 'chair', 'desk', 'case']),
    showcase: Object.values(SHOWCASE),
    assembly: deviceProducts(devicesIn('assembly').map((d) => d.id)),
    storage: deviceProducts(devicesIn('storage').map((d) => d.id)),
    peripherals: [...deviceProducts(devicesIn('peripherals').map((d) => d.id)), 'spk-edifier-r1280db'],
  };
}
