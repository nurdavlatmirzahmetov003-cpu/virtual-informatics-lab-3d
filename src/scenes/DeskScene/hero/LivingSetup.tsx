/**
 * Living home hero (0.37): while the visitor is on the opening shot, whole
 * setups assemble on the desk piece by piece, hold, and swap for the next
 * look (white → black → RGB) with other device models. As soon as the story
 * starts (scroll, 360° mode) the hero setup flies out and the story's own
 * devices — the ones the chapters describe — drop in.
 */
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { Group, Mesh, Texture } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { usePcStore } from '@/store/pcStore';
import { assemblyRig, resetAssemblyRig } from '@/scenes/SetupStudio/assembly/assemblyRig';
import { SetupItems } from '@/scenes/SetupStudio/SetupItems';
import { storyRig } from '../storyRig';
import { HERO_ORDER, HERO_TIMING, heroPresence, LOOK_SECONDS, lookAt, piecePresence } from './heroCycle';
import { HERO_LOOKS, type HeroLook } from './looks';
import { RgbAccents } from './RgbAccents';

/** Marks the look's models as loaded: rendered after them inside the same Suspense boundary. */
function Loaded({ onLoaded }: { onLoaded: () => void }) {
  useEffect(onLoaded, [onLoaded]);
  return null;
}

/**
 * One look on the desk. The next look mounts hidden while this one is shown:
 * its textures are uploaded and its shaders compiled right away, so when it
 * takes over it only becomes visible — no remount, no hitch at the swap.
 */
function LookSlot({ look, active, still, boundary, onLoaded }: { look: HeroLook; active: boolean; still: boolean; boundary: boolean; onLoaded: () => void }) {
  const group = useRef<Group>(null);
  const { gl, camera, scene } = useThree();
  const warm = useCallback(() => {
    const g = group.current;
    if (!g) return;
    g.traverse((o) => {
      const m = (o as Mesh).material;
      if (!m) return;
      for (const mat of Array.isArray(m) ? m : [m]) for (const v of Object.values(mat)) if ((v as Texture | null)?.isTexture) gl.initTexture(v as Texture);
    });
    gl.compile(g, camera, scene);
  }, [gl, camera, scene]);
  return (
    // hidden: no draw calls and no matrix updates for its few hundred nodes
    <group ref={group} visible={active} matrixWorldAutoUpdate={active}>
      {boundary ? (
        <Suspense fallback={null}>
          <SetupItems build={look.build} finish={look.finish} animated={!still} pcRig="auto" />
          <Loaded key={active ? 'shown' : 'warm'} onLoaded={active ? onLoaded : warm} />
        </Suspense>
      ) : (
        <>
          <SetupItems build={look.build} finish={look.finish} animated={!still} pcRig="auto" />
          <Loaded key={active ? 'shown' : 'warm'} onLoaded={active ? onLoaded : warm} />
        </>
      )}
    </group>
  );
}

export function LivingSetup({ onLook }: { onLook: (look: number) => void }) {
  const reduced = useReducedMotion();
  const preset = useQualityPreset();
  // phones and weak GPUs keep one look: three sets of models would not fit their memory
  const still = reduced || preset.lodBias >= 2;
  const [look, setLook] = useState(0);
  const loaded = useRef(-1);
  // the first look loads with the scene (the loader waits for it); later looks load on their own
  const [first, setFirst] = useState(true);
  const stillGroup = useRef<Group>(null);
  // ?look=black|rgb opens the hero on that look (visual checks, demos)
  const clock = useRef(Math.max(0, HERO_LOOKS.findIndex((l) => l.id === new URLSearchParams(window.location.search).get('look'))) * LOOK_SECONDS);
  const [readyLook, setReadyLook] = useState(-1);
  const onLoaded = useCallback(() => {
    loaded.current = look;
    setReadyLook(look);
  }, [look]);

  useEffect(() => {
    resetAssemblyRig(false);
    heroPresence.away = 0;
    return () => {
      heroPresence.ready = false;
      resetAssemblyRig(true);
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const s = usePcStore.getState();
    const target = s.mode === 'explore' || storyRig.heroBlend > 0.02 ? 1 : 0;
    // quick to leave (the camera is already moving), calm to come back
    const k = 1 - Math.exp(-dt * (target ? 5 : 2.5));
    heroPresence.away += (target - heroPresence.away) * k;
    if (Math.abs(target - heroPresence.away) < 0.001) heroPresence.away = target;

    const isLoaded = loaded.current === look;
    heroPresence.ready = isLoaded;
    // the clock waits for the models and stops while the story runs
    if (isLoaded && !still && heroPresence.away < 0.5) clock.current += dt;
    const arrivedAt = HERO_TIMING.stagger * (HERO_ORDER.length - 1) + HERO_TIMING.fly;
    const { look: now, t } = still ? { look: Math.floor(clock.current / LOOK_SECONDS), t: arrivedAt } : lookAt(clock.current, HERO_LOOKS.length);
    if (now !== look) {
      setFirst(false);
      loaded.current = -1;
      setLook(now);
      onLook(now);
      return;
    }
    // the hero setup leaves in the first half of the hand-over, the story's devices land in the second
    const keep = Math.max(0, 1 - heroPresence.away * 2);
    // a still setup does not fly: it is simply gone while the story runs
    if (still && stillGroup.current) stillGroup.current.visible = keep > 0.5;
    HERO_ORDER.forEach((key, i) => {
      assemblyRig.pieces[key] = isLoaded ? Math.min(piecePresence(t, i), keep) : 0;
    });
    // the screen lights up once the panel has landed, the case glows once it is in
    assemblyRig.monitorOn = Math.min(1, Math.max(0, assemblyRig.pieces.monitor - 0.6) * 2.5);
    heroPresence.look = look;
  });

  const current = HERO_LOOKS[look];
  const nextIndex = (look + 1) % HERO_LOOKS.length;
  return (
    <>
      <RgbAccents on={current.id === 'rgb'} />
      {/* the still frame is static: one monitor copy, no per-frame piece updates */}
      <group ref={stillGroup}>
        {HERO_LOOKS.map((l, i) =>
          i === look || (!still && i === nextIndex && readyLook === look) ? (
            <LookSlot key={l.id} look={l} active={i === look} still={still} boundary={!(first && i === look)} onLoaded={onLoaded} />
          ) : null,
        )}
      </group>
    </>
  );
}
