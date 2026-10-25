/**
 * The system unit: chassis + eight separately animated components.
 * Interim procedural build — see TODO.md [PLACEHOLDER] entries.
 */
import { useEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, Object3D, type SpotLight } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { extrudeFront, fanBladesGeometry, fanFrameShape } from '@/lib/three/geometry';
import { usePcStore } from '@/store/pcStore';
import { storyRig } from '../storyRig';
import { Chassis } from './Chassis';
import { PARTS, type PartId } from './parts';
import { PCPart } from './PCPart';
import { pcRig } from './pcRig';
import { usePcTextures } from './usePcTextures';
import { HardwarePart } from './HardwareParts';
import { CASE_ORIGIN, FAN } from './constants';
import { caseMountsFor, installBuild, type Installed, type Vec3 } from './mounts';
import { isTieredModel } from '@/lib/three/modelUrls';
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

/** Where each part group sits: the centre of its installed box (fans: the middle of the intake fans). */
function installedCentres(inst: Installed): Record<PartId, Vec3> {
  const centre = (pl: { p: Vec3 } | null): Vec3 => pl?.p ?? [0, 0, 0];
  const intake = inst.fans.filter((f) => f.group !== 'rear');
  const mid = (k: 0 | 1 | 2) => (intake.length ? intake.reduce((s, f) => s + f.p[k], 0) / intake.length : 0);
  return {
    motherboard: centre(inst.motherboard),
    cpu: centre(inst.cpu),
    cooler: centre(inst.cooler),
    ram: centre(inst.ram),
    gpu: centre(inst.gpu),
    ssd: centre(inst.ssd),
    psu: centre(inst.psu),
    fans: [mid(0), mid(1), mid(2)],
  };
}

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
  const caseId = build?.case && isTieredModel(build.case.modelPath) ? build.case.id : null;
  const inst = useMemo(() => installBuild(caseMountsFor(caseId), { ...build, cooling: build?.cooling }), [caseId, build]);
  const at = useMemo(() => installedCentres(inst), [inst]);
  useEffect(() => {
    pcRig.at = at;
  }, [at]);

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

  return (
    <group position={[...CASE_ORIGIN]}>
      <PcRigController mode={rig} hide={hide} />
      <Chassis tex={tex} fan={fan} rgb={res.rgb} product={build?.case} mounts={inst.mounts} />
      {PARTS.map((def) => (
        <PCPart key={def.id} def={def} at={at[def.id]} enabled={interactive}>
          <HardwarePart id={def.id} inst={inst} at={at[def.id]} rgbColor={rgbColor} deferDetail={deferDetail} product={build?.[def.id === 'cooler' ? 'cooling' : def.id === 'fans' ? 'case' : def.id]} />
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
