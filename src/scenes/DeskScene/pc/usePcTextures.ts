import { useDisposable } from '@/hooks/useDisposable';
import {
  brushedMetalTexture,
  labelTexture,
  pcbTexture,
  perforatedTexture,
  smudgeTexture,
} from '@/lib/three/proceduralTextures';

/** Detail maps shared by all PC components (created once, disposed with the case). */
export function usePcTextures() {
  return useDisposable(
    () => ({
      brushed: brushedMetalTexture([1, 1]),
      perforated: perforatedTexture([7, 14]),
      vent: perforatedTexture([5, 9]),
      fineMesh: perforatedTexture([3, 3]),
      smudge: smudgeTexture(),
      pcb: pcbTexture('#14181d', 512, 640, 3),
      pcbGreen: pcbTexture('#1d3a2a', 256, 256, 9),
      pcbSsd: pcbTexture('#0f1216', 512, 160, 5),
      cpuLabel: labelTexture(['VIL-8C', '8 CORES · 16 THREADS', 'SAMPLE CPU'], { w: 256, h: 256, bg: '#9da2aa', accent: '#9da2aa' }),
      ssdLabel: labelTexture(['NVMe SSD 1 TB', 'PCIe 4.0 x4 · M.2 2280', 'Virtual Informatics Lab']),
      psuLabel: labelTexture(['750 W', 'Fully modular · Gold efficiency', 'AC 220–240 V  50 Hz'], { w: 512, h: 256 }),
    }),
    [],
  );
}

export type PcTextures = ReturnType<typeof usePcTextures>;
