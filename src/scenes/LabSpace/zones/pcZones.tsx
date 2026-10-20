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
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { SetupItems } from '@/scenes/SetupStudio/SetupItems';
import { Pedestal, Turntable } from '../furniture';
import { Product } from './common';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { CATALOG_BY_ID } from '@/data/hardware/catalog';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import { FONT_HERO, FONT_SANS } from '@/lib/fonts';
import { sk } from '@/pages/SetupStudio/studioText';
import { signage } from '../visibilityAudit';
import { SHOWCASE, SHOWCASE_PEDESTALS, tieredId as tiered, type ZoneContentProps } from './zoneData';

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

/** The showcase monitor, with the wallpaper on its screen. */
function ShowcaseMonitor({ light }: { light: boolean }) {
  const onLoaded = useMonitorWallpaper();
  return <Product product={SHOWCASE.monitor} lightOnly={light} onLoaded={onLoaded} />;
}

/** A name plate on a showcase pedestal: brand, model, category and price. */
function ShowcasePlate({ id, accent }: { id: string; accent: string }) {
  const t = useT();
  const fonts = useCanvasFonts();
  const item = CATALOG_BY_ID.get(id);
  const tex = useDisposable(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 192;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(10,14,26,0.92)';
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 192, 28);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 10, 192);
    if (item) {
      ctx.fillStyle = '#9fb0c8';
      ctx.font = `600 30px ${FONT_SANS}`;
      ctx.fillText(`${item.brand} · ${t(sk(`categories.${item.category}`))}`, 34, 52);
      ctx.fillStyle = '#f1f5fb';
      ctx.font = `700 46px ${FONT_HERO}`;
      ctx.fillText(item.model.replace(/\s*\(.*\)$/, ''), 34, 112, 450);
      ctx.fillStyle = accent;
      ctx.font = `700 34px ${FONT_SANS}`;
      ctx.fillText(`${item.priceKZT.toLocaleString('ru-RU').replace(/,/g, ' ')} ₸`, 34, 164);
    }
    const tx = new CanvasTexture(c);
    tx.colorSpace = SRGBColorSpace;
    tx.anisotropy = 8;
    return tx;
  }, [id, accent, t, fonts]);
  return (
    <mesh rotation-x={-0.5} userData={signage(`showcase-plate:${id}`)}>
      <planeGeometry args={[0.36, 0.135]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

/** Showcase: the case on a big turntable in the middle, the best models on turntables round it, each with its plate. */
export function ShowcaseZone({ detail, accent }: ZoneContentProps) {
  const light = detail === 'preview';
  return (
    <>
      <group position={[0, 0, -0.3]}>
        <Pedestal height={0.42} radius={0.75} accent={accent}>
          <Turntable>
            <Product product={SHOWCASE.case} lightOnly={light} rotation-y={-0.5} />
          </Turntable>
        </Pedestal>
        {!light && (
          <group position={[0, 0.3, 0.78]}>
            <ShowcasePlate id={SHOWCASE.case} accent={accent} />
          </group>
        )}
      </group>
      {SHOWCASE_PEDESTALS.map((p, i) =>
        light && i > 0 ? null : (
          <group key={p.product} position={[p.at[0], 0, p.at[1]]} rotation-y={p.yaw}>
            <Pedestal height={p.height} radius={p.radius} accent={accent}>
              <Turntable speed={0.25 + i * 0.03}>{p.product === SHOWCASE.monitor ? <ShowcaseMonitor light={light} /> : <Product product={p.product} lightOnly={light} />}</Turntable>
            </Pedestal>
            {!light && (
              <group position={[0, p.height * 0.62, p.radius + 0.02]}>
                <ShowcasePlate id={p.product} accent={accent} />
              </group>
            )}
          </group>
        ),
      )}
    </>
  );
}
