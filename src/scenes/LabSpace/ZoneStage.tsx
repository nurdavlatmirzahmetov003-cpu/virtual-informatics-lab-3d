/**
 * One zone of the hall: platform with a glowing accent edge, a sign, and the
 * zone's content. Content mounts at preview detail on the overview and at
 * full detail only while the zone is focused (V2-3 loading policy); each has
 * its own Suspense boundary, so loading a zone never blanks the hall.
 */
import { Suspense, useEffect, useMemo, useRef, type ComponentType } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { MeshStandardMaterial } from 'three';
import type { LabZone, LabZoneId } from '@/data/lab/zones';
import type { TranslationKey } from '@/lib/i18n';
import { zoneNumber } from '@/lib/lab/navigation';
import { useDisposable } from '@/hooks/useDisposable';
import { useT } from '@/hooks/useT';
import { useTheme } from '@/hooks/useTheme';
import { roundedSlab } from '@/lib/three/geometry';
import { useLabStore } from '@/store/labStore';
import { SIGN_ASPECT, signTexture } from './signTexture';
import { ShowcaseZone, WorkstationZone } from './zones/pcZones';
import { AssemblyZone, PeripheralsZone, PrintMediaZone, StorageZone } from './zones/exhibitZones';
import { MobileZone, NetworkZone, PowerZone } from './zones/techZones';
import type { ZoneContentProps } from './zones/zoneData';

const CONTENT: Record<LabZoneId, ComponentType<ZoneContentProps>> = {
  workstation: WorkstationZone,
  assembly: AssemblyZone,
  storage: StorageZone,
  peripherals: PeripheralsZone,
  print_media: PrintMediaZone,
  network: NetworkZone,
  power: PowerZone,
  mobile: MobileZone,
  showcase: ShowcaseZone,
};

const PLATFORM_H = 0.05;
/** Wall zones stand 1.8 m in front of their wall (zones.ts); signs hang just in front of it. */
const SIGN_TO_WALL = 1.76;
const key = (k: string) => k as TranslationKey;

function ZoneSign({ zone, width }: { zone: LabZone; width: number }) {
  const t = useT();
  const light = useTheme() === 'light';
  const tex = useDisposable(
    () =>
      signTexture(zoneNumber(zone.id), t(key(`lab.zones.${zone.id}.name`)), t(key(`lab.zones.${zone.id}.caption`)), zone.accent, {
        background: light ? 'rgba(255,255,255,0.94)' : 'rgba(10,14,26,0.9)',
        text: light ? '#0f172a' : '#f1f5fb',
        muted: light ? '#475569' : '#9fb0c8',
      }),
    [zone, t, light],
  );
  return (
    <mesh>
      <planeGeometry args={[width, width / SIGN_ASPECT]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

export function ZoneStage({ zone, focused }: { zone: LabZone; focused: boolean }) {
  const [w, d] = zone.size;
  const yaw = Math.atan2(zone.facing[0], zone.facing[1]);
  const geo = useDisposable(
    () => ({
      top: roundedSlab(w, PLATFORM_H, d, 0.14),
      edge: roundedSlab(w + 0.07, 0.014, d + 0.07, 0.17),
    }),
    [w, d],
  );
  const light = useTheme() === 'light';
  const edge = useRef<MeshStandardMaterial>(null);
  const hoverState = useRef(false);
  const Content = CONTENT[zone.id];
  const isShowcase = zone.id === 'showcase';

  useEffect(() => () => {
    if (useLabStore.getState().hovered === zone.id) useLabStore.getState().hover(null);
  }, [zone.id]);

  useFrame(() => {
    const m = edge.current;
    if (!m) return;
    const hot = focused || useLabStore.getState().hovered === zone.id;
    const goal = hot ? 3.2 : 1.4;
    m.emissiveIntensity += (goal - m.emissiveIntensity) * 0.12;
  });

  const handlers = useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        hoverState.current = true;
        useLabStore.getState().hover(zone.id);
        document.body.style.cursor = 'pointer';
      },
      onPointerOut: () => {
        hoverState.current = false;
        if (useLabStore.getState().hovered === zone.id) useLabStore.getState().hover(null);
        document.body.style.cursor = '';
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        // a drag (orbit) is not a click
        if (e.delta > 6) return;
        e.stopPropagation();
        if (useLabStore.getState().focus !== zone.id) useLabStore.getState().focusZone(zone.id);
      },
    }),
    [zone.id],
  );
  useEffect(() => () => void (hoverState.current && (document.body.style.cursor = '')), []);

  return (
    <group position={[zone.center[0], 0, zone.center[1]]} rotation-y={yaw} {...handlers}>
      <mesh geometry={geo.edge} position-y={0.0}>
        <meshStandardMaterial ref={edge} color="#05070c" emissive={zone.accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      <mesh geometry={geo.top} position-y={0.004} receiveShadow>
        <meshStandardMaterial color={light ? '#f6f8fb' : '#1b202b'} roughness={0.55} metalness={0.05} envMapIntensity={0.6} />
      </mesh>
      {/* sign: on the wall behind wall zones, on a totem for free-standing ones */}
      {isShowcase || zone.id === 'mobile' ? (
        <group position={[0, 0, -d / 2 - 0.05]}>
          <mesh position-y={0.85}>
            <boxGeometry args={[0.05, 1.7, 0.05]} />
            <meshStandardMaterial color={light ? '#c4ccd8' : '#2a303d'} metalness={0.6} roughness={0.35} />
          </mesh>
          <group position={[0, 2.0, 0]}>
            <ZoneSign zone={zone} width={1.4} />
          </group>
        </group>
      ) : (
        <group position={[0, 2.75, -SIGN_TO_WALL]}>
          <ZoneSign zone={zone} width={1.9} />
        </group>
      )}
      <group position-y={PLATFORM_H + 0.004}>
        {/* the preview stays up while the full models load */}
        <Suspense fallback={<Content detail="preview" accent={zone.accent} />}>
          <Content key={focused ? 'full' : 'preview'} detail={focused ? 'full' : 'preview'} accent={zone.accent} />
        </Suspense>
      </group>
    </group>
  );
}
