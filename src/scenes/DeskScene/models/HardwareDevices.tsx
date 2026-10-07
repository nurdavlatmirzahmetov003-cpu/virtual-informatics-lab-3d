import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { ModelLoader } from '@/components/3d/ModelLoader';
import { HEADSET, KEYBOARD, MONITOR, MOUSE, SPEAKERS } from '../layout';
import { storyRig } from '../storyRig';
import { usePcStore } from '@/store/pcStore';
import { Monitor as MonitorFallback } from './Monitor';
import { Keyboard as KeyboardFallback } from './Keyboard';
import { Mouse as MouseFallback } from './Mouse';
import { Headset as HeadsetFallback } from './Headset';
import { Speakers as SpeakersFallback } from './Speakers';
import { useMonitorWallpaper } from './useMonitorWallpaper';

const url = (name: string) => `${import.meta.env.BASE_URL}assets/models/hardware/${name}.glb`;
const monitorFit = { axis: 0 as const, size: 0.70, align: 'floor' as const };
const keyboardFit = { axis: 0 as const, size: 0.405, align: 'floor' as const };
const mouseFit = { axis: 2 as const, size: 0.122, rotation: [0, Math.PI, 0] as const, align: 'floor' as const };
const headsetFit = { axis: 1 as const, size: 0.225, align: 'floor' as const, offset: [0, 0.045, 0] as const };
const speakerFit = { axis: 1 as const, size: 0.15, align: 'floor' as const };

export function Monitor() {
  const group = useRef<Group>(null);
  const screen = useMonitorWallpaper();
  useFrame(() => { if (group.current) group.current.rotation.y = storyRig.monitorYaw; });
  return <ModelLoader ref={group} url={url('monitor_ultrawide')} fit={monitorFit} position={[...MONITOR.position]} onLoaded={screen} onClick={e => { e.stopPropagation(); usePcStore.getState().enterDevice('monitor'); }} fallback={<MonitorFallback />} />;
}

export function Keyboard() {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.position.y = KEYBOARD.position[1] + storyRig.keyboardLift;
    group.current.rotation.x = storyRig.keyboardTilt;
  });
  return <ModelLoader ref={group} url={url('keyboard_mech')} fit={keyboardFit} position={[...KEYBOARD.position]} onClick={e => { e.stopPropagation(); usePcStore.getState().enterDevice('keyboard'); }} fallback={<KeyboardFallback />} />;
}

export function Mouse() {
  const group = useRef<Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.rotation.y = MOUSE.yaw + storyRig.mouseSpin;
    group.current.position.y = MOUSE.position[1] + storyRig.mouseLift;
  });
  return <ModelLoader ref={group} url={url('mouse_gaming')} fit={mouseFit} deferDetail position={[...MOUSE.position]} onClick={e => { e.stopPropagation(); usePcStore.getState().enterDevice('mouse'); }} fallback={<MouseFallback />} />;
}

export function Headset() {
  return <group>
    <ModelLoader url={url('headset_gaming')} fit={headsetFit} position={[...HEADSET.position]} rotation-y={HEADSET.yaw} fallback={<HeadsetFallback />} />
    <group position={[...HEADSET.position]}>
      <mesh position-y={0.007} castShadow><cylinderGeometry args={[0.055, 0.06, 0.014, 40]} /><meshStandardMaterial color="#25282d" metalness={0.8} roughness={0.3} /></mesh>
      <mesh position-y={0.135} castShadow><cylinderGeometry args={[0.006, 0.006, 0.25, 20]} /><meshStandardMaterial color="#555962" metalness={0.9} roughness={0.3} /></mesh>
    </group>
  </group>;
}

export function Speakers() {
  return <>
    <ModelLoader url={`${url('speakers')}#speaker_left`} fit={speakerFit} deferDetail position={[...SPEAKERS.left.position]} rotation-y={SPEAKERS.left.yaw} fallback={<SpeakersFallback />} />
    <ModelLoader url={`${url('speakers')}#speaker_right`} fit={speakerFit} deferDetail position={[...SPEAKERS.right.position]} rotation-y={SPEAKERS.right.yaw} fallback={null} />
  </>;
}
