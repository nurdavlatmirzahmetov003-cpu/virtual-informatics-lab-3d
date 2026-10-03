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

/** Resolves pcRig from the scroll story or from explore-mode toggles. Must mount first. */
function PcRigController() {
  useFrame((_, delta) => {
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

export function PCCase() {
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
    res.rgb.emissiveIntensity = 0.7 + pcRig.glow * 1.6;
    res.ramLight.emissiveIntensity = 0.6 + pcRig.glow * 1.2;
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
      <PcRigController />
      <Chassis tex={tex} fan={fan} rgb={res.rgb} />
      {PARTS.map((def) => (
        <PCPart key={def.id} def={def}>
          {content[def.id]}
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
