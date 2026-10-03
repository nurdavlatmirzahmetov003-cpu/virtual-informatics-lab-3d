# ARCHITECTURE

## Student exercise core
`lib/labs/assessment.ts` creates bounded results without time penalties. `progressStore` validates/version-persists max 200 attempts; best score per ID powers dashboard. `pcLabStore` owns order, catalog build, selection, errors/hints and boot checks. `PcLabScene` projects pointer rays onto camera-facing planes, captures pointer, snaps near anchor, and uses shared `pcRig` for install motion. Each page owns one canvas; cleanup releases the rig. `useLabText` lazily loads kk/ru/en lab text with the lab chunks.

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
  labs/ NetworkLab/ AlgorithmLab/ LogicLab/ Experiments/  (бос — Фаза 7)
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

23. **Оқу зертханалары.** `lib/labs/{pcAssembly,algorithms,network,logic,experiments,assessment}.ts` — UI-дан тәуелсіз есептеу/тексеру. Algorithm trace immutable, logic графы truth table арқылы, network BFS/IPv4 арқылы тексеріледі. `pages/Labs/` параметрлік UI және SVG/CSS визуалдары; PC assembly лицензияланған 3D кэшін пайдаланады. `useEducationText`/`useLabText` үш тілдегі оқу мәтіндерімен тек модульде жүктеледі.

24. **Тапсырма/прогресс.** `data/labs/exercises.ts` — 40 тұрақты ID және deep link. `progressStore` v2 local persistence, валидация, соңғы 200 әрекет пен lifetime best массиві бөлек; v1 миграциясы ұпайларды тарихтан қалпына келтіреді. `AssignmentsPage` пен `ProgressPage` бір реестрді қолданады; anatomy quiz және барлық lab нәтижесі ортақ Assessment. Орындалу = реестрдегі passed best scores / 40; legacy import бөлек болашақ қадам.

25. **2D/3D chunk шекарасы.** Router беттерді lazy жүктейді, global LoaderOverlay тек scene expected болса mount болады. Rolldown codeSplitting ортақ dependency-лерді Three/r3f тобына recursive қоспайды. Соның арқасында 2D беті 3D asset/chunk жүктемейді; 3D route SceneCanvas пен loader-ін өзі жүктейді.

26. **Network Lab.** `src/labs/NetworkLab/` — React-сыз таза логика: `types` (Device/Link/Network, PingResult), `devices` (порт спецификациясы, рөлдер), `ipv4`, `topology` (immutable өңдеу, `canConnect`, L2 жеткізу: хост пен router порты кадрды өткізбейді, switch/AP өткізеді), `ping` (сұраныс → gateway → router egress → жеткізу; кері жауап мақсаттың өз баптауымен), `diagnose` (статикалық қателер), `tasks` (4 тапсырма = `Exercise<Network>`). UI `pages/Labs/NetworkLab/`: `useNetworkLab` (күй, тек логиканы шақырады), `Workspace` (SVG 1000×620, pointer capture, жылдам басу үшін ref), `Palette` (portal ghost), `ConfigPanel`, `PingBar`, `TaskPanel`, `geometry` (тек сурет: порт жағы, кабель қисығы, пакет жолы). Координаттар бағалауға қатыспайды.
27. **Бағалау сервисі.** `src/services/grading/` кез келген зертханаға ортақ: `Exercise<Work>` (id, type, instructions, expectedResult, maxScore, hints, gradingRules) + `Attempt` (уақыт, кеңес, тексерулер, қателер). `grade()` ережелерді орындайды (лақтырған ереже — сәтсіз), ұпайды maxScore-ға масштабтайды, айыппұлды шектейді. Барлық мәтін — locale кілті + params (`Feedback.detail` ішкі себеп үшін). `toAssessment` progressStore форматына көпір. UI: `components/grading/GradeReportCard`.
28. **Зертханалар хабы.** `pages/Labs/modules.ts` — модуль реестрі (status: ready/beta/soon, маршрут, түс, өлшем); `soon` карточка сілтеме емес. `ModulePreview` — WebGL-сіз қабатты SVG, tilt CSS айнымалыларымен (re-render жоқ).
