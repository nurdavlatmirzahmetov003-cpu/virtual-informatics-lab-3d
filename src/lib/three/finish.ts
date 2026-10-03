import { Color, type Mesh, type MeshStandardMaterial, type Object3D, type Texture } from 'three';

/** A paint finish: base colour plus the metal/roughness of the new coating. */
export interface PaintFinish {
  color: string;
  metalness?: number;
  roughness?: number;
}

interface Original {
  color: Color;
  map: Texture | null;
  metalness: number;
  roughness: number;
  emissiveIntensity: number;
}

const tmp = new Color();

/**
 * Repaints the body materials of a loaded model while keeping its surface
 * detail: normal, roughness, metalness and AO maps stay untouched, only the
 * albedo is swapped for a solid coat. `null` restores the original look.
 *
 * Skipped: emissive parts (LEDs, screens), transparent parts (glass) and
 * materials flagged `userData.shared`. Originals are cached on each material
 * so the call is idempotent.
 */
export function applyPaint(root: Object3D, paint: PaintFinish | null, options: { onlyDark?: boolean; preserveMarks?: boolean } = {}) {
  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of materials) {
      const mat = m as MeshStandardMaterial;
      if (!mat.isMeshStandardMaterial || mat.userData.shared || mat.transparent || mat.name === 'Screen') continue;
      // On the keyboard the emissive atlas contains the key legends, not a
      // separate LED body. It must participate in the contrasting paint mask.
      if ((mat.emissiveMap || mat.emissive.getHex() !== 0) && !options.preserveMarks) continue;
      const original = (mat.userData.paintOriginal ??= {
        color: mat.color.clone(),
        map: mat.map,
        metalness: mat.metalness,
        roughness: mat.roughness,
        emissiveIntensity: mat.emissiveIntensity,
      }) as Original;
      // Light trims (logos, silver accents) keep their colour on a dark body.
      if (options.onlyDark && original.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.6 && !original.map) continue;
      const hadMap = mat.map !== null;
      // Keyboard legends share the body texture. Recolour in the material
      // shader, retaining the texture's contrast instead of erasing its ink.
      if (options.preserveMarks && original.map) {
        const marks = (mat.userData.paintMarks ??= {
          active: { value: 0 }, color: { value: new Color() }, ink: { value: 0 }, installed: false,
        });
        if (!marks.installed) {
          const compile = mat.onBeforeCompile;
          mat.onBeforeCompile = (shader, renderer) => {
            compile.call(mat,shader,renderer);
            shader.uniforms.vilPaintActive = marks.active;
            shader.uniforms.vilPaintColor = marks.color;
            shader.uniforms.vilPaintInk = marks.ink;
            shader.fragmentShader = 'uniform float vilPaintActive;\nuniform vec3 vilPaintColor;\nuniform float vilPaintInk;\n' + shader.fragmentShader.replace('#include <map_fragment>', `
              #include <map_fragment>
              #ifdef USE_MAP
                if (vilPaintActive > 0.5) {
                  vec3 originalTexel = texture2D(map, vMapUv).rgb;
                  float mark = smoothstep(0.4, 0.85, max(originalTexel.r, max(originalTexel.g, originalTexel.b)));
                  diffuseColor.rgb = mix(vilPaintColor, vec3(vilPaintInk), mark);
                }
              #endif
            `);
          };
          mat.customProgramCacheKey = () => 'vil-keyboard-paint-v1';
          marks.installed = true;
          mat.needsUpdate = true;
        }
        marks.active.value = paint ? 1 : 0;
        mat.emissiveIntensity = paint ? 0 : original.emissiveIntensity;
        if (paint) {
          marks.color.value.set(paint.color);
          marks.ink.value = marks.color.value.getHSL({h:0,s:0,l:0}).l > .6 ? .008 : .92;
        }
      }
      if (paint) {
        mat.color.copy(tmp.set(paint.color));
        mat.map = options.preserveMarks ? original.map : null;
        if (paint.metalness !== undefined) mat.metalness = paint.metalness;
        if (paint.roughness !== undefined) mat.roughness = paint.roughness;
      } else {
        mat.color.copy(original.color);
        mat.map = original.map;
        mat.metalness = original.metalness;
        mat.roughness = original.roughness;
      }
      if (hadMap !== (mat.map !== null)) mat.needsUpdate = true;
    }
  });
}
