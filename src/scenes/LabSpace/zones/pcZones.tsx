/**
 * Workstation, PC build bench and showcase zones. Full detail mounts the
 * catalog models; the preview (overview) shows furniture plus at most two
 * lightest-level models.
 */
import { useMemo } from 'react';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { RoundedBox } from '@react-three/drei';
import { resolveBuild, type ResolvedBuild } from '@/lib/studio/build';
import { showcaseBuild } from '@/lib/studio/showcase';
import { isTieredModel } from '@/lib/three/modelUrls';
import { useStudioStore } from '@/store/studioStore';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { DeskMat } from '@/scenes/DeskScene/models/DeskMat';
import { MONITOR, PC } from '@/scenes/DeskScene/layout';
import { HardwarePart } from '@/scenes/DeskScene/pc/HardwareParts';
import { BOARD_PARTS, boardOffset } from '@/scenes/AssemblyLab/layout';
import { ProductDesk } from '@/scenes/SetupStudio/ProductDesk';
import { SetupItems } from '@/scenes/SetupStudio/SetupItems';
import type { PartId } from '@/scenes/DeskScene/pc/parts';
import { Pedestal, Table, Turntable } from '../furniture';
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

const TABLE_H = 0.78;
const MAT_T = 0.004;
/** Board lying component side up (the PC Assembly Lab bench pose). */
const FLAT = [0, 0, -Math.PI / 2] as const;
/** A graphics card lying fans up, length along X. */
const GPU_FLAT = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(new Vector3(0, 0, 1), new Vector3(0, -1, 0), new Vector3(1, 0, 0)));
const productOf = (build: ResolvedBuild, id: PartId) => build[id === 'cooler' ? 'cooling' : id === 'fans' ? 'case' : id];

export function AssemblyZone({ detail, accent }: ZoneContentProps) {
  const build = showcaseBuild();
  const pcCase = tiered(build.case?.modelPath);
  return (
    <>
      <Table width={2.1} depth={0.95} height={TABLE_H}>
        {/* anti-static mat with an accent edge */}
        <RoundedBox args={[1.5, MAT_T, 0.72]} radius={0.002} position={[-0.18, MAT_T / 2, 0.02]} receiveShadow>
          <meshStandardMaterial color="#26333b" roughness={0.9} />
        </RoundedBox>
        <mesh position={[-0.18, MAT_T + 0.0005, 0.385]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[1.5, 0.012]} />
          <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        {detail === 'full' && (
          <>
            <group position={[-0.5, MAT_T, 0.04]} rotation={[...FLAT]}>
              <HardwarePart id="motherboard" fallback={null} product={build.motherboard} />
              {BOARD_PARTS.map((p) => (
                <group key={p} position={boardOffset(p)}>
                  <HardwarePart id={p} fallback={null} product={productOf(build, p)} />
                </group>
              ))}
            </group>
            <group position={[0.06, MAT_T + 0.021, 0.1]} quaternion={GPU_FLAT}>
              <HardwarePart id="gpu" fallback={null} product={build.gpu} />
            </group>
            <group position={[0.33, MAT_T + 0.044, -0.2]} rotation-y={-0.35}>
              <HardwarePart id="psu" fallback={null} product={build.psu} />
            </group>
          </>
        )}
      </Table>
      {/* empty case beside the bench, open side towards the visitor */}
      {pcCase && <Product product={pcCase} lightOnly={detail === 'preview'} position={[1.38, 0, -0.15]} rotation-y={Math.PI / 2 - 0.35} />}
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
