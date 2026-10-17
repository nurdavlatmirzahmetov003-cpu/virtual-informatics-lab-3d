/**
 * The large 3D lab (V2-3): one hall, nine zones. Zones show light previews
 * on the overview; the focused zone mounts its full models, its neighbours'
 * files are prefetched into the HTTP cache (not parsed, so nothing waits in
 * memory), and a zone left behind unmounts — assetCache then frees its GPU
 * resources after a short grace period.
 */
import { useEffect } from 'react';
import { LAB_ZONES, type LabZoneId } from '@/data/lab/zones';
import { loadPlan } from '@/lib/lab/navigation';
import { modelLevels } from '@/lib/three/modelUrls';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useLabStore } from '@/store/labStore';
import { LabCamera } from './LabCamera';
import { LabLighting } from './LabLighting';
import { LabRoom } from './LabRoom';
import { Classroom } from './classroom/Classroom';
import { RobotTeacher } from './classroom/RobotTeacher';
import { ZoneStage } from './ZoneStage';
import { productUrl, zoneProducts } from './zones/zoneData';

const ZONE_PRODUCTS: Partial<Record<LabZoneId, string[]>> = zoneProducts();
const fetched = new Set<string>();

/** Warm the HTTP cache with the files a neighbouring zone will need at this quality. */
function usePrefetchNeighbours() {
  const focus = useLabStore((s) => s.focus);
  const lodBias = useQualityPreset().lodBias;
  useEffect(() => {
    const { prefetch } = loadPlan(focus);
    if (!prefetch.length) return;
    let cancelled = false;
    const run = () => {
      for (const zone of prefetch) {
        for (const id of ZONE_PRODUCTS[zone] ?? []) {
          const url = modelLevels(productUrl(id), lodBias).near;
          if (cancelled || fetched.has(url)) continue;
          fetched.add(url);
          // low priority, after the focused zone: never competes with what is on screen
          void fetch(url, { priority: 'low' } as RequestInit).catch(() => fetched.delete(url));
        }
      }
    };
    const timer = window.setTimeout(() => (window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 4000 }) : run()), 3000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [focus, lodBias]);
}

export default function LabScene() {
  const focus = useLabStore((s) => s.focus);
  usePrefetchNeighbours();
  return (
    <>
      <LabLighting />
      <LabCamera />
      <LabRoom />
      <Classroom />
      <RobotTeacher />
      {LAB_ZONES.map((z) => (
        <ZoneStage key={z.id} zone={z} focused={focus === z.id} />
      ))}
    </>
  );
}
