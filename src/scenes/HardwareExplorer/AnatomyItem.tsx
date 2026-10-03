import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Color, type Group } from 'three';
import { ModelLoader } from '@/components/3d/ModelLoader';
import styles from '@/components/3d/Hotspot.module.css';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import type { TranslationKey } from '@/lib/i18n';
import { captureMaterials, restoreMaterials, type MatRecord } from '@/lib/three/materialFx';
import { useAnatomyStore } from '@/store/anatomyStore';
import { useSceneStatus } from '@/store/sceneStatusStore';
import { modelUrl, type AnatomyModel, type AnatomyPlacement } from './layout';
import { PLACEHOLDER_MODELS } from './placeholderModels';
import { shadowRequest } from './shadowRequest';

const HIGHLIGHT = new Color('#38d6f5');
const tint = new Color();
const DIM = 0.7; // how much non-selected devices darken

function SpinningModel({ model }: { model: AnatomyModel }) {
  const rotor = useRef<Group>(null);
  const reduced = useReducedMotion();
  useFrame((_, delta) => {
    if (rotor.current && !reduced) rotor.current.rotation.y -= Math.min(delta, 0.05) * 7;
  });
  return (
    <group ref={rotor} position={model.position ? [...model.position] : undefined}>
      <ModelLoader url={modelUrl(model.file)} fit={model.fit} castShadow={false} />
    </group>
  );
}

function MonitorModel({ model }: { model: AnatomyModel }) {
  const wallpaper = useMonitorWallpaper();
  return <ModelLoader url={modelUrl(model.file)} fit={model.fit} onLoaded={wallpaper} />;
}

function ItemModel({ model }: { model: AnatomyModel }) {
  if (model.spin) return <SpinningModel model={model} />;
  if (model.file === 'monitor_ultrawide') return <MonitorModel model={model} />;
  return (
    <ModelLoader
      url={modelUrl(model.file)}
      fit={model.fit}
      position={model.position ? [...model.position] : undefined}
      rotation-y={model.rotationY ?? 0}
    />
  );
}

/**
 * One device on the anatomy desk: hover highlight, click to focus, dims when
 * another device is selected, numbered hotspot while the overview is shown.
 */
export function AnatomyItem({ placement, index }: { placement: AnatomyPlacement; index: number }) {
  const t = useT();
  const { id, models, magnify = 1 } = placement;
  const group = useRef<Group>(null);
  const records = useRef<MatRecord[]>([]);
  const assetVersion = useRef(-1);
  const metadata = useMemo(() => ({ pcPart: true, assetVersion: 0 }), []);
  const fx = useRef({ hi: 0, dim: 0 });
  const overview = useAnatomyStore((s) => s.selected === null);
  // Html hotspots own a React root: mount them only after the scene's Suspense
  // resolved, so a suspension never unmounts them mid-render.
  const ready = useSceneStatus((s) => s.ready);
  const hovered = useAnatomyStore((s) => s.hovered === id);
  const { select, hover } = useAnatomyStore.getState();
  const Placeholder = PLACEHOLDER_MODELS[id];

  useEffect(() => {
    const list = records;
    return () => restoreMaterials(list.current);
  }, []);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // GLBs resolve after this wrapper mounts: re-record their materials once loaded.
    const newlyLoaded = assetVersion.current !== g.userData.assetVersion;
    if (newlyLoaded) {
      restoreMaterials(records.current);
      records.current = captureMaterials(g);
      assetVersion.current = g.userData.assetVersion;
      fx.current = { hi: 0, dim: 0 };
      shadowRequest.until = performance.now() + 400;
    }
    const { selected, hovered: hoveredId } = useAnatomyStore.getState();
    const goalHi = hoveredId === id ? 1 : selected === id ? 0.35 : 0;
    const goalDim = selected && selected !== id ? 1 : 0;
    const s = fx.current;
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 8);
    const hi = s.hi + (goalHi - s.hi) * k;
    const dim = s.dim + (goalDim - s.dim) * k;
    if (!newlyLoaded && Math.abs(hi - s.hi) < 1e-4 && Math.abs(dim - s.dim) < 1e-4) return; // settled
    s.hi = hi;
    s.dim = dim;
    const shade = 1 - DIM * dim;
    for (const r of records.current) {
      r.mat.color.copy(r.color).multiplyScalar(shade);
      r.mat.envMapIntensity = r.env * shade;
      r.mat.emissive.copy(r.emissive).multiplyScalar(shade).add(tint.copy(HIGHLIGHT).multiplyScalar(0.08 * hi));
    }
  });

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(id);
  };
  const name = t(`anatomy.items.${id}.name` as TranslationKey);

  return (
    <group position={[...placement.position]} rotation-y={placement.rotationY ?? 0}>
      <group
        ref={group}
        scale={magnify}
        userData={metadata}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          hover(id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hover(null);
          document.body.style.cursor = '';
        }}
      >
        <Suspense fallback={null}>
          {models ? models.map((m) => <ItemModel key={m.file} model={m} />) : Placeholder && <Placeholder />}
        </Suspense>
      </group>
      {overview && ready && (
        <Html position={[0, (placement.hotspotY ?? placement.height + 0.03 / magnify) * magnify, 0]} center zIndexRange={[5, 0]} className={styles.anchor}>
          <button
            type="button"
            className={styles.hotspot}
            data-active={hovered}
            aria-label={name}
            onClick={() => select(id)}
            onPointerEnter={() => hover(id)}
            onPointerLeave={() => hover(null)}
          >
            <span className={styles.index}>{index + 1}</span>
            <span className={styles.label}>{name}</span>
          </button>
        </Html>
      )}
    </group>
  );
}
