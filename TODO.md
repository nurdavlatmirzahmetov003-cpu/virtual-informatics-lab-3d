# TODO

## V2-1 (AUDIT_V2.md нәтижелері бойынша)
- [x] A1: Low-да MSAA (өлшенді: −3…−10 FPS, 70+ қалды)
- [x] A3: тесік торлы материалдарға `alphaToCoverage` (GLB MASK-қа емес — дақ береді)
- [x] T1: anisotropy сапа бойынша (Low 4 / Medium 8 / High–Ultra 16)
- [x] T2/T4: 2K KTX2 `_hd.glb` файлдары жасалды (9 файл, toktx); High-да жақындағанда жүктелетіні тексерілді
- [x] T3/G5: жарық/қараңғы тема, градиенттер, 3D бөлме палитрасы мен exposure
- [ ] Low-да MSAA қалсын ба — пайдаланушы шешімі
- [ ] A2: жұқа қабырғалы (кулер/радиатор) модельдердің LOD1-і — текстура/normal map
## V2-7
- [x] SystemSim логикасы мен тесттері, `/labs/sim`, монитор, аспаптар, дыбыс кодтары, жөндеу тапсырмасы
- [ ] Симуляцияны 3D жұмыс орнымен байланыстыру (Setup Studio-дағы жинақты бірден «қосу»)
- [ ] Жөндеу тапсырмасында бірнеше ақау қатар (жоғары деңгей)

## V2-6
- [x] Жалғау зертханасы: 3 тапсырма, порт маркерлері, сүйреп жалғау, DHCP, Wi-Fi қауіпсіздігі
- [ ] Монитор экраны дұрыс жалғанғанда жанатын болсын (өнім моделінің экран материалы)
- [ ] Моноблокқа Ethernet (PLAN-да айтылған; қазір ноутбук)
- [ ] Перифериялардың өз ұяларын (монитордың HDMI кірісі т.б.) да жалғау

## V2-5b
- [x] Смартфон, планшет, моноблок, 3D-принтер бөлшектеу; принтерде басып шығару; 6 тапсырма; терезе дизайны
- [ ] Лицензиялы модельдер (смартфон, планшет, моноблок, 3D-принтер) — пайдаланушы жүктесе, Blender-де бөлшектерге бөлу
- [ ] Тапсырмаға сәйкестендіру түрі (бөлшекті 3D-де көрсету → қызметін табу) — қосымша идея

## V2-5a
- [x] Бөлшектеу жүйесі (timeline, TeardownPart/Stage/View), жүйелік блок 9 қадам, ноутбук 10 қадам
- [ ] Ноутбуктің лицензиялы моделі (Blender-де бөлшектерге бөлу — `scripts/blender`) — пайдаланушы жүктесе
- [ ] Бөлшекті басқанда 3D-де ерекшелеу (қазір тек белгі мен панель)

## V2-4b
- [ ] Лицензиялы модельдер: роутер, коммутатор, модем, UPS, ноутбук, смартфон, планшет, моноблок, сағат, Raspberry Pi — пайдаланушы жүктейді (ASSET_SOURCING §3)
- [ ] Қуат аймағы: кабельдер қабырғада ғана, ұштарының ашалары жалпы (HDMI/DP/USB пішіні V2-6-да нақтыланады)

## V2-4a
- [x] Ретті көрме (ExhibitTable/DeviceSpot), 36 құрылғыға ақпарат + 360° + тест, каталог, `?device=`
- [ ] Лицензиялы модельдер: принтерлер, сканер, проектор, 3D-принтер, панель, планшет, геймпад, микрофон, веб-камера, флешка, SD, сыртқы диск, CD/DVD, HDD жинағы — пайдаланушы жүктейді (PROJECT_STATE тізімі)
- [x] V2-4b: желі/қуат/мобильді 24 құрылғыға толық мазмұн, тест; modem, wifi_adapter, access_point, nas модельдері
- [ ] 360° көрсеткіште бөлшектерді көрсету (V2-5 бөлшектеу анимацияларымен)

## V2-3
- [x] `/lab`: 9 аймақ, миникарта, ұшу, пернетақта, жалқау аймақтар, басты беттен кіру
- [ ] V2-4: процедуралық [PLACEHOLDER] құрылғыларды ауыстыру (`scenes/LabSpace/zones/techZones.tsx` — принтер, 3D-принтер, проектор, роутер, шкаф, UPS, кабельдер, ноутбук, смартфон, планшет, моноблок, сағат, SBC; HDD — анатомия placeholder)
- [x] Аймақ ішіндегі құрылғыны басу → 360° көрсеткіш (V2-4a/b)
- [ ] Шолуда draw call 246: аймақ жиһазын біріктіру/instancing (қазір FPS жеткілікті)
- [ ] Залға төбе/бағаналар, кіреберіс (визуалды, міндетті емес)

## V2-2 (ASSET_SOURCING.md)
- [x] Жүктеу 1-топ (V2-2a) — 26 GLB (пайдаланушы жүктеді); 28 өнімге жеке модель
- [x] `optimize-assets.mjs`: өнімдер үшін бөлшек/атау сақталатын үш деңгейлі профиль
- [x] V2-2b: ПК бөлшектерінің 2-тобы (18 GLB → 37 өнім) + порт/слот маркерлері
- [ ] NZXT Kraken 240 (AIO) және 3,5″ HDD — CC BY модель табу (қазір процедуралық)
- [ ] Порт маркерлерін әр платаның нақты макетіне дәлдеу (V2-6 кабельдерімен бірге)
- [ ] Corsair 4000D Airflow алдыңғы торы — MASK текстурасы тесік көрсетпейді (тұтас панель)
- [ ] Лицензия: NZXT-стиль корпус (Igor.Jop) — платформа коммерциялық болса ауыстыру/сатып алу
- [ ] Creative Pebble — сфералық пішінді Blender-де жасау (қазір сателлит қорап)
- [ ] Razer Huntsman TKL мен Logitech PRO X TKL бір негізде (түсі мен биіктігі ғана бөлек) — бөлек модель табу

- [x] PC Assembly Lab: 3D drag/snap + ghost ұяшық + keyboard, order/compatibility, boot/grade
- [x] Progress core: versioned local persistence, best scores, attempts, achievements; AnatomyQuiz connected
- [x] Educational labs: network, 5 algorithms, logic, 8 experiments; 40 assignments/progress percentage
- [x] 2D routes: lazy LoaderOverlay + codeSplitting, Three/r3f бастапқы жүктемеден алынды

## Placeholders (фаза жабылмас бұрын ауыстырылуы тиіс)
Барлығы `src/scenes/DeskScene/models/` ішінде, нақты өлшемдермен процедуралық түрде жасалған (BoxGeometry емес: extrude/lathe/деформацияланған сфера, InstancedMesh). §50 бойынша Hero жабылмас бұрын лицензиясы таза, оңтайландырылған GLB-ге ауыстырылуы тиіс:

- [PLACEHOLDER] Desk model must be replaced — `Desk.tsx` (Poly Haven емен үсті + болат рама)
- [PLACEHOLDER] Desk mat must be replaced — `DeskMat.tsx` (мата текстурасы + тігіс жиегі) — процедуралық нұсқа жеткілікті болуы мүмкін
- [PLACEHOLDER] Артқы корпус желдеткіші — `models/Fan.tsx` (алдыңғы 3 желдеткіш GLB-ге ауыстырылды; артқысы әлі процедуралық)
- [PLACEHOLDER] Құлаққап тұғыры — `models/HardwareDevices.tsx` (құлаққап GLB, тұғыр процедуралық цилиндр)
- [PLACEHOLDER] Room — `Room.tsx` (бетон еден, қабырға, емен slat панель) — архитектура, GLB міндетті емес
- [PLACEHOLDER] `CAMERA_STATES` MOTHERBOARD/CPU/GPU/RAM/SSD/PSU кадрлары қазір қолданылмайды (360° режимі `pc/parts.ts` focusDistance-ті пайдаланады) — Hardware Explorer-де қолдану немесе жою
- [PLACEHOLDER] Microphone model must be replaced — `scenes/HardwareExplorer/placeholders.tsx` (USB үстел микрофоны: салмақты табан, тор бас, LED)
- [PLACEHOLDER] Webcam model must be replaced — `scenes/HardwareExplorer/placeholders.tsx` (1080p клипсті камера, линза, LED)
- [PLACEHOLDER] Printer model must be replaced — `scenes/HardwareExplorer/placeholders.tsx` (сиялы МФУ: сканер қақпағы, қағаз беру/шығару науасы, панель)
- [PLACEHOLDER] HDD model must be replaced — `scenes/HardwareExplorer/placeholders.tsx` (3,5″ 147 × 101,6 × 26,1 мм, щеткаланған қақпақ, жапсырма, SATA)
- [PLACEHOLDER] Network card model must be replaced — `scenes/HardwareExplorer/placeholders.tsx` (PCIe x1 желі картасы: PCB, кронштейн, RJ-45, контроллер радиаторы)
- [PLACEHOLDER] Chair model must be replaced — `scenes/SetupStudio/Chair.tsx` (Setup Studio орындығы: бес жұлдызды табан, газлифт, отырғыш, арқалық, шынтақ тірегі)
- [PLACEHOLDER] Setup Studio: бір санаттағы өнімдер ортақ GLB-ні қолданады (өлшемі өнімнің нақты өлшеміне масштабталады) — әр өнімге жеке GLB (монитор 16:9 / 21:9, TKL / толық пернетақта, AIO кулер, 2.1 колонка)
- [x] Labs беті — барлық модуль жұмыс істейтін сілтемеге айналды

## Фаза 2 — қалғаны
- [x] Лицензиясы тексерілген GLB модельдер (Poly Haven, Sketchfab CC0/CC-BY, Blender) → `ASSET_MANIFEST.md`; `ModelLoader` арқылы `models/*` және `pc/*` компоненттерін ауыстыру (`layout.ts` / `parts.ts` анкерлері сақталады)
- [x] Asset пайплайн: `npm run assets:optimize` (@gltf-transform: Meshopt, WebP 1K, simplify) + `npm run assets:validate`
- [x] `ModelLoader`-ді нақты GLB-мен тексеру (сәтті жолы; қате жолы → процедуралық fallback)
- [x] Draw calls <150: бір өту 46–124 (бұрын ~250–280)
- [x] Монитор / пернетақта / тышқан үшін 360° (құрылғыны басу немесе панельдегі «360° қарау»)
- [ ] Бөлшек панелінде «Тапсырма орындау» батырмасы (§39) — тапсырмалар жүйесімен бірге (Фаза 3/8)
- [ ] Брендтік логотиптерді (MSI, Cooler Master, Lian Li т.б.) текстуралардан алып тастау (Blender/Photoshop) — §6
- [ ] Үстел декоры: Poly Haven `potted_plant_04` (жүктелген, кодта қолданылмайды); үстел бетіне `european_walnut_veneer_04`

## Фаза 3 — Hardware Explorer
- [x] `/explorer` «Компьютер анатомиясы»: 8 сыртқы + 10 ішкі құрылғы, hero GLB-лері қайта қолданылды
- [x] Басу → камера тегіс ұшады, қалғаны күңгірттенеді, ақпарат панелі (үш тілде атау, сипаттама, мақсаты, сипаттамалар, үйлесімділік, 3 сұрақтық тест)
- [x] Мәліметтер `src/data/hardware/anatomy.ts` (құрылым) + `locales/*.json` `anatomy.*` (мәтін)
- [x] 3D-сіз тізім режимі (WebGL жоқ болса автоматты)
- [ ] Микрофон, веб-камера, принтер, HDD, желі картасы үшін лицензиясы таза GLB (Sketchfab CC0/CC-BY) — жоғарыдағы `[PLACEHOLDER]`
- [x] Тест нәтижелерін прогреске сақтау (Фаза 8 grading/progress)
- [x] Virtual PC Assembly Lab (§11) — Фаза 3-тің екінші бөлігі
- [x] Locale-дарды lazy жүктеу — ru/en жеке chunk, тек таңдалғанда (Фаза 9)

## Фаза 4 — Setup Studio
- [x] Каталог `src/data/hardware/catalog.ts`: 15 санат, 65 нақты өнім, ресми сипаттама сілтемесі + тексерілген күн
- [x] Конфигуратор: мақсат → бюджет → стиль → өнімдер → түстер; бюджетке сай ұсыныс (`lib/studio/recommend.ts`)
- [x] Үйлесімділік (`lib/studio/compatibility.ts`): сокет, RAM түрі, плата пішімі, видеокарта ұзындығы, графиканың болуы, БП қуаты, кулер сокеті/биіктігі/радиаторы/жылуы
- [x] Тірі баға, бюджет шкаласы, қуат бағасы; түс конфигураторы (корпус, RGB, үстел беті, перифериялар)
- [x] 360°: орбита, zoom, reset, авто айналу; localStorage `vil3d:setup` v1
- [x] «Сетапты көру» → `/studio/summary` қорытынды беті
- [ ] Қазақстан дүкендеріндегі нақты баға (қазір барлығы «Demo price»)
- [ ] Өнім суреттері (`thumbnail`) — қазір санат иконкасы
- [x] Жүйелік блок ішіндегі GPU ұзындығы, RAM саны, кулер биіктігі және AIO түрі таңдауға бейімделеді; нақты SKU геометриясы кейін
- [ ] Legacy `zertthana_build_v1` жинағын импорттау (id-лар басқа)

## Кейінгі фазалар
- [x] Фаза 5: `/studio/summary` бос үстелден құрастыру киносы, сыртқы/ішкі бөлшектер, жарық/экран, Replay/Skip, толық орбита және inside/exploded
- [x] Фаза 6.1: жергілікті чат ұсынысы (kk/ru/en), бюджет/мақсат/түстер/ASUS 300 Гц/Logitech → үйлесімді каталог ID → 3D
- [x] Фаза 6.2: `server/ai-server.ts` LLM endpoint (Anthropic/OpenAI, кілт тек `.env`-те), құрылымды catalog-only нәтиже, екі жақты валидация, автоматты local fallback
- [x] Фаза 6: `src/services/ai/` (parse/engine/explain/validate/client), бірнеше мақсат, бренд/Гц/4K/RAM/SSD/сымсыз/толық сетап/«...сыз», қазақша түсіндірме, «Setup Studio-ға жүктеу», құрастыру бетіндегі «AI-мен жақсарту» (өзгерістер тізімі), `npm run test:ai`
- [ ] AI: нақты LLM кілтімен соңынан-соңына тексеру (бұл сессияда кілт жоқ — тек mock fetch және кілтсіз 503 тексерілді)
- [ ] AI: Studio-да бірнеше мақсатты сақтау (store-да тек негізгі мақсат бар)
- [x] Ішкі SKU бейімдеу: GPU ұзындығы, RAM саны, air/AIO кулер; барлық модель әр брендке дәл емес
- [x] Фаза 3.2: оқушы өзі жинайтын PC Assembly Lab + бағалау және progress persistence
- [x] Фаза 7: network/algorithms/logic/experiments, kk/ru/en, автоматты бағалау
- [x] Фаза 8 негізгі функциялары: 40 assignment, best scores/history/achievements/progress percentage
- [x] Фаза 7.1: «Зертханалар» хабы (9 премиум карточка, Ашық/Бета/Жақында, прогресс); Network Lab `src/labs/NetworkLab/` + `pages/Labs/NetworkLab/` (сүйреп әкелу, порт→порт кабель, IP/mask/gateway/DNS, router порттары, PING анимациясы, тоқтаған жер/себеп); `src/services/grading/` + `GradeReportCard`; `npm run test:network` (12), `test:grading` (3)
- [x] Фаза 7.2: Алгоритм визуализациясы — `src/labs/AlgorithmLab/` (6 алгоритм, step snapshots, 3 seed-генерацияланатын тапсырма) + `pages/Labs/AlgorithmLab/`; `npm run test:algorithms` (10)
- [x] Фаза 7.3: Логикалық схемалар — `src/labs/LogicLab/` (симуляция, цикл, талдау, ақиқат кестесі, өрнек, 4 тапсырма) + `pages/Labs/LogicLab/` (ANSI гейттер); `npm run test:logic` (10)
- [x] Фаза 7.4: Компьютерді виртуалды жинау — `src/labs/AssemblyLab/` + `scenes/AssemblyLab/` + `pages/Labs/AssemblyLab/`, `store/assemblyLabStore.ts`, `lib/audio/sfx.ts`; `npm run test:pc-lab` (6)
- [x] Фаза 7.5: Виртуалды тәжірибелер — `src/labs/Experiments/` (9 модель + `quiz.ts`) + `pages/Labs/ExperimentLab/` (lazy), `npm run test:experiments` (10); ескі `ExperimentsPage`, `lib/labs/experiments.ts`, `useEducationText`, `ExerciseResult` алынды
- [x] Фаза 8: бағалау және прогресс — `services/progress` (catalog, records, migrate v1/v2→v3, summary, achievements, transfer, repository), `store/progressStore.ts`, `pages/Tasks/`, `pages/Progress/` (ActivityChart, DataPanel), `components/achievements/AchievementToaster`; Hardware Explorer тесті `services/grading`-ке көшті; `npm run test:progress` (12), `test:grading` (4)
- [x] Ескі прототип прогресі (`vlab_progress_v1`) мен v1/v2 деректерін импорттау
- [ ] Supabase/PostgreSQL `ProgressRepository` (сервер + auth; кілт тек серверде)
- [ ] Мұғалім режимі: бірнеше оқушының экспорт файлын бір кестеге жинау
- [x] Фаза 9: оптимизация — адаптивті текстуралар, `_lod1` + screen-size LOD, Low/телефон light сахна, hero first, reference counting dispose, контекст жоғалуы, `scripts/perf-measure.mjs`
- [ ] KTX2: UASTC (GPU жады −75 %, жүктеу ×3–4) немесе ETC1S (сапа төмен) — пайдаланушымен шешу
- [ ] Фаза 10: QA (Firefox/Safari/нақты телефон, a11y, e2e)
- [ ] [PLACEHOLDER] Assembly Lab cable bundle must be replaced — `scenes/AssemblyLab/props.tsx` `CableBundle` (процедуралық орам: 24-pin, 8-pin, SATA)
- [ ] [PLACEHOLDER] Assembly Lab 3.5″ HDD — `scenes/HardwareExplorer/placeholders.tsx` `Hdd` қайта қолданылады (анатомиядағы HDD placeholder-імен бірге ауыстыру)
- [ ] Assembly Lab: термопаста жағу анимациясы, бұрандалар, кабельдерді жеке-жеке жалғау; телефонда үлкенірек бөлшек белгілері
- [ ] Logic Lab: схеманы сақтау/жүктеу; триггерлер (SR/D) және уақыт диаграммасы; half/full adder тапсырмалары
- [ ] Algorithm Lab: ең қысқа жол (Dijkstra/BFS) визуализациясы (§22 «if appropriate»); quick sort / merge sort; рекурсия ағашы (fib)
- [ ] Network Lab: жұмыс күйін (draft) сақтау; бірнеше router + статикалық маршрут; «Интернет» бұлты; undo
- [ ] Network Lab: телефонда тақта кішкентай — zoom/pan немесе «планшет/десктоп ұсынылады» ескертуі
- [ ] Дыбыс: store-да бар, UI тумблері дыбыс эффектілерімен бірге
- [ ] Reduced-motion қолмен ауыстырғышы (қазір тек жүйе баптауы)
- [x] README: скриншоттар, hardware/assignment/translation қосу нұсқаулары
- [ ] Legacy `vlab_progress_v1` / `zertthana_build_v1` деректерін импорттау (Фаза 4/8)
- [ ] Vitest: i18n, quality detect, storage migrate, story timeline chapter boundaries
