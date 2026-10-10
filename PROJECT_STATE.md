# PROJECT STATE — Virtual Informatics Lab 3D

Жаңартылды: 2026-10-10
**Ағымдағы фаза: V2-2a дайын (перифериялар мен жиһазға 28 жеке модель, үш деңгей, логотиптер алынды). V2-1, V2-0, Фаза 0–9 дайын. Келесі — V2-2b (ПК бөлшектері). 2K KTX2 `_hd` файлдары toktx орнатылғанда. Жоспар: PLAN_V2.md.**

> Жаңа сессия басталғанда: алдымен осы файлды, `ROADMAP.md`, `TODO.md`, `ARCHITECTURE.md` оқы, содан кейін төмендегі `NEXT_ACTION`-нан жалғастыр. Жобаны нөлден бастама.

## V2-2a — Әр өнімге жеке модель, 1-топ: перифериялар мен жиһаз (2026-10-10)
- **Жүктеу.**
  - Пайдаланушы Sketchfab-тан 26 GLB жүктеді (24 жоспарлы + өзі таңдаған 5; HyperX, K120, Dell жүктелмеді, орнына балама қолданылды). Бәрі CC BY 4.0, лицензия GLB метадеректерінен тексерілді.
  - Шикі файлдар `assets-src/sketchfab/v2/` (git-ке кірмейді).
  - 23-і қолданылды, 3-еуі V2-4-ке сақталды.
- **Blender пайплайны v2** (`scripts/blender/pipeline.py`):
  - `rotate`;
  - `realSize: [W, D, H]` (өнімнің нақты өлшемі);
  - `extends` (вариант конфигтері);
  - `materials.rename/paint` (`Screen`, `DeskTop`, түс варианттары);
  - `cleanup.paint` (текстурадағы логотипті айналасының түсімен жабу);
  - `cleanup.separateLoose` (кабельді бөлу);
  - rig/armature-ды «пісіріп» өшіру;
  - custom normals бар mesh-тер біріктірілмейді (перне беттеріндегі дақтар жойылды);
  - бөлшекке `transform`.
- **Көмекші скрипттер:** `inspect.py` (4 ракурс + топтар), `materials.py` (материал ауданы мен бағыты), `textures.py` (логотип іздеу үшін түс текстуралары), `thumbnails.py`.
- **28 өнімнің конфигі** — `scripts/blender/configs/products/`: 5 монитор, 5 пернетақта, 5 тышқан, 4 құлаққап, 3 колонка, 3 орындық, 3 үстел. `npm run blender:pipeline -- products`.
- **Үш деңгей** (`npm run assets:optimize`):

  | Файл | Деңгей | Үшбұрыш | Текстура |
  |---|---|---|---|
  | `products/<id>.glb` | High/Ultra | ≤ 80k | ≤ 2048 px |
  | `_lod1` | Medium | ≤ 30k | ≤ 1024 px |
  | `_lod2` | Low | ≤ 8k, мүмкін болса | ≤ 512 px |

  Алыстағы модель келесі жеңіл деңгейді көрсетеді (`modelLevels()`). `assets:validate`: 99 GLB, бәрі жерде, ортада, нақты өлшемде, мониторларда `Screen`, үстелдерде `DeskTop`.
- **Сайт.**
  - `catalog.ts`: 28 өнім `products/<id>.glb` моделіне ауысты (`P()`); LG 34GP83A бұрынғы ultrawide-та қалды.
  - Setup Studio: жеке модельдер масштабсыз/бұрылмай қойылады.
  - Монитордың тұғыр/панель бөлінісі `Screen` шекарасынан есептеледі.
  - Тұсқағаз экран UV-іне өздігінен келтіріледі (айна/төңкеру).
  - Үстел GLB (`ProductDesk`, қара/ақ — тек үсті), орындық GLB.
  - Ескі процедуралық `Desk`/`Chair` модельдері модельсіз өнімдер үшін қалды.
- **Логотиптер.**
  - Алынған mesh-тер: ASUS, LG, SteelSeries, Razer.
  - Текстурадан жабылғандар: Logitech G (G203, G700s, G735), SteelSeries (4 аймақ), монитор тұсқағаздары (TUF, Windows).
- **Тексерілді:** `npm test` 90/90, lint, typecheck, build, `assets:validate`. Скриншоттар — `docs/v2-2a/`.

### Бұрын / кейін (Setup Studio, бірдей жинақ, Intel UHD)

| Сапа | FPS | Үшбұрыш | GPU текстура | Жүктеу |
|---|---|---|---|---|
| Low | 82 → 85 | 130k → 139k | 48.6 → 65.6 MB | 5.40 → 6.18 MB |
| Medium | 77 → 80 | 225k → 191k | 276 → 301 MB | 11.68 → 12.76 MB |
| High | 32 → 32 | 239k → 399k | 276 → 440 MB | 11.68 → 16.9 MB |

- Басты бет пен анатомия өзгерген жоқ: бұрын/кейін бірдей.
- High әдейі ауырлады: 2K текстуралар мен толық геометрия тек дискретті GPU-ға арналған.
- `dist` 16 → 52 MB, себебі 84 өнім файлы қосылды. Бетке тек таңдалған өнімнің бір деңгейі жүктеледі.

## V2-1 — Көрнекі сапа және жарқын стиль (2026-10-10)
- **Антиалиасинг.**
  - Low-да MSAA қосылды (бұрын мүлде жоқ еді).
  - High/Ultra-да MSAA-ның (composer 4×/8×) үстіне SMAA қосылды.
  - High-да DPR шегі 2-ге дейін көтерілді (HiDPI экранда; High тек дискретті GPU-да авто таңдалады).
  - Medium-да контекст MSAA 4× бұрынғыдай. Medium-ға SMAA қосылмады: ол post chain-ді, яғни FPS шығынын талап етеді, ал MSAA жеткілікті.
  - Салыстыру суреттері: `docs/v2-1/aa_low_desk.jpg` (бұрын | кейін), `aa_med_case.jpg`.
- **Текстура анықтығы.**
  - GLB, үстел және еден текстураларына anisotropy қосылды: Low 4 / Medium 8 / High–Ultra 16 (GPU шегінде).
  - Өзіміз жасаған тор материалдарында (корпус, GPU, БП, анатомия) `alphaToCoverage` қосылды: дақтың орнына тегіс тор көрінеді.
  - GLB MASK материалдарына alpha-to-coverage қосылмады: корпус үстінде «кір» дақ берді, сондықтан әдейі алынды.
- **2K KTX2 close-up деңгейі** (`<name>_hd.glb`, 9 hero модель).
  - High/Ultra-да модель экранда 380 px-тен үлкен болса, тек сол модельдің текстуралары фонда ауысады. Геометрия бірдей, сахна тоқтамайды.
  - Код пен пайплайн дайын (`HD_MODELS`, `HdTextures`, `optimize-assets.mjs` → toktx UASTC + Zstd + mipmap).
  - **HD файлдар әлі жасалмады — KTX-Software (toktx) орнатылуын күтеді** (пайдаланушы рұқсат берді, өзі орнатады). Онсыз сайт 1K-мен жұмыс істейді.
- **Жарық тема және жарқын стиль.**
  - Токендер: қараңғы «түнгі зертхана» (көкшіл, градиентті фон) + жаңа жарық «күндізгі зертхана».
  - Ауыстырғыш TopBar-да: Қараңғы → Жарық → Жүйелік (`settings.theme`, storage v2). Әдепкі — Қараңғы.
  - CSS-тегі ~210 тікелей түс арна токендеріне ауыстырылды: `--ink-rgb`, `--panel-rgb`, `--shadow-rgb`, `--on-accent`, `--text-halo`.
  - 3D сахна темаға сай: градиентті фон, тұман, қабырға/еден/рейка түстері, exposure 1.12 / 1.05, IBL ×1.2 / ×1.45.
  - Мәтін контрасты екі темада ≥ 4.5:1 (тестпен тексеріледі).
- **Тесттер:** `npm run test:visual` (4). Барлығы 88/88.
- **Өлшеу:** `perf-measure.mjs --theme=dark|light`.
- **Салыстыру суреттері:** `docs/v2-1/{dark,light}_{home,labs,assembly,network}.jpg`.

### Бұрын / кейін (Intel UHD, 1440×900, DPR 1, қараңғы тема)
Бұрын = V2-0 аудиті (Ultra үшін V2-0 build қайта өлшенді).

| Бет · Сапа | FPS (rAF) | ms/кадр (bench) | Draw calls | Үшбұрыш | GPU текстура | Жүктеу |
|---|---|---|---|---|---|---|
| `/` Low | 89 → 85 | 11.0 → 11.3 | 156 → 157 | 256k | 49.6 MB | 5.23 → 5.29 MB |
| `/explorer` Low | 87 → 79 | 9.8 → 10.6 | 73 → 74 | 100k | 26.3 MB | 5.04 → 5.10 MB |
| `/studio` Low | 103 → 102 | 7.1 → 7.0 | 22 → 23 | 12k | 8.3 MB | 2.27 → 2.33 MB |
| `/labs/assembly` Low | 80 → 70 | 11.7 → 12.9 | 151 → 152 | 185k | 36.6 MB | 4.40 → 4.46 MB |
| `/` Medium | 69 → 73 | 14.7 → 13.8 | 154 → 155 | 397k | 297 MB | 11.52 → 11.57 MB |
| `/explorer` Medium | 61 → 65 | 14.3 → 13.2 | 71 → 72 | 236k | 168 MB | 10.89 → 10.95 MB |
| `/studio` Medium | 88 → 96 | 7.7 → 7.6 | 20 → 21 | 12k | 75 MB | 4.98 → 5.03 MB |
| `/labs/assembly` Medium | 61 → 64 | 14.9 → 14.5 | 149 → 150 | 246k | 209 MB | 8.54 → 8.60 MB |
| `/` High | 28 → 32 | — | 154 → 155 | 453k | 297 MB | 11.57 MB |
| `/labs/assembly` High | 29 → 30 | — | 149 → 150 | 246k | 209 MB | 8.60 MB |
| `/` Ultra | 22 → 20 | — | 304 → 306 | 896k | 297 MB | 11.57 MB |
| `/labs/assembly` Ultra | 30 → 27 | — | 149 → 150 | 246k | 209 MB | 8.60 MB |

- **Low** 3–10 FPS баяулады (70–102 FPS қалды; 60 Гц экранда байқалмайды). Себебі — MSAA. Өлшем дәлелі: anisotropy 1-ге қайтарылғанда да сол сан шықты. Тісті жиектер аудиттің бірінші мәселесі (A1) болғандықтан MSAA қалдырылды; керек болса Low-да өшіруге болады (пайдаланушыдан сұралды).
- **Medium** баяулаған жоқ.
- **High/Ultra** интеграцияланған GPU-да бұрынғыдай ≈ 30/20 FPS: олар дискретті GPU-ға арналған. Мұнда bench көрсеткіші post chain-сіз, сондықтан салыстырылмайды.
- Жарық тема 3D өнімділікке әсер етпейді (Medium `/` 72 FPS, `/labs/assembly` 64 FPS).
- Қате жоқ.

## V2-0 — Аудит, құрылғылар каталогы, ассет жоспары (2026-10-10)
Сайт коды өзгерген жоқ (тек құжаттар, `scripts/blender/`, тест, npm скрипттері).

- **`AUDIT_V2.md`.**
  - Өлшеу: Intel UHD, 1440×900. Басты бет:

    | Сапа | Үшбұрыш | FPS | GPU текстура жады |
    |---|---|---|---|
    | Low | 256k | 89 | 50 MB |
    | Medium | 397k | 69 | 297 MB |
    | High | 453k | 28 | 297 MB |

    High/Ultra интеграцияланған GPU-ға арналмаған.
  - Скриншоттар: `docs/audit-v2/{low,medium,high}/*.jpg` және `crop_*.jpg`.
  - **Тісті жиектердің себептері:**
    - Low-да `antialias:false`;
    - `alphaTest` торлар MSAA алмайды;
    - кулер/радиатор қабырғалары 1 px-тен жұқа.
  - **Бұлдыр текстуралардың себептері:**
    - GLB текстураларында anisotropy = 1;
    - пайплайнда 1024 px шегі;
    - Low-да 512 px.
  - Жадты көп алатындар: аналық плата 53 MB, пернетақта 32 MB, SSD 782 △-ге 16 MB.
  - V2 бюджеттері: §3.4.
- **`DEVICE_CATALOG.md`.**
  - 60 құрылғы, 7 зона: `assembly`, `storage`, `peripherals`, `print_media`, `network`, `mobile`, `power`.
  - Әр құрылғыда: kk/ru/en атауы, оқушы/ересек түсіндірмесі, бөлшектеу (15 толық, 27 қарапайым), порттар, quiz тақырыптары.
  - Порт кілттері `port_<type>`: V2-6 мен Blender маркерлері үшін ортақ.
- **`ASSET_SOURCING.md`.**
  - 60 құрылғы:

    | Күйі | Саны |
    |---|---|
    | бар | 14 |
    | жүктеледі | 33 |
    | Blender-де жасалады | 13 |

  - 67 өнім:

    | Күйі | Саны |
    |---|---|
    | бар | 2 |
    | жүктеледі | 37 |
    | Blender вариант | 28 |

  - Sketchfab public API арқылы ізделді. 154 үміткердің әрқайсысының лицензиясы `/v3/models/<uid>` арқылы қайта тексерілді: бәрі CC BY 4.0 / CC0 және жүктеуге болады.
  - Жүктеу тізімі: 73 модель, ≈ 617 MB шикі, 4 топ — V2-2a (24), V2-2b (16), V2-4a (14), V2-4b (19).
  - Poly Haven CC0 жиһаз: 16.
  - Брендтерді ажырату кестесі: §5.1.
  - Ақылы нұсқалар (ұсыныс: әзірге сатып алмау): Superhive $49.99, CGTrader $7 / $24.99, TurboSquid $99 (тек editorial — жарамайды).
- **Blender 5.1 headless пайплайны** (`scripts/blender/`).
  - Файлдар: `pipeline.py`, `configs/gpu_triple_fan.json`, `run.mjs`, `verify-glb.mjs`, `README.md`.
  - Командалар: `npm run blender:pipeline`, `npm run test:blender` (4 тест).
  - Дәлел — MSI RTX 3080:
    - кіріс: 424 mesh, 64.7k △;
    - 4 логотип пен 11 мөлдір көмекші алынды;
    - 9 бөлшекке бөлінді, әрқайсысында `explode`/`order`/`labelKey` extras бар;
    - 8 порт маркері: DP×3, HDMI, PCIe x16, 8-pin×3;
    - өлшемі 0.323 м;
    - LOD1: 48.4k → 22.6k △;
    - веб-өлшемі (Meshopt + WebP): 0.53 MB;
    - уақыты ≈ 5 с.
  - Превью: `docs/blender/gpu_triple_fan_{assembled,exploded}.jpg`.
- **Тексерілді:** `npm test` 84/84, lint, typecheck, build таза. Сайт коды өзгермегендіктен өнімділік бұрынғыдай (жоғарыдағы аудит өлшемдері = базалық сызық).

## Фаза 9 — Оптимизация (2026-10-07)
- **Ассет пайплайны** (`npm run assets:optimize`): текстуралар PSNR ≥ 45 дБ ережесімен адаптивті өлшемде (детальді 1024 px қалады, тұрақты/тегіс карталар бірнеше px — көрінісі өзгермейді); ауыр модельдерге `<name>_lod1.glb` (монитор, кулер, құлаққап, аналық плата, колонкалар, тышқан); колонкалар бір `speakers.glb` (`#speaker_left` / `#speaker_right`, текстура GPU-да бір рет); үстел/еден үшін 512 px нұсқалар (Low). Қолданылмаған ассеттер (2K HDR, Poly Haven текстуралар, өсімдік) `assets-src/library/`-ге көшті (git-те сақталады, build-ке кірмейді).
- **Жүктеу:** ru/en сөздіктері жеке chunk (тек таңдалғанда); hero first — басты беттегі кішкентай модельдердің (колонкалар, тышқан, кулер, аналық плата) детальды нұсқасы сахна дайын болған соң жүктеледі; модельдер/текстуралар/HDRI reference counting арқылы ұсталады, ешбір сахна қолданбаса 2 с кейін dispose (geometry, material, texture, ImageBitmap) және кэштен шығады (`lib/three/assetCache.ts`, `modelAssets.ts`).
- **Рендеринг:** экрандағы өлшем бойынша LOD (< 90 px → light, High/Ultra-да < 55 px); Low: тек light модельдер + текстура ≤ 512 px (`maxTextureSize`), телефондар авто Low; production-да `checkShaderErrors` өшірулі; WebGL контексті жоғалса — хабарлама және өздігінен қалпына келу (2.7 с); бет жасырылса — `frameloop: never` (бұрыннан).
- **Instancing:** өлшенді және әдейі қолданылмады — 3 желдеткіш/2–4 RAM үшін +7 шейдер бағдарламасы (≈ 0.7 с компиляция) және айналатын роторларда instance буферін әр кадр жаңарту GPU-ды тоқтатты (74 → 54 FPS); 13 draw call үнемі тұрмайды. Көп дана бар жерде instancing бар (44 қабырға рейкасы), пернелер GLB-де бір mesh.
- **Өлшеу құралы:** `scripts/perf-measure.mjs` (headless Chrome + CDP: жүктеу, ready, draw calls, FPS, жады, бағдарламалар, `--quality`, `--mobile`, `--throttle`, `--profile`, `--profile-load`, `--shots`, `--fail`, `--no-webgl`, `--lose-context`, `--leave`), `scripts/perf-summary.mjs`. `?debug` production-да да `__vil3d` өлшеу ілгектерін ашады (тек оқу).
- **Тексерілді:** 11 бөлім (басты бет, анатомия, Setup Studio, ПК жинау, хаб, желі, алгоритм, логика, тәжірибелер, тапсырмалар, нәтижелер) production build-те қатесіз; hero скриншоты бұрынғымен бірдей; GLB жүктелмесе процедуралық fallback, бет құламайды; WebGL жоқ болса ақпараттық бет (0.8 MB ғана жүктеледі); контекст жоғалса қалпына келеді. `npm test` 80/80, build/lint/typecheck таза, `assets:validate` OK.

### Бұрын / кейін (басты бет — Medium, Intel UHD)
| Көрсеткіш | Бұрын (f221a3f) | Кейін | Өзгеріс |
|---|---|---|---|
| Production build (`dist/`) | 35.48 MB | 16.41 MB | −54 % |
| `public/` ассеттері | 32 MB | 12.66 MB | −60 % |
| Бастапқы JS (gzip, index.html) | 238 KB | 154 KB | −35 % |
| Сөздік chunk (gzip) | 127.4 KB (kk+ru+en) | kk бандлда; ru 45.6 / en 36.1 KB тек таңдалса | −79 KB |
| Барлық JS (gzip, 85 файл) | 894 KB | 897 KB | ≈ |
| GLB барлығы | 6.03 MB (16) | 6.65 MB (21, оның 6-уы `_lod1`) | Low-да тек 3.1 MB |
| Басты бет: дайын болғанша жүктеу | 11.16 MB | 9.54 MB | −1.6 MB (−15 %) |
| Басты бет: draw calls | 154 | 154 | — |
| Басты бет: үшбұрыш | 453k | 397k | −12 % |
| Басты бет: GPU текстура жады | 328.6 MB | 297 MB | −10 % |
| Басты бет: кадр (bench, Medium) / FPS | 12.3–13.2 мс / 73–75 | 12.3 мс / 77 | ≈ / +3 |
| Басты бет: дайын болу (localhost) | 6.8–7.5 с | 6.9–7.8 с | ≈ (шейдер компиляциясы, CPU) |
| Басты бет 20 Мбит/с | 11.3 с | 11.06 с | −0.25 с |
| Телефон (эмуляция, 20 Мбит/с): жүктеу | 11.16 MB | 7.93 MB | −29 % |
| Телефон: GPU текстура / үшбұрыш | 328.6 MB / 442k | 49.6 MB / 243k | −85 % / −45 % |
| Телефон: дайын болу / JS heap | 12.9 с / 72 MB | 11.0 с / 46 MB | −1.9 с / −36 % |
| Setup Studio: дайын болғанша жүктеу | 5.38 MB | 4.98 MB | −7 % |
| Setup Studio телефонда: GPU текстура | 75 MB | 8.3 MB | −89 % |
| Шейдер бағдарламалары (басты бет) | 31 | 33 | +2 |

Өлшеу: `npm run preview` + `node scripts/perf-measure.mjs http://localhost:4173` (headless Chrome, нақты GPU: Intel UHD, ANGLE/D3D11, 1440×900, кэшсіз). Сапа деңгейлері (Low / Medium / High / Ultra): AA жоқ / бар / бар / бар; көлеңке 0 / 1024 / 2048 / 4096; post жоқ / жоқ / бар / бар; модельдер light / ауыспалы / ауыспалы / ауыспалы; GPU текстура 50 / 297 / 297 / 297 MB; 101 / 71 / 31 / 22 FPS.

## Фаза 8 — Бағалау және прогресс (2026-10-05)
- Біртұтас бағалау: 6 зертхананың 39 тапсырмасы `services/grading` арқылы; Hardware Explorer тесті де (`makeChoiceQuiz`, `data/hardware/anatomyQuiz.ts`, `GradeReportCard compact`). Ескі `lib/labs/assessment.ts`, `toAssessment`, `data/labs/exercises.ts`, `useLabText`, `AssignmentsPage`, `Learning.module.css` алынды.
- `services/progress/`: `catalog` (тапсырмалар, оқу реті), `records` (ең жақсы нәтиже, әрекеттер, merge), `migrate` (v1/v2 → v3, прототип `vlab_progress_v1`), `summary` (күйлер, ұпайлар, `recommendNext`, `activityByDay`), `achievements` (14), `transfer` (JSON экспорт/импорт), `repository` (`ProgressRepository`, localStorage + backup/corrupt, басқа қойынды). Схема нұсқасы — `lib/storage.ts` `STORAGE_VERSIONS.progress = 3`.
- `store/progressStore.ts` (`record(report)`, `importSnapshot`, `reset`, `toasts`, `useProgressSummary`); `components/achievements/AchievementToaster` (AppShell).
- Беттер: `pages/Tasks/TasksPage` (`/assignments?status=&lab=`), `pages/Progress/` (`ProgressPage`, `ActivityChart`, `DataPanel`, `dates.ts`). Хабтағы карточкалар прогресі `useProgressSummary`-ден. Мәтін: `tasks.*`, `progress.*`, `achievements.*`, `grading.noAnswer` (kk/ru/en).
- Тесттер: `npm run test:progress` (12), `test:grading` (4); `npm test` 80/80; build/lint/typecheck таза.
- Тексерілді (in-app Chromium 1440×900, 375×812): бар v2 деректері v3-ке көшті (`vil3d:progress:backup-v2` жасалды); Монитор тесті 1 қатемен → 6/10 «Орындалмады», қайта → 9/10 «Орындалды» (−1 қайталау), тарих пен ең жақсы нәтиже сақталды; store арқылы 10/10 жинақ → «Алғашқы компьютер», «Perfect Build», «100% зертхана» хабарламалары кезекпен; нәтижелер беті (көрсеткіштер, түсті жолақтар, 14 күн, жетістіктер, тарих); тазалау диалогы (Болдырмау); JSON импорт → «1 жаңа әрекет қосылды», бөтен файл → қате; мобильдіде көлденең скролл жоқ; консоль қатесіз. Тексеруден кейін браузердегі деректер бастапқы күйге қайтарылды.

## Фаза 7.5 — Виртуалды тәжірибелер (2026-10-05)
- Логика `src/labs/Experiments/` (UI-сыз): `cpuTemp`, `memory`, `storage`, `latency`, `binary`, `cpuCycle`, `rgb`, `resolution`, `refresh` + `quiz.ts` (сұрақтар → `Exercise<QuizWork>`, 4+3+3) + `index.ts` (`EXPERIMENT_IDS`). Шынайы мәндер: HDD ~160, SATA ~530, NVMe 3500/7000 МБ/с; талшықта 200 км/мс; Tjmax 95 °C; RAM ~100 нс.
- UI `pages/Labs/ExperimentLab/` (`/labs/experiments?exp=…`, ескі `?task=`): 9 қойынды, әр тәжірибе жеке lazy chunk; `parts.tsx` (`ExperimentFrame`: кіріспе → интерактив → қорытынды → «оқу симуляциясы» → тапсырма), `Quiz.tsx` (`GradeReportCard`, progress). prefers-reduced-motion қолдауы.
- Алынды: ескі `ExperimentsPage`, `ExerciseResult`, `Exercise.module.css`, `lib/labs/experiments.ts`, `useEducationText`, `learning.test.mjs`. Assignments/Progress беттері тапсырма атауын `experiments.<id>.title`-дан алады. Хаб «Виртуалды тәжірибелер» — «Ашық».
- Тесттер: `npm run test:experiments` (10); `npm test` толық өтеді; build/lint/typecheck таза.
- Тексерілді (in-app Chromium 1440×900, 375×812): 9 тәжірибе жүктеледі, шикі кілт жоқ; CPU — боксты кулерде 100% жүктеме → 95 °C, троттлинг; RAM — ойын + OBS + Photoshop (16 ГБ) → своп 1,6 ГБ, жолақта тек RAM-нан асқан бөлігі штрихталған; диск жарысы — NVMe бірінші, HDD ең баяу; RGB тапсырмасы 2 дұрыс + 1 қате → 7/10, қате сұраққа түсініктеме; мобильдіде көлденең скролл жоқ; консоль қатесіз.

## Фаза 7.4 — Компьютерді виртуалды жинау (2026-10-04)
- Логика `src/labs/AssemblyLab/` (UI-сыз): `steps.ts` (11 қадам, тәуелділіктер, мақсат слоттары, `nextStep`, `progressOf`), `session.ts` (`place()` → installed / order / slot / miss), `exercise.ts` (толықтық 5 + рет 3 + слот 2, кеңес −1 ≤ −3, `isComplete` — толық жиналса «Орындалды»). `services/grading` → міндетті емес `isComplete`.
- Күй `store/assemblyLabStore.ts`; дыбыс `lib/audio/sfx.ts` (WebAudio, файлсыз, ауыстырғыш `settingsStore.soundEnabled`).
- 3D `scenes/AssemblyLab/`: `layout.ts` (тақта, төсеніш, корпус, мақсаттар; тақта позалары), `Draggable.tsx` + `dragState.ts` (сүйреу, snap, қате слот), `Guides.tsx` (елес, жарқыл), `props.tsx` (төсеніш, тұғырлар, кабель орамы), `AssemblyLabScene.tsx` (PCCase external, тақта жинағы, LabRig — ПК қосылуы, LabCamera — орбита, сүйреуде өшеді, қосылғанда корпусқа бұрылады).
- UI `pages/Labs/AssemblyLab/` (`/labs/assembly`): прогресс, уақыт, қателер, кеңестер, дыбыс, 11 қадам тізімі, хабарлама, «Кеңес: келесі қадам (−1)», нәтиже картасы, «Қайта бастау». Мәтін `pcLab.*` (kk/ru/en). Хаб карточкасы «Ашық».
- Тесттер: `npm run test:pc-lab` (6); `npm test` толық өтеді; build/lint/typecheck таза.
- Тексерілді (in-app Chromium 1440×900, нақты тышқанмен сүйреу): процессорсыз кулер → рет қатесі; аналық плата төсенішке жатты; CPU, кулер, RAM, NVMe тақтада; тақта жинағы корпусқа көшті; БП; видеокарта процессор сокетіне → «PCIe x16 слотына орнатылады, ал бұл — процессор сокеті»; видеокарта, диск, вентиляторлар, кабельдер → 9/10 «Орындалды», 01:32, 2 қате. Кеңес → төсеніште елес «Осында орнат», тізім мен тұғыр ерекшеленді. Толық жинағанда ПК қосылды (RGB, камера корпусқа), 10/10. Қайта бастау. Мобильді 375×812 — көлденең скролл жоқ. Консоль қатесі жоқ (Html түбірлері тұрақты mount). FPS: ≈26 мс/кадр («Төмен» авто, Intel UHD).

## Фаза 7.3 — Логикалық схемалар (2026-10-04)
- Логика `src/labs/LogicLab/` (UI-сыз): `types.ts`, `circuit.ts` (өңдеу, сым ережелері), `simulate.ts` (evaluate, cycleNodes/Tarjan, analyze, truthTable, expression), `tasks.ts` (and, notOr, xorBasic — тек AND/OR/NOT, table — 3 кірісті көпшілік функциясы).
- UI `pages/Labs/LogicLab/`: `LogicLabPage` (`?task=and|notOr|xorBasic|table|free`, ескі `xor/nand` сілтемелері), `Board` (ANSI гейттер, сүйреу, сым сүйреу/басу, ✕/Delete, ауыстырғыштар, LED, сигнал түстері), `Palette`, `TruthTable` (қазіргі жол, бассаң кірістер қойылады, «Берілген Y» бағаны), `SidePanel` (тапсырма + `GradeReportCard`, өрнек, ескертулер).
- Мәтін: `logic.*` (kk/ru/en). Хаб: «Логикалық схемалар» → «Ашық».
- Тесттер: `npm run test:logic` (10); `npm test` толық өтеді; build/lint/typecheck таза.
- Тексерілді (in-app Chromium 1440×900, 375×812): AND схемасын сүйреп жинау → A/B ауыстыру → сымдар мен LED жанады, кесте 0 0 0 1, «Y = A AND B»; OR-мен тексеру → 6/10, екі қате комбинация көрсетілді; G1 ↔ NOT циклі → «Тұйық цикл: G2 → G1», Y анықталмаған; көлденең сымның жоғалуы түзетілді (сүзгі аймағы); table тапсырмасында «Берілген Y» бағаны мен сәйкессіздік; 6 гейттің ANSI пішіні; мобильдіде көлденең скролл жоқ; консоль қатесіз.

## Фаза 7.2 — Алгоритм визуализациясы (2026-10-04)
- Логика `src/labs/AlgorithmLab/` (UI-сыз): `searches.ts` (linear, binary), `sorts.ts` (bubble ерте тоқтаумен, selection, insertion), `recursion.ts` (fact(n), n ≤ 8, шақырулар стегі), `recorder.ts` (immutable step snapshots, өзгерген айнымалылар, көрсеткіштер), `arrays.ts` (енгізу, seed-PRNG, кездейсоқ массив), `algorithms.ts` (реестр), `quizzes.ts` (3 тапсырма).
- UI `pages/Labs/AlgorithmLab/`: `AlgorithmLabPage` (`?algo=…&quiz=…`, ескі `?task=`), `Visualizer`, `ArrayView` (тұрақты id → тегіс ауысу, түстер, left/mid/right/i/j/min), `StackView`, `usePlayer` (ойнату/тоқтату/алға/артқа/жылдамдық/қалпына келтіру/уақыт сызығы), `QuizSection` (`GradeReportCard`).
- Мәтін: `algorithms.*` (атаулар, псевдокод, әр оқиғаның kk/ru/en түсініктемесі, тапсырмалар).
- Хаб: «Алгоритм визуализациясы» → «Ашық»; тапсырмалар реестрінде 3 жаңа тапсырма.
- Тесттер: `npm run test:algorithms` (10); `npm test` толық өтеді; build/lint/typecheck таза.
- Тексерілді (in-app Chromium 1440×900, 375×812): bubble қадамдары (8 ↔ 6 ауысуы, j көрсеткіші, swapped = true), екілік іздеу (аймақтан тыс күңгірт, 2 салыстыруда табылды), рекурсия стегі (fact(4)…fact(1), «күтуде»), автоойнату, ←, қалпына келтіру; 3 тапсырма: қате → «Сенің жауабың / Дұрыс жауап» + түсініктеме, қайта тексеріс → 9/10 және 8/10 «Орындалды», бірден дұрыс → 10/10; мобильдіде көлденең скролл жоқ; консоль қатесіз.

## Фаза 7.1 — Зертханалар хабы, Network Lab, бағалау (2026-10-04)
- Хаб `/labs` (`pages/Labs/LabsPage.tsx`, `modules.ts`, `ModulePreview.tsx`): 9 премиум карточка, қабатты SVG превью + tilt/parallax, статус Ашық/Бета/Жақында (`soon` — сілтеме емес), модуль прогресі. Алгоритм/логика/тәжірибелер — «Бета» (жұмыс істейді, 7.2-де жаңа бағалауға көшеді).
- Желі логикасы `src/labs/NetworkLab/` (UI-сыз): порттар (Ethernet/Wi-Fi, AP сыйымдылығы), `canConnect`, L2 сегменттер, IPv4/маска/резерв адрестер, бір router арқылы маршруттау, PING сұраныс + кері жауап, 19 себеп, тоқтаған құрылғы; `diagnose`; 4 тапсырма (`tasks.ts`).
- UI `pages/Labs/NetworkLab/`: палитрадан сүйреп әкелу (немесе басу/Enter), порттан портқа кабель (сүйреу немесе порт→құрылғы басу), кабельді таңдап ✕/Delete, IP/mask/gateway/DNS + router порттары, inline қате, PING пакет анимациясы (жасыл жол / қызыл ✕ тоқтаған жерде), бағыттауыш пернелермен жылжыту, «Еркін режим».
- Бағалау `src/services/grading/` (Exercise/GradingRule/Attempt, /10, уақыт, қателер, кеңес −1, қайта тексеру −1, ең көбі −3, «Орындалды», ереже бойынша себеп) + `components/grading/GradeReportCard`; нәтиже progress-ке сақталады.
- Тесттер: `npm run test:network` (12), `test:grading` (3); `npm test` толық өтеді; build/lint/typecheck таза.
- Тексерілді (in-app Chromium 1440×900, 375×812): хаб (9 карточка, прогресс 2/4); palette → workspace сүйреу; 3 кабель сүйреп/басып; connect3 → 9/10 «Орындалды» (бір сәтсіз тексеру −1); repair: әр PING себебі (кабель жоқ, қайталанған IP, gateway басқа желіде, gateway табылмады → SW1-де тоқтады); addressing баптау панелі арқылы 10/10, broadcast адреске inline қате; мобильдіде көлденең скролл жоқ; желі бетінде консоль қатесі жоқ.

## Фаза 6 — AI Көмекші (2026-10-04)
- Логика `src/services/ai/` (UI-дан бөлек): `parse.ts` (kk/ru/en: бюджет, бірнеше мақсат, стиль, бренд→санат, Гц/4K/21:9, RAM/SSD көлемі, сымсыз, «толық сетап», «...сыз/без»), `engine.ts` (тек каталог ID, талап сүзгілері, үйлесімділік, бюджетке жақындық, `diffBuilds`), `explain.ts` (басымдық бойынша қазақша түсіндірме), `validate.ts`, `client.ts` (сервер → local fallback), `catalogDigest.ts`.
- `lib/studio/recommend.ts` — `RecommendOptions` (қосымша мақсаттар, сүзгілер, include/exclude); `lib/studio/assistant.ts` — үйлесімділік қабаты.
- Backend `server/ai-server.ts` (`npm run ai:server`, :8787): Anthropic/OpenAI, кілт тек `.env` (`.env.example`), body/rate limit, timeout, валидация; Vite `/api` proxy. Кілтсіз → 503 → браузер жергілікті.
- UI: «AI Көмекші» чаты (`pages/SetupStudio/SetupAssistant.tsx`, `store/assistantStore.ts`): дереккөз белгісі, «Неге осылар?», «Setup Studio-ға жүктеу»; құрастыру бетінде «AI-мен жақсарту» (ағымдағы жинақпен айырма).
- Тесттер: `npm run test:ai` (9/9), `npm run test:assistant` (4/4), `npm test`.
- Тексерілді: браузерде чат (800 000 ₸ ойын+бағдарламалау → 781 000 ₸, түсіндірмелер), «Setup Studio-ға жүктеу» (баға 1 195 000 → 781 000 ₸), improve режимі, сервер health/503. Кейін production `/studio/summary` батырмасы да браузерде тексерілді: «AI-мен жақсарту» → айырмалар/түсіндірмелер/1 196 000 ₸ ұсынысы. Нақты LLM кілтімен тексерілмеген.

## Фаза 7/8 — Білім беру модульдері (2026-10-04)
- `/labs/network`: 8 құрылғы түрі, 4 тапсырма, топология/IPv4/маска/gateway тексеру, порттар мен кабельдер, PING анимациясы.
- `/labs/algorithms`: 5 алгоритм, immutable trace, алға/артқа/autoplay/жылдамдық, қозғалатын массив бағандары, pseudocode және айнымалылар.
- `/labs/logic`: 6 вентиль, 4 тапсырма, сымдар/сигналдар/LED, барлық 4 ақиқат жолын бағалау; цикл мен жетіспейтін кіріс анықталады.
- `/labs/experiments`: 8 модель, slider/формула/визуал, сандық жауапты бағалау (decimal comma қолдау, дискретті мәндерге дәл тексеру).
- `/assignments`: 40 оқу тапсырмасы; `/progress`: best scores, әрекеттер, 3 жетістік, реестр бойынша орындалу пайызы. Explorer `?device=...` арқылы нақты құрылғыны ашады.
- Логика: `lib/labs/{algorithms,network,logic,experiments}.ts`; реестр `data/labs/exercises.ts`; kk/ru/en мәтін `hooks/useEducationText.ts`; UI `pages/Labs/*Page.tsx`, `Learning.module.css`.
- LoaderOverlay lazy; `vite.config.ts` codeSplitting ортақ React/Zustand-ты WebGL chunk-ына жұтып қоймайды. Production index.html three/r3f preload жасамайды; 3D routes өздері жүктейді.
- Тексерулер: 23 автоматты тест, production build, lint. Chromium: LAN 100/PING, duplicate IP, AND 100/ақиқат кестесі, bubble autoplay/step 100, 300 Гц тәжірибесі 100, 40 сілтеме/монитор quiz, progress 6/40=15% және reload persist. Progress v2: lifetime best бөлек, 200 әрекет лимиті ұпайды өшірмейді; v1→v2 migration деректі сақтайды. Скриншоттар мен шектеулер: `docs/SESSION_2026-10-04_LEARNING.md`.

## Жаңа дайын модуль
`/labs/assembly` — нақты 3D drag/snap, таңдау/жарықталған ұяшық/пернетақта баламасы, реттілік пен каталог үйлесімділігі, қуат қосу, автоматты ұпай. `/progress` — сақталатын әрекеттер, ең жақсы ұпайлар, жетістіктер; анатомия quiz-і де сақталады. Файлдар: `store/pcLabStore.ts`, `store/progressStore.ts`, `lib/labs/{assessment,pcAssembly}.ts`, `hooks/useLabText.ts`, `pages/Labs/{PcAssemblyPage,ExerciseResult,Exercise.module.css}`, `scenes/PcAssemblyLab/PcLabScene.tsx`, `pages/Progress/`, router және AnatomyQuiz. Есеп: `docs/SESSION_2026-10-03_PC_LAB.md`.

## Осы жалғастырудағы жаңалық
`/studio/summary` — бос үстелден 24-ке дейін қадамдық кино, ішкі бөлшектерді орнату, толық 360°, inside/exploded, Skip/Replay, баға мен конфигурация. `/studio` — жергілікті чат: бюджет/мақсат/түстер, ASUS 300 Гц және Logitech талғамы → үйлесімді каталог жинағы → 3D. Толық есеп және шектеулер: `docs/SESSION_2026-10-03_PHASE5.md`. GPU ұзындығы/RAM саны/кулер түрі енді таңдалған өнімге бейімделеді; әр SKU үшін жеке модель әлі жоқ.

## Күйі
`/studio` Setup Studio 3D: 15 санат × 3–6 нақты өнім (65), мақсат → бюджет → стиль → өнімдер → түстер қадамдары, «Бюджетке сай жинақ ұсыну», әр таңдау 3D сахнада бірден көрінеді, 11 үйлесімділік ережесі қазақша түсіндірмемен, тірі баға мен бюджет шкаласы, түс конфигураторы, 360° қарау, localStorage-та сақталады, «Сетапты көру» → `/studio/summary`. `/explorer` «Компьютер анатомиясы»: 8 сыртқы + 10 ішкі құрылғы 3D-да (hero GLB-лері қайта қолданылды), басқанда камера тегіс жақындайды, қалғаны күңгірттенеді, панельде үш тілде атауы, сипаттамасы, мақсаты, сипаттамалары, үйлесімділігі және 3 сұрақтық тест; 3D-сіз тізім режимі бар. Басты бетте толық scroll-кино жұмыс істейді: 7 chapter + 360° режимі. Перифериялар (монитор, пернетақта, тышқан, құлаққап, колонкалар) және ПК (корпус + 8 бөлшек) енді лицензиясы таза Sketchfab CC BY 4.0 GLB модельдері: оңтайландырылған (Meshopt, WebP 1K), барлығы 6.2 MB (шикі 85 MB). GLB жүктелмесе, бұрынғы процедуралық модель fallback. Авторлар `/credits` бетінде. `npm run typecheck`, `npm run lint`, `npm run build`, `npm run assets:validate` қатесіз; dev консолінде қате жоқ.

## Аяқталған модульдер
- **Фаза 0–1:** аудит, legacy, Vite/React/TS/R3F негізі, router, Zustand, i18n (kk/ru/en), сапа контроллері, SceneCanvas, ModelLoader, LoaderOverlay, WebGL fallback.
- **Фаза 2.1:** үстел сахнасы, HDRI жарық, 5 chapter scroll (GSAP ScrollTrigger бір timeline), ақпарат панельдері, мобильді bottom sheet.
- **Фаза 2.2:**
  - ПК 8 бөлек бөлшекке бөлінді (`src/scenes/DeskScene/pc/`): аналық плата (PCB текстурасы, қабырғалы VRM радиаторлары, LGA рамасы, 4 DIMM, PCIe, M.2, конденсаторлар), CPU (IHS ойықтарымен), мұнара кулер (46 қабырға, 4 мыс түтік, желдеткіш), 4 × DDR5 RAM, GPU (тесікті қаптама, 3 желдеткіш, қабырғалар, backplate, PCIe, кронштейн), NVMe M.2 SSD, PSU (желдеткіш торы, модульді панель), 3 алдыңғы желдеткіш; шасси алынатын шынымен.
  - Chapter 6 «Корпустың іші»: шыны 5 см шығып, жоғары көтеріледі; ішкі жарық жанады; камера корпусқа кіреді.
  - Chapter 7 «Бөлшектер»: scroll-ға синхронды exploded view (бөлшектер EXPLODED камерасына қараған таза торға тарайды), бөлшек бойынша қадамдап фокус, белсенді бөлшек highlight, қалғаны dim, атауы + қысқа ақпарат + 3 сипаттама (kk/ru/en), 8 нөмірлі чип.
  - Hotspot-тар: нөмірленген белгілер (drei Html) + 3D бөлшекті басу → 360° режиміне кіріп, камера сол бөлшекке ұшады, толық панель ашылады.
  - 360° режимі: OrbitControls (damping, zoom, пансыз, еденнен төмен түспейді), «Камераны қалпына келтіру», «Авто айналу», «Жинау/Бөлшектеу», «Сапарға оралу» (камера тегіс қайтады, scroll орны сақталады), Esc.
  - Шыны: Ultra — transmission (IOR 1.52, attenuation, clear-coat, саусақ іздері); Low–High — шағылысатын smoked шыны (env, clear-coat, frit жиегі) — ешқашан толық көрінбейтін емес.
  - Өнімділік: on-demand көлеңкелер, transmission тек Ultra, RectAreaLight High+, жарық саны азайтылды. Intel UHD (осы компьютер): Medium (авто) ≈ 18–26 мс/кадр, High ≈ 27 мс.

- **Фаза 2.3 (GLB модельдер):**
  - `scripts/optimize-assets.mjs` (`npm run assets:optimize`): `assets-src/sketchfab/*.glb` → `public/assets/models/hardware/*.glb` — flatten/prune/dedup/weld/join, meshopt simplify (монитор, кулер, GPU, CPU, тышқан), Meshopt қысу, WebP ≤1024 px; кабельдер, бос бұрандалар, мөлдір көмекші mesh, құлаққап қаңқасы алынды; колонкалар L/R, желдеткіш рама/ротор болып бөлінді; ПК жинағынан тек корпус алынды. Есеп: `optimization-report.json`. `scripts/validate-assets.mjs` (`npm run assets:validate`).
  - `ModelLoader`: `fit` (бағыт + нақты метрлік өлшем + еденге/ортаға туралау + offset), әр инстанс өз материалын клондайды, Ultra-дан төмен transmission → clear-coat, PCPart-қа «жаңа ассет жүктелді» сигналы.
  - `models/HardwareDevices.tsx`: монитор (экранға жоба тұсқағазы эмиссивпен), пернетақта, тышқан, құлаққап, колонкалар — `layout.ts` анкерлері мен storyRig анимациялары сақталды.
  - `pc/HardwareParts.tsx`: аналық плата, CPU, кулер, 4 × RAM, GPU, SSD, PSU, 3 алдыңғы желдеткіш (айналатын ротор); `pc/Chassis.tsx` корпус қабығы GLB (шыны, ішкі жарық, кабельдер процедуралық қалды). `PCPart` magnify енді бөлшек ортасына қатысты.
  - 360° режимі монитор/пернетақта/тышқан/ПК/сетап үшін де (`devices.ts`, `pcStore.enterDevice`, панельдердегі «360° қарау»).
  - `/credits` беті (kk/ru/en) + басты беттен сілтеме; `src/data/assets/hardware.json`.
  - Dev: `/?debug` — FPS/draw calls/үшбұрыш readout + «Measure scene».

- **Фаза 3.1 (Компьютер анатомиясы):**
  - `src/pages/Explorer/`: `ExplorerPage` (3D сахна + құрылғылар тізімі + панель; Esc — жалпы көрініс), `AnatomyPanel` (Ақпарат/Тест қойындылары, алдыңғы/келесі), `AnatomyDetails` (үш тілде атау, сипаттама, мақсат, сипаттамалар, үйлесімділік), `AnatomyQuiz` (3 сұрақ, түсіндірме, нәтиже, қайта өту), `AnatomyListView` (3D-сіз нұсқа, мазмұны, «3D-да көрсету»; WebGL жоқ болса автоматты), `AnatomyControls` (санат / көрініс ауыстырғыш).
  - `src/scenes/HardwareExplorer/`: `AnatomyScene` (hero бөлмесі + үстелі; ішкі бөлшектер антистатикалық төсеніште), `AnatomyItem` (hover highlight, dim, нөмірлі hotspot), `AnatomyCamera` (жалпы көрініс ↔ ұшу, `freeArea` view offset), `AnatomyShadows`, `layout.ts`, 5 процедуралық уақытша модель (`placeholders.tsx`).
  - Деректер: `src/data/hardware/anatomy.ts` + `locales/{kk,ru,en}.json` → `anatomy.*`; `anatomyStore`; камера күйлері `ANATOMY_EXTERNAL/INTERNAL`.
  - Навигацияда «Анатомия», Зертханалар бетінде «Компьютер құрылғылары» модулі ашық.

- **Фаза 4 (Setup Studio 3D):**
  - Каталог `src/data/hardware/catalog.ts` (64 өнім; сипаттамалар өндіруші беттерінен 2026-10-03 тексерілді, сілтемесі әр өнімде; барлық баға «Demo price»), схема `types.ts`, сөздік `data/studio/options.ts`.
  - Бизнес-логика `src/lib/studio/`: `compatibility.ts` (сокет, RAM түрі, плата пішімі ↔ корпус, видеокарта ұзындығы ↔ корпус, кіріктірілген графика жоқ, БП қуаты, кулер сокеті/биіктігі/радиаторы/жылуы, міндетті бөлшек жоқ), `power.ts` (шыңдағы тұтыну, қажет БП = max(видеокарта өндірушісінің талабы, шың × 1,15)), `pricing.ts`, `recommend.ts` (салмақ бойынша бөлу → тәуелділік ретімен таңдау → бюджетке дейін төмендету → артық бөлшектерді алып тастау → қалған қаражатпен жақсарту).
  - Күй `store/studioStore.ts` (persist `vil3d:setup` v1, migrate + merge).
  - UI `src/pages/SetupStudio/`: `SetupStudioPage` (Wizard + StudioSummary + ViewTools), `WizardSteps`, `ProductsStep` (санат чиптері: таңдалды/міндетті/қате, карточкада «Сәйкес емес» алдын ала), `ColorsStep`, `StudioSummary`, `SetupSummaryPage` (`/studio/summary`).
  - 3D `src/scenes/SetupStudio/`: `StudioScene` (өнім өлшеміне масштабталған GLB, перифериялар/корпус бояуы, үстел беті, RGB, тек таңдалған бөлшектер), `StudioCamera` (orbit/zoom/reset/авто айналу ±108°, overlay-ге қарай view offset), `Chair` [PLACEHOLDER].

## Жартылай аяқталған
- Setup Studio: нақты KZ бағалары, өнім суреттері, әр өнімге жеке GLB әлі жоқ; ішкі өлшем/сан/кулер түрі таңдауға бейімделеді; орындық процедуралық.
- Анатомияда 5 құрылғы уақытша процедуралық: микрофон, веб-камера, принтер, HDD, желі картасы (TODO `[PLACEHOLDER]`).
- Progress және 40 тапсырма дайын; legacy progress импорт әлі жоқ.
- Үстел, коврик, бөлме, артқы желдеткіш, құлаққап тұғыры — процедуралық (TODO `[PLACEHOLDER]`).
- Брендтік логотиптер текстураларда қалды (§6).
- Poly Haven `potted_plant_04` және walnut/leather/plaster текстуралары жүктелген, бірақ кодта қолданылмайды.

## Тексерілгені (in-app Chromium)
- **Фаза 5/6.1:** production `/studio/summary`: бос үстел → толық кино, Skip → Replay қайта бос үстел, inside/AIO/exploded, ақ пернетақтада қара таңбалар. 375×812: бөлшектер кадрға сыяды, батырмалар мен баға оқылады; scrollWidth = 375. Чаттан 1 200 000 ₸ + ақ + ASUS 300 Гц + Logitech ұсынысы 3D-ға қолданылды. Production консолінде қате жоқ. Скриншоттар `docs/screenshots/`.
- **Фаза 4:** `/studio` 1280×720 және 375×812: 5 қадам; «Бюджетке сай жинақ ұсыну» (6 мақсат × 5 бюджет × 2 стиль — бірде-бір үйлесімсіздік жоқ; 300 000 ₸-ге толық жүйе сыймайтыны ашық көрсетіледі); i5-14400F + AM5 плата → сокет қатесі; DDR4 + AM5 → жад қатесі; RTX 5090 Astral (357,6 мм) + Fractal North (355 мм) → сыймайды; 750 Вт БП + 9950X + 5090 → қуат жетпейді; AK400 + 9950X → кулер ескертуі; карточкада «Сәйкес емес» алдын ала; түстер (ақ корпус/үстел/перифериялар, күлгін RGB) 3D-да; авто айналу, reset; бетті қайта жүктегенде конфигурация сақталды; «Сетапты көру» → қорытынды бет; hero → studio SPA навигациясы; консольде қате жоқ; hero exploded регрессиясыз. `__vil3d.bench()` студия: 173 call (көлеңкемен), 17–29 мс (1600×900 px, Intel UHD).
- **Фаза 3.1:** `/explorer` 1200×700 және 375×812: екі санаттың жалпы көрінісі, тізімнен/hotspot-тан таңдау → камера ұшуы, dim, панель; монитор тесті (2/3 нәтиже, түсіндірмелер); CPU, PSU, HDD, желі картасы, тышқан жақын кадрлары; санат ауыстыру; Esc / «Жабу»; тізім режимі kk/ru/en (18 карточка, тест details ішінде); тіл ауыстырғанда `<title>` пен барлық мәтін ауысады; горизонталь скролл жоқ; консольде қате жоқ. Hero (exploded + highlight) регрессиясыз. `__vil3d.bench()` 1500×875 px: анатомия 71–99 call, 0,20–0,24 млн үшбұрыш, 15–19 мс; hero сол өлшемде 20–25 мс.
- **Фаза 2.3:** GLB-мен 7 chapter скриншотпен (hero, монитор, пернетақта, тышқан, ПК іші, exploded 8 қадам); 360°: бөлшекке ұшу (PSU), «Жинау» (бөлшектер корпус ішіне дұрыс түседі), reset, «Сапарға оралу»; `/credits`; мобильді 375×812 (горизонталь скролл жоқ); консольде қате жоқ. `__vil3d.bench()` бір өту: hero 59 call / 7.8 мс, монитор 46 / 5.9 мс, ПК іші 124 / 10.4 мс, exploded 123 / 10.5 мс.
- Desktop 1280×720: 7 chapter-дің бәрі скриншотпен; exploded қадамдары (бөлшек ауысуы, highlight/dim); hotspot басу → 360°; тізімнен GPU таңдау → камера ұшуы; reset; «Жинау» (бөлшектер орнына, шыны жабылады); «Сапарға оралу» (scroll орны сақталды: 7156 → 7156).
- Мобильді 375×812: exploded bottom sheet, 360° режимі (иконкалы құралдар тақтасы, төменгі панель), горизонталь скролл жоқ.
- Production `vite preview`: консольде қате жоқ.
- Бенчмарк: `__vil3d.bench()` (dev) — draw calls, үшбұрыштар, мс/кадр.

## Осы сессияда өзгерген файлдар
- Жаңа: `src/data/hardware/catalog.ts`, `src/data/studio/options.ts`, `src/lib/studio/{build,compatibility,power,pricing,recommend}.ts`, `src/lib/three/finish.ts`, `src/store/studioStore.ts`, `src/scenes/SetupStudio/{StudioScene,StudioCamera,Chair}.tsx`, `src/pages/SetupStudio/{WizardSteps,ProductsStep,ColorsStep,StudioSummary,SetupSummaryPage,icons,studioText,useStudioBuild}.*`, `SetupStudio.module.css`, `SetupSummary.module.css`
- Өзгерген: `src/pages/SetupStudio/SetupStudioPage.tsx` (статус бетінің орнына конфигуратор), `src/data/hardware/types.ts`, `src/scenes/DeskScene/models/Desk.tsx` (`surface`), `src/scenes/DeskScene/pc/{PCCase,PCPart}.tsx` (`fixed`, `interactive`, `rgbColor`, `enabled`), `src/data/camera/cameraStates.ts` (`STUDIO_WIDE`), `src/lib/storage.ts` (`setup` v1), `src/app/router.tsx` (`/studio/summary`), `src/locales/*.json` (`studio.*`)
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, KNOWN_ISSUES, CHANGELOG, ARCHITECTURE, ASSET_MANIFEST

## Іске қосу
```bash
cd D:\informatics-lab
npm install
npm run dev          # http://localhost:5173  (анатомия: /explorer, студия: /studio)
npm run typecheck
npm run lint
npm run build
npm run preview      # http://localhost:4173
npm run assets:optimize   # assets-src/sketchfab → public/assets/models/hardware (шикі файлдар git-те жоқ)
npm run assets:validate
```
Dev консольде: `__vil3d.bench()` — draw calls / үшбұрыш / мс-кадр.

## Ағымдағы багтар
`KNOWN_ISSUES.md`: үстел/бөлме процедуралық; логотиптер қалды; үшбұрыш көп (~350–650k); three chunk ~293 KB gzip; жасырын қойындыда бірінші кадр кешігеді; dev-те «504 Outdated Optimize Dep» (қайта жүктеу); CPU/SSD exploded кезінде әдейі үлкейтілген; Firefox/Safari/нақты touch тексерілмеген.

## Жетіспейтін ассеттер
- GLB модельдер: үстел (CC0 табылмады; процедуралық + Poly Haven текстура), коврик, құлаққап тұғыры.
- Дыбыс эффектілері. Каталог деректері (Фаза 4).

## Маңызды архитектуралық шешімдер
1. Бір GSAP timeline тек `storyRig`-ті өзгертеді; 3D `useFrame`-де оқиды. Sticky stage — scroll hijacking жоқ.
2. Камера кадрлары `CAMERA_STATES`-те; объект орындары `layout.ts` / `pc/constants.ts` / `pc/parts.ts`-те.
3. Екі камера режимі (`pcStore.mode`): story ↔ explore; `cameraHandoff` арқылы секірусіз ауысу; `pcRig` бөлшектер үшін бір ғана күй көзі.
4. Exploded орындары камера экран кеңістігінде есептеледі — кадр өзгерсе, тор бірге ілеседі.
5. Highlight/dim материал түсін көбейту арқылы (ортақ материалдар `userData.shared`).
6. Көлеңке картасы on-demand (`ShadowSync`); transmission тек Ultra.
7. GLB тек `ModelLoader` арқылы: `fit` модельді нақты өлшемге келтіреді, анкер/анимация React орамында қалады; әр GLB-нің процедуралық fallback-і бар. Шикі ассеттер `assets-src/` (git-ке кірмейді), оңтайландыру скрипті қайталанатын.
8. Фаза 0–2.2 шешімдері күшінде (ARCHITECTURE.md).

NEXT_ACTION: V2-2b — PLAN_V2.md-дегі «V2-2b — Batch 2 (PC components)» промпты.
1. Жүктеу (ASSET_SOURCING.md §7a, 2-топ: 16 модель):
   - пайдаланушы өзі жүктейді (Claude in Chrome/Edge арқылы бір сайттан қатарынан жүктеу бұғатталады), сілтемелер тізімін бер;
   - файлдарды Downloads-тан `assets-src/sketchfab/v2/`-ге көшір, GLB `asset.extras`-тан автор/лицензияны тексер.
2. Пайплайн:
   - `scripts/blender/inspect.py`, `materials.py`, `textures.py` → конфиг (`configs/products/<id>.json`, `rotate` / `realSize` / `cleanup.remove/paint` / `materials`) → `npm run blender:pipeline -- products` → `npm run assets:optimize`;
   - ПК бөлшектерінде порт/слот маркерлері (`ports`) керек — V2-6/V2-7;
   - PC Assembly Lab, басты беттің exploded view (`PCCase`, `HardwareParts`) және Setup Studio жаңа модельдермен жұмыс істеуі тиіс.
3. Тексеру:
   - `perf-measure --storage=<setup.json> --probe=<js>` арқылы Studio-ны жинақпен өлше;
   - Low/Medium баяуламасын.
4. toktx (KTX-Software) орнатылса: `npm run assets:optimize` → `_hd.glb`.

Пайдаланушы шешімі (2026-10-10): барлық V2 толық ЛОКАЛДЫ; домен/хостинг — V2-12-ден кейін. Фаза 0–9, V2-0, V2-1, V2-2a дайын — нөлден бастама. D:/informatics-lab, dev :5173, preview :4173.
