"""
Builds the BitLab Aero case (0.37): the project's own universal white
mid-tower, modelled from primitives so its inside matches the scene's part
anchors exactly (src/scenes/DeskScene/pc/constants.ts, fits.ts).

    blender --background --factory-startup --python scripts/blender/make-bitlab-aero.py -- assets-src/bitlab/case-bitlab-aero-src.glb

Then the usual product pipeline (configs/products/case-bitlab-aero.json) and
`npm run assets:optimize -- products case-bitlab-aero`.

Coordinates below are the scene's case-local metres (glTF: +Y up, +Z front,
glass side −X); `box()` converts them to Blender axes (front −Y, Z up).
The glass side is left open: the scene draws its own tempered-glass pane.
Licence: own work of the project (CC0).
"""

import sys

import bpy

W, H, D = 0.23, 0.47, 0.45
T = 0.004  # sheet steel
FEET = 0.012
FLOOR = -H / 2 + FEET + T  # top of the bottom panel: -0.219
TOP_IN = H / 2 - T  # 0.231
FRONT_IN = D / 2 - 0.008  # front frame and mesh are 8 mm deep: 0.217
REAR_IN = -D / 2 + T  # -0.221
TRAY = 0.105  # tray face (motherboard back + 6 mm standoff)
SHROUD_TOP = -0.115
SHROUD_FRONT = 0.12


def material(name, color, rough=0.45, metal=0.1, emission=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if emission:
        p.inputs["Emission Color"].default_value = (*emission, 1)
        p.inputs["Emission Strength"].default_value = 6.0
    return m


def srgb(hex_):
    c = [int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


# a fresh scene first: materials created before it would be wiped with it
bpy.ops.wm.read_factory_settings(use_empty=True)
WHITE = material("Aero_White", srgb("#eceef2"), 0.42, 0.12)
SHADE = material("Aero_Shade", srgb("#d9dce2"), 0.5, 0.1)
DARK = material("Aero_Dark", srgb("#2a2d34"), 0.62, 0.3)
LIGHT = material("Aero_Light", srgb("#f4f8ff"), 0.3, 0.0, emission=srgb("#dfeaff"))

pieces = {WHITE: [], SHADE: [], DARK: [], LIGHT: []}


def box(x0, x1, y0, y1, z0, z1, mat=WHITE, bevel=0.0012):
    """Axis-aligned slab in scene case coordinates."""
    cx, cy, cz = (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, -cz, cy))
    o = bpy.context.object
    o.scale = (x1 - x0, z1 - z0, y1 - y0)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = o.modifiers.new("bevel", "BEVEL")
        b.width = min(bevel, (min(x1 - x0, y1 - y0, z1 - z0) / 2) * 0.9)
        b.segments = 3
        b.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier="bevel")
    o.data.materials.append(mat)
    pieces[mat].append(o)
    return o


def cylinder_x(r, x0, x1, y, z, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=x1 - x0, vertices=32, location=((x0 + x1) / 2, -z, y), rotation=(0, 1.5708, 0))
    o = bpy.context.object
    o.data.materials.append(mat)
    pieces[mat].append(o)


def cylinder_y(r, y0, y1, x, z, mat, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=y1 - y0, vertices=verts, location=(x, -z, (y0 + y1) / 2))
    o = bpy.context.object
    o.data.materials.append(mat)
    pieces[mat].append(o)


def ring_z(r_out, r_in, z0, z1, x, y, mat):
    bpy.ops.mesh.primitive_cylinder_add(radius=r_out, depth=z1 - z0, vertices=48, location=(x, -(z0 + z1) / 2, y), rotation=(1.5708, 0, 0))
    o = bpy.context.object
    bpy.ops.mesh.primitive_cylinder_add(radius=r_in, depth=(z1 - z0) * 3, vertices=48, location=(x, -(z0 + z1) / 2, y), rotation=(1.5708, 0, 0))
    cut = bpy.context.object
    m = o.modifiers.new("cut", "BOOLEAN")
    m.object = cut
    m.operation = "DIFFERENCE"
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier="cut")
    bpy.data.objects.remove(cut)
    o.data.materials.append(mat)
    pieces[mat].append(o)


def build():
    x0, x1 = -W / 2, W / 2
    bottom = -H / 2 + FEET
    # feet: rounded pads under the corners
    for sx in (-1, 1):
        for sz in (-1, 1):
            cylinder_y(0.017, -H / 2, bottom, sx * (W / 2 - 0.03), sz * (D / 2 - 0.045), DARK)
    # outer frame: bottom, top, rear, right side (+X), all white steel with soft edges
    box(x0, x1, bottom, bottom + T, -D / 2, D / 2, WHITE, 0.002)
    box(x0, x1, H / 2 - T, H / 2, -D / 2, D / 2, WHITE, 0.004)
    box(x0, x1, bottom, H / 2, -D / 2, -D / 2 + T, WHITE, 0.002)
    box(x1 - T, x1, bottom, H / 2, -D / 2, D / 2, WHITE, 0.003)
    # thin frame posts on the glass side, so the open side reads as a frame around the glass
    box(x0, x0 + 0.006, bottom, H / 2, D / 2 - 0.016, D / 2 - 0.008, SHADE, 0.001)
    box(x0, x0 + 0.006, bottom, H / 2, -D / 2, -D / 2 + 0.01, SHADE, 0.001)
    box(x0, x0 + 0.006, H / 2 - 0.012, H / 2, -D / 2, D / 2, SHADE, 0.001)
    box(x0, x0 + 0.006, bottom, bottom + 0.012, -D / 2, D / 2, SHADE, 0.001)

    # top: a recessed vent with slots over the radiator / exhaust area
    box(x0 + 0.03, x1 - 0.03, H / 2 - 0.0012, H / 2 + 0.0004, -D / 2 + 0.05, D / 2 - 0.09, DARK, 0.002)
    for i in range(22):
        z = -D / 2 + 0.06 + i * 0.0135
        box(x0 + 0.036, x1 - 0.036, H / 2 + 0.0004, H / 2 + 0.0012, z, z + 0.006, WHITE, 0.0004)
    # front I/O on the top front edge: power button, USB-C, 2× USB-A, audio
    cylinder_y(0.0075, H / 2, H / 2 + 0.0025, x1 - 0.04, D / 2 - 0.035, WHITE)
    cylinder_y(0.0045, H / 2 + 0.0024, H / 2 + 0.0028, x1 - 0.04, D / 2 - 0.035, LIGHT)
    box(x1 - 0.068, x1 - 0.059, H / 2 - 0.0005, H / 2 + 0.0008, D / 2 - 0.042, D / 2 - 0.028, DARK, 0.0006)
    for k, dx in enumerate((0.08, 0.096)):
        box(x1 - dx - 0.0065, x1 - dx + 0.0065, H / 2 - 0.0005, H / 2 + 0.0008, D / 2 - 0.04, D / 2 - 0.03, DARK, 0.0005)
    cylinder_y(0.003, H / 2 - 0.0005, H / 2 + 0.0008, x1 - 0.115, D / 2 - 0.035, DARK)

    # front: white frame around a dark mesh with thin white slats, light bar along the glass edge
    fx0, fx1, fy0, fy1 = x0 + 0.03, x1 - 0.016, bottom + 0.022, H / 2 - 0.022
    box(x0 + 0.004, x1, bottom, fy0, D / 2 - 0.006, D / 2, WHITE, 0.003)
    box(x0 + 0.004, x1, fy1, H / 2, D / 2 - 0.006, D / 2, WHITE, 0.003)
    box(x0 + 0.004, fx0, fy0, fy1, D / 2 - 0.006, D / 2, WHITE, 0.002)
    box(fx1, x1, fy0, fy1, D / 2 - 0.006, D / 2, WHITE, 0.002)
    box(fx0, fx1, fy0, fy1, D / 2 - 0.008, D / 2 - 0.005, DARK, 0.0008)
    n = 30
    for i in range(n):
        y = fy0 + 0.006 + i * (fy1 - fy0 - 0.012) / (n - 1)
        box(fx0, fx1, y - 0.0018, y + 0.0018, D / 2 - 0.0045, D / 2 - 0.0015, SHADE, 0.0006)
    box(x0 + 0.012, x0 + 0.019, fy0 + 0.02, fy1 - 0.02, D / 2 - 0.0008, D / 2 + 0.0016, LIGHT, 0.002)
    # small BitLab mark near the bottom of the front: a bit (0) and a dot (1)
    ring_z(0.007, 0.0042, D / 2 - 0.0005, D / 2 + 0.0015, 0.04, bottom + 0.011, SHADE)
    cylinder_x(0.0022, 0.05, 0.055, bottom + 0.019, D / 2 + 0.0005, LIGHT)

    # motherboard tray with cable grommets in front of the board
    box(TRAY, TRAY + 0.002, FLOOR, TOP_IN, REAR_IN, D / 2 - 0.02, SHADE, 0.0008)
    for y in (0.15, 0.03, -0.07):
        box(TRAY - 0.0008, TRAY + 0.0004, y - 0.03, y + 0.03, 0.06, 0.08, DARK, 0.006)
    box(TRAY - 0.0008, TRAY + 0.0004, TOP_IN - 0.03, TOP_IN - 0.012, -0.19, -0.13, DARK, 0.006)

    # PSU shroud: top plate, glass-side face with a vent strip, front face
    box(x0 + 0.006, TRAY, SHROUD_TOP - T, SHROUD_TOP, REAR_IN, SHROUD_FRONT, WHITE, 0.0015)
    box(x0 + 0.006, x0 + 0.006 + T, FLOOR, SHROUD_TOP, REAR_IN, SHROUD_FRONT, WHITE, 0.0015)
    box(x0 + 0.006, TRAY, FLOOR, SHROUD_TOP, SHROUD_FRONT - T, SHROUD_FRONT, WHITE, 0.0015)
    for i in range(9):
        z = -0.17 + i * 0.03
        box(x0 + 0.0052, x0 + 0.0062, SHROUD_TOP - 0.06, SHROUD_TOP - 0.03, z, z + 0.016, DARK, 0.0004)
    box(x0 + 0.03, x0 + 0.1, SHROUD_TOP, SHROUD_TOP + 0.0008, -0.16, -0.02, SHADE, 0.0006)  # BitLab plate on the shroud

    # rear: I/O shield cutout, exhaust fan grille, 7 slot covers, PSU opening
    box(0.072, TRAY - 0.004, 0.035, 0.205, -D / 2 - 0.0006, -D / 2 + 0.0006, DARK, 0.0006)
    ring_z(0.058, 0.054, -D / 2 - 0.0008, -D / 2 + 0.0004, 0.0, 0.1125, DARK)
    for r in (0.045, 0.03, 0.015):
        ring_z(r + 0.0015, r, -D / 2 - 0.0008, -D / 2 + 0.0004, 0.0, 0.1125, DARK)
    for i in range(7):
        y = 0.035 - i * 0.0203
        box(-0.07, 0.09, y - 0.0075, y + 0.0075, -D / 2 - 0.0008, -D / 2 + 0.0004, SHADE, 0.0006)
    box(-0.055, 0.085, FLOOR + 0.006, FLOOR + 0.08, -D / 2 - 0.0008, -D / 2 + 0.0004, DARK, 0.002)

    # one mesh per material (fewer draw calls), smooth shading where bevelled
    for mat, objs in pieces.items():
        if not objs:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for o in objs:
            o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        bpy.ops.object.join()
        joined = bpy.context.object
        joined.name = f"aero_{mat.name.split('_')[1].lower()}"
        bpy.ops.object.shade_auto_smooth(angle=0.6)


def main():
    out = sys.argv[sys.argv.index("--") + 1]
    build()
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True)
    print(f"[aero] wrote {out}")


main()
