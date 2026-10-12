import { endById, endsOf, portById } from './scenarios';
import type { PlugReason, PlugResult, PlugState, Scenario } from './types';

export const emptyPlugState = (): PlugState => ({ plugged: {}, mistakes: [] });

/**
 * Why `end` may not go into `port`, or null when it fits and is right:
 * - shape — the plug does not physically fit (HDMI into DisplayPort, USB into RJ-45…);
 * - igpu — a monitor into the motherboard's video output while a graphics card is fitted;
 * - wan — a computer into the router's WAN (internet) port;
 * - occupied — something is already plugged in;
 * - sameDevice — both ends of one cable into the same device.
 */
export function plugProblem(s: Scenario, state: PlugState, endId: string, portId: string): PlugReason | null {
  const end = endById(s, endId);
  const port = portById(s, portId);
  if (!end || !port) return 'shape';
  if (Object.entries(state.plugged).some(([e, p]) => p === portId && e !== endId)) return 'occupied';
  if (end.kind !== port.kind) return 'shape';
  if (s.discreteGpu && port.owner === 'motherboard' && (port.kind === 'hdmi' || port.kind === 'displayport')) return 'igpu';
  if (port.role === 'wan') return 'wan';
  const other = endsOf(s).find((e) => e.cable === end.cable && e.id !== endId);
  const otherPort = other && state.plugged[other.id] ? portById(s, state.plugged[other.id]) : undefined;
  if (otherPort && otherPort.owner === port.owner) return 'sameDevice';
  return null;
}

/** Plugs an end in, or refuses with the reason (counted as a mistake). */
export function tryPlug(s: Scenario, state: PlugState, endId: string, portId: string): PlugResult {
  const reason = plugProblem(s, state, endId, portId);
  if (reason) return { ok: false, reason, state: { ...state, mistakes: [...state.mistakes, { end: endId, port: portId, reason }] } };
  return { ok: true, state: { ...state, plugged: { ...state.plugged, [endId]: portId } } };
}

export function unplug(state: PlugState, endId: string): PlugState {
  if (!(endId in state.plugged)) return state;
  const plugged = { ...state.plugged };
  delete plugged[endId];
  return { ...state, plugged };
}

/** The port an end is in, if any. */
export const portOfEnd = (s: Scenario, state: PlugState, endId: string) => (state.plugged[endId] ? portById(s, state.plugged[endId]) : undefined);
