/**
 * [PLACEHOLDER] Procedural 27" QHD monitor: thin-bezel panel, rear housing,
 * height-adjustable stand, emissive screen with the lab wallpaper, bias light
 * and screen light spill. Replace with an optimised GLB.
 */
import { canvasFontsReady } from '@/lib/fonts';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { CanvasTexture, SRGBColorSpace, type Group } from 'three';
import { useDisposable } from '@/hooks/useDisposable';
import { useQualityPreset } from '@/hooks/useQualityPreset';
import { extrudeFlat, extrudeFront, roundedRectShape, tubeAlong } from '@/lib/three/geometry';
import { brushedMetalTexture, drawWallpaper } from '@/lib/three/proceduralTextures';
import { MONITOR } from '../layout';
import { storyRig } from '../storyRig';

const PANEL = { w: 0.613, h: 0.357, depth: 0.011 };
const SCREEN = { w: 0.597, h: 0.336, offsetY: 0.0035 };
const Y = MONITOR.panelCenterY;

export function Monitor() {
  const preset = useQualityPreset();
  const group = useRef<Group>(null);

  const res = useDisposable(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    drawWallpaper(canvas);
    const wallpaper = new CanvasTexture(canvas);
    wallpaper.colorSpace = SRGBColorSpace;
    wallpaper.anisotropy = 8;
    return {
      wallpaper,
      brushed: brushedMetalTexture([2, 2]),
      base: extrudeFlat(roundedRectShape(0.27, 0.19, 0.035), 0.012, { bevel: 0.003 }),
      neck: extrudeFlat(roundedRectShape(0.064, 0.026, 0.011), 0.29, { bevel: 0.003 }),
      panel: extrudeFront(roundedRectShape(PANEL.w, PANEL.h, 0.006), PANEL.depth, { bevel: 0.0015 }),
      cable: tubeAlong(
        [
          [0.0, Y - 0.06, -0.05],
          [0.0, 0.2, -0.105],
          [0.01, 0.08, -0.11],
          [0.03, 0.004, -0.16],
          [0.08, 0.004, -0.24],
        ],
        0.0032,
      ),
    };
  }, []);

  // Fonts load asynchronously; repaint the wallpaper once they are ready.
  useEffect(() => {
    let cancelled = false;
    canvasFontsReady().then(() => {
        if (cancelled) return;
        drawWallpaper(res.wallpaper.image as HTMLCanvasElement);
        res.wallpaper.needsUpdate = true;
      });
    return () => {
      cancelled = true;
    };
  }, [res.wallpaper]);

  useFrame(() => {
    if (group.current) group.current.rotation.y = storyRig.monitorYaw;
  });

  const aluminium = (
    <meshStandardMaterial
      color="#3a3d44"
      metalness={0.85}
      roughness={0.32}
      roughnessMap={res.brushed}
      bumpMap={res.brushed}
      bumpScale={0.15}
    />
  );

  return (
    <group position={[...MONITOR.position]}>
      <group ref={group}>
        {/* stand */}
        <mesh geometry={res.base} position-z={-0.03} castShadow receiveShadow>
          {aluminium}
        </mesh>
        <mesh geometry={res.neck} position={[0, 0.011, -0.085]} rotation-x={-0.06} castShadow>
          {aluminium}
        </mesh>
        <RoundedBox args={[0.09, 0.05, 0.03]} radius={0.008} position={[0, Y - 0.02, -0.06]} castShadow>
          <meshStandardMaterial color="#1a1b20" metalness={0.4} roughness={0.5} />
        </RoundedBox>
        <mesh geometry={res.cable} castShadow>
          <meshStandardMaterial color="#0d0e11" roughness={0.6} />
        </mesh>

        {/* rear housing */}
        <RoundedBox args={[0.46, 0.27, 0.038]} radius={0.016} smoothness={5} position={[0, Y - 0.005, -0.03]} castShadow>
          <meshStandardMaterial color="#16171c" metalness={0.15} roughness={0.55} />
        </RoundedBox>
        {/* bias light strip on the back (faces the wall) */}
        <mesh position={[0, Y + 0.02, -0.0505]}>
          <boxGeometry args={[0.36, 0.006, 0.002]} />
          <meshStandardMaterial color="#000" emissive="#5fd7ff" emissiveIntensity={3} toneMapped={false} />
        </mesh>

        {/* panel + bezel */}
        <mesh geometry={res.panel} position={[0, Y, -PANEL.depth]} castShadow>
          <meshPhysicalMaterial color="#0a0b0d" roughness={0.42} clearcoat={0.4} clearcoatRoughness={0.3} />
        </mesh>
        {/* screen: emissive image under an anti-glare coating */}
        <mesh position={[0, Y + SCREEN.offsetY, 0.0004]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshStandardMaterial
            color="#000000"
            emissive="#ffffff"
            emissiveMap={res.wallpaper}
            emissiveIntensity={1}
            roughness={0.22}
            metalness={0}
            envMapIntensity={0.6}
          />
        </mesh>
        {/* power LED */}
        <mesh position={[PANEL.w / 2 - 0.03, Y - PANEL.h / 2 + 0.004, 0.0004]}>
          <circleGeometry args={[0.0012, 12]} />
          <meshBasicMaterial color="#9fe9ff" toneMapped={false} />
        </mesh>

        {/* light the screen casts onto keyboard and desk */}
        {preset.areaLights ? (
          <rectAreaLight
            args={['#a8c8ff', 2.2, SCREEN.w, SCREEN.h]}
            position={[0, Y + SCREEN.offsetY, 0.01]}
            rotation-y={Math.PI}
          />
        ) : (
          <pointLight position={[0, Y, 0.25]} color="#a8c8ff" intensity={0.25} distance={1.2} decay={2} />
        )}
      </group>
    </group>
  );
}
