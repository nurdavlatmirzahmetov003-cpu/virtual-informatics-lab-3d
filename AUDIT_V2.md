# AUDIT V2: 3D quality before V2

Stage V2-0, 2026-10-10. Baseline: commit `b9b547a` (after Phase 9). This document is a **measurement only**: site code is unchanged. The fixes are scheduled in PLAN_V2 V2-1 and V2-2a/b.

## How it was measured

- **Build:** `npm run build && npm run preview` (http://localhost:4173).
- **Measurement:**
  ```
  node scripts/perf-measure.mjs --quality=<low|medium|high> --pages=/,/explorer,/studio,/labs/assembly --shots=docs/audit-v2/<level>
  ```
- **Browser:** headless Chrome with the real GPU (ANGLE D3D11, **Intel UHD Graphics**), 1440×900, DPR 1.
- **Screenshots:** `docs/audit-v2/{low,medium,high}/{home,explorer,studio,labs_assembly}.jpg`. The 2× crops are `docs/audit-v2/crop_{desk_edge,pc,keyboard}.jpg`; each one shows Low | Medium | High side by side.
- **Model numbers:** `public/assets/models/hardware/optimization-report.json`, `__vil3d.bench()` and `__vil3d.memory()`.

## 1. Page measurements (Intel UHD, 1440×900)

| Page | Quality | Ready | Download | Draw calls | Triangles | ms/frame (bench) | rAF FPS | Texture memory |
|---|---|---|---|---|---|---|---|---|
| `/` | Low | 6.2 s | 5.2 MB | 156 | 256k | 11.0 | 89 | 49.6 MB |
| `/` | Medium | 6.7 s | 11.5 MB | 154 | 397k | 14.7 | 69 | 297 MB |
| `/` | High | 6.6 s | 11.5 MB | 154 | 453k | 18.6 | 28 | 297 MB |
| `/explorer` | Low | 1.7 s | 5.0 MB | 73 | 100k | 9.8 | 87 | 26 MB |
| `/explorer` | Medium | 1.7 s | 10.9 MB | 71 | 236k | 14.3 | 61 | 168 MB |
| `/explorer` | High | 1.9 s | 10.9 MB | 71 | 236k | 14.3 | 31 | 168 MB |
| `/studio` | Low | 0.9 s | 2.3 MB | 22 | 12k | 7.1 | 103 | 8 MB |
| `/studio` | Medium | 1.2 s | 5.0 MB | 20 | 12k | 7.7 | 88 | 75 MB |
| `/studio` | High | 1.9 s | 5.0 MB | 20 | 12k | 7.0 | 35 | 75 MB |
| `/labs/assembly` | Low | 3.9 s | 4.4 MB | 151 | 185k | 11.7 | 80 | 37 MB |
| `/labs/assembly` | Medium | 5.1 s | 8.5 MB | 149 | 246k | 14.9 | 61 | 209 MB |
| `/labs/assembly` | High | 6.3 s | 8.5 MB | 149 | 246k | 17.4 | 29 | 209 MB |

On integrated graphics, High and Ultra fall to about 30 FPS. The cost is post-processing (bloom, DOF), 2048-px shadows and area lights. Auto mode picks Medium on this GPU, which is correct. **V2 rule:** heavy (2K / high-poly) assets load only on High/Ultra, on discrete GPUs.

## 2. Model inventory (current `public/assets/models/hardware`)

| GLB | KB | LOD0 △ | LOD1 △ | GPU texture memory | Textures | Comment |
|---|---|---|---|---|---|---|
| monitor_ultrawide | 479 | 76 886 | 23 134 | 2.7 MB | 1024×256, 512² | Bezel and stand over-tessellated |
| keyboard_mech | 233 | 8 410 | — | **32 MB** | 6 × 1024² | Six 1K maps on an 8k model (no atlas) |
| mouse_gaming | 96 | 17 546 | 7 114 | 0 | — | No textures, flat-shaded body |
| motherboard_x570 | 1 034 | 34 961 | 15 729 | **53 MB** | 10 × 1024² | Most expensive in memory |
| cpu_am4 | 600 | 41 790 | — | 10.7 MB | 2 × 1024² | **A flat box with 41.8k △** (pins); no LOD (normals) |
| ram_rgb | 189 | 2 074 | — | 21 MB | 4 × 1024² | Textures far heavier than geometry |
| cooler_tower | 436 | 61 770 | 19 514 | 5.3 MB | 1024² | Thin fins → moiré |
| gpu_triple_fan | 584 | 42 281 | — | 16 MB | 7 maps | Logos remain (MSI, GeForce) |
| ssd_m2 | 222 | 782 | — | 16 MB | 3 × 1024² | 16 MB of texture for 782 △ |
| psu | 96 | 12 143 | — | 0 | — | |
| fan_frame + fan_rotor | 54 | 4 648 | — | 0 | — | |
| headset_gaming | 1 168 | 58 208 | 17 460 | **33.7 MB** | 9 maps | |
| speakers | 453 | 41 758 | 14 782 | 16 MB | 3 × 1024² | |
| chassis | 139 | 5 803 | — | 1.7 MB | 512² … | Taken from the Gaming Desktop PC set |

**Placeholders still procedural (code geometry):**
- the desk and desk mat;
- the room;
- the chair;
- the microphone, webcam and printer;
- the HDD and network card;
- the 3.5″ disk and cable coil on the assembly bench.

These are visibly simpler than their GLB neighbours. On `/explorer` the printer is a plain white box and the microphone is a cylinder (`high/explorer.jpg`).

## 3. Findings and causes

### 3.1 Jagged edges (aliasing)

| # | Symptom | Where | Cause | Fix (stage) |
|---|---|---|---|---|
| A1 | Strong "staircase" on the desk edge, monitor bezel, keyboard and PC case edges | All pages on **Low** (`crop_desk_edge.jpg`, left) | `QUALITY_PRESETS.low.antialias = false`, no post-AA, `dpr` ≤ 1 | V2-1: cheap AA on Low too (MSAA 2–4× or SMAA), measured on Intel UHD |
| A2 | Cooler and GPU fins and the PSU grille flicker and form moiré as the camera moves | Medium and High (`crop_pc.jpg`) | Thin geometry under 1 px (cooler 61.8k △, fins about 0.5 px); MSAA 4× at DPR 1 is not enough | V2-1/V2-2: LOD1 with a texture/normal map instead of fins; slightly rough metal (less specular aliasing) |
| A3 | Speckled noise on perforated surfaces (top of the case, GPU/PSU grilles) | Assembly bench, PC case (`medium/labs_assembly.jpg`) | Materials use `alphaTest` (`Chassis.tsx:105,132`, `Gpu.tsx:120`, `Psu.tsx:48`, `HardwareExplorer/placeholders.tsx:40,48`). An alpha test does not get MSAA coverage, and its mipmaps blur | V2-1: `alphaToCoverage: true` (with MSAA) + an alpha-mip fix |
| A4 | Edges are not smoother on High than on Medium | High | With post-processing, MSAA comes from `EffectComposer multisampling` = 4; DPR is clamped to 1 at 1440×900 | V2-1: on High/Ultra, DPR up to 1.5–2 (discrete GPU only) or SMAA + MSAA |

### 3.2 Blurry or pixelated textures

| # | Symptom | Where | Cause | Fix (stage) |
|---|---|---|---|---|
| T1 | Keycaps, desk mat, motherboard and RAM blur at an angle | All levels | **GLB textures have `anisotropy = 1`** (the GLTFLoader default). Only procedural textures and the desk/room/monitor set 8 (`Desk.tsx:32`, `Room.tsx:36`, `Monitor.tsx:32`, `proceduralTextures.ts:31`) | V2-1: in `ModelLoader`, set anisotropy by quality (Low 2 / Medium 4 / High 8 / Ultra 16, capped at `getMaxAnisotropy()`) |
| T2 | Close-ups in the 360° viewer are soft (motherboard, headset, GPU) | `/explorer`, 360° | The pipeline caps GLB textures at **1024 px** (`optimize-assets.mjs`); adaptive sizing (PSNR ≥ 45 dB) shrinks some further | V2-1/V2-2: 2K hero textures only on High/Ultra; KTX2 UASTC keeps GPU memory low |
| T3 | On Low the wood and desk mat look muddy and darker | Low (`low/home.jpg`) | 512-px cap + `environmentResolution 128`, no shadows → flat, dark | V2-1: brighter Low lighting (hemisphere/ambient), 1K desk texture with KTX2 ETC1S |
| T4 | High texture memory (297 MB on the home page) | Medium/High | WebP is RGBA8 + mipmaps on the GPU; models without atlases (keyboard 6×1K, motherboard 10×1K, SSD 3×1K for 782 △) | V2-1/V2-2: KTX2 (UASTC normal/ORM, ETC1S albedo on Low), atlases, drop unnecessary maps |
| T5 | Small text on the monitor wallpaper is grainy | Hero, monitor | Procedural canvas 1280 px wide; at grazing angles the mipmap blurs the text | V2-1: anisotropy 8 already present; increase the canvas to 2048 on High |

### 3.3 Geometry and style

| # | Finding | Cause / note | Stage |
|---|---|---|---|
| G1 | CPU is 41.8k △, monitor 76.9k △, I/O bracket 14.7k △ (perforations), but SSD 782 △ | Sketchfab models carry pins and holes as geometry | V2-2: budgets (below); geometry → normal map |
| G2 | One model per category (all 6 monitors are the same ultrawide, scaled) | `catalog.ts` `modelPath` points to a shared file (KNOWN_ISSUES #24) | V2-2a/b: per-product models (ASSET_SOURCING.md §4) |
| G3 | Brand logos remain (MSI, GeForce, Cooler Master, Lian Li…) | KNOWN_ISSUES #17 | V2-2: the pipeline removes logo meshes (proved on the GPU: 4 logo meshes removed); logos baked into textures need texture edits |
| G4 | Procedural placeholders (desk, mat, room, chair, mic, webcam, printer, HDD, NIC) | No free models at the time | V2-2a, V2-3 (Poly Haven CC0 furniture; ASSET_SOURCING.md) |
| G5 | Very dark overall palette; the owner wants "bright, with gradients" | Dark showroom style from Phase 1 | V2-1 (theme + lighting) |
| G6 | Teardown is impossible: GLBs are merged into one mesh by the pipeline (`flatten + join`) | `optimize-assets.mjs` | V2-2/V2-5: Blender split into parts (proved, §4); web optimisation **must not join parts** (`join` per part, `keepExtras`) |

### 3.4 Triangle and texture budgets for V2

| Class | LOD0 (High/Ultra) | LOD1 (Low/Medium, small on screen) | Textures |
|---|---|---|---|
| Hero device (360°, teardown) | 30–80k △ | 8–20k △ | 2K KTX2 on High/Ultra; 1K on Medium; 512 on Low |
| Regular device | 8–30k △ | 2–8k △ | 1K; 512 on Low |
| Small (flash drive, SD, cables, battery) | ≤ 5k △ | ≤ 1.5k △ | ≤ 512 |
| Furniture, room | ≤ 10k △ per object | — | Tileable 1K materials |
| Whole scene (one zone at a time) | ≤ 600k △ High; ≤ 350k △ Medium; ≤ 200k △ Low | | ≤ 300 MB GPU on Medium; ≤ 80 MB on Low |

## 4. Blender pipeline proof (summary)

| | |
|---|---|
| Script | `scripts/blender/pipeline.py` |
| Example config | `scripts/blender/configs/gpu_triple_fan.json` |
| Input | `assets-src/sketchfab/gpu_triple_fan.glb`: 424 meshes, 64 709 △ |
| Cleanup | 15 objects removed: 4 logo meshes + 11 invisible helpers; 37 792 duplicate vertices merged |
| Parts (9) | gpu_chip, fan_1/2/3, shroud, io_bracket, backplate, pcb, heatsink, each with `explode`, `order`, `labelKey` |
| Ports (8) | 3× DisplayPort, HDMI, PCIe ×16, 3× PCIe 8-pin (empty nodes `port_<type>_<n>`) |
| LOD | LOD0 48 447 △ → LOD1 22 588 △ |
| Web size | 2.7 MB → **0.53 MB** after Meshopt + WebP (current monolithic GPU: 0.58 MB) |
| Time | ≈ 5 s |

Previews: `docs/blender/gpu_triple_fan_{assembled,exploded}.jpg`. Details and usage: `ASSET_SOURCING.md §5`.
