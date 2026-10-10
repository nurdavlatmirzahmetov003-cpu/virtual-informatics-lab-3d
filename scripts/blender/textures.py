"""
Dump the colour textures (base colour + emissive) of raw GLBs to PNG, to find
logos and their UV rectangles for `cleanup.paint` in a pipeline config:

    blender --background --factory-startup --python scripts/blender/textures.py -- <out_dir> <file.glb> [...]

Files are named <model>__<material>__<slot>__<image>.png (original resolution).
"""

import os
import re
import sys

import bpy

SLOTS = {"Base Color": "base", "Emission Color": "emissive"}


def safe(s):
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", s)[:40]


def main():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    out_dir, files = argv[0], argv[1:]
    os.makedirs(out_dir, exist_ok=True)
    for path in files:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.gltf(filepath=path)
        model = os.path.splitext(os.path.basename(path))[0]
        done = set()
        for mat in bpy.data.materials:
            if not mat.node_tree:
                continue
            for node in mat.node_tree.nodes:
                if node.type != "BSDF_PRINCIPLED":
                    continue
                for socket, slot in SLOTS.items():
                    inp = node.inputs.get(socket)
                    if not inp or not inp.is_linked:
                        continue
                    src = inp.links[0].from_node
                    # glTF importer may put a mix / separate node in between
                    while src.type != "TEX_IMAGE" and src.inputs and any(i.is_linked for i in src.inputs):
                        src = next(i for i in src.inputs if i.is_linked).links[0].from_node
                    if src.type != "TEX_IMAGE" or not src.image or (src.image.name, slot) in done:
                        continue
                    done.add((src.image.name, slot))
                    img = src.image
                    out = os.path.join(out_dir, f"{safe(model)}__{safe(mat.name)}__{slot}__{safe(img.name)}.png")
                    img.filepath_raw = out
                    img.file_format = "PNG"
                    img.save()
        print(f"[textures] {model}: {len(done)}", flush=True)


main()
