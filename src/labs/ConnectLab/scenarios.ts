import type { CableDef, CableEnd, PortDef, PortKind, Scenario, ScenarioId } from './types';

const port = (owner: PortDef['owner'], kind: PortKind, n: number, role?: PortDef['role']): PortDef => ({ id: `${owner}.${kind}_${n}`, kind, owner, ...(role ? { role } : {}) });

/**
 * The PC on the desk, seen from behind. The ports are those of the showcase
 * build's models (V2-2b markers): the motherboard's rear I/O, the graphics
 * card's outputs and the PSU's mains inlet.
 */
export const PC_SCENARIO: Scenario = {
  id: 'pc',
  discreteGpu: true,
  ports: [
    ...[1, 2, 3, 4].map((n) => port('motherboard', 'usb_a', n)),
    port('motherboard', 'usb_c', 1),
    port('motherboard', 'hdmi', 1),
    port('motherboard', 'displayport', 1),
    port('motherboard', 'ethernet', 1),
    port('motherboard', 'audio_3_5', 1),
    ...[1, 2, 3].map((n) => port('gpu', 'displayport', n)),
    port('gpu', 'hdmi', 1),
    port('psu', 'power_ac', 1),
  ],
  cables: [
    { id: 'monitor', kind: 'hdmi', from: 'monitor', ends: ['monitor'] },
    { id: 'keyboard', kind: 'usb_a', from: 'keyboard', ends: ['keyboard'] },
    { id: 'mouse', kind: 'usb_a', from: 'mouse', ends: ['mouse'] },
    { id: 'speakers', kind: 'audio_3_5', from: 'speakers', ends: ['speakers'] },
    { id: 'power', kind: 'power_ac', from: 'socket', ends: ['power'] },
  ],
};

/** A laptop and a router on the desk; one loose Ethernet cable with two plugs. */
export const ETHERNET_SCENARIO: Scenario = {
  id: 'ethernet',
  discreteGpu: false,
  ports: [
    port('laptop', 'usb_c', 1),
    port('laptop', 'hdmi', 1),
    port('laptop', 'ethernet', 1),
    port('laptop', 'usb_a', 1),
    port('laptop', 'audio_3_5', 1),
    port('router', 'ethernet', 0, 'wan'),
    ...[1, 2, 3, 4].map((n) => port('router', 'ethernet', n, 'lan')),
    port('router', 'dc_in', 1),
  ],
  cables: [{ id: 'patch', kind: 'ethernet', from: null, ends: ['patch.a', 'patch.b'] }],
};

export const SCENARIOS: Readonly<Record<ScenarioId, Scenario>> = { pc: PC_SCENARIO, ethernet: ETHERNET_SCENARIO };

export function endsOf(s: Scenario): CableEnd[] {
  return s.cables.flatMap((c: CableDef) => c.ends.map((id) => ({ id, cable: c.id, kind: c.kind })));
}

export const portById = (s: Scenario, id: string): PortDef | undefined => s.ports.find((p) => p.id === id);
export const endById = (s: Scenario, id: string): CableEnd | undefined => endsOf(s).find((e) => e.id === id);
