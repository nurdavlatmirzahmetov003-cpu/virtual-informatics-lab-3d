/**
 * Lab devices (V2-4a/b): DEVICE_CATALOG.md ids, their lab zone, ports, spec
 * keys and quiz answers. Structure only — every visible string lives in the
 * locales:
 *   - devices that the Computer Anatomy already teaches reuse its texts and
 *     its graded test (`anatomy.items.<anatomy>.*`, exercise `anatomy:<id>`);
 *   - every device has `devices.<id>.adult` (technical level) and `.use`;
 *   - new devices also have `devices.<id>.{name, student, purpose, specs, quiz}`.
 * V2-4b completed the network, power & cables and mobile zones.
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
}

const d = (id: string, zone: LabZoneId, ports: readonly string[], extra: Partial<Device> = {}): Device => ({ id, zone, ports, ...extra });
const q = (a: QuizOption, b: QuizOption, c: QuizOption) => [a, b, c] as const;

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
  // ── network corner (V2-4b) ──
  d('router', 'network', ['rj45', 'wireless', 'usb_a', 'dc_in'], { specs: ['wan', 'lan', 'wifi', 'services'], answers: q('c', 'a', 'b') }),
  d('switch', 'network', ['rj45', 'sfp', 'iec_c14'], { specs: ['ports', 'speed', 'mac', 'uplink'], answers: q('a', 'b', 'c') }),
  d('modem', 'network', ['fiber', 'rj11', 'rj45', 'dc_in'], { specs: ['type', 'line', 'lan', 'speed'], answers: q('b', 'c', 'a') }),
  d('wifi_adapter', 'network', ['usb_a', 'pcie_x1', 'wireless'], { specs: ['standard', 'bands', 'interface', 'antenna'], answers: q('c', 'b', 'a') }),
  d('nic', 'network', ['pcie_x1', 'rj45'], { specs: ['interface', 'speed', 'port', 'mac'], answers: q('b', 'a', 'c') }),
  d('ethernet_cable', 'network', ['rj45'], { specs: ['category', 'speed', 'length', 'pairs'], answers: q('c', 'b', 'a') }),
  d('access_point', 'network', ['poe', 'wireless'], { specs: ['standard', 'power', 'clients', 'mount'], answers: q('b', 'a', 'c') }),
  d('nas', 'network', ['rj45', 'usb_a', 'dc_in'], { specs: ['bays', 'raid', 'access', 'network'], answers: q('a', 'c', 'b') }),
  d('server_rack', 'network', ['rj45', 'outlet'], { specs: ['height', 'width', 'inside', 'cooling'], answers: q('c', 'b', 'a') }),
  // ── power & cables (V2-4b) ──
  d('ups', 'power', ['iec_c14', 'outlet', 'usb_b'], { specs: ['power', 'battery', 'type', 'outlets'], answers: q('b', 'a', 'c') }),
  d('docking_station', 'power', ['thunderbolt', 'usb_c', 'hdmi', 'displayport', 'rj45', 'usb_a', 'audio_35', 'dc_in'], { specs: ['link', 'displays', 'pd', 'ports'], answers: q('c', 'a', 'b') }),
  d('usb_hub', 'power', ['usb_c', 'usb_a'], { specs: ['ports', 'speed', 'power', 'link'], answers: q('a', 'c', 'b') }),
  d('card_reader', 'power', ['usb_a', 'usb_c', 'sd_slot', 'microsd_slot'], { specs: ['slots', 'standard', 'speed', 'link'], answers: q('c', 'b', 'a') }),
  d('hdmi_cable', 'power', ['hdmi'], { specs: ['versions', 'bandwidth', 'max', 'extra'], answers: q('a', 'c', 'b') }),
  d('displayport_cable', 'power', ['displayport'], { specs: ['versions', 'bandwidth', 'max', 'feature'], answers: q('c', 'a', 'b') }),
  d('usb_c_cable', 'power', ['usb_c'], { specs: ['plug', 'data', 'power', 'video'], answers: q('a', 'c', 'b') }),
  d('usb_a_cable', 'power', ['usb_a', 'usb_b'], { specs: ['ends', 'speed', 'power', 'sign'], answers: q('b', 'a', 'c') }),
  d('audio_cable', 'power', ['audio_35'], { specs: ['plug', 'contacts', 'signal', 'colors'], answers: q('c', 'a', 'b') }),
  // ── mobile devices (V2-4b) ──
  d('laptop', 'mobile', ['usb_c', 'usb_a', 'hdmi', 'audio_35', 'wireless', 'bluetooth'], { specs: ['cpu', 'screen', 'battery', 'weight'], answers: q('a', 'b', 'c') }),
  d('all_in_one', 'mobile', ['usb_a', 'usb_c', 'hdmi', 'rj45', 'audio_35', 'wireless', 'dc_in'], { specs: ['screen', 'inside', 'cables', 'upgrade'], answers: q('c', 'a', 'b') }),
  d('smartphone', 'mobile', ['usb_c', 'cellular', 'wireless', 'bluetooth'], { specs: ['soc', 'screen', 'sensors', 'battery'], answers: q('b', 'a', 'c') }),
  d('tablet', 'mobile', ['usb_c', 'wireless', 'bluetooth'], { specs: ['screen', 'soc', 'pen', 'os'], answers: q('a', 'c', 'b') }),
  d('smartwatch', 'mobile', ['magnetic_charger', 'bluetooth', 'wireless'], { specs: ['sensors', 'link', 'battery', 'screen'], answers: q('b', 'a', 'c') }),
  d('sbc', 'mobile', ['usb_c', 'usb_a', 'micro_hdmi', 'rj45', 'gpio', 'microsd_slot', 'wireless', 'bluetooth'], { specs: ['soc', 'ram', 'storage', 'gpio'], answers: q('c', 'a', 'b') }),
];

const BY_ID = new Map(DEVICES.map((x) => [x.id, x]));
export const deviceById = (id: string): Device | undefined => BY_ID.get(id);
export const devicesIn = (zone: LabZoneId): Device[] => DEVICES.filter((x) => x.zone === zone);
/** Devices with their own test (not shared with the Anatomy). */
export const OWN_QUIZ_DEVICES: readonly Device[] = DEVICES.filter((x) => !x.anatomy);
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
