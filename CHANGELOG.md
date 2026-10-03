# CHANGELOG

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
