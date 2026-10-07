/**
 * The system unit: chassis + eight separately animated components.
 * Interim procedural build — see TODO.md [PLACEHOLDER] entries.
 */
import { useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, Object3D, type SpotLight } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront, fanBladesGeometry, fanFrameShape } from '@/lib/three/geometry';
import { usePcStore } from '@/store/pcStore';
import { Fan } from '../models/Fan';
import { storyRig } from '../storyRig';
import { Chassis } from './Chassis';
import { CASE_ORIGIN, FAN, FRONT_FANS } from './constants';
import { Cpu } from './Cpu';
import { CpuCooler } from './CpuCooler';
import { Gpu } from './Gpu';
import { Motherboard } from './Motherboard';
import { NvmeSsd } from './NvmeSsd';
import { PARTS, type PartId } from './parts';
import { PCPart } from './PCPart';
import { pcRig } from './pcRig';
import { Psu } from './Psu';
import { RamKit } from './RamKit';
import { usePcTextures } from './usePcTextures';
import { HardwarePart } from './HardwareParts';
import type { ResolvedBuild } from '@/lib/studio/build';

export type PcRigMode = 'auto' | 'fixed' | 'external';

/**
 * Resolves pcRig from the scroll story / explore-mode toggles (`auto`), a
 * static assembled pose (`fixed`), or leaves it to an outside driver
 * (`external`, e.g. SetupAssemblyTimeline). Must mount first.
 */
function PcRigController({ mode, hide }: { mode: PcRigMode; hide: readonly PartId[] }) {
  useFrame((_, delta) => {
    if (mode === 'external') return;
    pcRig.parts = null;
    pcRig.cables = pcRig.fanSpeed = pcRig.rgbPower = 1;
    if (pcRig.hidden.size !== hide.length || hide.some((id) => !pcRig.hidden.has(id))) pcRig.hidden = new Set(hide);
    if (mode === 'fixed') {
      // assembled, glass closed, interior lit (Setup Studio)
      pcRig.explode = 0;
      pcRig.glassOpen = 0;
      pcRig.interior = 1;
      pcRig.glow = 1;
      return;
    }
    const s = usePcStore.getState();
    if (s.mode === 'story') {
      pcRig.explode = storyRig.explode;
      pcRig.glassOpen = storyRig.glassOpen;
      pcRig.interior = storyRig.interior;
      pcRig.glow = storyRig.pcGlow;
      return;
    }
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 3.2);
    const goal = s.exploded ? 1 : 0;
    pcRig.explode += (goal - pcRig.explode) * k;
    pcRig.glassOpen += (goal - pcRig.glassOpen) * k;
    pcRig.interior += (1 - pcRig.interior) * k;
    pcRig.glow += (1 - pcRig.glow) * k;
  });
  return null;
}

const NO_PARTS: readonly PartId[] = [];

interface PCCaseProps {
  /** Who drives pcRig (default: scroll story / 360° mode). */
  rig?: PcRigMode;
  /** Parts left out of this build (e.g. no graphics card). */
  hide?: readonly PartId[];
  /** Hotspots and part clicks (hero only). */
  interactive?: boolean;
  /** RGB colour; `null` switches the lighting off. Default: the hero cyan. */
  rgbColor?: string | null;
  build?: ResolvedBuild;
  /** Home hero: the case is small on screen, so detailed part models load after the scene is ready. */
  deferDetail?: boolean;
}

export function PCCase({ rig = 'auto', hide = NO_PARTS, interactive = true, rgbColor, build, deferDetail = false }: PCCaseProps) {
  const tex = usePcTextures();
  const res = useDisposable(() => {
    const rgb = new MeshStandardMaterial({ color: '#000000', emissive: '#4fdcff', emissiveIntensity: 1, roughness: 0.4 });
    const ramLight = new MeshStandardMaterial({ color: '#000000', emissive: '#d8f6ff', emissiveIntensity: 1, roughness: 0.3 });
    // shared between parts: excluded from per-part highlight/dim
    rgb.userData.shared = ramLight.userData.shared = true;
    return {
      fanFrame: extrudeFront(fanFrameShape(FAN, FAN * 0.47), 0.025, { bevel: 0.0015 }),
      fanBlades: fanBladesGeometry(FAN * 0.45),
      rgb,
      ramLight,
    };
  }, []);
  const fan = { frame: res.fanFrame, blades: res.fanBlades };

  // soft key light that only wakes up for the exploded layout
  const [showcaseTarget] = useState(() => new Object3D());
  const [showcase, setShowcase] = useState<SpotLight | null>(null);

  useFrame(() => {
    const lit = rgbColor !== null;
    if (rgbColor) res.rgb.emissive.set(rgbColor);
    res.rgb.emissiveIntensity = lit ? (0.7 + pcRig.glow * 1.6) * pcRig.rgbPower : 0;
    res.ramLight.emissiveIntensity = lit ? (0.6 + pcRig.glow * 1.2) * pcRig.rgbPower : 0;
    if (showcase) {
      showcase.intensity = pcRig.explode * 4;
      // invisible lights drop out of every shader's light loop
      showcase.visible = pcRig.explode > 0.01;
    }
  });

  const content: Record<PartId, ReactNode> = {
    motherboard: <Motherboard tex={tex} />,
    cpu: <Cpu tex={tex} />,
    cooler: <CpuCooler tex={tex} fan={fan} />,
    ram: <RamKit tex={tex} light={res.ramLight} />,
    gpu: <Gpu tex={tex} fan={fan} light={res.rgb} />,
    ssd: <NvmeSsd tex={tex} />,
    psu: <Psu tex={tex} />,
    fans: (
      <>
        {FRONT_FANS.ys.map((y) => (
          <Fan key={y} size={FAN} geometries={fan} rgb={res.rgb} position-y={y} speed={6.5} />
        ))}
      </>
    ),
  };

  return (
    <group position={[...CASE_ORIGIN]}>
      <PcRigController mode={rig} hide={hide} />
      <Chassis tex={tex} fan={fan} rgb={res.rgb} />
      {PARTS.map((def) => (
        <PCPart key={def.id} def={def} enabled={interactive}>
          <HardwarePart id={def.id} fallback={content[def.id]} rgbColor={rgbColor} deferDetail={deferDetail} product={build?.[def.id === 'cooler' ? 'cooling' : def.id === 'fans' ? 'case' : def.id]} />
        </PCPart>
      ))}
      <primitive object={showcaseTarget} position={[-0.2, 0.02, 0.15]} />
      <spotLight
        ref={setShowcase}
        target={showcaseTarget}
        position={[-0.6, 0.9, 0.9]}
        angle={0.55}
        penumbra={0.9}
        intensity={0}
        distance={3}
        decay={2}
        color="#f2f6ff"
      />
    </group>
  );
}
