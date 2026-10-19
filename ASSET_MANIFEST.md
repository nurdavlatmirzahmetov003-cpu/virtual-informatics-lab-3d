# ASSET MANIFEST

PC Assembly Lab reuses the existing credited `hardware/*.glb` assets. Slot ghosts and pointer interaction are project code; no new third-party assets or licenses.

Әр ассет үшін: атауы · дереккөз · автор · лицензия · URL · өзгерістер · оңтайландырылған файл.
Лицензиясы тексерілмеген ешбір ассет жаңа қосымшаға (`public/`, `src/`) қосылмайды.

## Текстуралар (`public/assets/textures/`)

| Файл | Ассет | Дереккөз / Автор | Лицензия | URL | Өзгерістер |
|---|---|---|---|---|---|
| wood_diff.jpg, wood_nor.webp, wood_rough.jpg (+ `_512` нұсқалары) | Wood Table 001 | Poly Haven | CC0 | https://polyhaven.com/a/wood_table_001 | legacy/textures-тен көшірілді; 2048², JPG. Фаза 9-да KTX2 + 1K-ға түсіру |
| floor_diff.jpg, floor_rough.webp (+ `_512` нұсқалары) | Concrete Floor Painted | Poly Haven | CC0 | https://polyhaven.com/a/concrete_floor_painted | legacy/textures-тен көшірілді; 1024², JPG |

> Ескерту: автор аттары legacy manifest-те жазылмаған — Poly Haven бетінен тексеріп толықтыру керек (CC0 атрибуция талап етпейді).

Фаза 9: `wood_nor` пен `floor_rough` WebP-ге (PSNR ≥ 42 дБ, −40–50 %); 512 px нұсқалар Low/телефон үшін (`npm run assets:optimize`). Түпнұсқа JPG-лер `assets-src/textures/`-те.

### Poly Haven (2026-10-03 жүктелді, кодта әлі қолданылмайды) — `assets-src/library/textures/polyhaven/<asset>/` (Фаза 9-да build-тен шығарылды)

| Файлдар | Ассет | Автор | Лицензия | URL | Мақсаты / өзгерістер |
|---|---|---|---|---|---|
| european_walnut_veneer_04_{diff,nor_gl,rough}_2k.jpg | European Walnut Veneer 04 | Jenelle van Heerden | CC0 | https://polyhaven.com/a/european_walnut_veneer_04 | Үстел беті (балама). Өзгертілмеген, 2K JPG (~7 MB) |
| cotton_jersey_{diff,nor_gl,rough}_1k.jpg | Cotton Jersey | colormass, Rico Cilliers | CC0 | https://polyhaven.com/a/cotton_jersey | Мата коврик. Өзгертілмеген, 1K |
| fabric_leather_02_{diff,nor_gl,rough}_1k.jpg | Fabric Leather 02 | Rob Tuytel | CC0 | https://polyhaven.com/a/fabric_leather_02 | Құлаққап жастықтары / бас жолағы. 1K |
| grey_plaster_{diff,nor_gl,rough}_1k.jpg | Grey Plaster | Rob Tuytel | CC0 | https://polyhaven.com/a/grey_plaster | Бөлме қабырғасы. 1K |

## 3D модельдер (`public/assets/models/`)
Hero сахнасындағы перифериялар мен ПК бөлшектері — Sketchfab CC BY 4.0 GLB-лер (төменде). Үстел, коврик, бөлме және артқы желдеткіш әлі жобаның өз процедуралық модельдері (TODO.md `[PLACEHOLDER]`). GLB жүктелмесе, `ModelLoader` бұрынғы процедуралық модельді көрсетеді.

| Файл | Ассет | Автор | Лицензия | URL | Мақсаты / өзгерістер |
|---|---|---|---|---|---|
| assets-src/library/models/polyhaven/potted_plant_04/potted_plant_04_1k.gltf (+ .bin, textures/) | Potted Plant 04 | James Ray Cock (Poly Haven) | CC0 | https://polyhaven.com/a/potted_plant_04 | Үстел декоры. 6 097 полигон, 1K текстуралар, 2.1 MB. Кодта әлі қолданылмайды |

### Sketchfab — жүктелген шикі файлдар (2026-10-03, `assets-src/sketchfab/`, git-ке кірмейді)
Барлығы **CC BY 4.0** (https://creativecommons.org/licenses/by/4.0/): коммерциялық қолдануға болады, **автор атын көрсету міндетті** (сайттағы «Credits» беті + осы файл). Пайдаланушының Sketchfab аккаунты арқылы ресми «Download → GLB» архивінен жүктелді, өзгертілмеген. Оңтайландырылған нұсқалары `public/assets/models/hardware/` ішінде (`npm run assets:optimize`, есеп: `optimization-report.json`, тексеру: `npm run assets:validate`). Сайттағы атрибуция: `/credits` беті (`src/data/assets/hardware.json`).

**Өзгерістер (CC BY 4.0 талабы бойынша көрсетіледі):** flatten + prune + dedup + weld + join; Meshopt қысу (16-бит позиция); текстуралар WebP, ең көбі 1024 px, сапа 88, өлшемі адаптивті (PSNR ≥ 45 дБ; Фаза 9); ауыр модельдерге `_lod1.glb` (жеңіл деңгей, ≤ 256 px); колонкалар бір `speakers.glb`-де екі node; монитор (35 %), кулер, GPU, CPU, тышқан (65 %) полигон саны meshopt simplify арқылы азайтылды; кабельдер алынды (пернетақта `wire/usb`, тышқан `Cord`); PSU-дың бос бұрандалары алынды; GPU-дың мөлдір көмекші mesh-тері алынды; құлаққаптың қаңқасы (skin/анимация) алынып, тыныш поза сақталды; колонкалар сол/оң екі файлға бөлінді; желдеткіш рамаға (`fan_frame`) және айналатын роторға (`fan_rotor`) бөлінді; «Gaming Desktop PC» жинағынан тек корпус қабығы (`chassis.glb`) алынды — ішкі бөлшектер бөлек модельдерден. Шикі файлдар өзгертілмеген.

| Шикі файл | Бөлшек | Модель | Автор | URL | Көлемі / полигон / текстура | Оңтайландырылған файл |
|---|---|---|---|---|---|---|
| monitor_ultrawide.glb | Монитор | Ultrawide Monitor | dylanheyes | https://sketchfab.com/3d-models/ultrawide-monitor-f84d24b6df3648d884fd9be9c8007dd4 | 7.9 MB, 219k полигон, 1K текстура | `hardware/monitor_ultrawide.glb` 0.49 MB, 76.9k △ |
| keyboard_mech.glb | Пернетақта | Mechanical keyboard | FelikinRuslan | https://sketchfab.com/3d-models/mechanical-keyboard-1ba4055c33674567b51b783701ed05ce | 8.0 MB, 11k, 2K | `hardware/keyboard_mech.glb` 0.24 MB, 8.4k △ |
| mouse_gaming.glb | Тышқан | Gaming Mouse | attix84work | https://sketchfab.com/3d-models/gaming-mouse-5847669dfe3d4ba8b59e69dc64bc09c1 | 2.2 MB, 72k, текстурасыз | `hardware/mouse_gaming.glb` 0.10 MB, 17.5k △ |
| pc_setup_y3d.glb | ПК корпусы (+ жинақ) | Gaming Desktop PC | Yolala3D \| Y3D | https://sketchfab.com/3d-models/gaming-desktop-pc-d1d8282c9916438091f11aeb28787b66 | 13.1 MB, 86k, 2K | `hardware/chassis.glb` 0.16 MB, 5.8k △ |
| gpu_triple_fan.glb | Видеокарта | MSI GeForce RTX 3080 Gaming X Trio | M E U | https://sketchfab.com/3d-models/msi-geforce-rtx-3080-gaming-x-trio-now-free-e5356746dcec48f9868164bb9674ab9a | 4.8 MB, 65k, 2K | `hardware/gpu_triple_fan.glb` 0.60 MB, 42.3k △ |
| motherboard_x570.glb | Аналық плата | X570 Prime motherboard [HQ PBR] | Igor.Jop | https://sketchfab.com/3d-models/x570-prime-motherboard-hq-pbr-25b3659935774b1e9d73d8954be065d8 | 10.2 MB, 35k, 2K | `hardware/motherboard_x570.glb` 1.06 MB, 35.0k △ |
| cpu_am4.glb | Процессор | AM4 Cpu [ Free ] | Igor.Jop | https://sketchfab.com/3d-models/am4-cpu-free-912c9c42d2dc40fe95574345aae51ea0 | 4.0 MB, 42k, 2K | `hardware/cpu_am4.glb` 0.66 MB, 41.8k △ |
| ram_rgb.glb | RAM | Ram G-radient (totally not TridentZ) | Igor.Jop | https://sketchfab.com/3d-models/ram-g-radient-totally-not-tridentz-f75a71bb25ef476e924785b05b47c92c | 3.8 MB, 2k, 2K | `hardware/ram_rgb.glb` 0.19 MB, 2.1k △ |
| cooler_tower.glb | Кулер | Cooler Master CPU Cooler | BlenderFace | https://sketchfab.com/3d-models/cooler-master-cpu-cooler-e54651982f524644a2144b52a6b36e89 | 5.5 MB, 93k, 2K | `hardware/cooler_tower.glb` 0.45 MB, 61.8k △ |
| psu.glb | Блок питания | PSU Power Supply Unit | Groovex | https://sketchfab.com/3d-models/psu-power-supply-unit-69ccd1be3a77497cb2acc9e39e7c52b3 | 0.75 MB, 12k, текстурасыз | `hardware/psu.glb` 0.10 MB, 12.1k △ |
| ssd_m2.glb | NVMe SSD | m2ssd_Painter | Igor.Jop | https://sketchfab.com/3d-models/m2ssd-painter-ccda7c201091445087c02692444641c2 | 2.8 MB, 0.8k, 2K | `hardware/ssd_m2.glb` 0.23 MB, 0.8k △ |
| fan_120.glb | Корпус желдеткіші | Lian Li UNI FAN SL120 RGB BLACK | DIEKO | https://sketchfab.com/3d-models/lian-li-uni-fan-sl120-rgb-black-5abd0d8e89ea4241b7216f4b6d5a2ca4 | 0.34 MB, 4.6k, текстурасыз | `hardware/fan_frame.glb` 0.03 MB, 2.4k △<br>`hardware/fan_rotor.glb` 0.03 MB, 2.3k △ |
| headset_gaming.glb | Құлаққап | Headphones Free Model by Oscar Creative | OSCAR CREATIVO | https://sketchfab.com/3d-models/headphones-free-model-by-oscar-creative-db92168ca39541939d0110e64a37f92e | 17.9 MB, 58k, 2K | `hardware/headset_gaming.glb` 1.24 MB, 58.2k △ |
| speakers.glb | Колонкалар | Amigo Computer gaming speakers | Kartik_Kishor | https://sketchfab.com/3d-models/amigo-computer-gaming-speakers-3b5adc5be8c4436eb913063c7e3f5c67 | 7.4 MB, 58k, 2K | `hardware/speakers.glb` 0.46 MB, 42k △ (`#speaker_left` / `#speaker_right`) + `speakers_lod1.glb` |

Балама үміткерлер (жүктелмеген): Monitor — Microsoft; Mechanical Keyboard – Aesthetic — M.Reslan; Ice Claw mouse — dmitriy7776661111; Dream Computer Setup — Daniel Cardona; RTX Titan — Vivien Deroche; MotherBoard + Components — Daniel Cardona; Unmarked processor + Socket — 00004707; Corsair DOMINATOR RGB RAM — MajdyModels; Noctua NH-D15 — SzaBa; Samsung 980 Pro NVMe — BlenderFace; RGB PC Fan — Bl3ndarts; Sony MDR-7506 — AndreiVNK; Computer Desk — draakon_4d (барлығы CC BY 4.0).

> Брендтік модельдер (MSI, AMD, Samsung, Lian Li, Cooler Master, Corsair, Sony): CC BY модельдің геометриясын қолдануға рұқсат береді, бірақ сауда белгілеріне (логотиптерге) құқық бермейді. Оқу жобасы үшін логотиптерді Blender-де алып тастау не жасыру ұсынылады (MASTER_PROMPT §6). **Күйі: әлі жасалмаған** — текстураларда логотиптер қалды (TODO.md, KNOWN_ISSUES.md).

### Setup Studio per-product models (V2-2a, 2026-10-10) — `public/assets/models/products/`

- **Source:** Sketchfab downloads by the owner (2026-10-10, signed-in account, original "GLB" archives), raw files in `assets-src/sketchfab/v2/` (not in git). Every source is **CC BY 4.0**; the licence and author were read from each GLB's own `asset.extras` and match the model page. Credits: `/credits` (`src/data/assets/hardware.json`, 23 new entries).
- **Changes (CC BY):**
  - Blender pipeline (`scripts/blender/configs/products/<id>.json`): rotated to face the user, scaled to the product's real dimensions (W×D×H), logo meshes removed and logo areas in textures repainted with the surrounding colour, rigs baked and removed, screens renamed `Screen` (site wallpaper), desk tops `DeskTop` (finish).
  - Then `npm run assets:optimize`: Meshopt and WebP in three levels — `<id>.glb` (≤ 80k △, ≤ 2048 px), `_lod1` (≤ 30k △, ≤ 1024 px), `_lod2` (≤ 8k △ where possible, ≤ 512 px).
- **Variants:** several products derive from one source with different size and finish (stated in the table). Brands appear only as UI text.
- **Downloaded but unused for now:** "Logitech mechanical gaming keyboard" (BlackCube), "RAZER BlackWidow Chroma" (Mieshu), "Low poly – Computer Mouse" (IQINISO). These are kept for V2-4.

| Product | Source model | Author | Licence | Changes |
|---|---|---|---|---|
| `chair-hm-embody-gaming` | [Herman Miller COSM Chair](https://sketchfab.com/3d-models/herman-miller-cosm-chair-3b6bd05e32494279871c5a4074e43dc2) | CindyO | CC BY 4.0 | real size 710×710×1100 mm |
| `chair-ikea-markus` | [Tall Back Office Chair](https://sketchfab.com/3d-models/tall-back-office-chair-06269ce18ab7458182564957308cb8a2) | thornbell | CC BY 4.0 | real size 620×600×1290 mm |
| `chair-secretlab-titan-evo` | [Gaming Chair](https://sketchfab.com/3d-models/gaming-chair-ccb3ada5917a4b90b689e1d1bf852dc2) | Kiiba | CC BY 4.0 | rotated 180°, real size 700×700×1330 mm |
| `desk-flexispot-e7` | [Standing Desk](https://sketchfab.com/3d-models/standing-desk-65a7f4b06a5f4954a0d43eb8812dd165) | Ryan_Nein | CC BY 4.0 | real size 1600×700×750 mm |
| `desk-ikea-uppspel` | [Office Desk 140x60](https://sketchfab.com/3d-models/office-desk-140x60-9262f311271c4c4390341e526d3fe103) | AleixoAlonso | CC BY 4.0 | real size 1800×800×750 mm |
| `desk-secretlab-magnus-pro` | [Secretlab MAGNUS Pro XL](https://sketchfab.com/3d-models/secretlab-magnus-pro-xl-c8d6d07a4562408abda29062c2019816) | luckyluce | CC BY 4.0 | rotated 90°, real size 1500×700×750 mm |
| `hs-hyperx-cloud-iii` | [Wireless Headphones](https://sketchfab.com/3d-models/wireless-headphones-c43d4223e70b450089cc242305f99718) | uliana | CC BY 4.0 | rotated 90°, real size 180×95×200 mm |
| `hs-logitech-pro-x2` | [G735 Logitech Gaming Headset](https://sketchfab.com/3d-models/g735-logitech-gaming-headset-8930ea831c7e45e8929c77888a6b5e7d) | shaielwolf | CC BY 4.0 | real size 180×100×210 mm, 2 texture areas repainted (logos / screen) |
| `hs-razer-blackshark-v2-pro` | [Razer Headset](https://sketchfab.com/3d-models/razer-headset-fa7de2b85f6c44ad80b53aabd5142070) | harithsami01 | CC BY 4.0 | real size 170×100×200 mm, 133 logo/helper meshes removed, finish recoloured |
| `hs-steelseries-nova7` | [SteelSeries Arctis Wireless Pro](https://sketchfab.com/3d-models/steelseries-arctis-wireless-pro-2eeabb208f9f45cf87e2eb1d5bc83ab3) | mariokart64n | CC BY 4.0 | real size 180×95×205 mm, 1 logo/helper meshes removed, 8 texture areas repainted (logos / screen) |
| `kb-keychron-k8-pro` | [Keychron K8](https://sketchfab.com/3d-models/keychron-k8-b00c531f3d8f4fd39c636eae56f23c0f) | MozzarellaARC | CC BY 4.0 | real size 359×127×39 mm |
| `kb-logitech-k120` | [Keyboard](https://sketchfab.com/3d-models/keyboard-cc7e7ed38d9a469ea499893295bc767a) | thethieme | CC BY 4.0 | real size 450×155×24 mm |
| `kb-logitech-mx-keys-s` | [Logitech MX Keys](https://sketchfab.com/3d-models/logitech-mx-keys-67901d82781f48349f1f61ce78a6b6e0) | ArkinRS | CC BY 4.0 | real size 430×131×21 mm |
| `kb-logitech-pro-x-tkl` | [Gaming keyboard](https://sketchfab.com/3d-models/gaming-keyboard-c1e5e07153d84978a1ad7256d720220a) | ZxTulz | CC BY 4.0 | real size 361×149×34 mm |
| `kb-razer-huntsman-v3-pro-tkl` | [Gaming keyboard](https://sketchfab.com/3d-models/gaming-keyboard-c1e5e07153d84978a1ad7256d720220a) | ZxTulz | CC BY 4.0 | real size 361×140×40 mm |
| `mon-asus-va24ehf` | [PC Monitor 27 inch](https://sketchfab.com/3d-models/pc-monitor-27-inch-06fb18eec19245d4811c4c3c8c7ea567) | Annelida | CC BY 4.0 | real size 540×180×417 mm, 1 texture areas repainted (logos / screen) |
| `mon-asus-xg27acs` | [ASUS  TUF gaming monitor](https://sketchfab.com/3d-models/asus-tuf-gaming-monitor-570372a3cc6941029b2490eb3113b224) | Jelvehkar | CC BY 4.0 | rotated 180°, real size 614×220×470 mm, 3 logo/helper meshes removed, 1 texture areas repainted (logos / screen) |
| `mon-asus-xg27aqmr` | [ASUS  TUF gaming monitor](https://sketchfab.com/3d-models/asus-tuf-gaming-monitor-570372a3cc6941029b2490eb3113b224) | Jelvehkar | CC BY 4.0 | rotated 180°, real size 614×240×490 mm, 3 logo/helper meshes removed, 1 texture areas repainted (logos / screen), finish recoloured |
| `mon-dell-u2724d` | [PC Monitor 27 inch](https://sketchfab.com/3d-models/pc-monitor-27-inch-06fb18eec19245d4811c4c3c8c7ea567) | Annelida | CC BY 4.0 | real size 612×185×500 mm, 1 texture areas repainted (logos / screen), finish recoloured |
| `mon-lg-27gr93u` | [LG moniter](https://sketchfab.com/3d-models/lg-moniter-f899bb43701f4e95b1e44c4bf21ed29c) | Mohamed Ahmed | CC BY 4.0 | real size 613×237×460 mm, 2 logo/helper meshes removed, 1 texture areas repainted (logos / screen) |
| `mouse-logitech-g102` | [Mouse Logitech G203](https://sketchfab.com/3d-models/mouse-logitech-g203-6b70ace291c44735bed3309b05f44bba) | JorgeAlfredOwO | CC BY 4.0 | real size 62×117×38 mm, 2 texture areas repainted (logos / screen) |
| `mouse-logitech-g305` | [Mouse Logitech G203](https://sketchfab.com/3d-models/mouse-logitech-g203-6b70ace291c44735bed3309b05f44bba) | JorgeAlfredOwO | CC BY 4.0 | real size 62×117×38 mm, 2 texture areas repainted (logos / screen) |
| `mouse-logitech-g502x-plus` | [Logitech G700s](https://sketchfab.com/3d-models/logitech-g700s-8d96670d940742c4b515b0a0b0dc92ab) | Miléd Hammoud | CC BY 4.0 | real size 79×131×41 mm, 5 texture areas repainted (logos / screen) |
| `mouse-logitech-superlight2` | [Mouse Logitech G203](https://sketchfab.com/3d-models/mouse-logitech-g203-6b70ace291c44735bed3309b05f44bba) | JorgeAlfredOwO | CC BY 4.0 | real size 63×125×40 mm, 2 texture areas repainted (logos / screen), finish recoloured |
| `mouse-razer-viper-v3-pro` | [Razer Mouse](https://sketchfab.com/3d-models/razer-mouse-9f0a3283cbca4454bf04c8d43494247a) | Fred Drabble | CC BY 4.0 | rotated 90°, real size 57×127×40 mm, 1 logo/helper meshes removed |
| `spk-creative-pebble-v3` | [Satellite Enhanced (900 followers special)](https://sketchfab.com/3d-models/satellite-enhanced-900-followers-special-9d30170f553d47978936b0da92f6c011) | rendysix | CC BY 4.0 | rotated -90°, real size 116×122×115 mm, 1 logo/helper meshes removed |
| `spk-edifier-r1280db` | [Speaker Bookshelf V2 - Optimized](https://sketchfab.com/3d-models/speaker-bookshelf-v2-optimized-cbb87dee55e84a389cbccb4ddc0036e0) | rendysix | CC BY 4.0 | rotated -90°, real size 146×196×234 mm, 1 logo/helper meshes removed |
| `spk-logitech-z407` | [Logitech Speakers](https://sketchfab.com/3d-models/logitech-speakers-73634ff35df3434dbfd2ae87c886ec5f) | Jayemel11 | CC BY 4.0 | real size 80×90×179 mm, 15 logo/helper meshes removed |

### PC components (V2-2b, 2026-10-10) — `public/assets/models/products/`

- **Source:** 16 Sketchfab models downloaded by the owner (2026-10-10, signed in), plus 2 extras the owner picked. They are in `assets-src/sketchfab/v2/` (not in git), and a list of the owner's files is in `Downloads/PC_3D_MODELS_README.md`. Six earlier hardware originals (`assets-src/sketchfab/`, Phase 2.3) also serve as bases. Every source is **CC BY 4.0**. Credits are on `/credits` (`src/data/assets/hardware.json`, 16 new entries; 6 earlier entries list their new derived products).
- **Licence note — "NZXT type PC case" (Igor.Jop):** the page is marked CC BY 4.0. Its description also says commercial use in games is sold separately ($35) and that educational/hobby use is welcome. This project is educational, so the model is used for `case-lianli-o11d-evo`. **If the platform ever becomes commercial, replace the model or buy that licence.**
- **Changes (CC BY):**
  - Blender pipeline (`scripts/blender/configs/products/<id>.json`, generated from one table): each model is rotated into a canonical pose (see `HardwareParts.tsx`) and scaled to the product's real size.
  - Logo meshes are removed, and brand / series prints in textures are painted over with the surrounding colour. This covers MSI, ROG, GeForce, Corsair, HyperX/FURY, Samsung, KCAS, Intel and AMD.
  - Glass panes are removed (the scene draws its own glass).
  - Port/slot markers are added as empty nodes: `port_hdmi_1`, `slot_pcie_x16_1`, `header_24pin_1`, `mount_psu_1` and so on.
  - Then `npm run assets:optimize -- products`: Meshopt and WebP in three levels (≤ 80k / 30k / 8k △). Meshes with many seams are simplified further, with a growing error and meshoptimizer `Prune`/`Permissive`.
- **Variants:** several products derive from one source with a different size, finish or prints (as stated in the table). Brands appear only as UI text.
- **Not covered by a model in this batch:** NZXT Kraken 240 (liquid cooler, procedural `LiquidCooler`), the 3.5″ HDD (procedural), and case fans (`fan_frame` / `fan_rotor`, Phase 2.3).
- **Downloaded but unused:** "Seasonic M12II Evo" (444 △ CAD shape; the Aerocool model is used instead) and "ASUS Z370-E + components" (Daniel Cardona; the board comes with its CPU, RAM and SSD baked in).
- **Reference photos in the textures:** some sources (MSI B450, MSI Z790, Corsair RAM) use product photos as base colour. Their logos and series names are painted over; the remaining PCB detail is generic.

| Product | Source model | Author | Licence | Changes |
|---|---|---|---|---|
| `case-bitlab-aero` (0.37) | — жобаның өз моделі, `scripts/blender/make-bitlab-aero.py` примитивтерден құрады | BitLab | CC0 (өз жұмысымыз) | ақ корпус, 230×470×450 мм, ішкі орналасу сахна якорьлеріне дәл сай; 4 материал (4 draw call); 19 port/slot маркері; әйнегі сахнаның процедуралық панелі |
| `case-corsair-4000d-airflow` | [Corsair 4000D PC Case](https://sketchfab.com/3d-models/corsair-4000d-pc-case-bc15e007d6634579bc0e8ffdf238e665) | SzaBa | CC BY 4.0 | canonical pose, real size 230×450×470 mm, 1 logo/helper/hidden meshes removed, 19 port/slot markers |
| `case-deepcool-cc560-v2` | [Corsair 4000D PC Case](https://sketchfab.com/3d-models/corsair-4000d-pc-case-bc15e007d6634579bc0e8ffdf238e665) | SzaBa | CC BY 4.0 | canonical pose, real size 230×450×470 mm, 1 logo/helper/hidden meshes removed, finish recoloured, 19 port/slot markers |
| `case-fractal-north` | [Corsair 4000D x Fractal North](https://sketchfab.com/3d-models/crosair-4000d-x-fractal-north-8366a780be1e4ef2bd9098ac4dd7a02d) | tavanth | CC BY 4.0 | canonical pose, real size 230×450×470 mm, 2 logo/helper/hidden meshes removed, 19 port/slot markers |
| `case-lianli-o11d-evo` | [NZXT type PC case, fully functional and free](https://sketchfab.com/3d-models/nzxt-type-pc-case-fully-functional-and-free-bddaa9ac52a3458f819acb411d6b4f61) | Igor.Jop | CC BY 4.0 | reoriented to the case mount, real size 230×450×470 mm, 1 logo/helper/hidden meshes removed, 2 texture areas repainted (logos / print), 19 port/slot markers |
| `case-nzxt-h5-flow-2024` | [Corsair 4000D x Fractal North](https://sketchfab.com/3d-models/crosair-4000d-x-fractal-north-8366a780be1e4ef2bd9098ac4dd7a02d) | tavanth | CC BY 4.0 | canonical pose, real size 230×450×470 mm, 2 logo/helper/hidden meshes removed, finish recoloured, 19 port/slot markers |
| `cool-deepcool-ak400` | [Cooler Master CPU Cooler](https://sketchfab.com/3d-models/cooler-master-cpu-cooler-e54651982f524644a2144b52a6b36e89) | BlenderFace | CC BY 4.0 | reoriented to the case mount, real size 127×97×155 mm, finish recoloured |
| `cool-noctua-nh-d15-g2` | [Noctua NH-D15 CPU Cooler](https://sketchfab.com/3d-models/noctua-nh-d15-cpu-cooler-23e225925e174a9f929d995cd9bd22e2) | SzaBa | CC BY 4.0 | reoriented to the case mount, real size 150×161×168 mm |
| `cool-thermalright-pa120se` | [Noctua NH-D15 CPU Cooler](https://sketchfab.com/3d-models/noctua-nh-d15-cpu-cooler-23e225925e174a9f929d995cd9bd22e2) | SzaBa | CC BY 4.0 | reoriented to the case mount, real size 125×110×155 mm, finish recoloured |
| `cpu-amd-am5` | [AMD Ryzen 9](https://sketchfab.com/3d-models/amd-ryzen-9-fff4a783d9824800a912c3c7a79c1ac0) | hoti28 | CC BY 4.0 | reoriented to the case mount, real size 40×40×6 mm, 1 texture areas repainted (logos / print) |
| `cpu-intel-lga` | [Free Intel CPU](https://sketchfab.com/3d-models/free-intel-cpu-fe534a3cae7c4e66b6131da9b5dae6ff) | Moonway 3D | CC BY 4.0 | canonical pose, real size 45×38×4 mm, 1 texture areas repainted (logos / print) |
| `gpu-asus-dual-5060ti-16` | [MSI GeForce RTX 3080 Gaming X Trio](https://sketchfab.com/3d-models/msi-geforce-rtx-3080-gaming-x-trio-now-free-e5356746dcec48f9868164bb9674ab9a) | M E U | CC BY 4.0 | reoriented to the case mount, real size 50×229×120 mm, 5 logo/helper/hidden meshes removed, finish recoloured, 6 port/slot markers |
| `gpu-asus-rog-astral-5090` | [RTX 3090 ASUS ROG STRIX White Edition videocard](https://sketchfab.com/3d-models/rtx-3090-asus-rog-strix-white-edition-videocard-506b1c68d24f4a9088ea0eaef41f7dd9) | Marcseus | CC BY 4.0 | reoriented to the case mount, real size 76×358×149 mm, 122 logo/helper/hidden meshes removed, finish recoloured, 6 port/slot markers |
| `gpu-nvidia-5070-fe` | [NVIDIA RTX 5090 Founders Edition](https://sketchfab.com/3d-models/nvidia-rtx-5090-founders-edition-5934a7ddfa144951ac66eb8cab13f220) | PolyDavid | CC BY 4.0 | reoriented to the case mount, real size 40×242×112 mm, 2 logo/helper/hidden meshes removed, 6 port/slot markers |
| `gpu-nvidia-5080-fe` | [NVIDIA RTX 5090 Founders Edition](https://sketchfab.com/3d-models/nvidia-rtx-5090-founders-edition-5934a7ddfa144951ac66eb8cab13f220) | PolyDavid | CC BY 4.0 | reoriented to the case mount, real size 48×304×137 mm, 2 logo/helper/hidden meshes removed, 6 port/slot markers |
| `gpu-sapphire-9070xt-pulse` | [AMD Sapphire Nitro+ Radeon RX 7900 XTX](https://sketchfab.com/3d-models/amd-sapphire-nitro-radeon-rx-7900-xtx-34ae089114524c61880235e96b48f7f6) | PolyDavid | CC BY 4.0 | reoriented to the case mount, real size 55×313×126 mm, 6 port/slot markers |
| `mb-asus-prime-z890-p` | [X570 Prime motherboard [HQ PBR]](https://sketchfab.com/3d-models/x570-prime-motherboard-hq-pbr-25b3659935774b1e9d73d8954be065d8) | Igor.Jop | CC BY 4.0 | reoriented to the case mount, real size 305×244×auto mm, 24 port/slot markers |
| `mb-asus-tuf-b650-plus` | [X570 Prime motherboard [HQ PBR]](https://sketchfab.com/3d-models/x570-prime-motherboard-hq-pbr-25b3659935774b1e9d73d8954be065d8) | Igor.Jop | CC BY 4.0 | reoriented to the case mount, real size 305×244×auto mm, 24 port/slot markers |
| `mb-msi-b650-gaming-plus` | [MSI B450 TOMAHAWK MAX](https://sketchfab.com/3d-models/msi-b450-tomahawk-max-8ea715471e344599a07bbdbbc77dfbdd) | shig0 | CC BY 4.0 | reoriented to the case mount, real size 305×244×auto mm, 2 logo/helper/hidden meshes removed, 6 texture areas repainted (logos / print), 24 port/slot markers |
| `mb-msi-pro-b760m-a-ddr4` | [Motherboard MSI Z790 Low Poly](https://sketchfab.com/3d-models/motherboard-msi-z790-low-poly-7ac2ed91599a4239aba96770a00874ce) | cityon360 | CC BY 4.0 | reoriented to the case mount, real size 244×244×auto mm, 9 texture areas repainted (logos / print), 24 port/slot markers |
| `psu-bequiet-pp12m-650` | [Power Supply Aerocool KCAS 500W ATX](https://sketchfab.com/3d-models/power-supply-aerocool-kcas-500w-atx-bfb1f77fffb0410f9ee0d0be6fb5fc88) | nofurion | CC BY 4.0 | reoriented to the case mount, real size 150×160×86 mm, 2 texture areas repainted (logos / print), 5 port/slot markers |
| `psu-corsair-rm750e` | [Power Supply Aerocool KCAS 500W ATX](https://sketchfab.com/3d-models/power-supply-aerocool-kcas-500w-atx-bfb1f77fffb0410f9ee0d0be6fb5fc88) | nofurion | CC BY 4.0 | reoriented to the case mount, real size 150×140×86 mm, 2 texture areas repainted (logos / print), 5 port/slot markers |
| `psu-corsair-rm850x` | [Power Supply Aerocool KCAS 500W ATX](https://sketchfab.com/3d-models/power-supply-aerocool-kcas-500w-atx-bfb1f77fffb0410f9ee0d0be6fb5fc88) | nofurion | CC BY 4.0 | reoriented to the case mount, real size 150×160×86 mm, 2 texture areas repainted (logos / print), 5 port/slot markers |
| `psu-deepcool-pk550d` | [PSU Power Supply Unit](https://sketchfab.com/3d-models/psu-power-supply-unit-69ccd1be3a77497cb2acc9e39e7c52b3) | Groovex | CC BY 4.0 | reoriented to the case mount, real size 150×140×86 mm, 5 port/slot markers |
| `psu-seasonic-focus-gx-1000` | [PSU Power Supply Unit](https://sketchfab.com/3d-models/psu-power-supply-unit-69ccd1be3a77497cb2acc9e39e7c52b3) | Groovex | CC BY 4.0 | reoriented to the case mount, real size 150×140×86 mm, 5 port/slot markers |
| `ram-corsair-vengeance-rgb-32` | [RAM Corsair Vengeance DDR4 RGB PRO](https://sketchfab.com/3d-models/ram-corsair-vengeance-ddr4-rgb-pro-ee5c6e6b2e524d63a7043365e73a2420) | lime.ball.animations | CC BY 4.0 | canonical pose, real size 134×8×44 mm, 311 logo/helper/hidden meshes removed, 6 texture areas repainted (logos / print) |
| `ram-gskill-trident-z5-64` | [Ram G-radient (totally not TridentZ)](https://sketchfab.com/3d-models/ram-g-radient-totally-not-tridentz-f75a71bb25ef476e924785b05b47c92c) | Igor.Jop | CC BY 4.0 | reoriented to the case mount, real size 134×8×44 mm |
| `ram-kingston-fury-beast` | [Kingston HyperX Fury Black RAM module](https://sketchfab.com/3d-models/kingston-hyperx-fury-black-ram-module-3d9499b5337f475d8bbb1eccdb20e73d) | Astrien | CC BY 4.0 | reoriented to the case mount, real size 133×7×34 mm, 2 logo/helper/hidden meshes removed |
| `ssd-kingston-nv3-1tb` | [m2ssd_Painter](https://sketchfab.com/3d-models/m2ssd-painter-ccda7c201091445087c02692444641c2) | Igor.Jop | CC BY 4.0 | reoriented to the case mount, real size 22×80×2 mm, 1 texture areas repainted (logos / print) |
| `ssd-samsung-870-evo-1tb` | [SATA Samsung SM883 SSD](https://sketchfab.com/3d-models/sata-samsung-sm883-ssd-09cd60eca56e45f38ec670fc8f848b6f) | PolyDavid | CC BY 4.0 | canonical pose, real size 70×100×7 mm, 1 texture areas repainted (logos / print) |
| `ssd-samsung-990-pro-2tb` | [M.2 NVMe SSD Samsung 990 PRO 1TB](https://sketchfab.com/3d-models/m2-nvme-ssd-samsung-990-pro-1tb-3d-model-41b7bfda7eab40f8b13330913fd66fc2) | lime.ball.animations | CC BY 4.0 | reoriented to the case mount, real size 22×80×2 mm, 2 texture areas repainted (logos / print) |
| `ssd-wd-sn850x-1tb` | [m2ssd_Painter](https://sketchfab.com/3d-models/m2ssd-painter-ccda7c201091445087c02692444641c2) | Igor.Jop | CC BY 4.0 | reoriented to the case mount, real size 22×80×2 mm, 1 texture areas repainted (logos / print) |

### Lab devices and teardown internals (2026-10-18) — `public/assets/models/products/`

- **Source:** 36 Sketchfab models downloaded by the owner (2026-10-18, signed in), kept in `D:\GLB` and copied with project names to `assets-src/sketchfab/devices/` (not in git). Every source is **CC BY 4.0** (checked on Sketchfab's API the same day). Credits are on `/credits` (`src/data/assets/hardware.json`, 36 entries).
- **Changes (CC BY):** Blender pipeline configs are generated by `scripts/blender/make-device-configs.py` and stored in `scripts/blender/configs/products/dev-*.json` (lab devices) and `td-*.json` (teardown internals):
  - every model is rotated into the lab pose (front −Y in Blender = +Z on the site, base on the floor) and scaled to the device's real size;
  - logo meshes are removed (Canon, TP-Link, the Apple marks on the tablet and the phone), and brand prints in textures are painted over (SanDisk, Seagate, Samsung, D-Link, Intelbras, Vertiv, Xbox, XP-Pen, HP, TP-Link, Raspberry Pi and others);
  - screens are blanked — the site draws its own wallpaper on the `Screen` material — so no screenshot of another product's interface ships;
  - the teardown models are split into named parts (phone: display, battery, board, cameras, speaker, vibration motor, SIM tray, port; laptop: lid and base; all-in-one: body, back cover, stand, keyboard, mouse; tablet: display and housing; electronic components one node each).
- **Web levels:** `npm run assets:optimize -- products <id>` builds `<id>.glb` / `_lod1` / `_lod2` (Meshopt, adaptive textures). The phone teardown has a larger triangle budget (seen up close).
- **Not used:** "Projector- 5 MB" (Mehdi Shahsavan) turned out to be a tripod projection screen, not a projector. It is not shipped; the lab's projector stays procedural.

| Product | Source | Author | Licence | Changes |
|---|---|---|---|---|
| `dev-all-in-one` | [PC in Apple IMAC Style](https://sketchfab.com/3d-models/pc-in-apple-imac-style-df8163b56ada446fbfac3a9d43ea5256) | ISUS | CC BY 4.0 | pose as downloaded, real size 547×379×450 mm, 2 texture areas repainted (logos / print / screenshots), parts: stand, keyboard, mouse, back_cover, body |
| `dev-external-drive` | [External Hard Drive](https://sketchfab.com/3d-models/external-hard-drive-6f01d25fdfde4e5c98a7827749c01a4c) | Daniel.Orlando.Tapia | CC BY 4.0 | pose as downloaded, real size 75×125×19 mm, 2 texture areas repainted (logos / print / screenshots) |
| `dev-gamepad` | [Xbox Inalambric Controller (Black)](https://sketchfab.com/3d-models/xbox-inalambric-controller-black-29cc9624894a4f2cae7d2a675044db45) | Chistodrako._. | CC BY 4.0 | canonical pose, real size 153×95×85 mm, 1 texture areas repainted (logos / print / screenshots) |
| `dev-graphics-tablet` | [XP-Pen Deco Mini 7 drawing tablet](https://sketchfab.com/3d-models/xp-pen-deco-mini-7-drawing-tablet-4ccbeb843a1846cf8dc32b68a9243bfe) | Rykenz | CC BY 4.0 | canonical pose, real size 230×142×25 mm, 2 texture areas repainted (logos / print / screenshots) |
| `dev-hdd` | [Storage (SSD, HDD, M.2)](https://sketchfab.com/3d-models/storage-ssd-hdd-m2-bdd5fd67a7674359ab8648204b5c0575) | Vivien Deroche | CC BY 4.0 | pose as downloaded, real size 102×147×26 mm, 12 logo/extra meshes removed, 9 texture areas repainted (logos / print / screenshots) |
| `dev-interactive-panel` | [Interactive display clean](https://sketchfab.com/3d-models/interactive-display-clean-aac67dc4a84f47e5b17fa2cae57edae8) | g33 | CC BY 4.0 | canonical pose, real size 1490×72×766 mm |
| `dev-laptop` | [Gaming Laptop](https://sketchfab.com/3d-models/gaming-laptop-4e72a2078b3c4a75a821ab09830693fe) | Vivien Deroche | CC BY 4.0 | canonical pose, real size 360×278×246 mm, 3 texture areas repainted (logos / print / screenshots), parts: lid, base |
| `dev-microphone` | [Microphone Audio-technica AT2020](https://sketchfab.com/3d-models/microphone-audio-technica-at2020-506390cb11464c16b825dfb18eada1f1) | DORA | CC BY 4.0 | pose as downloaded, real size 137×224×224 mm |
| `dev-modem` | [Action Intelbras Modem](https://sketchfab.com/3d-models/action-intelbras-modem-3d8d5ea391bd4f30bb0603eb07f17ca9) | ghBanck | CC BY 4.0 | pose as downloaded, real size 328×236×242 mm, 1 texture areas repainted (logos / print / screenshots) |
| `dev-nas` | [NAS Storage Device](https://sketchfab.com/3d-models/nas-storage-device-ade9536b36bf405e9fb91494d5dc506a) | karakocyunus | CC BY 4.0 | pose as downloaded, real size 200×175×165 mm |
| `dev-nic` | [Network Interface Card](https://sketchfab.com/3d-models/network-interface-card-191c8ad40de2430980b879615aa0d2e3) | ARComputerFundamentals | CC BY 4.0 | pose as downloaded, real size 120×85×17 mm |
| `dev-optical-disc` | [Compact Disc](https://sketchfab.com/3d-models/compact-disc-06254ae4c6c04bc4b1cb5bd9b6c2ea41) | SEMA Game Studio | CC BY 4.0 | canonical pose, real size 116×120×34 mm |
| `dev-printer-3d` | [3D Printer](https://sketchfab.com/3d-models/3d-printer-0e825a8d48b14bee883a131fe029d4fc) | Gregsterius | CC BY 4.0 | pose as downloaded, real size 416×451×500 mm |
| `dev-printer-inkjet` | [Canon Inkjet Printer](https://sketchfab.com/3d-models/canon-inkjet-printer-13b495e4a2e3479e8ec5d9fd72ce6e49) | Mixmamo.studio:   An effortless 3D collections. | CC BY 4.0 | pose as downloaded, real size 389×191×162 mm, 1 logo/extra meshes removed |
| `dev-printer-laser` | [HP Laser Jet Pro Printer](https://sketchfab.com/3d-models/hp-laser-jet-pro-printer-efa71da7b59b420a92303296f4e12a97) | Pradeep.Kumar2 | CC BY 4.0 | pose as downloaded, real size 443×378×339 mm, 2 texture areas repainted (logos / print / screenshots) |
| `dev-router` | [Router](https://sketchfab.com/3d-models/router-ac86d8ae65a54f4aa99d7d624f71e5f4) | Rasmus | CC BY 4.0 | canonical pose, real size 300×206×178 mm, 1 texture areas repainted (logos / print / screenshots) |
| `dev-sbc` | [Raspberry Pi 3](https://sketchfab.com/3d-models/raspberry-pi-3-2d308283fc0f4d27b81f17a2793c5c4d) | JoSaCo | CC BY 4.0 | pose as downloaded, real size 85×58×12 mm, 2 texture areas repainted (logos / print / screenshots) |
| `dev-sd-card` | [SD Card 1:1 Realistic](https://sketchfab.com/3d-models/sd-card-11-realistic-4b3dda4a861646f1a0c00347574957e7) | SolverData | CC BY 4.0 | pose as downloaded, real size 24×32×2 mm, 4 texture areas repainted (logos / print / screenshots) |
| `dev-server-rack` | [Data Center Server Rack](https://sketchfab.com/3d-models/data-center-server-rack-01b49d9d1f694ba5b41e4b2b0e10d16e) | EntropyNine | CC BY 4.0 | pose as downloaded, real size 600×600×1600 mm |
| `dev-smartphone` | [Off-brand Android Smartphone](https://sketchfab.com/3d-models/off-brand-android-smartphone-2a1c8666306e4116980daeb9406e7780) | SabasGT | CC BY 4.0 | canonical pose, real size 76×9×158 mm, 1 texture areas repainted (logos / print / screenshots) |
| `dev-smartwatch` | [Smart Watch Low Poly](https://sketchfab.com/3d-models/smart-watch-low-poly-ea4f25ed03c54c35a5fe3b1218bdc76b) | ahmadrezagh671 | CC BY 4.0 | pose as downloaded, real size 37×100×78 mm |
| `dev-switch` | [TL-SF1005D](https://sketchfab.com/3d-models/tl-sf1005d-90966bd409204294918c68c11c7da831) | arieffitrah | CC BY 4.0 | pose as downloaded, real size 100×67×24 mm, 5 logo/extra meshes removed |
| `dev-tablet` | [Ipad 7](https://sketchfab.com/3d-models/ipad-7-ec2b3966d0384f87bfdff55799778bf0) | atom | CC BY 4.0 | pose as downloaded, real size 174×8×251 mm, 2 logo/extra meshes removed, 1 texture areas repainted (logos / print / screenshots), parts: display, housing |
| `dev-thermal-paste` | [THERMAL_PASTE](https://sketchfab.com/3d-models/thermal-paste-1f3d78897bba4bb0a9102263618f346a) | JP | CC BY 4.0 | canonical pose, real size 75×24×24 mm |
| `dev-ups` | [PSI5-2200RT120](https://sketchfab.com/3d-models/psi5-2200rt120-239d6100ac1a468ab54f343aff0da950) | Vertiv | CC BY 4.0 | pose as downloaded, real size 442×662×89 mm, 5 texture areas repainted (logos / print / screenshots) |
| `dev-usb-flash` | [USB Stick](https://sketchfab.com/3d-models/usb-stick-b9de9f354d3b4f9eb217ad9e67c3020f) | Vaxeon | CC BY 4.0 | pose as downloaded, real size 60×15×8 mm, 2 texture areas repainted (logos / print / screenshots) |
| `dev-usb-hub` | [USB Hub](https://sketchfab.com/3d-models/usb-hub-ca45e5fa0fcc42a7a4894810fd456900) | YinRebuffReality | CC BY 4.0 | pose as downloaded, real size 270×58×22 mm |
| `dev-webcam` | [Web Camera](https://sketchfab.com/3d-models/web-camera-b6461ec1520748179686b87bef7089e9) | darklord3d | CC BY 4.0 | pose as downloaded, real size 47×85×100 mm |
| `dev-wifi-adapter` | [USB Wifi Adapter](https://sketchfab.com/3d-models/usb-wifi-adapter-179787d27c2647ecb854eb8c607efa53) | VeLoct84 | CC BY 4.0 | pose as downloaded, real size 67×127×13 mm, 3 texture areas repainted (logos / print / screenshots) |
| `td-board` | [Lowpoly Ps2 Motherboard textured model](https://sketchfab.com/3d-models/lowpoly-ps2-motherboard-textured-model-5819601dfedb463db9ed101ba7d3821e) | B._.render | CC BY 4.0 | pose as downloaded, real size 240×150×39 mm |
| `td-components` | [[CC0] Set of Electronic Components](https://sketchfab.com/3d-models/cc0-set-of-electronic-components-f4cb777b4ea3490587008e24b61bcf75) | literallylara | CC BY 4.0 | pose as downloaded, real size 54×81×35 mm, parts: inductor, cap_cyl, cap_film, cap_ceramic, to220, to92, resistor, diode, led, button, breadboard |
| `td-laptop-battery` | [Mac Laptop Battery](https://sketchfab.com/3d-models/mac-laptop-battery-e463a4413af647a3b88b6c6d40a12e72) | Graphitage | CC BY 4.0 | canonical pose, real size 230×129×6 mm |
| `td-laptop-fan` | [Laptop cooling fan](https://sketchfab.com/3d-models/laptop-cooling-fan-0796a914f76944f8bb443dce83dc0c8a) | Guy in a Poncho | CC BY 4.0 | pose as downloaded, real size 77×98×10 mm, 4 logo/extra meshes removed |
| `td-phone` | [iPhone 12 Teardown](https://sketchfab.com/3d-models/iphone-12-teardown-708eaa5d195544918e5f70b69eedcdfa) | Peter_D | CC BY 4.0 | canonical pose, real size 72×147×9 mm, 2 logo/extra meshes removed, 3 texture areas repainted (logos / print / screenshots), parts: display, sim_tray, cameras, battery, vibration, speaker, usb_port, mainboard, frame |
| `td-sodimm` | [8 GB RAM SODIMM DDR4](https://sketchfab.com/3d-models/8-gb-ram-sodimm-ddr4-d5c9a2a4d15146889aa2e0b360ff00a2) | Cashierob | CC BY 4.0 | canonical pose, real size 30×70×1 mm, 2 texture areas repainted (logos / print / screenshots) |

### Тікелей ойындар (V2-11b, 2026-10-17)
Жаңа ассет жоқ. QR — өз кодтауышымыз (`src/lib/qr`), иконалар — бар `lucide-react` (ISC). WebSocket тәуелділіксіз (`node:http`, `node:crypto`).

### Геймификация (V2-11a, 2026-10-17)
Жаңа ассет жоқ. Деңгей шеңбері мен медальдар — SVG/CSS, белгі иконалары — бар `lucide-react` (ISC).

### Әкімші панелі (V2-10, 2026-10-13)
Жаңа ассет жоқ. Иконалар — бар `lucide-react` (ISC). Сервер тәуелділік қоспайды (`node:sqlite` backup API, `node:fs`).

### Мұғалім мен оқушы кабинеттері (V2-9, 2026-10-13)
Жаңа ассет жоқ. QR код өз кодтауышымызбен салынады (`src/lib/qr`, тәуелділік жоқ), иконалар — бар `lucide-react` (ISC).

### Сервер және кіру (V2-8, 2026-10-13)
Жаңа ассет жоқ. Иконалар — бар `lucide-react` (ISC). Сервер тәуелділік қоспайды (Node 24 `node:sqlite`, `node:crypto`).

### Себеп-салдар зертханасы (V2-7, 2026-10-13)
Жаңа ассет жоқ. Монитор, BIOS экраны, жұмыс үстелі, графиктер — CSS/SVG; дыбыстар Web Audio-да синтезделеді (файл жоқ). BIOS мәтіні жалпы үлгі (American Megatrends атауы — тек мәтін, логотип жоқ).

### Жалғау зертханасы (V2-6, 2026-10-13)
Жаңа ассет жүктелмеді. Үстел, монитор, пернетақта, тышқан, колонкалар және жүйелік блок — бар каталог модельдері (жоғарыдағы кестелер). Ұялардың орны модельдердің V2-2b порт маркерлерінен алынады. Ноутбук, роутер, ұзартқыш, кабельдер мен ашалар — процедуралық [PLACEHOLDER] (`scenes/ConnectLab`).

### Бөлшектеу, 2-бөлім (V2-5b, 2026-10-12)
Жаңа ассет жүктелмеді. Смартфон, планшет, моноблок, 3D-принтер және олардың ішкі бөлшектері — процедуралық [PLACEHOLDER] (`scenes/Teardown/*Teardown.tsx`, `pieces.tsx`); экрандардағы сурет — жобаның өз тұсқағазы (canvas).

### Бөлшектеу (V2-5a, 2026-10-12)
Жаңа ассет жүктелмеді. Жүйелік блок — көрме жинағының бар өнім модельдері (CC BY, жоғарыдағы кестелер); ноутбук пен оның ішкі бөлшектері — процедуралық [PLACEHOLDER] (`scenes/Teardown/LaptopTeardown.tsx`); жарық — Lightformer (файлсыз).

### Зертхана құрылғылары, 2-бөлім (V2-4b, 2026-10-12)
Жаңа ассет жүктелмеді. Жаңа процедуралық [PLACEHOLDER] модельдер: модем, Wi-Fi адаптері, қатынау нүктесі, NAS, шкафтың жеңіл қабығы (`scenes/LabSpace/devices/v24bDevices.tsx`); жапсырмалар canvas-та салынған, бренд жоқ.

### Зертхана құрылғылары (V2-4a, 2026-10-11)
Жаңа ассет жүктелмеді. Көрме мен 360° көрсеткіш каталог өнімдерін (V2-2a/b), анатомия placeholders және жаңа процедуралық [PLACEHOLDER] модельдерді (`scenes/LabSpace/devices/`) қолданады. Өзгеріс: `cpu-amd-am5` — «AMD Ryzen» бедері normal/roughness/occlusion картасынан алынды (`materials.paint.flat`). Лицензиялы модельдерге үміткерлер — ASSET_SOURCING.md §3.

### 3D зертхана (V2-3, 2026-10-11)
Жаңа ассет жүктелмеді. Зал, жиһаз, тақтайшалар, кесте және [PLACEHOLDER] құрылғылар процедуралық (`scenes/LabSpace/`). Қайта қолданылғандар: еден roughness картасы (`floor_rough*.webp`), Poly Haven HDRI `studio_small_09_1k.hdr` (CC0), каталог өнімдерінің GLB-лері (жоғарыдағы V2-2a/b кестелері), анатомия placeholders. Бренд атаулары (кестеде өнім атауы) — тек мәтін.

### Setup Studio (Фаза 4)
Каталог өнімдері (`src/data/hardware/catalog.ts`) жаңа ассет жүктемейді: әр өнімнің `modelPath`-ы жоғарыдағы `hardware/*.glb` модельдеріне сілтейді және `modelSize` арқылы өнімнің нақты өлшеміне масштабталады. Үстел — жобаның процедуралық `Desk`-і, орындық — процедуралық `scenes/SetupStudio/Chair.tsx` ([PLACEHOLDER]). Өнім атаулары мен сипаттамалары — өндірушілердің ресми беттерінен (сілтеме әр өнімде, `specCheckedAt: 2026-10-03`); сауда белгілері иелеріне тиесілі, жоба тек оқу мақсатында сипаттайды. Бағалар — «Demo price».

### Blender пайплайны (V2-0) — аралық файлдар, сайтқа шықпайды
`scripts/blender/pipeline.py` шикі GLB-ден `assets-src/blender/<name>/` (git-ке кірмейді) ішіне бөлшектерге бөлінген нұсқа жасайды. V2-0 дәлелі: «MSI GeForce RTX 3080 Gaming X Trio» (M E U, CC BY 4.0, жоғарыдағы кестеде) — өзгерістер: 4 логотип mesh-і (MSI, GeForce RTX) мен 11 мөлдір көмекші mesh алынды, қайталанған төбелер біріктірілді, 9 бөлшекке бөлінді, 0.323 м өлшемге келтірілді, порт маркерлері мен LOD1 қосылды. Превью суреттері `docs/blender/` — сол CC BY модельдің рендері (автор: M E U). `public/`-ке жаңа ассет қосылған жоқ. Болашақ модельдердің көздері мен лицензиялары: `ASSET_SOURCING.md`.

## HDRI (`public/assets/hdr/`)

| Файл | Ассет | Автор | Лицензия | URL | Өзгерістер |
|---|---|---|---|---|---|
| studio_small_09_1k.hdr | Studio Small 09 | Sergej Majboroda (Poly Haven) | CC0 | https://polyhaven.com/a/studio_small_09 | Өзгертілмеген, 1K (1.6 MB), тек шағылыс/IBL үшін (фон ретінде көрсетілмейді) |
| studio_small_09_2k.hdr (`assets-src/library/hdr/`) | Studio Small 09 | Sergej Majboroda (Poly Haven) | CC0 | https://polyhaven.com/a/studio_small_09 | 2K (6.3 MB) — Ultra режиміне арналған; кодта әлі қолданылмайды |

Қосымша: `EnvironmentLighting` HDRI үстіне 3 процедуралық Lightformer (softbox жолақтар) қосады.

## Процедуралық текстуралар (файл емес, canvas арқылы runtime-да)
`src/lib/three/proceduralTextures.ts`: brushed metal, мата, перфорацияланған тор, тышқан қабығының сызықтары, монитор тұсқағазы (жобаның өз дизайны). Сыртқы ассет қолданылмайды.

## Аудио (`public/assets/audio/`)
Әзірге жоқ.

## Шрифттер (npm арқылы, бандлға кіреді)
| Пакет | Шрифт | Лицензия |
|---|---|---|
| @fontsource-variable/manrope | Manrope (Mikhail Sharanda) | SIL OFL 1.1 |
| @fontsource-variable/unbounded | Unbounded (NaN) | SIL OFL 1.1 |

## Декодерлер (`public/decoders/`, `npm install` кезінде көшіріледі)
| Файл | Дереккөз | Лицензия |
|---|---|---|
| draco/* | three.js `examples/jsm/libs/draco/gltf` (Google Draco) | Apache-2.0 |
| basis/* | three.js `examples/jsm/libs/basis` (Binomial Basis Universal) | Apache-2.0 |

## Кітапханалар

### Фаза 5 параметрлік ассет
`src/scenes/DeskScene/pc/LiquidCooler.tsx`: жоба ішінде жасалған AIO помпа, түтіктер және радиатор геометриясы. Желдеткіштері бұрын лицензияланған Lian Li `fan_frame.glb`/`fan_rotor.glb`-ні қайта қолданады; бастапқы автор мен CC BY 4.0 attribution `/credits` бетінде сақталған. Белгілі бір брендтің дәл геометриясы деп көрсетілмейді.

three (MIT), @react-three/fiber/drei/postprocessing (MIT), postprocessing (Zlib), gsap (Standard "no charge" license — https://gsap.com/standard-license), zustand (MIT), react / react-router (MIT), lucide-react (ISC).

## Legacy ассеттер (`legacy/assets`, `legacy/textures`) — тек мұрағат
- `legacy/assets/*.jpg` — пайдаланушы фотолары, дереккөзі белгісіз → жаңа қосымшада ҚОЛДАНЫЛМАЙДЫ.
- `legacy/assets/products/*` — Wikimedia Commons / Openverse (CC BY / CC BY-SA, авторлары нақтыланбаған) → жаңа қосымшада қолданбас бұрын әр файлдың Commons бетінен автор мен лицензияны тексеру керек.
- Толық тізім: `legacy/ASSET_MANIFEST.md`.
