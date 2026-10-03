/**
 * Setup Studio scene: the hero desk and room, populated from the studio
 * store. Every product change swaps / rescales its model at once; colour
 * finishes repaint materials while keeping their normal / roughness maps.
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { resolveBuild } from '@/lib/studio/build';
import { Desk } from '@/scenes/DeskScene/models/Desk';
import { Room } from '@/scenes/DeskScene/models/Room';
import { useStudioStore } from '@/store/studioStore';
import { SetupItems } from './SetupItems';
import { setupChanged, STUDIO_HDRI } from './setupShared';
import { StudioCamera } from './StudioCamera';

/** Shadows are static: re-render the map only for a moment after something changed. */
const shadows = { until: 0 };
const requestShadows = (ms = 600) => {
  shadows.until = Math.max(shadows.until, performance.now() + ms);
};

function StudioShadows() {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    requestShadows(4000);
    const onChange = () => requestShadows();
    setupChanged.listeners.add(onChange);
    const unsubscribe = useStudioStore.subscribe((s, prev) => {
      if (s.build !== prev.build || s.finish !== prev.finish) requestShadows(1500);
    });
    return () => {
      setupChanged.listeners.delete(onChange);
      unsubscribe();
    };
  }, []);
  useFrame(() => {
    gl.shadowMap.autoUpdate = false;
    if (performance.now() < shadows.until) gl.shadowMap.needsUpdate = true;
  });
  return null;
}

export default function StudioScene() {
  const buildIds = useStudioStore((s) => s.build);
  const finish = useStudioStore((s) => s.finish);
  const build = useMemo(() => resolveBuild(buildIds), [buildIds]);

  return (
    <>
      <EnvironmentLighting hdri={STUDIO_HDRI} environmentIntensity={0.6} intensity={1} shadowExtent={1.5} fog={[4, 12]} />
      <StudioCamera />
      <StudioShadows />
      <Room />
      <Desk surface={finish.desk} />
      <SetupItems build={build} finish={finish} />
    </>
  );
}
