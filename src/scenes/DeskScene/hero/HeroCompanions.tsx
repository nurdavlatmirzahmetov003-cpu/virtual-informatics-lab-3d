/**
 * Life around the home desk (V4 §2.3): a little Bit on the desk who waves
 * hello every few seconds, and a presenter robot in a BitLab shirt left of
 * the desk who points at each new setup as it lands and says what it is in
 * a speech bubble (kk / ru / en). Both come from the lab's robot kit, so they
 * cost a handful of draw calls; reduced motion keeps them still, in pose.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, type Group, type MeshBasicMaterial } from 'three';
import { useReducedMotion } from '@/hooks/useMediaQuery';
import { useT } from '@/hooks/useT';
import { canvasFontsReady, FONT_HERO, FONT_SANS } from '@/lib/fonts';
import { Robot, type RobotParts } from '@/scenes/LabSpace/robots/Robot';
import { DESK_BIT, PRESENTER } from '../layout';
import { HERO_ORDER, HERO_TIMING, heroPresence } from './heroCycle';
import { HERO_LOOKS } from './looks';
import { presenterLine } from './presenter';


/** Waves for 1.8 s out of every 5.5 s; the rest of the time the arm hangs relaxed. */
const WAVE = { every: 5.5, length: 1.8 };

const smooth = (x: number) => x * x * (3 - 2 * x);

function waveBit(p: RobotParts, time: number) {
  if (!p.arm) return;
  const t = time % WAVE.every;
  // up in 0.3 s, three waves, down in 0.3 s
  const up = t < WAVE.length ? smooth(Math.min(1, t / 0.3, (WAVE.length - t) / 0.3)) : 0;
  p.arm.rotation.z = 0.15 + up * (2.35 + 0.35 * Math.sin((t - 0.3) * 10));
  if (p.head) p.head.rotation.z = up * 0.12 * Math.sin((t - 0.3) * 5);
  // a little hop while idle (robot units: the desk group carries height and scale)
  p.root.position.y = Math.abs(Math.sin(time * 2.2)) * 0.012 * (1 - up);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const BUBBLE = { w: 1024, h: 340, size: [0.66, 0.22] as const };

/** The presenter's speech bubble: a canvas texture redrawn when the look or the language changes. */
function SpeechBubble({ text, title, visible }: { text: string; title: string; visible: () => number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = BUBBLE.w;
    canvas.height = BUBBLE.h;
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => {
    let live = true;
    const draw = () => {
      if (!live) return;
      const canvas = texture.image as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { w, h } = BUBBLE;
      ctx.clearRect(0, 0, w, h);
      // rounded card with a tail pointing down-left, to the presenter's head
      ctx.fillStyle = 'rgba(255,255,255,0.97)';
      ctx.strokeStyle = '#5f7bff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, h - 70, 46);
      ctx.moveTo(120, h - 64);
      ctx.lineTo(96, h - 10);
      ctx.lineTo(190, h - 64);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#5f7bff';
      ctx.font = `700 40px ${FONT_HERO}`;
      ctx.fillText(title, 52, 74);
      ctx.fillStyle = '#141a33';
      ctx.font = `600 46px ${FONT_SANS}`;
      wrap(ctx, text, w - 104)
        .slice(0, 3)
        .forEach((line, i) => ctx.fillText(line, 52, 140 + i * 56));
      texture.needsUpdate = true;
    };
    draw();
    // the web fonts may arrive after the first draw
    canvasFontsReady().then(draw);
    return () => {
      live = false;
    };
  }, [texture, text, title]);
  const material = useRef<MeshBasicMaterial>(null);
  const group = useRef<Group>(null);
  useFrame(() => {
    const a = visible();
    if (material.current) material.current.opacity = a;
    if (group.current) {
      group.current.visible = a > 0.01;
      group.current.scale.setScalar(0.85 + 0.15 * a);
    }
  });
  return (
    <group ref={group}>
      <mesh position={[BUBBLE.size[0] / 2 - 0.08, 0, 0]}>
        <planeGeometry args={[...BUBBLE.size]} />
        <meshBasicMaterial ref={material} map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

const arrived = HERO_TIMING.stagger * (HERO_ORDER.length - 1) + HERO_TIMING.fly;

export function HeroCompanions({ look: lookIndex }: { look: number }) {
  const t = useT();
  const reduced = useReducedMotion();
  // the presenter's gesture clock restarts whenever a new look lands
  const gesture = useRef({ look: -1, since: 0 });
  const look = HERO_LOOKS[lookIndex] ?? HERO_LOOKS[0];
  const text = useMemo(() => presenterLine(t, look), [t, look]);

  const presenter = (p: RobotParts, time: number) => {
    const g = gesture.current;
    if (g.look !== heroPresence.look || !heroPresence.ready) {
      g.look = heroPresence.ready ? heroPresence.look : -1;
      g.since = time;
    }
    const s = time - g.since;
    const here = g.look >= 0 && heroPresence.away < 0.5;
    // point at the desk once the setup is in, then explain with small beats (still: just the pointing pose)
    const point = reduced ? 1 : here ? smooth(Math.min(1, Math.max(0, (s - arrived * 0.6) / 0.6))) * (s < arrived + 3.2 ? 1 : 0.35) : 0;
    const beat = !reduced && here && s > arrived + 3.2 ? 0.18 * Math.sin(s * 2.4) : 0;
    const k = reduced ? 1 : 0.1;
    if (p.arm) {
      const goal = 0.08 + point * 1.25 + beat;
      p.arm.rotation.z += (goal - p.arm.rotation.z) * k;
      p.arm.rotation.x += (-point * 0.45 - p.arm.rotation.x) * k;
    }
    if (p.head) {
      // looks at the desk while pointing, back at the visitor while talking
      const goal = reduced ? 0.3 : point > 0.5 && s < arrived + 3.2 ? 0.55 : 0.12 * Math.sin(time * 0.7);
      p.head.rotation.y += (goal - p.head.rotation.y) * (reduced ? 1 : 0.06);
    }
    p.root.position.y = reduced ? 0 : 0.006 * Math.sin(time * 1.5);
  };

  // the bubble shows while the look holds on the desk and the story has not started
  const bubbleOn = () => (heroPresence.ready && heroPresence.away < 0.3 && (reduced || gesture.current.look === heroPresence.look) ? 1 - heroPresence.away / 0.3 : 0);

  return (
    <>
      <group position={[...DESK_BIT.position]} rotation-y={DESK_BIT.yaw} scale={DESK_BIT.scale}>
        {/* reduced motion: a still "hello", the arm up mid-wave */}
        <Robot kind="bit" accent="#5f7bff" glow="#56dbf8" animate={waveBit} stillAt={0.9} name="desk-bit" />
      </group>
      <group position={[...PRESENTER.position]} rotation-y={PRESENTER.yaw} scale={PRESENTER.scale}>
        <Robot kind="presenter" accent="#5f7bff" animate={presenter} stillAt={0} name="hero-presenter" />
        <Billboard position={[0.05, 1.85, 0]}>
          <SpeechBubble text={text} title={t('home.decor.presenterName')} visible={bubbleOn} />
        </Billboard>
      </group>
    </>
  );
}
