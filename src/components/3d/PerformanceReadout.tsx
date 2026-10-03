import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

/** Opt-in development readout; no hidden application inspection is needed for QA. */
export function PerformanceReadout({ onSample, onMeasureReady }: { onSample: (text: string) => void; onMeasureReady: (measure: () => string) => void }) {
  const sample = useRef({ elapsed: 0, frames: 0 });
  const get = useThree(s => s.get);
  useEffect(() => {
    onMeasureReady(() => {
      const { gl, scene, camera } = get();
      gl.info.reset(); gl.render(scene, camera);
      const stats = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
      const start = performance.now();
      for (let i = 0; i < 20; i++) gl.render(scene, camera);
      gl.getContext().readPixels(0, 0, 1, 1, gl.getContext().RGBA, gl.getContext().UNSIGNED_BYTE, new Uint8Array(4));
      const meshes: Record<string, number> = {};
      scene.traverse(obj => {
        if (!(obj as { isMesh?: boolean }).isMesh) return;
        let parent = obj;
        while (parent.parent && !parent.name.startsWith('asset:')) parent = parent.parent;
        const name = parent.name.startsWith('asset:') ? parent.name : 'scene';
        meshes[name] = (meshes[name] ?? 0) + 1;
      });
      return JSON.stringify({ ...stats, msPerFrame: +((performance.now() - start) / 20).toFixed(2), meshes });
    });
  }, [get, onMeasureReady]);
  useFrame(({ gl }, delta) => {
    sample.current.elapsed += delta; sample.current.frames++;
    if (sample.current.elapsed < 1) return;
    onSample(`${Math.round(sample.current.frames / sample.current.elapsed)} fps · ${gl.info.render.calls} calls · ${gl.info.render.triangles.toLocaleString('en')} triangles · ${gl.info.memory.textures} textures`);
    sample.current.elapsed = 0; sample.current.frames = 0;
  });
  return null;
}
