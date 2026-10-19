/**
 * Zone 10 — the BitLab presentation stage (0.37): a low stage, a truss with a
 * big screen and two presenter robots in BitLab hoodies.
 * The slides cycle on their own; while the zone is open the robots present
 * the site with Bit's voice (site language), the screen following the voice.
 */
import { useEffect, useMemo, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { RoundedBox } from '@react-three/drei';
import type { TranslationKey } from '@/lib/i18n';
import { useCanvasFonts } from '@/hooks/useCanvasFonts';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { useLabStore } from '@/store/labStore';
import { bitVoice, useVoiceStore } from '@/services/bit/voice';
import { Robot, type RobotParts } from '../robots/Robot';
import { signage } from '../visibilityAudit';
import { drawSlide, SLIDE_COUNT, type Slide } from './stageSlides';
import type { ZoneContentProps } from './zoneData';

const RISER = { w: 2.7, d: 1.15, h: 0.3, z: -0.3 } as const;
const SCREEN = { w: 2.4, h: 1.35, y: 1.25, z: -0.82 } as const;
const SLIDE_SECONDS = 7;
const OWNER = 'lab-stage';
const k = (s: string) => s as TranslationKey;

function useSlides(): Slide[] {
  const t = useT();
  return useMemo(() => Array.from({ length: SLIDE_COUNT }, (_, i) => ({ title: t(k(`lab.stage.slides.s${i + 1}.title`)), body: t(k(`lab.stage.slides.s${i + 1}.body`)) })), [t]);
}

/** The screen: one canvas, redrawn when the slide (or the language, or the fonts) changes. */
function Screen({ index, slides, sharp }: { index: number; slides: Slide[]; sharp: boolean }) {
  const t = useT();
  const fonts = useCanvasFonts();
  const tex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = sharp ? 2048 : 1024;
    c.height = sharp ? 1152 : 576;
    const texture = new CanvasTexture(c);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [sharp]);
  useEffect(() => () => tex.dispose(), [tex]);
  useEffect(() => {
    drawSlide(tex.image as HTMLCanvasElement, index, slides[index], t('lab.stage.eyebrow'));
    tex.needsUpdate = true;
  }, [tex, index, slides, t, fonts]);
  return (
    <mesh position={[0, SCREEN.y, SCREEN.z + 0.035]} userData={signage('stage-screen')}>
      <planeGeometry args={[SCREEN.w, SCREEN.h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export function StageZone({ detail, accent }: ZoneContentProps) {
  const full = detail === 'full';
  const slides = useSlides();
  const light = useTheme() === 'light';
  const bigTextures = useQualityPreset().maxTextureSize >= 2048;
  const sharp = full && bigTextures;
  const focused = useLabStore((s) => s.focus === 'stage');
  const [index, setIndex] = useState(0);
  // read every frame by the robots: plain mutable state, not React state
  const live = useMemo(() => ({ narrating: false, speaker: 0 }), []);

  // silent slideshow
  useEffect(() => {
    if (live.narrating) return;
    const id = window.setInterval(() => {
      if (!live.narrating) setIndex((i) => (i + 1) % SLIDE_COUNT);
    }, SLIDE_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [live]);

  // the presentation: each slide read aloud, the screen follows the voice
  useEffect(() => {
    if (!full || !focused) return;
    live.narrating = true;
    bitVoice.stop();
    useVoiceStore.setState({ owner: OWNER });
    bitVoice.sayEach(
      slides.map((s) => `${s.title} ${s.body}`),
      (i) => {
        live.speaker = i % 2;
        setIndex(i);
        useVoiceStore.setState({ owner: OWNER });
      },
    );
    const off = bitVoice.onIdle(() => {
      live.narrating = false;
    });
    return () => {
      off();
      // leaving the stage ends the talk (other voices are not ours to stop)
      if (useVoiceStore.getState().owner === OWNER) bitVoice.stop();
      live.narrating = false;
    };
  }, [full, focused, slides, live]);

  const talking = (who: number) => () => live.narrating && live.speaker === who && useVoiceStore.getState().speaking;
  // the speaking presenter turns to the screen and points at it; the other looks at the visitors
  const animate = (who: number) => (p: RobotParts, time: number) => {
    const speaking = talking(who)();
    if (p.arm) {
      const goal = speaking ? -1.9 + 0.12 * Math.sin(time * 2.2) : 0.1;
      p.arm.rotation.z += ((who === 0 ? -goal : goal) - p.arm.rotation.z) * 0.08;
    }
    if (p.head) {
      const goal = speaking ? (who === 0 ? -0.55 : 0.55) : 0.15 * Math.sin(time * 0.6 + who);
      p.head.rotation.y += (goal - p.head.rotation.y) * 0.06;
    }
    p.root.position.y = RISER.h + 0.012 * Math.sin(time * 1.4 + who * 1.7);
  };

  const truss = light ? '#c4ccd8' : '#2a303d';
  return (
    <group>
      {/* stage */}
      <RoundedBox name="stage-riser" args={[RISER.w, RISER.h, RISER.d]} radius={0.03} position={[0, RISER.h / 2, RISER.z]} castShadow receiveShadow>
        <meshStandardMaterial color={light ? '#eef1f7' : '#1d2333'} roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, RISER.h - 0.002, RISER.z + RISER.d / 2 + 0.002]}>
        <boxGeometry args={[RISER.w - 0.02, 0.02, 0.006]} />
        <meshBasicMaterial color={accent} toneMapped={false} />
      </mesh>
      {/* truss: two posts and a header beam, the screen between them */}
      {[-1, 1].map((s) => (
        <mesh key={s} name="stage-truss" position={[s * (SCREEN.w / 2 + 0.12), 1.15, SCREEN.z]} castShadow>
          <boxGeometry args={[0.08, 2.3, 0.08]} />
          <meshStandardMaterial color={truss} metalness={0.6} roughness={0.35} />
        </mesh>
      ))}
      <mesh name="stage-header" position={[0, 2.3, SCREEN.z]} castShadow>
        <boxGeometry args={[SCREEN.w + 0.32, 0.1, 0.1]} />
        <meshStandardMaterial color={truss} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh name="stage-screen-frame" position={[0, SCREEN.y, SCREEN.z]}>
        <boxGeometry args={[SCREEN.w + 0.06, SCREEN.h + 0.06, 0.06]} />
        <meshStandardMaterial color="#0b0e16" roughness={0.4} metalness={0.3} />
      </mesh>
      <Screen index={index} slides={slides} sharp={sharp} />
      {/* the presenters */}
      {/* at the front corners of the stage: outside the screen as seen from the audience */}
      <Robot kind="presenter" accent="#5f7bff" position={[-1.15, RISER.h, RISER.z + RISER.d / 2 - 0.2]} yaw={0.35} animate={animate(0)} speaking={talking(0)} name="presenter-left" />
      <Robot kind="presenter" accent="#a95cf5" glow="#ffb35c" position={[1.15, RISER.h, RISER.z + RISER.d / 2 - 0.2]} yaw={-0.35} animate={animate(1)} speaking={talking(1)} name="presenter-right" />
    </group>
  );
}

