# CHANGELOG

## 0.19.0 — 2026-10-10 — V2-1: Көрнекі сапа және жарқын стиль
- **Антиалиасинг**
  - Low-да MSAA.
  - High/Ultra-да MSAA + SMAA (`SMAA` post chain-нің соңында, tone mapping-тен кейін).
  - High DPR ≤ 2.
  - Пресеттерге `smaa`, `anisotropy`, `hdTextures` өрістері қосылды.
- **Текстуралар**
  - anisotropy: GLB-ге (`tuneTreeTextures`), үстел мен еденге (`useSceneTextures(..., anisotropy)`).
  - Тор материалдарына `alphaToCoverage`.
- **2K close-up**
  - `HD_MODELS` / `hdFile()` (`modelUrls.ts`).
  - `ModelLoader` → `HdTextures`: экранда > 380 px болғанда, тек High/Ultra-да, тек текстураларды ауыстырады; өз ErrorBoundary/Suspense-і бар.
  - `optimize-assets.mjs`: toktx бар болса `<name>_hd.glb` жасайды — ≤ 2048 px адаптивті, UASTC, Zstd 18, mipmap, түс sRGB / деректер linear, `KHR_texture_basisu`.
  - toktx жоқ болса бұл қадам өткізіледі, шығыс файлдары бит-бит бірдей.
- **Тема**
  - `lib/theme` (dark/light/system, `SCENE_PALETTES`), `useTheme` / `useScenePalette`, `ThemeToggle` (TopBar).
  - `data-theme` html-де бірінші кадрға дейін қойылады; settings storage v2 (`theme`, миграция).
  - `tokens.css`: жаңартылған қараңғы тема + жарық тема, градиенттер (`--gradient-page/accent/panel`), арна токендері; ~210 тікелей түс токенге ауыстырылды.
  - Жарық темаға түзетілгендер: лаб акценттері (`--x-accent`, `--c-found`, `--l-on`), Network Lab тақталары, AssemblyLab 3D белгілері, анатомия кеңесі.
- **3D**
  - `EnvironmentLighting`: тема градиенті фон (CanvasTexture), тұман, exposure, IBL күшейтуі.
  - `Room`: палитра түстері.
  - Setup Studio жинау жарығы: `envBoost`.
- **Құралдар:** `perf-measure.mjs --theme=`; `npm run test:visual` — тема циклі, HD тізімі скриптпен сәйкестігі, пресет инварианттары, екі теманың контрасты ≥ 4.5:1.
- **Өлшем:** Medium баяулаған жоқ (басты бет 69 → 73 FPS); Low −3…−10 FPS (MSAA, 70+ қалды). Толық кесте — PROJECT_STATE.md.

## 0.18.0 — 2026-10-10 — V2-0: Аудит, құрылғылар каталогы, ассет жоспары
- `AUDIT_V2.md`: 4 бет × Low/Medium/High өлшемі (Intel UHD), 12 скриншот + 3 үлкейтілген салыстыру (`docs/audit-v2/`), 15 GLB-нің үшбұрыш/текстура/GPU жады кестесі, тісті жиектер (Low-да AA жоқ; alphaTest тор; жұқа қабырғалар), бұлдыр текстуралар (GLB anisotropy = 1, 1024 px шегі, Low 512 px), V2 бюджеттері.
- `DEVICE_CATALOG.md`: 60 құрылғы (ПК ішкі 12, жад 9, енгізу 7, шығару 7, желі 9, мобильді/басқа 11, кабель 5), 7 зертхана зонасы, kk/ru/en атаулары, оқушы/ересек түсіндірмесі, бөлшектеу (15 толық, 27 қарапайым), порттар (`port_<type>` кілттері), quiz тақырыптары.
- `ASSET_SOURCING.md`: әр құрылғы мен каталогтың 67 өнімі үшін көз (Sketchfab public API арқылы ізделді, 154 үміткердің лицензиясы бір-бірлеп қайта тексерілді — барлығы CC BY 4.0 / CC0), Poly Haven CC0 жиһаз (16), бір санаттағы брендтерді ажырату жоспары, 73 модельді жүктеу тізімі (4 топ), Blender-де жасалатындар, ақылы нұсқалар бағасымен (ұсыныс: әзірге ештеңе сатып алмау).
- Blender 5.1 headless пайплайны `scripts/blender/`: `pipeline.py` (import → тазалау → бөлшектерге бөлу → өлшемге келтіру → teardown extras → порт маркерлері → LOD1 → GLB + есеп + превью), `configs/gpu_triple_fan.json` (MSI RTX 3080: 9 бөлшек, 8 порт, 4 логотип алынды, 48k → 23k LOD1, веб-өлшемі 0.53 MB), `verify-glb.mjs`, `run.mjs`; `npm run blender:pipeline`, `npm run test:blender` (4 тест, `npm test` ішінде). Сайт коды өзгермеді.

## 0.17.0 — 2026-10-07 — Фаза 9: Оптимизация
- Өлшеу: `scripts/perf-measure.mjs` — headless Chrome (нақты GPU) + DevTools Protocol: түрі бойынша жүктеу, дайын болғанша байттар, ready / бірінші кадр, draw calls, үшбұрыш, мс/кадр, rAF FPS, GPU текстура жады, JS heap, шейдер бағдарламалары, рендерер күйі; `--quality`, `--mobile`, `--throttle`, `--profile`, `--profile-load`, `--shots`, `--fail`, `--no-webgl`, `--lose-context`, `--leave`. `?debug` production-да да `__vil3d` (оқу ғана): `ready`, `bench`, `memory`, `state`, `lod`.
- Ассеттер: адаптивті текстура өлшемі (PSNR ≥ 45 дБ — тұрақты/тегіс карталар кішірейеді), `_lod1.glb` (6 модель: монитор 77k → 23k, кулер 62k → 20k, құлаққап 58k → 17k, плата 35k → 16k, колонкалар 42k → 15k, тышқан 18k → 7k △; ≤ 256 px текстура), колонкалар бір `speakers.glb` (16 MB GPU жады үнемі), `wood_nor`/`floor_rough` WebP, 512 px үстел/еден нұсқалары; қолданылмаған 2K HDR, Poly Haven текстуралары мен өсімдік `assets-src/library/`-ге (build 35.5 → 16.4 MB).
- Жүктеу: ru/en сөздіктері жеке chunk (бастапқы JS 238 → 154 KB gzip); hero first (`deferDetail`); `lib/three/assetCache.ts` — модель/текстура/HDRI reference counting, 2 с кейін толық dispose (ImageBitmap-пен) және кэштен шығару.
- Рендеринг: `ModelLoader` — `file.glb#node`, экрандағы өлшем бойынша LOD (< 90 px), Low-да тек light модельдер және `maxTextureSize` (512) шектеуі; телефондар авто Low; production-да `checkShaderErrors = false`; WebGL контексті жоғалғанда хабарлама + қалпына келу; Vite preload-helper `react` тобында (react ⇄ useT циклі болмасын).
- Instancing тексерілді және алынды (желдеткіштер/RAM): +7 шейдер бағдарламасы, айналатын роторларда GPU тоқтауы (74 → 54 FPS).

## 0.16.0 — 2026-10-05 — Фаза 8: Бағалау және прогресс
- Біртұтас бағалау: барлық зертхана `services/grading` арқылы, Hardware Explorer-дің 18 құрылғы тесті де (`makeChoiceQuiz` — тәжірибелермен ортақ, `data/hardware/anatomyQuiz.ts`). Ескі `lib/labs/assessment.ts`, `toAssessment`, `data/labs/exercises.ts`, `useLabText` алынды. `GradeReportCard` → `compact` режим.
- `services/progress/` (React-сыз, тестіленген): `catalog.ts` (6 зертхана, 39 тапсырма, оқу реті; нақты `Exercise`-термен тест арқылы салыстырылады), `records.ts` (әрекет → ең жақсы нәтиже: пайыз → орындалған → аз кеңес → аз қате → жылдам; әрекет саны, алғаш орындалған әрекет нөмірі; merge), `migrate.ts` (v1/v2 → v3, жарамсыз жазбалар бір-бірден алынады; ескі 70 % өту белгісі сақталады; прототиптің `vlab_progress_v1`), `summary.ts` (күйлер, зертханалар, жалпы ұпай, орташа, келесі ұсыныс, 14 күндік белсенділік), `achievements.ts` (14 жетістік, current/target), `transfer.ts` (JSON экспорт + мұғалімге оқылатын қорытынды, импорт тексерісі ≤ 2 МБ), `repository.ts` (`ProgressRepository` интерфейсі — localStorage қазір, Supabase/PostgreSQL кейін; жаңартудан бұрын `vil3d:progress:backup-v<n>`, оқылмаған деректер `:corrupt`-қа; басқа қойындыдағы өзгерістер).
- `store/progressStore.ts`: `record(report)`, `importSnapshot`, `reset`, жетістік хабарламалар кезегі, `useProgressSummary()`.
- «Тапсырмалар» (`/assignments`): келесі ұсынылатын тапсырма (себебімен), жалпы прогресс, күй мен зертхана сүзгілері (URL-да), зертхана бойынша топтар, әр тапсырманың күйі/ең жақсы ұпайы/әрекет саны.
- «Менің нәтижелерім» (`/progress`): орындалған зертханалар, орташа ұпай, жалпы ұпай, прогресс %; зертханалар жолақтары; соңғы 14 күн (бір серия, hover tooltip, экран оқитын кесте); 14 жетістік (ашылмағаны күңгірт + шарты + прогресі); соңғы 12 әрекет; JSON экспорт/импорт (растаумен, біріктіру), «Прогрессті тазалау» (растаумен).
- Жетістіктер: Алғашқы қадам, Алғашқы компьютер, Perfect Build, Жабдық сарапшысы, Желі шебері, Алгоритм зерттеуші, Логика инженері, Тәжірибе зерттеушісі, 100% зертхана, Өз күшімен, Табанды, Жан-жақты, Жарты жол, Зертхана түлегі. Ашылғанда — шағын алтын түсті хабарлама (6 с, hover-де тоқтайды, reduced-motion-да тек fade).
- Тесттер: `npm run test:progress` (12: каталог ↔ нақты тапсырмалар, locale кілттері, ең жақсы нәтиже, v1/v2/v3 миграция, repository backup/corrupt/прототип, ұсыныс, белсенділік, жетістіктер, экспорт/импорт, store), `test:grading` (+ choice quiz).

## 0.15.0 — 2026-10-05 — Фаза 7.5: Виртуалды тәжірибелер
- `src/labs/Experiments/` (UI-сыз, таза функциялар): `cpuTemp` (жылу кедергісі × қуат + уақыт тұрақтысы, Tjmax 95 °C, троттлингте жиілік/өнімділік төмендейді; боксты/мұнара/су), `memory` (ОЖ 3 ГБ + 8 бағдарлама, 8/16/32 ГБ, своп көлемі, RAM ~100 нс vs SSD ~100 мкс), `storage` (HDD ~160, SATA ~530, NVMe 3.0 ~3500, NVMe 4.0 ~7000 МБ/с; ұсақ файлдарда әлдеқайда баяу), `latency` (талшықта 200 км/мс, маршрут ×1,3, маршрутизатор кешігуі, Wi-Fi/мобильді/спутник қатынасы), `binary` (UTF-8: латын 1 байт, кирилл 2 байт, жіберу уақыты), `cpuCycle` (аккумуляторлы машина LOAD/ADD|SUB/STORE/HALT, әр кезеңнің snapshot-ы), `rgb` (HEX, жарықтық, түс атауы, 16 777 216 түс), `resolution` (PPI, пиксель қадамы, мегапиксель, 5 мм аймақтағы «A» растры), `refresh` (кадр уақыты, кадр секірісі, көрсетілетін позиция). `quiz.ts` — сұрақтар → `Exercise<QuizWork>` (4+3+3 ұпай, қате жауапқа «неге»).
- UI `/labs/experiments?exp=…` (ескі `?task=` жұмыс істейді): 9 қойынды, әр тәжірибе жеке lazy chunk (2,9–5,9 KB). Әрқайсысында кіріспе, интерактивті бөлік (сырғытпалар, графиктер, жарыс анимациясы, пакет картасы, биттер сымы, цикл қадамдары, субпиксельдер, пиксель торлары, 60/144/240 Гц жолақтары), қазақша қорытынды, «Бұл — оқу симуляциясы» белгісі, 3 сұрақтық тапсырма (`GradeReportCard`, progress-ке сақталады, орындалғаны қойындыда белгіленеді).
- prefers-reduced-motion: көшіру/биттер бірден соңғы күйге, жаңарту жиілігі — статикалық «строб», тегіс ауысулар өшеді.
- Алынды: `pages/Labs/ExperimentsPage.tsx`, `ExerciseResult.tsx`, `Exercise.module.css`, `lib/labs/experiments.ts`, `hooks/useEducationText.ts`, `scripts/learning.test.mjs`. Барлық мәтін `experiments.*` (kk/ru/en). Хабта «Виртуалды тәжірибелер» — «Ашық».
- `npm run test:experiments` (10).

## 0.14.0 — 2026-10-04 — Фаза 7.4: Компьютерді виртуалды жинау
- `src/labs/AssemblyLab/` (UI-сыз): 11 қадам (аналық плата төсенішке → процессор → термопаста/кулер → RAM → NVMe → плата корпусқа → БП → видеокарта → қосымша диск → вентиляторлар → кабельдер), тәуелділік ережелері (қатаң рет емес — физикалық мүмкін рет рұқсат), `place()` → орнатылды / рет қатесі / қате слот / жай қайтты, `nextStep()`, `ASSEMBLY_EXERCISE` (толықтық 5, рет 3, слот 2; кеңес −1, ең көбі −3; толық жиналса «Орындалды»).
- `services/grading`: міндетті емес `isComplete` (зертхана «орындалды» шартын өзі анықтай алады); `GradeReportCard` — «Орындалды, бірақ қателер ұпайды азайтты» мәтіні.
- 3D `scenes/AssemblyLab/`: антистатикалық төсеніш, жарқыраған тұғырлардағы бөлшектер, бұрынғы лицензиялы GLB модельдер қайта қолданылды; аналық плата төсеніште жатып жиналады, сосын бүкіл жинақ корпусқа көшеді; камераға қараған жазықтықта сүйреу (window-тыңдаушылар, курсор нүктесі бойынша шешім), жақындағанда мөлдір елес «Осында орнат / Жібер», тегіс отыру, жасыл/қызыл жарқыл; ПК қосылғанда вентиляторлар айналады, RGB жанады, камера корпусқа бұрылады; on-demand көлеңке.
- UI: 11 қадам тізімі (төсеніште / корпуста), қазақша түсіндірме (мыс. «Видеокарта PCIe x16 слотына орнатылады», «Алдымен процессорды орнату керек, кулер соның үстіне қойылады»), «Кеңес: келесі қадам (−1)» (бір қадамға бір рет есептеледі), дыбыс ауыстырғышы (WebAudio, файлсыз), таймер сахна жүктелгеннен кейін басталады, нәтиже картасы.
- Ескі `PcAssemblyPage`, `PcLabScene`, `pcLabStore`, `lib/labs/pcAssembly.ts` алынды. `npm run test:pc-lab` → `scripts/assembly-lab.test.mjs` (6).

## 0.13.0 — 2026-10-04 — Фаза 7.3: Логикалық схемалар
- `src/labs/LogicLab/` (UI-сыз): `circuit.ts` (гейт қосу/жою/жылжыту, сым: бір кіріске бір сигнал, ескісі ауыстырылады, бос кірісті өзі таңдау), `simulate.ts` (мәндер, Tarjan арқылы тұйық цикл, ашық кірістер, қолданылмаған гейттер, ақиқат кестесі, Буль өрнегі), `tasks.ts` (4 тапсырма `Exercise<Circuit>`).
- UI `/labs/logic`: ANSI пішінді AND/OR/NOT/XOR/NAND/NOR (OR — қисық арқа, XOR — қосымша доға, инверсия — шеңбер), палитрадан сүйреу/басу, шығыс → кіріс сым (сүйреу немесе басу), сым мен гейтті таңдап ✕/Delete, A/B/C 0/1 ауыстырғыштары, LED, 1 сигналы бар сымдар жарқырайды (0 — күңгірт, анықталмаған — үзік қызыл), «Сенің схемаң: Y = …», қазақша ескертулер (цикл, бос кіріс, Y қосылмаған, қолданылмаған гейт), ақиқат кестесі (қазіргі жол ерекшеленеді, жолды бассаң кірістер қойылады).
- Тапсырмалар: «Y = A AND B», «Y = NOT(A) OR B», «A XOR B — тек AND, OR, NOT», «Ақиқат кестесіне сәйкес схема» (3 кіріс, көпшілік функциясы). Бағалау барлық комбинация бойынша мінез-құлықты салыстырады; қате комбинациялар «A = 0, B = 1: күтілген Y = 0, сенің схемаң Y = 1» түрінде шығады.
- Ескі `lib/labs/logic.ts`, `LogicPage.tsx` алынды (`logic:and`, `logic:notOr` нәтижелері сақталады). Хабта «Логикалық схемалар» — «Ашық».
- `npm run test:logic` (10).

## 0.12.0 — 2026-10-04 — Фаза 7.2: Алгоритм визуализациясы
- `src/labs/AlgorithmLab/` (UI-сыз): сызықтық және екілік іздеу (сұрыпталмаған массив алдымен сұрыпталады — бұл түсіндіріледі), bubble (ерте тоқтаумен), selection, insertion sort, рекурсия — fact(n) шақырулар стегімен. Әр алгоритм алдын ала immutable step snapshots жасайды: массив (тұрақты id), белгілер, көрсеткіштер, айнымалылар (өзгергендері белгіленеді), есептегіштер, псевдокод жолы, түсініктеме кілті.
- UI `/labs/algorithms`: 6 алгоритм карточкасы, тегіс ауысатын бағандар, түстер легендасы, псевдокод (kk/ru/en), тірі айнымалылар, салыстыру/ауыстыру (рекурсияда шақыру/тереңдік), «Не болып жатыр және неге?», өз массиві / кездейсоқ / іздейтін сан / n, Ойнату · Тоқтату · Алға · Артқа · Жылдамдық (0.5–3×) · Қалпына келтіру · уақыт сызығы · Space/←/→.
- 3 шағын тапсырма (seed бойынша генерацияланады, `services/grading`): «Келесі қай элементтер орын ауыстырады?», «Екілік іздеу неше қадамда табады?», «Bubble sort-тың 1-өтуінен кейінгі массив». Ұпай /10, кеңестер, қате жауапқа түсініктеме, progress-ке сақталады.
- Ескі `lib/labs/algorithms.ts`, `AlgorithmsPage.tsx` алынды; `?task=bubble` сілтемелері жұмыс істейді. Хабта «Алгоритм визуализациясы» — «Ашық».
- `npm run test:algorithms` (10 тест: 200+ массивте сұрыптау/іздеу дұрыстығы, иммутабельділік, формулалар, рекурсия стегі, тапсырмалар).

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
