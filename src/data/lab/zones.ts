/**
 * The large 3D lab (V2-3): one hall, nine zones. Pure data (no three.js), so
 * navigation logic and tests can use it. World units are metres; the hall
 * floor is y = 0, the open (cut-away) side faces +Z, the entrance.
 *
 * Zone ids follow DEVICE_CATALOG.md ("Lab zones"); `workstation` (the home
 * desk setup) and `showcase` complete the PLAN_V2 list.
 */
export const LAB_ZONE_IDS = ['workstation', 'assembly', 'storage', 'peripherals', 'print_media', 'network', 'power', 'mobile', 'showcase'] as const;
export type LabZoneId = (typeof LAB_ZONE_IDS)[number];

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];

export interface LabZone {
  id: LabZoneId;
  /** Accent colour of the platform edge, sign and minimap. */
  accent: string;
  /** Centre of the zone platform on the floor (x, z). */
  center: Vec2;
  /** Platform footprint (width along the zone's own X, depth along its facing). */
  size: Vec2;
  /** Unit vector (x, z) from the zone towards its visitor: the side the zone is seen from. */
  facing: Vec2;
  /** Camera framing when the zone is focused. */
  view: { distance: number; height: number; targetY: number };
  /** DEVICE_CATALOG.md device ids shown here from V2-4 on (each device in exactly one zone). */
  devices: readonly string[];
}

/** Interior of the hall: back wall at minZ, side walls at ±maxX, open front. */
export const LAB_HALL = { minX: -10, maxX: 10, minZ: -7, maxZ: 8, height: 4.2 } as const;

const BACK: Vec2 = [0, 1];
const FROM_LEFT: Vec2 = [1, 0];
const FROM_RIGHT: Vec2 = [-1, 0];

export const LAB_ZONES: readonly LabZone[] = [
  {
    id: 'workstation', accent: '#38d6f5', center: [0, -5.2], size: [3.4, 2.4], facing: BACK,
    view: { distance: 2.9, height: 1.55, targetY: 0.95 },
    devices: [],
  },
  {
    id: 'assembly', accent: '#4ade80', center: [-6.2, -5.2], size: [3.2, 2.4], facing: BACK,
    view: { distance: 2.9, height: 1.8, targetY: 0.8 },
    devices: ['cpu', 'cooler_air', 'cooler_liquid', 'motherboard', 'ram', 'gpu', 'psu', 'case', 'case_fan', 'thermal_paste', 'internal_cables', 'cmos_battery'],
  },
  {
    id: 'storage', accent: '#f5b83d', center: [6.2, -5.2], size: [3.2, 2.4], facing: BACK,
    view: { distance: 3.0, height: 1.6, targetY: 1.35 },
    devices: ['hdd_35', 'hdd_25', 'ssd_sata', 'ssd_nvme', 'usb_flash', 'sd_card', 'external_drive', 'optical_disc', 'optical_drive'],
  },
  {
    id: 'peripherals', accent: '#a78bfa', center: [8.2, -0.6], size: [3.2, 2.4], facing: FROM_RIGHT,
    view: { distance: 2.7, height: 1.6, targetY: 0.95 },
    devices: ['keyboard', 'mouse', 'graphics_tablet', 'gamepad', 'microphone', 'webcam', 'monitor', 'speakers', 'headset'],
  },
  {
    id: 'print_media', accent: '#fb7185', center: [8.2, 4.2], size: [3.2, 2.4], facing: FROM_RIGHT,
    view: { distance: 3.4, height: 1.7, targetY: 1.15 },
    devices: ['printer_laser', 'printer_inkjet', 'scanner', 'projector', 'printer_3d', 'interactive_panel'],
  },
  {
    id: 'network', accent: '#22d3ee', center: [-8.2, -0.6], size: [3.2, 2.4], facing: FROM_LEFT,
    view: { distance: 2.9, height: 1.65, targetY: 1.1 },
    devices: ['router', 'switch', 'modem', 'wifi_adapter', 'nic', 'ethernet_cable', 'access_point', 'nas', 'server_rack'],
  },
  {
    id: 'power', accent: '#facc15', center: [-8.2, 4.2], size: [3.2, 2.4], facing: FROM_LEFT,
    view: { distance: 3.2, height: 1.65, targetY: 1.15 },
    devices: ['ups', 'docking_station', 'usb_hub', 'card_reader', 'hdmi_cable', 'displayport_cable', 'usb_c_cable', 'usb_a_cable', 'audio_cable'],
  },
  {
    // front left, beside the entrance: the showcase is seen from the open middle
    id: 'mobile', accent: '#60a5fa', center: [-2.8, 5.0], size: [3.6, 1.8], facing: BACK,
    view: { distance: 2.5, height: 1.55, targetY: 0.9 },
    devices: ['laptop', 'all_in_one', 'smartphone', 'tablet', 'smartwatch', 'sbc'],
  },
  {
    id: 'showcase', accent: '#e879f9', center: [0, 0.2], size: [3.6, 3.6], facing: BACK,
    view: { distance: 4.6, height: 2.1, targetY: 0.8 },
    devices: [],
  },
];

/** The whole hall from above the open front: where every visit starts and Esc returns. */
export const LAB_OVERVIEW = { position: [0, 15.5, 19.5] as Vec3, target: [0, 0, 0.6] as Vec3, fov: 40 };

/** Orbit limits (distance from the target) per mode. */
export const LAB_ORBIT = {
  overview: { min: 7, max: 24 },
  zone: { min: 1.1, max: 6 },
} as const;

export const zoneById = (id: LabZoneId): LabZone => LAB_ZONES.find((z) => z.id === id)!;
