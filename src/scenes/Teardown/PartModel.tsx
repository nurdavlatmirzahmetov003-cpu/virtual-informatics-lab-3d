/** A model part (useModelParts) rendered as the content of a teardown part. */
import { useMemo } from 'react';
import type { Vec3 } from '@/lib/teardown/timeline';
import type { ModelPart } from './modelParts';

/**
 * A model part as content of a teardown part: turned, scaled, centred on the
 * part's origin. `copy` for a second instance of the same part (shares the
 * geometry and materials).
 */
export function PartModel({ part, rot = [0, 0, 0], order = 'XYZ', scale = 1, at = [0, 0, 0], copy = false }: { part: ModelPart; rot?: Vec3; order?: 'XYZ' | 'YXZ'; scale?: number; at?: Vec3; copy?: boolean }) {
  const object = useMemo(() => (copy ? part.object.clone(true) : part.object), [part, copy]);
  return (
    <group position={[...at]} rotation={[...rot, order]} scale={scale}>
      <primitive object={object} />
    </group>
  );
}
