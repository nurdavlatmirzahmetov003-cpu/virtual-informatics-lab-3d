/**
 * Teardowns (V2-5a/b): which devices can be taken apart, and the order their
 * parts come out — the order a technician follows. Structure only; every
 * text lives in the locales under
 * `teardown.<id>.{title, intro, parts.<part>.{name, text, does, ask}}`.
 * The 3D motion of each part is in scenes/Teardown.
 */
export const TEARDOWN_IDS = ['system_unit', 'laptop', 'smartphone', 'tablet', 'all_in_one', 'printer_3d'] as const;
export type TeardownId = (typeof TEARDOWN_IDS)[number];

export interface Teardown {
  id: TeardownId;
  /** Parts in teardown order (step k takes out part k). */
  parts: readonly string[];
  /** The three parts asked about in the "What does this part do?" task. */
  quiz: readonly [string, string, string];
}

export const TEARDOWNS: Readonly<Record<TeardownId, Teardown>> = {
  system_unit: {
    id: 'system_unit',
    // panel off, then the card and the parts on the board, the PSU and fans, the board last
    parts: ['panel', 'gpu', 'ram', 'cooler', 'cpu', 'ssd', 'psu', 'fans', 'motherboard'],
    quiz: ['gpu', 'psu', 'ram'],
  },
  laptop: {
    id: 'laptop',
    // battery first (safety), small modules, cables, the board last
    parts: ['lid', 'bottom_cover', 'battery', 'ssd', 'ram', 'wifi', 'display_cable', 'speakers', 'cooling', 'motherboard'],
    quiz: ['battery', 'cooling', 'wifi'],
  },
  smartphone: {
    id: 'smartphone',
    // SIM tray out before opening; screen off; battery disconnected before anything else
    parts: ['sim_tray', 'display', 'battery', 'cameras', 'mainboard', 'speaker', 'vibration'],
    quiz: ['display', 'mainboard', 'vibration'],
  },
  tablet: {
    id: 'tablet',
    parts: ['display', 'battery', 'cameras', 'mainboard', 'speakers', 'usb_port'],
    quiz: ['battery', 'speakers', 'usb_port'],
  },
  all_in_one: {
    id: 'all_in_one',
    // laid face down: stand, back cover, then the parts behind the screen
    parts: ['stand', 'back_cover', 'speakers', 'cooling', 'ram', 'ssd', 'motherboard', 'power_board'],
    quiz: ['cooling', 'power_board', 'ram'],
  },
  printer_3d: {
    id: 'printer_3d',
    parts: ['extruder', 'heated_bed', 'steppers', 'belts', 'control_board', 'psu'],
    quiz: ['extruder', 'heated_bed', 'steppers'],
  },
};

/** Lab devices that open a teardown. */
const BY_DEVICE: Readonly<Record<string, TeardownId>> = {
  case: 'system_unit',
  laptop: 'laptop',
  smartphone: 'smartphone',
  tablet: 'tablet',
  all_in_one: 'all_in_one',
  printer_3d: 'printer_3d',
};
export const teardownOfDevice = (deviceId: string): TeardownId | undefined => BY_DEVICE[deviceId];
export const isTeardownId = (v: string | null | undefined): v is TeardownId => !!v && (TEARDOWN_IDS as readonly string[]).includes(v);
