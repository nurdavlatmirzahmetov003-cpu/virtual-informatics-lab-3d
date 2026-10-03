import type { PartId } from '@/scenes/DeskScene/pc/parts';

export const LAB_PARTS: readonly PartId[] = ['motherboard','cpu','ram','ssd','cooler','psu','gpu','fans'];
export type InstallId = PartId | 'cables';
const requires: Record<InstallId, readonly InstallId[]> = {
  motherboard: [], cpu: ['motherboard'], ram: ['motherboard'], ssd: ['motherboard'],
  cooler: ['cpu','ram'], psu: [], gpu: ['motherboard','psu'], fans: [], cables: LAB_PARTS,
};
export function missingBefore(id: InstallId, installed: readonly InstallId[]) {
  return requires[id].filter(p => !installed.includes(p));
}
export function canInstall(id: InstallId, installed: readonly InstallId[]) {
  return !installed.includes(id) && missingBefore(id,installed).length === 0;
}
export function assemblyCoverage(installed: readonly InstallId[]) {
  return [...LAB_PARTS,'cables'].filter(p => installed.includes(p as InstallId)).length / 9;
}
