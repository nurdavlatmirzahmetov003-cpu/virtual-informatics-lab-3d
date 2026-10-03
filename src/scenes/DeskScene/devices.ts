import { Vector3 } from 'three';
import { MONITOR, KEYBOARD, MOUSE, PC } from './layout';
import { storyRig } from './storyRig';

export type DeviceId = 'setup' | 'monitor' | 'keyboard' | 'mouse' | 'pc';
export const DEVICES: readonly DeviceId[] = ['setup', 'monitor', 'keyboard', 'mouse', 'pc'];
export const DEVICE_DISTANCE: Record<DeviceId, number> = { setup: 2.65, monitor: 1.35, keyboard: 0.7, mouse: 0.31, pc: 1.05 };
export function deviceCenter(id: DeviceId, out = new Vector3()) {
  if (id === 'monitor') return out.set(MONITOR.position[0], MONITOR.position[1] + 0.25, MONITOR.position[2]);
  if (id === 'keyboard') return out.set(KEYBOARD.position[0], KEYBOARD.position[1] + 0.017 + storyRig.keyboardLift, KEYBOARD.position[2]);
  if (id === 'mouse') return out.set(MOUSE.position[0], MOUSE.position[1] + 0.02 + storyRig.mouseLift, MOUSE.position[2]);
  if (id === 'pc') return out.set(PC.position[0], PC.position[1] + PC.size[1] / 2, PC.position[2]);
  return out.set(0, 0.94, 0);
}
