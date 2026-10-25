"""
Top view of a board / card GLB with its slot and socket markers drawn as red
dots, to check that each marker sits on the real socket or slot (V4 §1.2):

    blender --background --factory-startup --python scripts/blender/check-markers.py -- <out_dir> <file.glb> [...]
"""

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
        red = bpy.data.materials.new("marker")
        red.diffuse_color = (1, 0, 0, 1)
        for o in [o for o in bpy.data.objects if o.type == "EMPTY" and o.name.startswith(("socket_", "slot_", "header_24", "header_eps"))]:
            p = o.matrix_world.translation
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.004, location=(p.x, p.y, mx.z + 0.01))
            bpy.context.object.data.materials.append(red)
        scene = bpy.context.scene
        scene.render.engine = "BLENDER_WORKBENCH"
        scene.display.shading.light = "FLAT"
        scene.display.shading.color_type = "MATERIAL"
        for m in bpy.data.materials:
            if m is not red and m.node_tree and m.node_tree.nodes.get("Principled BSDF"):
                m.diffuse_color = m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
        scene.display.shading.color_type = "TEXTURE"
        red.use_nodes = False
        scene.render.resolution_x, scene.render.resolution_y = 900, 900
        scene.render.image_settings.file_format = "PNG"
        cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
        scene.collection.objects.link(cam)
        scene.camera = cam
        cam.data.type = "ORTHO"
        cam.data.ortho_scale = max(mx.x - mn.x, mx.y - mn.y) * 1.05
        c = (mn + mx) / 2
        cam.location = (c.x, c.y, mx.z + 1)
        cam.rotation_euler = (0, 0, 0)
        print(f"[markers] {name} centre {c.x:.5f} {c.y:.5f} scale {cam.data.ortho_scale:.5f} min {mn.x:.4f} {mn.y:.4f} max {mx.x:.4f} {mx.y:.4f}", flush=True)
        scene.render.filepath = os.path.join(out_dir, f"{name}__markers.png")
        bpy.ops.render.render(write_still=True)


main()
