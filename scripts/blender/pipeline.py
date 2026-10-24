"""
Headless Blender asset pipeline (Blender 5.1):

    GLB import → cleanup → split into named parts (teardown) → port markers
    (empty nodes) → LOD generation → GLB export (+ JSON report, optional preview PNG)

Run (from the repo root):

    "C:\\Program Files\\Blender Foundation\\Blender 5.1\\blender.exe" --background --factory-startup \
        --python scripts/blender/pipeline.py -- scripts/blender/configs/gpu_triple_fan.json

Everything model-specific lives in the JSON config (see scripts/blender/README.md):
input/output paths, parts (ordered match rules), ports, LOD settings, real size.
Coordinates in the config are Blender's (Z up, as seen in the Blender viewport);
vectors written to glTF extras are converted to glTF's Y-up axes.

The output GLB is an intermediate (assets-src/blender/…); `npm run assets:optimize`
does the web compression (Meshopt, WebP), exactly as for the other models.
"""

import json
import math
import os
import re
import sys
import time

import bmesh
import bpy
from mathutils import Matrix, Vector

# ───────────────────────── helpers ─────────────────────────


def log(msg):
    print(f"[pipeline] {msg}", flush=True)


def fail(msg):
    print(f"[pipeline] ERROR: {msg}", flush=True)
    sys.exit(1)


def repo_path(path, root):
    return path if os.path.isabs(path) else os.path.normpath(os.path.join(root, path))


def to_gltf(v):
    """Blender (X, Y, Z-up) → glTF (X, Y-up, Z = -Blender Y)."""
    return [round(v[0], 6), round(v[2], 6), round(-v[1], 6)]


def tri_count(obj):
    return sum(len(p.vertices) - 2 for p in obj.data.polygons) if obj.type == "MESH" else 0


def world_bounds(objs):
    pts = [o.matrix_world @ Vector(c) for o in objs if o.type == "MESH" for c in o.bound_box]
    if not pts:
        return None
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def point_in_bounds(bounds, at):
    """`at` is normalised inside the box: [0,0,0] = min corner, [1,1,1] = max corner."""
    mn, mx = bounds
    return Vector(tuple(mn[i] + (mx[i] - mn[i]) * at[i] for i in range(3)))


def select_only(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or (objs[0] if objs else None)


SCENE_ROOTS = {"Sketchfab_model", "RootNode", "root", "GLTF_SceneRootNode", "Scene", "world"}


def is_wrapper(obj):
    """Exporter wrapper nodes (Sketchfab_model, *.fbx, RootNode …) are not part groups."""
    name = obj.name
    return (
        name in SCENE_ROOTS
        or name.lower().endswith((".fbx", ".obj", ".gltf", ".glb"))
        or name.startswith("Sketchfab")
        or ".obj.cleaner" in name
    )


def group_of(obj):
    """Top-most meaningful ancestor: the node a modeller named (e.g. `Cylinder.004_5`)."""
    a = obj
    while a.parent is not None and not is_wrapper(a.parent):
        a = a.parent
    return a.name


def material_names(obj):
    return [m.name for m in obj.data.materials if m] if obj.type == "MESH" else []


def is_invisible(mat):
    """Fully transparent helper materials (alpha 0, no texture driving alpha)."""
    if mat is None or mat.node_tree is None:
        return False
    for node in mat.node_tree.nodes:
        if node.type == "BSDF_PRINCIPLED":
            alpha = node.inputs.get("Alpha")
            if alpha is not None and not alpha.is_linked and alpha.default_value <= 0.001:
                return True
    return False


# ───────────────────────── config ─────────────────────────


def deep_merge(base, over):
    out = dict(base)
    for k, v in over.items():
        out[k] = deep_merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


def read_config(path):
    """A config may `extend` another (relative path); its keys override the base (objects merge)."""
    with open(path, encoding="utf-8") as f:
        cfg = json.load(f)
    if "extends" in cfg:
        base = read_config(os.path.normpath(os.path.join(os.path.dirname(path), cfg.pop("extends"))))
        base.pop("preview", None)
        cfg = deep_merge(base, cfg)
    return cfg


def load_config(path):
    cfg = read_config(path)
    for key in ("name", "input", "output", "parts"):
        if key not in cfg:
            fail(f"config is missing '{key}'")
    ids = [p["id"] for p in cfg["parts"]]
    if len(ids) != len(set(ids)):
        fail("part ids must be unique")
    for p in cfg["parts"]:
        if not re.fullmatch(r"[a-z][a-z0-9_]*", p["id"]):
            fail(f"part id '{p['id']}' must be snake_case")
    fallbacks = [p for p in cfg["parts"] if p.get("fallback")]
    if len(fallbacks) != 1:
        fail("exactly one part must be marked \"fallback\": true")
    for port in cfg.get("ports", []):
        if port.get("part") not in ids:
            fail(f"port '{port.get('type')}' references unknown part '{port.get('part')}'")
    return cfg


def rule_matches(rule, obj, group):
    """Every condition present in a rule must hold (AND); a part matches if any of its rules does (OR)."""
    if "groups" in rule and not re.search(rule["groups"], group):
        return False
    if "objects" in rule and not re.search(rule["objects"], obj.name):
        return False
    if "materials" in rule and not any(re.search(rule["materials"], m) for m in material_names(obj)):
        return False
    if "center" in rule:
        b = world_bounds([obj])
        c = (b[0] + b[1]) / 2
        lo = rule["center"].get("min", [-math.inf] * 3)
        hi = rule["center"].get("max", [math.inf] * 3)
        if not all(lo[i] <= c[i] <= hi[i] for i in range(3)):
            return False
    if "size" in rule:
        # bounding-box extent per axis, e.g. only the big flat side panel among small frame pieces
        b = world_bounds([obj])
        lo = rule["size"].get("min", [0] * 3)
        hi = rule["size"].get("max", [math.inf] * 3)
        if not all(lo[i] <= b[1][i] - b[0][i] <= hi[i] for i in range(3)):
            return False
    return True


# ───────────────────────── pipeline steps ─────────────────────────


def import_glb(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not os.path.exists(path):
        fail(f"input not found: {path}")
    bpy.ops.import_scene.gltf(filepath=path)
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    log(f"imported {os.path.basename(path)}: {len(meshes)} meshes, {sum(map(tri_count, meshes))} triangles")
    return meshes


def hex_rgb(h):
    h = h.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]


def paint_textures(rules, report):
    """Cover logos baked into textures: each rect is filled with the median colour
    of a thin ring around it (or a given colour). Rects are fractions of the image,
    origin top-left, as seen in an image viewer: [x0, y0, x1, y1]."""
    import numpy as np

    done = []
    for rule in rules:
        img = bpy.data.images.get(rule["image"])
        if img is None or not img.size[0]:
            fail(f"paint: image '{rule['image']}' not found")
        w, h = img.size
        px = np.empty(w * h * 4, dtype=np.float32)
        img.pixels.foreach_get(px)
        px = px.reshape(h, w, 4)  # Blender rows run bottom-up
        for x0, y0, x1, y1 in rule["rects"]:
            c0, c1 = int(x0 * w), max(int(x0 * w) + 1, int(round(x1 * w)))
            r0, r1 = int((1 - y1) * h), max(int((1 - y1) * h) + 1, int(round((1 - y0) * h)))
            if "color" in rule:
                fill = np.array(hex_rgb(rule["color"]) + [1.0], dtype=np.float32)
            else:
                ring = max(2, int(0.006 * max(w, h)))
                a0, a1 = max(0, r0 - ring), min(h, r1 + ring)
                b0, b1 = max(0, c0 - ring), min(w, c1 + ring)
                block = px[a0:a1, b0:b1].copy()
                mask = np.ones(block.shape[:2], dtype=bool)
                mask[r0 - a0 : r1 - a0, c0 - b0 : c1 - b0] = False
                fill = np.median(block[mask], axis=0)
            px[r0:r1, c0:c1] = fill
        img.pixels.foreach_set(px.ravel())
        img.update()
        img.pack()  # the exporter writes the edited pixels
        done.append({"image": rule["image"], "rects": len(rule["rects"])})
    if done:
        report["texturePaint"] = done
        log(f"texture paint: {sum(d['rects'] for d in done)} logo areas in {len(done)} images")


def edit_materials(cfg, report):
    """Rename materials the site looks for (e.g. "Screen") and repaint finishes for variants."""
    m = cfg.get("materials", {})
    renamed = []
    for pattern, new in m.get("rename", {}).items():
        for mat in list(bpy.data.materials):
            if re.search(pattern, mat.name) and mat.name != new:
                renamed.append([mat.name, new])
                mat.name = new
    painted = []
    for rule in m.get("paint", []):
        for mat in bpy.data.materials:
            if not re.search(rule["materials"], mat.name) or not mat.node_tree:
                continue
            for node in mat.node_tree.nodes:
                if node.type != "BSDF_PRINCIPLED":
                    continue
                base = node.inputs["Base Color"]
                if "color" in rule:
                    if base.is_linked and not rule.get("keepTexture", False):
                        mat.node_tree.links.remove(base.links[0])
                    base.default_value = hex_rgb(rule["color"]) + [1.0]
                if rule.get("flat"):
                    # engraved logos also live in the normal / roughness / occlusion maps: drop them all
                    for name in ("Normal", "Metallic", "Roughness"):
                        for link in list(node.inputs[name].links):
                            mat.node_tree.links.remove(link)
                    for other in mat.node_tree.nodes:
                        if other.type == "GROUP" and other.node_tree and "gltf" in other.node_tree.name.lower():
                            for inp in other.inputs:
                                for link in list(inp.links):
                                    mat.node_tree.links.remove(link)
                if "metallic" in rule and not node.inputs["Metallic"].is_linked:
                    node.inputs["Metallic"].default_value = rule["metallic"]
                if "roughness" in rule and not node.inputs["Roughness"].is_linked:
                    node.inputs["Roughness"].default_value = rule["roughness"]
            painted.append(mat.name)
    if renamed or painted:
        report["materials"] = {"renamed": renamed, "painted": painted}
        log(f"materials: renamed {len(renamed)}, repainted {len(painted)}")


def rotate_scene(degrees):
    """Turn the whole model before anything else (front must face -Y in Blender = +Z in glTF).
    A number turns about Z; [x, y, z] are Euler degrees (XYZ) for models that lie on their side."""
    if not degrees:
        return
    if isinstance(degrees, list) and degrees and isinstance(degrees[0], list):
        # steps in order, e.g. [["Z", -90], ["Y", 90]]: turn about Z first, then about Y
        m = Matrix.Identity(4)
        for axis, d in degrees:
            if axis == "MIRROR":
                # ["MIRROR", "X"]: e.g. a case whose glass panel is on the other side
                m = Matrix.Diagonal([(-1 if d == a else 1) for a in "XYZ"] + [1]) @ m
            else:
                m = Matrix.Rotation(math.radians(d), 4, axis) @ m
    elif isinstance(degrees, list):
        from mathutils import Euler

        m = Euler([math.radians(d) for d in degrees], "XYZ").to_matrix().to_4x4()
    else:
        m = Matrix.Rotation(math.radians(degrees), 4, "Z")
    for o in [o for o in bpy.data.objects if o.parent is None]:
        o.matrix_world = m @ o.matrix_world
    bpy.context.view_layer.update()
    if m.determinant() < 0:
        # mirrored: bake the transform so face winding (and normals) can be corrected
        meshes = [o for o in bpy.data.objects if o.type == "MESH"]
        for o in meshes:
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw
        select_only(meshes)
        bpy.ops.object.make_single_user(object=True, obdata=True)
        # Blender flips the face winding itself when it applies a negative scale
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)


def cleanup(meshes, cfg, report):
    """Remove logos/helpers, weld duplicate vertices, drop loose geometry."""
    c = cfg.get("cleanup", {})
    remove_rules = c.get("remove", [])
    # Rigged downloads: bake the current pose into the meshes and drop the armature,
    # so the GLB is a static model (skinned meshes would be placed by their joints).
    armatures = [o for o in bpy.data.objects if o.type == "ARMATURE"]
    if armatures:
        for o in meshes:
            for mod in [m for m in o.modifiers if m.type == "ARMATURE"]:
                select_only([o])
                bpy.ops.object.modifier_apply(modifier=mod.name)
            o.vertex_groups.clear()
        for a in armatures:
            bpy.data.objects.remove(a, do_unlink=True)
        log(f"baked and removed {len(armatures)} armature(s)")
    if c.get("separateLoose"):
        # one mesh holding several loose pieces (e.g. a headset with its cable): split so rules can drop pieces
        select_only(meshes)
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.separate(type="LOOSE")
        bpy.ops.object.mode_set(mode="OBJECT")
        meshes = [o for o in bpy.data.objects if o.type == "MESH"]
        log(f"separated into {len(meshes)} loose pieces")
    removed = []
    keep = []
    for o in meshes:
        g = group_of(o)
        mats = [m for m in o.data.materials if m]
        if any(rule_matches(r, o, g) for r in remove_rules):
            removed.append({"object": o.name, "group": g, "reason": "rule"})
        elif c.get("removeInvisible", True) and mats and all(is_invisible(m) for m in mats):
            removed.append({"object": o.name, "group": g, "reason": "invisible"})
        else:
            keep.append(o)
            continue
        bpy.data.objects.remove(o, do_unlink=True)

    # Instanced meshes share data; make every object own its mesh before editing geometry.
    select_only(keep)
    bpy.ops.object.make_single_user(object=True, obdata=True)

    weld = c.get("weldDistance", 1e-5)
    welded = 0
    for o in keep:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        before = len(bm.verts)
        # Merging vertices would drop authored hard edges (custom split normals) and
        # leave dark shading blotches; those meshes only lose their loose vertices.
        if weld > 0 and not o.data.has_custom_normals:
            # relative to the object's own size so tiny parts are not collapsed
            size = max(o.dimensions) or 1.0
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=weld * size)
        loose = [v for v in bm.verts if not v.link_faces]
        bmesh.ops.delete(bm, geom=loose, context="VERTS")
        welded += before - len(bm.verts)
        bm.to_mesh(o.data)
        bm.free()
        o.data.update()
    report["cleanup"] = {"removed": removed, "verticesMerged": welded}
    log(f"cleanup: removed {len(removed)} objects, merged/removed {welded} vertices")
    return keep


def resolve_port_anchors(cfg, meshes):
    """Ports anchored to an original object are resolved now, before the objects are joined."""
    by_group = {}
    for o in meshes:
        by_group.setdefault(group_of(o), []).append(o)
        by_group.setdefault(o.name, []).append(o)
    resolved = []
    for port in cfg.get("ports", []):
        p = dict(port)
        if "object" in port:
            objs = by_group.get(port["object"])
            if not objs:
                fail(f"port anchor object '{port['object']}' not found")
            p["_world"] = point_in_bounds(world_bounds(objs), port.get("at", [0.5, 0.5, 0.5]))
        resolved.append(p)
    return resolved


def split_parts(meshes, cfg, report):
    """Assign every mesh to the first matching part, then join each part into one named object."""
    assignment = {p["id"]: [] for p in cfg["parts"]}
    fallback = next(p["id"] for p in cfg["parts"] if p.get("fallback"))
    for o in meshes:
        g = group_of(o)
        target = fallback
        for part in cfg["parts"]:
            if any(rule_matches(r, o, g) for r in part.get("rules", [])):
                target = part["id"]
                break
        assignment[target].append(o)

    parts = {}
    for part in cfg["parts"]:
        objs = assignment[part["id"]]
        if not objs:
            fail(f"part '{part['id']}' matched no meshes — check its rules")
        # keep world placement, drop the original hierarchy
        for o in objs:
            mw = o.matrix_world.copy()
            o.parent = None
            o.matrix_world = mw
        select_only(objs)
        if len(objs) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        obj.name = part["id"]
        obj.data.name = part["id"]
        parts[part["id"]] = obj

    # drop the now-empty wrapper hierarchy
    for o in list(bpy.data.objects):
        if o.type == "EMPTY":
            bpy.data.objects.remove(o, do_unlink=True)
    # a wrapper node may have held a part's name (Blender then appended ".001"): rename again
    for pid, obj in parts.items():
        obj.name = pid
        obj.data.name = pid
    log("parts: " + ", ".join(f"{k} ({tri_count(v)} △)" for k, v in parts.items()))
    return parts


def normalise(parts, cfg, ports):
    """Scale to real size (metres, longest side), put the model on the ground at the origin."""
    mn, mx = world_bounds(list(parts.values()))
    dims = mx - mn
    size = max(dims)
    real = cfg.get("realSize")
    centre = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    if isinstance(real, list):
        # exact product dimensions (width X, depth Y, height Z in metres); 0 keeps that axis proportional
        known = [real[i] / dims[i] for i in range(3) if real[i]]
        k = sum(known) / len(known)
        sv = [real[i] / dims[i] if real[i] else k for i in range(3)]
        m = Matrix.Diagonal((*sv, 1.0)) @ Matrix.Translation(-centre)
        s = k
    else:
        s = real / size if real else 1.0
        m = Matrix.Scale(s, 4) @ Matrix.Translation(-centre)
    for obj in parts.values():
        obj.matrix_world = m @ obj.matrix_world
        select_only([obj])
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        # origin at the part's own centre: teardown animations move/rotate parts around it
        bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    for p in ports:
        if "_world" in p:
            p["_world"] = m @ p["_world"]
    return s, world_bounds(list(parts.values()))


def transform_parts(parts, cfg):
    """Variant edits in metres after normalising: scale a part about its own centre, then move it."""
    for part in cfg["parts"]:
        t = part.get("transform")
        if not t:
            continue
        obj = parts[part["id"]]
        if "scale" in t:
            obj.scale = Vector(t["scale"])
        if "translate" in t:
            obj.location += Vector(t["translate"])
        select_only([obj])
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        bpy.context.view_layer.update()


def tag_parts(parts, cfg, bounds):
    """Teardown metadata as node extras (read by the site's teardown code in V2-5)."""
    size = max(bounds[1] - bounds[0])
    for part in cfg["parts"]:
        obj = parts[part["id"]]
        obj["part"] = part["id"]
        if "label" in part:
            obj["labelKey"] = part["label"]
        explode = part.get("explode", [0, 0, 0])
        obj["explode"] = to_gltf([v * size for v in explode])  # metres, glTF axes
        obj["order"] = part.get("order", 0)


MARKER_PREFIXES = ("slot_", "header_", "socket_", "mount_")


def marker_name(kind, n):
    return f"{kind}_{n}" if kind.startswith(MARKER_PREFIXES) else f"port_{kind}_{n}"


def add_ports(parts, cfg, ports):
    """Port markers: empty nodes `port_<type>_<n>` parented to their part, +Z of the empty = plug direction.
    Slots, headers, sockets and mounts keep their own prefix: `slot_pcie_x16_1`, `header_24pin_1`."""
    counters = {}
    made = []
    for p in ports:
        part = parts[p["part"]]
        if "_world" in p:
            loc = p["_world"]
        else:
            loc = point_in_bounds(world_bounds([part]), p.get("at", [0.5, 0.5, 0.5]))
        n = counters.get(p["type"], 0) + 1
        counters[p["type"]] = n
        empty = bpy.data.objects.new(marker_name(p["type"], n), None)
        empty.empty_display_type = "SINGLE_ARROW"
        empty.empty_display_size = 0.02
        bpy.context.scene.collection.objects.link(empty)
        direction = Vector(p.get("dir", [0, 0, 1])).normalized()
        rot = direction.to_track_quat("Z", "Y").to_matrix().to_4x4()
        empty.matrix_world = Matrix.Translation(loc) @ rot
        empty.parent = part
        empty.matrix_parent_inverse = part.matrix_world.inverted()
        empty["port"] = p["type"]
        empty["dir"] = to_gltf(direction)
        if "label" in p:
            empty["labelKey"] = p["label"]
        made.append({"name": empty.name, "part": p["part"], "type": p["type"], "position": to_gltf(loc)})
    log(f"ports: {len(made)} markers")
    return made


def export_glb(path, cfg):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_extras=True,
        export_apply=True,  # modifiers (LOD decimate) are baked into the file
        export_yup=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_image_format=cfg.get("imageFormat", "AUTO"),
    )
    return os.path.getsize(path)


def make_lod(parts, cfg, path):
    """LOD1: planar dissolve on every part, collapse decimation on dense parts; exported, then reverted."""
    lod = cfg.get("lod")
    if not lod:
        return None
    ratio = lod.get("ratio", 0.5)
    min_tris = lod.get("minTris", 1500)
    angle = math.radians(lod.get("planarAngle", 2))
    added = []
    for obj in parts.values():
        planar = obj.modifiers.new("lod_planar", "DECIMATE")
        planar.decimate_type = "DISSOLVE"
        planar.angle_limit = angle
        added.append((obj, planar))
        if tri_count(obj) >= min_tris:
            collapse = obj.modifiers.new("lod_collapse", "DECIMATE")
            collapse.ratio = ratio
            collapse.use_collapse_triangulate = True
            added.append((obj, collapse))
    deps = bpy.context.evaluated_depsgraph_get()
    tris = 0
    per_part = {}
    for obj in parts.values():
        ev = obj.evaluated_get(deps)
        mesh = ev.to_mesh()
        mesh.calc_loop_triangles()
        per_part[obj.name] = len(mesh.loop_triangles)
        tris += per_part[obj.name]
        ev.to_mesh_clear()
    size = export_glb(path, cfg)
    for obj, mod in added:
        obj.modifiers.remove(mod)
    log(f"LOD1: {tris} triangles → {os.path.basename(path)}")
    return {"file": os.path.basename(path), "bytes": size, "triangles": tris, "parts": per_part}


def render_preview(parts, path, exploded):
    """Workbench render for documentation and a quick visual check (assembled or exploded)."""
    moved = []
    if exploded:
        for obj in parts.values():
            e = obj["explode"]  # glTF axes → Blender
            offset = Vector((e[0], -e[2], e[1]))
            obj.location += offset
            moved.append((obj, offset))
        bpy.context.view_layer.update()
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "TEXTURE"
    scene.display.shading.show_cavity = True
    scene.render.resolution_x, scene.render.resolution_y = 1200, 800
    scene.render.film_transparent = False
    scene.world = scene.world or bpy.data.worlds.new("World")
    mn, mx = world_bounds(list(parts.values()))
    centre = (mn + mx) / 2
    radius = (mx - mn).length / 2
    cam_data = bpy.data.cameras.new("preview")
    cam_data.lens = 50
    # the default 0.1 m near plane would clip a coin cell away entirely
    cam_data.clip_start, cam_data.clip_end = radius * 0.01, radius * 30
    cam = bpy.data.objects.new("preview_camera", cam_data)
    scene.collection.objects.link(cam)
    direction = Vector((0.9, -1.3, 0.9)).normalized()
    cam.location = centre + direction * radius * (3.7 if exploded else 3.2)
    cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    if path.lower().endswith((".jpg", ".jpeg")):
        scene.render.image_settings.file_format = "JPEG"
        scene.render.image_settings.quality = 85
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    for obj, offset in moved:
        obj.location -= offset
    bpy.context.view_layer.update()
    log(f"preview → {path}")


# ───────────────────────── main ─────────────────────────


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    if not argv:
        fail("usage: blender --background --python pipeline.py -- <config.json>")
    config_path = os.path.abspath(argv[0])
    root = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", ".."))
    cfg = load_config(config_path)
    started = time.time()
    report = {"name": cfg["name"], "config": os.path.relpath(config_path, root).replace("\\", "/"), "blender": bpy.app.version_string}

    meshes = import_glb(repo_path(cfg["input"], root))
    report["input"] = {"file": cfg["input"], "bytes": os.path.getsize(repo_path(cfg["input"], root)), "meshes": len(meshes), "triangles": sum(map(tri_count, meshes))}

    rotate_scene(cfg.get("rotate", 0))
    paint_textures(cfg.get("cleanup", {}).get("paint", []), report)
    edit_materials(cfg, report)
    meshes = cleanup(meshes, cfg, report)
    ports = resolve_port_anchors(cfg, meshes)
    parts = split_parts(meshes, cfg, report)
    scale, bounds = normalise(parts, cfg, ports)
    if any(p.get("transform") for p in cfg["parts"]):
        transform_parts(parts, cfg)
        bounds = world_bounds(list(parts.values()))
    tag_parts(parts, cfg, bounds)
    report["ports"] = add_ports(parts, cfg, ports)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    out = repo_path(cfg["output"], root)
    size = export_glb(out, cfg)
    dims = bounds[1] - bounds[0]
    report["output"] = {
        "file": cfg["output"],
        "bytes": size,
        "triangles": sum(tri_count(o) for o in parts.values()),
        "sizeMetres": [round(dims.x, 4), round(dims.z, 4), round(dims.y, 4)],  # glTF: width, height, depth
        "scale": round(scale, 6),
    }
    report["parts"] = [
        {
            "id": p["id"],
            "triangles": tri_count(parts[p["id"]]),
            "materials": material_names(parts[p["id"]]),
            "explode": list(parts[p["id"]]["explode"]),
            "order": p.get("order", 0),
        }
        for p in cfg["parts"]
    ]
    lod_path = re.sub(r"\.glb$", "_lod1.glb", out)
    report["lod1"] = make_lod(parts, cfg, lod_path)

    preview = cfg.get("preview")
    if preview:
        if preview.get("assembled"):
            render_preview(parts, repo_path(preview["assembled"], root), exploded=False)
        if preview.get("exploded"):
            render_preview(parts, repo_path(preview["exploded"], root), exploded=True)

    report["seconds"] = round(time.time() - started, 1)
    report_path = re.sub(r"\.glb$", ".report.json", out)
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    log(f"done in {report['seconds']} s → {cfg['output']} ({size / 1024:.0f} KB), report {os.path.basename(report_path)}")


main()
