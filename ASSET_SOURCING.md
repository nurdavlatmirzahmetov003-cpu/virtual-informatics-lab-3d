# ASSET SOURCING (V2): where every 3D model comes from

Stage V2-0, 2026-10-10. This file covers every device in `DEVICE_CATALOG.md` (60) and every product in `src/data/hardware/catalog.ts` (67): the source model, its licence and quality, and how it will be made distinct in Blender. **Nothing in this list has been downloaded yet.** Downloads happen per stage (V2-2a/b, V2-4a/b) after the owner signs in and approves; see §7.

## 1. Summary

| | Count |
|---|---|
| Devices with a plan | 60 / 60 |
| Devices already covered by a licensed project model (✅) | 14 |
| Devices with a download candidate (⬇) | 33 |
| Devices built in Blender (🛠) | 13 |
| Catalog products: own model planned | 67 / 67 (✅ 2, ⬇ 37, 🛠 28) |
| Sketchfab candidates checked (licence re-read via API) | 154: **all CC BY 4.0 or CC0, all downloadable** |
| Models to download in total | 73 (≈ 617 MB raw GLB, in 4 batches) |
| Poly Haven CC0 furniture/props (no login) | 16 |

**Status legend:**
- ✅ have: licensed model already in the project (ASSET_MANIFEST.md).
- ⬇ download: Sketchfab candidate; needs the owner's login and approval.
- 🛠 Blender: built or derived by us in Blender.
- 🌿 Poly Haven: CC0, no login.

## 2. Rules

1. **Licence**
   - Only CC BY 4.0 or CC0.
   - Search used the Sketchfab public API (`license=by` / `license=cc0`, downloadable only). Every listed candidate was then re-checked one by one (`/v3/models/<uid>`) on 2026-10-10.
   - Before each download the licence on the model page is checked again, because authors can change it.
2. **Attribution**
   - Every downloaded model gets a row in `ASSET_MANIFEST.md`: author, URL, licence, changes.
   - Each row is also an entry in `src/data/assets/hardware.json`, which feeds the `/credits` page.
   - CC BY requires the author's name and a list of changes.
3. **Trademarks**
   - Logos (meshes and texture areas) are removed in Blender: the pipeline `cleanup.remove` rule, plus texture repaint.
   - Brand names appear only as UI text from the catalog. A model is "ASUS-like", not an ASUS asset.
4. **Quality gates** before a model enters `public/`:
   - triangle and texture budgets from AUDIT_V2.md §3.4;
   - real-world size in metres (`realSize`);
   - LOD1;
   - port markers for every connector listed in DEVICE_CATALOG.md;
   - `npm run assets:validate` passes.
5. **Raw files**
   - Raw downloads go to `assets-src/sketchfab/` and Blender outputs to `assets-src/blender/`. Both are git-ignored, so raw files are not re-published.
   - Only optimised GLBs go to `public/assets/models/`.

## 3. Device models (60)

### PC internals

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `cpu` | ✅ have | [AM4 Cpu [ Free ]](https://sketchfab.com/3d-models/912c9c42d2dc40fe95574345aae51ea0) — Igor.Jop, CC BY 4.0, 42.1k △, 2048 px, 3.9 MB<br>[(FREE) intel cpu](https://sketchfab.com/3d-models/fe534a3cae7c4e66b6131da9b5dae6ff) — Moonway 3D, CC BY 4.0, 11.2k △, 1024 px, 1.1 MB | AM4 model in use; Intel LGA variant from the Moonway 3D CPU (pads instead of pins). Pins → normal map (41.8k △ → ~4k). |
| `cooler_air` | ✅ have | [Cooler Master CPU Cooler](https://sketchfab.com/3d-models/e54651982f524644a2144b52a6b36e89) — BlenderFace, CC BY 4.0, 93.5k △, 2048 px, 5.3 MB<br>[(Free) AMD Wraith Stealth CPU Cooler](https://sketchfab.com/3d-models/ff1e128c191c4f808e60e7a7a523c9cc) — PolyDavid, CC BY 4.0, 37.9k △, 2048 px, 11.8 MB<br>[Katana R-1](https://sketchfab.com/3d-models/d8fcfc391c95462bbb2f47e032050ec8) — Quasar, CC BY 4.0, 5.4k △, 2048 px, 5.2 MB | Tower in use; AMD Wraith Stealth = box (stock) cooler. Teardown split: fan / fins / heat pipes / base. |
| `cooler_liquid` | 🛠 Blender | [Liquid CPU Cooling](https://sketchfab.com/3d-models/7a0014c1141a4c25bc69912075526ee5) — Denzerru, CC BY 4.0, 107.9k △, 256 px, 7.3 MB | Project AIO (Phase 5, procedural) rebuilt in Blender as GLB with pump/tubes/radiator parts; Denzerru model as reference only (256 px textures). |
| `motherboard` | ✅ have | [X570 Prime motherboard [HQ PBR]](https://sketchfab.com/3d-models/25b3659935774b1e9d73d8954be065d8) — Igor.Jop, CC BY 4.0, 35.0k △, 2048 px, 9.7 MB<br>[MotherBoard + Components](https://sketchfab.com/3d-models/3bc94057328243d4b341a55f59160f8a) — Daniel Cardona, CC BY 4.0, 81.0k △, 2048 px, 15.1 MB | X570 in use; Daniel Cardona board (with components) as second layout. Port markers for every slot (pipeline). |
| `ram` | ✅ have | [Ram G-radient (totally not TridentZ)](https://sketchfab.com/3d-models/f75a71bb25ef476e924785b05b47c92c) — Igor.Jop, CC BY 4.0, 2.1k △, 2048 px<br>[RAM Corsair Vengeance LPX](https://sketchfab.com/3d-models/ee11e1926e514075a70642ecb5dc5c2d) — supahot, CC BY 4.0, 5.3k △, 2048 px, 1.4 MB<br>[Random access memory (RAM) DDR3](https://sketchfab.com/3d-models/d2715d60f139421eb6028efd5153fdaf) — CommunicationNode, CC BY 4.0, 7.1k △, 1024 px, 3.5 MB | RGB stick in use; Vengeance LPX = low-profile non-RGB; DDR3 stick for the DDR generations quiz. |
| `gpu` | ✅ have | [MSI GeForce RTX 3080 Gaming X Trio / Now Free!](https://sketchfab.com/3d-models/e5356746dcec48f9868164bb9674ab9a) — M E U, CC BY 4.0, 64.7k △, 2048 px, 4.5 MB<br>[GeForce RTX 3080 Graphics Card](https://sketchfab.com/3d-models/8b947ee1bf7a4e3d8ffa1c24893ac160) — _surovic_, CC BY 4.0, 105.5k △, 4096 px, 11.5 MB | Split into 9 parts in V2-0 (proof). 3080 FE-style model (_surovic_) as the Founders Edition base. |
| `psu` | ✅ have | [PSU Power Supply Unit](https://sketchfab.com/3d-models/69ccd1be3a77497cb2acc9e39e7c52b3) — Groovex, CC BY 4.0, 12.2k △, no tex, 0.7 MB<br>[Power supply Aerocool KCAS 500W ATX](https://sketchfab.com/3d-models/bfb1f77fffb0410f9ee0d0be6fb5fc88) — nofurion, CC BY 4.0, 21.4k △, 4096 px, 24.4 MB | Groovex PSU in use (no textures); Aerocool 500W has a modular-less cable bundle. Internals (capacitors, transformer) built in Blender for teardown. |
| `case` | ✅ have | [Gaming Desktop PC](https://sketchfab.com/3d-models/d1d8282c9916438091f11aeb28787b66) — Yolala3D | Y3D, CC BY 4.0, 86.4k △, 2048 px<br>[PC](https://sketchfab.com/3d-models/14a47b56707c4404bb5c9981c4b04531) — PixelAudaz, CC BY 4.0, 62.4k △, 2048 px, 3.3 MB<br>[Basic PC case](https://sketchfab.com/3d-models/2869fb18575d49128a3115d42d5d3826) — Sousinho, CC BY 4.0, 26.8k △, 4096 px, 48.8 MB | Y3D chassis in use; parametric Blender case generator for brand variants (§4). |
| `case_fan` | ✅ have | [Lian Li UNI FAN SL120 RGB BLACK](https://sketchfab.com/3d-models/5abd0d8e89ea4241b7216f4b6d5a2ca4) — DIEKO, CC BY 4.0, 4.6k △, no tex<br>[computer fan](https://sketchfab.com/3d-models/5360bd331c5848eeb9338b4f894e78e5) — Temoor, CC BY 4.0, 61.2k △, no tex, 4.2 MB | Lian Li SL120 split frame/rotor already. |
| `thermal_paste` | ⬇ download | [THERMAL_PASTE](https://sketchfab.com/3d-models/1f3d78897bba4bb0a9102263618f346a) — JP, CC BY 4.0, 3.2k △, no tex, 0.1 MB | Tiny syringe (3.2k △); paste blob on the IHS made in Blender (animated application). |
| `internal_cables` | 🛠 Blender | [Sata Cable](https://sketchfab.com/3d-models/85190cf776d84b98b02c50a131dd2083) — neilvfx, CC BY 4.0, 111.2k △, 512 px, 4.8 MB | Curves + connector heads in Blender (ATX 24-pin, EPS, PCIe, SATA); connector heads keyed to the port markers. |
| `cmos_battery` | 🛠 Blender | — | CR2032 = bevelled cylinder + engraved text texture (trivial). |

### Storage

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `hdd_35` | ⬇ download | [Storage (SSD, HDD, M.2)](https://sketchfab.com/3d-models/bdd5fd67a7674359ab8648204b5c0575) — Vivien Deroche, CC BY 4.0, 104.6k △, 1024 px, 6.7 MB<br>[WD Green 1TB Hard Disk HDD](https://sketchfab.com/3d-models/e9244f56e0724dd097570e29bae4b7c6) — MajdyModels, CC BY 4.0, 117.4k △, 256 px, 7.1 MB<br>[Hard Drive-SF](https://sketchfab.com/3d-models/e03abb1edf7a42d69f99ae5aa7a852c0) — Giannis Galatsis, CC BY 4.0, 64.6k △, 8192 px, 18.4 MB | Vivien Deroche 'Storage (SSD, HDD, M.2)' set covers 3 devices. Internals (platters, arm, actuator) for teardown built in Blender if the model is closed. |
| `hdd_25` | 🛠 Blender | [Storage (SSD, HDD, M.2)](https://sketchfab.com/3d-models/bdd5fd67a7674359ab8648204b5c0575) — Vivien Deroche, CC BY 4.0, 104.6k △, 1024 px, 6.7 MB | Derived from the 3.5″ model: 2.5″ footprint, 7–9.5 mm height, one platter. |
| `ssd_sata` | ⬇ download | [Storage (SSD, HDD, M.2)](https://sketchfab.com/3d-models/bdd5fd67a7674359ab8648204b5c0575) — Vivien Deroche, CC BY 4.0, 104.6k △, 1024 px, 6.7 MB<br>[SSD SATA 2 5 7mm](https://sketchfab.com/3d-models/1e35cdc38fe34089813551a08767b104) — GmedranoTIC, CC BY 4.0, 39.2k △, no tex, 1.2 MB<br>[Sata Samsung SM883 SSD](https://sketchfab.com/3d-models/09cd60eca56e45f38ec670fc8f848b6f) — PolyDavid, CC BY 4.0, 0.2k △, 2048 px, 4.2 MB | From the storage set; GmedranoTIC 7 mm SSD as an open-case variant. |
| `ssd_nvme` | ✅ have | [m2ssd_Painter](https://sketchfab.com/3d-models/ccda7c201091445087c02692444641c2) — Igor.Jop, CC BY 4.0, 0.8k △, 2048 px, 2.7 MB<br>[M.2 NVME SSD Samsung 990 Pro 1TB 3D model](https://sketchfab.com/3d-models/41b7bfda7eab40f8b13330913fd66fc2) — lime.ball.animations, CC BY 4.0, 2.0k △, 1024 px, 1.8 MB | Igor.Jop M.2 in use; 990-Pro-style with heatsink variant built in Blender. |
| `usb_flash` | ⬇ download | [USB Stick](https://sketchfab.com/3d-models/b9de9f354d3b4f9eb217ad9e67c3020f) — Vaxeon, CC BY 4.0, 60.3k △, 2048 px, 2.9 MB<br>[USB flash drive](https://sketchfab.com/3d-models/0a51815f3c0941ae8312fc6917173ed6) — nerama, CC BY 4.0, 42.2k △, 2048 px, 6.2 MB | Cap and shell split for a simple teardown. |
| `sd_card` | ⬇ download | [SD Card 1:1 Realistic](https://sketchfab.com/3d-models/4b3dda4a861646f1a0c00347574957e7) — SolverData, CC BY 4.0, 17.9k △, 4096 px, 2.6 MB<br>[SD card adapter](https://sketchfab.com/3d-models/02f7f045679d402da9b9f280030821d4) — James_J, CC BY 4.0, 12.7k △, 4096 px, 33.6 MB | microSD derived in Blender (scale + shape) with the adapter. |
| `external_drive` | ⬇ download | [External Hard Drive](https://sketchfab.com/3d-models/6f01d25fdfde4e5c98a7827749c01a4c) — Daniel.Orlando.Tapia, CC BY 4.0, 4.0k △, 2048 px, 2.1 MB<br>[External Hard Drive](https://sketchfab.com/3d-models/944a72ac81de4904b3cede6f5f90de39) — dabori, CC BY 4.0, 4.0k △, 4096 px, 15 MB | Enclosure + reuse of the 2.5″ drive inside. |
| `optical_disc` | ⬇ download | [Compact Disc](https://sketchfab.com/3d-models/06254ae4c6c04bc4b1cb5bd9b6c2ea41) — SEMA Game Studio, CC BY 4.0, 6.1k △, 2048 px, 3.8 MB<br>[CD + Jewel Case](https://sketchfab.com/3d-models/f6c8386e76e54918b551ebdd276479dd) — blue man group, CC BY 4.0, 2.6k △, 1024 px, 1.7 MB | DVD/Blu-ray = same disc with different label and iridescence. |
| `optical_drive` | 🛠 Blender | [CD/DVD Drive](https://sketchfab.com/3d-models/1ccab191f993433e84e3fd66778a7708) — risenshine092, CC BY 4.0, 1.7k △, no tex, 0.1 MB | 5.25″ box + tray + laser sled built in Blender (candidate has no textures, 1.7k △). |

### Input

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `keyboard` | ✅ have | [Mechanical keyboard](https://sketchfab.com/3d-models/1ba4055c33674567b51b783701ed05ce) — FelikinRuslan, CC BY 4.0, 11.1k △, 2048 px, 7.6 MB<br>[Mechanical Keyboard - Aesthetic](https://sketchfab.com/3d-models/44bb12d306864e2cb4256a61d4168942) — M.Reslan, CC BY 4.0, 18.1k △, 2048 px, 12.7 MB<br>[IBM Model M Keyboard](https://sketchfab.com/3d-models/63aec0874c184b53becb74b792588e69) — timblewee, CC BY 4.0, 64.8k △, 1024 px, 3.2 MB | FelikinRuslan in use; Aesthetic (M.Reslan) = TKL base; IBM Model M for the history quiz. |
| `mouse` | ✅ have | [Gaming Mouse](https://sketchfab.com/3d-models/5847669dfe3d4ba8b59e69dc64bc09c1) — attix84work, CC BY 4.0, 72.5k △, no tex<br>[Ice Claw mouse](https://sketchfab.com/3d-models/43de4d030ae94667bd8b8a478dd371ac) — dmitriy7776661111, CC BY 4.0, 45.5k △, 2048 px, 6.5 MB<br>[Computer mouse.](https://sketchfab.com/3d-models/4a6e2b1cf5d54ed5b97da093ed1e74a4) — kubassa, CC BY 4.0, 142.4k △, 2048 px, 6.4 MB | Gaming mouse in use; Ice Claw / kubassa as second shapes (§4 mice). |
| `graphics_tablet` | ⬇ download | [Wacom Intuos Pro](https://sketchfab.com/3d-models/688bdc10475a470997615af3b2b74f07) — Vivien Deroche, CC BY 4.0, 38.8k △, 2048 px, 14.4 MB<br>[XP-Pen Deco Mini 7 drawing tablet](https://sketchfab.com/3d-models/4ccbeb843a1846cf8dc32b68a9243bfe) — Rykenz, CC BY 4.0, 6.5k △, 2048 px, 2.9 MB | Wacom-like tablet (logo removal). |
| `gamepad` | ⬇ download | [Xbox Inalambric Controller (Black)](https://sketchfab.com/3d-models/29cc9624894a4f2cae7d2a675044db45) — Chistodrako._., CC BY 4.0, 43.1k △, 2048 px, 1.7 MB | Xbox-style controller; logo removal. |
| `microphone` | ⬇ download | [Microphone Audio-technica AT2020](https://sketchfab.com/3d-models/506390cb11464c16b825dfb18eada1f1) — DORA, CC BY 4.0, 14.0k △, 4096 px, 17.7 MB<br>[Microphone Stand With Boom Arm (Legged)](https://sketchfab.com/3d-models/9bee76120cd8472b9f68db91d820f5ff) — JMGameDev, CC BY 4.0, 5.1k △, 4096 px, 18.3 MB | Replaces the procedural mic in /explorer; boom arm optional. |
| `webcam` | ⬇ download | [Web Camera](https://sketchfab.com/3d-models/b6461ec1520748179686b87bef7089e9) — darklord3d, CC BY 4.0, 59.6k △, 2048 px, 6.5 MB | Replaces the procedural webcam (60k △ → decimate to ~10k). |
| `scanner` | 🛠 Blender | — | No CC BY flatbed scanner found: box + lid + glass + light bar animation in Blender. |

### Output

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `monitor` | ✅ have | [Ultrawide Monitor](https://sketchfab.com/3d-models/f84d24b6df3648d884fd9be9c8007dd4) — dylanheyes, CC BY 4.0, 219.5k △, 1024 px, 7.5 MB<br>[PC Monitor 27 inch](https://sketchfab.com/3d-models/06fb18eec19245d4811c4c3c8c7ea567) — Annelida, CC BY 4.0, 6.4k △, 4096 px, 9.2 MB<br>[Basic PC Monitors](https://sketchfab.com/3d-models/58a2dba70e4f4752962ee98a9d6827be) — Sousinho, CC BY 4.0, 4.6k △, 4096 px, 18.3 MB<br>[CRT Computer Monitor](https://sketchfab.com/3d-models/f2ff0013f86e4cd0a2aee183a23bdfee) — fizyman, CC BY 4.0, 3.7k △, 4096 px, 45.2 MB | Ultrawide in use; 27″ flat base (Annelida) for 16:9 models; CRT for the history quiz. Parametric variants in §4. |
| `printer_laser` | ⬇ download | [HP Laser Jet Pro Printer](https://sketchfab.com/3d-models/efa71da7b59b420a92303296f4e12a97) — Pradeep.Kumar2, CC BY 4.0, 42.0k △, 4096 px, 4.5 MB<br>[HP Color Laser Jet Pro MFP M177](https://sketchfab.com/3d-models/b562cacdb973491289eb5d1182555da4) — Mixmamo.studio:   An effortless 3D collections., CC BY 4.0, 80.9k △, 1024 px, 2.7 MB | Replaces the procedural printer; teardown: covers / toner / drum / fuser / tray split in Blender. |
| `printer_inkjet` | ⬇ download | [Canon Inkjet Printer](https://sketchfab.com/3d-models/13b495e4a2e3479e8ec5d9fd72ce6e49) — Mixmamo.studio:   An effortless 3D collections., CC BY 4.0, 10.2k △, no tex, 0.6 MB<br>[Epson printer model](https://sketchfab.com/3d-models/752da10ef09a4f4782aa6c38a82f4b26) — zafry, CC BY 4.0, 4.4k △, no tex, 0.2 MB | No textures on candidates: materials assigned in Blender. |
| `projector` | ⬇ download | [Projector- 5 MB](https://sketchfab.com/3d-models/51c7808236d14baf840faeb29ab93bb8) — Mehdi Shahsavan, CC BY 4.0, 5.6k △, 2048 px, 5.4 MB | Projection screen: Poly Haven `projector_screen` (CC0). |
| `speakers` | ✅ have | [Amigo Computer gaming speakers](https://sketchfab.com/3d-models/3b5adc5be8c4436eb913063c7e3f5c67) — Kartik_Kishor, CC BY 4.0, 57.9k △, 2048 px<br>[LogiTech Audio Speaker](https://sketchfab.com/3d-models/e91c82f2dca144d2b052033558fb7c32) — Jillomania, CC BY 4.0, 11.2k △, 1024 px, 0.4 MB<br>[Portable Bluetooth Speaker (MUZEN) (FREE)](https://sketchfab.com/3d-models/2c89bba6e87b4e1a9df4723c2033c108) — ___konstantsin___, CC BY 4.0, 11.6k △, 4096 px, 19.9 MB | Amigo in use; Logitech-style 2.0 and a Bluetooth speaker as variants. |
| `headset` | ✅ have | [Headphones Free Model by Oscar Creative](https://sketchfab.com/3d-models/db92168ca39541939d0110e64a37f92e) — OSCAR CREATIVO, CC BY 4.0, 58.2k △, 2048 px, 17 MB<br>[Sony MDR-7506 Headphones](https://sketchfab.com/3d-models/05735b74d3524f00b648231138122a28) — AndreiVNK, CC BY 4.0, 10.8k △, 2048 px, 9 MB<br>[Headphones Skullcandy Crusher Wireless](https://sketchfab.com/3d-models/4e902017e4624547b440da0a6658a689) — Ankledot, CC BY 4.0, 3.7k △, 4096 px, 16.8 MB | Oscar Creative in use; Sony MDR-7506 / Skullcandy as shape variants. |
| `interactive_panel` | ⬇ download | [Interactive display clean](https://sketchfab.com/3d-models/aac67dc4a84f47e5b17fa2cae57edae8) — g33, CC BY 4.0, 84.1k △, 2048 px, 16.1 MB<br>[Interactive Whiteboard](https://sketchfab.com/3d-models/7b143cf8affc434b8d082187e05e4a27) — FurryPawsDesigns, CC BY 4.0, 4.2k △, 2048 px, 0.3 MB | Classroom panel on a wall/stand; screen = live canvas texture. |

### Networking

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `router` | ⬇ download | [Router](https://sketchfab.com/3d-models/ac86d8ae65a54f4aa99d7d624f71e5f4) — Rasmus, CC BY 4.0, 2.2k △, 4096 px, 1.5 MB<br>[Modern Wifi Router](https://sketchfab.com/3d-models/034ca6b2dc064211bd1950ceb377d140) — Dominik Biały, CC BY 4.0, 2.2k △, 4096 px, 17.8 MB<br>[Grandpa's Wifi Router (free game-ready asset)](https://sketchfab.com/3d-models/3e2b5b7d362c4dd5bedae92de2fa548f) — Dominik Biały, CC BY 4.0, 13.4k △, 4096 px, 31.6 MB | Port markers WAN + 4 LAN added in Blender. |
| `switch` | ⬇ download | [TL-SF1005D](https://sketchfab.com/3d-models/90966bd409204294918c68c11c7da831) — arieffitrah, CC BY 4.0, 26.1k △, no tex, 1.7 MB<br>[8 Port Ethernet Switch](https://sketchfab.com/3d-models/0aa1eb0452d347eeb6b2b310e8d40d05) — duckSPLASH, CC BY 4.0, 90.8k △, 4096 px, 23.5 MB | 5-port desktop (TL-SF1005D style) + 8-port; RJ45 port markers. |
| `modem` | ⬇ download | [Action Intelbras Modem](https://sketchfab.com/3d-models/3d8d5ea391bd4f30bb0603eb07f17ca9) — ghBanck, CC BY 4.0, 6.5k △, 2048 px, 2.1 MB<br>[LANcity Cable Modem](https://sketchfab.com/3d-models/8733df6c890e4b098493a7c8a63cf6e6) — The Cable Center, CC0, 100.0k △, 4096 px, 36.8 MB | Fibre ONT variant derived in Blender (SC port). LANcity is CC0 (history). |
| `wifi_adapter` | ⬇ download | [USB Wifi Adapter](https://sketchfab.com/3d-models/179787d27c2647ecb854eb8c607efa53) — VeLoct84, CC BY 4.0, 3.1k △, 1024 px, 0.3 MB<br>[Usb wifi adapter / antenna](https://sketchfab.com/3d-models/8da79bbc26eb439bafbf4c17a76700f8) — MaarenMaes, CC BY 4.0, 0.9k △, 1024 px, 1.3 MB | PCIe Wi-Fi card variant derived from the NIC model. |
| `nic` | ⬇ download | [Network Interface Card](https://sketchfab.com/3d-models/191c8ad40de2430980b879615aa0d2e3) — ARComputerFundamentals, CC BY 4.0, 193.7k △, 512 px, 6.2 MB | 194k △: decimate to ≤ 15k in Blender, or build (PCB + bracket + RJ45). |
| `ethernet_cable` | 🛠 Blender | — | Curve cable + RJ-45 plug with 8 coloured wires (T568B) for the crimping explanation; candidates are 0.5–1M △. |
| `access_point` | 🛠 Blender | — | Ceiling disc AP with LED ring and PoE port (simple Blender model). |
| `nas` | ⬇ download | [NAS Storage Device](https://sketchfab.com/3d-models/ade9536b36bf405e9fb91494d5dc506a) — karakocyunus, CC BY 4.0, 207.2k △, no tex, 6.4 MB | 207k △ and no textures: decimate + materials, or build 2-bay box reusing the 3.5″ HDD. |
| `server_rack` | ⬇ download | [Data Center Server Rack](https://sketchfab.com/3d-models/01b49d9d1f694ba5b41e4b2b0e10d16e) — EntropyNine, CC BY 4.0, 27.9k △, 2048 px, 14 MB<br>[Server rack](https://sketchfab.com/3d-models/5320622f6c0741b7aed399bfa2965dc4) — Osho, CC BY 4.0, 29.6k △, 2048 px, 35 MB | Wall-mount 9U cabinet derived for the school network corner. |

### Mobile and other

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `laptop` | ⬇ download | [Gaming Laptop](https://sketchfab.com/3d-models/4e72a2078b3c4a75a821ab09830693fe) — Vivien Deroche, CC BY 4.0, 120.3k △, 2048 px, 21 MB<br>[Laptop](https://sketchfab.com/3d-models/7d870e900889481395b4a575b9fa8c3e) — Aullwen, CC BY 4.0, 8.3k △, 2048 px, 0.5 MB | Exterior from Vivien Deroche; internals for teardown (battery, SO-DIMM, M.2, fan + heat pipe, Wi-Fi card, board) built in Blender. Poly Haven `classic_laptop` (CC0) as backup. |
| `all_in_one` | ⬇ download | [2009 - 2011 iMac, 27 inch](https://sketchfab.com/3d-models/7b3732dbf3d14ecbb919373233efcfd1) — Ne0nGenisis, CC BY 4.0, 33.9k △, 4096 px, 10 MB<br>[PC in Apple IMAC Style](https://sketchfab.com/3d-models/df8163b56ada446fbfac3a9d43ea5256) — ISUS, CC BY 4.0, 23.3k △, 2048 px, 5.1 MB | Exterior; internal layout (board, RAM, SSD, fan, speakers) built in Blender; Apple logo removed. |
| `smartphone` | ⬇ download | [Off-brand Android Smartphone](https://sketchfab.com/3d-models/2a1c8666306e4116980daeb9406e7780) — SabasGT, CC BY 4.0, 4.0k △, 2048 px, 1.9 MB<br>[iPhone 12 Pro](https://sketchfab.com/3d-models/05dfc991665e45c68c8b7062136c0c6e) — DatSketch, CC BY 4.0, 73.2k △, 2048 px, 4 MB | Unbranded Android base (no logo) + internals built in Blender (battery, board, cameras, frame). Paid exploded option in §6c. |
| `tablet` | ⬇ download | [Ipad 7](https://sketchfab.com/3d-models/ec2b3966d0384f87bfdff55799778bf0) — atom, CC BY 4.0, 30.3k △, 2048 px, 3.7 MB<br>[IPad Pro 12  Russian FREE](https://sketchfab.com/3d-models/3391eb2576ab488a8ee848ed7f58b24f) — Windows Xp Pc, CC BY 4.0, 13.0k △, 2048 px, 1.8 MB | Internals built in Blender (two battery cells, logic board). |
| `smartwatch` | ⬇ download | [Smart Watch Low Poly](https://sketchfab.com/3d-models/ea4f25ed03c54c35a5fe3b1218bdc76b) — ahmadrezagh671, CC BY 4.0, 1.9k △, 1024 px, 1.7 MB<br>[Wrist watch (smartWatch)](https://sketchfab.com/3d-models/c896964ab7274bff810ac5ae9165cf8c) — Mohit Batta, CC BY 4.0, 19.2k △, 512 px, 1.1 MB | Sensor back + strap split. |
| `printer_3d` | ⬇ download | [3D Printer](https://sketchfab.com/3d-models/0e825a8d48b14bee883a131fe029d4fc) — Gregsterius, CC BY 4.0, 52.1k △, no tex, 2.2 MB<br>[3D Printer](https://sketchfab.com/3d-models/5e1465909b9e4b5e8d62fa9f93627efe) — AFX/CGMotion 3DModel Maker, CC BY 4.0, 2.6k △, 2048 px, 4 MB | Teardown parts (frame, Z axis, gantry, hotend, bed, board, PSU, spool) split in Blender; layer-by-layer print animation in code. |
| `ups` | ⬇ download | [PSI5-2200RT120](https://sketchfab.com/3d-models/239d6100ac1a468ab54f343aff0da950) — Vertiv, CC BY 4.0, 9.9k △, 2048 px, 2.4 MB | Rack UPS (published by Vertiv); desktop UPS derived in Blender. |
| `docking_station` | 🛠 Blender | — | Aluminium bar with port markers (USB-C host, HDMI, DP, RJ45, USB-A). |
| `usb_hub` | ⬇ download | [USB Hub](https://sketchfab.com/3d-models/ca45e5fa0fcc42a7a4894810fd456900) — YinRebuffReality, CC BY 4.0, 1.5k △, 2048 px, 7.6 MB<br>[Hoco Usb-Hub](https://sketchfab.com/3d-models/7c36ce51c5a0443a85586dbb709ab154) — Pan_Ar4ik, CC BY 4.0, 2.1k △, 1024 px, 2.5 MB | 4-port hub. |
| `card_reader` | 🛠 Blender | [SD card reader steel](https://sketchfab.com/3d-models/4ef2760222054265a20826777ab1823e) — Kentura, CC BY 4.0, 8.6k △, 4096 px, 25.1 MB | Small USB reader built in Blender (candidate has 25 MB textures). |
| `sbc` | ⬇ download | [Raspberry Pi 3](https://sketchfab.com/3d-models/2d308283fc0f4d27b81f17a2793c5c4d) — JoSaCo, CC BY 4.0, 13.0k △, 2048 px, 2.6 MB<br>[Arduino Uno Board](https://sketchfab.com/3d-models/f31feafc5e9743abbdf33c54f9d92669) — crimsonfalcon, CC BY 4.0, 11.1k △, 1024 px, 9 MB | Raspberry Pi 3 (GPIO, HDMI, USB, RJ45 markers); Arduino Uno for the microcontroller comparison. |

### Cables

| id | Status | Candidates (source — author, licence, triangles, max texture, GLB size) | Plan / Blender edits |
|---|---|---|---|
| `hdmi_cable` | 🛠 Blender | [Male HDMI connector](https://sketchfab.com/3d-models/d165fd6f84b14c1da9aee8bda2bb48a9) — idewe-learning, CC BY 4.0, 5.3k △, no tex, 0.3 MB | Connector head from idewe-learning + curve cable in Blender. |
| `displayport_cable` | 🛠 Blender | — | DP plug with latch built in Blender (HDMI head as reference). |
| `usb_c_cable` | ⬇ download | [USB-C Charging Cable (Type-C – Type-C)](https://sketchfab.com/3d-models/39cb1374a9c24cfa815f8efe86a14f61) — alessandroparca, CC BY 4.0, 13.4k △, no tex, 0.4 MB | Cable re-shaped as a curve for plugging animation. |
| `usb_a_cable` | 🛠 Blender | [Connector - Usb - Charger](https://sketchfab.com/3d-models/c475b6da0737471380b63170849f2a56) — re1monsen, CC BY 4.0, 21.3k △, 4096 px, 33.5 MB | USB-A / USB-B / micro-B heads built in Blender (shared cable curve). |
| `audio_cable` | ⬇ download | [Aux Jack 3.5mm](https://sketchfab.com/3d-models/6db86076d91747b09fb776cfe4513505) — PolyDavid, CC BY 4.0, 1.8k △, 2048 px, 3.5 MB<br>[Aux Cord / 3.5mm](https://sketchfab.com/3d-models/8fe1f5635eb64d28b2452690da6f7c85) — Pax Red, CC BY 4.0, 2.3k △, no tex, 0.1 MB | TRS vs TRRS rings as separate materials. |

## 4. Lab furniture and room

### Poly Haven (CC0, no login, direct download)

| Asset | Name | Licence | Use |
|---|---|---|---|
| `SchoolDesk_01` | [School desk](https://polyhaven.com/a/SchoolDesk_01) | CC0 | Student desks in the zones |
| `SchoolChair_01` | [School chair](https://polyhaven.com/a/SchoolChair_01) | CC0 | Student seating |
| `metal_office_desk` | [Metal office desk](https://polyhaven.com/a/metal_office_desk) | CC0 | Teacher desk / bench base |
| `steel_frame_shelves_01` | [Steel frame shelves](https://polyhaven.com/a/steel_frame_shelves_01) | CC0 | Storage wall, network corner |
| `steel_frame_shelves_03` | [Steel frame shelves 03](https://polyhaven.com/a/steel_frame_shelves_03) | CC0 | Device shelving |
| `tool_cart` | [Tool cart](https://polyhaven.com/a/tool_cart) | CC0 | Assembly zone |
| `industrial_storage_cart` | [Industrial storage cart](https://polyhaven.com/a/industrial_storage_cart) | CC0 | Assembly zone |
| `modern_arm_chair_01` | [Modern arm chair](https://polyhaven.com/a/modern_arm_chair_01) | CC0 | Lounge / reception |
| `mounted_fluorescent_lights` | [Mounted fluorescent lights](https://polyhaven.com/a/mounted_fluorescent_lights) | CC0 | Ceiling lighting |
| `modern_ceiling_lamp_01` | [Modern ceiling lamp](https://polyhaven.com/a/modern_ceiling_lamp_01) | CC0 | Ceiling lighting |
| `projector_screen` | [Projector screen](https://polyhaven.com/a/projector_screen) | CC0 | Print & media corner |
| `wooden_display_shelves_01` | [Wooden display shelves](https://polyhaven.com/a/wooden_display_shelves_01) | CC0 | Device showcase |
| `desk_lamp_arm_01` | [Desk lamp arm](https://polyhaven.com/a/desk_lamp_arm_01) | CC0 | Bench lighting |
| `circuit_board` | [Circuit board](https://polyhaven.com/a/circuit_board) | CC0 | Decor / PCB close-up |
| `retro_multimeter` | [Retro multimeter](https://polyhaven.com/a/retro_multimeter) | CC0 | Assembly bench tools |
| `classic_laptop` | [Classic laptop](https://polyhaven.com/a/classic_laptop) | CC0 | Laptop backup model |

### Sketchfab furniture candidates (CC BY)

| Use | Candidate |
|---|---|
| Lab table | [Office Desk 140x60](https://sketchfab.com/3d-models/9262f311271c4c4390341e526d3fe103), AleixoAlonso, 7.1k △ |
| Office chair | [Office chair](https://sketchfab.com/3d-models/af2f07d06f6349158c1d24d87f5ceb95), AK STUDIO, 28.8k △ |
| Standing desk | [Standing Desk](https://sketchfab.com/3d-models/65a7f4b06a5f4954a0d43eb8812dd165), Ryan_Nein, 13.2k △ |

The room shell itself (walls, floor, windows, zone dividers, gradient light panels) is built in Blender/code in V2-3, using Poly Haven CC0 materials that are already in `assets-src/library/textures/polyhaven/`.

## 5. Catalog products (67): one distinct model per product

### 5.1 How same-category products from different brands become different

Today every product in a category shares one GLB that is only scaled (AUDIT_V2 G2). The plan has three layers, and each product gets at least two:

1. **Different base model where one exists.** For example, Dell UltraSharp, ASUS TUF/ROG and LG monitors use three different Sketchfab bases.
2. **A Blender variant from a shared base.** A parametric script (V2-2a) changes the defining shape features per category:

   | Category | Shape features changed per product |
   |---|---|
   | Monitor | Diagonal and aspect (16:9 / 21:9), curvature, bezel width (3-side thin vs thick chin), stand type (round base, rectangular plate, tripod, arc), neck height, back pattern, accent colour, panel gloss |
   | Keyboard | Layout cut (full / TKL / 75 %), key profile (membrane high, low-profile, mechanical), frame material (plastic, aluminium), knob or dial, backlight colour |
   | Mouse | Body shape (ergonomic right-handed vs symmetric), length/height, button count, cable vs wireless, RGB zone |
   | Headset | Headband (steel fork, ski-goggle band, pilot), cup shape (round, oval), mic (boom, retractable, none) |
   | Case | Front panel (mesh, triangle perforation, wood slats, glass), glass side vs steel, dual-chamber, fan count and RGB, colour |
   | CPU | Heat-spreader shape: AM5 "octopus", LGA1700 rectangle, LGA1851; pins vs pads underneath |
   | Cooler | Single vs dual tower, fan count and size, top cover, fan colour; AIO pump cap and radiator length |
   | Motherboard | Form factor (ATX / mATX), socket, heatsink colours and shapes, DIMM count |
   | RAM | Heat-spreader height and shape, RGB bar, DDR4/DDR5 notch position |
   | GPU | Fan count (2/3/4), length and slot thickness, shroud style (Founders flow-through vs partner), colour accents |
   | SSD | M.2 vs 2.5″, PCB colour, label material, heatsink |
   | PSU | Non-modular, semi-modular or fully modular back panel, fan grille pattern, colour |
   | Desk / chair | Leg type (fixed, telescopic), size, cable tray; seat type (mesh office, racing bucket, ergonomic spine) |

3. **Materials and colours** from the catalog `colors` field. Materials alone are never the only difference between two products.

**Similar but not identical.**
- Products of one brand line share a base: Kingston Fury Beast DDR4/DDR5, Corsair RM750e/RM850x, NVIDIA 5070/5080 FE. Their shapes still differ: size, notch, ports, grille.
- Every product gets its own GLB (`products/<product-id>.glb`) or a named variant node inside a shared file (`<base>.glb#<product-id>`). The variant-node form is already supported by `ModelLoader`; see `speakers.glb#speaker_left`.

### 5.2 Per product

#### Monitors

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `mon-asus-va24ehf` | 🛠 Blender | [PC Monitor 27 inch](https://sketchfab.com/3d-models/06fb18eec19245d4811c4c3c8c7ea567) — Annelida, CC BY 4.0, 6.4k △, 4096 px, 9.2 MB<br>[Asus PC Gaming Monitor](https://sketchfab.com/3d-models/941ce968c30a42d0a640a5c9d7f56128) — Artik, CC BY 4.0, 17.1k △, 512 px, 1.1 MB | Flat 23.8″ from the 27″ base: 3-side thin bezel, thick chin, round matte base, short neck. |
| `mon-dell-u2724d` | ⬇ download | [DELL UltraSharp](https://sketchfab.com/3d-models/951c40459085466895fece243ceee8b2) — snrnsrk5, CC BY 4.0, 1.5k △, 4096 px, 2.7 MB | Silver rectangular stand with cable hole, very thin bezel, height-adjust column. |
| `mon-asus-xg27acs` | ⬇ download | [ASUS  TUF gaming monitor](https://sketchfab.com/3d-models/570372a3cc6941029b2490eb3113b224) — Jelvehkar, CC BY 4.0, 59.4k △, 1024 px, 2 MB | Gaming tripod stand, red accent on the neck, thin bezel; RGB disc on the back. |
| `mon-lg-27gr93u` | ⬇ download | [LG moniter](https://sketchfab.com/3d-models/f899bb43701f4e95b1e44c4bf21ed29c) — Mohamed Ahmed, CC BY 4.0, 2.7k △, 2048 px, 1.2 MB | UltraGear style: arc base with a red line, matte black back with a circular pattern. |
| `mon-lg-34gp83a` | ✅ have | [Ultrawide Monitor](https://sketchfab.com/3d-models/f84d24b6df3648d884fd9be9c8007dd4) — dylanheyes, CC BY 4.0, 219.5k △, 1024 px, 7.5 MB | Current curved ultrawide (34″ 21:9) already has the right shape; logos removed. |
| `mon-asus-xg27aqmr` | 🛠 Blender | [ASUS  TUF gaming monitor](https://sketchfab.com/3d-models/570372a3cc6941029b2490eb3113b224) — Jelvehkar, CC BY 4.0, 59.4k △, 1024 px, 2 MB | From the XG27ACS: gunmetal tripod, bigger RGB ring, glossy (WOLED-like) panel material. |

#### Keyboards

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `kb-logitech-k120` | ⬇ download | [Logitech Keyboard K120 - Top v3](https://sketchfab.com/3d-models/b6d860209f8f46339645695c13c69930) — GolloMotorS1, CC BY 4.0, 106.9k △, 8192 px, 14.4 MB | Full-size membrane, high-profile keys, no backlight; 8K textures to 1K. |
| `kb-logitech-mx-keys-s` | ⬇ download | [Logitech MX Keys](https://sketchfab.com/3d-models/67901d82781f48349f1f61ce78a6b6e0) — ArkinRS, CC BY 4.0, 27.2k △, 4096 px, 17.6 MB | Low-profile spherical-dish keys, graphite aluminium plate, white backlight. |
| `kb-keychron-k8-pro` | ⬇ download | [Keychron K8](https://sketchfab.com/3d-models/b00c531f3d8f4fd39c636eae56f23c0f) — MozzarellaARC, CC BY 4.0, 45.6k △, 4096 px, 43.9 MB | TKL, aluminium-grey frame, orange Esc and grey modifiers (44 MB textures to 1K). |
| `kb-logitech-pro-x-tkl` | ⬇ download | [Logitech mechanical gaming keyboard](https://sketchfab.com/3d-models/c775d45baf854606931584404d7b9109) — BlackCube, CC BY 4.0, 33.7k △, 4096 px, 2 MB | Cut to TKL in Blender, black floating keys, RGB under-glow. |
| `kb-razer-huntsman-v3-pro-tkl` | ⬇ download | [RAZER BlackWidow Chroma](https://sketchfab.com/3d-models/c4c42707816b40f2b5f5fe1bae89dfb5) — Mieshu, CC BY 4.0, 7.0k △, 4096 px, 12.6 MB<br>[Razer Huntsman Mini Keyboard](https://sketchfab.com/3d-models/d5a3d193b5f343e69eaa1a4d061b66f7) — FoxFX, CC BY 4.0, 275.2k △, 4096 px, 56 MB | Cut to TKL, analog dial and media key, green accent, magnetic wrist rest. |

#### Mice

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `mouse-logitech-g102` | ⬇ download | [Mouse Logitech G203](https://sketchfab.com/3d-models/6b70ace291c44735bed3309b05f44bba) — JorgeAlfredOwO, CC BY 4.0, 25.0k △, 2048 px, 14.1 MB | G203 shell is the G102 shell (same body); RGB stripe at the back. |
| `mouse-logitech-g305` | 🛠 Blender | [Mouse Logitech G203](https://sketchfab.com/3d-models/6b70ace291c44735bed3309b05f44bba) — JorgeAlfredOwO, CC BY 4.0, 25.0k △, 2048 px, 14.1 MB | From the G203 body: shorter, no cable, battery door underneath, matte colour variants. |
| `mouse-logitech-g502x-plus` | ⬇ download | [Logitech G700s](https://sketchfab.com/3d-models/8d96670d940742c4b515b0a0b0dc92ab) — Miléd Hammoud, CC BY 4.0, 128.0k △, 2048 px, 21.1 MB<br>[Gaming Mouse](https://sketchfab.com/3d-models/5847669dfe3d4ba8b59e69dc64bc09c1) — attix84work, CC BY 4.0, 72.5k △, no tex | Large right-handed body with thumb rest and many buttons (G700s base, decimated 128k to 20k). |
| `mouse-logitech-superlight2` | 🛠 Blender | [Mouse Logitech G203](https://sketchfab.com/3d-models/6b70ace291c44735bed3309b05f44bba) — JorgeAlfredOwO, CC BY 4.0, 25.0k △, 2048 px, 14.1 MB | Symmetric egg shape from the G203 body, no RGB, white/black/pink, two side buttons. |
| `mouse-razer-viper-v3-pro` | ⬇ download | [Razer Mouse](https://sketchfab.com/3d-models/9f0a3283cbca4454bf04c8d43494247a) — Fred Drabble, CC BY 4.0, 17.5k △, 2048 px, 1.6 MB<br>[Razer Basilisk V3](https://sketchfab.com/3d-models/02ea1e3f51e34b59ab0140fb85a6b191) — thegraphicsgeek, CC BY 4.0, 135.7k △, 4096 px, 9 MB | Low symmetric ambidextrous shell, flat back, green underside light. |

#### Headsets

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `hs-hyperx-cloud-iii` | ⬇ download | [Headphones HyperX](https://sketchfab.com/3d-models/7ab71d97d39f4ab1950692838ab906b4) — Wuteken, CC BY 4.0, 7.0k △, 4096 px, 18.3 MB | Aluminium forks, red accent stitching, detachable boom mic. |
| `hs-steelseries-nova7` | ⬇ download | [SteelSeries Arctis Wireless Pro](https://sketchfab.com/3d-models/2eeabb208f9f45cf87e2eb1d5bc83ab3) — mariokart64n, CC BY 4.0, 56.3k △, 4096 px, 26.8 MB<br>[Arctis 9X I Bluetooth/Xbox Gaming Headset](https://sketchfab.com/3d-models/d3cd4573a0ef4350adf78d43c41d2ce0) — gozdemrl, CC BY 4.0, 19.4k △, 2048 px, 39.1 MB | Ski-goggle elastic band, retractable mic, oval cups. |
| `hs-razer-blackshark-v2-pro` | ⬇ download | [Razer Headset](https://sketchfab.com/3d-models/fa7de2b85f6c44ad80b53aabd5142070) — harithsami01, CC BY 4.0, 67.6k △, 4096 px, 32.5 MB<br>[Gaming Headset](https://sketchfab.com/3d-models/1ccbf4317dad40458ae84f2224eafa72) — Faber, CC BY 4.0, 4.8k △, 4096 px, 46.5 MB | Pilot-style cups, flexible boom mic, round green ring. |
| `hs-logitech-pro-x2` | ⬇ download | [G735 Logitech Gaming Headset](https://sketchfab.com/3d-models/8930ea831c7e45e8929c77888a6b5e7d) — shaielwolf, CC BY 4.0, 40.5k △, 2048 px, 29.5 MB<br>[Headphones Free Model by Oscar Creative](https://sketchfab.com/3d-models/db92168ca39541939d0110e64a37f92e) — OSCAR CREATIVO, CC BY 4.0, 58.2k △, 2048 px, 17 MB | Aluminium-steel headband, black matte, detachable mic; current Oscar model as fallback base. |

#### Speakers

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `spk-creative-pebble-v3` | 🛠 Blender | [OOGOU A52 Speakers Black and White](https://sketchfab.com/3d-models/c09ac57f5a5644adb81d1173dcf101e9) — Vilad, CC BY 4.0, 46.0k △, 8192 px, 43.3 MB | Two small spheres with a 45° tilted driver (simple Blender model, ~3k triangles). |
| `spk-logitech-z407` | ⬇ download | [Logitech Speakers](https://sketchfab.com/3d-models/73634ff35df3434dbfd2ae87c886ec5f) — Jayemel11, CC BY 4.0, 23.4k △, 2048 px, 17.5 MB<br>[LogiTech Audio Speaker](https://sketchfab.com/3d-models/e91c82f2dca144d2b052033558fb7c32) — Jillomania, CC BY 4.0, 11.2k △, 1024 px, 0.4 MB | Tall slim satellites, cube subwoofer, puck control. |
| `spk-edifier-r1280db` | ⬇ download | [Speaker Bookshelf V2 - Optimized](https://sketchfab.com/3d-models/cbb87dee55e84a389cbccb4ddc0036e0) — rendysix, CC BY 4.0, 15.6k △, 1024 px, 6.2 MB<br>[Speaker Bookshelf V2 [IVIP]](https://sketchfab.com/3d-models/5ee48c3614d34d089e24f3c11628df0c) — rendysix, CC BY 4.0, 34.0k △, 1024 px, 9.1 MB | Wooden bookshelf boxes with silver tweeter rings and knobs on the right side. |

#### Desks

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `desk-ikea-uppspel` | ⬇ download | [Office Desk 140x60](https://sketchfab.com/3d-models/9262f311271c4c4390341e526d3fe103) — AleixoAlonso, CC BY 4.0, 7.1k △, 4096 px, 22.1 MB | Black gaming desk 180×80, slanted legs and cable basket (edited in Blender). |
| `desk-flexispot-e7` | ⬇ download | [Standing Desk](https://sketchfab.com/3d-models/65a7f4b06a5f4954a0d43eb8812dd165) — Ryan_Nein, CC BY 4.0, 13.2k △, 2048 px, 6.2 MB | Standing desk with dual telescopic legs and keypad; height animation. |
| `desk-secretlab-magnus-pro` | ⬇ download | [Secretlab MAGNUS Pro XL](https://sketchfab.com/3d-models/c8d6d07a4562408abda29062c2019816) — luckyluce, CC BY 4.0, 1.7k △, 2048 px, 2.5 MB | Metal desk, magnetic cable tray, RGB strip at the back edge. |

#### Chairs

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `chair-ikea-markus` | ⬇ download | [Tall Back Office Chair](https://sketchfab.com/3d-models/06269ce18ab7458182564957308cb8a2) — thornbell, CC BY 4.0, 22.9k △, 2048 px, 1.1 MB<br>[IKEA Office Chair](https://sketchfab.com/3d-models/f2a7273cef614632a79400ee70597976) — sirlightless, CC BY 4.0, 103.5k △, 2048 px, 16 MB | Tall mesh back, integrated headrest, black fabric. |
| `chair-secretlab-titan-evo` | ⬇ download | [Gaming Chair](https://sketchfab.com/3d-models/ccb3ada5917a4b90b689e1d1bf852dc2) — Kiiba, CC BY 4.0, 13.5k △, 2048 px, 9.8 MB<br>[Gaming chair](https://sketchfab.com/3d-models/601afdea98f14c488ee0be0ffb4b92dd) — snjvsngh_negi, CC BY 4.0, 51.6k △, 4096 px, 19.4 MB | Racing bucket seat, magnetic head pillow, 4D armrests. |
| `chair-hm-embody-gaming` | 🛠 Blender | [Herman Miller COSM Chair](https://sketchfab.com/3d-models/3b6bd05e32494279871c5a4074e43dc2) — CindyO, CC BY 4.0, 25.0k △, no tex, 0.6 MB<br>[Office chair](https://sketchfab.com/3d-models/af2f07d06f6349158c1d24d87f5ceb95) — AK STUDIO, CC BY 4.0, 28.8k △, 2048 px, 9.6 MB | Ergonomic spine back from an office-chair base: pixel-pattern back support, cobalt accent. |

#### Cases

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `case-deepcool-cc560-v2` | 🛠 Blender | [Basic PC case](https://sketchfab.com/3d-models/2869fb18575d49128a3115d42d5d3826) — Sousinho, CC BY 4.0, 26.8k △, 4096 px, 48.8 MB | Parametric case: mesh front with 3 ARGB fans plus 1 rear, glass side, black. |
| `case-corsair-4000d-airflow` | ⬇ download | [Corsair 4000D  PC case](https://sketchfab.com/3d-models/bc15e007d6634579bc0e8ffdf238e665) — SzaBa, CC BY 4.0, 7.7k △, 2048 px, 18.7 MB<br>[Corsair 4000D Airflow (Free)](https://sketchfab.com/3d-models/34df3ba96cf94e71accdb5779c4b8694) — Kirigami, CC BY 4.0, 98.0k △, 1024 px, 4.1 MB | Triangular-perforation front, glass side, white/black. |
| `case-nzxt-h5-flow-2024` | ⬇ download | [NZXT type PC Case fully functional and [ Free ]](https://sketchfab.com/3d-models/bddaa9ac52a3458f819acb411d6b4f61) — Igor.Jop, CC BY 4.0, 7.1k △, 4096 px, 8.9 MB | Clean flat panels, perforated front, angled bottom fan, white. |
| `case-fractal-north` | ⬇ download | [crosair 4000d x fractal north](https://sketchfab.com/3d-models/8366a780be1e4ef2bd9098ac4dd7a02d) — tavanth, CC BY 4.0, 80.9k △, 1024 px, 3 MB | Wooden front slats (walnut/oak), mesh or glass side, charcoal or chalk. |
| `case-lianli-o11d-evo` | 🛠 Blender | new model | Dual-chamber aquarium: front and side glass with no pillar, side fan rack (no free model). |

#### CPUs

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `cpu-amd-r5-8500g` | 🛠 Blender | [amd ryzen 9](https://sketchfab.com/3d-models/fff4a783d9824800a912c3c7a79c1ac0) — hoti28, CC BY 4.0, 2.0k △, 2048 px, 15.5 MB<br>[AM4 Cpu [ Free ]](https://sketchfab.com/3d-models/912c9c42d2dc40fe95574345aae51ea0) — Igor.Jop, CC BY 4.0, 42.1k △, 2048 px, 3.9 MB | AM5 octopus heat spreader with neutral engraving; LGA pads underneath (AM5 has no pins). |
| `cpu-intel-i5-14400f` | 🛠 Blender | [(FREE) intel cpu](https://sketchfab.com/3d-models/fe534a3cae7c4e66b6131da9b5dae6ff) — Moonway 3D, CC BY 4.0, 11.2k △, 1024 px, 1.1 MB<br>[Intel i7 4th Generation Processor](https://sketchfab.com/3d-models/ef01cdf8d02d4b2c90f2ca16301012ce) — ABHISHEK VERMA , 3D Designer, CC BY 4.0, 18.7k △, 1024 px, 1.3 MB | Rectangular LGA1700 heat spreader with side notches, pads underneath. |
| `cpu-amd-r5-7600` | 🛠 Blender | [amd ryzen 9](https://sketchfab.com/3d-models/fff4a783d9824800a912c3c7a79c1ac0) — hoti28, CC BY 4.0, 2.0k △, 2048 px, 15.5 MB | Same AM5 base; engraving differs (product name shown in the UI). |
| `cpu-intel-ultra7-265k` | 🛠 Blender | [(FREE) intel cpu](https://sketchfab.com/3d-models/fe534a3cae7c4e66b6131da9b5dae6ff) — Moonway 3D, CC BY 4.0, 11.2k △, 1024 px, 1.1 MB | LGA1851 heat spreader (longer, different notch positions). |
| `cpu-amd-r7-7800x3d` | 🛠 Blender | [amd ryzen 9](https://sketchfab.com/3d-models/fff4a783d9824800a912c3c7a79c1ac0) — hoti28, CC BY 4.0, 2.0k △, 2048 px, 15.5 MB | AM5 base; 3D V-Cache shown as an exploded die-stack inset. |
| `cpu-amd-r9-9950x` | 🛠 Blender | [amd ryzen 9](https://sketchfab.com/3d-models/fff4a783d9824800a912c3c7a79c1ac0) — hoti28, CC BY 4.0, 2.0k △, 2048 px, 15.5 MB | AM5 base; exploded view shows two CCD chiplets plus the I/O die. |

#### Coolers

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `cool-deepcool-ak400` | 🛠 Blender | [Cooler Master CPU Cooler](https://sketchfab.com/3d-models/e54651982f524644a2144b52a6b36e89) — BlenderFace, CC BY 4.0, 93.5k △, 2048 px, 5.3 MB | Single tower from the current cooler: black top cover with stripe, one 120 mm fan, 4 heat pipes. |
| `cool-thermalright-pa120se` | 🛠 Blender | [Cooler Master CPU Cooler](https://sketchfab.com/3d-models/e54651982f524644a2144b52a6b36e89) — BlenderFace, CC BY 4.0, 93.5k △, 2048 px, 5.3 MB | Dual tower: two fin stacks, 2 fans, 6 heat pipes, silver. |
| `cool-nzxt-kraken-240` | 🛠 Blender | [Liquid CPU Cooling](https://sketchfab.com/3d-models/7a0014c1141a4c25bc69912075526ee5) — Denzerru, CC BY 4.0, 107.9k △, 256 px, 7.3 MB | Project AIO: round pump cap with an LCD screen texture, 240 mm radiator, 2 fans. |
| `cool-noctua-nh-d15-g2` | ⬇ download | [Noctua NH-D15 CPU cooler](https://sketchfab.com/3d-models/23e225925e174a9f929d995cd9bd22e2) — SzaBa, CC BY 4.0, 10.3k △, no tex, 0.6 MB<br>[Noctua fan](https://sketchfab.com/3d-models/61d0bfab147743138ab9b79d4316bc21) — BlackCube, CC BY 4.0, 5.6k △, 4096 px, 19.9 MB | Dual tower with two beige/brown 140 mm fans (Noctua fan model). |

#### Motherboards

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `mb-msi-pro-b760m-a-ddr4` | ⬇ download | [Motherboard MSI Z790 Low Poly](https://sketchfab.com/3d-models/7ac2ed91599a4239aba96770a00874ce) — cityon360, CC BY 4.0, 4.5k △, 2048 px, 2.9 MB | mATX (244×244), LGA1700, silver-grey heatsinks, 4 DIMM. |
| `mb-msi-b650-gaming-plus` | ⬇ download | [MSI B450 TOMAHAWK MAX](https://sketchfab.com/3d-models/8ea715471e344599a07bbdbbc77dfbdd) — shig0, CC BY 4.0, 18.8k △, 4096 px, 9.8 MB | ATX, AM5, black with grey heatsinks. |
| `mb-asus-tuf-b650-plus` | 🛠 Blender | [X570 Prime motherboard [HQ PBR]](https://sketchfab.com/3d-models/25b3659935774b1e9d73d8954be065d8) — Igor.Jop, CC BY 4.0, 35.0k △, 2048 px, 9.7 MB | From the X570 board: TUF yellow/grey heatsink texture, AM5 socket swap. |
| `mb-asus-prime-z890-p` | 🛠 Blender | [X570 Prime motherboard [HQ PBR]](https://sketchfab.com/3d-models/25b3659935774b1e9d73d8954be065d8) — Igor.Jop, CC BY 4.0, 35.0k △, 2048 px, 9.7 MB | From the X570 Prime board: LGA1851 socket swap, white/silver heatsinks. |

#### RAM

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `ram-kingston-beast-ddr4-16` | ⬇ download | [Kingston HyperX Fury Black RAM Module](https://sketchfab.com/3d-models/3d9499b5337f475d8bbb1eccdb20e73d) — Astrien, CC BY 4.0, 16.9k △, 4096 px, 17.2 MB | Black low-profile heat spreader; DDR4 notch. |
| `ram-kingston-beast-ddr5-16` | 🛠 Blender | [Kingston HyperX Fury Black RAM Module](https://sketchfab.com/3d-models/3d9499b5337f475d8bbb1eccdb20e73d) — Astrien, CC BY 4.0, 16.9k △, 4096 px, 17.2 MB | Same spreader, DDR5 centre notch and PMIC on the PCB. |
| `ram-kingston-beast-ddr5-32` | 🛠 Blender | [Kingston HyperX Fury Black RAM Module](https://sketchfab.com/3d-models/3d9499b5337f475d8bbb1eccdb20e73d) — Astrien, CC BY 4.0, 16.9k △, 4096 px, 17.2 MB | As DDR5-16, double-sided chips (exploded view). |
| `ram-corsair-vengeance-rgb-32` | ⬇ download | [RAM Corsair Vengeance DDR4 RGB Pro](https://sketchfab.com/3d-models/ee5c6e6b2e524d63a7043365e73a2420) — lime.ball.animations, CC BY 4.0, 2.8k △, 1024 px, 0.7 MB<br>[Corsair DOMINATOR RGB RAM](https://sketchfab.com/3d-models/8995a60d2dcc46b3be14c35c1c016c0a) — MajdyModels, CC BY 4.0, 97.0k △, 1024 px, 4.5 MB | Tall RGB light bar, angular spreader. |
| `ram-gskill-trident-z5-64` | ✅ have | [Ram G-radient (totally not TridentZ)](https://sketchfab.com/3d-models/f75a71bb25ef476e924785b05b47c92c) — Igor.Jop, CC BY 4.0, 2.1k △, 2048 px | Current RGB stick (Trident-like) with a DDR5 notch edit. |

#### GPUs

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `gpu-asus-dual-5060ti-16` | 🛠 Blender | [MSI GeForce RTX 3080 Gaming X Trio / Now Free!](https://sketchfab.com/3d-models/e5356746dcec48f9868164bb9674ab9a) — M E U, CC BY 4.0, 64.7k △, 2048 px, 4.5 MB | From the split 3080: drop fan_2, shorten shroud and heatsink to a 2-fan 229 mm card, grey-white shroud. |
| `gpu-nvidia-5070-fe` | ⬇ download | [NVIDIA RTX 5090 Founders Edition](https://sketchfab.com/3d-models/5934a7ddfa144951ac66eb8cab13f220) — PolyDavid, CC BY 4.0, 43.2k △, 2048 px, 17.3 MB | 50-series Founders Edition design (double flow-through), scaled to the 2-slot 242 mm card. |
| `gpu-sapphire-9070xt-pulse` | ⬇ download | [AMD Sapphire NITRO+ Radeon RX 7900 XTX](https://sketchfab.com/3d-models/34ae089114524c61880235e96b48f7f6) — PolyDavid, CC BY 4.0, 255.2k △, no tex, 12.9 MB<br>[MSI GeForce RTX 3080 Gaming X Trio / Now Free!](https://sketchfab.com/3d-models/e5356746dcec48f9868164bb9674ab9a) — M E U, CC BY 4.0, 64.7k △, 2048 px, 4.5 MB | 3-fan Sapphire style (255k, decimate to ~40k) or recoloured 3080 parts with red accents. |
| `gpu-nvidia-5080-fe` | ⬇ download | [NVIDIA RTX 5090 Founders Edition](https://sketchfab.com/3d-models/5934a7ddfa144951ac66eb8cab13f220) — PolyDavid, CC BY 4.0, 43.2k △, 2048 px, 17.3 MB | Same Founders Edition design, 304 mm. |
| `gpu-asus-rog-astral-5090` | ⬇ download | [RTX 3090 Asus ROG STRIX White Edition videocard](https://sketchfab.com/3d-models/506b1c68d24f4a9088ea0eaef41f7dd9) — Marcseus, CC BY 4.0, 299.7k △, 1024 px, 12.3 MB | From ROG Strix 3090 (300k, decimate): black recolour, fourth fan on the back (Astral), 358 mm. |

#### SSDs

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `ssd-kingston-nv3-1tb` | 🛠 Blender | [m2ssd_Painter](https://sketchfab.com/3d-models/ccda7c201091445087c02692444641c2) — Igor.Jop, CC BY 4.0, 0.8k △, 2048 px, 2.7 MB | M.2 2280 single-sided, blue-white label, no DRAM chip. |
| `ssd-samsung-870-evo-1tb` | ⬇ download | [Sata Samsung SM883 SSD](https://sketchfab.com/3d-models/09cd60eca56e45f38ec670fc8f848b6f) — PolyDavid, CC BY 4.0, 0.2k △, 2048 px, 4.2 MB<br>[Storage (SSD, HDD, M.2)](https://sketchfab.com/3d-models/bdd5fd67a7674359ab8648204b5c0575) — Vivien Deroche, CC BY 4.0, 104.6k △, 1024 px, 6.7 MB | 2.5″ SATA case, black/grey; SATA port markers. |
| `ssd-wd-sn850x-1tb` | 🛠 Blender | [m2ssd_Painter](https://sketchfab.com/3d-models/ccda7c201091445087c02692444641c2) — Igor.Jop, CC BY 4.0, 0.8k △, 2048 px, 2.7 MB | M.2 with black PCB and black label; optional heatsink variant. |
| `ssd-samsung-990-pro-2tb` | ⬇ download | [M.2 NVME SSD Samsung 990 Pro 1TB 3D model](https://sketchfab.com/3d-models/41b7bfda7eab40f8b13330913fd66fc2) — lime.ball.animations, CC BY 4.0, 2.0k △, 1024 px, 1.8 MB<br>[SSD Samsung 980 PRO 1TB](https://sketchfab.com/3d-models/208b846d5a5948368b4ad0676bf4ab97) — cityon360, CC BY 4.0, 1.9k △, 2048 px, 1.8 MB | Nickel-coated label, controller, DRAM and 2 NAND chips. |

#### PSUs

| Product id | Status | Base / candidate | What makes it distinct |
|---|---|---|---|
| `psu-deepcool-pk550d` | 🛠 Blender | [PSU Power Supply Unit](https://sketchfab.com/3d-models/69ccd1be3a77497cb2acc9e39e7c52b3) — Groovex, CC BY 4.0, 12.2k △, no tex, 0.7 MB | Non-modular: fixed cable bundle out of the back. |
| `psu-bequiet-pp12m-650` | 🛠 Blender | [PSU Power Supply Unit](https://sketchfab.com/3d-models/69ccd1be3a77497cb2acc9e39e7c52b3) — Groovex, CC BY 4.0, 12.2k △, no tex, 0.7 MB | Black with a silver wing-pattern fan grille, semi-modular panel. |
| `psu-corsair-rm750e` | 🛠 Blender | [PSU Power Supply Unit](https://sketchfab.com/3d-models/69ccd1be3a77497cb2acc9e39e7c52b3) — Groovex, CC BY 4.0, 12.2k △, no tex, 0.7 MB | Fully modular back panel (connector rows), matte black, side label. |
| `psu-corsair-rm850x` | 🛠 Blender | [PSU Power Supply Unit](https://sketchfab.com/3d-models/69ccd1be3a77497cb2acc9e39e7c52b3) — Groovex, CC BY 4.0, 12.2k △, no tex, 0.7 MB | As RM750e plus the ATX 3.1 12V-2x6 port and a different grille. |
| `psu-seasonic-focus-gx-1000` | ⬇ download | [Seasonic M12II Evo](https://sketchfab.com/3d-models/c1a6f7445f1a4895a944c709162450c1) — mistz-ik, CC BY 4.0, 0.4k △, no tex | Seasonic base (444 triangles, very simple) rebuilt in Blender: hybrid fan switch, modular panel. |

## 6. Blender headless pipeline (proved in V2-0)

### 6.1 What it does

`scripts/blender/pipeline.py` runs inside Blender 5.1 without the UI. Each config in `scripts/blender/configs/*.json` describes one model:

```
GLB import
  → cleanup: remove logo meshes and invisible helpers, make meshes single-user,
             weld duplicate vertices (relative distance), delete loose vertices
  → split: ordered rules assign each mesh to a named part (first match wins;
           exactly one fallback part); each part is joined into one object
  → normalise: real size in metres (longest side), model on the ground at the
               origin, each part's origin at its own centre (for teardown motion)
  → tag: node extras { part, labelKey, explode: [x, y, z] metres in glTF axes, order }
  → ports: empty nodes port_<type>_<n>, parented to their part; +Z of the empty
           is the plug direction; extras { port, dir, labelKey }
  → export GLB (export_extras), LOD1 GLB (planar dissolve + collapse decimation),
           JSON report, optional Workbench preview renders (assembled / exploded)
```

### 6.2 Config format (abridged from `configs/gpu_triple_fan.json`)

```json
{
  "name": "gpu_triple_fan",
  "input": "assets-src/sketchfab/gpu_triple_fan.glb",
  "output": "assets-src/blender/gpu_triple_fan/gpu_triple_fan.glb",
  "realSize": 0.323,
  "cleanup": { "removeInvisible": true, "weldDistance": 0.00001,
               "remove": [{ "materials": "^(msilogo1|msilogopng|geforcertx|gfrtx2)$" }] },
  "parts": [
    { "id": "fan_1", "label": "devices.gpu.parts.fan", "order": 1, "explode": [-0.12, 0, 0.95],
      "rules": [{ "groups": "^(Cylinder\\.004_5|Cylinder\\.052_254)$" }] },
    { "id": "pcb", "rules": [{ "groups": "^Cube\\.146_159$" },
                             { "center": { "max": [1000, 1000, 0.75] }, "materials": "^(?!metal1$)" }] },
    { "id": "heatsink", "fallback": true, "explode": [0, 0, 0.42] }
  ],
  "ports": [
    { "type": "hdmi", "part": "io_bracket", "object": "Cube.002_2", "at": [0, 0.703, 0.707], "dir": [-1, 0, 0] },
    { "type": "pcie_x16", "part": "pcb", "at": [0.24, 0.0, 0.3], "dir": [0, -1, 0] }
  ],
  "lod": { "ratio": 0.45, "minTris": 1500, "planarAngle": 2 },
  "preview": { "assembled": "docs/blender/gpu_triple_fan_assembled.jpg", "exploded": "docs/blender/gpu_triple_fan_exploded.jpg" }
}
```

**Rule conditions.** All conditions inside one rule must hold. A part matches if any of its rules matches. The conditions are:
- `groups`: regex on the top named ancestor, i.e. the node the modeller named;
- `objects`: regex on the mesh name;
- `materials`: regex on any material name;
- `center`: bounding-box centre inside `{min, max}`, in Blender coordinates.

**Coordinates and units.**
- Config coordinates are Blender's (Z up), as seen in the Blender viewport.
- `explode` is a fraction of the model's longest side.
- Port `at` is normalised inside the anchor's bounding box: either the original `object` (resolved before joining) or the final part.

### 6.3 Commands

```bash
npm run blender:pipeline                    # all configs; Blender found via BLENDER_PATH or the default 5.1 path
npm run blender:pipeline -- gpu_triple_fan  # one config
node scripts/blender/verify-glb.mjs scripts/blender/configs/gpu_triple_fan.json   # check output without Blender
npm run test:blender                        # config validation + output check (part of npm test)
```

### 6.4 Proof run (V2-0, MSI RTX 3080 Gaming X Trio by M E U, CC BY 4.0)

| Step | Result |
|---|---|
| Import | 424 meshes, 64 709 △ (raw Sketchfab GLB, 4.5 MB) |
| Cleanup | 15 objects removed (4 logo meshes: MSI ×2, GeForce RTX ×2; 11 fully transparent helpers); 37 792 duplicate vertices merged |
| Split | 9 parts: `gpu_chip` 184 △, `fan_1/2/3` 1 666 △ each, `shroud` 879, `io_bracket` 14 760, `backplate` 832, `pcb` 20 086, `heatsink` 6 708 |
| Ports | 8 markers: `port_displayport_1..3`, `port_hdmi_1` (I/O bracket), `port_pcie_x16_1`, `port_pcie_8pin_1..3` (PCB) |
| Normalise | 0.323 m long, on the ground, part origins at their centres |
| LOD1 | 48 447 → 22 588 △ |
| Web size | Blender GLB 2.7 MB → **0.53 MB** after Meshopt + WebP 1K (part nodes, extras and port markers preserved; today's monolithic GPU is 0.58 MB) |
| Time | ≈ 5 s per run |
| Verification | `verify-glb.mjs`: 9 parts with extras, 8 ports under the right parents, LOD1 lighter → OK |

Renders: `docs/blender/gpu_triple_fan_assembled.jpg`, `docs/blender/gpu_triple_fan_exploded.jpg`.

### 6.5 Integration notes for V2-2 and V2-5

- **No cross-part joins in web optimisation.** `scripts/optimize-assets.mjs` currently runs `flatten + join` and would merge the teardown parts. Pipeline outputs need a part-preserving profile:
  - `dedup`, then `prune({ keepExtras: true, keepLeaves: true })`;
  - join inside each part only;
  - WebP/KTX2;
  - Meshopt.

  This was tested ad hoc in V2-0 (0.53 MB above).
- **High-poly perforations** (I/O bracket 14.7k △) are LOD0-only. LOD1 replaces them with an alpha-to-coverage texture (AUDIT A3).
- **Port markers** are the anchors for V2-6 cable plugging: the cable end snaps to `port_<type>_<n>` and aligns with its `dir`.
- **Teardown (V2-5)** reads `explode` and `order` from the node extras. No coordinates are hard-coded in React.

## 6b. Batch 1 result (V2-2a, 2026-10-10)

- **Downloaded:** 26 GLBs by the owner.
  - 21 of the 24 planned.
  - Not downloaded: HyperX "Headphones HyperX", Logitech K120, Dell UltraSharp.
  - 5 the owner picked: "Wireless Headphones" (uliana), "Keyboard" (thethieme), "Gaming keyboard" (ZxTulz), "Satellite Enhanced" (rendysix), "Low poly – Computer Mouse" (IQINISO).
- **Substitutes used:**

  | Product | Model used |
  |---|---|
  | HyperX Cloud III | Wireless Headphones |
  | Logitech K120 | Keyboard |
  | Dell U2724D | 27″ monitor base, silver, taller |
  | Logitech PRO X TKL and Razer Huntsman TKL | Gaming keyboard, TKL |
  | Creative Pebble V3 | Satellite |

- **Result:** all 28 products of batch 1 have their own model (ASSET_MANIFEST.md, "Setup Studio per-product models").

## 6c. Batch 2 result (V2-2b, 2026-10-10)

- **Downloaded:** 18 GLBs by the owner: the 16 planned models plus 2 extras. The owner's list is in `Downloads/PC_3D_MODELS_README.md`.
- **Mismatches** (the model is a stand-in for the product):

  | Product | Model used |
  |---|---|
  | Fractal North | A Corsair 4000D with a North-style front (mod) |
  | NZXT H5 Flow | Same mod base, flat white |
  | MSI B650 | MSI B450 TOMAHAWK MAX |
  | MSI B760M | MSI Z790 low poly |
  | Samsung 870 EVO | Samsung SM883 |
  | Lian Li O11 | NZXT-style case (Igor.Jop) |
  | be quiet!/Corsair PSUs | Aerocool KCAS (the Seasonic M12II CAD shape has only 444 △) |

  The real "Fractal North" model on Sketchfab does not allow downloads.
- **Reused earlier originals:** the cooler tower (AK400), X570 board (ASUS TUF/Prime), Trident-style RAM, 3080 Gaming X Trio (5060 Ti Dual), M.2 SSD (NV3/SN850X) and the PSU (PK550D/Focus GX).
- **Result:** 31 model configs for 37 catalog products. Physically identical packages share one model: AM5 (4 CPUs), LGA (2 CPUs) and Kingston FURY Beast (3 kits).
  - Port/slot markers: 24 per motherboard, 19 per case, 6 per GPU, 5 per PSU.
  - Still without a model: NZXT Kraken 240 (procedural AIO) and the 3.5″ HDD (procedural).
  - Details: ASSET_MANIFEST.md, "PC components (V2-2b)".
- **Pipeline additions:**
  - `rotate` steps;
  - a `size` cleanup rule;
  - marker naming (`slot_*`, `header_*`, `socket_*`, `mount_*`);
  - `optimize-assets.mjs products [id …]` (escalating error, `Prune`/`Permissive`; `join` no longer prunes the markers).

## 7. What the owner needs to do

### (a) Models to download: owner signs in to Sketchfab

- Sketchfab requires a signed-in account to download, even for CC BY/CC0.
- The owner signs in at https://sketchfab.com/login in the browser. Claude never types passwords.
- Before each batch, Claude asks for approval with the file names and sizes. Format: **glTF Binary (.glb)**, "original" (not "auto-converted" when both exist).

The batches by stage:

| Batch | Stage | Models | ≈ Raw size |
|---|---|---|---|
| 1 | V2-2a (peripherals and furniture) | 24 | 316 MB |
| 2 | V2-2b (PC components) | 16 | 127 MB |
| 3 | V2-4a (internals, storage, input/output devices) | 14 | 85 MB |
| 4 | V2-4b (networking, mobile, cables) | 19 | 90 MB |

Full list, in download order:

| # | Batch / stage | Used for | Model — author, licence, triangles, max texture, GLB size |
|---|---|---|---|
| 1 | V2-2a | `chair-hm-embody-gaming` | [Herman Miller COSM Chair](https://sketchfab.com/3d-models/3b6bd05e32494279871c5a4074e43dc2) — CindyO, CC BY 4.0, 25.0k △, no tex, 0.6 MB |
| 2 | V2-2a | `chair-ikea-markus` | [Tall Back Office Chair](https://sketchfab.com/3d-models/06269ce18ab7458182564957308cb8a2) — thornbell, CC BY 4.0, 22.9k △, 2048 px, 1.1 MB |
| 3 | V2-2a | `chair-secretlab-titan-evo` | [Gaming Chair](https://sketchfab.com/3d-models/ccb3ada5917a4b90b689e1d1bf852dc2) — Kiiba, CC BY 4.0, 13.5k △, 2048 px, 9.8 MB |
| 4 | V2-2a | `desk-flexispot-e7` | [Standing Desk](https://sketchfab.com/3d-models/65a7f4b06a5f4954a0d43eb8812dd165) — Ryan_Nein, CC BY 4.0, 13.2k △, 2048 px, 6.2 MB |
| 5 | V2-2a | `desk-ikea-uppspel` | [Office Desk 140x60](https://sketchfab.com/3d-models/9262f311271c4c4390341e526d3fe103) — AleixoAlonso, CC BY 4.0, 7.1k △, 4096 px, 22.1 MB |
| 6 | V2-2a | `desk-secretlab-magnus-pro` | [Secretlab MAGNUS Pro XL](https://sketchfab.com/3d-models/c8d6d07a4562408abda29062c2019816) — luckyluce, CC BY 4.0, 1.7k △, 2048 px, 2.5 MB |
| 7 | V2-2a | `hs-hyperx-cloud-iii` | [Headphones HyperX](https://sketchfab.com/3d-models/7ab71d97d39f4ab1950692838ab906b4) — Wuteken, CC BY 4.0, 7.0k △, 4096 px, 18.3 MB |
| 8 | V2-2a | `hs-logitech-pro-x2` | [G735 Logitech Gaming Headset](https://sketchfab.com/3d-models/8930ea831c7e45e8929c77888a6b5e7d) — shaielwolf, CC BY 4.0, 40.5k △, 2048 px, 29.5 MB |
| 9 | V2-2a | `hs-razer-blackshark-v2-pro` | [Razer Headset](https://sketchfab.com/3d-models/fa7de2b85f6c44ad80b53aabd5142070) — harithsami01, CC BY 4.0, 67.6k △, 4096 px, 32.5 MB |
| 10 | V2-2a | `hs-steelseries-nova7` | [SteelSeries Arctis Wireless Pro](https://sketchfab.com/3d-models/2eeabb208f9f45cf87e2eb1d5bc83ab3) — mariokart64n, CC BY 4.0, 56.3k △, 4096 px, 26.8 MB |
| 11 | V2-2a | `kb-keychron-k8-pro` | [Keychron K8](https://sketchfab.com/3d-models/b00c531f3d8f4fd39c636eae56f23c0f) — MozzarellaARC, CC BY 4.0, 45.6k △, 4096 px, 43.9 MB |
| 12 | V2-2a | `kb-logitech-k120` | [Logitech Keyboard K120 - Top v3](https://sketchfab.com/3d-models/b6d860209f8f46339645695c13c69930) — GolloMotorS1, CC BY 4.0, 106.9k △, 8192 px, 14.4 MB |
| 13 | V2-2a | `kb-logitech-mx-keys-s` | [Logitech MX Keys](https://sketchfab.com/3d-models/67901d82781f48349f1f61ce78a6b6e0) — ArkinRS, CC BY 4.0, 27.2k △, 4096 px, 17.6 MB |
| 14 | V2-2a | `kb-logitech-pro-x-tkl` | [Logitech mechanical gaming keyboard](https://sketchfab.com/3d-models/c775d45baf854606931584404d7b9109) — BlackCube, CC BY 4.0, 33.7k △, 4096 px, 2 MB |
| 15 | V2-2a | `kb-razer-huntsman-v3-pro-tkl` | [RAZER BlackWidow Chroma](https://sketchfab.com/3d-models/c4c42707816b40f2b5f5fe1bae89dfb5) — Mieshu, CC BY 4.0, 7.0k △, 4096 px, 12.6 MB |
| 16 | V2-2a | `mon-asus-va24ehf` | [PC Monitor 27 inch](https://sketchfab.com/3d-models/06fb18eec19245d4811c4c3c8c7ea567) — Annelida, CC BY 4.0, 6.4k △, 4096 px, 9.2 MB |
| 17 | V2-2a | `mon-asus-xg27acs`, `mon-asus-xg27aqmr` | [ASUS  TUF gaming monitor](https://sketchfab.com/3d-models/570372a3cc6941029b2490eb3113b224) — Jelvehkar, CC BY 4.0, 59.4k △, 1024 px, 2 MB |
| 18 | V2-2a | `mon-dell-u2724d` | [DELL UltraSharp](https://sketchfab.com/3d-models/951c40459085466895fece243ceee8b2) — snrnsrk5, CC BY 4.0, 1.5k △, 4096 px, 2.7 MB |
| 19 | V2-2a | `mon-lg-27gr93u` | [LG moniter](https://sketchfab.com/3d-models/f899bb43701f4e95b1e44c4bf21ed29c) — Mohamed Ahmed, CC BY 4.0, 2.7k △, 2048 px, 1.2 MB |
| 20 | V2-2a | `mouse-logitech-g102`, `mouse-logitech-g305`, `mouse-logitech-superlight2` | [Mouse Logitech G203](https://sketchfab.com/3d-models/6b70ace291c44735bed3309b05f44bba) — JorgeAlfredOwO, CC BY 4.0, 25.0k △, 2048 px, 14.1 MB |
| 21 | V2-2a | `mouse-logitech-g502x-plus` | [Logitech G700s](https://sketchfab.com/3d-models/8d96670d940742c4b515b0a0b0dc92ab) — Miléd Hammoud, CC BY 4.0, 128.0k △, 2048 px, 21.1 MB |
| 22 | V2-2a | `mouse-razer-viper-v3-pro` | [Razer Mouse](https://sketchfab.com/3d-models/9f0a3283cbca4454bf04c8d43494247a) — Fred Drabble, CC BY 4.0, 17.5k △, 2048 px, 1.6 MB |
| 23 | V2-2a | `spk-edifier-r1280db` | [Speaker Bookshelf V2 - Optimized](https://sketchfab.com/3d-models/cbb87dee55e84a389cbccb4ddc0036e0) — rendysix, CC BY 4.0, 15.6k △, 1024 px, 6.2 MB |
| 24 | V2-2a | `spk-logitech-z407` | [Logitech Speakers](https://sketchfab.com/3d-models/73634ff35df3434dbfd2ae87c886ec5f) — Jayemel11, CC BY 4.0, 23.4k △, 2048 px, 17.5 MB |
| 25 | V2-2b | `case-corsair-4000d-airflow` | [Corsair 4000D  PC case](https://sketchfab.com/3d-models/bc15e007d6634579bc0e8ffdf238e665) — SzaBa, CC BY 4.0, 7.7k △, 2048 px, 18.7 MB |
| 26 | V2-2b | `case-fractal-north` | [crosair 4000d x fractal north](https://sketchfab.com/3d-models/8366a780be1e4ef2bd9098ac4dd7a02d) — tavanth, CC BY 4.0, 80.9k △, 1024 px, 3 MB |
| 27 | V2-2b | `case-nzxt-h5-flow-2024` | [NZXT type PC Case fully functional and [ Free ]](https://sketchfab.com/3d-models/bddaa9ac52a3458f819acb411d6b4f61) — Igor.Jop, CC BY 4.0, 7.1k △, 4096 px, 8.9 MB |
| 28 | V2-2b | `cool-noctua-nh-d15-g2` | [Noctua NH-D15 CPU cooler](https://sketchfab.com/3d-models/23e225925e174a9f929d995cd9bd22e2) — SzaBa, CC BY 4.0, 10.3k △, no tex, 0.6 MB |
| 29 | V2-2b | `cpu-amd-r5-8500g`, `cpu-amd-r5-7600`, `cpu-amd-r7-7800x3d`, `cpu-amd-r9-9950x` | [amd ryzen 9](https://sketchfab.com/3d-models/fff4a783d9824800a912c3c7a79c1ac0) — hoti28, CC BY 4.0, 2.0k △, 2048 px, 15.5 MB |
| 30 | V2-2b | `cpu-intel-i5-14400f`, `cpu-intel-ultra7-265k` | [(FREE) intel cpu](https://sketchfab.com/3d-models/fe534a3cae7c4e66b6131da9b5dae6ff) — Moonway 3D, CC BY 4.0, 11.2k △, 1024 px, 1.1 MB |
| 31 | V2-2b | `gpu-asus-rog-astral-5090` | [RTX 3090 Asus ROG STRIX White Edition videocard](https://sketchfab.com/3d-models/506b1c68d24f4a9088ea0eaef41f7dd9) — Marcseus, CC BY 4.0, 299.7k △, 1024 px, 12.3 MB |
| 32 | V2-2b | `gpu-nvidia-5070-fe`, `gpu-nvidia-5080-fe` | [NVIDIA RTX 5090 Founders Edition](https://sketchfab.com/3d-models/5934a7ddfa144951ac66eb8cab13f220) — PolyDavid, CC BY 4.0, 43.2k △, 2048 px, 17.3 MB |
| 33 | V2-2b | `gpu-sapphire-9070xt-pulse` | [AMD Sapphire NITRO+ Radeon RX 7900 XTX](https://sketchfab.com/3d-models/34ae089114524c61880235e96b48f7f6) — PolyDavid, CC BY 4.0, 255.2k △, no tex, 12.9 MB |
| 34 | V2-2b | `mb-msi-b650-gaming-plus` | [MSI B450 TOMAHAWK MAX](https://sketchfab.com/3d-models/8ea715471e344599a07bbdbbc77dfbdd) — shig0, CC BY 4.0, 18.8k △, 4096 px, 9.8 MB |
| 35 | V2-2b | `mb-msi-pro-b760m-a-ddr4` | [Motherboard MSI Z790 Low Poly](https://sketchfab.com/3d-models/7ac2ed91599a4239aba96770a00874ce) — cityon360, CC BY 4.0, 4.5k △, 2048 px, 2.9 MB |
| 36 | V2-2b | `psu-seasonic-focus-gx-1000` | [Seasonic M12II Evo](https://sketchfab.com/3d-models/c1a6f7445f1a4895a944c709162450c1) — mistz-ik, CC BY 4.0, 0.4k △, no tex |
| 37 | V2-2b | `ram-corsair-vengeance-rgb-32` | [RAM Corsair Vengeance DDR4 RGB Pro](https://sketchfab.com/3d-models/ee5c6e6b2e524d63a7043365e73a2420) — lime.ball.animations, CC BY 4.0, 2.8k △, 1024 px, 0.7 MB |
| 38 | V2-2b | `ram-kingston-beast-ddr4-16`, `ram-kingston-beast-ddr5-16`, `ram-kingston-beast-ddr5-32` | [Kingston HyperX Fury Black RAM Module](https://sketchfab.com/3d-models/3d9499b5337f475d8bbb1eccdb20e73d) — Astrien, CC BY 4.0, 16.9k △, 4096 px, 17.2 MB |
| 39 | V2-2b | `ssd-samsung-870-evo-1tb` | [Sata Samsung SM883 SSD](https://sketchfab.com/3d-models/09cd60eca56e45f38ec670fc8f848b6f) — PolyDavid, CC BY 4.0, 0.2k △, 2048 px, 4.2 MB |
| 40 | V2-2b | `ssd-samsung-990-pro-2tb` | [M.2 NVME SSD Samsung 990 Pro 1TB 3D model](https://sketchfab.com/3d-models/41b7bfda7eab40f8b13330913fd66fc2) — lime.ball.animations, CC BY 4.0, 2.0k △, 1024 px, 1.8 MB |
| 41 | V2-4a | `external_drive` | [External Hard Drive](https://sketchfab.com/3d-models/6f01d25fdfde4e5c98a7827749c01a4c) — Daniel.Orlando.Tapia, CC BY 4.0, 4.0k △, 2048 px, 2.1 MB |
| 42 | V2-4a | `gamepad` | [Xbox Inalambric Controller (Black)](https://sketchfab.com/3d-models/29cc9624894a4f2cae7d2a675044db45) — Chistodrako._., CC BY 4.0, 43.1k △, 2048 px, 1.7 MB |
| 43 | V2-4a | `graphics_tablet` | [Wacom Intuos Pro](https://sketchfab.com/3d-models/688bdc10475a470997615af3b2b74f07) — Vivien Deroche, CC BY 4.0, 38.8k △, 2048 px, 14.4 MB |
| 44 | V2-4a | `hdd_35`, `hdd_25`, `ssd_sata` | [Storage (SSD, HDD, M.2)](https://sketchfab.com/3d-models/bdd5fd67a7674359ab8648204b5c0575) — Vivien Deroche, CC BY 4.0, 104.6k △, 1024 px, 6.7 MB |
| 45 | V2-4a | `interactive_panel` | [Interactive display clean](https://sketchfab.com/3d-models/aac67dc4a84f47e5b17fa2cae57edae8) — g33, CC BY 4.0, 84.1k △, 2048 px, 16.1 MB |
| 46 | V2-4a | `microphone` | [Microphone Audio-technica AT2020](https://sketchfab.com/3d-models/506390cb11464c16b825dfb18eada1f1) — DORA, CC BY 4.0, 14.0k △, 4096 px, 17.7 MB |
| 47 | V2-4a | `optical_disc` | [Compact Disc](https://sketchfab.com/3d-models/06254ae4c6c04bc4b1cb5bd9b6c2ea41) — SEMA Game Studio, CC BY 4.0, 6.1k △, 2048 px, 3.8 MB |
| 48 | V2-4a | `printer_inkjet` | [Canon Inkjet Printer](https://sketchfab.com/3d-models/13b495e4a2e3479e8ec5d9fd72ce6e49) — Mixmamo.studio:   An effortless 3D collections., CC BY 4.0, 10.2k △, no tex, 0.6 MB |
| 49 | V2-4a | `printer_laser` | [HP Laser Jet Pro Printer](https://sketchfab.com/3d-models/efa71da7b59b420a92303296f4e12a97) — Pradeep.Kumar2, CC BY 4.0, 42.0k △, 4096 px, 4.5 MB |
| 50 | V2-4a | `projector` | [Projector- 5 MB](https://sketchfab.com/3d-models/51c7808236d14baf840faeb29ab93bb8) — Mehdi Shahsavan, CC BY 4.0, 5.6k △, 2048 px, 5.4 MB |
| 51 | V2-4a | `sd_card` | [SD Card 1:1 Realistic](https://sketchfab.com/3d-models/4b3dda4a861646f1a0c00347574957e7) — SolverData, CC BY 4.0, 17.9k △, 4096 px, 2.6 MB |
| 52 | V2-4a | `thermal_paste` | [THERMAL_PASTE](https://sketchfab.com/3d-models/1f3d78897bba4bb0a9102263618f346a) — JP, CC BY 4.0, 3.2k △, no tex, 0.1 MB |
| 53 | V2-4a | `usb_flash` | [USB Stick](https://sketchfab.com/3d-models/b9de9f354d3b4f9eb217ad9e67c3020f) — Vaxeon, CC BY 4.0, 60.3k △, 2048 px, 2.9 MB |
| 54 | V2-4a | `webcam` | [Web Camera](https://sketchfab.com/3d-models/b6461ec1520748179686b87bef7089e9) — darklord3d, CC BY 4.0, 59.6k △, 2048 px, 6.5 MB |
| 55 | V2-4b | `all_in_one` | [2009 - 2011 iMac, 27 inch](https://sketchfab.com/3d-models/7b3732dbf3d14ecbb919373233efcfd1) — Ne0nGenisis, CC BY 4.0, 33.9k △, 4096 px, 10 MB |
| 56 | V2-4b | `audio_cable` | [Aux Jack 3.5mm](https://sketchfab.com/3d-models/6db86076d91747b09fb776cfe4513505) — PolyDavid, CC BY 4.0, 1.8k △, 2048 px, 3.5 MB |
| 57 | V2-4b | `hdmi_cable` | [Male HDMI connector](https://sketchfab.com/3d-models/d165fd6f84b14c1da9aee8bda2bb48a9) — idewe-learning, CC BY 4.0, 5.3k △, no tex, 0.3 MB |
| 58 | V2-4b | `laptop` | [Gaming Laptop](https://sketchfab.com/3d-models/4e72a2078b3c4a75a821ab09830693fe) — Vivien Deroche, CC BY 4.0, 120.3k △, 2048 px, 21 MB |
| 59 | V2-4b | `modem` | [Action Intelbras Modem](https://sketchfab.com/3d-models/3d8d5ea391bd4f30bb0603eb07f17ca9) — ghBanck, CC BY 4.0, 6.5k △, 2048 px, 2.1 MB |
| 60 | V2-4b | `nas` | [NAS Storage Device](https://sketchfab.com/3d-models/ade9536b36bf405e9fb91494d5dc506a) — karakocyunus, CC BY 4.0, 207.2k △, no tex, 6.4 MB |
| 61 | V2-4b | `nic` | [Network Interface Card](https://sketchfab.com/3d-models/191c8ad40de2430980b879615aa0d2e3) — ARComputerFundamentals, CC BY 4.0, 193.7k △, 512 px, 6.2 MB |
| 62 | V2-4b | `printer_3d` | [3D Printer](https://sketchfab.com/3d-models/0e825a8d48b14bee883a131fe029d4fc) — Gregsterius, CC BY 4.0, 52.1k △, no tex, 2.2 MB |
| 63 | V2-4b | `router` | [Router](https://sketchfab.com/3d-models/ac86d8ae65a54f4aa99d7d624f71e5f4) — Rasmus, CC BY 4.0, 2.2k △, 4096 px, 1.5 MB |
| 64 | V2-4b | `sbc` | [Raspberry Pi 3](https://sketchfab.com/3d-models/2d308283fc0f4d27b81f17a2793c5c4d) — JoSaCo, CC BY 4.0, 13.0k △, 2048 px, 2.6 MB |
| 65 | V2-4b | `server_rack` | [Data Center Server Rack](https://sketchfab.com/3d-models/01b49d9d1f694ba5b41e4b2b0e10d16e) — EntropyNine, CC BY 4.0, 27.9k △, 2048 px, 14 MB |
| 66 | V2-4b | `smartphone` | [Off-brand Android Smartphone](https://sketchfab.com/3d-models/2a1c8666306e4116980daeb9406e7780) — SabasGT, CC BY 4.0, 4.0k △, 2048 px, 1.9 MB |
| 67 | V2-4b | `smartwatch` | [Smart Watch Low Poly](https://sketchfab.com/3d-models/ea4f25ed03c54c35a5fe3b1218bdc76b) — ahmadrezagh671, CC BY 4.0, 1.9k △, 1024 px, 1.7 MB |
| 68 | V2-4b | `switch` | [TL-SF1005D](https://sketchfab.com/3d-models/90966bd409204294918c68c11c7da831) — arieffitrah, CC BY 4.0, 26.1k △, no tex, 1.7 MB |
| 69 | V2-4b | `tablet` | [Ipad 7](https://sketchfab.com/3d-models/ec2b3966d0384f87bfdff55799778bf0) — atom, CC BY 4.0, 30.3k △, 2048 px, 3.7 MB |
| 70 | V2-4b | `ups` | [PSI5-2200RT120](https://sketchfab.com/3d-models/239d6100ac1a468ab54f343aff0da950) — Vertiv, CC BY 4.0, 9.9k △, 2048 px, 2.4 MB |
| 71 | V2-4b | `usb_c_cable` | [USB-C Charging Cable (Type-C – Type-C)](https://sketchfab.com/3d-models/39cb1374a9c24cfa815f8efe86a14f61) — alessandroparca, CC BY 4.0, 13.4k △, no tex, 0.4 MB |
| 72 | V2-4b | `usb_hub` | [USB Hub](https://sketchfab.com/3d-models/ca45e5fa0fcc42a7a4894810fd456900) — YinRebuffReality, CC BY 4.0, 1.5k △, 2048 px, 7.6 MB |
| 73 | V2-4b | `wifi_adapter` | [USB Wifi Adapter](https://sketchfab.com/3d-models/179787d27c2647ecb854eb8c607efa53) — VeLoct84, CC BY 4.0, 3.1k △, 1024 px, 0.3 MB |

**No login:** Poly Haven assets (§4) download directly; Claude still asks before each download.

### (b) What Claude produces in Blender (no download, no cost)

- **13 devices built from scratch:**
  - `cooler_liquid` (from the project AIO), `internal_cables`, `cmos_battery`, `hdd_25`, `optical_drive`, `scanner`;
  - `ethernet_cable` (with T568B wires), `access_point`, `docking_station`, `card_reader`;
  - `hdmi_cable`, `displayport_cable`, `usb_a_cable` (USB-A/USB-B/micro-B heads).
- **28 product variants** derived from bases (§5.2): monitors, mice, CPUs (AM5 / LGA1700 / LGA1851), coolers, motherboards, RAM, GPUs (2-fan / 4-fan), SSDs, PSUs, Lian Li dual-chamber case, DeepCool case, Pebble speakers, Embody-style chair.
- **Teardown internals** missing from the free exteriors:
  - laptop: battery, SO-DIMM, M.2, fan + heat pipe, Wi-Fi card, board;
  - all-in-one;
  - smartphone: battery, board, cameras, frame;
  - tablet;
  - 3D printer parts split;
  - HDD platters and arm;
  - laser printer drum and fuser;
  - PSU internals.
- **For every model:**
  - logo removal (meshes + texture repaint);
  - real size;
  - port markers;
  - LOD1;
  - triangle reduction (CPU pins → normal map, 194k/207k/300k models decimated).

### (c) Paid options (prices seen 2026-10-10; check the live page before buying)

| Item | Price | Licence | Worth it? |
|---|---|---|---|
| [Superhive "Gamer Room PC Computer Parts"](https://superhivemarket.com/products/gamer-room-pc-computer-parts/docs): motherboards, GPUs, CPUs, coolers (Blender) | $49.99 | Royalty-free | Optional. It would add more distinct PC component shapes for V2-2b; free candidates and Blender variants already cover all 67 products |
| [CGTrader "huawei mate xt ultimate design rigged"](https://www.cgtrader.com/3d-models/electronics/other/huawei-mate-xt-ultimate-design-rigged): up to 114 separated parts with internals | $7.00 | Royalty Free (no AI) | Cheap reference for the smartphone teardown (V2-5b); it is a branded foldable, so logos must be removed. Buy only if the Blender-built internals look weak |
| [CGTrader low-poly RGB gaming motherboard](https://www.cgtrader.com/3d-models/electronics/computer/gaming-motherboard-pc-pcie-gamer-lowpoly-rgb-lighting-neon) | $24.99 | Royalty Free | Not needed: three free motherboard bases exist |
| [TurboSquid "Computer Components Collection 3"](https://www.turbosquid.com/3d-models/computer-components-collection-3-1484026) | $99 | Standard, **Editorial use only** | **No.** Editorial-only licence does not fit a learning platform |

**Recommendation: buy nothing now.** Everything in V2 can be done with CC BY/CC0 plus Blender. Revisit after V2-5b if the phone/tablet teardown needs more realism ($7 option).
