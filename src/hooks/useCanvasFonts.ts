import { useEffect, useState } from 'react';
import { canvasFontsReady } from '@/lib/fonts';

let loaded = false;

/**
 * 0 until the site fonts (with their Kazakh subsets) are usable, then 1.
 * Put it in the deps of a canvas texture so it is redrawn with the real font.
 */
export function useCanvasFonts(): number {
  const [ready, setReady] = useState(loaded ? 1 : 0);
  useEffect(() => {
    if (loaded) return;
    let alive = true;
    void canvasFontsReady().then(() => {
      loaded = true;
      if (alive) setReady(1);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}
