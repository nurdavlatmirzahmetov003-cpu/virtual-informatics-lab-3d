import { useMemo } from 'react';
import { resolveBuild } from '@/lib/studio/build';
import { checkCompatibility, hasErrors } from '@/lib/studio/compatibility';
import { estimatePower } from '@/lib/studio/power';
import { priceBuild } from '@/lib/studio/pricing';
import { useStudioStore } from '@/store/studioStore';

/** Derived view of the current configuration: products, price, power and compatibility. */
export function useStudioBuild() {
  const build = useStudioStore((s) => s.build);
  const budget = useStudioStore((s) => s.budget);
  return useMemo(() => {
    const resolved = resolveBuild(build);
    const issues = checkCompatibility(resolved);
    return {
      resolved,
      price: priceBuild(resolved, budget),
      power: estimatePower(resolved),
      issues,
      blocked: hasErrors(issues),
      empty: Object.keys(resolved).length === 0,
    };
  }, [build, budget]);
}
