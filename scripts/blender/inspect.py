"""
Inspect raw GLBs before writing a pipeline config:

    blender --background --factory-startup --python scripts/blender/inspect.py -- <out_dir> <file.glb> [...]

Per model: a 2×2 render (front = -Y, back = +Y, top, three-quarter; Blender axes)
with textures, bounds, top-level groups with triangle counts and materials, and
the images (name, size) so logos in textures can be found and edited.
"""

import json
import os
import sys

import bpy
from mathutils import Vector

VIEWS = {"front": Vector((0, -1, 0.15)), "back": Vector((0, 1, 0.15)), "top": Vector((0.001, -0.001, 1)), "iso": Vector((0.9, -1.3, 0.8))}


def group_of(o):
    a = o
    while a.parent is not None and a.parent.name not in ("Sketchfab_model", "RootNode", "root", "GLTF_SceneRootNode") and not a.parent.name.lower().endswith((".fbx", ".obj", ".gltf", ".glb")):
        a = a.parent
    return a.name


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    out_dir, files = argv[0], argv[1:]
    os.makedirs(out_dir, exist_ok=True)
    for path in files:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=path)
        name = os.path.splitext(os.path.basename(path))[0]
        meshes = [o for o in bpy.data.objects if o.type == "MESH"]
        pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
        mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        groups = {}
        for o in meshes:
            g = groups.setdefault(group_of(o), {"tris": 0, "materials": set()})
            g["tris"] += sum(len(p.vertices) - 2 for p in o.data.polygons)
            g["materials"].update(m.name for m in o.data.materials if m)
        images = [{"name": i.name, "size": list(i.size)} for i in bpy.data.images if i.size[0]]
        info = {
            "name": name,
            "bounds": {"min": [round(v, 4) for v in mn], "max": [round(v, 4) for v in mx]},
            "groups": {k: {"tris": v["tris"], "materials": sorted(v["materials"])} for k, v in sorted(groups.items(), key=lambda kv: -kv[1]["tris"])[:40]},
            "materials": sorted({m.name for o in meshes for m in o.data.materials if m}),
            "images": images,
        }
        with open(os.path.join(out_dir, name + ".json"), "w", encoding="utf-8") as f:
            json.dump(info, f, indent=1, ensure_ascii=False)

        scene = bpy.context.scene
        scene.render.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light = "STUDIO"
        scene.display.shading.color_type = "TEXTURE"
        scene.render.resolution_x, scene.render.resolution_y = 420, 320
        scene.render.image_settings.file_format = "JPEG"
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        scene.collection.objects.link(cam)
        scene.camera = cam
        centre = (mn + mx) / 2
        radius = max((mx - mn).length / 2, 1e-6)
        cam.data.clip_start, cam.data.clip_end = radius * 0.01, radius * 30
        for view, d in VIEWS.items():
            cam.location = centre + d.normalized() * radius * 2.8
            cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = os.path.join(out_dir, f"{name}__{view}.jpg")
            bpy.ops.render.render(write_still=True)
        print(f"[inspect] {name} size {[round(v, 3) for v in (mx - mn)]} groups {len(groups)} images {len(images)}", flush=True)


main()
