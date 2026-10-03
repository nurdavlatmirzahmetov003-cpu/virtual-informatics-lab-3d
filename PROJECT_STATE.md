# PROJECT STATE — Virtual Informatics Lab 3D

Жаңартылды: 2026-10-03
**Ағымдағы фаза: 2 (Кинематографиялық Hero) — 2.1 және 2.2 аяқталды, 2.3 (GLB модельдер) келесі**

> Жаңа сессия басталғанда: алдымен осы файлды, `ROADMAP.md`, `TODO.md`, `ARCHITECTURE.md` оқы, содан кейін төмендегі `NEXT_ACTION`-нан жалғастыр. Жобаны нөлден бастама.

## Күйі
Басты бетте толық scroll-кино жұмыс істейді: 7 chapter (Сетап → Монитор → Пернетақта → Тышқан → Жүйелік блок → Корпустың іші → Бөлшектер/exploded) + 360° режимі (hotspot-тар, бөлшекке жақындау, reset, auto-rotate, жинау/бөлшектеу). Барлық модельдер шынайыға жақын, бірақ уақытша процедуралық (TODO.md `[PLACEHOLDER]`). `npm run typecheck`, `npm run lint`, `npm run build` қатесіз; production build консолінде тек `THREE.Clock` ескертуі (R3F ішінен).

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

## Жартылай аяқталған
- Барлық модельдер процедуралық (GLB жоқ) — §50 бойынша Hero әлі «аяқталған» емес.
- Монитор/пернетақта/тышқанда hotspot/360° жоқ (тек ПК бөлшектері).
- `ModelLoader` нақты GLB-мен тексерілмеген.
- Draw calls ~250–280 (merge жоқ).

## Тексерілгені (in-app Chromium)
- Desktop 1280×720: 7 chapter-дің бәрі скриншотпен; exploded қадамдары (бөлшек ауысуы, highlight/dim); hotspot басу → 360°; тізімнен GPU таңдау → камера ұшуы; reset; «Жинау» (бөлшектер орнына, шыны жабылады); «Сапарға оралу» (scroll орны сақталды: 7156 → 7156).
- Мобильді 375×812: exploded bottom sheet, 360° режимі (иконкалы құралдар тақтасы, төменгі панель), горизонталь скролл жоқ.
- Production `vite preview`: консольде қате жоқ.
- Бенчмарк: `__vil3d.bench()` (dev) — draw calls, үшбұрыштар, мс/кадр.

## Осы сессияда өзгерген файлдар
- Жаңа: `src/scenes/DeskScene/pc/{constants.ts,parts.ts,pcRig.ts,usePcTextures.ts,PCPart.tsx,Hotspot.module.css,PCCase.tsx,Chassis.tsx,Motherboard.tsx,Cpu.tsx,CpuCooler.tsx,RamKit.tsx,Gpu.tsx,NvmeSsd.tsx,Psu.tsx}`, `src/scenes/DeskScene/{ExploreCamera.tsx,ShadowSync.tsx}`, `src/store/pcStore.ts`, `src/pages/Home/{ExploreOverlay.tsx,ExploreOverlay.module.css}`
- Өзгерген: `src/scenes/DeskScene/{DeskScene.tsx,chapters.ts,storyRig.ts,StoryCamera.tsx,useStoryTimeline.ts}`, `src/scenes/DeskScene/models/Fan.tsx`, `src/pages/Home/{HomePage.tsx,StoryOverlay.tsx,StoryOverlay.module.css}`, `src/components/3d/{QualityController.tsx,EnvironmentLighting.tsx}`, `src/lib/quality/presets.ts`, `src/lib/three/{geometry.ts,proceduralTextures.ts}`, `src/data/camera/cameraStates.ts`, `src/locales/{kk,ru,en}.json`
- Жойылған: `src/scenes/DeskScene/models/PCCase.tsx` (→ `pc/PCCase.tsx`)
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, CHANGELOG, KNOWN_ISSUES, ARCHITECTURE

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
Dev консольде: `__vil3d.bench()` — draw calls / үшбұрыш / мс-кадр.

## Ағымдағы багтар
`KNOWN_ISSUES.md`: модельдер уақытша; draw calls ~250–280; three chunk ~293 KB gzip; жасырын қойындыда бірінші кадр кешігеді; dev-те «504 Outdated Optimize Dep» (қайта жүктеу); CPU/SSD exploded кезінде әдейі үлкейтілген; Firefox/Safari/нақты touch тексерілмеген.

## Жетіспейтін ассеттер
- GLB модельдер: үстел, монитор, пернетақта, тышқан, құлаққап, колонкалар, корпус, аналық плата, CPU, кулер, RAM, GPU, NVMe SSD, PSU, желдеткіштер.
- Дыбыс эффектілері. Каталог деректері (Фаза 4).

## Маңызды архитектуралық шешімдер
1. Бір GSAP timeline тек `storyRig`-ті өзгертеді; 3D `useFrame`-де оқиды. Sticky stage — scroll hijacking жоқ.
2. Камера кадрлары `CAMERA_STATES`-те; объект орындары `layout.ts` / `pc/constants.ts` / `pc/parts.ts`-те.
3. Екі камера режимі (`pcStore.mode`): story ↔ explore; `cameraHandoff` арқылы секірусіз ауысу; `pcRig` бөлшектер үшін бір ғана күй көзі.
4. Exploded орындары камера экран кеңістігінде есептеледі — кадр өзгерсе, тор бірге ілеседі.
5. Highlight/dim материал түсін көбейту арқылы (ортақ материалдар `userData.shared`).
6. Көлеңке картасы on-demand (`ShadowSync`); transmission тек Ultra.
7. Фаза 0–2.1 шешімдері күшінде (ARCHITECTURE.md).

NEXT_ACTION: Фаза 2.3 — (1) лицензиясы таза GLB модельдерді табу (Sketchfab CC0/CC-BY, Poly Haven) немесе Blender-де жасау: алдымен монитор, пернетақта, тышқан, корпус, GPU; әрқайсысын ASSET_MANIFEST.md-ге тіркеу; (2) `@gltf-transform/cli` негізінде `scripts/optimize-assets.mjs` (Draco/Meshopt, KTX2, 2K/1K/512) қосу; (3) `models/*` және `pc/*` компоненттерін `ModelLoader`-мен ауыстыру (layout/parts анкерлері мен PCPart орамы сақталады), процедуралық нұсқаны GLB жүктелмесе fallback ретінде қалдыру; (4) статикалық mesh-терді біріктіріп draw calls-ты <150-ге түсіру; (5) §50 қабылдау тізімін тексеріп, Фаза 2-ні жабу.
