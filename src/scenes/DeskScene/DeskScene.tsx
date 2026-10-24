/**
 * Cinematic home scene: studio-lit desk setup driven by the scroll story.
 * The opening shot is the living hero (hero/LivingSetup): setups assemble and
 * swap until the story starts, then the story's devices take the desk.
 * All hardware models are interim procedural builds — see TODO.md
 * ([PLACEHOLDER] entries) for the GLB replacements.
 */
import { useEffect, useState } from 'react';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { sceneFocus } from '@/lib/three/sceneFocus';
import { Desk } from './models/Desk';
import { DeskMat } from './models/DeskMat';
import { Headset, Keyboard, Monitor, Mouse, Speakers } from './models/HardwareDevices';
import { PCCase } from './pc/PCCase';
import { Room } from './models/Room';
import { usePcStore } from '@/store/pcStore';
import { showcaseBuild } from '@/lib/studio/showcase';
import { ExploreCamera } from './ExploreCamera';
import { ShadowSync } from './ShadowSync';
import { StoryCamera } from './StoryCamera';
import { LivingSetup } from './hero/LivingSetup';
import { HERO_LOOKS } from './hero/looks';
import { StoryDevices } from './hero/StoryDevices';
import { Decor } from './models/Decor';

RectAreaLightUniformsLib.init();

/** Poly Haven "Studio Small 09" (CC0) — reflections only, never shown as background. */
const HDRI = `${import.meta.env.BASE_URL}assets/hdr/studio_small_09_1k.hdr`;

export default function DeskScene() {
  const exploring = usePcStore((s) => s.mode === 'explore');
  const [look, setLook] = useState(0);

  useEffect(() => {
    sceneFocus.enabled = true;
    return () => {
      sceneFocus.enabled = false;
    };
  }, []);

  return (
    <>
      <EnvironmentLighting hdri={HDRI} environmentIntensity={0.55} intensity={1} shadowExtent={1.25} fog={[3.5, 11]} />
      <StoryCamera />
      {exploring && <ExploreCamera />}
      <ShadowSync />
      <Room />
      <Desk surface={HERO_LOOKS[look].desk} />
      <Decor />
      <LivingSetup onLook={setLook} />
      <StoryDevices>
        <DeskMat />
        <Monitor />
        <Keyboard />
        <Mouse />
        <Speakers />
        <Headset />
        <PCCase deferDetail build={showcaseBuild()} />
      </StoryDevices>
    </>
  );
}
