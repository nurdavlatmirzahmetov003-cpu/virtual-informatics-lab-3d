"""
Contact-sheet thumbnails of raw GLBs (Workbench, no textures needed to judge shape):

    blender --background --factory-startup --python scripts/blender/thumbnails.py -- <out_dir> <file.glb> [...]

Prints one line per model: triangles, size (m, as authored), materials, and logo-like
material / object names (logo, brand, text) to check before use.
"""

import os
import re
import sys

import bpy
from mathutils import Vector

LOGO = re.compile(r"logo|brand|text|decal|label|sticker", re.I)


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    out_dir, files = argv[0], argv[1:]
    os.makedirs(out_dir, exist_ok=True)
    for path in files:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=path)
        meshes = [o for o in bpy.data.objects if o.type == "MESH"]
        tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in meshes)
        pts = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
        mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        size = mx - mn
        mats = {m.name for o in meshes for m in o.data.materials if m}
        logos = sorted({n for n in mats | {o.name for o in meshes} if LOGO.search(n)})[:6]
        scene = bpy.context.scene
        scene.render.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light = "STUDIO"
        scene.display.shading.color_type = "TEXTURE"
        scene.display.shading.show_cavity = True
        scene.render.resolution_x, scene.render.resolution_y = 480, 360
        scene.render.image_settings.file_format = "JPEG"
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        scene.collection.objects.link(cam)
        centre = (mn + mx) / 2
        radius = max(size.length / 2, 1e-6)
        cam.location = centre + Vector((0.9, -1.4, 0.8)).normalized() * radius * 3.0
        cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
        cam.data.clip_end = radius * 20
        cam.data.clip_start = radius * 0.01
        scene.camera = cam
        name = os.path.splitext(os.path.basename(path))[0]
        scene.render.filepath = os.path.join(out_dir, name + ".jpg")
        bpy.ops.render.render(write_still=True)
        print(f"[thumb] {name} | {tris} tris | {size.x:.3f} x {size.y:.3f} x {size.z:.3f} | {len(mats)} mats | logos: {logos}", flush=True)


main()
