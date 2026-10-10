import { CanvasTexture, SRGBColorSpace } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { drawWallpaper } from '@/lib/three/proceduralTextures';

/** The site wallpaper as a texture (the home monitor's look); share one per zone. */
export function useWallpaper(width = 1024, height = 640) {
  return useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    drawWallpaper(canvas);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [width, height]);
}
