import type { HardwareItem } from '@/data/hardware/types';
import type { ResolvedBuild } from '@/lib/studio/build';
import { estimatePower } from '@/lib/studio/power';
import { formatKZT } from '@/lib/studio/pricing';
import type { AssistantRequest, Explanation } from './types';

const value = (p: HardwareItem | undefined, key: string) => String(p?.specifications.find((s) => s.key === key)?.value ?? '');
const name = (p: HardwareItem) => `${p.brand} ${p.model}`;
const MEMORY_HUNGRY = new Set(['programming', 'design3d', 'streaming']);

/**
 * One short reason per major choice (rendered from `assistant.why.*`), in the
 * order the purpose prioritises: gaming leads with the GPU, study and
 * programming with CPU + RAM + SSD.
 */
export function explainBuild(build: ResolvedBuild, request: AssistantRequest, total: number): Explanation[] {
  const out: Explanation[] = [];
  const { cpu, gpu, ram, ssd, monitor, psu } = build;
  const share = (p?: HardwareItem) => (p && total > 0 ? Math.round((p.priceKZT / total) * 100) : 0);
  const gpuFirst = request.purpose === 'gaming' || request.purpose === 'design3d' || request.purpose === 'streaming';

  const gpuLine: Explanation | null = gpu
    ? { key: `gpu.${request.purpose}`, params: { model: name(gpu), vram: value(gpu, 'vram'), share: share(gpu) } }
    : cpu
      ? { key: 'noGpu', params: { model: name(cpu), igpu: value(cpu, 'igpu') } }
      : null;
  const cpuLine: Explanation | null = cpu ? { key: `cpu.${request.purpose}`, params: { model: name(cpu), cores: value(cpu, 'cores'), share: share(cpu) } } : null;

  for (const line of gpuFirst ? [gpuLine, cpuLine] : [cpuLine, gpuLine]) if (line) out.push(line);
  if (ram) out.push({ key: MEMORY_HUNGRY.has(request.purpose) ? 'ram.heavy' : 'ram.normal', params: { model: name(ram), capacity: value(ram, 'capacity') } });
  if (ssd) out.push({ key: 'ssd', params: { model: name(ssd), read: value(ssd, 'read') } });
  if (monitor) out.push({ key: 'monitor', params: { model: name(monitor), hz: value(monitor, 'refresh'), resolution: value(monitor, 'resolution') } });
  if (psu) out.push({ key: 'psu', params: { model: name(psu), watts: psu.compatibility.psuW ?? 0, need: estimatePower(build).requiredW } });
  out.push(
    total <= request.budget
      ? { key: 'budget.fit', params: { total: formatKZT(total), left: formatKZT(request.budget - total) } }
      : { key: 'budget.over', params: { total: formatKZT(total), amount: formatKZT(total - request.budget) } },
  );
  return out;
}
