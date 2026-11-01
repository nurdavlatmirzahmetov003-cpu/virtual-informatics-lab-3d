"""
Lit preview renders of GLBs (V4 §1.1 self-check): EEVEE, soft studio light,
emission on, two views per model.

    blender --background --factory-startup --python scripts/blender/preview.py -- <out_dir> <file.glb> [...]
"""

import math
import os
import sys

import bpy
from mathutils import Vector


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
        scene = bpy.context.scene
        scene.render.engine = "BLENDER_EEVEE"
        scene.render.resolution_x, scene.render.resolution_y = 960, 720
        scene.render.image_settings.file_format = "PNG"
        world = bpy.data.worlds.new("w")
        world.use_nodes = True
        world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.32, 0.34, 0.38, 1)
        world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.8
        scene.world = world
        for loc, e in (((2, -2, 3), 600), ((-3, -1, 1.5), 300), ((0, 3, 2), 250)):
            l = bpy.data.objects.new("l", bpy.data.lights.new("l", "AREA"))
            l.data.energy = e * (mx - mn).length ** 2
            l.data.size = 2 * (mx - mn).length
            scene.collection.objects.link(l)
            c = (mn + mx) / 2
            l.location = c + Vector(loc) * (mx - mn).length
            l.rotation_euler = (c - l.location).to_track_quat("-Z", "Y").to_euler()
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        scene.collection.objects.link(cam)
        scene.camera = cam
        cam.data.lens = 50
        centre = (mn + mx) / 2
        radius = max((mx - mn).length / 2, 1e-6)
        cam.data.clip_start, cam.data.clip_end = radius * 0.01, radius * 40
        views = {"a": Vector((-1.0, -1.25, 0.7)), "b": Vector((1.1, -0.6, -0.5))}
        if len(argv) and os.environ.get("PREVIEW_VIEWS"):
            views = {k: Vector(tuple(float(x) for x in v.split(","))) for k, v in (p.split("=") for p in os.environ["PREVIEW_VIEWS"].split(";"))}
        for view, d in views.items():
            cam.location = centre + d.normalized() * radius * 3.2
            cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
            scene.render.filepath = os.path.join(out_dir, f"{name}__{view}.png")
            bpy.ops.render.render(write_still=True)
        print(f"[preview] {name}", flush=True)


main()
