/**
 * Teardowns (V2-5a): which devices can be taken apart, and the order their
 * parts come out — the order a technician follows. Structure only; every
 * text lives in the locales under `teardown.<id>.{title, intro, parts.<part>.{name, text}}`.
 * The 3D motion of each part is in scenes/Teardown.
 */
export const TEARDOWN_IDS = ['system_unit', 'laptop'] as const;
export type TeardownId = (typeof TEARDOWN_IDS)[number];

export interface Teardown {
  id: TeardownId;
  /** Parts in teardown order (step k takes out part k). */
  parts: readonly string[];
}

export const TEARDOWNS: Readonly<Record<TeardownId, Teardown>> = {
  system_unit: {
    id: 'system_unit',
    // panel off, then the card and the parts on the board, the PSU and fans, the board last
    parts: ['panel', 'gpu', 'ram', 'cooler', 'cpu', 'ssd', 'psu', 'fans', 'motherboard'],
  },
  laptop: {
    id: 'laptop',
    // battery first (safety), small modules, cables, the board last
    parts: ['lid', 'bottom_cover', 'battery', 'ssd', 'ram', 'wifi', 'display_cable', 'speakers', 'cooling', 'motherboard'],
  },
};

/** Lab devices that open a teardown. */
const BY_DEVICE: Readonly<Record<string, TeardownId>> = { case: 'system_unit', laptop: 'laptop' };
export const teardownOfDevice = (deviceId: string): TeardownId | undefined => BY_DEVICE[deviceId];
export const isTeardownId = (v: string | null | undefined): v is TeardownId => !!v && (TEARDOWN_IDS as readonly string[]).includes(v);
