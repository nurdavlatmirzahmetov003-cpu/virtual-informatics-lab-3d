/**
 * Connection Lab (V2-6): plugging cables into the right ports, wired and
 * wireless networking. Pure data and rules — the 3D scenes and the UI only
 * read and dispatch.
 */

/** Socket / plug shapes. Names follow the V2-2b port markers (`port_<kind>_<n>`). */
export const PORT_KINDS = ['usb_a', 'usb_c', 'hdmi', 'displayport', 'ethernet', 'audio_3_5', 'power_ac', 'dc_in'] as const;
export type PortKind = (typeof PORT_KINDS)[number];

/** Which device a port belongs to. */
export type PortOwner = 'motherboard' | 'gpu' | 'psu' | 'laptop' | 'router';

export interface PortDef {
  /** Unique in a scenario, e.g. `gpu.hdmi_1`. */
  id: string;
  kind: PortKind;
  owner: PortOwner;
  /** Router ports: the internet side (WAN) or the home network (LAN). */
  role?: 'wan' | 'lan';
}

/** A free cable end the student plugs in. `from`: the device it hangs from (or null for a loose cable). */
export interface CableEnd {
  id: string;
  cable: string;
  kind: PortKind;
}

export interface CableDef {
  id: string;
  kind: PortKind;
  /** Device holding the other end (already connected), null for a loose two-ended cable. */
  from: 'monitor' | 'keyboard' | 'mouse' | 'speakers' | 'socket' | null;
  /** Free ends to plug. */
  ends: readonly string[];
}

export type ScenarioId = 'pc' | 'ethernet';

export interface Scenario {
  id: ScenarioId;
  ports: readonly PortDef[];
  cables: readonly CableDef[];
  /** A graphics card is fitted: the monitor belongs in its outputs, not the board's. */
  discreteGpu: boolean;
}

/** Why a plug was refused (locale `connect.why.<reason>`). */
export type PlugReason = 'shape' | 'igpu' | 'wan' | 'occupied' | 'sameDevice';

export interface Mistake {
  end: string;
  port: string;
  reason: PlugReason;
}

export interface PlugState {
  /** Free end id → port id it is plugged into. */
  plugged: Readonly<Record<string, string>>;
  mistakes: readonly Mistake[];
}

export type PlugResult = { ok: true; state: PlugState } | { ok: false; reason: PlugReason; state: PlugState };
