"""
Builds two lab devices that have no freely licensed model (0.37), from
primitives with bevels — the project's own models (CC0):

    blender --background --factory-startup --python scripts/blender/make-lab-devices.py -- assets-src/bitlab

  dev-scanner-src.glb       flatbed A4 scanner, lid a little open, glass bed,
                            glowing scan bar, control buttons
  dev-access-point-src.glb  Wi-Fi ceiling access point with its LED ring,
                            on a small display stand (as shown in the lab)

Coordinates below are scene metres (glTF: +Y up, +Z front); `box()` and
`cyl()` convert them to Blender axes (front −Y, Z up). Real size; base on y = 0.
Then: configs/products/dev-*.json through the pipeline, and
`npm run assets:optimize -- products dev-scanner dev-access-point`.
"""

import math
import os
import sys

import bpy


def srgb(hex_):
    c = [int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


def material(name, hex_, rough=0.45, metal=0.0, emission=None, strength=4.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*srgb(hex_), 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emission:
        p.inputs["Emission Color"].default_value = (*srgb(emission), 1)
        p.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        p.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    return m


class Builder:
    def __init__(self):
        self.pieces = {}

    def add(self, o, mat, bevel=0.0):
        if bevel:
            b = o.modifiers.new("bevel", "BEVEL")
            b.width = bevel
            b.segments = 3
            b.limit_method = "ANGLE"
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.modifier_apply(modifier="bevel")
        o.data.materials.append(mat)
        self.pieces.setdefault(mat, []).append(o)
        return o

    def box(self, x0, x1, y0, y1, z0, z1, mat, bevel=0.0015, rot_x=0.0, pivot=None):
        """Axis-aligned box in scene coordinates; `rot_x` tilts it about an X axis through `pivot` (y, z)."""
        bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, -(z0 + z1) / 2, (y0 + y1) / 2))
        o = bpy.context.object
        o.scale = (x1 - x0, z1 - z0, y1 - y0)
        bpy.ops.object.transform_apply(scale=True)
        self.add(o, mat, min(bevel, min(x1 - x0, y1 - y0, z1 - z0) * 0.45))
        if rot_x and pivot:
            py, pz = pivot
            bpy.context.scene.cursor.location = (0, -pz, py)
            bpy.ops.object.select_all(action="DESELECT")
            o.select_set(True)
            bpy.context.view_layer.objects.active = o
            bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
            o.rotation_euler[0] = rot_x
            bpy.ops.object.transform_apply(rotation=True)
        return o

    def cyl(self, r, y0, y1, x, z, mat, verts=48, bevel=0.0):
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=y1 - y0, vertices=verts, location=(x, -z, (y0 + y1) / 2))
        return self.add(bpy.context.object, mat, bevel)

    def torus(self, r, t, y, x, z, mat):
        bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=t, major_segments=64, minor_segments=8, location=(x, -z, y))
        return self.add(bpy.context.object, mat)

    def join(self, prefix):
        for mat, objs in self.pieces.items():
            bpy.ops.object.select_all(action="DESELECT")
            for o in objs:
                o.select_set(True)
            bpy.context.view_layer.objects.active = objs[0]
            bpy.ops.object.join()
            bpy.context.object.name = f"{prefix}_{mat.name.split('_', 1)[1].lower()}"
            bpy.ops.object.shade_auto_smooth(angle=0.6)


def scanner(out):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    body = material("Scan_Body", "#2b2f37", 0.42, 0.1)
    lid = material("Scan_Lid", "#e9ebef", 0.38, 0.05)
    glass = material("Scan_Glass", "#15212c", 0.04, 0.3)
    dark = material("Scan_Dark", "#111318", 0.6, 0.2)
    light = material("Scan_Light", "#f2fbff", 0.2, 0.0, emission="#bff3ff", strength=5)
    b = Builder()
    W, H, D = 0.43, 0.062, 0.30
    # body with a slight wedge: the front edge lower for the control panel
    b.box(-W / 2, W / 2, 0, H - 0.012, -D / 2, D / 2, body, 0.008)
    b.box(-W / 2 + 0.004, W / 2 - 0.004, H - 0.013, H - 0.006, -D / 2 + 0.004, D / 2 - 0.05, body, 0.004)
    # glass bed and its dark frame, the scan bar under the glass
    b.box(-0.165, 0.165, H - 0.0062, H - 0.0055, -0.12, 0.075, glass, 0.0005)
    b.box(-0.168, 0.168, H - 0.0058, H - 0.0052, -0.012, -0.004, light, 0.0002)
    # control panel on the front: power button with LED, two scan buttons, a small display
    b.box(-0.17, 0.17, H - 0.013, H - 0.011, D / 2 - 0.045, D / 2 - 0.006, dark, 0.002)
    for i, x in enumerate((0.11, 0.135, 0.16)):
        b.cyl(0.0065, H - 0.012, H - 0.008, x, D / 2 - 0.025, lid if i else body, 24, 0.0008)
    b.cyl(0.002, H - 0.0085, H - 0.0078, 0.11, D / 2 - 0.025, light, 12)
    b.box(-0.15, -0.07, H - 0.0112, H - 0.0104, D / 2 - 0.038, D / 2 - 0.014, glass, 0.0005)
    # feet
    for sx in (-1, 1):
        for sz in (-1, 1):
            b.cyl(0.009, -0.002, 0.002, sx * (W / 2 - 0.03), sz * (D / 2 - 0.03), dark, 16)
    # lid, opened about 16° on two hinges at the back
    hinge = (H - 0.004, -D / 2 + 0.006)
    b.box(-W / 2 + 0.002, W / 2 - 0.002, H - 0.004, H + 0.012, -D / 2 + 0.002, D / 2 - 0.046, lid, 0.006, rot_x=-math.radians(16), pivot=hinge)
    b.box(-0.2, 0.2, H - 0.0045, H - 0.0035, -D / 2 + 0.01, D / 2 - 0.06, dark, 0.001, rot_x=-math.radians(16), pivot=hinge)
    for sx in (-1, 1):
        b.box(sx * 0.13 - 0.018, sx * 0.13 + 0.018, H - 0.012, H + 0.006, -D / 2 - 0.004, -D / 2 + 0.014, dark, 0.003)
    b.join("scanner")
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, "dev-scanner-src.glb"), export_format="GLB", export_apply=True, export_yup=True)


def access_point(out):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    shell = material("AP_Shell", "#f3f4f6", 0.32, 0.0)
    face = material("AP_Face", "#e7e9ed", 0.25, 0.0)
    dark = material("AP_Dark", "#2a2d34", 0.55, 0.3)
    led = material("AP_Led", "#e8fbff", 0.2, 0.0, emission="#38bdf8", strength=6)
    stand = material("AP_Stand", "#3a3f4b", 0.35, 0.6)
    b = Builder()
    # a display stand: weighted base, a short post and a cradle that holds the access point at 60°
    b.cyl(0.07, 0, 0.012, 0, 0, stand, 48, 0.003)
    b.cyl(0.008, 0.012, 0.09, 0, 0, stand, 16)
    tilt = math.radians(60)
    cradle_y = 0.12
    # the access point itself, built flat (face up) then tilted towards the visitor
    ap_parts = []
    ap_parts.append(b.cyl(0.1, -0.017, 0.012, 0, 0, shell, 96, 0.01))
    ap_parts.append(b.cyl(0.092, 0.012, 0.0165, 0, 0, face, 96, 0.003))
    ap_parts.append(b.torus(0.026, 0.0026, 0.0168, 0, 0, led))
    ap_parts.append(b.cyl(0.0045, 0.0165, 0.0175, 0, 0, led, 24))
    # mounting bracket and the PoE port underneath
    ap_parts.append(b.cyl(0.055, -0.024, -0.017, 0, 0, dark, 48, 0.002))
    ap_parts.append(b.box(-0.009, 0.009, -0.0265, -0.0235, -0.008, 0.008, dark, 0.0005))
    # tilt the whole access point about the cradle, keeping the parts where they are relative to each other
    pivot = bpy.data.objects.new("pivot", None)
    bpy.context.scene.collection.objects.link(pivot)
    for o in ap_parts:
        o.parent = pivot
    pivot.rotation_euler[0] = tilt
    pivot.location = (0, -0.012, cradle_y + 0.02)
    bpy.context.view_layer.update()
    for o in ap_parts:
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    bpy.data.objects.remove(pivot)
    # the cradle arms
    for sx in (-1, 1):
        b.box(sx * 0.03 - 0.004, sx * 0.03 + 0.004, 0.085, 0.13, -0.012, 0.012, stand, 0.002)
    b.join("access_point")
    bpy.ops.export_scene.gltf(filepath=os.path.join(out, "dev-access-point-src.glb"), export_format="GLB", export_apply=True, export_yup=True)


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    os.makedirs(out, exist_ok=True)
    scanner(out)
    access_point(out)
    print(f"[lab-devices] wrote {out}")


main()
