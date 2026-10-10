# Blender headless pipeline

```
GLB → cleanup → named parts (teardown) → port markers → LOD1 → GLB (+ report, preview)
```

| File | Purpose |
|---|---|
| `pipeline.py` | Runs inside Blender 5.1 (`--background --python pipeline.py -- <config.json>`) |
| `configs/*.json` | One config per model: input, output, real size, cleanup rules, parts, ports, LOD, preview |
| `run.mjs` | `npm run blender:pipeline [-- <name>]`: runs Blender for the configs, then verifies |
| `verify-glb.mjs` | Checks config and output GLB without Blender (also used by `npm run test:blender`) |

- **Outputs** go to `assets-src/blender/<name>/` (git-ignored, intermediate):
  - `<name>.glb`
  - `<name>_lod1.glb`
  - `<name>.report.json`
- **Preview renders** go to `docs/blender/`.
- **Web compression** (Meshopt, WebP/KTX2) is a separate step and must keep part nodes and extras.
  - `npm run assets:optimize -- products [id …]` rebuilds only the catalog products: all of them, or the given ids.
- **Catalog products** (`configs/products/<id>.json`, V2-2a/b) go to `assets-src/blender/products/`.
- **Cleanup rules** match objects by `groups`, `objects`, `materials`, `center` (bounds centre between `min`/`max`) and `size` (bounding-box extent). `separateLoose` splits meshes first, so a rule can catch one loose piece, such as a glass-side pane.
- **`rotate`** accepts a number (Z), Euler `[x, y, z]`, or ordered steps such as `[["X", -90], ["Z", -90]]` and `["MIRROR", "X"]`.
- **PC components** use a canonical pose; `HardwareParts.tsx` mounts them with a quarter turn about Z:

  | Part | Canonical pose (Blender axes) |
  |---|---|
  | Board, stick, card | Component side +Z |
  | Motherboard | Top edge +X, I/O edge +Y |
  | GPU | On its PCIe edge (−Z), bracket +Y, fans −X |
  | Cooler | Base −Z, fan −Y |
  | PSU | Back +Y, fan down |
  | Case | Front −Y, glass side −X |

- **Port / slot markers** (`ports`, empty nodes with `port`, `dir` and `labelKey` extras):
  - named `port_<type>_<n>`, except types starting with `slot_`, `header_`, `socket_` or `mount_`, which keep their own name (`slot_pcie_x16_1`, `header_24pin_1`);
  - each `label` must exist in all three locales (`ports.*`; this is tested).
- **Inspection helpers:**
  - `inspect.py` renders 4 views plus bounds and groups;
  - `textures.py` dumps colour textures, to find logo rectangles for `cleanup.paint`;
  - `materials.py` and `thumbnails.py`.

Full documentation, the config format and the V2-0 proof run: `ASSET_SOURCING.md` §6.
