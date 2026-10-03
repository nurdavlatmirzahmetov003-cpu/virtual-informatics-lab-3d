/**
 * Cinematic home scene: studio-lit desk setup driven by the scroll story.
 * All hardware models are interim procedural builds — see TODO.md
 * ([PLACEHOLDER] entries) for the GLB replacements.
 */
import { useEffect } from 'react';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EnvironmentLighting } from '@/components/3d/EnvironmentLighting';
import { sceneFocus } from '@/lib/three/sceneFocus';
import { Desk } from './models/Desk';
import { DeskMat } from './models/DeskMat';
import { Headset } from './models/Headset';
import { Keyboard } from './models/Keyboard';
import { Monitor } from './models/Monitor';
import { Mouse } from './models/Mouse';
import { PCCase } from './models/PCCase';
import { Room } from './models/Room';
import { Speakers } from './models/Speakers';
import { StoryCamera } from './StoryCamera';

RectAreaLightUniformsLib.init();

/** Poly Haven "Studio Small 09" (CC0) — reflections only, never shown as background. */
const HDRI = `${import.meta.env.BASE_URL}assets/hdr/studio_small_09_1k.hdr`;

export default function DeskScene() {
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
      <Room />
      <Desk />
      <DeskMat />
      <Monitor />
      <Keyboard />
      <Mouse />
      <Speakers />
      <Headset />
      <PCCase />
    </>
  );
}
