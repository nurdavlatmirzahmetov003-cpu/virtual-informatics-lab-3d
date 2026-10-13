# ARCHITECTURE

## Student exercise core
Every lab grades through `services/grading` (`Exercise<Work>` → `GradeReport`) and stores the report with `useProgressStore.getState().record(report)`. `services/progress` owns the data: task catalogue, attempts + per-exercise best, migrations, achievements, export/import and the `ProgressRepository` (see #33).

Virtual Informatics Lab 3D — Vite + React 19 + TypeScript + Three.js (React Three Fiber).
Негізгі ТЗ: `MASTER_PROMPT.md`. Ескі прототип: `legacy/` (тек анықтама ретінде, build-ке кірмейді).

## Стек

| Қабат | Технология | Ескерту |
|---|---|---|
| Build | Vite 8 (Rolldown) | `npm run dev` / `npm run build` |
| UI | React 19, React Router 7 (`createBrowserRouter`) | Әр бет — `React.lazy` жеке chunk |
| 3D | three 0.186, @react-three/fiber 9, @react-three/drei 10 | WebGL2 базалық, WebGPU — болашақта прогрессивті |
| Post | @react-three/postprocessing 3 (postprocessing 6) | Тек High/Ultra |
| State | Zustand 5 + `persist` (versioned) | `src/store/` |
| Анимация | GSAP 3 (+ ScrollTrigger) | Фаза 2-де scroll story engine |
| Иконкалар | lucide-react | Эмодзи қолданылмайды |
| Стиль | CSS Modules + `src/styles/tokens.css` | Tailwind жоқ |
| Шрифт | Manrope Variable, Unbounded Variable (@fontsource, офлайн) | Кириллица + қазақ әріптері |
| Lint | ESLint 10 flat config + typescript-eslint + react-hooks 7 | `npm run lint` |

## Папкалар

```
src/
  app/router.tsx          маршруттар (lazy pages)
  main.tsx                кіру нүктесі (шрифттер, global.css, RouterProvider)
  styles/                 tokens.css (дизайн токендері), global.css
  locales/                kk.json (эталон), ru.json, en.json
  lib/
    i18n/                 translate(), TranslationKey типі (kk.json-нан шығарылады)
    quality/              presets.ts (Low/Medium/High/Ultra), detect.ts (GPU/құрылғы)
    three/                loaders.ts (Draco/KTX2/preload), framing.ts
    storage.ts            localStorage кілттері + схема нұсқалары
    webgl.ts              WebGL/WebGPU анықтау
  store/settingsStore.ts  тіл, сапа режимі, дыбыс (persist v1 + migrate)
  hooks/                  useT, useQualityPreset, useReducedMotion, usePageVisible, useDocumentTitle
  data/
    camera/cameraStates.ts  аталған камера күйлері (HOME_WIDE … FINAL_SETUP)
    hardware/types.ts       HardwareItem каталог схемасы
    hardware/catalog.ts     Setup Studio каталогы (64 өнім, ресми дереккөз, demo баға)
    studio/options.ts       студия сөздігі: санаттар, мақсат, бюджет, стиль, түстер
    hardware/anatomy.ts     анатомия құрылғылары: санат, spec кілттері, тест жауаптары (мәтін — locales)
    lessons/, assignments/  (бос — кейінгі фазалар)
  components/
    ErrorBoundary.tsx
    3d/  SceneCanvas, QualityController, PostEffects, EnvironmentLighting,
         CameraRig, ModelLoader, WebGLFallback
    ui/  Button(Link), LanguageSwitcher, QualitySelect, LoaderOverlay
    layout/ AppShell, TopBar, PageLayout
  scenes/
    DeskScene/            Hero сахнасы (Фаза 2)
      DeskScene.tsx       композиция + жарық (HDRI) + RectAreaLight init
      layout.ts           барлық объектілердің нақты өлшемдері/орындары (м)
      chapters.ts         5 scroll chapter: камера күйі, DOF фокусы, панель жағы, spec кілттері
      storyRig.ts         GSAP жазатын / useFrame оқитын мутацияланатын мәндер
      useStoryTimeline.ts БІР ScrollTrigger timeline (камера + фокус + объект хореографиясы)
      StoryCamera.tsx     timeline кадры + сүйреп орбита + портрет view offset
      ExploreCamera.tsx   360° режимі: OrbitControls + бөлшекке ұшу + reset + auto-rotate
      ShadowSync.tsx      көлеңке картасын тек қозғалыс болғанда жаңарту
      models/             Desk, DeskMat, Monitor, Keyboard, Mouse, Fan, Headset, Speakers, Room
      pc/                 PCCase (құрам + PcRigController), Chassis, PCPart (exploded/highlight/hotspot),
                          Motherboard, Cpu, CpuCooler, RamKit, Gpu, NvmeSsd, Psu, parts.ts, constants.ts,
                          pcRig.ts, usePcTextures.ts
    HardwareExplorer/     Компьютер анатомиясы (Фаза 3): AnatomyScene, AnatomyItem, AnatomyCamera,
                          AnatomyShadows, layout.ts (орындар/fit/фокус), placeholders.tsx + placeholderModels.ts
    SetupStudio/          StudioScene (өнімге байланған модельдер + бояу), StudioCamera (360°), Chair [PLACEHOLDER]
    PCScene/ SetupBuilder/   (бос — Фаза 5)
  labs/ NetworkLab/ AlgorithmLab/ LogicLab/ AssemblyLab/ Experiments/  (UI-сыз логика + тесттер)
  pages/ Home, Explorer (анатомия: панель, тест, тізім режимі), Labs, SetupStudio (конфигуратор + /studio/summary), Progress, Credits, NotFound, shared/
  services/ ai/, grading/   (бос — Фаза 6, 8)
public/
  assets/ models/ textures/ hdr/ audio/
  decoders/ draco/ basis/   (postinstall көшіреді, git-те жоқ)
scripts/copy-decoders.mjs
legacy/                     ескі ES-module прототип (python http.server арқылы ашылады)
```

## Негізгі шешімдер

1. **Бір canvas нүктесі.** `SceneCanvas` — WebGL контекст құратын жалғыз компонент. Әр бет өз сахнасын
   ішіне салады; бет unmount болғанда R3F renderer/геометрия/материалдарды dispose етеді → зертханалар
   бір уақытта жадта тұрмайды (ТЗ §8).
2. **Сапа жүйесі.** `qualityMode` (`auto|low|medium|high|ultra`) persist етіледі; `autoQuality` —
   `detectQuality()` (GPU жолы, ядро, жад, mobile) + `PerformanceMonitor` (5 с кешігумен басталады,
   FPS төмендесе бір деңгей төмендетеді). Ultra ешқашан автоматты таңдалмайды.
   Preset: DPR clamp, antialias (өзгерсе canvas remount), shadows + mapSize, post, MSAA, env resolution,
   contact shadow resolution, lodBias, maxTextureSize.
3. **Tone mapping.** Renderer: `NeutralToneMapping` (Khronos PBR Neutral). Post қосылғанда renderer
   tone mapping өшіріледі, `ToneMappingEffect(NEUTRAL)` қолданылады — екі рет қолданылмайды.
4. **Жарық.** `EnvironmentLighting` — офлайн Lightformer softbox орта (CDN HDRI жоқ) + key/fill/rim.
   Poly Haven HDRI кейін сол API арқылы қосылады.
5. **Камера.** Барлық кадрлар `CAMERA_STATES`-те аталған. `CameraRig` position/target/FOV-ты
   кадр жиілігінен тәуелсіз exponential damping-пен интерполяциялайды; қолданушы сүйрей бастаса — өтпелі
   анимация бірден тоқтайды. Портреттік экранда `framingScale()` камераны артқа шегіндіреді.
   `prefers-reduced-motion` → лезде өту, auto-rotate жоқ.
6. **Модельдер.** `ModelLoader` — `useGLTF` + жергілікті Draco + Meshopt + KTX2 (Basis), өз
   ErrorBoundary-і бар: GLB қатесі бүкіл сахнаны құлатпайды, url-мен console.error, fallback маркер.
7. **i18n.** Тәуелділіксіз: `translate(lang, key, vars)`; кілттер `kk.json`-нан типтеледі (қате кілт —
   TS қатесі). Fallback: lang → kk → key. `<html lang>` және `<title>` тілмен бірге ауысады.
8. **Persistence.** `STORAGE_KEYS` (`vil3d:*`) + `STORAGE_VERSIONS`. Zustand `persist` `migrate`
   дискідегі деректі валидациялайды. localStorage қолжетімсіз болса — жадтағы fallback.
   Кейін Supabase/PostgreSQL-ге көшу үшін persistence бір жерде жинақталған.
9. **Қателер.** WebGL жоқ → `WebGLFallback` (мәтіндік ақпарат). Сахна қатесі → `SceneCanvas`
   ішіндегі ErrorBoundary + «Қайта көру» (canvas қайта құрылады).
10. **Код бөлу.** `three`, `r3f`, `react` vendor chunk-тары (vite `advancedChunks`), беттер — lazy.

11. **Scroll story engine.** Бір GSAP timeline + ScrollTrigger (`scrub: 0.9`, reduced-motion → `true`),
    sticky stage (scroll hijacking жоқ). Timeline тек `storyRig` объектісін өзгертеді; 3D компоненттер
    оны `useFrame`-де оқиды → scroll кезінде React қайта рендерленбейді. Chapter индексі ғана
    `useStoryStore`-ға жарияланады (HTML панельдер үшін). `scrollToChapter(i)` timeline уақытын scroll
    позициясына айналдырады.
12. **Жүктеу күйі.** `SceneCanvas` → `sceneStatusStore.expected`; Suspense ішіндегі `ReadySignal` →
    `ready`. LoaderOverlay `active || (expected && !ready)` кезінде көрінеді.
13. **DOF.** `lib/three/sceneFocus.ts` — сахна фокус нүктесін жазады, `PostEffects` (High/Ultra) оқиды.
14. **Уақытша модельдер.** `lib/three/geometry.ts` пен `proceduralTextures.ts` — extrude/lathe/
    деформация + canvas текстуралар. GLB келгенде әр `models/*.tsx` файлы `ModelLoader`-мен
    ауыстырылады, ал `layout.ts` пен `PCCase` ішіндегі аталған топтар сақталады.

15. **ПК бөлшектері.** `pc/parts.ts` — бір дереккөз: анкер, exploded ығысу (EXPLODED камерасының экран
    кеңістігіндегі слоттан есептеледі), визуалды орталық, фокус қашықтығы, spec кілттері. Бөлшек компоненттері
    «board frame»-де салынады (−90° Y бұрылған топ: X = корпус Z, Z = платадан шығу бағыты).
16. **Екі режим.** `pcStore.mode`: `story` (StoryCamera + timeline) / `explore` (ExploreCamera + OrbitControls).
    `pcRig` әр кадрда тиісті көзден толтырылады — бөлшектер тек pcRig-ті оқиды. Камера ауысқанда
    `cameraHandoff.target` арқылы секірусіз өтеді; explore кезінде бет scroll-ы құлыпталады.
17. **Highlight/dim.** `PCPart` материалдардың бастапқы түсін сақтап, белсенді бөлшекке emissive tint,
    қалғанына түс/envMap көбейткішін қолданады (тек өзгеріс кезінде). Ортақ материалдар `userData.shared = true`.
18. **Көлеңкелер on-demand.** `QualityController` `shadowMap.autoUpdate = false` қояды; көлеңке түсіретін объектілері
    қозғалатын сахна `gl.shadowMap.needsUpdate = true` қоюы керек (DeskScene: `ShadowSync`).

32. **Виртуалды тәжірибелер.** `src/labs/Experiments/` — әр тәжірибе бір модуль: тұрақтылар (шынайы типтік мәндер), таза модель функциялары, `conclusion()` (locale кілті + params) және `questions()`/`exercise()`. `quiz.ts` сұрақтарды `Exercise<QuizWork>`-ке айналдырады (бір сұрақ — бір ереже, id `experiment:<id>`). `index.ts` — `EXPERIMENT_IDS` реестрі (`data/labs/exercises.ts` пен бет ортақ қолданады). UI `pages/Labs/ExperimentLab/`: `ExperimentLabPage` (`React.lazy` картасы — әр тәжірибе жеке chunk), `parts.tsx` (Slider, Segmented, Stat, LineChart, `ExperimentFrame`: кіріспе → интерактив → қорытынды → симуляция белгісі → Quiz), `Quiz.tsx`. Анимациялар `useReducedMotion`-ды тексереді; әр кадрда тек анимацияланатын бөлік (мыс. `Lanes`) re-render болады.

33. **Прогресс және жетістіктер.** `services/progress/` — React-сыз, Node тесттерімен. `catalog.ts` — 39 тапсырманың таза деректері (id, зертхана, маршрут, locale кілттері, maxScore, оқу реті); лаб логикасын импорттамайды, сондықтан store/toaster негізгі бандлға лаб кодын әкелмейді; тест оны нақты `Exercise`-термен салыстырады. Snapshot v3: `attempts` (хронологиялық, ≤ 1000) + `exercises[id]` (best, attempts, completedAt, completedOnAttempt, firstAt, lastAt — тарих қысқарса да сақталады) + `achievements[id] = unlockedAt` + `meta`. Күй: орындалды = кемінде бір `completed` әрекет; орындалуда = әрекет бар, бірақ орындалмаған. Барлық сандар (`summarize`, `recommendNext`, `evaluateAchievements`) snapshot-тан есептеледі — бөлек санауыш жоқ. `ProgressRepository` (`load/save/clear/watch`, sync не Promise) — store тек осыны біледі; localStorage іске асыруы zustand-persist конвертін `{version, state}` сақтайды (ескі деректер сол кілтте жаңартылады), жаңартудан бұрын `:backup-v<n>`, бұзылған мәтін `:corrupt`. Supabase/PostgreSQL үшін сол интерфейсті сервер API арқылы іске асыру жеткілікті (кілт браузерде болмайды). Жетістік хабарламасы — `components/achievements/AchievementToaster` (AppShell-де, store-дағы `toasts` кезегі). Импорт = merge (id бойынша dedupe, ештеңе өшпейді); тазалау `legacyImported` белгісін қалдырады.

34. **Оптимизация және ассет өмірі.** `lib/three/modelUrls.ts` — `file.glb#node` және `_lod1` файлдары (таза функциялар). `lib/three/modelAssets.ts` — `useModelFile` (жүктеу + retain), `fitModel`, `cloneSource`, `useSceneTextures`, `useRetainedEnvironment`. `lib/three/assetCache.ts` — `retainAsset(key, dispose)`: сахна ұстап тұрғанша кэште, ешкім қолданбаса 2 с кейін geometry/material/texture/ImageBitmap dispose және `useGLTF/useTexture/useEnvironment.clear`; `capTextureSize` — Low-да ≤ 512 px (түпнұсқа сақталады, сапа көтерілсе қайтады). `ModelLoader`: Low → тек `_lod1`; әйтпесе толық + `_lod1`, экрандағы биіктік < 90 px (High/Ultra < 55 px) болса light деңгей көрінеді (гистерезис 15 %); `deferDetail` — алдымен light, сахна дайын болған соң толық файл фонда. Instancing әдейі тек көп дана бар жерде (Room рейкалары): 2–4 данаға шейдер варианттары мен буфер жаңарту қымбатқа түседі. Сөздіктер: `kk` бандлда, `ru/en` — `loadLanguage()` арқылы dynamic import; `main.tsx` сақталған тілді бірінші кадрға дейін жүктейді. Өлшеу: `scripts/perf-measure.mjs`.

35. **V2 ассет пайплайны (Blender).** Модельге тән барлық нәрсе JSON конфигте (`scripts/blender/configs/`), Python скрипті жалпы (`pipeline.py`). Бөлшектер = GLB-дегі атаулы node-тар (id snake_case), teardown деректері node extras-та: `part`, `labelKey` (locale кілті), `explode` (метр, glTF осьтері), `order`; React-та координаттар жазылмайды. Порттар = бос node `port_<type>_<n>` бөлшегінің ішінде, +Z — штекер бағыты, extras `{port, dir, labelKey}`; порт түрлерінің тізімі `DEVICE_CATALOG.md`-де (V2-6 кабельдері осы маркерлерге жабысады). Модельдер нақты метрлік өлшемде, жерде, бөлшек origin-і өз ортасында. Аралық файлдар `assets-src/blender/` (git-ке кірмейді); веб-оңтайландыру бөлшектерді біріктірмеуі тиіс. Өнім варианттары жеке GLB немесе `<base>.glb#<product-id>` node.

36. **Тема.**
    - `lib/theme`: режим `dark | light | system` (settings, әдепкі dark). Шешілген тема `<html data-theme>`-де: main.tsx бірінші кадрға дейін қояды, AppShell жаңартады.
    - CSS: барлық түс `tokens.css`-те; жарық тема `:root[data-theme='light']` ішінде, сол атаулармен.
    - Мөлдір түстер арна токендері арқылы жазылады: `rgb(var(--ink-rgb) / a)` (сызық/толтыру), `rgb(var(--panel-rgb) / a)` (шыны панель), `rgb(var(--shadow-rgb) / a)`.
    - Модуль CSS-те тікелей түс тек мағыналық реңк үшін қалады (success/warning тинттері).
    - 3D: `useScenePalette()` → `EnvironmentLighting` (градиент фон, тұман, exposure, IBL) және `Room`.
    - Контраст тестпен тексеріледі (`test:visual`).
37. **Көрнекі сапа деңгейлері.**
    - `QualityPreset` өрістері:
      - `antialias` — контекст MSAA, барлық деңгейде;
      - `multisampling` + `smaa` — post chain, High/Ultra;
      - `anisotropy` — жүктелгенде қолданылады, GPU шегіне three өзі қысады;
      - `hdTextures`.
    - 2K close-up: `<name>_hd.glb` негізгі файлмен бірдей тазаланған геометриядан жасалады. Сондықтан `HdTextures` mesh пен материалдарды ретімен сәйкестендіріп, тек текстура слоттарын ауыстырады; сәйкес келмесе ештеңе өзгермейді.
    - Модель экранда > 380 px болғанда HD бір рет сұралады; retain/dispose ортақ кэш арқылы.

38. **Әр өнімге жеке модель (V2-2a).**
    - Файлдар: `products/<id>.glb` + `_lod1` + `_lod2`, каталогта `P(id)`.
    - Модель конвенциясы: нақты метр, жерде (min y = 0), XZ бойынша ортада, алды +Z-ке (пайдаланушыға) қарайды. Тышқанның батырмалары −Z-ке, үстелдің үсті 0.75 м.
    - Арнайы материалдар: `Screen` (тұсқағаз, қуат), `DeskTop` (үстел әрлеуі).
    - `ModelLoader` деңгейді `modelLevels(file, lodBias)` арқылы таңдайды. Setup Studio мұндай модельдерді `fit`-сіз қояды; ескі ортақ модельдер (`hardware/*`) бұрынғыдай fit + stretch-пен.
    - Конфиг → Blender → `assets-src/blender/products/` → `assets:optimize` → `public/assets/models/products/` → `assets:validate`.

39. **ПК бөлшектері мен маркерлер (V2-2b).**
    - ПК бөлшектерінің өнім модельдері «канондық күйде» болады (Blender осьтері: компонент жағы +Z, плата жоғары +X / I/O +Y, GPU PCIe жиегінде, кулер табаны −Z; толығы `scripts/blender/README.md`).
    - `HardwareParts.tsx` оларды бір ортақ бұрылыспен (Z бойынша 90°) платаға қояды. `ModelFit.pin` модельдің бір жағын анкерге қояды (мысалы, плата артқы беті, GPU кронштейні), ал `size`-сыз модель өз масштабында қалады.
    - Корпус моделі `Chassis.tsx`-те tray бетімен туралады (`TRAY_FACE_X`); шыны процедуралық. Модельсіз өнімдер (Kraken, HDD) бұрынғы ортақ/процедуралық жолмен.
    - Басты бет пен Assembly Lab бір жинақты көрсетеді: `lib/studio/showcase.ts`.
    - Маркерлер — GLB ішіндегі бос node-тар, extras: `port` (түрі), `dir` (қосылу бағыты), `labelKey` (`ports.*`). Атаулары `port_<type>_<n>`; `slot_*`, `header_*`, `socket_*`, `mount_*` өз атымен. V2-6 кабельдері мен V2-7 симуляциясы осыларды оқиды; React-та координата қатаң жазылмайды.
    - Текстура бюджеті (RGBA + mip) деңгейге 32/16/4 MB — `optimize-assets.mjs` ең үлкенін екі есе кішірейтеді, `assets:validate` тексереді.

40. **Үлкен 3D зертхана (V2-3).**
    - `/lab` = `pages/Lab` + `scenes/LabSpace`. Аймақтар — деректер (`data/lab/zones.ts`), логика таза функциялар (`lib/lab/navigation.ts`, тестпен), күй `labStore` (focus, hovered, flightToken, nudge).
    - `labCameraPose` — камера орны миникарта үшін (useFrame жазады, React re-render жоқ).
    - Әр аймақ `ZoneStage`: платформа + canvas-тақтайша (тіл/тема бойынша) + мазмұн. Мазмұн `detail: 'preview' | 'full'` — тек `focus` аймақ толық; Suspense fallback = preview, сондықтан жүктеу кезінде аймақ бос қалмайды.
    - Жүктеу саясаты `loadPlan()`: толық — тек таңдалған аймақ; көршілер — `fetch(priority: low)` HTTP кэшке (useGLTF кэшіне емес, жадта ұсталмайды); кетсе — unmount → `assetCache` босатады.
    - Жарық: көлеңке картасы static (autoUpdate=false), аймақ ауысқанда 6 с жаңарады; castShadow тұрақты (ауыстырсақ шейдерлер қайта компиляцияланады).
    - Камера: ease-in-out ұшу + доға, OrbitControls (pan жоқ), қашықтық шектері тек ұшу аяқталғанда қолданылады, target залдан шықпайды (`clampToHall`).

41. **Зертхана құрылғылары (V2-4a).**
    - Деректер `data/devices/devices.ts` (60 id, DEVICE_CATALOG), мәтін кілттерін `deviceKey()` шешеді. Анатомияда бар құрылғы оның `anatomy.items.*` мәтіні мен `anatomy:<id>` тестін қолданады, сондықтан прогресте қайталанбайды. Жаңа тесттер `device:<id>` (`deviceQuiz.ts`, прогресс `DEVICE_TASKS`).
    - 3D: `DeviceModel` — бір тізілім (өнім GLB, процедуралық немесе анатомия placeholder), көрмеде `POSE` арқылы үлкейтіліп, тұғырда еңкейеді. `Exhibit.tsx` құрылғыларды қатарларға тізеді; әр `DeviceSpot` → `labStore.openDevice(id)` → аймаққа ұшу + `DevicePanel`.
    - 360° көрсеткіш `DeviceViewer3D` өз canvas-ында жұмыс істейді: `Bounds` моделді өзі кадрлайды, жарығы процедуралық. Модель файлдары `useGLTF` кэшін ортақ пайдаланады.
    - Шолуда әр аймақтың тек `hero` құрылғысы ең жеңіл деңгейде, тұғырсыз көрінеді.
    - `ChoiceQuiz` — a/b/c тест компоненті, анатомия мен зертханаға ортақ.
    - V2-4b: барлық 60 құрылғы толық (`full` белгісі алынды); `OWN_QUIZ_DEVICES` = анатомиясыз 43 құрылғы = прогресс `DEVICE_TASKS`. Шолуда ауыр процедуралық модельдің жеңіл нұсқасы болуы мүмкін (`RackShell`). Тур күйін (`focusZone(null)`) canvas сыртындағы `LabPage` тазалайды — R3F түбірі кеш жабылады.

42. **Бөлшектеу (V2-5a).**
    - `lib/teardown/timeline.ts` — таза функциялар: `partProgress(s, i, n)` (бөлшектер ретімен), `stepValue/stepAt/activeIndex`, `ease`, `pathPoint` (сынық сызық бойымен бірқалыпты), `route` (ұядан шығу → көтерілу → үстелге қою), `approach` (reduced-motion → секіру).
    - `data/teardown/teardowns.ts` — құрылғылар мен бөлшектер реті, `teardownOfDevice` (case → system_unit, laptop → laptop). Мәтіндер `teardown.<id>.parts.<part>.{name,text}`.
    - `scenes/Teardown/rig.ts` — бір көріністің өзгермелі күйі (`shown`, `goal`, `rate`, `selected`) + DOM-ға `useSyncExternalStore` арқылы snapshot (тек қадам/таңдау өзгергенде re-render). `TeardownStage` ішіндегі `Driver` әр кадрда `shown`-ды `goal`-ға жылжытады.
    - Жүйелік блок `Chassis` + `HardwarePart` (V2-2b өнімдері) арқылы жиналады; ортақ `pcRig`-ті `RigSync` басқарады (шыны жасырын, кабельдер 2-қадамнан жоқ). Басқа беттердің `PcRigController`-і `pcRig`-ті әр кадрда қайта жазатындықтан, қалпына келтіру керек емес; зертхана canvas-ы бұл кезде кідіреді.
    - V2-5b: `SubMotion` (бөлшектің бөліктері әрқайсысы өз жолымен — `PartContext` арқылы бөлшектің progress-ін оқиды, белгіні біреуі алып жүреді), `rig.print` (принтер демо-басуы; `Driver` алға жылжытады, `PrintFollow` бас/үстел/гантриді жылжытады және бөлшек шыққанда ығысуды сөндіреді).
    - Тапсырма: `data/teardown/teardownQuiz.ts` — `TEARDOWNS[id].quiz` үш бөлшегі, әрқайсысына сол құрылғының басқа екі бөлшегінің `does` жолы (детерминистік, дұрыс жауап орны 1/0/2), `makeChoiceQuiz` → `teardown:<id>`; UI — `components/quiz/QuizForm` (ChoiceQuiz та соны қолданады).
    - Жаңа бөлшектеу қосу: `TEARDOWNS`-қа рет, `teardown.<id>` мәтіндері, `scenes/Teardown/<Device>Teardown.tsx`-те әр бөлшекке `PartMotion` (at, rot, path, turn, label), `TeardownStage.SCENES/SHOTS`-қа жазу.

43. **Жалғау зертханасы (V2-6).**
    - Логика `labs/ConnectLab` (таза, тесті бар):
      - `scenarios.ts` — порттар `{owner}.{kind}_{n}`, кабельдер, бос ұштар;
      - `plugs.ts` — `plugProblem` / `tryPlug`: shape → igpu → wan → occupied → sameDevice, қате `mistakes`-ке жазылады;
      - `wifi.ts` — желілер, `join`, `dhcpLease`;
      - `tasks.ts` — 3 `Exercise`, care ережесі partial.
    - Күй: `store/connectLabStore.ts` (zustand) — plugs, wifi, carrying/dragging, хабарлама, әр тапсырманың attempt/report-ы.
    - 3D: `scenes/ConnectLab`.
      - `anchors.ts` — ұялардың әлемдік орны мен шығу бағыты (mutable, re-render жоқ).
      - `PcScene` маркерлерді `MarkerScan` арқылы өнім модельдерінен оқиды: `HardwarePart` топтарын traverse етеді, жарты секунд сайын жаңартады (LOD ауысуы).
      - `NetScene` порттарды қолмен тіркейді.
      - `ConnectKit`: `PortHotspots` (Html батырмалар), `Cable` (CatmullRom → TubeGeometry, ұш қозғалғанда ғана қайта құрылады), `DragController` (камераға перпендикуляр жазықтық; жібергенде экрандағы ең жақын ұя).
    - Прогресс: `CONNECT_TASKS`; `connect:pc` → assembly, қалғандары → network (TASKS ретінде зертханалар тәртібі сақталады).

44. **Себеп-салдар симуляциясы (V2-7).**
    - `labs/SystemSim` (таза, тесті бар):
      - `build.ts` — таңдаулар, қуат пен салқындату тұрақтылары, `GOOD_BUILD`;
      - `sim.ts` — `post()`: noRam → noVideo / wrongPort (`videoPath`: карта бар болса оның шығысы, жоқ болса iGPU) → noBoot → desktop + жүктелу уақыты; `runLoad()`: бірінші ретті жылу моделі, 95 °C-та троттлинг (ең төменгі қуат = idle × 2), 105 °C-та өшу, жүйе қуаты PSU-дан асса OPP; `gameFps`, `check`;
      - `faults.ts` — 6 ақау, `FIX_EXERCISE` (diagnosis / fixed / minimal).
    - UI: `pages/Labs/SystemSim`.
      - `useSimRunner` — фазалар: off → post → result | booting → desktop → load → shutdown; таймерлер күй жаңартуынан тыс.
      - `Monitor` (DOM-экран), `Instruments` (термометр, қуат, SVG график, ескерту, «Не болды?»).
      - Дыбыс: `lib/audio/sfx` `playBeepCode` / `playAlarm`, `settingsStore.soundEnabled` бойынша.
    - Құрам режим/ақау кілтімен сақталады (`edits.key`), effect-сіз; бөлшек ауысса компьютер өшеді.

## Legacy → жаңа архитектураға көшу жоспары

| Legacy (`legacy/js/…`) | Жаңа орын | Фаза |
|---|---|---|
| `scene.js` STOPS (scroll саяхат, 14 аялдама) | `scenes/DeskScene` + GSAP ScrollTrigger + `CAMERA_STATES` | 2 |
| `scene.js` процедуралық үстел/монитор/корпус | GLB модельдер (`ModelLoader`) | 2 |
| `studio.js` CAT каталогы | `data/hardware/catalog.ts` (`HardwareItem` схемасы) | 4 |
| `studio.js` compatWarnings | `services/compatibility` (сокет/PSU/GPU ұзындығы/RAM/салқындату) | 4 |
| `studio.js` жинау анимациясы (17 бөлік) | `SetupAssemblyTimeline` (GSAP) | 5 |
| `studio.js` recommend() + chat | `services/ai` жергілікті детерминистік recommender + backend abstraction | 6 |
| `labs.js` желі/алгоритм/логика/тәжірибе | `labs/*` + `services/grading` | 7–8 |
| `labs.js` vlab_progress_v1 | `STORAGE_KEYS.progress` (migrate арқылы импорт) | 8 |
| `thumbs.js` canvas thumbnails | 3D рендерленген thumbnail-дар | 4 |

18. **Компьютер анатомиясы.** Мазмұн екі қабат: `data/hardware/anatomy.ts` (id, санат, spec кілттері, дұрыс жауаптар) және
    `locales/*.json` → `anatomy.items.<id>` (барлық мәтін). 3D орналасу бөлек (`scenes/HardwareExplorer/layout.ts`).
    Сахна hero үстелін, бөлмесін және GLB кэшін қайта қолданады; тек белсенді санат mount болады, әр құрылғының өз
    Suspense-і бар (санат ауысқанда сахна жыпылықтамайды). Камера overlay-лер босатқан аумақты есептеп (`freeArea`)
    қашықтық пен `setViewOffset`-ті таңдайды. Hotspot-тар (drei Html) сахна `ready` болғаннан кейін ғана mount болады.
    3D-сіз тізім режимі сол компоненттерді (`AnatomyDetails`, `AnatomyQuiz`) қолданады.

19. **Setup Studio.** Үш қабат: деректер (`data/hardware/catalog.ts`, `data/studio/options.ts`) → бизнес-логика
    (`lib/studio/`: `compatibility`, `pricing`, `power`, `recommend`, `build`) → күй (`store/studioStore.ts`, persist
    `vil3d:setup` v1, migrate + merge жоғалған id-ларды тазалайды) → UI (`pages/SetupStudio`, тек оқиды және action шақырады)
    және 3D (`scenes/SetupStudio`, store-дан оқиды). Үйлесімділік ережесі тек қажетті бөлшектер таңдалғанда іске қосылады;
    хабарлар `studio.compat.<code>` кілттерінде параметрлермен. Өнім модельдері `modelPath` + `modelSize` (нақты өлшем)
    арқылы; бояу `lib/three/finish.ts` — тек албедо ауысады, normal/roughness/metalness карталары сақталады.

20. **Құрастыру киносы.** `assembly/steps.ts` жинақтан қадамдарды сүзеді; бір GSAP `SetupAssemblyTimeline` тек `assemblyRig`-ті өзгертеді. `SetupItems` статикалық және анимацияланатын сахнаға ортақ. `PCCase` сыртқы driver (`rig="external"`) қабылдайды; `PCPart` орнатуда шынайы масштабпен side glass жағынан келеді. `AssemblyScene` камера/жарық/көлеңкелерді жүргізеді. `assemblyStore` — ephemeral phase/view/replay/skip күйі. Модель ready сигналынсыз timeline басталмайды; cleanup оны тоқтатады. UI прогресі пайызға дейін дөңгелектеніп, әр кадрдағы React рендерден құтылады.

21. **Жергілікті чат.** `lib/studio/assistant.ts` — жаңа `services/ai` жүйесінің үйлесімділік қабаты. UI `SetupAssistant` portal арқылы bottom-sheet ата-анасынан тыс fixed терезе ретінде көрсетіледі. `studioStore.applySuggestion` ID-ларды тазартады, түстерді/мақсатты/бюджетті және 3D-ны жаңартады. Сервер өшік болса, сұрау жергілікті өңделеді.

22. **AI көмекші.** `src/services/ai/` UI-дан бөлек: `parse` (жергілікті NLU) → `AssistantRequest` → `engine.suggestSetup`
    (`lib/studio/recommend` + талап сүзгілері + үйлесімділік) → `explain`. `client.askAssistant` алдымен `/api/ai/recommend`-ке
    жүгінеді; LLM тек құрылымды сұрау мен каталог ID-ларын қайтарады, `validate.sanitizeLlmAnswer` серверде де, браузерде де
    тексереді, соңғы жинақты бәрібір детерминистік engine құрады. Кілт тек `server/ai-server.ts` оқитын `.env`-те.
    Кез келген ақауда (кілт жоқ, offline, timeout, жарамсыз жауап) — жергілікті нәтиже, 60 с серверді күтпейді.

23. **Оқу зертханалары.** `src/labs/*` — UI-дан тәуелсіз есептеу/тексеру. Algorithm trace immutable, logic графы truth table арқылы, network BFS/IPv4 арқылы тексеріледі. `pages/Labs/` параметрлік UI және SVG/CSS визуалдары; PC assembly лицензияланған 3D кэшін пайдаланады. Барлық мәтін — `locales/*.json`.

24. **Тапсырма/прогресс.** (0.16-дан бастап #33 қара.) Тапсырмалар каталогы — `services/progress/catalog.ts`; беттер `pages/Tasks/` және `pages/Progress/`.

25. **2D/3D chunk шекарасы.** Router беттерді lazy жүктейді, global LoaderOverlay тек scene expected болса mount болады. Rolldown codeSplitting ортақ dependency-лерді Three/r3f тобына recursive қоспайды. Соның арқасында 2D беті 3D asset/chunk жүктемейді; 3D route SceneCanvas пен loader-ін өзі жүктейді.

26. **Network Lab.** `src/labs/NetworkLab/` — React-сыз таза логика: `types` (Device/Link/Network, PingResult), `devices` (порт спецификациясы, рөлдер), `ipv4`, `topology` (immutable өңдеу, `canConnect`, L2 жеткізу: хост пен router порты кадрды өткізбейді, switch/AP өткізеді), `ping` (сұраныс → gateway → router egress → жеткізу; кері жауап мақсаттың өз баптауымен), `diagnose` (статикалық қателер), `tasks` (4 тапсырма = `Exercise<Network>`). UI `pages/Labs/NetworkLab/`: `useNetworkLab` (күй, тек логиканы шақырады), `Workspace` (SVG 1000×620, pointer capture, жылдам басу үшін ref), `Palette` (portal ghost), `ConfigPanel`, `PingBar`, `TaskPanel`, `geometry` (тек сурет: порт жағы, кабель қисығы, пакет жолы). Координаттар бағалауға қатыспайды.
27. **Бағалау сервисі.** `src/services/grading/` кез келген зертханаға ортақ: `Exercise<Work>` (id, type, instructions, expectedResult, maxScore, hints, gradingRules) + `Attempt` (уақыт, кеңес, тексерулер, қателер). `grade()` ережелерді орындайды (лақтырған ереже — сәтсіз), ұпайды maxScore-ға масштабтайды, айыппұлды шектейді. Барлық мәтін — locale кілті + params (`Feedback.detail` ішкі себеп үшін). Көп таңдаулы сұрақтар — `makeChoiceQuiz` (тәжірибелер, Hardware Explorer). UI: `components/grading/GradeReportCard` (`compact` — сұрақтар өз түсіндірмесін көрсеткенде).
28. **Зертханалар хабы.** `pages/Labs/modules.ts` — модуль реестрі (status: ready/beta/soon, маршрут, түс, өлшем); `soon` карточка сілтеме емес. `ModulePreview` — WebGL-сіз қабатты SVG, tilt CSS айнымалыларымен (re-render жоқ).
29. **Algorithm Lab.** `src/labs/AlgorithmLab/` — алгоритмдер кәдімгі цикл ретінде жазылған, `recorder.ts` әр `push`-та массивті/стекті/есептегіштерді көшіріп, өзгерген айнымалыларды және көрсеткіштерді (`pointerVars`) есептейді. Нәтиже — `Run { steps, result }`; UI тек индексті жылжытады (`usePlayer`), сондықтан артқа қадам тегін. Элементтердің тұрақты `id`-і бар: `ArrayView` бағандарды id бойынша рендерлеп, `left` CSS transition арқылы ауыстырады. Псевдокод пен түсініктемелер — locale кілттері (`algorithms.code.<id>.l<n>`, `algorithms.notes.<id>.<event>`). `quizzes.ts` — seed бойынша қайталанатын нұсқалар (mulberry32) + `Exercise<QuizWork>` → `services/grading`.
30. **Logic Lab.** `src/labs/LogicLab/` — схема = `nodes` (input/gate/output) + `wires` (from → to.port). Әр кірісте бір ғана сым (жаңасы ескісін ауыстырады); цикл рұқсат, бірақ `cycleNodes` (Tarjan SCC) оны тауып, мәнін `null` етеді. `evaluate` мәндерді сұраныс бойынша есептейді (ашық кіріс → `null`). Бағалау `combinations()` × `evaluate()` арқылы мінез-құлықты салыстырады, тек Y-ке әсер ететін гейттердің толықтығын тексереді. UI `pages/Labs/LogicLab/`: `GateShape` (ANSI жолдары), `geometry` (пиндер, сым қисығы), `Board` (pointer capture, draft ref), `TruthTable`, `SidePanel`. Жарқырау сүзгісі `userSpaceOnUse` — көлденең сымның биіктігі 0 болғанда да көрінеді.
31. **PC Assembly Lab.** Логика `src/labs/AssemblyLab/` (steps — тәуелділік графы мен мақсат слоттары; session — `place()` таза функциясы; exercise). Күй `store/assemblyLabStore.ts` (сахна мен панельге ортақ; бағалау мен progress жазу action ішінде). 3D `scenes/AssemblyLab/`: `layout.ts` — барлық әлем координаттары, тақтаның үш позасы (тақта → төсеніш → корпус), `targetPosition()`; `Draggable` — камераға қараған мақсат жазықтығында сүйреу, өз raycast-ы + window тыңдаушылары (R3F pointer capture-қа тәуелсіз), босатқанда курсор нүктесі бойынша `resolveTarget`; орнатылған бөлшек 420 мс ішінде орнына отырып, «егіз» нұсқасына (PCCase бөлігі не тақта баласы) береді; `Guides` — тұрақты mount болған елес пен жарқыл (Html түбірлері рендер кезінде алынбайды); `LabRig` — `pcRig` (жасырын бөліктер, кабельдер, қосылу анимациясы) мен on-demand көлеңке. Дыбыс `lib/audio/sfx.ts` (WebAudio, `settingsStore.soundEnabled`).
