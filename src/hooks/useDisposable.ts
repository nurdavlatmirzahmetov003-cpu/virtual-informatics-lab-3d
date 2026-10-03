import { useEffect, useMemo, type DependencyList } from 'react';

interface Disposable {
  dispose(): void;
}

/**
 * Creates GPU resources (geometries, textures, materials) once per `deps`
 * and disposes them when they are replaced or the component unmounts.
 * Accepts a single disposable or a record of them.
 */
export function useDisposable<T extends Disposable | Record<string, Disposable>>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
  const value = useMemo(factory, deps);
  useEffect(
    () => () => {
      if (typeof (value as Disposable).dispose === 'function') (value as Disposable).dispose();
      else Object.values(value as Record<string, Disposable>).forEach((d) => d.dispose());
    },
    [value],
  );
  return value;
}
