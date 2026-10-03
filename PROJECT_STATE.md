# PROJECT STATE — Virtual Informatics Lab 3D

Жаңартылды: 2026-10-04
**Ағымдағы фаза: 3.2, 5, 6 және 7 функционалды дайын. Фаза 8: 40 тапсырма, ортақ бағалау, прогресс/жетістіктер дайын; legacy импорты ашық. Келесі — реализмді аяқтау және Фаза 9/10 оптимизация/QA.**

> Жаңа сессия басталғанда: алдымен осы файлды, `ROADMAP.md`, `TODO.md`, `ARCHITECTURE.md` оқы, содан кейін төмендегі `NEXT_ACTION`-нан жалғастыр. Жобаны нөлден бастама.

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
- Тексерулер: 22 автоматты тест, production build, lint. Chromium: LAN 100/PING, duplicate IP, AND 100/ақиқат кестесі, bubble autoplay/step 100, 300 Гц тәжірибесі 100, 40 сілтеме/монитор quiz, progress 6/40=15% және reload persist. Скриншоттар мен шектеулер: `docs/SESSION_2026-10-04_LEARNING.md`.

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

NEXT_ACTION: Дайын модульдерді қайта жасама. Алдымен Фаза 9/10 және реализм: қалған 5 anatomy/орындық модельдерін лицензиясы таза GLB-ге ауыстыру; ең қажет SKU-ларға жеке модель/текстура; KTX2 және Low LOD; Firefox/Safari/нақты touch QA. Legacy деректерін тек импорт ретінде, жаңа persist-ті өшірмей енгіз. AI кілтін браузерге берме; жергілікті көмекші жұмыс істейді. D:/informatics-lab, production preview :4180, dev :5180. Нөлден бастама.
