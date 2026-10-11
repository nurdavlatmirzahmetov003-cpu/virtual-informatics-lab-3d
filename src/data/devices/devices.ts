/**
 * Lab devices (V2-4a): DEVICE_CATALOG.md ids, their lab zone, ports, spec
 * keys and quiz answers. Structure only — every visible string lives in the
 * locales:
 *   - devices that the Computer Anatomy already teaches reuse its texts and
 *     its graded test (`anatomy.items.<anatomy>.*`, exercise `anatomy:<id>`);
 *   - every device has `devices.<id>.adult` (technical level) and `.use`;
 *   - new devices also have `devices.<id>.{name, student, purpose, specs, quiz}`.
 * Devices of V2-4b zones have a name and a short text only (`full: false`).
 */
import { LAB_ZONES, type LabZoneId } from '@/data/lab/zones';
import { QUIZ_OPTIONS, type AnatomyId, type QuizOption } from '@/data/hardware/anatomy';

export interface Device {
  id: string;
  zone: LabZoneId;
  /** Computer Anatomy item with the same device: its texts and test are reused. */
  anatomy?: AnatomyId;
  /** Spec keys under devices.<id>.specs (devices without an anatomy item). */
  specs?: readonly string[];
  /** Correct options of q1–q3 (devices without an anatomy item). */
  answers?: readonly [QuizOption, QuizOption, QuizOption];
  /** Port types (labels under deviceUi.portTypes.<type>). */
  ports: readonly string[];
  /** false: V2-4b device shown with its name and short text only. */
  full: boolean;
}

const d = (id: string, zone: LabZoneId, ports: readonly string[], extra: Partial<Device> = {}): Device => ({ id, zone, ports, full: true, ...extra });
const q = (a: QuizOption, b: QuizOption, c: QuizOption) => [a, b, c] as const;
const lite = (id: string, zone: LabZoneId): Device => ({ id, zone, ports: [], full: false });

export const DEVICES: readonly Device[] = [
  // ── PC build bench ──
  d('cpu', 'assembly', ['cpu_socket'], { anatomy: 'cpu' }),
  d('cooler_air', 'assembly', ['fan_4pin'], { anatomy: 'cooler' }),
  d('cooler_liquid', 'assembly', ['fan_4pin', 'pump_3pin', 'usb_internal'], { specs: ['radiator', 'fans', 'pump', 'mount'], answers: q('b', 'a', 'c') }),
  d('motherboard', 'assembly', ['cpu_socket', 'dimm', 'pcie_x16', 'm2', 'sata_data', 'atx_24pin', 'eps_8pin', 'usb_a', 'rj45', 'hdmi', 'audio_35'], { anatomy: 'motherboard' }),
  d('ram', 'assembly', ['dimm'], { anatomy: 'ram' }),
  d('gpu', 'assembly', ['pcie_x16', 'pcie_8pin', 'hdmi', 'displayport'], { anatomy: 'gpu' }),
  d('psu', 'assembly', ['iec_c14', 'atx_24pin', 'eps_8pin', 'pcie_8pin', 'sata_power'], { anatomy: 'psu' }),
  d('case', 'assembly', ['usb_a', 'usb_c', 'audio_35', 'power_button'], { specs: ['form', 'airflow', 'panel', 'clearance'], answers: q('c', 'b', 'a') }),
  d('case_fan', 'assembly', ['fan_4pin'], { anatomy: 'fans' }),
  d('thermal_paste', 'assembly', [], { specs: ['conductivity', 'amount', 'base', 'lifetime'], answers: q('a', 'c', 'b') }),
  d('internal_cables', 'assembly', ['atx_24pin', 'eps_8pin', 'pcie_8pin', 'sata_power', 'sata_data'], { specs: ['atx', 'eps', 'pcie', 'sata'], answers: q('b', 'c', 'a') }),
  d('cmos_battery', 'assembly', [], { specs: ['type', 'voltage', 'life', 'keeps'], answers: q('c', 'a', 'b') }),
  // ── storage wall ──
  d('hdd_35', 'storage', ['sata_data', 'sata_power'], { anatomy: 'hdd' }),
  d('hdd_25', 'storage', ['sata_data', 'sata_power'], { specs: ['form', 'rpm', 'capacity', 'use'], answers: q('a', 'b', 'c') }),
  d('ssd_sata', 'storage', ['sata_data', 'sata_power'], { specs: ['form', 'interface', 'speed', 'parts'], answers: q('b', 'c', 'a') }),
  d('ssd_nvme', 'storage', ['m2'], { anatomy: 'ssd' }),
  d('usb_flash', 'storage', ['usb_a', 'usb_c'], { specs: ['capacity', 'interface', 'speed', 'fs'], answers: q('c', 'a', 'b') }),
  d('sd_card', 'storage', ['sd_slot'], { specs: ['formats', 'capacity', 'speed', 'use'], answers: q('a', 'c', 'b') }),
  d('external_drive', 'storage', ['usb_c'], { specs: ['inside', 'interface', 'power', 'use'], answers: q('b', 'a', 'c') }),
  d('optical_disc', 'storage', [], { specs: ['cd', 'dvd', 'bd', 'laser'], answers: q('c', 'b', 'a') }),
  d('optical_drive', 'storage', ['sata_data', 'sata_power'], { specs: ['bay', 'interface', 'formats', 'speed'], answers: q('a', 'c', 'b') }),
  // ── input / output desk ──
  d('monitor', 'peripherals', ['hdmi', 'displayport', 'usb_c', 'audio_35'], { anatomy: 'monitor' }),
  d('keyboard', 'peripherals', ['usb_a', 'usb_c', 'wireless'], { anatomy: 'keyboard' }),
  d('mouse', 'peripherals', ['usb_a', 'wireless'], { anatomy: 'mouse' }),
  d('graphics_tablet', 'peripherals', ['usb_c'], { specs: ['pen', 'pressure', 'area', 'type'], answers: q('b', 'a', 'c') }),
  d('gamepad', 'peripherals', ['usb_c', 'bluetooth'], { specs: ['sticks', 'triggers', 'feedback', 'connection'], answers: q('c', 'b', 'a') }),
  d('microphone', 'peripherals', ['usb_c', 'audio_35'], { anatomy: 'microphone' }),
  d('webcam', 'peripherals', ['usb_a'], { anatomy: 'webcam' }),
  d('speakers', 'peripherals', ['audio_35', 'bluetooth'], { anatomy: 'speaker' }),
  d('headset', 'peripherals', ['audio_35', 'usb_a'], { anatomy: 'headset' }),
  // ── print & media ──
  d('printer_laser', 'print_media', ['usb_b', 'rj45', 'iec_c14'], { specs: ['tech', 'speed', 'resolution', 'duplex'], answers: q('a', 'b', 'c') }),
  d('printer_inkjet', 'print_media', ['usb_b', 'wireless'], { anatomy: 'printer' }),
  d('scanner', 'print_media', ['usb_b'], { specs: ['type', 'resolution', 'ocr', 'adf'], answers: q('b', 'c', 'a') }),
  d('projector', 'print_media', ['hdmi', 'usb_a', 'iec_c14'], { specs: ['tech', 'brightness', 'resolution', 'throw'], answers: q('c', 'a', 'b') }),
  d('printer_3d', 'print_media', ['usb_c', 'sd_slot', 'iec_c14'], { specs: ['tech', 'material', 'nozzle', 'layer'], answers: q('a', 'c', 'b') }),
  d('interactive_panel', 'print_media', ['hdmi', 'usb_a', 'usb_c', 'rj45'], { specs: ['size', 'touch', 'system', 'inputs'], answers: q('b', 'a', 'c') }),
  // ── V2-4b zones: name and a short text for now ──
  ...['router', 'switch', 'modem', 'wifi_adapter', 'nic', 'ethernet_cable', 'access_point', 'nas', 'server_rack'].map((id) => lite(id, 'network')),
  ...['ups', 'docking_station', 'usb_hub', 'card_reader', 'hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable'].map((id) => lite(id, 'power')),
  ...['laptop', 'all_in_one', 'smartphone', 'tablet', 'smartwatch', 'sbc'].map((id) => lite(id, 'mobile')),
];

const BY_ID = new Map(DEVICES.map((x) => [x.id, x]));
export const deviceById = (id: string): Device | undefined => BY_ID.get(id);
export const devicesIn = (zone: LabZoneId): Device[] => DEVICES.filter((x) => x.zone === zone);
/** Devices with a full info panel and their own new test (not shared with the Anatomy). */
export const OWN_QUIZ_DEVICES: readonly Device[] = DEVICES.filter((x) => x.full && !x.anatomy);
export { QUIZ_OPTIONS };

/** Locale key of a device text, resolving the Anatomy texts the device shares. */
export function deviceKey(device: Device, part: 'name' | 'student' | 'purpose' | 'adult' | 'use' | 'quiz' | 'specs'): string {
  if (device.anatomy && (part === 'name' || part === 'quiz' || part === 'specs')) return `anatomy.items.${device.anatomy}.${part}`;
  if (device.anatomy && part === 'student') return `anatomy.items.${device.anatomy}.description`;
  if (device.anatomy && part === 'purpose') return `anatomy.items.${device.anatomy}.purpose`;
  return `devices.${device.id}.${part}`;
}

/** Spec keys shown for a device (from its Anatomy item when it shares one). */
export function deviceSpecs(device: Device, anatomySpecs: (id: AnatomyId) => readonly string[]): readonly string[] {
  return device.anatomy ? anatomySpecs(device.anatomy) : device.specs ?? [];
}

/** Zone order for lists: the lab tour order. */
export const ZONE_ORDER: readonly LabZoneId[] = LAB_ZONES.map((z) => z.id);
