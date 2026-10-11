/**
 * One 3D model per lab device (V2-4a), shared by the exhibit tables and the
 * 360° viewer. `display` adds the exhibit pose: small parts are enlarged and
 * flat ones lean back on a clear stand so they read from the aisle. Product
 * models come from the catalog (real size, V2-2a/b); devices without a
 * licensed model are procedural [PLACEHOLDER]s.
 */
import type { ReactNode } from 'react';
import type { Texture } from 'three';
import { Hdd, Microphone, NetworkCard, Printer, Webcam } from '@/scenes/HardwareExplorer/placeholders';
import { HardwareFans } from '@/scenes/DeskScene/pc/HardwareParts';
import { Product, ScreenPanel } from '../zones/common';
import { useWallpaper } from '../zones/useWallpaper';
import {
  CableSet, CmosBattery, ExternalDrive, Gamepad, GraphicsTablet, Hdd25, LaserPrinter, LiquidCoolerDisplay,
  OpticalDisc, OpticalDrive, Printer3d, Projector, Scanner, SdCards, ThermalPaste, UsbFlash,
} from './procedural';
import { PRODUCT } from './deviceAssets';
import { AllInOne, CableCoil, Gadget, Laptop, NetworkSwitch, Rack, Router, SingleBoard, Slate, Smartwatch, Ups } from './v24bDevices';

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

function InteractivePanel({ wallpaper }: { wallpaper: Texture }) {
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
      <group position-y={1.3}>
        <ScreenPanel width={1.24} height={0.72} depth={0.06} bezel={0.025} texture={wallpaper} />
      </group>
    </group>
  );
}

/** Devices that need the screen wallpaper texture (one per model instance). */
function WithWallpaper({ render }: { render: (t: Texture) => ReactNode }) {
  const wallpaper = useWallpaper(512, 320);
  return <>{render(wallpaper)}</>;
}

function Model({ id, light }: { id: string; light: boolean }): ReactNode {
  const product = PRODUCT[id];
  switch (id) {
    case 'speakers':
      return <SpeakerPair />;
    case 'headset':
      return <HeadsetOnStand light={light} />;
    case 'cooler_liquid':
      return <LiquidCoolerDisplay />;
    case 'case_fan':
      return (
        <group position-y={0.06}>
          <HardwareFans ys={[0]} fallback={null} />
        </group>
      );
    case 'thermal_paste':
      return <ThermalPaste />;
    case 'internal_cables':
      return <CableSet />;
    case 'cmos_battery':
      return <CmosBattery />;
    case 'hdd_35':
      return <Hdd />;
    case 'hdd_25':
      return <Hdd25 />;
    case 'usb_flash':
      return <UsbFlash />;
    case 'sd_card':
      return <SdCards />;
    case 'external_drive':
      return <ExternalDrive />;
    case 'optical_disc':
      return <OpticalDisc />;
    case 'optical_drive':
      return <OpticalDrive />;
    case 'graphics_tablet':
      return <GraphicsTablet />;
    case 'gamepad':
      return <Gamepad />;
    case 'microphone':
      return <Microphone />;
    case 'webcam':
      return <Webcam />;
    case 'printer_laser':
      return <LaserPrinter />;
    case 'printer_inkjet':
      return <Printer />;
    case 'scanner':
      return <Scanner />;
    case 'projector':
      return <Projector />;
    case 'printer_3d':
      return <Printer3d />;
    case 'interactive_panel':
      return <WithWallpaper render={(t) => <InteractivePanel wallpaper={t} />} />;
    // V2-4b devices (procedural until their models arrive)
    case 'router':
      return <Router />;
    case 'switch':
      return <NetworkSwitch />;
    case 'nic':
      return <NetworkCard />;
    case 'server_rack':
      return <Rack />;
    case 'ups':
      return <Ups />;
    case 'docking_station':
      return <Gadget size={[0.2, 0.03, 0.08]} glow="#38d6f5" />;
    case 'usb_hub':
      return <Gadget size={[0.11, 0.015, 0.035]} color="#e6e8ec" glow="#4ade80" />;
    case 'card_reader':
      return <Gadget size={[0.06, 0.012, 0.04]} color="#1a1d23" />;
    case 'hdmi_cable':
    case 'displayport_cable':
    case 'usb_c_cable':
    case 'usb_a_cable':
    case 'audio_cable':
    case 'ethernet_cable':
      return (
        <group>
          <mesh position-y={0.17} castShadow>
            <cylinderGeometry args={[0.005, 0.005, 0.34, 12]} />
            <meshStandardMaterial color="#9aa3b2" metalness={0.8} roughness={0.3} />
          </mesh>
          <group position={[0, 0.33, -0.04]}>
            <CableCoil kind={id} />
          </group>
        </group>
      );
    case 'laptop':
      return <WithWallpaper render={(t) => <Laptop wallpaper={t} />} />;
    case 'smartphone':
      return <WithWallpaper render={(t) => <Slate width={0.072} height={0.155} wallpaper={t} />} />;
    case 'tablet':
      return <WithWallpaper render={(t) => <Slate width={0.25} height={0.17} wallpaper={t} />} />;
    case 'all_in_one':
      return <WithWallpaper render={(t) => <AllInOne wallpaper={t} />} />;
    case 'smartwatch':
      return <WithWallpaper render={(t) => <Smartwatch wallpaper={t} />} />;
    case 'sbc':
      return <SingleBoard />;
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
