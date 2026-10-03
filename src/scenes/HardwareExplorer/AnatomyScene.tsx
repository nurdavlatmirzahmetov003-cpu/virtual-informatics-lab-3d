/**
 * Computer Anatomy scene: the hero desk reused as a display table. External
 * devices stand in their usual places; internal parts lie on a bench mat.
 * Only the active category is mounted; GLBs come from the shared cache.
 */
import { useEffect } from 'react';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { useDisposable } from '@/hooks/useDisposable';
import { roundedSlab } from '@/lib/three/geometry';
import { preloadModel } from '@/lib/three/loaders';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { DeskMat } from '@/scenes/DeskScene/models/DeskMat';
import { Room } from '@/scenes/DeskScene/models/Room';
import { DESK_TOP } from '@/scenes/DeskScene/layout';
import { useAnatomyStore } from '@/store/anatomyStore';
import { AnatomyCamera } from './AnatomyCamera';
import { AnatomyItem } from './AnatomyItem';
import { AnatomyShadows } from './AnatomyShadows';
import { BENCH, modelUrl, PLACEMENTS } from './layout';

/** Poly Haven "Studio Small 09" (CC0) — reflections only. */
const HDRI = `${import.meta.env.BASE_URL}assets/hdr/studio_small_09_1k.hdr`;

/** Anti-static work mat the internal parts are laid out on. */
function BenchMat() {
  const geo = useDisposable(() => roundedSlab(BENCH.size[0], BENCH.thickness, BENCH.size[1], 0.02, 0.0012), []);
  return (
    <mesh geometry={geo} position={[0, DESK_TOP, BENCH.z]} receiveShadow>
      <meshStandardMaterial color="#26333b" metalness={0} roughness={0.88} />
    </mesh>
  );
}

export default function AnatomyScene() {
  const category = useAnatomyStore((s) => s.category);

  // warm the other category's models once the first view is up
  useEffect(() => {
    const id = window.setTimeout(() => {
      Object.values(PLACEMENTS)
        .flat()
        .forEach((p) => p.models?.forEach((m) => preloadModel(modelUrl(m.file))));
    }, 2500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <EnvironmentLighting hdri={HDRI} environmentIntensity={0.6} intensity={1} shadowExtent={1.25} fog={[3.5, 11]} />
      <AnatomyCamera />
      <AnatomyShadows />
      <Room />
      <Desk />
      {category === 'external' ? <DeskMat /> : <BenchMat />}
      {PLACEMENTS[category].map((p, i) => (
        <AnatomyItem key={p.id} placement={p} index={i} />
      ))}
    </>
  );
}
