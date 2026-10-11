/**
 * Workstation and showcase zones. Full detail mounts the
 * catalog models; the preview (overview) shows furniture plus at most two
 * lightest-level models.
 */
import { useMemo } from 'react';
import { resolveBuild, type ResolvedBuild } from '@/lib/studio/build';
import { showcaseBuild } from '@/lib/studio/showcase';
import { isTieredModel } from '@/lib/three/modelUrls';
import { useStudioStore } from '@/store/studioStore';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { DeskMat } from '@/scenes/DeskScene/models/DeskMat';
import { MONITOR, PC } from '@/scenes/DeskScene/layout';
import { ProductDesk } from '@/scenes/SetupStudio/ProductDesk';
import { SetupItems } from '@/scenes/SetupStudio/SetupItems';
import { Pedestal, Turntable } from '../furniture';
import { Product } from './common';
import { SHOWCASE, tieredId as tiered, type ZoneContentProps } from './zoneData';

/** The student's Setup Studio build if it has a PC and a monitor, else the showcase build. */
function useWorkstationBuild(): ResolvedBuild {
  const ids = useStudioStore((s) => s.build);
  return useMemo(() => {
    const own = resolveBuild(ids);
    return own.case && own.monitor ? own : showcaseBuild();
  }, [ids]);
}

export function WorkstationZone({ detail }: ZoneContentProps) {
  const build = useWorkstationBuild();
  const finish = useStudioStore((s) => s.finish);
  if (detail === 'preview') {
    const monitor = tiered(build.monitor?.modelPath);
    const pcCase = tiered(build.case?.modelPath);
    return (
      <>
        <Desk />
        <DeskMat />
        {monitor && <Product product={monitor} lightOnly position={[...MONITOR.position]} />}
        {pcCase && <Product product={pcCase} lightOnly position={[PC.position[0], PC.position[1] + PC.feet, PC.position[2]]} />}
      </>
    );
  }
  return (
    <>
      {build.desk && isTieredModel(build.desk.modelPath) ? <ProductDesk key={build.desk.id} product={build.desk} surface={finish.desk} /> : <Desk surface={finish.desk} />}
      <SetupItems build={build} finish={finish} />
    </>
  );
}

/** Showcase: three pedestals round a turntable carrying the hero case. */
export function ShowcaseZone({ detail, accent }: ZoneContentProps) {
  const light = detail === 'preview';
  return (
    <>
      <Pedestal height={0.42} radius={0.75} accent={accent}>
        <Turntable>
          <Product product={SHOWCASE.case} lightOnly={light} rotation-y={-0.5} />
        </Turntable>
      </Pedestal>
      <group position={[-1.25, 0, 0.55]} rotation-y={0.5}>
        <Pedestal height={0.75} radius={0.36} accent={accent}>
          <Product product={SHOWCASE.monitor} lightOnly={light} />
        </Pedestal>
      </group>
      {!light && (
        <>
          <group position={[1.3, 0, 0.5]} rotation-y={-0.6}>
            <Product product={SHOWCASE.chair} />
          </group>
          <group position={[-1.2, 0, -0.75]} rotation-y={0.9}>
            <Pedestal height={0.95} radius={0.3} accent={accent}>
              <Product product={SHOWCASE.keyboard} rotation-x={0.15} />
            </Pedestal>
          </group>
          <group position={[1.15, 0, -0.8]} rotation-y={-0.9}>
            <Pedestal height={0.95} radius={0.28} accent={accent}>
              <Product product={SHOWCASE.headset} />
            </Pedestal>
          </group>
        </>
      )}
    </>
  );
}
