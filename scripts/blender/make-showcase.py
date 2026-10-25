"""
BitLab showcase hardware (V4 §1.1): own models of the white panoramic build,
at real size in millimetres, with exact slot / socket markers.

    blender --background --factory-startup --python scripts/blender/make-showcase.py -- <what> [...]

<what>: case:<id> (from assets-src/bitlab/case-designs.json), fan, fan-black,
board, gpu, ram, pump, radiator, or all. Output: assets-src/blender/products/
<id>.glb, then `npm run assets:optimize -- products <id> …`.

Run `node scripts/blender/showcase-textures.mjs` and
`node --experimental-strip-types --import ./scripts/test-resolve.mjs scripts/case-designs.mjs`
first. Materials named `Glass` and `RGB` are replaced in the browser (real
glass, animated ARGB); nodes named `rotor*` spin there. Licence: own work of
the project (CC0).
"""

import json
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEX = os.path.join(ROOT, "assets-src", "bitlab", "tex")
OUT = os.path.join(ROOT, "assets-src", "blender", "products")
MM = 0.001


# ── scene and materials ───────────────────────────────────────────────────

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def srgb(hex_):
    c = [int(hex_[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in c)


MATS = {}


def mat(name, color="#ffffff", rough=0.45, metal=0.0, emission=None, strength=4.0, image=None, alpha_image=False, transmission=0.0):
    key = name
    if key in MATS:
        return MATS[key]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*srgb(color), 1)
    p.inputs["Roughness"].default_value = rough
    p.inputs["Metallic"].default_value = metal
    if transmission:
        p.inputs["Transmission Weight"].default_value = transmission
        p.inputs["IOR"].default_value = 1.52
    if emission:
        p.inputs["Emission Color"].default_value = (*srgb(emission), 1)
        p.inputs["Emission Strength"].default_value = strength
    if image:
        img = bpy.data.images.load(os.path.join(TEX, image))
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = img
        nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
        if alpha_image:
            nt.links.new(t.outputs["Color"], p.inputs["Alpha"])
            m.blend_method = "CLIP" if hasattr(m, "blend_method") else None
    MATS[key] = m
    return m


def obj_from_bm(bm, name, material):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material)
    return o


def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    o.select_set(False)


def bevel(o, width, segments=2):
    if width <= 0:
        return o
    b = o.modifiers.new("bevel", "BEVEL")
    b.width = width
    b.segments = segments
    b.limit_method = "ANGLE"
    b.angle_limit = math.radians(40)
    apply_mods(o)
    return o


def bbox(x0, x1, y0, y1, z0, z1, material, name="part", bev=0.0006, seg=2):
    """Axis-aligned box in Blender coordinates (metres)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co.x = x0 if v.co.x < 0 else x1
        v.co.y = y0 if v.co.y < 0 else y1
        v.co.z = z0 if v.co.z < 0 else z1
    o = obj_from_bm(bm, name, material)
    side = min(x1 - x0, y1 - y0, z1 - z0)
    return bevel(o, min(bev, side * 0.45), seg)


def sbox(x0, x1, y0, y1, z0, z1, material, name="part", bev=0.0006, seg=2):
    """Box in scene coordinates (glTF: +Y up, +Z front) → Blender (x, −z, y)."""
    return bbox(x0, x1, -z1, -z0, y0, y1, material, name, bev, seg)


def cylinder(r, depth, at, axis="Z", material=None, name="cyl", verts=48, bev=0.0, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    o = obj_from_bm(bm, name, material)
    if axis == "X":
        o.rotation_euler = (0, math.pi / 2, 0)
    elif axis == "Y":
        o.rotation_euler = (math.pi / 2, 0, 0)
    o.location = at
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    o.select_set(False)
    if bev:
        bevel(o, bev)
    return o


def ring(r_in, r_out, depth, at, axis="Y", material=None, name="ring", verts=96):
    """Annulus with u = angle (0…1) for the ARGB shader, v = radius."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    rows = []
    for k in range(verts):
        a = 2 * math.pi * k / verts
        c, s = math.cos(a), math.sin(a)
        ring_v = []
        for rr in (r_in, r_out):
            for d in (-depth / 2, depth / 2):
                if axis == "Y":
                    ring_v.append(bm.verts.new((c * rr, d, s * rr)))
                elif axis == "X":
                    ring_v.append(bm.verts.new((d, c * rr, s * rr)))
                else:
                    ring_v.append(bm.verts.new((c * rr, s * rr, d)))
        rows.append(ring_v)
    for k in range(verts):
        a, b = rows[k], rows[(k + 1) % verts]
        # 0: in/-d, 1: in/+d, 2: out/-d, 3: out/+d
        for quad in ((a[1], b[1], b[3], a[3]), (a[2], b[2], b[0], a[0]), (a[3], b[3], b[2], a[2]), (a[0], b[0], b[1], a[1])):
            f = bm.faces.new(quad)
            for li, loop in enumerate(f.loops):
                kk = k + (1 if li in (1, 2) else 0)
                loop[uv].uv = (kk / verts, 0.5)
    o = obj_from_bm(bm, name, material)
    o.location = at
    return o


def plane(x0, x1, y0, y1, z, material, name="decal", flip=False, uv_rect=(0, 0, 1, 1)):
    """Textured rectangle in the Blender XY plane at height z (normal +Z, or −Z when flipped)."""
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    vs = [bm.verts.new((x0, y0, z)), bm.verts.new((x1, y0, z)), bm.verts.new((x1, y1, z)), bm.verts.new((x0, y1, z))]
    f = bm.faces.new(vs[::-1] if flip else vs)
    u0, v0, u1, v1 = uv_rect
    uvs = [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]
    for loop, v in zip(f.loops, (vs[::-1] if flip else vs)):
        loop[uv].uv = uvs[vs.index(v)]
    return obj_from_bm(bm, name, material)


def rotate_obj(o, euler):
    o.rotation_euler = euler
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    o.select_set(False)
    return o


def move(o, d):
    for v in o.data.vertices:
        v.co += Vector(d)
    return o


def cut(target, cutter):
    """Boolean difference; the cutter is removed."""
    m = target.modifiers.new("cut", "BOOLEAN")
    m.operation = "DIFFERENCE"
    m.solver = "EXACT"
    m.object = cutter
    apply_mods(target)
    bpy.data.objects.remove(cutter)
    return target


def join(objs, name):
    objs = [o for o in objs if o is not None]
    if not objs:
        return None
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    if len(objs) > 1:
        bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    o.name = name
    o.data.name = name
    o.select_set(False)
    return o


def join_by_material(objs, prefix):
    groups = {}
    for o in objs:
        groups.setdefault(o.data.materials[0].name, []).append(o)
    return [join(v, f"{prefix}_{k}") for k, v in groups.items()]


def empty(name, at, parent=None):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.005
    # glTF extras: the optimiser keeps only marker nodes that carry them
    e["port"] = name
    e.location = at
    bpy.context.scene.collection.objects.link(e)
    if parent:
        e.parent = parent
    return e


def export(id_):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, id_ + ".glb")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_extras=True, export_yup=True, export_apply=True, export_texcoords=True, export_normals=True, export_image_format="AUTO")
    tris = sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH")
    print(f"[showcase] {id_}: {tris} triangles → {os.path.relpath(path, ROOT)}", flush=True)


def fan_blades(n, r0, r1, chord0, chord1, pitch0, pitch1, depth, material, axis="Y", sweep=0.55):
    """`n` curved plates around `axis` (Y or X): chord tangential, pitched against the rotation plane, tips swept back."""
    out = []
    for k in range(n):
        bm = bmesh.new()
        rows, cols = 8, 6
        grid = []
        for i in range(rows + 1):
            sp = i / rows
            r = r0 + (r1 - r0) * sp
            chord = chord0 + (chord1 - chord0) * sp
            pitch = math.radians(pitch0 + (pitch1 - pitch0) * sp)
            base = 2 * math.pi * k / n + sweep * sp
            row_v = []
            for j in range(cols + 1):
                c = (j / cols - 0.5) * chord
                ang = base + c / r
                ax = c * math.tan(pitch) * 0.55
                ax = max(-depth / 2, min(depth / 2, ax))
                if axis == "Y":
                    row_v.append(bm.verts.new((math.cos(ang) * r, ax, math.sin(ang) * r)))
                else:
                    row_v.append(bm.verts.new((ax, math.cos(ang) * r, math.sin(ang) * r)))
            grid.append(row_v)
        for i in range(rows):
            for j in range(cols):
                bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
        o = obj_from_bm(bm, "blade", material)
        so = o.modifiers.new("solid", "SOLIDIFY")
        so.thickness = 0.0011
        apply_mods(o)
        out.append(o)
    return out


# ── 120 mm ARGB fan (axis along Blender −Y = glTF +Z, air leaves towards glTF −Z) ──

def make_fan(id_, body="#f1f2f5", blades="#f6f7f9"):
    reset()
    white = mat("FanFrame", body, 0.5, 0.0)
    blade = mat("FanBlade", blades, 0.38, 0.0)
    rgb = mat("RGB", "#ffffff", 0.4, 0.0, emission="#c48bff")
    s = 0.12
    t = 0.025
    frame = bbox(-s / 2, s / 2, -t / 2, t / 2, -s / 2, s / 2, white, "frame", bev=0.0035, seg=3)
    hole = cylinder(0.0585, t * 1.5, (0, 0, 0), "Y", white, "hole", verts=96)
    cut(frame, hole)
    # corner mounting pads (screw holes)
    for sx in (-1, 1):
        for sz in (-1, 1):
            c = cylinder(0.0022, t * 1.2, (sx * 0.0525, 0, sz * 0.0525), "Y", white, "screw", verts=16)
            cut(frame, c)
    # motor strut ring + 4 spokes at the back
    strut = cylinder(0.021, 0.004, (0, t / 2 - 0.003, 0), "Y", white, "strut", verts=48)
    spokes = [rotate_obj(bbox(-0.0016, 0.0016, t / 2 - 0.004, t / 2 - 0.0005, 0.018, 0.059, white, "spoke"), (0, math.radians(45 + 90 * k), 0)) for k in range(4)]
    frame = join([frame, strut, *spokes], "frame")
    # ARGB: rings around the opening on both faces and light strips on two sides
    rings = [ring(0.0585, 0.0605, 0.0016, (0, y, 0), "Y", rgb, "ring_f") for y in (-t / 2 - 0.0005, t / 2 + 0.0005)]
    strips = [bbox(sx * s / 2 - 0.0012, sx * s / 2 + 0.0012, -t / 2 + 0.003, t / 2 - 0.003, -s / 2 + 0.014, s / 2 - 0.014, rgb, "strip", bev=0.0005) for sx in (-1, 1)]
    # strips get u along their length
    for st in strips:
        uvl = st.data.uv_layers.new(name="UVMap")
        for li, loop in enumerate(st.data.loops):
            z = st.data.vertices[loop.vertex_index].co.z
            uvl.data[li].uv = ((z + s / 2) / s, 0.5)
    light = join([*rings, *strips], "ring")
    # rotor: hub + 9 swept, pitched blades, origin on the fan axis
    parts = [cylinder(0.0195, 0.014, (0, -0.001, 0), "Y", blade, "hub", verts=48, bev=0.001)]
    parts += fan_blades(9, 0.0185, 0.0565, 0.016, 0.034, 50, 26, 0.011, blade)
    hub_ring = ring(0.0125, 0.0165, 0.0012, (0, -0.0081, 0), "Y", rgb, "hub_ring", verts=48)
    rotor = join(parts, "rotor")
    hub_light = join([hub_ring], "rotor_light")
    hub_light.parent = rotor
    root = empty("fan", (0, 0, 0))
    for o in (frame, light, rotor):
        o.parent = root
    export(id_)


# ── BitLab AERO motherboard (canonical: component side +Z, top edge +X, I/O edge +Y) ──

def make_board():
    reset()
    L = json.load(open(os.path.join(ROOT, "assets-src", "bitlab", "board-layout.json"), encoding="utf-8"))
    A, B = L["size"]

    def P(a, b, h=0.0):
        return ((a - A / 2) * MM, (b - B / 2) * MM, h * MM)

    def ab(a0, a1, b0, b1, h0, h1, m, name="c", bev=0.4):
        return bbox((a0 - A / 2) * MM, (a1 - A / 2) * MM, (b0 - B / 2) * MM, (b1 - B / 2) * MM, h0 * MM, h1 * MM, m, name, bev=bev * MM)

    pcb_white = mat("PCB", "#f1f2f4", 0.55, 0.0)
    silk = mat("PCB_Silk", "#ffffff", 0.5, 0.0, image="pcb.png")
    plastic = mat("SlotPlastic", "#dfe2e7", 0.5, 0.0)
    latch = mat("Latch", "#f6f7f9", 0.45, 0.0)
    steel = mat("SlotArmor", "#c9cdd3", 0.28, 1.0)
    alu = mat("Heatsink", "#d3d7dd", 0.32, 1.0)
    cover = mat("HeatsinkCover", "#eef0f3", 0.4, 0.05)
    dark = mat("Connector", "#c3c7ce", 0.55, 0.0)
    pins = mat("Pins", "#d6b16a", 0.3, 1.0)
    black = mat("Black", "#20242b", 0.6, 0.0)
    logo_io = mat("LogoIO", "#ffffff", 0.4, 0.0, image="logo_io.png")
    logo_hs = mat("LogoHeatsink", "#ffffff", 0.4, 0.0, image="logo_heatsink.png")
    objs = []
    objs.append(ab(0, A, 0, B, 0, 1.6, pcb_white, "pcb", bev=0.3))
    objs.append(plane(-A / 2 * MM, A / 2 * MM, -B / 2 * MM, B / 2 * MM, 1.62 * MM, silk, "silk"))
    # AM5 socket: load plate frame around the CPU, lever on the rear side
    sa, sb = L["socket"]["a"], L["socket"]["b"]
    frame = ab(sa - 26, sa + 26, sb - 26, sb + 26, 1.6, 4.6, steel, "socket", bev=0.6)
    cut(frame, ab(sa - 20.5, sa + 20.5, sb - 20.5, sb + 20.5, 0, 8, steel, "x"))
    objs.append(frame)
    objs.append(ab(sa - 20.5, sa + 20.5, sb - 20.5, sb + 20.5, 1.6, 2.4, black, "land"))
    lever = ab(sa - 24, sa + 24, sb + 27, sb + 29.5, 1.6, 5.4, steel, "lever", bev=0.8)
    lever_hinge = P(sa + 24, sb + 28.2, 3.5)
    # DIMM slots with latches (the latches open and snap shut in the browser)
    latch_top, latch_bottom = [], []
    for b in L["dimm"]["b"]:
        a = L["dimm"]["a"]
        objs.append(ab(a - 70, a + 70, b - 3.1, b + 3.1, 1.6, 8.8, plastic, "dimm", bev=0.5))
        latch_top.append(ab(a + 70, a + 74, b - 3.4, b + 3.4, 1.6, 11, latch, "latch", bev=0.6))
        latch_bottom.append(ab(a - 74, a - 70, b - 3.4, b + 3.4, 1.6, 11, latch, "latch", bev=0.6))
    # PCIe slots (x16 armoured)
    for s in L["pcie"]:
        a, b = s["a"], s["b"]
        n = 89 if s["x16"] else 25
        b0 = b - 44.5 if s["x16"] else b - 12.5
        objs.append(ab(a - 3.6, a + 3.6, b0, b0 + n, 1.6, 12.4, steel if s["x16"] else plastic, "pcie", bev=0.6))
        pl = ab(a - 3.9, a + 3.9, b0 - 7, b0, 1.6, 13, latch, "pcie_latch", bev=0.8)
        if s is L["pcie"][0]:
            pl.name = "tmp_pcie_latch"
            pcie_latch, pcie_hinge = pl, P(a, b0, 1.6)
        else:
            objs.append(pl)
    # M.2: connector + standoff of slot 1, heatsink over slot 2
    m1 = L["m2"][0]
    objs.append(ab(m1["a"] - 11, m1["a"] + 11, m1["b"] + 40, m1["b"] + 45, 1.6, 4.6, black, "m2_conn"))
    objs.append(cylinder(2.2 * MM, 3 * MM, P(m1["a"], m1["b"] - 40, 3.1), "Z", steel, "m2_standoff", verts=16))
    m2 = L["m2"][1]
    objs.append(ab(m2["a"] - 12, m2["a"] + 12, m2["b"] - 42, m2["b"] + 42, 1.6, 9.5, cover, "m2_heatsink", bev=1.5))
    # VRM heatsinks: brushed blocks with white covers, I/O shroud with the logo
    objs.append(ab(264, 300, 96, 222, 1.6, 30, alu, "vrm_top", bev=1.2))
    objs.append(ab(263, 301, 95, 223, 30, 36, cover, "vrm_top_cover", bev=2))
    objs.append(ab(168, 262, 160, 222, 1.6, 31, alu, "vrm_rear", bev=1.2))
    objs.append(ab(167, 263, 159, 223, 31, 37, cover, "vrm_rear_cover", bev=2))
    for k in range(10):  # fin grooves on the top bank
        objs.append(ab(266 + k * 3.4, 267.6 + k * 3.4, 94.6, 96.2, 4, 29, alu, "fin", bev=0.2))
    objs.append(ab(150, 303, 223, 244, 1.6, 43.5, cover, "io_shroud", bev=2.5))
    objs.append(plane((158 - A / 2) * MM, (296 - A / 2) * MM, (225 - B / 2) * MM, (242 - B / 2) * MM, 43.6 * MM, logo_io, "io_logo", uv_rect=(0, 0, 1, 1)))
    # chipset heatsink with lettering, audio shroud
    objs.append(ab(22, 96, 18, 100, 1.6, 10, cover, "chipset", bev=2))
    objs.append(plane((26 - A / 2) * MM, (92 - A / 2) * MM, (40 - B / 2) * MM, (78 - B / 2) * MM, 10.05 * MM, logo_hs, "chipset_logo"))
    objs.append(ab(4, 70, 200, 241, 1.6, 12, cover, "audio", bev=2))
    # power connectors, SATA, front panel, CMOS battery
    a24 = L["atx24"]
    objs.append(ab(a24["a"] - 26, a24["a"] + 26, 1, 16, 1.6, 17, dark, "atx24", bev=0.6))
    for e in L["eps"]:
        objs.append(ab(e["a"] - 9, e["a"] + 6, e["b"] - 6.5, e["b"] + 6.5, 1.6, 15, dark, "eps", bev=0.6))
    objs.append(ab(52, 88, 1, 13, 1.6, 9.5, dark, "sata", bev=0.4))
    objs.append(ab(4, 24, 8, 16, 1.6, 9, dark, "fpanel", bev=0.3))
    objs.append(cylinder(10 * MM, 3.2 * MM, P(104, 60, 3.2), "Z", steel, "cmos", verts=40))
    # rear I/O: dark port block flush with the I/O edge, under the shroud
    objs.append(ab(160, 300, 236, 244, 1.6, 22, black, "io_ports", bev=0.3))
    # gold pins on the 24-pin / EPS tops
    objs.append(ab(a24["a"] - 24, a24["a"] + 24, 3, 14, 17, 17.2, pins, "pins", bev=0))
    join_by_material(objs, "board")
    # moving parts: each its own node with its origin on the hinge (latches of one end share a hinge line)
    lt, lb = L["dimm"]["a"] + 70, L["dimm"]["a"] - 70
    mid_b = sum(L["dimm"]["b"]) / 4
    for name, o, hinge in (("socket_lever", lever, lever_hinge), ("dimm_latch_top", join(latch_top, "tmp_latch_top"), P(lt, mid_b, 1.6)), ("dimm_latch_bottom", join(latch_bottom, "tmp_latch_bottom"), P(lb, mid_b, 1.6)), ("pcie_latch", pcie_latch, pcie_hinge)):
        # an empty on the hinge carries the mesh: the optimiser's quantisation re-centres meshes, not empties
        pivot = empty(name, hinge)
        move(o, (-hinge[0], -hinge[1], -hinge[2]))
        o.name = name + "_mesh"
        o.parent = pivot
    for i, b in enumerate(L["dimm"]["b"], start=1):
        empty(f"slot_dimm_{i}", P(L["dimm"]["a"], b, 2.8))
    empty("socket_cpu_1", P(sa, sb, 4.8))
    empty("slot_pcie_x16_1", P(L["pcie"][0]["a"], L["pcie"][0]["b"], 4.8))
    empty("slot_m2_1", P(m1["a"], m1["b"], 1.8))
    empty("header_24pin_1", P(a24["a"], a24["b"], 17))
    empty("header_eps_8pin_1", P(L["eps"][0]["a"], L["eps"][0]["b"], 15))
    # rear I/O (Connect Lab plugs into these): [type, a (mm from the bottom edge), h (height)]
    io = [("usb_a", 1, 286, 7), ("usb_a", 2, 286, 15), ("usb_a", 3, 274, 7), ("usb_a", 4, 274, 15), ("usb_c", 1, 262, 9), ("hdmi", 1, 248, 8), ("displayport", 1, 234, 8), ("ethernet", 1, 214, 10), ("audio_3_5", 1, 176, 9)]
    hole = mat("PortHole", "#0d0f13", 0.7, 0.0)
    ports = []
    for kind, n, a, h in io:
        w, t = {"usb_a": (13, 5.5), "usb_c": (9, 3.4), "hdmi": (15, 5.5), "displayport": (16, 6), "ethernet": (16, 13.5), "audio_3_5": (6, 6)}[kind]
        ports.append(ab(a - w / 2, a + w / 2, 243.4, 244.2, h - t / 2 + 1.6, h + t / 2 + 1.6, hole, "port", bev=0.2))
        empty(f"port_{kind}_{n}", P(a, 244, h + 1.6))
    join(ports, "board_ports")
    export("mb-bitlab-aero")


# ── BitLab AERO graphics card (canonical: on its PCIe edge −Z, bracket +Y, fans −X) ──

def make_gpu():
    reset()
    shroud = mat("Shroud", "#f2f3f6", 0.36, 0.05)
    trim = mat("ShroudTrim", "#d5d9df", 0.3, 0.6)
    back = mat("Backplate", "#ffffff", 0.35, 0.3, image="logo_backplate.png")
    side = mat("CardSide", "#ffffff", 0.4, 0.0, image="logo_gpu_side.png")
    alu = mat("Fins", "#c9ced5", 0.3, 1.0)
    pcb = mat("CardPCB", "#2a2f37", 0.6, 0.0)
    gold = mat("Fingers", "#d9b25f", 0.25, 1.0)
    steel = mat("Bracket", "#cfd3d9", 0.3, 1.0)
    dark = mat("Ports", "#15181d", 0.6, 0.0)
    blade = mat("FanBlade", "#f6f7f9", 0.38, 0.0)
    rgb = mat("RGB", "#ffffff", 0.4, 0.0, emission="#c48bff")
    Y0, Y1 = -0.16, 0.16  # card body (bracket beyond Y1)
    Z1 = 0.128
    objs = []
    objs.append(bbox(0.0, 0.0016, Y0 + 0.004, Y1, 0.0, Z1 - 0.008, pcb, "pcb", bev=0.0003))
    objs.append(bbox(0.0, 0.0016, Y1 - 0.1015 - 0.0445, Y1 - 0.1015 + 0.0445, -0.008, 0.0, gold, "fingers", bev=0.0))
    bp = bbox(0.0035, 0.0062, Y0, Y1 - 0.002, 0.002, Z1, back, "backplate", bev=0.0012)
    uvl = bp.data.uv_layers.new(name="UVMap")
    for li, loop in enumerate(bp.data.loops):
        co = bp.data.vertices[loop.vertex_index].co
        # installed the backplate faces up: text runs towards the case front, its top towards the board
        uvl.data[li].uv = (1 - (co.y - Y0) / (Y1 - Y0), 1 - co.z / Z1)
    objs.append(bp)
    sh = bbox(-0.054, -0.0015, Y0, Y1 - 0.004, 0.004, Z1, shroud, "shroud", bev=0.0035, seg=3)
    for y in (-0.1, 0.0, 0.1):
        cut(sh, cylinder(0.0465, 0.04, (-0.054, y, 0.064), "X", shroud, "hole", verts=72))
    objs.append(sh)
    # chamfered trim lines around the fan openings
    for y in (-0.1, 0.0, 0.1):
        objs.append(ring(0.0465, 0.0485, 0.0015, (-0.0538, y, 0.064), "X", trim, "trim"))
    # heatsink fins visible through the openings and at the card's ends
    for k in range(46):
        y = Y0 + 0.008 + k * 0.0068
        objs.append(bbox(-0.046, -0.004, y, y + 0.0009, 0.008, Z1 - 0.006, alu, "fin", bev=0.0))
    # top edge: lettering + ARGB strip facing the glass, power socket
    objs.append(plane(Y0 + 0.125, Y0 + 0.305, -0.05, -0.014, Z1 + 0.0002, side, "side_logo", uv_rect=(1, 1, 0, 0)))
    side_logo = bpy.data.objects["side_logo"]
    rotate_obj(side_logo, (0, 0, math.pi / 2))
    move(side_logo, (-0.012 - 0.05 + 0.012, 0, 0))
    strip = bbox(-0.0535, -0.049, Y0 + 0.01, Y1 - 0.04, Z1 - 0.0004, Z1 + 0.0012, rgb, "rgb_strip", bev=0.0004)
    uvl = strip.data.uv_layers.new(name="UVMap")
    for li, loop in enumerate(strip.data.loops):
        co = strip.data.vertices[loop.vertex_index].co
        uvl.data[li].uv = ((co.y - Y0) / (Y1 - Y0), 0.5)
    objs.append(strip)
    objs.append(bbox(-0.012, -0.002, Y0 + 0.022, Y0 + 0.042, Z1 - 0.009, Z1 - 0.0005, dark, "power_socket", bev=0.0005))
    # bracket with display outputs and vents
    # flush with the backplate: nothing of the card reaches higher than its backplate
    br = bbox(-0.056, 0.0062, Y1, Y1 + 0.0015, -0.012, Z1 - 0.006, steel, "bracket", bev=0.0003)
    objs.append(br)
    for k, z in enumerate((0.012, 0.03, 0.048, 0.066)):
        objs.append(bbox(-0.006, 0.0, Y1 + 0.0012, Y1 + 0.0018, z, z + 0.011, dark, "port", bev=0.0))
    for k in range(9):
        objs.append(bbox(-0.05 + k * 0.0042, -0.048 + k * 0.0042, Y1 + 0.0012, Y1 + 0.0018, 0.02, 0.1, dark, "vent", bev=0.0))
    join_by_material(objs, "card")
    # three fans, each its own rotor node (spun in the browser)
    for i, y in enumerate((-0.1, 0.0, 0.1), start=1):
        parts = [cylinder(0.014, 0.009, (0, 0, 0), "X", blade, "hub", verts=40, bev=0.0008)]
        parts += fan_blades(11, 0.0135, 0.0445, 0.012, 0.024, 48, 26, 0.008, blade, axis="X", sweep=0.5)
        rotor = join(parts, f"rotor_{i}")
        # the node sits on the fan axis, so it spins in place
        rotor.location = (-0.047, y, 0.064)
    empty("slot_pcie_x16_1", (0.0008, Y1 - 0.1015, -0.008))
    # outputs on the bracket (Connect Lab): three DisplayPort and one HDMI, as the port blocks above
    for i, z in enumerate((0.012, 0.03, 0.048), start=1):
        empty(f"port_displayport_{i}", (-0.003, Y1 + 0.0018, z + 0.0055))
    empty("port_hdmi_1", (-0.003, Y1 + 0.0018, 0.066 + 0.0055))
    empty("header_gpu_power_1", (-0.007, Y0 + 0.032, Z1))
    export("gpu-bitlab-aero")


# ── BitLab white DDR5 RGB stick (canonical: length X, height Z, fingers at Z = 0) ──

def make_ram():
    reset()
    pcb = mat("StickPCB", "#2a2f37", 0.6, 0.0)
    gold = mat("Fingers", "#d9b25f", 0.25, 1.0)
    spreader = mat("Spreader", "#f1f2f5", 0.38, 0.15)
    logo = mat("StickLogo", "#ffffff", 0.4, 0.0, image="logo_ram.png")
    diffuser = mat("RGB", "#ffffff", 0.4, 0.0, emission="#c48bff")
    objs = [bbox(-0.0667, 0.0667, -0.0006, 0.0006, 0.0, 0.031, pcb, "pcb", bev=0.0002)]
    objs.append(bbox(-0.064, 0.064, -0.00065, 0.00065, 0.0, 0.0038, gold, "fingers", bev=0.0))
    for sy in (-1, 1):
        objs.append(bbox(-0.0665, 0.0665, sy * 0.0007 if sy > 0 else -0.0038, 0.0038 if sy > 0 else -0.0007, 0.0045, 0.0385, spreader, "spreader", bev=0.0011))
    objs.append(plane(-0.045, 0.045, 0.0105, 0.0315, 0.0, logo, "logo"))
    lg = bpy.data.objects["logo"]
    rotate_obj(lg, (math.pi / 2, 0, 0))
    move(lg, (0, -0.00385, 0))
    bar = bbox(-0.0655, 0.0655, -0.0034, 0.0034, 0.0385, 0.0432, diffuser, "light", bev=0.0012)
    uvl = bar.data.uv_layers.new(name="UVMap")
    for li, loop in enumerate(bar.data.loops):
        co = bar.data.vertices[loop.vertex_index].co
        uvl.data[li].uv = ((co.x + 0.0655) / 0.131, 0.5)
    objs.append(bar)
    objs.append(bbox(-0.0665, 0.0665, -0.0038, 0.0038, 0.0432, 0.0442, spreader, "cap", bev=0.0004))
    join_by_material(objs, "stick")
    export("ram-bitlab-aero")


# ── AIO pump head (canonical like a cooler: base −Z on the CPU, fittings towards +X) ──

def make_pump():
    reset()
    white = mat("PumpBody", "#f2f3f6", 0.34, 0.05)
    plate = mat("ColdPlate", "#c8a46a", 0.25, 1.0)
    mirror = mat("PumpCap", "#ffffff", 0.08, 0.2, image="logo_pump.png")
    rgb = mat("RGB", "#ffffff", 0.4, 0.0, emission="#c48bff")
    fit = mat("Fitting", "#e9ebef", 0.3, 0.4)
    objs = [bbox(-0.03, 0.03, -0.03, 0.03, 0.0, 0.006, plate, "plate", bev=0.0015)]
    objs.append(bbox(-0.034, 0.034, -0.034, 0.034, 0.006, 0.012, white, "bracket", bev=0.003))
    objs.append(cylinder(0.031, 0.03, (0, 0, 0.027), "Z", white, "body", verts=72, bev=0.0025))
    objs.append(ring(0.0285, 0.0312, 0.0022, (0, 0, 0.0425), "Z", rgb, "ring", verts=96))
    cap = cylinder(0.0285, 0.0012, (0, 0, 0.0426), "Z", mirror, "cap", verts=72)
    uvl = cap.data.uv_layers.new(name="UVMap")
    for li, loop in enumerate(cap.data.loops):
        co = cap.data.vertices[loop.vertex_index].co
        uvl.data[li].uv = (co.x / 0.057 + 0.5, co.y / 0.057 + 0.5)
    objs.append(cap)
    for y in (-0.012, 0.012):
        objs.append(cylinder(0.0055, 0.016, (0.032, y, 0.03), "X", fit, "fitting", verts=24, bev=0.001))
    join_by_material(objs, "pump")
    export("cool-bitlab-aero-360")


# ── ATX PSU (canonical: back +Y, fan down −Z; 150 × 86 × 160 mm) ──

def make_psu():
    reset()
    white = mat("PsuBody", "#f2f3f6", 0.4, 0.15)
    grille = mat("PsuGrille", "#e7e9ed", 0.45, 0.3, image="perforated.png", alpha_image=True)
    dark = mat("PsuSockets", "#20242b", 0.6, 0.0)
    label = mat("PsuLabel", "#ffffff", 0.45, 0.0, image="logo_psu.png")
    blade = mat("FanBlade", "#f6f7f9", 0.38, 0.0)
    W, L, Hh = 0.15, 0.16, 0.086
    body = bbox(-W / 2, W / 2, -L / 2, L / 2, 0, Hh, white, "body", bev=0.003, seg=3)
    # fan opening in the bottom, a white 120 mm fan behind a grille
    cut(body, cylinder(0.058, 0.02, (0, 0, 0), "Z", white, "hole", verts=72))
    objs = [body]
    objs.append(plane(-0.058, 0.058, -0.058, 0.058, 0.0016, grille, "fan_grille", flip=True, uv_rect=(0, 0, 3, 3)))
    objs.append(cylinder(0.018, 0.012, (0, 0, 0.012), "Z", blade, "fan_hub", verts=40))
    objs += [rotate_obj(b, (math.pi / 2, 0, 0)) for b in fan_blades(9, 0.018, 0.055, 0.016, 0.032, 50, 26, 0.009, blade)]
    for b in objs[-9:]:
        move(b, (0, 0, 0.012))
    # back: honeycomb, IEC inlet and switch; front: modular sockets
    # a quarter turn about X takes the plane's y to height z; flipped so it faces out of the back (+Y)
    objs.append(plane(-0.06, 0.045, 0.005, Hh - 0.006, 0, grille, "back_grille", flip=True, uv_rect=(0, 0, 3, 2)))
    bg = bpy.data.objects["back_grille"]
    rotate_obj(bg, (math.pi / 2, 0, 0))
    move(bg, (0, L / 2 + 0.0004, 0))
    objs.append(bbox(0.05, 0.068, L / 2 - 0.001, L / 2 + 0.0008, 0.02, 0.05, dark, "iec", bev=0.001))
    for k, (x, w) in enumerate(((-0.06, 0.03), (-0.025, 0.016), (-0.005, 0.016), (0.015, 0.016), (0.035, 0.016))):
        objs.append(bbox(x, x + w, -L / 2 - 0.0008, -L / 2 + 0.001, 0.012 + (k % 2) * 0.03, 0.03 + (k % 2) * 0.03, dark, "socket", bev=0.0008))
    # side label (+X faces the glass in a classic case, the side panel in a dual-chamber one: both sides)
    for sx in (-1, 1):
        # the same mapping reads correctly on both sides once turned to face ±X
        lab = plane(-0.07, 0.07, 0.006, 0.08, 0, label, "label")
        rotate_obj(lab, (math.pi / 2, 0, math.pi / 2 * sx))
        move(lab, (sx * (W / 2 + 0.0004), 0, 0))
        objs.append(lab)
    join_by_material(objs, "psu")
    empty("port_power_ac_1", (0.059, L / 2 + 0.001, 0.035))
    export("psu-bitlab-aero")


# ── 360 mm radiator (frame of LiquidCooler: length along Blender Y, fans on −Z) ──

def make_radiator():
    reset()
    white = mat("RadTank", "#f1f2f5", 0.38, 0.1)
    fins = mat("RadFins", "#ffffff", 0.45, 0.4, image="fins.png")
    fit = mat("Fitting", "#e9ebef", 0.3, 0.4)
    L = 0.397
    objs = [bbox(-0.06, 0.06, -L / 2 + 0.022, L / 2 - 0.022, -0.0135, 0.0135, white, "frame", bev=0.0015)]
    for sy in (-1, 1):
        objs.append(bbox(-0.062, 0.062, sy * (L / 2 - 0.022) if sy < 0 else L / 2 - 0.022, -L / 2 + 0.022 if sy < 0 else L / 2, -0.016, 0.016, white, "tank", bev=0.003))
    for z in (-0.0137, 0.0137):
        p = plane(-0.056, 0.056, -L / 2 + 0.024, L / 2 - 0.024, z, fins, "fins", flip=z < 0, uv_rect=(0, 0, 8, 1))
        objs.append(p)
    for x in (-0.022, 0.022):
        objs.append(cylinder(0.0055, 0.012, (x, L / 2 + 0.005, -0.004), "Y", fit, "fitting", verts=24, bev=0.001))
    join_by_material(objs, "radiator")
    export("rad-bitlab-360")


# ── cases (from the shared design data) ──────────────────────────────────

def make_case(design, info):
    reset()
    f = design["frame"]
    m = design["mounts"]
    c = design["colors"]
    W, H, D = f["W"], f["H"], f["D"]
    T = 0.004
    body = mat("CaseBody", c["body"], 0.42, 0.08)
    trim = mat("CaseTrim", c["trim"], 0.38, 0.12)
    accent = mat("CaseAccent", c["accent"], 0.35, 0.5)
    dark = mat("CaseDark", "#1b1e24", 0.7, 0.0)
    # grommets match the case: light grey in a white case, black in a dark one
    light_case = sum(int(c["body"][i : i + 2], 16) for i in (1, 3, 5)) > 600
    rubber = mat("Rubber", "#d4d8de" if light_case else "#2a2d33", 0.85, 0.0)
    feet_pad = mat("FootPad", "#2a2d33", 0.85, 0.0)
    glass = mat("Glass", c["glassTint"], 0.03, 0.0, transmission=1.0)
    perf = mat("Perforated", c["body"], 0.45, 0.08, image="perforated.png", alpha_image=True)
    rgb = mat("RGB", "#ffffff", 0.4, 0.0, emission="#c48bff")
    yb, yt = f["bottom"], f["top"]
    objs = []

    def vent(panel, cutter_box, plate_box):
        cut(panel, sbox(*cutter_box, body, "cutter", bev=0.0))
        objs.append(sbox(*plate_box, perf, "vent", bev=0.0))

    # bottom and top panels with fan vents
    bottom = sbox(-W / 2, W / 2, yb, yb + T, -D / 2, D / 2, body, "bottom", bev=0.0015)
    bx = m["fans"]
    bfans = [fan for fan in bx if fan["group"] == "bottom"]
    if bfans:
        x0 = min(fan["p"][0] for fan in bfans) - 0.058
        x1 = max(fan["p"][0] for fan in bfans) + 0.058
        z0 = min(fan["p"][2] for fan in bfans) - 0.058
        z1 = max(fan["p"][2] for fan in bfans) + 0.058
        vent(bottom, (x0, x1, yb - 0.01, yb + 0.01, z0, z1), (x0, x1, yb + T - 0.0012, yb + T - 0.0004, z0, z1))
    objs.append(bottom)
    top = sbox(-W / 2, W / 2, yt - T, yt, -D / 2, D / 2, body, "top", bev=0.0015)
    tfans = [fan for fan in bx if fan["group"] == "top"]
    if tfans:
        x0 = min(fan["p"][0] for fan in tfans) - 0.06
        x1 = max(fan["p"][0] for fan in tfans) + 0.06
        z0 = min(fan["p"][2] for fan in tfans) - 0.06
        z1 = max(fan["p"][2] for fan in tfans) + 0.06
        vent(top, (x0, x1, yt - 0.01, yt + 0.01, z0, z1), (x0, x1, yt - 0.0016, yt - 0.0008, z0, z1))
    objs.append(top)
    # rear panel: I/O window, expansion slots, rear fan, PSU opening
    rear = sbox(-W / 2, W / 2, yb, yt, -D / 2, -D / 2 + T, body, "rear", bev=0.0015)
    corner = m["board"]["corner"]
    io = (corner[0] - 0.047, corner[0] - 0.002, corner[1] - 0.16, corner[1] + 0.002)
    cut(rear, sbox(io[0], io[1], io[2], io[3], -D / 2 - 0.01, -D / 2 + 0.01, body, "cutter", bev=0.0))
    objs.append(sbox(io[0], io[1], io[2], io[3], -D / 2 + 0.0005, -D / 2 + 0.0015, dark, "io_shield", bev=0.0))
    slot1 = corner[1] - info["atxCornerToSlot1"]
    for k in range(m["slots"]["count"]):
        y = slot1 - k * 0.02032
        cut(rear, sbox(corner[0] - 0.118, corner[0] - 0.012, y - 0.0072, y + 0.0072, -D / 2 - 0.01, -D / 2 + 0.01, body, "cutter", bev=0.0))
    for fan in [x for x in bx if x["group"] == "rear"]:
        p = fan["p"]
        cut(rear, sbox(p[0] - 0.055, p[0] + 0.055, p[1] - 0.055, p[1] + 0.055, -D / 2 - 0.01, -D / 2 + 0.01, body, "cutter", bev=0.0))
        objs.append(sbox(p[0] - 0.055, p[0] + 0.055, p[1] - 0.055, p[1] + 0.055, -D / 2 + 0.0012, -D / 2 + 0.002, perf, "rear_vent", bev=0.0))
    psu = m["psu"]
    cut(rear, sbox(psu["min"][0] + 0.004, psu["max"][0] - 0.004, psu["min"][1] + 0.004, psu["max"][1] - 0.006, -D / 2 - 0.01, -D / 2 + 0.01, body, "cutter", bev=0.0))
    objs.append(rear)
    # slot rail: the white strip the card brackets and covers screw onto
    objs.append(sbox(corner[0] - 0.122, corner[0] - 0.008, slot1 - 6.4 * 0.02032 - 0.012, slot1 + 0.012, -D / 2 + T, -D / 2 + T + 0.003, trim, "slot_rail_back", bev=0.0006))
    # right side panel (tray side) with a vent in front of the side fans
    right = sbox(W / 2 - T, W / 2, yb, yt, -D / 2, D / 2, body, "right", bev=0.0015)
    sfans = [x for x in bx if x["group"] == "side"]
    if sfans:
        y0 = min(x["p"][1] for x in sfans) - 0.058
        y1 = max(x["p"][1] for x in sfans) + 0.058
        z0 = sfans[0]["p"][2] - 0.058
        z1 = sfans[0]["p"][2] + 0.058
        vent(right, (W / 2 - 0.01, W / 2 + 0.01, y0, y1, z0, z1), (W / 2 - 0.0016, W / 2 - 0.0008, y0, y1, z0, z1))
        # fan bracket rails
        for zz in (z0 - 0.004, z1 + 0.002):
            objs.append(sbox(W / 2 - T - 0.006, W / 2 - T, y0 - 0.004, y1 + 0.004, zz, zz + 0.002, trim, "side_rail", bev=0.0004))
    objs.append(right)
    # pillars: rear corners and the front-right edge; the front-left glass corner stays open (panoramic)
    pw = 0.011
    objs.append(sbox(-W / 2, -W / 2 + pw, yb, yt, -D / 2, -D / 2 + pw, trim, "pillar_rl", bev=0.0015))
    objs.append(sbox(W / 2 - pw, W / 2, yb, yt, -D / 2, -D / 2 + pw, trim, "pillar_rr", bev=0.0015))
    objs.append(sbox(W / 2 - pw, W / 2, yb, yt, D / 2 - pw, D / 2, trim, "pillar_fr", bev=0.0015))
    # glass: side and front panes meeting at a bare corner, thin white edge strips
    g = 0.0005
    side_glass = sbox(-W / 2, -W / 2 + T, yb + T + g, yt - T - g, -D / 2 + pw + g, D / 2, glass, "glass_side", bev=0.0008)
    front_glass = sbox(-W / 2 + T + g, W / 2 - pw - g, yb + T + g, yt - T - g, D / 2 - T, D / 2, glass, "glass_front", bev=0.0008)
    for y0, y1 in ((yb + T, yb + T + 0.006), (yt - T - 0.006, yt - T)):
        objs.append(sbox(-W / 2 + 0.0002, -W / 2 + 0.0012, y0, y1, -D / 2 + pw, D / 2 - 0.0002, trim, "frit", bev=0.0))
        objs.append(sbox(-W / 2 + T, W / 2 - pw, y0, y1, D / 2 - 0.0012, D / 2 - 0.0002, trim, "frit", bev=0.0))
    # motherboard tray with cable grommets, and a CPU cut-out
    tray_z1 = corner[2] + 0.244 + 0.045
    tray = sbox(f["trayFace"], f["trayFace"] + 0.002, f["floor"], f["ceiling"], f["rearIn"], tray_z1, trim, "tray", bev=0.0006)
    for hole in m["cableHoles"].values():
        cut(tray, sbox(hole[0] - 0.01, hole[0] + 0.01, hole[1] - 0.03, hole[1] + 0.03, hole[2] - 0.009, hole[2] + 0.009, trim, "cutter", bev=0.0))
        objs.append(sbox(hole[0] - 0.0005, hole[0] + 0.0025, hole[1] - 0.031, hole[1] + 0.031, hole[2] - 0.010, hole[2] + 0.010, rubber, "grommet", bev=0.003))
    objs.append(tray)
    # PSU / drive chamber floor rail and the ARGB strip behind the front glass
    objs.append(sbox(W / 2 - pw - 0.004, W / 2 - pw, yb + T + 0.02, yt - T - 0.02, D / 2 - pw - 0.004, D / 2 - pw, rgb, "led_strip", bev=0.0006))
    led = objs[-1]
    uvl = led.data.uv_layers.new(name="UVMap")
    for li, loop in enumerate(led.data.loops):
        co = led.data.vertices[loop.vertex_index].co
        uvl.data[li].uv = ((co.z - yb) / H, 0.5)
    # front-top I/O: power button with a light ring, USB, audio
    ix, iz = W / 2 - 0.05, D / 2 - 0.03
    objs.append(cylinder(0.006, 0.0015, (ix, -iz, yt + 0.0004), "Z", accent, "power", verts=32))
    objs.append(ring(0.0062, 0.0072, 0.0012, (ix, -iz, yt + 0.0004), "Z", rgb, "power_ring", verts=40))
    for k, dx in enumerate((-0.022, -0.034, -0.044)):
        objs.append(sbox(ix + dx - 0.0045 + 0.003 * (k == 2), ix + dx + 0.0045 - 0.003 * (k == 2), yt - 0.0004, yt + 0.0002, iz - 0.0012, iz + 0.0012, dark, "usb", bev=0.0))
    # feet
    for sx in (-1, 1):
        for sz in (-1, 1):
            x, z = sx * (W / 2 - 0.035), sz * (D / 2 - 0.045)
            objs.append(cylinder(0.019, design["feet"] - 0.003, (x, -z, yb - (design["feet"] - 0.003) / 2), "Z", accent, "foot", verts=40, bev=0.002))
            objs.append(cylinder(0.017, 0.003, (x, -z, yb - design["feet"] + 0.0015), "Z", feet_pad, "foot_pad", verts=32))
    join_by_material(objs, "case")
    root = empty("case", (0, 0, 0))
    for o in bpy.data.objects:
        if o.type == "MESH" and o.parent is None:
            o.parent = root
    export(design["id"])


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else ["all"]
    designs = json.load(open(os.path.join(ROOT, "assets-src", "bitlab", "case-designs.json"), encoding="utf-8"))
    for what in argv:
        if what in ("fan", "all"):
            make_fan("fan-bitlab-120")
        if what in ("fan-black", "all"):
            make_fan("fan-bitlab-120-black", body="#16181d", blades="#202329")
        if what in ("board", "all"):
            make_board()
        if what in ("gpu", "all"):
            make_gpu()
        if what in ("ram", "all"):
            make_ram()
        if what in ("pump", "all"):
            make_pump()
        if what in ("psu", "all"):
            make_psu()
        if what in ("radiator", "all"):
            make_radiator()
        for d in designs["designs"]:
            if what in ("all", "cases", f"case:{d['id']}"):
                make_case(d, designs)


main()
