import type { ComponentProps } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { Texture } from 'three';
import { ModelLoader } from '@/components/3d/ModelLoader';
import { useDisposable } from '@/hooks/useDisposable';
import { tubeAlong } from '@/lib/three/geometry';
import { productUrl } from './zoneData';


type LoaderProps = Omit<ComponentProps<typeof ModelLoader>, 'url'>;

/** A catalog product model (real size, standing on y = 0, front +Z). Fails quietly. */
export function Product({ product, ...props }: { product: string } & LoaderProps) {
  return <ModelLoader url={productUrl(product)} fallback={null} {...props} />;
}

/** A thin display: bezel slab and a glowing screen (share one wallpaper texture per zone). */
export function ScreenPanel({ width, height, depth = 0.025, bezel = 0.012, glow = 0.9, texture }: { width: number; height: number; depth?: number; bezel?: number; glow?: number; texture: Texture }) {
  const wallpaper = texture;
  return (
    <group>
      <RoundedBox args={[width, height, depth]} radius={Math.min(0.012, depth / 2.2)} smoothness={3} castShadow>
        <meshStandardMaterial color="#111318" metalness={0.4} roughness={0.35} />
      </RoundedBox>
      <mesh position-z={depth / 2 + 0.0008}>
        <planeGeometry args={[width - bezel * 2, height - bezel * 2]} />
        <meshStandardMaterial color="#000" emissive="#ffffff" emissiveMap={wallpaper} emissiveIntensity={glow} roughness={0.15} metalness={0} />
      </mesh>
    </group>
  );
}

/** A cable as a tube through the given points (m). */
export function Cable({ points, radius = 0.004, color = '#15171c' }: { points: Array<[number, number, number]>; radius?: number; color?: string }) {
  const geo = useDisposable(() => tubeAlong(points, radius), [JSON.stringify(points), radius]);
  return (
    <mesh geometry={geo} castShadow>
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}
