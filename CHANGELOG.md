# CHANGELOG

## 0.11.0 — 2026-10-04 — Фаза 7.1: Зертханалар хабы, Network Lab, ортақ бағалау
- «Зертханалар» хабы: 9 модульдің bento-карточкасы, қабатты SVG превью + tilt/parallax, Ашық/Бета/Жақында статусы (дайын емес модуль еш жерге апармайды), модуль бойынша орындалған тапсырма саны.
- Network Lab қайта жазылды: логика `src/labs/NetworkLab/` (8 құрылғы, порт түрлері, Wi-Fi тек access point арқылы, L2 сегмент, IPv4 тексеру, бір router арқылы маршруттау, PING сұранысы + кері жауап, 19 себеп коды, тоқтаған құрылғы). UI: палитрадан сүйреп әкелу/басу, порттан портқа кабель (сүйреу немесе басу), кабельді таңдап алып тастау, IP/mask/gateway/DNS + router порттары, inline валидация, PING пакет анимациясы (жасыл/қызыл, тоқтаған жерде ✕), пернетақтамен жылжыту.
- 4 бағаланатын тапсырма: «3 компьютерді бір желіге қос», «Router және switch арқылы LAN құр», «IP адресін дұрыс бапта», «Қате желіні түзет» (4 ақау). Бағалау суретті емес, топология мен баптауды тексереді.
- `src/services/grading/`: Exercise/GradingRule/Attempt, ұпай /10, уақыт, қателер, кеңестер (−1), қайта тексеру (−1, ең көбі −3), «Орындалды» статусы, әр ереже бойынша түсіндірме; `toAssessment` → progress. `components/grading/GradeReportCard`.
- Ескі `lib/labs/network.ts` пен `NetworkPage.tsx` алынды; ескі `?task=lan|router|address` сілтемелері жаңа тапсырмаларға бағытталады.
- Тесттер: `test:network` (12), `test:grading` (3); `npm test` — барлығы өтеді.

## 0.10.0 — 2026-10-04 — Білім беру зертханалары және 40 тапсырма
- Желі: 8 құрылғы түрі, 4 тапсырма, кабельдер/IP/маска/gateway, LAN PING анимациясы, бағалау.
- Алгоритмдер: linear/binary search, bubble/selection/insertion sort; step/back/play/speed, бағандар, pseudocode/айнымалылар.
- Логика: AND/OR/NOT/XOR/NAND/NOR, 4 схема тапсырмасы, сым/сигнал/LED, ақиқат кестесі бойынша бағалау.
- 8 параметрлік тәжірибе; дұрыс/қате жауаптың түсіндірмесі, ұпай, уақыт, қате, persist.
- 40 тапсырма тізімі, нақты құрылғы/тапсырмаға deep link, прогресс пайызы және kk/ru/en атаулар.
- LoaderOverlay lazy; codeSplitting ортақ тәуелділіктерді WebGL-ден бөледі: 2D route-та Three/r3f eager preload жоқ.
- Progress v2: lifetime best ұпайлар 200 history лимитінен бөлек, v1 migration деректі сақтайды.
- 23 автоматты тест; build/lint; Chromium desktop/mobile тексерулері және скриншоттар. Legacy импорт, дәл SKU модельдері және соңғы browser/device QA ашық.

## 0.8.0 — 2026-10-04 — Фаза 6: AI Көмекші

### Қосылды
- `src/services/ai/` — `parse.ts` (kk/ru/en: бюджет, бірнеше мақсат, стиль, бренд-санат байланысы, Гц/4K/21:9, RAM/SSD көлемі, сымсыз, «толық сетап», «...сыз/без...»), `engine.ts` (талаптар → өнім сүзгілері, орындалмайтын талап ашық айтылады, LLM pin-дері тексеріледі, `diffBuilds`), `explain.ts` (мақсат басымдығымен қазақша түсіндірме), `validate.ts` (LLM жауабын тазалау), `client.ts` (сервер → timeout/қате/жарамсыз → local fallback), `catalogDigest.ts`.
- `server/ai-server.ts` — тәуелділіксіз Node сервері: `/api/ai/recommend`, `/api/ai/health`; Anthropic немесе OpenAI; кілт тек `.env`; body/rate limit, timeout; хабар мен кілт логқа жазылмайды. `npm run ai:server`, Vite `/api` proxy (сервер өшік болса 503 → fallback). `.env.example`.
- Чат «AI Көмекші»: асинхронды жауап, дереккөз белгісі (LLM / жергілікті), «Неге осылар?», барлық бөлшек, «Setup Studio-ға жүктеу» (3D-да бірден); құрастыру бетіндегі «AI-мен жақсарту» — ағымдағы жинақпен салыстырып өзгерістерді көрсетеді.
- `scripts/ai.test.mjs` (9 тест), `npm test`.

### Өзгерді
- `lib/studio/recommend.ts` — `RecommendOptions`: қосымша мақсаттар (салмақтар араласады), өнім сүзгілері, міндетті/алынатын санаттар.
- `lib/studio/assistant.ts` — `services/ai`-ға жіңішке үйлесімділік қабаты.

## 0.9.0 — 2026-10-03 — PC Assembly Lab және нәтижелер
- Бос корпус/үстелдегі бөлшектер, шынайы pointer drag/snap, жарықталған ұяшық, батырма/пернетақта баламасы, реттілік пен каталог үйлесімділігі.
- Қуат қосу → ұпай/уақыт/қате/көмек. `/progress`: ең жақсы ұпайлар, тарих, жетістіктер, сақталатын анатомия quiz нәтижелері.
- Chromium: CPU нақты сүйреп орнатылды; толық жинақ 100/100; reload ұпайды сақтайды. Екі grading/dependency тесті.

## 0.8.0 — 2026-10-03 — Құрастыру киносы және жергілікті сетап көмекші
- «Сетапты көру» енді бос үстелден басталады: 24-ке дейін қадам, сыртқы құрылғылар және ішкі PC бөлшектері, кабельдер, желдеткіш/RGB/экран іске қосылады.
- Replay, Skip, reduced-motion, толық 360° орбита, inside/exploded, конфигурация мен demo баға; desktop/mobile UI.
- GPU ұзындығы, RAM саны, ауа/AIO кулер түрі таңдалған каталогқа бейімделеді; монитордың 16:9/21:9 форматы ескеріледі. Ақ пернетақтада текстуралық таңбалар материал шейдері арқылы сақталады.
- ASUS ROG Strix XG27AQMR 300 Гц ресми сипаттамамен қосылды (65 өнім).
- Чатта бюджет/мақсат/түстер/ASUS жиілігі/Logitech талғамы; детерминистік ұсыныс, үйлесімділік және каталог ID қақпасы, бюджет асып кетуі/табылмаған талап, «3D-ға қолдану». Сұрау жергілікті өңделеді; LLM backend жоқ.
- 3 assembly және 4 assistant тесті; asset validator, lint/typecheck/build. Сессия есебі: `docs/SESSION_2026-10-03_PHASE5.md`.

## 0.6.0 — 2026-10-03 — Фаза 4: Setup Studio 3D

### Қосылды
- `src/data/hardware/catalog.ts` — 15 санат (монитор, пернетақта, тышқан, құлаққап, колонкалар, үстел, орындық, корпус, процессор, кулер, аналық плата, RAM, видеокарта, SSD, блок питание), 64 қазіргі өнім. Әр өнімде: id, category, brand, model, priceKZT, priceUpdatedAt, priceSource (`demo`), specifications, specSourceUrl + specCheckedAt, compatibility, modelPath, modelSize, thumbnail, colors, performanceTier, recommendedUse. Сипаттамалар өндірушінің ресми беттерінен тексерілді.
- `src/data/studio/options.ts` — санаттар, мақсаттар, бюджет, стиль, түстер.
- `src/lib/studio/` — `compatibility.ts` (11 ереже, қазақша түсіндірме), `pricing.ts`, `power.ts`, `recommend.ts` (бюджетке сай үйлесімді жинақ), `build.ts`.
- `store/studioStore.ts` — persist `vil3d:setup` v1 + migrate/merge (жоғалған каталог id-ларын тазалайды).
- `/studio`: 5 қадамды конфигуратор (мақсат, бюджет, стиль, өнімдер, түстер), өнім карточкалары (сипаттамалар, деңгей, мақсатқа сай белгісі, «Сәйкес емес» алдын ала ескерту, Demo price, ресми сілтеме), тірі баға мен бюджет шкаласы, қуат бағасы, үйлесімділік есебі; мобильдіде bottom sheet.
- `scenes/SetupStudio/` — таңдау бірден 3D-да: өнім өлшеміне масштабталған модельдер, ақ/қара/аралас перифериялар, үстел беті (4 түрлі), корпус түсі (қара/ақ/графит/күміс), RGB (7 режим), процедуралық орындық; 360° (орбита, zoom, reset, авто айналу ±108°).
- `/studio/summary` — «Сетапты көру» қорытынды беті.
- `lib/three/finish.ts` — материал бояуы: normal/roughness/metalness карталары сақталады.

### Өзгерді
- `Desk` — `surface` опциясы; `PCCase` — `fixed`, `interactive`, `rgbColor`; `PCPart` — `enabled` (hero-дан қалған highlight студияда шықпайды).
- `data/hardware/types.ts` — каталог схемасы кеңейтілді (Socket, MemoryType, SpecEntry, FinishId).

## 0.5.0 — 2026-10-03 — Фаза 3: Hardware Explorer («Компьютер анатомиясы»)

### Қосылды
- `/explorer` беті (навигацияда «Анатомия», Зертханалар бетінен сілтеме): екі санат — 8 сыртқы құрылғы (монитор, пернетақта, тышқан, құлаққап, микрофон, веб-камера, колонка, принтер) және 10 ішкі бөлшек (аналық плата, CPU, RAM, GPU, SSD, HDD, PSU, кулер, желдеткіштер, желі картасы).
- `scenes/HardwareExplorer/`: hero үстелі мен GLB-лері қайта қолданылады (жаңа ауыр модель жоқ); ішкі бөлшектер антистатикалық төсеніште жатады; `AnatomyCamera` — жалпы көрініс ↔ құрылғыға тегіс ұшу, overlay-лер босатқан аумаққа центрлеу (view offset), сүйреу ұшуды тоқтатады; `AnatomyItem` — hover highlight, таңдалмағандар күңгірттенеді, нөмірлі hotspot; көлеңке тек өзгерістен кейін жаңарады.
- Ақпарат панелі: үш тілде атауы, сипаттамасы, «Не үшін керек?», негізгі сипаттамалар, үйлесімділік, 3 сұрақтық тест (түсіндірмесімен), алдыңғы/келесі.
- Тізім режимі: 3D-сіз барлық мәлімет пен тест, мазмұны, «3D-да көрсету»; WebGL жоқ болса автоматты.
- `src/data/hardware/anatomy.ts` + `locales/{kk,ru,en}.json` → `anatomy.*` (18 құрылғы × үш тіл).
- 5 процедуралық уақытша модель: микрофон, веб-камера, принтер, HDD, желі картасы.

### Өзгерді
- `lib/three/materialFx.ts` — highlight/dim материал жазбалары `PCPart` пен анатомияға ортақ; `Hotspot.module.css` → `components/3d/`.
- `useMonitorWallpaper` жеке файлға шығарылды; TopBar 5 навигация элементіне бейімделді (≤1320 px бренд мәтіні жасырылады).

## 0.4.0 — 2026-10-03 — Фаза 2.3: лицензиясы таза GLB модельдер

### Қосылды
- 14 Sketchfab CC BY 4.0 модель (монитор, пернетақта, тышқан, корпус, аналық плата, CPU, кулер, RAM, GPU, NVMe SSD, PSU, желдеткіш, құлаққап, колонкалар) → 16 оңтайландырылған GLB `public/assets/models/hardware/` (85 MB → 6.2 MB).
- `scripts/optimize-assets.mjs` / `validate-assets.mjs` (`npm run assets:optimize|validate`), @gltf-transform + meshoptimizer + sharp.
- `ModelLoader` `fit` опциясы (бағыт, метрлік өлшем, туралау), инстанс материалдары, transmission fallback; процедуралық модельдер fallback болып қалды.
- `models/HardwareDevices.tsx`, `pc/HardwareParts.tsx`, `devices.ts`: GLB интеграциясы, storyRig/PCPart анимациялары сақталды; монитор экранына жоба тұсқағазы.
- 360° режимі перифериялар үшін (`enterDevice`, панельдердегі «360° қарау»).
- `/credits` беті (kk/ru/en), басты беттен сілтеме.
- Dev `/?debug` өнімділік readout.

### Өзгерді
- `PCPart`: magnify бөлшек ортасына қатысты; GLB кеш жүктелгенде материалдар қайта тіркеледі.
- `ShadowSync`: `autoUpdate=false` әр кадрда бекітіледі.
- Draw calls (бір өту) ~250–280 → 46–124.

## 0.3.0 — 2026-10-03 — Фаза 2.2: ПК іші, exploded view, hotspot-тар, 360°

### Қосылды
- `src/scenes/DeskScene/pc/`: ПК 8 бөлек анимацияланатын бөлшекке бөлінді — `Motherboard`, `Cpu`, `CpuCooler`, `RamKit` (4 × DDR5), `Gpu`, `NvmeSsd`, `Psu`, алдыңғы желдеткіштер + `Chassis` (алынатын шыны, shroud, артқы желдеткіш, кабельдер). Нақты өлшемде: радиатор қабырғалары, желдеткіш қалақтары, слоттар, PCB текстуралары, жапсырмалар.
- `PCPart` орамы: exploded орын ауыстыру, белсенді бөлшекті highlight / қалғанын dim, басу, нөмірленген hotspot (drei `Html`).
- `parts.ts`: бөлшек тізілімі; exploded орындары EXPLODED камерасының экран кеңістігінде есептеледі; ұсақ бөлшектерге `magnify`.
- Scroll story: Chapter 6 «Корпустың іші» (шыны шығып, жоғары көтеріледі, ішкі жарық жанады, камера ішке кіреді) және Chapter 7 «Бөлшектер» (exploded + 8 бөлшек бойынша қадамдап фокус/ақпарат).
- 360° режимі: `ExploreCamera` (OrbitControls, damping, zoom, еденнен төмен түспейді, бөлшекке ұшу, reset, auto-rotate) + `ExploreOverlay` (Сапарға оралу / Камераны қалпына келтіру / Авто айналу / Жинау–Бөлшектеу, бөлшек панелі, Esc). Шыққанда камера сапарға тегіс оралады.
- `pcStore`, `pcRig`, `cameraHandoff`.
- kk/ru/en: `pc.parts.*`, `story.chapters.inside/exploded`, `explore.*`.
- Dev: `__vil3d.bench()`, `__vil3d.scene()`.

### Өнімділік
- Көлеңке картасы тек объект қозғалғанда жаңарады (`ShadowSync`, `shadowMap.autoUpdate = false`).
- Transmission шыны тек Ultra (Low–High: шағылысатын clear-coat шыны), `transmissionResolutionScale`.
- RectAreaLight тек High/Ultra; hemisphere жарығы алынды; showcase/ішкі жарықтар керек кезде ғана; keycap геометриясы жеңілдетілді; айналатын желдеткіштер көлеңке түсірмейді.
- Intel UHD: hero 51 → 18 мс (Medium), ПК жақын кадры 138 → 24–27 мс.

## 0.2.0 — 2026-10-03 — Фаза 2.1: Кинематографиялық үстел сахнасы

### Қосылды
- `src/scenes/DeskScene/` — Hero сахнасы: `Desk`, `DeskMat`, `Monitor`, `Keyboard`, `Mouse`, `PCCase` (+`Fan`), `Headset`, `Speakers`, `Room`. Нақты өлшемдер (`layout.ts`), extrude/lathe/деформация геометриясы, InstancedMesh (87 keycap, кулер қабырғалары, slat панель).
- `src/lib/three/geometry.ts` (rounded slab/frame, fan rotor, keycap, mouse shell, speaker driver, tube) және `proceduralTextures.ts` (brushed metal, мата, перфорация, тышқан сызықтары, монитор тұсқағазы).
- Poly Haven «Studio Small 09» HDRI (CC0, 1K) — IBL; `EnvironmentLighting` енді `hdri`, `environmentIntensity`, `shadowExtent`, `fog` қабылдайды.
- Монитор экраны → `RectAreaLight` (Medium+), артқы bias light → қабырғаға spot; ПК ішкі жарығы.
- GSAP ScrollTrigger бір timeline (`useStoryTimeline`): камера + DOF фокусы + объект хореографиясы (монитор бұрылады, пернетақта көтеріледі, тышқан 360° айналады, ПК RGB күшейеді). `storyRig` — GSAP жазады, `useFrame` оқиды.
- `StoryCamera`: timeline кадры + сүйреп орбита (инерциямен), екі рет басу — reset, бастапқы кадрда баяу idle қозғалыс, портретте `setViewOffset`.
- `StoryOverlay`: chapter 1 hero, 4 құрылғы панелі (сипаттамалар, факт), оң жақ chapter навигациясы, прогресс сызығы; мобильдіде bottom sheet.
- DOF (`DepthOfField`, High/Ultra) `sceneFocus` арқылы; quality preset-ке `depthOfField`, `transmission`, `areaLights` өрістері.
- `sceneStatusStore` + `ReadySignal`: loader сахнаның Suspense-і толық шешілгенше көрінеді; сахна қатесінде босатылады.
- kk/ru/en: `story.*` және жаңа `home.*` кілттері.

### Өзгерді
- `CAMERA_STATES` үстел layout-ына қайта бапталды.
- `FoundationScene` жойылды.

## 0.1.0 — 2026-10-03 — Фаза 0 (аудит) + Фаза 1 (негіз)

### Аудит
- `D:\VirtualLab` прототипі тексерілді: Three.js r160 (importmap, офлайн), `studio.js` (конфигуратор, каталог, жинау анимациясы, чат-бот, RGB тема, үйлесімділік), `scene.js` (scroll саяхат, 14 аялдама), `labs.js` (5 модуль, 100 ұпай), `thumbs.js`. Консоль қатесіз жұмыс істейді. Барлық 3D — процедуралық примитивтер (RoundedBox/Torus/Sphere).
- Прототип `legacy/`-ге көшірілді (түпнұсқа өзгертілмеді).

### Қосылды
- Vite 8 + React 19 + TypeScript 6 жобасы; ESLint flat config; `npm run dev|build|typecheck|lint|preview`.
- Тәуелділіктер: three 0.186, @react-three/fiber 9, drei 10, postprocessing, gsap, zustand 5, react-router 7, lucide-react, Manrope/Unbounded шрифттері.
- `scripts/copy-decoders.mjs` (postinstall): Draco + Basis декодерлері → `public/decoders/`.
- Дизайн токендері (`tokens.css`), global стиль, focus-visible, skip-link, reduced-motion.
- i18n: `kk.json` (эталон), `ru.json`, `en.json`; типтелген `TranslationKey`; `useT()`.
- Zustand `settingsStore` (тіл, сапа режимі, дыбыс) — versioned persist + migrate + localStorage fallback.
- Сапа жүйесі: 4 preset, GPU/құрылғы бойынша авто-анықтау, `PerformanceMonitor` арқылы автоматты төмендету.
- 3D компоненттер: `SceneCanvas`, `QualityController`, `PostEffects`, `EnvironmentLighting`, `CameraRig`, `ModelLoader`, `WebGLFallback`, `ErrorBoundary`.
- Аталған камера күйлері (`HOME_WIDE` … `FINAL_SETUP`).
- `HardwareItem` каталог схемасы (тек тип).
- Беттер: Басты (толық экран 3D + hero), Зертханалар (9 модуль, фаза статусы), Setup Studio, Нәтижелерім, 404.
- `LoaderOverlay` («3D зертхана жүктелуде», %, ресурс категориясы).
- `start.bat` (npm install + npm run dev).
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, ASSET_MANIFEST, CHANGELOG, KNOWN_ISSUES, ARCHITECTURE, README.
