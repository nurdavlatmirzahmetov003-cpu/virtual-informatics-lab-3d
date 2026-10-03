# PROJECT STATE — Virtual Informatics Lab 3D

Жаңартылды: 2026-10-03
**Ағымдағы фаза: 2 (Кинематографиялық Hero) — 2.1 бөлімі аяқталды, 2.2 келесі**

> Жаңа сессия басталғанда: алдымен осы файлды, `ROADMAP.md`, `TODO.md`, `ARCHITECTURE.md` оқы, содан кейін төмендегі `NEXT_ACTION`-нан жалғастыр. Жобаны нөлден бастама.

## Күйі
Басты бетте толық экранды 3D үстел сахнасы және scroll-пен басқарылатын 5 chapter-лік кино-сапар жұмыс істейді. Барлық құрылғылар — шынайыға жақын, бірақ уақытша процедуралық модельдер (TODO.md `[PLACEHOLDER]`). ПК ішіне кіру мен exploded view әлі жоқ (әдейі — келесі сессия). `npm run typecheck`, `npm run lint`, `npm run build` қатесіз.

## Аяқталған модульдер
- **Фаза 0–1:** аудит, legacy көшірмесі, Vite/React/TS/R3F негізі, router, Zustand, i18n (kk/ru/en), сапа контроллері, SceneCanvas, ModelLoader, LoaderOverlay, WebGL fallback.
- **Фаза 2.1 — үстел сахнасы (`src/scenes/DeskScene/`):**
  - Модельдер: үстел (Poly Haven емен PBR + болат рама), мата коврик (тігіс жиегімен), 27″ монитор (тұғыр, артқы корпус, эмиссивті тұсқағаз, bias light), TKL пернетақта (87 мүсінделген keycap, InstancedMesh, алюминий рама, RGB), эргономикалық тышқан (деформацияланған қабық, UV сызықтар, дөңгелек, бүйір батырмалар), ATX корпус (шыңдалған шыны + frit, торлы алдыңғы панель, 4 айналатын ARGB желдеткіш, аналық плата, мұнара кулер, 2 RAM, GPU, PSU shroud, кабельдер), құлаққап + тұғыр, 2 колонка, бөлме (бетон еден, емен slat панель).
  - Жарық: Poly Haven `studio_small_09` HDRI (IBL), key (көлеңкелі) / fill / rim, Lightformer жолақтар, монитор RectAreaLight, bias light, ПК ішкі жарығы; Neutral tone mapping; High/Ultra: bloom + DOF + vignette.
  - Камера: аталған күйлер HOME_WIDE, MONITOR, KEYBOARD, MOUSE, PC_EXTERIOR (баптаған); `StoryCamera` — timeline кадры + сүйреп орбита + екі рет басу reset + портрет view offset.
  - Scroll: бір GSAP ScrollTrigger timeline → Chapter 1 Сетап → 2 Монитор (бұрылады) → 3 Пернетақта (көтеріледі) → 4 Тышқан (360° айналады) → 5 Жүйелік блок (RGB күшейеді).
  - UI: hero (тақырып/подзаголовок/«Зертхананы бастау»), 4 ақпарат панелі (қазақша, сипаттамалар + факт), chapter навигациясы, прогресс сызығы, мобильдіде bottom sheet, outro бөлімі.
  - Жүктеу: «3D зертхана жүктелуде» + пайыз + категория; сахна толық дайын болғанша көрінеді.

## Жартылай аяқталған
- Модельдер процедуралық (GLB жоқ) — §50 бойынша Hero әлі «аяқталған» емес.
- Интерьер камера күйлері (PC_INTERIOR…PSU) — бірінші жуықтау.
- PCCase ішінде SSD жоқ, PSU shroud астында жасырын.
- `ModelLoader` нақты GLB-мен тексерілмеген.

## Тексерілгені (in-app Chromium)
- Desktop 1280×720, High: 5 chapter-дің барлығы скриншотпен тексерілді (кадр, панель, навигация).
- Low режимі: contact shadows, мөлдір шыны fallback, pointLight fallback — рендерленеді.
- Мобильді 375×812: горизонталь скролл жоқ, bottom sheet, объект панель үстінде.
- kk / ru аудармалары.
- `vite preview` (production build): консольде қате жоқ, тек `THREE.Clock` ескертуі (R3F ішінен).

## Осы сессияда өзгерген файлдар
- Жаңа: `src/scenes/DeskScene/{DeskScene.tsx,layout.ts,chapters.ts,storyRig.ts,useStoryTimeline.ts,StoryCamera.tsx}`, `src/scenes/DeskScene/models/{Desk,DeskMat,Monitor,Keyboard,Mouse,PCCase,Fan,Headset,Speakers,Room}.tsx`, `src/lib/three/{geometry,proceduralTextures,sceneFocus}.ts`, `src/hooks/useDisposable.ts`, `src/store/{storyStore,sceneStatusStore}.ts`, `src/pages/Home/{StoryOverlay.tsx,StoryOverlay.module.css}`, `public/assets/hdr/studio_small_09_1k.hdr`
- Өзгерген: `src/pages/Home/{HomePage.tsx,HomePage.module.css}`, `src/components/3d/{SceneCanvas.tsx,SceneCanvas.module.css,PostEffects.tsx,EnvironmentLighting.tsx}`, `src/components/ui/LoaderOverlay.tsx`, `src/lib/quality/presets.ts`, `src/data/camera/cameraStates.ts`, `src/locales/{kk,ru,en}.json`
- Жойылған: `src/scenes/FoundationScene/`
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, ASSET_MANIFEST, CHANGELOG, KNOWN_ISSUES, ARCHITECTURE

## Іске қосу
```bash
cd D:\informatics-lab
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run lint
npm run build
npm run preview      # http://localhost:4173
```

## Ағымдағы багтар
`KNOWN_ISSUES.md`: модельдер уақытша; three chunk ~293 KB gzip; жасырын қойындыда бірінші кадр кешігеді; кэштен жүктегенде loader 0% көрсетуі мүмкін; dev-те жаңа тәуелділіктен кейін «504 Outdated Optimize Dep» (қайта жүктеу); Firefox/Safari/touch тексерілмеген.

## Жетіспейтін ассеттер
- GLB модельдер: монитор, пернетақта, тышқан, құлаққап, колонкалар, корпус, аналық плата, CPU, кулер, RAM, GPU, SSD (NVMe), PSU, желдеткіштер, үстел.
- Дыбыс эффектілері. Каталог деректері (Фаза 4).

## Маңызды архитектуралық шешімдер
1. Бір GSAP timeline тек `storyRig`-ті өзгертеді; 3D `useFrame`-де оқиды (scroll кезінде React рендер жоқ). Sticky stage — scroll hijacking жоқ.
2. Камера кадрлары тек `CAMERA_STATES`-те; объект орындары тек `DeskScene/layout.ts`-те.
3. `PCCase` ішкі бөліктері аталған топтар (`motherboard`, `ram`, `cooler`, `gpu`, `psu-shroud`, `cables`) — exploded view осыларды жылжытады.
4. Сапа preset-тері DOF / transmission / RectAreaLight-ты басқарады (Low-да бәрі арзан fallback).
5. Loader `sceneStatusStore` арқылы сахнаның Suspense-і шешілгенше ұсталады.
6. Фаза 0–1 шешімдері күшінде (ARCHITECTURE.md).

NEXT_ACTION: Фаза 2.2 — (1) `PCCase`-ке NVMe SSD және көрінетін PSU қосу; (2) `chapters.ts`-ке Chapter 6 «ПК ішіне кіру» (шыны панель `storyRig.glassOpen` арқылы ашылады/мөлдірленеді, ішкі жарық, камера PC_INTERIOR) және Chapter 7 «Exploded view» (motherboard/cpu/cooler/ram/gpu/ssd/psu/fans топтарын timeline-мен таза позицияларға жылжыту) қосу; (3) белсенді бөлшекті highlight, қалғанын dim, аты + қысқа ақпарат, басқанда толық панель; (4) интерьер CAMERA_STATES-ті скриншотпен баптау; (5) осыдан кейін ғана GLB ауыстыру пайплайнын бастау.
