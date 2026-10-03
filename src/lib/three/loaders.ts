import type { WebGLRenderer } from 'three';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import type { GLTFLoader } from 'three-stdlib';
import { useGLTF } from '@react-three/drei';

const base = import.meta.env.BASE_URL;

/** Decoders are copied from node_modules by scripts/copy-decoders.mjs. */
export const DRACO_DECODER_PATH = `${base}decoders/draco/`;
export const BASIS_TRANSCODER_PATH = `${base}decoders/basis/`;

let ktx2: KTX2Loader | undefined;
let ktx2Owner: WebGLRenderer | undefined;

/** One KTX2 loader per renderer (it owns a worker pool). */
export function getKTX2Loader(gl: WebGLRenderer): KTX2Loader {
  if (!ktx2 || ktx2Owner !== gl) {
    ktx2?.dispose();
    ktx2 = new KTX2Loader().setTranscoderPath(BASIS_TRANSCODER_PATH).detectSupport(gl);
    ktx2Owner = gl;
  }
  return ktx2;
}

/** Extends drei's GLTFLoader with KTX2/Basis texture support. */
export function withKTX2(gl: WebGLRenderer) {
  return (loader: GLTFLoader) => {
    // three-stdlib's GLTFLoader typing predates three's KTX2Loader; runtime API matches.
    (loader as unknown as { setKTX2Loader: (l: KTX2Loader) => void }).setKTX2Loader(getKTX2Loader(gl));
  };
}

/** Warm the cache for a GLB before the scene that needs it mounts. */
export function preloadModel(url: string) {
  useGLTF.preload(url, DRACO_DECODER_PATH, true);
}
