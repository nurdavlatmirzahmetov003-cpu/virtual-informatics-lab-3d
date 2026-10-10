"""
Per-material report of a raw GLB (to find screens, logos, paintable shells):

    blender --background --factory-startup --python scripts/blender/materials.py -- <file.glb> [...]

For each material: triangles, surface area, bounds (Blender axes), mean normal,
base colour and the texture images it uses.
"""

import sys

import bmesh
import bpy
from mathutils import Vector


def main():
    files = sys.argv[sys.argv.index("--") + 1 :]
    for path in files:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=path)
        stats = {}
        for o in bpy.data.objects:
            if o.type != "MESH":
                continue
            bm = bmesh.new()
            bm.from_mesh(o.data)
            bm.transform(o.matrix_world)
            for f in bm.faces:
                mat = o.data.materials[f.material_index] if f.material_index < len(o.data.materials) else None
                s = stats.setdefault(mat.name if mat else "<none>", {"tris": 0, "area": 0.0, "n": Vector(), "min": Vector((1e9,) * 3), "max": Vector((-1e9,) * 3)})
                s["tris"] += len(f.verts) - 2
                a = f.calc_area()
                s["area"] += a
                s["n"] += f.normal * a
                for v in f.verts:
                    for i in range(3):
                        s["min"][i] = min(s["min"][i], v.co[i])
                        s["max"][i] = max(s["max"][i], v.co[i])
            bm.free()
        print(f"## {path.split('/')[-1]}")
        for name, s in sorted(stats.items(), key=lambda kv: -kv[1]["area"]):
            mat = bpy.data.materials.get(name)
            images, base = [], None
            if mat and mat.node_tree:
                for n in mat.node_tree.nodes:
                    if n.type == "TEX_IMAGE" and n.image:
                        images.append(f"{n.image.name}:{n.image.size[0]}")
                    if n.type == "BSDF_PRINCIPLED":
                        base = [round(c, 2) for c in n.inputs["Base Color"].default_value[:3]]
            n = s["n"].normalized() if s["n"].length else s["n"]
            print(f"  {name:28} tris {s['tris']:6}  area {s['area']:9.4f}  min {[round(v, 3) for v in s['min']]} max {[round(v, 3) for v in s['max']]}  normal {[round(v, 2) for v in n]}  base {base} img {images}", flush=True)


main()
