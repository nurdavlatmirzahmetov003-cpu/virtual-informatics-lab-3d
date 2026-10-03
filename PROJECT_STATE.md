# PROJECT STATE — Virtual Informatics Lab 3D

Жаңартылды: 2026-10-03
**Ағымдағы фаза: 3 (Hardware Explorer) — 3.1 «Компьютер анатомиясы» аяқталды; 3.2 PC Assembly Lab келесі. Фаза 2: 2.1–2.3 дайын, §50 бойынша финалдық жабу қалды**

> Жаңа сессия басталғанда: алдымен осы файлды, `ROADMAP.md`, `TODO.md`, `ARCHITECTURE.md` оқы, содан кейін төмендегі `NEXT_ACTION`-нан жалғастыр. Жобаны нөлден бастама.

## Күйі
`/explorer` «Компьютер анатомиясы»: 8 сыртқы + 10 ішкі құрылғы 3D-да (hero GLB-лері қайта қолданылды), басқанда камера тегіс жақындайды, қалғаны күңгірттенеді, панельде үш тілде атауы, сипаттамасы, мақсаты, сипаттамалары, үйлесімділігі және 3 сұрақтық тест; 3D-сіз тізім режимі бар. Басты бетте толық scroll-кино жұмыс істейді: 7 chapter + 360° режимі. Перифериялар (монитор, пернетақта, тышқан, құлаққап, колонкалар) және ПК (корпус + 8 бөлшек) енді лицензиясы таза Sketchfab CC BY 4.0 GLB модельдері: оңтайландырылған (Meshopt, WebP 1K), барлығы 6.2 MB (шикі 85 MB). GLB жүктелмесе, бұрынғы процедуралық модель fallback. Авторлар `/credits` бетінде. `npm run typecheck`, `npm run lint`, `npm run build`, `npm run assets:validate` қатесіз; dev консолінде қате жоқ.

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

## Жартылай аяқталған
- Анатомияда 5 құрылғы уақытша процедуралық: микрофон, веб-камера, принтер, HDD, желі картасы (TODO `[PLACEHOLDER]`).
- Тест нәтижелері сақталмайды (Фаза 8).
- Үстел, коврик, бөлме, артқы желдеткіш, құлаққап тұғыры — процедуралық (TODO `[PLACEHOLDER]`).
- Брендтік логотиптер текстураларда қалды (§6).
- Poly Haven `potted_plant_04` және walnut/leather/plaster текстуралары жүктелген, бірақ кодта қолданылмайды.

## Тексерілгені (in-app Chromium)
- **Фаза 3.1:** `/explorer` 1200×700 және 375×812: екі санаттың жалпы көрінісі, тізімнен/hotspot-тан таңдау → камера ұшуы, dim, панель; монитор тесті (2/3 нәтиже, түсіндірмелер); CPU, PSU, HDD, желі картасы, тышқан жақын кадрлары; санат ауыстыру; Esc / «Жабу»; тізім режимі kk/ru/en (18 карточка, тест details ішінде); тіл ауыстырғанда `<title>` пен барлық мәтін ауысады; горизонталь скролл жоқ; консольде қате жоқ. Hero (exploded + highlight) регрессиясыз. `__vil3d.bench()` 1500×875 px: анатомия 71–99 call, 0,20–0,24 млн үшбұрыш, 15–19 мс; hero сол өлшемде 20–25 мс.
- **Фаза 2.3:** GLB-мен 7 chapter скриншотпен (hero, монитор, пернетақта, тышқан, ПК іші, exploded 8 қадам); 360°: бөлшекке ұшу (PSU), «Жинау» (бөлшектер корпус ішіне дұрыс түседі), reset, «Сапарға оралу»; `/credits`; мобильді 375×812 (горизонталь скролл жоқ); консольде қате жоқ. `__vil3d.bench()` бір өту: hero 59 call / 7.8 мс, монитор 46 / 5.9 мс, ПК іші 124 / 10.4 мс, exploded 123 / 10.5 мс.
- Desktop 1280×720: 7 chapter-дің бәрі скриншотпен; exploded қадамдары (бөлшек ауысуы, highlight/dim); hotspot басу → 360°; тізімнен GPU таңдау → камера ұшуы; reset; «Жинау» (бөлшектер орнына, шыны жабылады); «Сапарға оралу» (scroll орны сақталды: 7156 → 7156).
- Мобильді 375×812: exploded bottom sheet, 360° режимі (иконкалы құралдар тақтасы, төменгі панель), горизонталь скролл жоқ.
- Production `vite preview`: консольде қате жоқ.
- Бенчмарк: `__vil3d.bench()` (dev) — draw calls, үшбұрыштар, мс/кадр.

## Осы сессияда өзгерген файлдар
- Жаңа: `src/pages/Explorer/*` (ExplorerPage, AnatomyPanel, AnatomyDetails, AnatomyQuiz, AnatomyListView, AnatomyControls, anatomyText + CSS), `src/scenes/HardwareExplorer/*` (AnatomyScene, AnatomyItem, AnatomyCamera, AnatomyShadows, shadowRequest, layout, placeholders, placeholderModels), `src/data/hardware/anatomy.ts`, `src/store/anatomyStore.ts`, `src/lib/three/materialFx.ts`, `src/scenes/DeskScene/models/useMonitorWallpaper.ts`
- Өзгерген: `src/locales/{kk,ru,en}.json` (`anatomy.*`, `nav.explorer`, `labs.available`), `src/app/router.tsx`, `src/components/layout/{TopBar.tsx,TopBar.module.css}`, `src/pages/Labs/*`, `src/data/camera/cameraStates.ts`, `src/scenes/DeskScene/pc/PCPart.tsx`, `src/scenes/DeskScene/models/HardwareDevices.tsx`
- Көшірілген: `scenes/DeskScene/pc/Hotspot.module.css` → `components/3d/Hotspot.module.css`
- Құжаттар: PROJECT_STATE, ROADMAP, TODO, KNOWN_ISSUES, CHANGELOG, ARCHITECTURE

## Іске қосу
```bash
cd D:\informatics-lab
npm install
npm run dev          # http://localhost:5173  (анатомия: /explorer)
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

NEXT_ACTION: Фаза 3.2 — (1) MASTER_PROMPT §11 Virtual PC Assembly Lab: бөлшектерді дұрыс ретпен орнату (сокет → CPU → кулер → RAM → M.2 → плата корпусқа → PSU → GPU → кабельдер), үйлесімділік тексерісі, қате әрекетке түсіндірме, анатомия деректерін (`data/hardware/anatomy.ts`) және hero GLB-лерін қайта қолдану; (2) микрофон, веб-камера, принтер, HDD, желі картасы үшін CC0/CC-BY GLB тауып, `npm run assets:optimize` арқылы қосу (TODO `[PLACEHOLDER]`); (3) Фаза 2 қалдықтары: логотиптер, үстел текстурасы, §50 тексеру.
