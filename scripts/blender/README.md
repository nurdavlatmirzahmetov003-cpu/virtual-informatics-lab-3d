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

Full documentation, the config format and the V2-0 proof run: `ASSET_SOURCING.md` §6.
