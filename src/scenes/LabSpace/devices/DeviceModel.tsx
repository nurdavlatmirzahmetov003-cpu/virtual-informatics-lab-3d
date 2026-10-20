/**
 * One 3D model per lab device (V2-4a), shared by the exhibit tables and the
 * 360° viewer. `display` adds the exhibit pose: small parts are enlarged and
 * flat ones lean back on a clear stand so they read from the aisle. Product
 * models are licensed downloads at real size (V2-2a/b catalog, 2026-10 lab
 * devices: scripts/blender/make-device-configs.py); the few devices without
 * a suitable licensed model stay procedural [PLACEHOLDER]s.
 */
import type { ReactNode } from 'react';
import { HardwareFans } from '@/scenes/DeskScene/pc/HardwareParts';
import { useMonitorWallpaper } from '@/scenes/DeskScene/models/useMonitorWallpaper';
import { Product } from '../zones/common';
import { CableSet, CmosBattery, Hdd25, LiquidCoolerDisplay, OpticalDrive, Projector, Scanner } from './procedural';
import type { CableKind } from './cables';
import { PRODUCT } from './deviceAssets';
import { AccessPoint, CableCoil, CardReader, DockingStation } from './v24bDevices';

interface Pose {
  /** Magnification on the exhibit table. */
  scale?: number;
  /** Lean back (rad) on a clear stand; `half` = half the model's depth (m, unscaled) so the front edge stays on the stand. */
  tilt?: number;
  half?: number;
  rotY?: number;
}

/** Exhibit poses; devices not listed stand as modelled at real size. */
const POSE: Record<string, Pose> = {
  cpu: { scale: 4, tilt: 0.85, half: 0.02 },
  motherboard: { tilt: 1.05, half: 0.122 },
  ram: { scale: 2.2 },
  gpu: { rotY: Math.PI / 2 },
  thermal_paste: { scale: 2.5 },
  cmos_battery: { scale: 5, tilt: 0.9, half: 0.01 },
  internal_cables: { scale: 1.6 },
  case_fan: { scale: 1 },
  hdd_35: { scale: 1.6, tilt: 1.0, half: 0.0735 },
  hdd_25: { scale: 2, tilt: 1.0, half: 0.05 },
  ssd_sata: { scale: 2, tilt: 1.0, half: 0.05 },
  ssd_nvme: { scale: 3, tilt: 1.0, half: 0.04 },
  usb_flash: { scale: 3.5 },
  sd_card: { scale: 5, tilt: 0.9, half: 0.016 },
  external_drive: { scale: 1.6, tilt: 0.9, half: 0.059 },
  optical_disc: { scale: 1.4, tilt: 1.0, half: 0.0625 },
  mouse: { scale: 1.6 },
  gamepad: { scale: 1.6 },
  webcam: { scale: 2 },
  microphone: { scale: 1.2 },
  graphics_tablet: { tilt: 0.35, half: 0.1 },
  nic: { scale: 1.6 },
  wifi_adapter: { scale: 1.4 },
  access_point: { tilt: 1.0, half: 0.1 },
  docking_station: { scale: 1.5 },
  usb_hub: { scale: 2 },
  card_reader: { scale: 2.5 },
  smartwatch: { scale: 1.8 },
  sbc: { scale: 2.2, tilt: 0.9, half: 0.028 },
};

function HeadsetOnStand({ light }: { light: boolean }) {
  return (
    <group>
      <mesh position-y={0.007} castShadow>
        <cylinderGeometry args={[0.055, 0.06, 0.014, 40]} />
        <meshStandardMaterial color="#25282d" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position-y={0.135} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.25, 20]} />
        <meshStandardMaterial color="#555962" metalness={0.9} roughness={0.3} />
      </mesh>
      <group position-y={0.06}>
        <Product product={PRODUCT.headset} lightOnly={light} />
      </group>
    </group>
  );
}

function SpeakerPair() {
  return (
    <group>
      <group position-x={-0.09} rotation-y={0.12}>
        <Product product="spk-edifier-r1280db" />
      </group>
      <group position-x={0.09} rotation-y={-0.12}>
        <Product product="spk-edifier-r1280db" />
      </group>
    </group>
  );
}

/** A product with a screen: the site wallpaper goes on its "Screen" material (screen proportions in px). */
function ScreenProduct({ product, light, w, h }: { product: string; light: boolean; w: number; h: number }) {
  const onLoaded = useMonitorWallpaper(w, h);
  return <Product product={product} lightOnly={light} onLoaded={onLoaded} />;
}

/** Phones and tablets lean back on a small desk stand. */
function OnStand({ children, lean = 0.28 }: { children: ReactNode; lean?: number }) {
  return (
    <group>
      <mesh position={[0, 0.005, 0.005]} castShadow>
        <boxGeometry args={[0.09, 0.01, 0.07]} />
        <meshStandardMaterial color="#3a3f4b" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[0, 0.01, 0.02]} rotation-x={-lean}>
        {children}
      </group>
    </group>
  );
}

/** The interactive panel on its mobile stand (pole and wheeled base). */
function InteractivePanel({ light }: { light: boolean }) {
  return (
    <group>
      <mesh position-y={0.55} castShadow>
        <boxGeometry args={[0.06, 1.1, 0.06]} />
        <meshStandardMaterial color="#3a3f4b" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position-y={0.02}>
        <boxGeometry args={[0.7, 0.04, 0.5]} />
        <meshStandardMaterial color="#3a3f4b" metalness={0.7} roughness={0.35} />
      </mesh>
      <group position={[0, 0.86, 0.04]}>
        <ScreenProduct product={PRODUCT.interactive_panel} light={light} w={1600} h={900} />
      </group>
    </group>
  );
}

/** A cable's hank on a hook post (the procedural cables, and the downloaded ones until they load). */
function HookedCable({ kind }: { kind: CableKind }) {
  return (
    <group>
      <mesh position-y={0.17} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.34, 12]} />
        <meshStandardMaterial color="#9aa3b2" metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0, 0.33, -0.04]}>
        <CableCoil kind={kind} />
      </group>
    </group>
  );
}
function Model({ id, light }: { id: string; light: boolean }): ReactNode {
  const product = PRODUCT[id];
  switch (id) {
    case 'speakers':
      return <SpeakerPair />;
    case 'headset':
      return <HeadsetOnStand light={light} />;
    case 'cooler_liquid':
      return <Product product={product} lightOnly={light} fallback={<LiquidCoolerDisplay />} />;
    case 'case_fan':
      return (
        <group position-y={0.06}>
          <HardwareFans ys={[0]} fallback={null} />
        </group>
      );
    case 'internal_cables':
      return <CableSet />;
    case 'cmos_battery':
      return <Product product={product} lightOnly={light} fallback={<CmosBattery />} />;
    case 'hdd_25':
      return <Product product={product} lightOnly={light} fallback={<Hdd25 />} />;
    case 'optical_drive':
      return <Product product={product} lightOnly={light} fallback={<OpticalDrive />} />;
    case 'scanner':
      return <Product product={product} lightOnly={light} fallback={<Scanner />} />;
    case 'projector':
      return <Projector />;
    case 'interactive_panel':
      return <InteractivePanel light={light} />;
    case 'access_point':
      return <Product product={product} lightOnly={light} fallback={<AccessPoint />} />;
    case 'docking_station':
      return <DockingStation />;
    case 'card_reader':
      return <Product product={product} lightOnly={light} fallback={<CardReader />} />;
    case 'usb_c_cable':
    case 'usb_a_cable':
      // the downloaded cables lie coiled on the pad; until they load, the hank on its hook
      return <Product product={product} lightOnly={light} fallback={<HookedCable kind={id} />} />;
    case 'hdmi_cable':
    case 'displayport_cable':
    case 'audio_cable':
    case 'ethernet_cable':
      return <HookedCable kind={id} />;
    case 'monitor':
      return <ScreenProduct product={product} light={light} w={2048} h={1152} />;
    case 'laptop':
      return <ScreenProduct product={product} light={light} w={1536} h={864} />;
    case 'all_in_one':
      return <ScreenProduct product={product} light={light} w={1600} h={900} />;
    case 'smartwatch':
      return <ScreenProduct product={product} light={light} w={400} h={480} />;
    case 'smartphone':
      return (
        <OnStand>
          <ScreenProduct product={product} light={light} w={720} h={1560} />
        </OnStand>
      );
    case 'tablet':
      return (
        <OnStand lean={0.32}>
          <ScreenProduct product={product} light={light} w={1080} h={1560} />
        </OnStand>
      );
    default:
      return product ? <Product product={product} lightOnly={light} /> : null;
  }
}

/**
 * A device model; base on y = 0. `display`: the exhibit pose (scale, lean on
 * a clear stand). `light`: lightest product level (overview previews).
 */
export function DeviceModel({ id, display = false, light = false }: { id: string; display?: boolean; light?: boolean }) {
  const pose = display ? POSE[id] : undefined;
  const scale = pose?.scale ?? 1;
  const lift = pose?.tilt ? (pose.half ?? 0) * scale * Math.sin(pose.tilt) : 0;
  return (
    <group position-y={lift} rotation={[pose?.tilt ?? 0, pose?.rotY ?? 0, 0]} scale={scale}>
      <Model id={id} light={light} />
    </group>
  );
}
