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
