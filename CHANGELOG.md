# CHANGELOG

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
